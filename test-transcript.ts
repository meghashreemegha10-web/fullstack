// Test script to verify YouTube transcript fetching
import { fetchYouTubeTranscript, extractVideoId } from './lib/youtube-improved';

async function testTranscript() {
    // Test with different videos
    const testVideos = [
        'https://www.youtube.com/watch?v=jNQXAC9IVRw', // "Me at the zoo" - first YouTube video
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Rick Astley - Never Gonna Give You Up
    ];

    console.log('🧪 Testing YouTube Transcript Fetcher');
    console.log('=====================================\n');

    for (const testUrl of testVideos) {
        try {
            console.log(`\n📹 Test URL: ${testUrl}`);

            // Extract video ID
            const videoId = extractVideoId(testUrl);
            console.log(`🔑 Video ID: ${videoId}`);

            if (!videoId) {
                console.error('❌ Failed to extract video ID\n');
                continue;
            }

            // Fetch transcript
            console.log('⏳ Fetching transcript...');
            const transcript = await fetchYouTubeTranscript(videoId);

            console.log('✅ SUCCESS!');
            console.log(`📝 Transcript length: ${transcript.length} characters`);
            console.log(`📄 Preview: ${transcript.substring(0, 200)}...\n`);
            console.log('─'.repeat(60));

        } catch (error: any) {
            console.error('❌ ERROR:', error.message);
            console.log('─'.repeat(60));
        }
    }
}

testTranscript();
