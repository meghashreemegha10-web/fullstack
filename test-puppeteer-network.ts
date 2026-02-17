
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

async function testPuppeteerNetwork() {
    console.log('🧪 Testing Puppeteer (Network Interception)');
    console.log('===========================================\n');

    const videoId = 'ScMzIvxBSi4'; // Mosh
    const url = `https://www.youtube.com/watch?v=${videoId}`;

    console.log(`📹 Testing Video: ${url}`);

    const browser = await puppeteer.launch({
        headless: true, // headless: "new" is often better
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Enable request interception (optional, but good for logging)
        await page.setRequestInterception(true);

        page.on('request', (req) => {
            req.continue();
        });

        const captionPromise = new Promise<string | null>((resolve, reject) => {
            page.on('response', async (response) => {
                const url = response.url();
                if (url.includes('timedtext')) {
                    console.log(`🎯 Found caption URL: ${url}`);
                    try {
                        const text = await response.text();
                        if (text.length > 0) {
                            resolve(text);
                        }
                    } catch (e) {
                        console.error('Error reading response:', e);
                    }
                }
            });

            // Timeout after 30s
            setTimeout(() => resolve(null), 30000);
        });

        console.log('⏳ Navigating...');
        await page.goto(url, { waitUntil: 'networkidle2' });

        // Try to trigger captions if they aren't auto-loaded
        // (Sometimes you need to click the CC button)

        console.log('⏳ Waiting for caption network request...');
        const captionData = await captionPromise;

        if (captionData) {
            console.log(`✅ Success! Captured ${captionData.length} characters of caption data.`);
            console.log(`📝 Preview: ${captionData.substring(0, 100)}...`);
        } else {
            console.log('❌ No timedtext request captured.');
            // Fallback: Check if we can find the caption URL in the page source again
            // matching "baseUrl":"https://www.youtube.com/api/timedtext..."
        }

    } catch (e: any) {
        console.error(`❌ Error: ${e.message}`);
    } finally {
        await browser.close();
    }
}

testPuppeteerNetwork();
