import { NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript-plus';

export async function POST(request: Request) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // Basic validation
        if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
            return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
        }

        console.log(`Fetching transcript for: ${url}`);

        try {
            // Use youtube-transcript-plus with custom User-Agent
            const transcriptItems = await YoutubeTranscript.fetchTranscript(url, {
                // Custom user agent to avoid bot detection
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            if (!transcriptItems || transcriptItems.length === 0) {
                throw new Error("No transcript found");
            }

            console.log(`Found ${transcriptItems.length} transcript items`);

            // Combine all parts into one string
            const fullTranscript = transcriptItems.map(item => item.text).join(' ');

            return NextResponse.json({ transcript: fullTranscript });
        } catch (error: any) {
            console.error("Transcript fetch error:", error.message);

            // Return more detailed error
            return NextResponse.json({
                error: 'Gagal mengambil transkrip. Pastikan video memiliki caption/CC (Closed Captions) yang aktif.',
                details: error.message
            }, { status: 500 });
        }

    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
