import { API_KEY } from './config.js';

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;

export class LiveAI {
    async getHint(challengeCode, userQuery) {
        try {
            const prompt = `
                You are an expert coding assistant in a training game called CodeStack.
                A student is stuck on a coding challenge.
                The broken code is:
                \`\`\`
                ${challengeCode}
                \`\`\`
                The student's question is: "${userQuery}"

                Provide a short, concise hint (2-3 sentences max) to help them solve the problem.
                Do NOT give them the direct answer. Guide them to the solution.
                Keep your tone encouraging and thematic, like a mission commander guiding an operative.
            `;

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                }),
            });

            if (!response.ok) {
                return "[CONNECTION ERROR]: Could not establish link to external AI network. Check console for details.";
            }

            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error("Live AI Error:", error);
            return "[SYSTEM FAILURE]: AI uplink failed. Please check your network connection or API key configuration.";
        }
    }
}