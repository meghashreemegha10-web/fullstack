const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function main() {
    const apiKey = process.env.GOOGLE_API_KEY;
    console.log(`🔑 Testing API Key: ${apiKey ? apiKey.substring(0, 5) + '...' : 'MISSING'}`);

    if (!apiKey) {
        console.error('❌ GOOGLE_API_KEY is missing in .env');
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Test 2: Embedding with available model
    const modelName = "models/gemini-embedding-001";
    console.log(`🧪 Testing Embedding with model: ${modelName}`);
    const model = genAI.getGenerativeModel({ model: modelName });

    try {
        const result = await model.embedContent("Hello world");
        console.log('✅ Embedding Success!');
        console.log('Vector length:', result.embedding.values.length);
    } catch (error) {
        console.error('❌ Embedding Failed:', error.message);
    }

    // Test 3: Generation (Chat) with available model
    const chatModelName = "models/gemini-2.0-flash";
    console.log(`\n🧪 Testing Chat with model: ${chatModelName}`);
    const chatModel = genAI.getGenerativeModel({ model: chatModelName });

    try {
        const result = await chatModel.generateContent("Say hello");
        console.log('✅ Chat Success!');
        console.log('Response:', result.response.text());
    } catch (error) {
        console.error('❌ Chat Failed:', error.message);
    }
}

main();
