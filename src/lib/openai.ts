import OpenAI from 'openai';

// Use Groq API Key (variable name used across the project)
const apiKey = import.meta.env.VITE_GROQ_CHATBOT_API_KEY || import.meta.env.VITE_OPENAI_API_KEY;

if (!apiKey) {
  console.warn('⚠️ VITE_GROQ_CHATBOT_API_KEY is missing. AI features will use fallback responses.');
}

// Initialize OpenAI client pointing to Groq's API
const openai = new OpenAI({
  apiKey: apiKey || 'dummy_key_to_prevent_initialization_error',
  baseURL: 'https://api.groq.com/openai/v1',
  dangerouslyAllowBrowser: true,
});

export const analyzeImage = async (imageBase64: string, analysisType: 'disease' | 'soil' | 'pest' = 'disease') => {
  try {
    const prompt = getAnalysisPrompt(analysisType);

    const response = await openai.chat.completions.create({
      model: "llama-3.2-90b-vision-preview", // Groq Vision Model
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0.5,
    });

    return response.choices[0]?.message?.content || "Analysis failed";
  } catch (error) {
    console.error('Groq Vision API Error:', error);
    return "Error analyzing image. Please check your API key or try again.";
  }
};

export const chatWithAI = async (message: string, context: string = 'general') => {
  try {
    const systemPrompt = getSystemPrompt(context);

    const response = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile", // Powerful text model
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || "AgriSphere AI: Sorry, I couldn't process your request.";
  } catch (error) {
    console.error('Groq Chat Error:', error);

    // Fallback responses (kept for offline/error resilience)
    const fallbackResponses = {
      'hi': 'Namaste! I am AgriSphere AI (powered by Llama 3). How can I help you with farming today?',
      'hello': 'Hello! I am your agricultural assistant. Ask me about crops, diseases, or farming techniques.',
      'disease': 'For disease detection, please upload an image of your crop. I can identify diseases and suggest treatments.',
      'weather': 'Weather conditions are important for farming. Please check the dashboard for live updates.',
      'default': 'Server is busy. Please try again in 5 seconds. (Groq API Error)'
    };

    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('hi') || lowerMessage.includes('hello') || lowerMessage.includes('नमस्ते')) {
      return fallbackResponses.hi;
    } else {
      return fallbackResponses.default;
    }
  }
};

export const translateToHindi = async (text: string) => {
  try {
    const response = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are an expert translator. Translate the given agricultural advice to Hindi. Keep technical terms in brackets. Return ONLY the Hindi translation."
        },
        { role: "user", content: `Translate this to Hindi: "${text}"` }
      ],
      max_tokens: 200,
      temperature: 0.3,
    });

    return response.choices[0]?.message?.content || text;
  } catch (error) {
    console.error('Translation Error:', error);
    return text; // Return original text if translation fails
  }
};

const getAnalysisPrompt = (type: string) => {
  switch (type) {
    case 'disease':
      return `Analyze this crop image for diseases, pests, and health issues. 
Use ICAR (Indian Council of Agricultural Research) and FAO standards for diagnosis.
Provide:
1. Disease/pest identification
2. Severity level (1-10)
3. Treatment recommendations (chemical and organic, ICAR approved)
4. Prevention tips
Format output clearly.`;

    case 'soil':
      return `Analyze this soil image for texture, moisture, and potential health. Estimate:
1. Soil type (Sandy, Loamy, Clay, etc.)
2. Visual health indicators
3. Suggested crops
4. Improvement suggestions`;

    case 'pest':
      return `Identify the pest in this image. Provide:
1. Pest Name
2. Damage caused
3. Immediate control measures
4. Long-term prevention`;

    default:
      return "Analyze this agricultural image and provide detailed expert insights.";
  }
};

const getSystemPrompt = (context: string) => {
  const basePrompt = `You are AgriSphere AI, an expert agricultural assistant for India. 
Powered by Llama 3 via Groq.
Reflect the guidelines and best practices of ICAR (Indian Council of Agricultural Research) and FAO (Food and Agriculture Organization).
Provide practical, actionable advice in simple language suitable for farmers.
Include costs in Indian Rupees (₹) when relevant.
Always be polite and helpful.
IMPORTANT: Do not repeat the question or the first sentence. Go straight to the answer. Keep it concise.`;

  switch (context) {
    case 'disease':
      return `${basePrompt} Focus on crop disease diagnosis, treatment, and prevention.`;
    case 'weather':
      return `${basePrompt} Provide weather-related farming advice and risk management.`;
    case 'market':
      return `${basePrompt} Help with market prices (Mandi rates), selling strategies, and crop planning.`;
    case 'general':
    default:
      return `${basePrompt} Answer any farming questions with expertise.`;
  }
};

export default openai;