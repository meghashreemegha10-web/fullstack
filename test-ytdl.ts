
import ytdl from 'ytdl-core';

async function testYtdl() {
    console.log('🧪 Testing ytdl-core (Video Info Fetcher)');
    console.log('=========================================\n');

    const videoIds = [
        'ScMzIvxBSi4', // Mosh
        'M7lc1UVf-VE'  // Google
    ];

    for (const videoId of videoIds) {
        console.log(`\n📹 Testing Video ID: ${videoId}`);
        try {
            console.log('⏳ Fetching info...');
            const info = await ytdl.getInfo(videoId);
            console.log(`✅ Title: ${info.videoDetails.title}`);

            const tracks = info.player_response.captions?.playerCaptionsTracklistRenderer?.captionTracks;

            if (tracks && tracks.length > 0) {
                console.log(`✅ Found ${tracks.length} caption tracks!`);
                console.log('First track:', tracks[0].baseUrl);
            } else {
                console.log('❌ No caption tracks found in player_response.');
            }

        } catch (e: any) {
            console.error(`❌ Failed: ${e.message}`);
        }
    }
}

testYtdl();
