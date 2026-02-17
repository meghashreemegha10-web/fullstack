const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function main() {
    const apiKey = process.env.GOOGLE_API_KEY;
    console.log(`🔑 Testing API Key: ${apiKey ? apiKey.substring(0, 5) + '...' : 'MISSING'}`);

    if (!apiKey) {
        console.error('❌ GOOGLE_API_KEY is missing in .env');
        return;
    }

    // Check valid key format roughly
    if (!apiKey.startsWith('AIza')) {
        console.warn('⚠️ API Key does not start with "AIza". It might be invalid or from a different provider (like Vertex AI).');
    }

    // Try to use the API to list models using a raw request if SDK doesn't expose it easily
    // The SDK usually exposes it via a specific manager, but let's try a direct fetch to the API endpoint for debugging reliability
    try {
        console.log('📡 Attempting to list models via raw fetch...');
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

        if (!response.ok) {
            console.error(`❌ List Models Failed: ${response.status} ${response.statusText}`);
            const errorBody = await response.text();
            console.error('Error Body:', errorBody);
            return;
        }

        const data = await response.json();
        console.log('✅ List Models Success!');
        if (data.models) {
            console.log('Available Models:');
            data.models.forEach(m => console.log(` - ${m.name} (${m.supportedGenerationMethods})`));
        } else {
            console.log('No models returned.');
        }

    } catch (error) {
        console.error('❌ Raw Fetch Error:', error.message);
    }
}

main();
