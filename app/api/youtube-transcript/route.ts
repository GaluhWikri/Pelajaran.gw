import { NextResponse } from 'next/server';

// Use Edge Runtime - different IP pool that might not be blocked by YouTube
export const runtime = 'edge';

// Extract video ID from various YouTube URL formats
function extractVideoId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
        /^([a-zA-Z0-9_-]{11})$/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

// Fetch transcript using YouTube's internal API
async function fetchTranscriptFromYouTube(videoId: string): Promise<string> {
    // First, get the video page to extract initial player response
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    const pageResponse = await fetch(videoUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
    });

    if (!pageResponse.ok) {
        throw new Error(`Failed to fetch video page: ${pageResponse.status}`);
    }

    const html = await pageResponse.text();

    // Try to find captions in the player response
    const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
    if (!playerResponseMatch) {
        throw new Error('Could not find player response');
    }

    let playerResponse;
    try {
        playerResponse = JSON.parse(playerResponseMatch[1]);
    } catch {
        throw new Error('Failed to parse player response');
    }

    // Get captions
    const captions = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (!captions || captions.length === 0) {
        throw new Error('No captions available for this video');
    }

    // Get the first available caption (usually auto-generated or primary language)
    const captionTrack = captions[0];
    let captionUrl = captionTrack.baseUrl;

    // Add format parameter for cleaner output
    if (!captionUrl.includes('fmt=')) {
        captionUrl += '&fmt=json3';
    }

    // Fetch the actual transcript
    const transcriptResponse = await fetch(captionUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        }
    });

    if (!transcriptResponse.ok) {
        throw new Error(`Failed to fetch transcript: ${transcriptResponse.status}`);
    }

    const contentType = transcriptResponse.headers.get('content-type') || '';
    const transcriptData = await transcriptResponse.text();

    // Parse based on format
    if (contentType.includes('json') || transcriptData.startsWith('{')) {
        try {
            const json = JSON.parse(transcriptData);
            if (json.events) {
                const texts = json.events
                    .filter((e: any) => e.segs)
                    .map((e: any) => e.segs.map((s: any) => s.utf8 || '').join(''))
                    .filter((t: string) => t.trim());
                return texts.join(' ');
            }
        } catch {
            // Fall through to XML parsing
        }
    }

    // Parse XML format
    const textMatches = transcriptData.matchAll(/<text[^>]*>([^<]*)<\/text>/g);
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
        throw new Error('Could not parse transcript');
    }

    return texts.join(' ');
}

// Alternative: Use a third-party transcript API service
async function fetchFromTranscriptAPI(videoId: string): Promise<string> {
    // Try using a free transcript API
    const apiUrl = `https://yt-transcript-api.vercel.app/api/transcript?videoId=${videoId}`;

    try {
        const response = await fetch(apiUrl, {
            headers: {
                'Accept': 'application/json',
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.transcript) {
                if (Array.isArray(data.transcript)) {
                    return data.transcript.map((t: any) => t.text).join(' ');
                }
                return data.transcript;
            }
        }
    } catch {
        // Silently fail and try next method
    }

    throw new Error('Third-party API failed');
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

        console.log(`[Edge] Fetching transcript for: ${videoId}`);

        let transcript: string | null = null;
        const errors: string[] = [];

        // Method 1: Direct YouTube fetch (Edge Runtime)
        try {
            console.log('[Edge] Method 1: Direct YouTube fetch...');
            transcript = await fetchTranscriptFromYouTube(videoId);
            console.log('[Edge] Method 1 succeeded!');
        } catch (error: any) {
            console.log('[Edge] Method 1 failed:', error.message);
            errors.push(error.message);
        }

        // Method 2: Try third-party API as fallback
        if (!transcript) {
            try {
                console.log('[Edge] Method 2: Third-party API...');
                transcript = await fetchFromTranscriptAPI(videoId);
                console.log('[Edge] Method 2 succeeded!');
            } catch (error: any) {
                console.log('[Edge] Method 2 failed:', error.message);
                errors.push(error.message);
            }
        }

        if (!transcript) {
            return NextResponse.json({
                error: 'Gagal mengambil transkrip. Pastikan video memiliki caption/CC (Closed Captions) yang aktif.',
                details: errors.join('; ')
            }, { status: 500 });
        }

        console.log(`[Edge] Success! (${transcript.length} chars)`);
        return NextResponse.json({ transcript });

    } catch (error: any) {
        console.error('[Edge] Unexpected error:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error.message
        }, { status: 500 });
    }
}
