
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

async function testPuppeteer() {
    console.log('🧪 Testing Puppeteer (Browser Automation)');
    console.log('=======================================\n');

    const videoId = 'ScMzIvxBSi4'; // Mosh
    const url = `https://www.youtube.com/watch?v=${videoId}`;

    console.log(`📹 Testing Video: ${url}`);

    // Launch browser
    const browser = await puppeteer.launch({
        headless: true, // Set to false if you want to see it locally (but I can't)
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();

        // Set a real user agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        console.log('⏳ Navigating to page...');
        await page.goto(url, { waitUntil: 'networkidle2' });

        // Check for consent overlay
        const consentButton = await page.$('button[aria-label="Reject all"]');
        if (consentButton) {
            console.log('🔘 Found Consent Button. Clicking...');
            await consentButton.click();
            await new Promise(r => setTimeout(r, 2000));
        }

        console.log('📸 Taking screenshot...');
        await page.screenshot({ path: 'debug-youtube.png' });

        // Extract caption tracks from page source (ytInitialPlayerResponse)
        console.log('🔍 Extracting player response...');
        const playerResponse = await page.evaluate(() => {
            // @ts-ignore
            if (window.ytInitialPlayerResponse) return window.ytInitialPlayerResponse;
            return null;
        });

        if (!playerResponse) {
            console.error('❌ No ytInitialPlayerResponse found!');
        } else {
            const tracks = playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks;
            if (tracks && tracks.length > 0) {
                console.log(`✅ Found ${tracks.length} caption tracks!`);
                console.log(`First track: ${tracks[0].name.simpleText} (${tracks[0].languageCode})`);

                // Try to fetch the first track
                const trackUrl = tracks[0].baseUrl;
                console.log('⏳ Fetching caption content...');

                const xml = await page.evaluate(async (url) => {
                    try {
                        const response = await fetch(url);
                        return await response.text();
                    } catch (e: any) {
                        return `FETCH_ERROR: ${e.message}`;
                    }
                }, trackUrl);

                console.log(`📝 Content Length: ${xml.length}`);
                console.log(`📝 Preview: ${xml.substring(0, 100)}...`);

            } else {
                console.error('❌ No caption tracks in player response.');
            }
        }

    } catch (e: any) {
        console.error(`❌ Error: ${e.message}`);
    } finally {
        await browser.close();
    }
}

testPuppeteer();
