/**
 * Supadata API client for YouTube transcript fetching.
 * Docs: https://supadata.ai/documentation
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

export interface TranscriptResult {
    transcript: string;
    title?: string;   // Video title from Supadata (if available)
    lang?: string;
}

/**
 * Fetch transcript + metadata from Supadata for a given YouTube video ID.
 * Returns { transcript, title } — throws on failure.
 */
export async function fetchSupadataTranscript(videoId: string): Promise<TranscriptResult> {
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
        signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.error(`[Supadata] HTTP ${res.status}: ${body}`);
        throw new Error(`Supadata API error: HTTP ${res.status} — ${body || res.statusText}`);
    }

    const data: SupadataResponse = await res.json();
    const { title, lang } = data;

    // content is a plain string when text=true
    if (typeof data.content === "string") {
        if (!data.content.trim()) throw new Error("Supadata returned an empty transcript.");
        console.log(`[Supadata] ✅ Got transcript (${data.content.length} chars)${title ? ` for "${title}"` : ""}`);
        return { transcript: data.content, title, lang };
    }

    // Fallback: array of segments
    if (Array.isArray(data.content) && data.content.length > 0) {
        const transcript = data.content.map((s) => s.text).join(" ");
        console.log(`[Supadata] ✅ Got transcript from segments (${transcript.length} chars)`);
        return { transcript, title, lang };
    }

    throw new Error("Supadata returned no transcript content for this video.");
}
