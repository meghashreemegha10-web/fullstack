import { auth } from "@/auth";
import { db } from "@/lib/db";
import { generateEmbeddings } from "@/lib/embeddings";
import { NextResponse } from "next/server";
import { z } from "zod";
// @ts-ignore
const { PDFParse } = require("pdf-parse");

import fs from "fs";
import path from "path";

// Increase max duration for processing
export const maxDuration = 60;

const logFile = path.join(process.cwd(), "upload-debug.log");

function logError(message: string, error: any) {
    const timestamp = new Date().toISOString();
    const errorMessage = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : "";
    const logEntry = `[${timestamp}] ${message}: ${errorMessage}\nStack: ${stack}\n\n`;
    fs.appendFileSync(logFile, logEntry);
    console.error(message, error);
}

const uploadSchema = z.object({
    files: z.any(),
});

async function extractTextFromFile(file: File): Promise<string> {
    const buffer = Buffer.from(await file.arrayBuffer());

    if (file.type === "application/pdf") {
        const parser = new PDFParse({ data: buffer });
        const data = await parser.getText();
        return data.text;
    } else {
        // Assume text/plain or markdown
        return buffer.toString("utf-8");
    }
}

function chunkText(text: string, chunkSize: number = 1000, overlap: number = 100): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        chunks.push(text.slice(start, end));
        start += chunkSize - overlap;
    }

    return chunks;
}

export async function POST(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    logError("Upload request received", { id: params.id });
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const files = formData.getAll("files") as File[];
        const workspaceId = params.id;

        // Verify workspace access
        const workspace = await db.workspace.findUnique({
            where: {
                id: workspaceId,
                userId: session.user.id,
            },
        });

        if (!workspace) {
            return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
        }

        const results = [];

        for (const file of files) {
            try {
                if (!file.name.match(/\.(pdf|txt|md)$/i)) {
                    results.push({ file: file.name, status: "error", error: "Unsupported file type" });
                    continue;
                }

                const text = await extractTextFromFile(file);

                // Create Document record
                const document = await db.document.create({
                    data: {
                        title: file.name,
                        content: text, // Store full text (optional)
                        userId: session.user.id,
                        workspaceId: workspace.id,
                    },
                });

                // Chunk text
                const chunks = chunkText(text);

                // Generate embeddings in batches
                const embeddings = await generateEmbeddings(chunks);

                // Save chunks with embeddings
                await db.$transaction(
                    chunks.map((chunk, index) =>
                        db.documentChunk.create({
                            data: {
                                content: chunk,
                                embedding: embeddings[index],
                                documentId: document.id,
                                metadata: { index },
                            },
                        })
                    )
                );

                results.push({ file: file.name, status: "success", documentId: document.id });
            } catch (error) {
                logError(`Error processing file ${file.name}`, error);
                results.push({ file: file.name, status: "error", error: "Processing failed" });
            }
        }

        return NextResponse.json({ results });
    } catch (error) {
        logError("Upload error", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
