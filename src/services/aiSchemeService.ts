import axios from "axios";
import { Scheme } from "../types/advisory";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_CHATBOT_API_KEY;

export const fetchLatestSchemes = async (language: "Hindi" | "English" = "English"): Promise<Scheme[]> => {
    if (!GROQ_API_KEY) {
        console.error("Groq API Key missing for Scheme Fetching");
        return [];
    }

    try {
        const langInstruction = language === "Hindi"
            ? "Provide the response in HINDI. Keys must remain in English, but values like name, benefits, description should be in Hindi."
            : "Provide the response in English.";

        const prompt = `You are an expert agricultural advisor. List 3 distinct, real, and currently active government schemes for Indian farmers that are NOT commonly known (avoid PM-KISAN if possible). 
        
        ${langInstruction}

        Return ONLY a valid JSON array of objects. Each object must match this structure:
        {
            "id": "unique_string_id",
            "name": "Scheme Name",
            "type": "Scheme Type (e.g., Subsidy, Insurance)",
            "state": "State Name or 'All'",
            "central": boolean,
            "benefits": "Short benefits summary",
            "description": "Short description (2 sentences)",
            "applyLink": "Official URL or search query",
            "docsRequired": ["Doc1", "Doc2"]
        }

        Do not generate markdown code blocks. Just the raw JSON string.`;

        const response = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: "You are a helpful agricultural assistant. Output only valid JSON." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.5,
                max_tokens: 1000,
                response_format: { type: "json_object" }
            },
            {
                headers: {
                    "Authorization": `Bearer ${GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const content = response.data.choices[0]?.message?.content;
        if (!content) return [];

        // Parse JSON
        const data = JSON.parse(content);
        const schemes = Array.isArray(data) ? data : (data.schemes || []);

        // Add an "AI Recommended" flag or similar if needed, or just return strictly typed
        // Ensure strictly typed return
        return schemes.map((s: any) => ({
            id: s.id || `AI_${Math.random().toString(36).substr(2, 9)}`,
            name: s.name,
            type: s.type,
            state: s.state,
            central: s.central,
            eligibility: { farmerType: ["All"] }, // Default
            benefits: s.benefits,
            applyLink: s.applyLink,
            description: s.description,
            docsRequired: s.docsRequired || [],
            // If we asked for Hindi, populate the Hi fields too so our card logic works
            nameHi: language === "Hindi" ? s.name : undefined,
            benefitsHi: language === "Hindi" ? s.benefits : undefined,
            descriptionHi: language === "Hindi" ? s.description : undefined,
            docsRequiredHi: language === "Hindi" ? s.docsRequired : undefined
        }));

    } catch (error) {
        console.error("Error fetching AI schemes:", error);
        return [];
    }
};
