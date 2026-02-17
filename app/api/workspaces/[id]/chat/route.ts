import { auth } from "@/auth";
import { db } from "@/lib/db";
import { generateEmbedding } from "@/lib/embeddings";
import { findMostSimilarChunks } from "@/lib/vector-search";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const model = genAI.getGenerativeModel({ model: "models/gemini-flash-latest" });

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id: workspaceId } = await params;
        const { message } = await req.json();

        if (!message) {
            return new NextResponse("Message is required", { status: 400 });
        }

        // 1. Save User Message
        await db.message.create({
            data: {
                role: "user",
                content: message,
                workspaceId: workspaceId,
            },
        });

        // 2. Generate Embedding for Query
        console.log("Generating embedding for message...");
        const queryEmbedding = await generateEmbedding(message);
        console.log("Embedding generated successfully.");

        // 3. Fetch all chunks for the workspace (optimization: fetch only embeddings initially)
        // Note: In production with many docs, use pgvector or a vector DB.
        // Here we fetch all chunks for the workspace.
        const workspaceDocuments = await db.document.findMany({
            where: { workspaceId: workspaceId },
            select: { id: true },
        });

        const documentIds = workspaceDocuments.map(d => d.id);

        if (documentIds.length === 0) {
            // No documents, just chat normally or return default
            const chat = model.startChat();
            const result = await chat.sendMessage(message);
            const response = result.response.text();

            await db.message.create({
                data: {
                    role: "assistant",
                    content: response,
                    workspaceId: workspaceId,
                }
            });
            return NextResponse.json({ role: "assistant", content: response });
        }

        const chunks = await db.documentChunk.findMany({
            where: {
                documentId: { in: documentIds },
            },
            select: {
                id: true,
                embedding: true,
                documentId: true,
            },
        });

        // 4. Find similar chunks
        const topChunks = findMostSimilarChunks(queryEmbedding, chunks, 5);

        // 5. Fetch content for top chunks
        const relevantContent = await db.documentChunk.findMany({
            where: {
                id: { in: topChunks.map((c) => c.id) },
            },
            include: {
                document: {
                    select: {
                        title: true,
                    },
                },
            },
        });

        // 6. Construct Prompt
        const context = relevantContent
            .map(
                (chunk) =>
                    `Source: ${chunk.document.title}\nContent: ${chunk.content}`
            )
            .join("\n\n");

        const systemPrompt = `You are a helpful AI assistant in a workspace.
    You have access to the following documents context:
    
    ${context}
    
    Answer the user's question based on the context provided.
    If the answer is found in the context, cite the source document title.
    If the context doesn't contain the answer, say so, but you can still try to help with general knowledge or ask for clarification.
    Always be professional and concise.
    `;

        // 7. Generate Response with Retry Logic
        let responseText = "";
        const maxRetries = 3;
        let retryCount = 0;

        while (retryCount < maxRetries) {
            try {
                const result = await model.generateContent([
                    systemPrompt,
                    `User Question: ${message}`
                ]);
                responseText = result.response.text();
                break; // Success, exit loop
            } catch (error: any) {
                if (error.status === 429 || error.message?.includes("429")) {
                    retryCount++;
                    console.log(`Rate limit hit. Retrying (${retryCount}/${maxRetries})...`);
                    if (retryCount >= maxRetries) throw error;
                    // Exponential backoff: 2s, 4s, 8s
                    await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, retryCount - 1)));
                } else {
                    throw error; // Re-throw other errors
                }
            }
        }

        // 8. Save Assistant Message
        const assistantMessage = await db.message.create({
            data: {
                role: "assistant",
                content: responseText,
                workspaceId: workspaceId,
            },
        });

        return NextResponse.json(assistantMessage);

    } catch (error: any) {
        console.error("Chat error details:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        console.error("Chat error message:", error.message);
        console.error("Chat error stack:", error.stack);

        if (error.status === 429 || error.message?.includes("429")) {
            return NextResponse.json(
                { error: "Rate limit exceeded. Please try again in a minute." },
                { status: 429 }
            );
        }

        // Return actual error message for debugging purposes (in production this should be generic)
        return NextResponse.json(
            { error: `Internal Server Error: ${error.message}` },
            { status: 500 }
        );
    }
}

