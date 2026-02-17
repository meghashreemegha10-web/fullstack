import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const model = genAI.getGenerativeModel({ model: "models/gemini-embedding-001" });

export async function generateEmbedding(text: string): Promise<number[]> {
    try {
        const result = await model.embedContent(text);
        return result.embedding.values;
    } catch (error) {
        console.error("Error generating embedding:", error);
        throw error;
    }
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
        const results: number[][] = [];
        // Sequential processing to avoid rate limits (429) on free tier
        for (const text of texts) {
            try {
                // Add a small delay between requests
                await new Promise(resolve => setTimeout(resolve, 500));
                const embedding = await generateEmbedding(text);
                results.push(embedding);
            } catch (innerError) {
                console.error("Failed to generate embedding for chunk, skipping:", innerError);
                // Check for 429 and wait longer?
                // For now, retry once or just push a placeholder/skip
                // Let's try one retry
                await new Promise(resolve => setTimeout(resolve, 2000));
                try {
                    const retryEmbedding = await generateEmbedding(text);
                    results.push(retryEmbedding);
                } catch (retryError) {
                    console.error("Retry failed too:", retryError);
                    // Push empty or throw? Throwing fails the whole upload. 
                    // Let's throw for now so user knows upload failed.
                    throw retryError;
                }
            }
        }
        return results;
    } catch (error) {
        console.error("Error generating embeddings batch:", error);
        throw error;
    }
}
