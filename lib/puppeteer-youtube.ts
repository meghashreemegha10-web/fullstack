import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

export async function fetchTranscriptPuppeteer(videoId: string) {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--disable-features=IsolateOrigins,site-per-process'
            ]
        });
        const page = await browser.newPage();

        // Force a standard User Agent to override the default "HeadlessChrome"
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9'
        });

        await page.setViewport({ width: 1280, height: 800 });

        console.log(`[Puppeteer] Navigating to video: ${videoId}`);
        // Networkidle2 helps ensure dynamic content is loaded.
        await page.goto(`https://www.youtube.com/watch?v=${videoId}`, { waitUntil: 'networkidle2', timeout: 30000 });

        console.log("[Puppeteer] Extracting player response...");

        // Extract the player response directly from the window object
        const playerResponse = await page.evaluate(() => {
            return (window as any).ytInitialPlayerResponse ||
                (window as any).ytplayer?.config?.args?.raw_player_response;
        });

        if (!playerResponse) {
            throw new Error("Could not extract playerResponse from page.");
        }

        if (playerResponse.playabilityStatus && playerResponse.playabilityStatus.status === 'ERROR') {
            console.warn(`[Puppeteer] Video unavailable: ${playerResponse.playabilityStatus.reason}`);
            throw new Error(`Video unavailable: ${playerResponse.playabilityStatus.reason}`);
        }

        // Parse captions
        const captions = playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks;

        if (!captions || captions.length === 0) {
            throw new Error("No captions found in playerResponse.");
        }

        console.log(`[Puppeteer] Found ${captions.length} caption tracks.`);
        const englishTrack = captions.find((track: any) => track.languageCode === 'en');

        if (!englishTrack) {
            throw new Error("No English captions found.");
        }

        console.log(`[Puppeteer] Fetching transcript XML from: ${englishTrack.baseUrl}`);

        // Fetch the transcript XML content using the browser context to share cookies/headers
        const fetchResult = await page.evaluate(async (url) => {
            try {
                const response = await fetch(url);
                const text = await response.text();
                return {
                    success: true,
                    status: response.status,
                    textLength: text?.length || 0,
                    text: text
                };
            } catch (e: any) {
                return {
                    success: false,
                    error: e.toString(),
                    text: null
                };
            }
        }, englishTrack.baseUrl);

        console.log(`[Puppeteer] Fetch result - Success: ${fetchResult.success}, Status: ${fetchResult.status}, Length: ${fetchResult.textLength}`);

        if (!fetchResult.success) {
            throw new Error(`Internal fetch failed: ${fetchResult.error}`);
        }

        if (fetchResult.status !== 200) {
            throw new Error(`Internal fetch returned status ${fetchResult.status}`);
        }

        if (!fetchResult.text || fetchResult.text.length === 0) {
            throw new Error(`Internal fetch returned empty content`);
        }

        return fetchResult.text;

    } catch (error) {
        console.error("Puppeteer transcript fetch failed:", error);
        return null;
    } finally {
        if (browser) await browser.close();
    }
}
