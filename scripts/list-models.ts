require('dotenv').config({ path: '.env.local' }); // Try .env.local first, then .env
require('dotenv').config();

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

async function main() {
    try {
        // @ts-ignore
        // Accessing the model manager directly if possible, or just trying a known list endpoint if the SDK exposes it.
        // The SDK might not expose listModels directly on genAI instance in all versions.
        // Actually, it usually does via a separate manager or just strictly typed.
        // Let's try to just use a raw fetch to the API if SDK is obscure, but SDK should have it.
        // Checking node_modules or docs? 
        // Let's try to assume we can't easily list without diving into SDK internals if not obvious.
        // But wait, the error message suggested: "Call ListModels to see the list..."

        // Attempting to use the SDK's model listing if available. 
        // If not, I'll just print "SDK doesn't make listing easy" and try a raw REST call.

        console.log("Attempting to list models via raw fetch...");
        const key = process.env.GOOGLE_API_KEY;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await response.json();

        if (data.models) {
            console.log("Available Models:");
            data.models.forEach((m: any) => {
                console.log(`- ${m.name} (${m.supportedGenerationMethods.join(", ")})`);
            });
        } else {
            console.log("No models found or error:", data);
        }

    } catch (error) {
        console.error("Error listing models:", error);
    }
}

main();
