/**
 * Supadata API client for YouTube transcript fetching.
 * Supadata is a dedicated transcript service that works on restricted and
 * music videos that the standard youtube-transcript library often fails on.
 *
 * Docs: https://supadata.ai/documentation
 * Endpoint: GET https://api.supadata.ai/v1/youtube/transcript
 */

const SUPADATA_BASE = "https://api.supadata.ai/v1";

interface SupadataSegment {
    start: number;
    text: string;
    duration?: number;
}

interface SupadataResponse {
    title?: string;
    duration?: number;
    content: SupadataSegment[] | string;
    lang?: string;
}

/**
 * Fetch plain-text transcript from Supadata for a given YouTube video ID.
 * Throws if the API key is missing, the video has no transcript, or the request fails.
 */
export async function fetchSupadataTranscript(videoId: string): Promise<string> {
    const apiKey = process.env.SUPADATA_API_KEY;

    if (!apiKey || apiKey === "your_supadata_key_here") {
        throw new Error("SUPADATA_API_KEY is not configured in environment variables.");
    }

    console.log(`[Supadata] Fetching transcript for videoId: ${videoId}`);

    const url = `${SUPADATA_BASE}/youtube/transcript?videoId=${encodeURIComponent(videoId)}&text=true`;

    const res = await fetch(url, {
        headers: {
            "x-api-key": apiKey,
            "Accept": "application/json",
        },
        // 30 second timeout
        signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.error(`[Supadata] HTTP ${res.status}: ${body}`);
        throw new Error(`Supadata API error: HTTP ${res.status} — ${body || res.statusText}`);
    }

    const data: SupadataResponse = await res.json();

    // Supadata returns content as a plain string when text=true
    if (typeof data.content === "string") {
        if (!data.content.trim()) {
            throw new Error("Supadata returned an empty transcript.");
        }
        console.log(`[Supadata] ✅ Got transcript (${data.content.length} chars)${data.title ? ` for "${data.title}"` : ""}`);
        return data.content;
    }

    // Fallback: content is an array of segments
    if (Array.isArray(data.content) && data.content.length > 0) {
        const text = data.content.map((s) => s.text).join(" ");
        console.log(`[Supadata] ✅ Got transcript from segments (${text.length} chars)`);
        return text;
    }

    throw new Error("Supadata returned no transcript content for this video.");
}
