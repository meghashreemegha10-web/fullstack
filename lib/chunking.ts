
// Note: We might not have langchain installed. I'll check package.json again or implement a simple splitter to avoid adding heavy deps if possible.
// Actually, simple splitting by character count with overlap is enough for this MVP.

interface ChunkOptions {
    chunkSize?: number;
    chunkOverlap?: number;
}

export function splitTextIntoChunks(text: string, options: ChunkOptions = {}): string[] {
    const { chunkSize = 1000, chunkOverlap = 200 } = options;
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        let chunk = text.slice(start, end);

        // If we are not at the end of the text, try to find the last period or newline to break cleaner
        if (end < text.length) {
            const lastPeriod = chunk.lastIndexOf('.');
            const lastNewline = chunk.lastIndexOf('\n');
            const breakPoint = Math.max(lastPeriod, lastNewline);

            if (breakPoint > chunkSize * 0.5) { // Only if it's not too early in the chunk
                chunk = chunk.slice(0, breakPoint + 1);
            }
        }

        chunks.push(chunk);

        // console.log(`Chunk: ${chunk.length} chars, Step: ${step}, Start: ${start}`);
        // If we reached the end of the text and didn't shorten the chunk, we are done
        if (end === text.length && chunk.length === (end - start)) {
            break;
        }

        const step = Math.max(1, chunk.length - chunkOverlap);
        start += step;
    }

    return chunks;
}
