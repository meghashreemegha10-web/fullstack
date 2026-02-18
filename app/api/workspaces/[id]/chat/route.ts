import { searchWeb } from "@/lib/firecrawl";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { generateEmbedding } from "@/lib/embeddings";
import { findMostSimilarChunks } from "@/lib/vector-search";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash-lite-preview-09-2025" });

import fs from "fs";
import path from "path";

// ... previous imports

const logFile = path.join(process.cwd(), "chat-debug.log");

function logError(message: string, data: any) {
    const timestamp = new Date().toISOString();
    const dataStr = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data);
    fs.appendFileSync(logFile, `[${timestamp}] ${message}: ${dataStr}\n\n`);
}

export async function POST(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { message, deepSearch } = await req.json();
        const params = await props.params;
        const workspaceId = params.id;

        logError("Chat Request", { workspaceId, deepSearch, message });

        // ... verify workspace (keeping existing code)
        const workspace = await db.workspace.findUnique({
            where: {
                id: workspaceId,
                userId: session.user.id,
            },
            include: {
                documents: {
                    include: {
                        chunks: true
                    }
                }
            }
        });

        if (!workspace) {
            return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
        }

        // 1. Generate embedding
        const queryEmbedding = await generateEmbedding(message);

        // 2. Gather chunks
        const allChunks = workspace.documents.flatMap((doc) =>
            doc.chunks.map((chunk) => ({
                id: chunk.id,
                embedding: chunk.embedding,
                documentId: doc.id,
                content: chunk.content,
                documentTitle: doc.title,
            }))
        );

        // 3. Find similar chunks
        const relevantChunks = findMostSimilarChunks(
            queryEmbedding,
            allChunks,
            5
        );

        let contextText = relevantChunks
            .map((chunk: any) => `Source: ${chunk.documentTitle}\nContent: ${chunk.content}`)
            .join("\n\n");

        logError("Document Context Length", contextText.length);

        // 3.5 Deep Search
        if (deepSearch) {
            logError("Starting Deep Search", { query: message });
            try {
                const webResults = await searchWeb(message);
                logError("Deep Search Results", { count: webResults.length });

                if (webResults.length > 0) {
                    const webContext = webResults.map(r => `Source: ${r.title} (${r.url})\nContent: ${r.content}`).join("\n\n");
                    contextText += `\n\n--- Web Search Results ---\n${webContext}`;
                }
            } catch (searchError) {
                logError("Deep Search Failed", searchError);
            }
        }

        const systemPrompt = `You are a helpful assistant for a document workspace.
    
    1. PRIORITIZE the following Context (Documents + Web Checks) for your answer.
    2. If the answer is found in the Context, cite the source.
    3. If the answer is NOT in the Context, you may answer using your general knowledge, but you MUST state: "I couldn't find this in your documents, but generally speaking..."
    
    Context:
    ${contextText}
    `;

        // ... rest of generation logic

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: systemPrompt }],
                },
                {
                    role: "model",
                    parts: [{ text: "Understood. I will answer based only on the provided context." }],
                },
            ],
        });

        const result = await chat.sendMessage(message);
        const responseText = result.response.text();

        logError("AI Response Generated", { length: responseText.length });

        // ... save messages (keeping existing code)
        await db.message.create({
            data: {
                role: "user",
                content: message,
                workspaceId: workspace.id,
            },
        });

        const assistantMessage = await db.message.create({
            data: {
                role: "assistant",
                content: responseText,
                workspaceId: workspace.id,
            },
        });

        return NextResponse.json(assistantMessage);

    } catch (error) {
        logError("Chat Route Error", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
