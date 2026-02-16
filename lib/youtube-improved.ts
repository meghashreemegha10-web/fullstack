/**
 * Simple and reliable YouTube transcript fetcher
 * Uses Puppeteer to extract transcripts directly from the page
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

export async function fetchYouTubeTranscript(videoId: string): Promise<string> {
    let browser;
    try {
        console.log(`[YouTube] Fetching transcript for video: ${videoId}`);

        //Launch headless browser
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        });

        const page = await browser.newPage();

        // Set user agent to avoid bot detection
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Navigate to the video
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        console.log(`[YouTube] Navigating to: ${videoUrl}`);
        await page.goto(videoUrl, { waitUntil: 'networkidle2', timeout: 30000 });

        console.log('[YouTube] Extracting captions...');

        // Extract captions directly from the page
        const transcript = await page.evaluate(async () => {
            // Get player response
            const ytInitialPlayerResponse = (window as any).ytInitialPlayerResponse;

            if (!ytInitialPlayerResponse) {
                throw new Error('Could not find player response');
            }

            // Get caption tracks
            const captionTracks = ytInitialPlayerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

            if (!captionTracks || captionTracks.length === 0) {
                throw new Error('No captions available');
            }

            // Find English caption or use first available
            let track = captionTracks.find((t: any) => t.languageCode === 'en' || t.languageCode.startsWith('en'));
            if (!track) {
                track = captionTracks[0];
            }

            // Fetch the caption XML
            const response = await fetch(track.baseUrl);
            const xmlText = await response.text();

            if (!xmlText || xmlText.length === 0) {
                throw new Error('Empty caption response');
            }

            // Parse XML to extract text
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            const textElements = xmlDoc.getElementsByTagName('text');

            if (!textElements || textElements.length === 0) {
                // Try alternative parsing if DOM parsing doesn't work
                const regex = /<text[^>]*>([^<]+)<\/text>/gi;
                const matches = xmlText.matchAll(regex);
                const parts: string[] = [];

                for (const match of matches) {
                    if (match[1]) {
                        let text = match[1]
                            .replace(/&amp;/g, '&')
                            .replace(/&lt;/g, '<')
                            .replace(/&gt;/g, '>')
                            .replace(/&quot;/g, '"')
                            .replace(/&#39;/g, "'")
                            .trim();
                        if (text.length > 0) {
                            parts.push(text);
                        }
                    }
                }

                if (parts.length === 0) {
                    throw new Error('Could not parse captions');
                }

                return parts.join(' ')
            }

            // Extract text from elements
            const transcriptParts: string[] = [];
            for (let i = 0; i < textElements.length; i++) {
                const text = textElements[i].textContent?.trim();
                if (text && text.length > 0) {
                    transcriptParts.push(text);
                }
            }

            return transcriptParts.join(' ');
        });

        if (!transcript || transcript.trim().length === 0) {
            throw new Error('Extracted transcript is empty');
        }

        console.log(`[YouTube] ✅ Successfully fetched ${transcript.length} characters`);
        return transcript;

    } catch (error: any) {
        console.error('[YouTube] Error:', error.message);
        throw new Error(`Failed to fetch transcript: ${error.message}. Make sure the video has captions enabled.`);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

/**
 * Extract video ID from various YouTube URL formats
 */
export function extractVideoId(url: string): string | null {
    try {
        url = url.trim();

        if (url.includes('youtu.be/')) {
            const match = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
            return match ? match[1] : null;
        }

        if (url.includes('youtube.com/watch')) {
            const match = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
            return match ? match[1] : null;
        }

        if (url.includes('youtube.com/embed/')) {
            const match = url.match(/embed\/([a-zA-Z0-9_-]{11})/);
            return match ? match[1] : null;
        }

        if (url.includes('youtube.com/v/')) {
            const match = url.match(/\/v\/([a-zA-Z0-9_-]{11})/);
            return match ? match[1] : null;
        }

        if (url.includes('youtube.com/shorts/')) {
            const match = url.match(/shorts\/([a-zA-Z0-9_-]{11})/);
            return match ? match[1] : null;
        }

        if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
            return url;
        }

        return null;
    } catch (error) {
        console.error('Error extracting video ID:', error);
        return null;
    }
}
