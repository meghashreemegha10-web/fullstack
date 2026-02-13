import { YoutubeTranscript } from 'youtube-transcript';
import { fetchTranscriptPuppeteer } from './puppeteer-youtube';

export async function fetchTranscript(videoId: string) {
    try {
        // Attempt 1: Standard library
        console.log(`Trying standard fetch for ${videoId}...`);
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);
        console.log(`[Standard] Fetched ${transcript?.length} lines.`);
        if (!transcript || transcript.length === 0) throw new Error("Empty transcript returned.");
        return transcript.map((t) => t.text).join(' ');
    } catch (error) {
        console.log("Standard transcript fetch failed, attempting Puppeteer fallback...", error);
        try {
            // Attempt 2: Puppeteer Fallback
            const xml = await fetchTranscriptPuppeteer(videoId);
            if (!xml) throw new Error("Puppeteer fallback returned no transcript.");

            // Simple XML parsing
            // Remove tags and decode HTML entities
            const text = xml
                .replace(/<[^>]*>/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&#39;/g, "'")
                .replace(/&quot;/g, '"')
                .replace(/\s+/g, ' ')
                .trim();

            return text;
        } catch (fallbackError) {
            console.error("Puppeteer transcript fetch failed:", fallbackError);
            throw new Error("Could not fetch transcript even with browser fallback. The video might be restricted or require login.");
        }
    }
}
