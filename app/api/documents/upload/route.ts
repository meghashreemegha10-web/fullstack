import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { PDFParse } from "pdf-parse";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    console.log("Upload API Session:", JSON.stringify(session, null, 2));

    if (!session || !session.user || !session.user.id) {
      console.log("Unauthorized: Session or User ID missing");
      return NextResponse.json({ error: "Unauthorized: You must be logged in to upload documents." }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 });
    }

    let content = "";
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    try {
      if (file.type === "application/pdf") {
        const parser = new PDFParse({ data: buffer });
        const data = await parser.getText();
        content = data.text;
        await parser.destroy();
      } else if (file.type === "text/plain") {
        content = buffer.toString("utf-8");
      } else {
        return NextResponse.json(
          { error: "Unsupported file type. Please upload PDF or Text files." },
          { status: 400 }
        );
      }
    } catch (parseError) {
      console.error("Error parsing file:", parseError);
      return NextResponse.json({ error: `Failed to parse file content: ${(parseError as Error).message}` }, { status: 400 });
    }

    // Basic cleaning of content
    content = content.replace(/\s+/g, " ").trim();
    // Decode URI components if needed (sometimes pdf extraction leaves artifacts)
    try {
      content = decodeURIComponent(content);
    } catch (e) {
      // Ignore if decoding fails
    }

    if (!content || content.length < 10) {
      return NextResponse.json({ error: "File is empty or contains insufficient text" }, { status: 400 });
    }

    try {
      const document = await db.document.create({
        data: {
          title: file.name,
          content: content,
          userId: session.user.id,
        },
      });
      return NextResponse.json({ document }, { status: 201 });
    } catch (dbError) {
      console.error("Database error saving document:", dbError);
      return NextResponse.json({ error: `Failed to save document: ${(dbError as Error).message}` }, { status: 500 });
    }

  } catch (error) {
    console.error("Unexpected error uploading document:", error);
    return NextResponse.json(
      { error: `Internal Server Error: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
