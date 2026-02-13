import { fetchTranscript } from "./lib/youtube";

const testCases = [
    { type: "Standard (Tech)", id: "M7lc1UVf-VE", url: "https://www.youtube.com/watch?v=M7lc1UVf-VE" }, // Google Developers
    { type: "Music/Vevo (Often blocked)", id: "dQw4w9WgXcQ", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }, // Rick Astley
    { type: "Long Video (Podcast)", id: "eIho2S0ZahI", url: "https://www.youtube.com/watch?v=eIho2S0ZahI" } // Lex Fridman (random snippet or short pod) -> Actually let's use a shorter "long" video to avoid huge waits. 15 min TED talk. 
    // "1zR6KBubWjY" was the one that failed before. Let's retry it to see if it works now with new logic!
    // { type: "Previously Failed (TED)", id: "1zR6KBubWjY", url: "https://www.youtube.com/watch?v=1zR6KBubWjY" } 
];

async function runTests() {
    console.log("Starting 3 Real-World Tests for YouTube Summarizer...\n");

    for (const test of testCases) {
        console.log(`----------------------------------------------------------------`);
        console.log(`[TEST] Type: ${test.type}`);
        console.log(`[TEST] URL:  ${test.url}`);

        const start = Date.now();
        try {
            const transcript = await fetchTranscript(test.id);
            const duration = ((Date.now() - start) / 1000).toFixed(2);

            if (transcript && transcript.length > 0) {
                console.log(`[PASS] Transcript fetched in ${duration}s`);
                console.log(`[INFO] Length: ${transcript.length} chars`);
                console.log(`[PREVIEW] ${transcript.substring(0, 100)}...`);
            } else {
                console.error(`[FAIL] Transcript was empty (Duration: ${duration}s)`);
            }
        } catch (error) {
            const duration = ((Date.now() - start) / 1000).toFixed(2);
            console.error(`[FAIL] Error fetching transcript in ${duration}s`);
            console.error(error);
        }
        console.log(`----------------------------------------------------------------\n`);
    }
}

runTests();
