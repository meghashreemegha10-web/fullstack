import { GoogleGenerativeAI } from "@google/generative-ai";
import { fetchTranscript } from "@/lib/youtube";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { url } = await req.json();

        // Simple video ID extraction
        let videoId = "";
        if (url.includes("youtu.be/")) {
            videoId = url.split("youtu.be/")[1]?.split("?")[0];
        } else if (url.includes("v=")) {
            videoId = url.split("v=")[1]?.split("&")[0];
        }

        if (!videoId) {
            return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
        }

        console.log(`Fetching transcript for ${videoId}...`);
        const transcript = await fetchTranscript(videoId);

        if (!transcript) {
            return NextResponse.json({ error: "Could not fetch transcript. Video might not have captions." }, { status: 404 });
        }

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: "Gemini API Key is missing in .env" }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        // Truncate transcript to reasonable length if needed, though Gemini 1.5 has large context.
        // 1 token ~= 4 chars. 1M tokens is huge. We can likely pass the whole thing.
        // But let's limit to ~100k chars just in case to be safe and fast.
        const truncatedTranscript = transcript.length > 100000 ? transcript.substring(0, 100000) + "..." : transcript;

        const prompt = `
    You are an intelligent study assistant.
    Your task is to summarize the following YouTube video transcript and generate structured study notes.
    
    TRANSCRIPT:
    "${truncatedTranscript}"
    
    OUTPUT FORMAT (Markdown):
    # Video Title (Infer from context if possible, otherwise 'Video Summary')
    
    ## 🎯 Executive Summary
    (A concise 2-3 sentence overview)
    
    ## 🔑 Key Concepts
    - **Concept 1**: Definition/Explanation
    - **Concept 2**: Definition/Explanation
    
    ## 📝 Detailed Study Notes
    (Structured notes with bullet points, capturing the main flow and details)
    
    ## 🧠 Quiz / Review Questions
    (3-5 questions to test understanding)
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ summary: text });

    } catch (error: any) {
        console.error("Summarization error:", error);
        return NextResponse.json({ error: error.message || "Failed to generate summary" }, { status: 500 });
    }
}
