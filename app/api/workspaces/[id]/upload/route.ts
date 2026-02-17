
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { generateEmbedding, generateEmbeddings } from "@/lib/embeddings";
import { splitTextIntoChunks } from "@/lib/chunking";
import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";

// Helper to parse PDF buffer
async function parsePDF(buffer: Buffer): Promise<string> {
    try {
        const parser = new PDFParse({ data: buffer });
        const data = await parser.getText();
        await parser.destroy();
        return data.text;
    } catch (error) {
        console.error("Error parsing PDF:", error);
        throw error;
    }
}

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

        // Verify workspace access
        const workspace = await db.workspace.findUnique({
            where: {
                id: workspaceId,
                userId: session.user.id,
            },
        });

        if (!workspace) {
            return new NextResponse("Workspace not found", { status: 404 });
        }

        const formData = await req.formData();
        const files = formData.getAll("files") as File[];

        if (!files || files.length === 0) {
            return new NextResponse("No files provided", { status: 400 });
        }

        const results = [];

        for (const file of files) {
            const buffer = Buffer.from(await file.arrayBuffer());
            let content = "";

            if (file.type === "application/pdf") {
                try {
                    content = await parsePDF(buffer);
                } catch (e) {
                    console.error(`Error parsing PDF ${file.name}: `, e);
                    results.push({ file: file.name, status: "error", error: "Failed to parse PDF" });
                    continue;
                }
            } else {
                // Assume text
                content = buffer.toString("utf-8");
            }

            if (!content || content.trim().length === 0) {
                results.push({ file: file.name, status: "error", error: "Empty content" });
                continue;
            }

            // Create Document
            const document = await db.document.create({
                data: {
                    title: file.name,
                    content: content, // Optional: store full content if needed, but chunks are key
                    userId: session.user.id,
                    workspaceId: workspace.id,
                },
            });

            // Split into chunks
            const chunks = splitTextIntoChunks(content);

            // Generate embeddings
            // We can do this in batch or one by one. 
            // For simplicity and error handling, let's do batch but handle errors if needed.
            // Ideally we should have a retry mechanism or queue, but for this MVP direct is fine.
            try {
                const embeddings = await generateEmbeddings(chunks);

                // Save chunks
                const chunkData = chunks.map((chunk, index) => ({
                    content: chunk,
                    embedding: embeddings[index],
                    metadata: { source: file.name, chunkIndex: index },
                    documentId: document.id,
                }));

                // Prisma createMany is not supported for lists of floats in some versions/adapters easily without raw, 
                // but let's try standard createMany first. If it fails due to vector type issues, we might need loop.
                // Actually, DocumentChunk embedding is Float[], which is supported natively by Prisma with Postgres.
                // But `createMany` might not handle complex types in all cases. Let's try loop for safety if unsure, 
                // or createMany if confident. Let's use loop for now to be safe with vector arrays.
                // Wait, createMany is much faster. Let's try to use it if we can.
                // Issue: sending large arrays in createMany parameters.

                // Let's use a transaction or parallel promises for `create`
                await db.$transaction(
                    chunkData.map(data => db.documentChunk.create({ data }))
                );

                results.push({ file: file.name, status: "success", documentId: document.id });

            } catch (e) {
                console.error(`Error processing embeddings for ${file.name}: `, e);
                // Cleanup document if failed?
                await db.document.delete({ where: { id: document.id } });
                results.push({ file: file.name, status: "error", error: "Embedding generation failed" });
            }
        }

        return NextResponse.json({ results });
    } catch (error) {
        console.error("Upload error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
