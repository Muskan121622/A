import axios from "axios";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_CHATBOT_API_KEY;

/**
 * Simplifies complex scheme text into simple Hindi/English for farmers using Groq.
 */
export const simplifyTextForFarmer = async (text: string, language: "Hindi" | "English" = "Hindi"): Promise<string> => {
    if (!GROQ_API_KEY) {
        console.error("Groq API Key missing");
        return "Voice service unavailable. Please check configuration.";
    }

    try {
        const prompt = `You are an expert agriculture advisor. Explain the following government scheme details to a farmer in simple ${language}. Keep it short (2-3 sentences max) and easy to understand. Do not invent facts. \n\nDetails: ${text}`;

        const response = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: "You are a helpful agricultural assistant for Indian farmers." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 150
            },
            {
                headers: {
                    "Authorization": `Bearer ${GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        return response.data.choices[0]?.message?.content || "Could not generate explanation.";

    } catch (error: any) {
        console.error("Groq AI Simplification Error:", error);
        // Better error for debugging
        if (error.response) {
            return `Error: ${error.response.status} - ${error.response.data?.error?.message || "Unknown API Error"}`;
        }
        return `Error: ${error.message || "Could not simplify text"}`;
    }
};

/**
 * Stops any ongoing speech.
 */
export const stopSpeech = () => {
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
};

/**
 * Speaks the text using Web Speech API.
 */
export const speakText = (text: string, lang: string = "hi-IN") => {
    if (!window.speechSynthesis) {
        alert("Voice not supported on this browser.");
        return;
    }

    // Stop previous speech
    stopSpeech();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1;

    window.speechSynthesis.speak(utterance);
};
