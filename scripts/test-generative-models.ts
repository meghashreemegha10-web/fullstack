
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

const modelsToTry = [
    "models/gemini-2.5-flash-lite-preview-09-2025",
    "models/gemini-3-flash-preview",
    "models/gemini-3-pro-preview",
    "gemini-1.5-flash"
];

async function testModel(modelName: string) {
    try {
        console.log(`Testing ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello, are you working?");
        const response = await result.response;
        console.log(`✅ ${modelName} - Success: ${response.text().slice(0, 50)}...`);
        return true;
    } catch (error: any) {
        console.log(`❌ ${modelName} - Failed: ${error.message.split('\n')[0]}`);
        return false;
    }
}

async function main() {
    console.log("Testing specific Gemini models...");
    for (const model of modelsToTry) {
        await testModel(model);
    }
}

main();
