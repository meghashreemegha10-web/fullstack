import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: NextRequest) {
    try {
        console.log("Chat API called");
        const session = await auth();
        console.log("Chat API Session:", JSON.stringify(session, null, 2));
        console.log("Using Groq Model: llama-3.3-70b-versatile");

        if (!session || !session.user || !session.user.id) {
            console.log("Chat API Unauthorized: Session missing or invalid");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        console.log("Chat API Payload:", body);
        const { documentId, question } = body;

        if (!documentId || !question) {
            console.log("Chat API: Missing documentId or question");
            return NextResponse.json({ error: "Missing documentId or question" }, { status: 400 });
        }

        if (!process.env.GROQ_API_KEY) {
            console.error("GROQ_API_KEY is missing");
            return NextResponse.json({ error: "Server configuration error: Missing API Key" }, { status: 500 });
        }

        const document = await db.document.findUnique({
            where: { id: documentId },
        });

        if (!document) {
            console.log("Chat API: Document not found", documentId);
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }

        // Save user message
        try {
            await db.message.create({
                data: {
                    role: "user",
                    content: question,
                    documentId: document.id,
                },
            });
        } catch (dbError) {
            console.error("Chat API: Failed to save user message", dbError);
            return NextResponse.json({ error: "Database error saving message" }, { status: 500 });
        }

        console.log("Calling Groq API...");
        let answer = "Sorry, I couldn't generate an answer.";

        try {
            const completion = await groq.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: `You are a helpful assistant. Use the following document content to answer the user's question. 
                    If the answer is not in the document, say so.
                    
                    Document Content:
                    ${document.content.substring(0, 15000)}` // Limit context size just in case
                    },
                    {
                        role: "user",
                        content: question,
                    }
                ],
                model: "llama-3.3-70b-versatile",
            });
            answer = completion.choices[0]?.message?.content || answer;
            console.log("Groq API Answer generated");
        } catch (groqError) {
            console.error("Chat API: Groq API Error", groqError);
            return NextResponse.json({ error: `AI Generation Failed: ${(groqError as Error).message}` }, { status: 500 });
        }

        // Save assistant message
        try {
            const assistantMessage = await db.message.create({
                data: {
                    role: "assistant",
                    content: answer,
                    documentId: document.id,
                },
            });
            return NextResponse.json({ answer, message: assistantMessage });
        } catch (dbError) {
            console.error("Chat API: Failed to save assistant message", dbError);
            // Return answer even if saving fails, but warn
            return NextResponse.json({ answer, warning: "Failed to save message to history" });
        }


    } catch (error) {
        console.error("Error with Chat API:", error);
        return NextResponse.json(
            { error: `Internal Server Error: ${error instanceof Error ? error.message : "Unknown error"}` },
            { status: 500 }
        );
    }
}
