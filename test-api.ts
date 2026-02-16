// Test script to verify YouTube transcript fetching with the OFFICIAL API
import dotenv from 'dotenv';
dotenv.config(); // Load .env file
import { fetchYouTubeTranscriptAPI, extractVideoId } from './lib/youtube-api';

async function testTranscript() {
    // A standard tech review/tutorial video which usually allows captions
    const testUrl = 'https://www.youtube.com/watch?v=ScMzIvxBSi4'; // Python Tutorial (Programming with Mosh)

    console.log('🧪 Testing YouTube Transcript Fetcher (HYBRID: Scraper + Official API)');
    console.log('==================================================\n');

    try {
        console.log(`📹 Test URL: ${testUrl}`);

        // Extract video ID
        const videoId = extractVideoId(testUrl);
        console.log(`🔑 Extracted Video ID: ${videoId}\n`);

        if (!videoId) {
            throw new Error('Failed to extract video ID');
        }

        // Fetch transcript
        console.log('⏳ Fetching transcript...\n');
        const transcript = await fetchYouTubeTranscriptAPI(videoId);

        console.log('✅ SUCCESS!');
        console.log(`📝 Transcript length: ${transcript.length} characters`);
        console.log(`\n📄 First 500 characters:\n${transcript.substring(0, 500)}...\n`);

    } catch (error: any) {
        console.error('\n❌ ERROR:', error.message);
        console.error('\n📋 Full error:', error);
    }
}

testTranscript();
