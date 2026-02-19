import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { fetchYouTubeTranscriptAPI, extractVideoId } from "@/lib/youtube-api";
import { NextResponse } from "next/server";

// ─── Shared prompt ────────────────────────────────────────────────────────────
function buildPrompt(transcript: string): string {
    const truncated = transcript.length > 100_000
        ? transcript.substring(0, 100_000) + "..."
        : transcript;

    return `You are an intelligent study assistant.
Your task is to summarize the following YouTube video transcript and generate structured study notes.

TRANSCRIPT:
"${truncated}"

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
(3-5 questions to test understanding)`;
}

// ─── Gemini summarizer ────────────────────────────────────────────────────────
async function summarizeWithGemini(transcript: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-1.5-flash-latest (fixed from the broken "gemini-flash-latest")
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const result = await model.generateContent(buildPrompt(transcript));
    const text = result.response.text();
    if (!text) throw new Error("Gemini returned empty response");
    return text;
}

// ─── Groq summarizer (fallback) ───────────────────────────────────────────────
async function summarizeWithGroq(transcript: string): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY not configured");

    const groq = new Groq({ apiKey });

    const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
            {
                role: "user",
                content: buildPrompt(transcript),
            },
        ],
        temperature: 0.4,
        max_tokens: 4096,
    });

    const text = completion.choices[0]?.message?.content;
    if (!text) throw new Error("Groq returned empty response");
    return text;
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function POST(req: Request) {
    try {
        const { url } = await req.json();

        const videoId = extractVideoId(url);
        if (!videoId) {
            return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
        }

        console.log(`[Summarize] Fetching transcript for ${videoId}...`);
        const transcript = await fetchYouTubeTranscriptAPI(videoId);

        if (!transcript) {
            return NextResponse.json(
                { error: "Could not fetch transcript. Video might not have captions." },
                { status: 404 }
            );
        }

        console.log(`[Summarize] Transcript (${transcript.length} chars) — trying Gemini...`);

        // Try Gemini first, fall back to Groq automatically
        let summary: string;
        let usedModel: string;

        try {
            summary = await summarizeWithGemini(transcript);
            usedModel = "gemini-1.5-flash-latest";
            console.log("[Summarize] ✅ Gemini succeeded");
        } catch (geminiError: any) {
            console.warn(`[Summarize] ⚠️ Gemini failed: ${geminiError.message} — falling back to Groq`);
            summary = await summarizeWithGroq(transcript);
            usedModel = "groq/llama-3.3-70b-versatile";
            console.log("[Summarize] ✅ Groq fallback succeeded");
        }

        return NextResponse.json({ summary, model: usedModel });

    } catch (error: any) {
        console.error("[Summarize] ❌ Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate summary" },
            { status: 500 }
        );
    }
}
