
import { YoutubeTranscript } from 'youtube-transcript';

async function testScraper() {
    console.log('🧪 Testing youtube-transcript (Scraper)');
    console.log('=======================================\n');

    const videoIds = [
        'dQw4w9WgXcQ', // Rick Roll (Should work)
        'ScMzIvxBSi4', // Mosh (Standard)
    ];

    for (const videoId of videoIds) {
        console.log(`\n📹 Testing Video ID: ${videoId}`);
        try {
            console.log('⏳ Fetching...');
            const transcript = await YoutubeTranscript.fetchTranscript(videoId);
            console.log(`✅ Success! Found ${transcript.length} lines.`);
            console.log(`📝 Preview: ${transcript.slice(0, 3).map(t => t.text).join(' ')}...`);
        } catch (e: any) {
            console.error(`❌ Failed: ${e.message}`);
            if (e.message.includes('Consent')) {
                console.log('   (Likely blocked by GDPR Consent page)');
            }
        }
    }
}

testScraper();
