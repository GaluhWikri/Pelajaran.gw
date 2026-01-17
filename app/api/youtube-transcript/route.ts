import { NextResponse } from 'next/server';

// Use Edge Runtime to bypass YouTube IP blocking on Vercel
export const runtime = 'edge';

// Extract video ID from various YouTube URL formats
function extractVideoId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
        /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

// Parse transcript XML to text
function parseTranscriptXml(xml: string): string {
    const textMatches = xml.matchAll(/<text[^>]*>([^<]*)<\/text>/g);
    const texts: string[] = [];

    for (const match of textMatches) {
        let text = match[1]
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\n/g, ' ')
            .trim();
        if (text) texts.push(text);
    }

    if (texts.length === 0) {
        throw new Error('No text found in transcript');
    }

    return texts.join(' ');
}

// Method 1: Fetch transcript using YouTube's player response (most reliable on Edge)
async function fetchWithPlayerResponse(videoId: string): Promise<string> {
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
            'Cache-Control': 'no-cache',
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch video page: ${response.status}`);
    }

    const html = await response.text();

    // Try to find captions in the player response
    const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});\s*(?:var|const|let|<\/script>)/);
    if (!playerResponseMatch) {
        throw new Error('Could not find player response');
    }

    const playerResponse = JSON.parse(playerResponseMatch[1]);
    const captions = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

    if (!captions || captions.length === 0) {
        throw new Error('No captions available for this video');
    }

    // Prefer Indonesian, English, or auto-generated captions
    const captionTrack = captions.find((c: any) => c.languageCode === 'id') ||
        captions.find((c: any) => c.languageCode === 'en') ||
        captions.find((c: any) => c.kind === 'asr') ||
        captions[0];

    if (!captionTrack?.baseUrl) {
        throw new Error('No caption URL found');
    }

    // Fetch the transcript XML
    const transcriptResponse = await fetch(captionTrack.baseUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        }
    });

    if (!transcriptResponse.ok) {
        throw new Error(`Failed to fetch transcript: ${transcriptResponse.status}`);
    }

    const transcriptXml = await transcriptResponse.text();
    return parseTranscriptXml(transcriptXml);
}

// Method 2: Direct fetch from YouTube timedtext API (fallback)
async function fetchTranscriptDirect(videoId: string): Promise<string> {
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch video page: ${response.status}`);
    }

    const html = await response.text();

    const timedtextMatch = html.match(/https:\/\/www\.youtube\.com\/api\/timedtext[^"\\]+/);
    if (!timedtextMatch) {
        throw new Error('Could not find caption URL');
    }

    const captionUrl = timedtextMatch[0].replace(/\\u0026/g, '&').replace(/\\\//g, '/');

    const transcriptResponse = await fetch(captionUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        }
    });

    if (!transcriptResponse.ok) {
        throw new Error(`Failed to fetch transcript: ${transcriptResponse.status}`);
    }

    const transcriptData = await transcriptResponse.text();
    return parseTranscriptXml(transcriptData);
}

export async function POST(request: Request) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
            return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
        }

        const videoId = extractVideoId(url);
        if (!videoId) {
            return NextResponse.json({ error: 'Could not extract video ID' }, { status: 400 });
        }

        console.log(`[YouTube] Fetching transcript for: ${videoId}`);

        let transcript: string | null = null;
        const errors: string[] = [];

        // Method 1: Player response (most reliable on Edge)
        try {
            console.log('[YouTube] Method 1: Player response...');
            transcript = await fetchWithPlayerResponse(videoId);
            console.log('[YouTube] Method 1 succeeded!');
        } catch (error: any) {
            console.log('[YouTube] Method 1 failed:', error.message);
            errors.push(`PlayerResponse: ${error.message}`);
        }

        // Method 2: Direct timedtext fetch (fallback)
        if (!transcript) {
            try {
                console.log('[YouTube] Method 2: Direct timedtext fetch...');
                transcript = await fetchTranscriptDirect(videoId);
                console.log('[YouTube] Method 2 succeeded!');
            } catch (error: any) {
                console.log('[YouTube] Method 2 failed:', error.message);
                errors.push(`Direct: ${error.message}`);
            }
        }

        if (!transcript) {
            console.error('[YouTube] All methods failed:', errors);
            return NextResponse.json({
                error: 'Gagal mengambil transkrip. Pastikan video memiliki caption/CC (Closed Captions) yang aktif.',
                details: errors.join('; ')
            }, { status: 500 });
        }

        console.log(`[YouTube] Success! (${transcript.length} chars)`);
        return NextResponse.json({ transcript });

    } catch (error: any) {
        console.error('[YouTube] Unexpected error:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error.message
        }, { status: 500 });
    }
}