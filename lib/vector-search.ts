export function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export interface ScoredChunk {
    id: string;
    score: number;
    documentId: string;
}

export function findMostSimilarChunks(
    queryEmbedding: number[],
    chunks: { id: string; embedding: number[]; documentId: string }[],
    topK: number = 5
): ScoredChunk[] {
    const scored = chunks.map((chunk) => ({
        id: chunk.id,
        score: cosineSimilarity(queryEmbedding, chunk.embedding),
        documentId: chunk.documentId,
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
}
