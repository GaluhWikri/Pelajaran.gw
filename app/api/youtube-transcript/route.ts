import { NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';

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

        try {
            // Strategy: Try multiple language preferences
            // 1. Try default (no config)
            // 2. Try Indonesian ('id')
            // 3. Try English ('en')

            let transcriptItems: any[] = [];

            try {
                console.log(`Attempting default transcript for ${url}`);
                transcriptItems = await YoutubeTranscript.fetchTranscript(url);
                if (!transcriptItems || transcriptItems.length === 0) {
                    throw new Error("Default transcript empty");
                }
            } catch (e) {
                console.log("Default fetch failed or empty, trying 'id' (Indonesian)...");
                try {
                    transcriptItems = await YoutubeTranscript.fetchTranscript(url, { lang: 'id' });
                    if (!transcriptItems || transcriptItems.length === 0) {
                        throw new Error("ID transcript empty");
                    }
                } catch (e2) {
                    console.log("'id' fetch failed, trying 'en' (English)...");
                    try {
                        transcriptItems = await YoutubeTranscript.fetchTranscript(url, { lang: 'en' });
                    } catch (e3) {
                        console.log("'en' fetch failed");
                    }
                }
            }

            if (!transcriptItems || transcriptItems.length === 0) {
                throw new Error("No transcript found in supported languages.");
            }

            // Combine all parts into one string
            const fullTranscript = transcriptItems.map(item => item.text).join(' ');

            return NextResponse.json({ transcript: fullTranscript });
        } catch (error: any) {
            console.error("Final Transcript fetch error:", error.message);
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
