require('dotenv').config();
const Groq = require("groq-sdk");

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

async function main() {
    try {
        console.log("Testing Groq API with model: llama-3.3-70b-versatile");
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: "Hello, just checking if you are online." }],
            model: "llama-3.3-70b-versatile",
        });
        console.log("Success! Response:");
        console.log(completion.choices[0]?.message?.content);
    } catch (e) {
        console.error("Error connecting to Groq:", e.message || e);
    }
}

main();
