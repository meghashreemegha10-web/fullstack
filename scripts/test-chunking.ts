import { splitTextIntoChunks } from "../lib/chunking";

const text = "This is a test document. ".repeat(500);
console.log(`Original text length: ${text.length}`);

const chunks = splitTextIntoChunks(text);
console.log(`Generated ${chunks.length} chunks.`);
console.log(`First chunk length: ${chunks[0]?.length}`);
console.log(`Last chunk length: ${chunks[chunks.length - 1]?.length}`);
