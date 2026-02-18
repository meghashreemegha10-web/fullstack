require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

import { db } from "../lib/db";
import { generateEmbedding } from "../lib/embeddings";
import { findMostSimilarChunks } from "../lib/vector-search";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash-lite-preview-09-2025" });

async function main() {
    console.log("Starting RAG Integration Test...");

    // 1. Create a Test User if needed
    let user = await db.user.findFirst();
    if (!user) {
        console.log("Creating test user...");
        user = await db.user.create({
            data: {
                email: "test@example.com",
                password: "password123", // In real app, hash this
                name: "Test User",
                role: "ADMIN",
                approved: true,
            },
        });
    }

    const workspaceName = `Test Workspace ${Date.now()}`;
    const workspace = await db.workspace.create({
        data: {
            name: workspaceName,
            userId: user.id,
        },
    });
    console.log(`Created workspace: ${workspace.name} (${workspace.id})`);

    try {
        // 2. Simulate Document Upload & Chunking
        const docTitle = "AI Safety Guide.txt";
        const docContent = `
    AI safety is a field of research that aims to ensure that artificial intelligence systems operate in the intended manner and do not cause harm to humans.
    One key area is alignment, which involves aligning the AI's goals with human values.
    Another area is robustness, ensuring the AI behaves correctly even in unforeseen situations.
    `;

        // Create Document
        const document = await db.document.create({
            data: {
                title: docTitle,
                content: docContent,
                userId: user.id,
                workspaceId: workspace.id,
            },
        });
        console.log(`Created document: ${document.title}`);

        // Create Chunks (simulate what the API does)
        // Manually chunking for test
        const chunkContent = docContent.trim();
        const embedding = await generateEmbedding(chunkContent);

        await db.documentChunk.create({
            data: {
                content: chunkContent,
                embedding: embedding,
                documentId: document.id,
                metadata: { index: 0 },
            },
        });
        console.log("Created chunk with embedding.");

        // 3. Simulate Chat Query
        const query = "What is AI alignment?";
        console.log(`Querying: "${query}"`);

        const queryEmbedding = await generateEmbedding(query);

        // Fetch chunks
        const chunks = await db.documentChunk.findMany({
            where: { document: { workspaceId: workspace.id } },
        });

        // Vector Search
        const relevant = findMostSimilarChunks(
            queryEmbedding,
            chunks.map(c => ({
                id: c.id,
                embedding: c.embedding,
                documentId: c.documentId
            }))
        );
        console.log(`Found ${relevant.length} relevant chunks.`);

        if (relevant.length > 0) {
            // Generate Answer
            const context = chunks.find(c => c.id === relevant[0].id)?.content;
            const result = await model.generateContent(`
            Answer based on context:
            ${context}
            
            Question: ${query}
        `);
            console.log("\n--- AI Response ---");
            console.log(result.response.text());
            console.log("-------------------\n");
        } else {
            console.error("No relevant chunks found! Vector search failed.");
        }

    } catch (error) {
        console.error("Test failed:", error);
    } finally {
        // Cleanup
        await db.workspace.delete({ where: { id: workspace.id } });
        console.log("Cleaned up test workspace.");
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
