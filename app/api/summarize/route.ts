import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { fetchYouTubeTranscriptAPI, extractVideoId } from "@/lib/youtube-api";
import { NextResponse } from "next/server";

// ─── Prompt builder ───────────────────────────────────────────────────────────
interface PromptContext {
    transcript: string;
    title?: string;
    channelTitle?: string;
}

function buildPrompt({ transcript, title, channelTitle }: PromptContext): string {
    const truncated = transcript.length > 100_000
        ? transcript.substring(0, 100_000) + "..."
        : transcript;

    // Provide rich video metadata as context so the AI knows exactly what it's summarizing
    const videoContext = [
        title ? `Video Title: ${title}` : null,
        channelTitle ? `Channel / Artist: ${channelTitle}` : null,
    ].filter(Boolean).join("\n");

    const contextBlock = videoContext
        ? `VIDEO CONTEXT: \n${videoContext}\n\n`
        : "";

    const titleInstruction = title
        ? `Use "${title}" as the document title.`
        : "Infer the title from the context if possible, otherwise use 'Video Summary'.";

    return `You are an intelligent assistant that summarizes YouTube videos and generates structured notes.

            ${contextBlock}TRANSCRIPT:
        "${truncated}"

OUTPUT FORMAT(Markdown):
# ${title ?? "Video Summary"}

## 🎯 Executive Summary
    (2 - 3 sentences.For music videos, describe the song, artist, theme, and mood.For other videos, describe the main topic.)

## 🔑 Key Concepts / Key Themes
    (For music: lyrical themes, mood, artist style.For educational: key ideas with explanations.)
- ** Theme / Concept 1 **: Explanation
    - ** Theme / Concept 2 **: Explanation

## 📝 Detailed Notes
    (For music: break down verses, chorus, bridge, lyrical meaning.For other videos: structured walkthrough.)

## 🧠 Quiz / Review Questions
    (3 - 5 questions to test understanding of the content)`;
}

// ─── Gemini summarizer ────────────────────────────────────────────────────────
async function summarizeWithGemini(ctx: PromptContext): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const result = await model.generateContent(buildPrompt(ctx));
    const text = result.response.text();
    if (!text) throw new Error("Gemini returned empty response");
    return text;
}

// ─── Groq summarizer (fallback) ───────────────────────────────────────────────
async function summarizeWithGroq(ctx: PromptContext): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY not configured");

    const groq = new Groq({ apiKey });
    const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: buildPrompt(ctx) }],
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

        console.log(`[Summarize] Fetching transcript + metadata for ${videoId}...`);
        const { transcript, title, channelTitle } = await fetchYouTubeTranscriptAPI(videoId);

        if (!transcript) {
            return NextResponse.json(
                { error: "Could not fetch transcript. Video might not have captions." },
                { status: 404 }
            );
        }

        console.log(`[Summarize] "${title ?? "Unknown"}" by ${channelTitle ?? "Unknown"} — ${transcript.length} chars`);

        const ctx: PromptContext = { transcript, title, channelTitle };

        let summary: string;
        let usedModel: string;

        try {
            summary = await summarizeWithGemini(ctx);
            usedModel = "gemini-1.5-flash-latest";
            console.log("[Summarize] ✅ Gemini succeeded");
        } catch (geminiError: any) {
            console.warn(`[Summarize] ⚠️ Gemini failed: ${geminiError.message} — falling back to Groq`);
            summary = await summarizeWithGroq(ctx);
            usedModel = "groq/llama-3.3-70b-versatile";
            console.log("[Summarize] ✅ Groq fallback succeeded");
        }

        return NextResponse.json({ summary, model: usedModel, title, channelTitle });

    } catch (error: any) {
        console.error("[Summarize] ❌ Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate summary" },
            { status: 500 }
        );
    }
}
