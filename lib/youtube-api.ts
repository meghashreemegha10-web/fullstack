import { google } from 'googleapis';
import { YoutubeTranscript } from 'youtube-transcript';
import { fetchSupadataTranscript, TranscriptResult } from './supadata';

/**
 * Fetch YouTube video title + channel name using the YouTube Data API.
 * Only needs an API key (no OAuth). Returns undefined values if it fails.
 */
export async function fetchVideoMetadata(videoId: string): Promise<{ title?: string; channelTitle?: string }> {
    const apiKey = process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) return {};

    try {
        const res = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${encodeURIComponent(videoId)}&key=${encodeURIComponent(apiKey)}`,
            { signal: AbortSignal.timeout(8_000) }
        );
        if (!res.ok) return {};
        const json = await res.json();
        const snippet = json?.items?.[0]?.snippet;
        return {
            title: snippet?.title,
            channelTitle: snippet?.channelTitle,
        };
    } catch {
        return {};
    }
}

/**
 * Fetch YouTube transcript using a 3-tier hybrid approach:
 * 1. Supadata API        — Best for all videos (including restricted / music)
 * 2. youtube-transcript  — Fastest but fails on restricted content
 * 3. YouTube Data API    — OAuth/Key fallback for owned videos
 *
 * Also fetches video metadata in parallel for richer AI context.
 * Returns { transcript, title, channelTitle }
 */
export async function fetchYouTubeTranscriptAPI(videoId: string): Promise<TranscriptResult & { channelTitle?: string }> {
    const errors: string[] = [];

    // Fetch video metadata in parallel (non-blocking — we don't wait for it to start transcript fetch)
    const metadataPromise = fetchVideoMetadata(videoId);

    // ─── Strategy 1: Supadata API (primary) ───────────────────────────────────
    try {
        console.log(`[Transcript] 1. Trying Supadata API for: ${videoId}`);
        const result = await fetchSupadataTranscript(videoId);
        const meta = await metadataPromise;

        // Prefer YouTube API title (more reliable/complete) over Supadata title
        return {
            transcript: result.transcript,
            title: meta.title || result.title,
            channelTitle: meta.channelTitle,
            lang: result.lang,
        };
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
            const transcript = items.map(t => t.text).join(' ');
            console.log(`[Transcript] ✅ Scraper succeeded (${transcript.length} chars)`);
            const meta = await metadataPromise;
            return { transcript, title: meta.title, channelTitle: meta.channelTitle };
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
            const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
            oauth2Client.setCredentials({ refresh_token: refreshToken });
            auth = oauth2Client;
        }

        const youtube = google.youtube({ version: 'v3', auth });
        const captionsResponse = await youtube.captions.list({ part: ['snippet'], videoId });
        const captions = captionsResponse.data.items;
        if (!captions || captions.length === 0) throw new Error('No captions found via YouTube Data API');

        let track = captions.find(c => c.snippet?.language?.startsWith('en') && c.snippet.trackKind !== 'ASR');
        if (!track) track = captions.find(c => c.snippet?.language?.startsWith('en'));
        if (!track) track = captions[0];

        let response: any;
        try {
            response = await youtube.captions.download({ id: track.id!, tfmt: 't3' }, { responseType: 'arraybuffer' });
        } catch {
            response = await youtube.captions.download({ id: track.id!, tfmt: 'vtt' }, { responseType: 'arraybuffer' });
        }

        const transcript = parseCaption(Buffer.from(response.data as any).toString('utf-8'));
        if (!transcript) throw new Error('Empty transcript downloaded from API');

        console.log(`[Transcript] ✅ YouTube Data API succeeded (${transcript.length} chars)`);
        const meta = await metadataPromise;
        return { transcript, title: meta.title, channelTitle: meta.channelTitle };

    } catch (err: any) {
        const msg = err?.message ?? String(err);
        console.error(`[Transcript] ❌ YouTube Data API failed: ${msg}`);
        errors.push(`YouTube API: ${msg}`);
    }

    throw new Error(`Could not fetch transcript after 3 attempts:\n` + errors.join('\n'));
}

// ─── Caption parsers ─────────────────────────────────────────────────────────

function parseCaption(content: string): string {
    if (content.startsWith('WEBVTT')) return parseVTT(content);
    let text = content.replace(/<[^>]*>/g, ' ');
    text = text
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    return text.replace(/\s+/g, ' ').trim();
}

function parseVTT(content: string): string {
    return content.split('\n').map(l => l.trim())
        .filter(l => l !== 'WEBVTT' && l && !l.includes('-->'))
        .join(' ').trim();
}

/**
 * Extract video ID from ANY YouTube URL format:
 * https://www.youtube.com/watch?v=ID, youtu.be/ID, m.youtube.com/...,
 * music.youtube.com/..., youtube.com/shorts/ID, or raw 11-char ID
 */
export function extractVideoId(url: string): string | null {
    try {
        url = url.trim();
        if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;

        if (!/^https?:\/\//i.test(url)) url = "https://" + url;

        let parsed: URL;
        try { parsed = new URL(url); } catch { return null; }

        const host = parsed.hostname.replace(/^www\./, "").replace(/^m\./, "").replace(/^music\./, "");

        if (host === "youtu.be") {
            const id = parsed.pathname.slice(1).split("/")[0];
            return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
        }

        if (host === "youtube.com") {
            const v = parsed.searchParams.get("v");
            if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
            const pathMatch = parsed.pathname.match(/\/(?:shorts|embed|v)\/([a-zA-Z0-9_-]{11})/);
            if (pathMatch) return pathMatch[1];
        }

        return null;
    } catch {
        return null;
    }
}
