import { google } from 'googleapis';
import { YoutubeTranscript } from 'youtube-transcript';

/**
 * Fetch YouTube transcript using a hybrid approach:
 * 1. Scraper (youtube-transcript) - Best for public videos
 * 2. Official API (OAuth/Key) - Best for owned/official videos
 */
export async function fetchYouTubeTranscriptAPI(videoId: string): Promise<string> {
    let scraperError;

    // Strategy 1: Attempt Scraper (Cheapest & Most likely to work for public videos)
    try {
        console.log(`[YouTube API] 1. Trying scraper for video: ${videoId}`);
        const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);

        if (transcriptItems && transcriptItems.length > 0) {
            const fullText = transcriptItems.map(t => t.text).join(' ');
            console.log(`[YouTube API] ✅ Scraper successful (${fullText.length} chars)`);
            return fullText;
        } else {
            throw new Error('Scraper returned empty transcript');
        }
    } catch (error: any) {
        console.warn(`[YouTube API] ⚠️ Scraper failed: ${error.message}`);
        scraperError = error;
    }

    // Strategy 2: Attempt Official API (OAuth/Key)
    try {
        console.log(`[YouTube API] 2. Trying Official API for video: ${videoId}`);

        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
        const apiKey = process.env.YOUTUBE_API_KEY;

        let auth: any = apiKey;

        // Prefer OAuth if available
        if (clientId && clientSecret && refreshToken) {
            console.log('[YouTube API] Using OAuth authentication');
            const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
            oauth2Client.setCredentials({ refresh_token: refreshToken });
            auth = oauth2Client;
        } else if (!apiKey) {
            // If scraper failed and no API key, we are stuck
            throw new Error(`Scraper failed (${scraperError.message}) and no API credentials configured.`);
        }

        const youtube = google.youtube({ version: 'v3', auth: auth });

        // List captions
        const captionsResponse = await youtube.captions.list({
            part: ['snippet'],
            videoId: videoId,
        });

        const captions = captionsResponse.data.items;
        if (!captions || captions.length === 0) {
            throw new Error('No captions found via Official API');
        }

        console.log(`[YouTube API] Found ${captions.length} tracks via API`);

        // Priority Selection
        let captionTrack = captions.find(c => c.snippet?.language?.startsWith('en') && c.snippet.trackKind !== 'ASR');
        if (!captionTrack) captionTrack = captions.find(c => c.snippet?.language?.startsWith('en'));
        if (!captionTrack) captionTrack = captions[0];

        // Download
        let response;
        try {
            response = await youtube.captions.download({
                id: captionTrack.id!,
                tfmt: 't3'
            }, { responseType: 'arraybuffer' });
        } catch (t3Error) {
            console.log('[YouTube API] t3 failed, trying vtt...');
            response = await youtube.captions.download({
                id: captionTrack.id!,
                tfmt: 'vtt'
            }, { responseType: 'arraybuffer' });
        }

        const buffer = Buffer.from(response.data as any);
        const captionText = buffer.toString('utf-8');

        if (!captionText) throw new Error('Empty transcript downloaded');

        const transcript = parseXML(captionText); // Reuse XML parser
        console.log(`[YouTube API] ✅ Official API successful (${transcript.length} chars)`);
        return transcript;

    } catch (apiError: any) {
        console.error(`[YouTube API] ❌ Official API failed: ${apiError.message}`);

        let errorMsg = 'Could not fetch transcript. ';
        if (apiError.code === 403 || apiError.message.includes('forbidden')) {
            errorMsg += 'Video owner restricts API access. ';
        }

        throw new Error(`${errorMsg} (Scraper error: ${scraperError?.message})`);
    }
}

function parseXML(content: string): string {
    if (content.startsWith('WEBVTT')) return parseVTT(content);
    let text = content.replace(/<[^>]*>/g, ' ');
    text = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    return text.replace(/\s+/g, ' ').trim();
}

function parseVTT(content: string): string {
    return content.split('\n')
        .map(l => l.trim())
        .filter(l => l !== 'WEBVTT' && l && !l.includes('-->'))
        .join(' ').trim();
}

/**
 * Extract video ID from various YouTube URL formats
 */
export function extractVideoId(url: string): string | null {
    try {
        url = url.trim();
        if (url.includes('youtu.be/')) return url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)?.[1] || null;
        if (url.includes('youtube.com/watch')) return url.match(/[?&]v=([a-zA-Z0-9_-]{11})/)?.[1] || null;
        if (url.includes('youtube.com/embed/')) return url.match(/embed\/([a-zA-Z0-9_-]{11})/)?.[1] || null;
        if (url.includes('youtube.com/v/')) return url.match(/\/v\/([a-zA-Z0-9_-]{11})/)?.[1] || null;
        if (url.includes('youtube.com/shorts/')) return url.match(/shorts\/([a-zA-Z0-9_-]{11})/)?.[1] || null;
        if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
        return null;
    } catch {
        return null;
    }
}
