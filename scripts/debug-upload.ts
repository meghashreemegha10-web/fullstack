import { splitTextIntoChunks } from "../lib/chunking";
import dotenv from 'dotenv';
import path from 'path';

// Load env from root
dotenv.config();

async function main() {
    const { generateEmbeddings } = await import("../lib/embeddings");
    console.log("🧪 Testing Upload & Embedding Flow...");

    // Simulate a document content (approx 2000 words to create multiple chunks)
    const mockContent = "This is a test document. ".repeat(500);

    console.log("1. Chunking content...");
    const chunks = splitTextIntoChunks(mockContent);
    console.log(`   Generated ${chunks.length} chunks.`);

    console.log("2. Generating Embeddings (Batch)...");
    try {
        const start = Date.now();
        const embeddings = await generateEmbeddings(chunks);
        const duration = (Date.now() - start) / 1000;

        console.log(`✅ Success! Generated ${embeddings.length} embeddings in ${duration}s.`);
        console.log(`   Dimensions: ${embeddings[0].length}`);
    } catch (error: any) {
        console.error("❌ Embedding Generation Failed:");
        console.error(error.message);
        if (error.response) {
            console.error(JSON.stringify(error.response, null, 2));
        }
    }
}

main();
