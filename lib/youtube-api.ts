import { google } from 'googleapis';
import { YoutubeTranscript } from 'youtube-transcript';
import { fetchSupadataTranscript } from './supadata';

/**
 * Fetch YouTube transcript using a 3-tier hybrid approach:
 * 1. Supadata API        — Best for all videos (including restricted / music)
 * 2. youtube-transcript  — Fastest but fails on restricted content
 * 3. YouTube Data API    — OAuth/Key fallback for owned videos
 */
export async function fetchYouTubeTranscriptAPI(videoId: string): Promise<string> {
    const errors: string[] = [];

    // ─── Strategy 1: Supadata API (primary) ───────────────────────────────────
    try {
        console.log(`[Transcript] 1. Trying Supadata API for: ${videoId}`);
        const transcript = await fetchSupadataTranscript(videoId);
        if (transcript) return transcript;
    } catch (err: any) {
        const msg = err?.message ?? String(err);
        console.warn(`[Transcript] ⚠️ Supadata failed: ${msg}`);
        errors.push(`Supadata: ${msg}`);
    }

    // ─── Strategy 2: youtube-transcript scraper ────────────────────────────────
    try {
        console.log(`[Transcript] 2. Trying youtube-transcript scraper for: ${videoId}`);
        const items = await YoutubeTranscript.fetchTranscript(videoId);
        if (items && items.length > 0) {
            const text = items.map(t => t.text).join(' ');
            console.log(`[Transcript] ✅ Scraper succeeded (${text.length} chars)`);
            return text;
        }
        throw new Error('Scraper returned empty transcript');
    } catch (err: any) {
        const msg = err?.message ?? String(err);
        console.warn(`[Transcript] ⚠️ Scraper failed: ${msg}`);
        errors.push(`Scraper: ${msg}`);
    }

    // ─── Strategy 3: YouTube Data API (OAuth / API Key) ───────────────────────
    try {
        console.log(`[Transcript] 3. Trying YouTube Data API for: ${videoId}`);

        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
        const apiKey = process.env.YOUTUBE_API_KEY;

        if (!clientId && !clientSecret && !refreshToken && !apiKey) {
            throw new Error('No YouTube API credentials configured.');
        }

        let auth: any = apiKey;

        if (clientId && clientSecret && refreshToken) {
            console.log('[Transcript] Using OAuth authentication');
            const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
            oauth2Client.setCredentials({ refresh_token: refreshToken });
            auth = oauth2Client;
        }

        const youtube = google.youtube({ version: 'v3', auth });

        const captionsResponse = await youtube.captions.list({
            part: ['snippet'],
            videoId,
        });

        const captions = captionsResponse.data.items;
        if (!captions || captions.length === 0) {
            throw new Error('No captions found via YouTube Data API');
        }

        console.log(`[Transcript] Found ${captions.length} caption tracks`);

        // Prefer manual English, then any English, then whatever's there
        let track = captions.find(c => c.snippet?.language?.startsWith('en') && c.snippet.trackKind !== 'ASR');
        if (!track) track = captions.find(c => c.snippet?.language?.startsWith('en'));
        if (!track) track = captions[0];

        let response: any;
        try {
            response = await youtube.captions.download(
                { id: track.id!, tfmt: 't3' },
                { responseType: 'arraybuffer' }
            );
        } catch {
            console.log('[Transcript] t3 format failed, trying vtt...');
            response = await youtube.captions.download(
                { id: track.id!, tfmt: 'vtt' },
                { responseType: 'arraybuffer' }
            );
        }

        const buffer = Buffer.from(response.data as any);
        const captionText = buffer.toString('utf-8');
        if (!captionText) throw new Error('Empty transcript downloaded from API');

        const transcript = parseCaption(captionText);
        console.log(`[Transcript] ✅ YouTube Data API succeeded (${transcript.length} chars)`);
        return transcript;

    } catch (err: any) {
        const msg = err?.message ?? String(err);
        console.error(`[Transcript] ❌ YouTube Data API failed: ${msg}`);
        errors.push(`YouTube API: ${msg}`);
    }

    throw new Error(
        `Could not fetch transcript after 3 attempts:\n` + errors.join('\n')
    );
}

// ─── Caption parsers ─────────────────────────────────────────────────────────

function parseCaption(content: string): string {
    if (content.startsWith('WEBVTT')) return parseVTT(content);
    let text = content.replace(/<[^>]*>/g, ' ');
    text = text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
    return text.replace(/\s+/g, ' ').trim();
}

function parseVTT(content: string): string {
    return content
        .split('\n')
        .map(l => l.trim())
        .filter(l => l !== 'WEBVTT' && l && !l.includes('-->'))
        .join(' ')
        .trim();
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
