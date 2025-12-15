const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' }); // Load from .env.local

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
    console.error("No API KEY found in .env.local");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        const modelsWrapper = await genAI.getGenerativeModelFactory(); // wait, does it have listModels?
        // The SDK documentation says accessing models is usually done via a manager, but let's check simple method first or fallback
        // Actually, in v0.1.0+ it might be different, but let's try to just instantiate a model and see if we can query.
        // Wait, the SDK doesn't expose listModels directly on the main class easily in all versions.
        // Let's try standard REST approach if SDK fails, or stick to what we know.

        // Actually, let's just try to generate content with 'gemini-1.5-flash' and print the error detailedly.
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hello");
        console.log("Success with gemini-1.5-flash:", result.response.text());
    } catch (error) {
        console.error("Error with gemini-1.5-flash:", error.message);

        // Try gemini-pro
        try {
            console.log("Retrying with gemini-pro...");
            const model2 = genAI.getGenerativeModel({ model: "gemini-pro" });
            const result2 = await model2.generateContent("Hello");
            console.log("Success with gemini-pro:", result2.response.text());
        } catch (err2) {
            console.error("Error with gemini-pro:", err2.message);
        }
    }
}

listModels();
