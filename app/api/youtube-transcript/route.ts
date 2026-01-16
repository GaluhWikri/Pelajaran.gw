import { NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript-plus';
import { Innertube } from 'youtubei.js';

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

// Method 1: Use youtube-transcript-plus library
async function fetchWithLibrary(url: string): Promise<string> {
    const transcriptItems = await YoutubeTranscript.fetchTranscript(url, {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    if (!transcriptItems || transcriptItems.length === 0) {
        throw new Error('No transcript found');
    }

    return transcriptItems.map(item => item.text).join(' ');
}

// Method 2: Use youtubei.js (Innertube API - works better on serverless)
async function fetchWithInnertube(videoId: string): Promise<string> {
    const youtube = await Innertube.create({
        retrieve_player: false,
    });

    const info = await youtube.getInfo(videoId);
    const transcriptInfo = await info.getTranscript();

    if (!transcriptInfo || !transcriptInfo.transcript || !transcriptInfo.transcript.content) {
        throw new Error('No transcript available');
    }

    const content = transcriptInfo.transcript.content;

    // Extract text from transcript body
    if (content.body && content.body.initial_segments) {
        const texts = content.body.initial_segments
            .map((segment: any) => segment.snippet?.text || '')
            .filter((text: string) => text.trim() !== '');

        if (texts.length === 0) {
            throw new Error('Transcript is empty');
        }

        return texts.join(' ');
    }

    throw new Error('Could not parse transcript structure');
}

// Method 3: Direct fetch from YouTube timedtext API
async function fetchTranscriptDirect(videoId: string): Promise<string> {
    const videoPageUrl = `https://www.youtube.com/watch?v=${videoId}`;

    const response = await fetch(videoPageUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
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

    let captionUrl = timedtextMatch[0].replace(/\\u0026/g, '&').replace(/\\\//g, '/');

    const transcriptResponse = await fetch(captionUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    if (!transcriptResponse.ok) {
        throw new Error(`Failed to fetch transcript: ${transcriptResponse.status}`);
    }

    const transcriptData = await transcriptResponse.text();

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
        throw new Error('No text found in transcript');
    }

    return texts.join(' ');
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

        // Method 1: youtube-transcript-plus (fast, but may be blocked on serverless)
        try {
            console.log('[YouTube] Method 1: youtube-transcript-plus...');
            transcript = await fetchWithLibrary(url);
            console.log('[YouTube] Method 1 succeeded!');
        } catch (error: any) {
            console.log('[YouTube] Method 1 failed:', error.message);
            errors.push(`Library: ${error.message}`);
        }

        // Method 2: youtubei.js (Innertube - reliable on serverless)
        if (!transcript) {
            try {
                console.log('[YouTube] Method 2: youtubei.js (Innertube)...');
                transcript = await fetchWithInnertube(videoId);
                console.log('[YouTube] Method 2 succeeded!');
            } catch (error: any) {
                console.log('[YouTube] Method 2 failed:', error.message);
                errors.push(`Innertube: ${error.message}`);
            }
        }

        // Method 3: Direct timedtext fetch (last resort)
        if (!transcript) {
            try {
                console.log('[YouTube] Method 3: Direct timedtext fetch...');
                transcript = await fetchTranscriptDirect(videoId);
                console.log('[YouTube] Method 3 succeeded!');
            } catch (error: any) {
                console.log('[YouTube] Method 3 failed:', error.message);
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
