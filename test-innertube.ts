
import { Innertube } from 'youtubei.js';

async function testInnertube() {
    console.log('🧪 Testing YouTube Transcript Fetcher (Innertube / youtubei.js)');
    console.log('============================================================\n');

    // Test with the video that failed on Official API (Mosh Python)
    const videoId = 'ScMzIvxBSi4';
    // Also test the music/official video
    // const videoId = 'M7lc1UVf-VE'; 

    console.log(`📹 Testing Video ID: ${videoId}`);

    try {
        console.log('⏳ Initializing Innertube...');
        const youtube = await Innertube.create();

        console.log('⏳ Fetching video info...');
        const info = await youtube.getInfo(videoId);

        console.log(`✅ Title: ${info.basic_info.title}`);

        console.log('⏳ Fetching transcript...');
        const transcriptData = await info.getTranscript();

        if (!transcriptData || !transcriptData.transcript) {
            console.error('❌ No transcript found.');
            return;
        }

        console.log(`✅ Transcript found! Lines: ${transcriptData.transcript.content?.body?.initial_segments.length}`);

        // Parse it to text
        const lines = transcriptData.transcript.content?.body?.initial_segments.map((segment: any) => segment.snippet.text);
        const fullText = lines?.join(' ') || '';

        console.log(`📝 Preview (first 200 chars): ${fullText.substring(0, 200)}...`);
        console.log(`📏 Total Length: ${fullText.length} characters`);

    } catch (error: any) {
        console.error('❌ Error:', error.message);
        if (error.info) {
            console.error('Error Info:', JSON.stringify(error.info, null, 2));
        }
    }
}

testInnertube();
