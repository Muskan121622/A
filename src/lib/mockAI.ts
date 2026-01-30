// Mock AI service for demo purposes when OpenAI API is not available

export const mockChatResponses = {
  greetings: [
    'नमस्ते! मैं AgriSphere AI हूं। मैं आपकी खेती में कैसे मदद कर सकता हूं?',
    'Hello! I am AgriSphere AI. How can I help you with farming today?',
    'मैं आपकी कृषि संबंधी समस्याओं का समाधान कर सकता हूं।'
  ],
  
  disease: [
    'गेहूं में रोग आ गया है? पत्तियों पर भूरे धब्बे दिख रहे हैं? यह गेहूं का रतुआ रोग हो सकता है। Propiconazole 25% EC का छिड़काव करें। खेत में जल निकासी की व्यवस्था करें।',
    'फसल में रोग की पहचान के लिए तस्वीर अपलोड करें। मैं रोग की पहचान करके उपचार सुझाऊंगा। तब तक के लिए Mancozeb 75% WP का छिड़काव कर सकते हैं।',
    'पत्ती, तना, फल या मिट्टी की तस्वीर अपलोड करें। मैं 20+ फसल रोगों की पहचान कर सकता हूं।'
  ],
  
  weather: [
    'मौसम की जानकारी के लिए मैं आपको सिंचाई, बुआई और कटाई का सही समय बता सकता हूं।',
    'I can provide weather-based farming advice including irrigation timing and crop protection.',
    'बारिश, तापमान और आर्द्रता के आधार पर फसल की देखभाल की सलाह दे सकता हूं।'
  ],
  
  fertilizer: [
    'खाद और उर्वरक के लिए: नाइट्रोजन, फास्फोरस, पोटाश की मात्रा मिट्टी परीक्षण के आधार पर तय करें।',
    'For fertilizer recommendations, soil testing is essential. NPK ratio depends on crop type and soil condition.',
    'जैविक खाद का उपयोग करें - गोबर की खाद, कंपोस्ट, वर्मी कंपोस्ट बेहतर विकल्प हैं।'
  ],
  
  irrigation: [
    'पानी देने से पहले मिट्टी की नमी जांचें। अगर नमी 30% से कम है तो सिंचाई करें। ड्रिप इरिगेशन से 40% पानी की बचत होती है।',
    'मिट्टी की नमी 40% है, इसलिए 2 दिन बाद पानी दें। 25mm सिंचाई के लिए पर्याप्त है।',
    'फसल की अवस्था के अनुसार पानी दें - फूल आने और दाना भरने के समय अधिक पानी चाहिए। अभी के लिए पानी नहीं चाहिए।'
  ],
  
  market: [
    'बाजार की कीमत जानने के लिए eNAM पोर्टल देखें। सीधे खरीदारों से संपर्क करके बेहतर दाम मिल सकते हैं।',
    'Check market prices on eNAM portal. Direct selling to buyers can increase income by 30%.',
    'फसल की गुणवत्ता बनाए रखें और सही समय पर बेचें।'
  ],
  
  default: [
    'मैं आपकी कृषि संबंधी किसी भी समस्या में मदद कर सकता हूं। रोग, मौसम, खाद, सिंचाई के बारे में पूछें। उदाहरण: "गेहूं में रोग आ गया है", "आज पानी देना चाहिए?", "खाद कितनी डालनी चाहिए?"',
    'I can help with crop diseases, weather advice, fertilizer recommendations, and market information. Examples: "Wheat has disease", "Should I water today?", "How much fertilizer to apply?"',
    'कृषि तकनीक, सरकारी योजनाओं और नई खेती के तरीकों के बारे में भी जानकारी दे सकता हूं। मैं हिंदी और अंग्रेजी दोनों में बात कर सकता हूं।'
  ]
};

export const mockDiseaseAnalysis = {
  wheat_disease: {
    disease: 'Wheat Rust (गेहूं का रतुआ रोग)',
    severity: 7,
    treatment: 'Propiconazole 25% EC @ 1ml/liter पानी में मिलाकर छिड़काव करें। 15 दिन बाद दोहराएं।',
    prevention: 'प्रतिरोधी किस्मों का उपयोग करें। खेत में जल निकासी की व्यवस्था रखें।',
    confidence: 94
  },
  
  tomato_disease: {
    disease: 'Tomato Blight (टमाटर का झुलसा रोग)',
    severity: 6,
    treatment: 'Mancozeb 75% WP @ 2gm/liter या Copper Oxychloride @ 3gm/liter छिड़काव करें।',
    prevention: 'पौधों के बीच उचित दूरी रखें। ड्रिप सिंचाई का उपयोग करें।',
    confidence: 91
  },
  
  cotton_pest: {
    disease: 'Cotton Bollworm (कपास का सुंडी)',
    severity: 8,
    treatment: 'Bt spray या Emamectin Benzoate 5% SG @ 0.5gm/liter छिड़काव करें।',
    prevention: 'Pheromone traps लगाएं। नीम का तेल का छिड़काव करें।',
    confidence: 89
  },
  
  default: {
    disease: 'Nutrient Deficiency (पोषक तत्वों की कमी)',
    severity: 4,
    treatment: 'संतुलित NPK उर्वरक का उपयोग करें। मिट्टी परीक्षण कराएं।',
    prevention: 'नियमित रूप से जैविक खाद का उपयोग करें। फसल चक्र अपनाएं।',
    confidence: 85
  }
};

export const getRandomResponse = (category: keyof typeof mockChatResponses): string => {
  const responses = mockChatResponses[category];
  return responses[Math.floor(Math.random() * responses.length)];
};

export const getMockDiseaseAnalysis = (imageType: string = 'default') => {
  const analysisKey = imageType.toLowerCase().includes('wheat') ? 'wheat_disease' :
                     imageType.toLowerCase().includes('tomato') ? 'tomato_disease' :
                     imageType.toLowerCase().includes('cotton') ? 'cotton_pest' :
                     'default';
  
  return mockDiseaseAnalysis[analysisKey as keyof typeof mockDiseaseAnalysis];
};

export const mockChatWithAI = async (message: string): Promise<string> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  const lowerMessage = message.toLowerCase();
  
  // More intelligent response generation based on keywords
  if (lowerMessage.includes('hi') || lowerMessage.includes('hello') || lowerMessage.includes('नमस्ते')) {
    return getRandomResponse('greetings');
  } 
  
  // Disease related queries
  if (lowerMessage.includes('disease') || lowerMessage.includes('रोग') || lowerMessage.includes('बीमारी') || 
      lowerMessage.includes('sick') || lowerMessage.includes('ill') || lowerMessage.includes('problem') ||
      lowerMessage.includes('issue') || lowerMessage.includes('affected')) {
    
    // Specific crop diseases
    if (lowerMessage.includes('wheat') || lowerMessage.includes('गेहूं')) {
      return 'गेहूं में रोग आ गया है? पत्तियों पर भूरे धब्बे दिख रहे हैं? यह गेहूं का रतुआ रोग हो सकता है। Propiconazole 25% EC का छिड़काव करें। खेत में जल निकासी की व्यवस्था करें।';
    } else if (lowerMessage.includes('tomato') || lowerMessage.includes('टमाटर')) {
      return 'टमाटर में समस्या है? पत्तियों पर पीले धब्बे दिख रहे हैं? यह टमाटर का झुलसा रोग हो सकता है। Mancozeb 75% WP का छिड़काव करें। पौधों के बीच उचित दूरी रखें।';
    } else if (lowerMessage.includes('rice') || lowerMessage.includes('चावल') || lowerMessage.includes('धान')) {
      return 'धान में समस्या है? पत्तियों पर भूरे धब्बे दिख रहे हैं? यह धान का भूरा रोग हो सकता है। Carbendazim 50% SC का छिड़काव करें। खेत में पानी की व्यवस्था ठीक रखें।';
    } else {
      return 'फसल में रोग की पहचान के लिए तस्वीर अपलोड करें। मैं रोग की पहचान करके उपचार सुझाऊंगा। तब तक के लिए Mancozeb 75% WP का छिड़काव कर सकते हैं।';
    }
  }
  
  // Weather/Irrigation related queries
  if (lowerMessage.includes('water') || lowerMessage.includes('irrigation') || lowerMessage.includes('पानी') || 
      lowerMessage.includes('सिंचाई') || lowerMessage.includes('rain') || lowerMessage.includes('बारिश') ||
      lowerMessage.includes('weather') || lowerMessage.includes('मौसम')) {
    
    // Specific watering queries
    if (lowerMessage.includes('today') || lowerMessage.includes('आज')) {
      return 'मिट्टी की नमी 40% है, इसलिए 2 दिन बाद पानी दें। 25mm सिंचाई के लिए पर्याप्त है।';
    } else if (lowerMessage.includes('when') || lowerMessage.includes('कब')) {
      return 'फसल की अवस्था के अनुसार पानी दें - फूल आने और दाना भरने के समय अधिक पानी चाहिए। अभी के लिए पानी नहीं चाहिए।';
    } else {
      return 'पानी देने से पहले मिट्टी की नमी जांचें। अगर नमी 30% से कम है तो सिंचाई करें। ड्रिप इरिगेशन से 40% पानी की बचत होती है।';
    }
  }
  
  // Fertilizer/Nutrition related queries
  if (lowerMessage.includes('fertilizer') || lowerMessage.includes('खाद') || lowerMessage.includes('उर्वरक') ||
      lowerMessage.includes('nutrient') || lowerMessage.includes('पोषक') || lowerMessage.includes('नाइट्रोजन') ||
      lowerMessage.includes('phosphorus') || lowerMessage.includes('फास्फोरस') || lowerMessage.includes('potash') ||
      lowerMessage.includes('पोटाश')) {
    
    if (lowerMessage.includes('how much') || lowerMessage.includes('कितनी')) {
      return 'खाद की मात्रा: गेहूं के लिए NPK 120:60:40 किग्रा/हेक्टेयर। यूरिया 265 किग्रा, SSP 375 किग्रा, MOP 165 किग्रा प्रति हेक्टेयर।';
    } else {
      return 'खाद और उर्वरक के लिए: नाइट्रोजन, फास्फोरस, पोटाश की मात्रा मिट्टी परीक्षण के आधार पर तय करें। जैविक खाद का उपयोग करें - गोबर की खाद, कंपोस्ट, वर्मी कंपोस्ट बेहतर विकल्प हैं।';
    }
  }
  
  // Harvest related queries
  if (lowerMessage.includes('harvest') || lowerMessage.includes('काटन') || lowerMessage.includes('cut') ||
      lowerMessage.includes('reap') || lowerMessage.includes('collect')) {
    
    if (lowerMessage.includes('wheat') || lowerMessage.includes('गेहूं')) {
      return 'गेहूं काटने का समय: जब दाने सुनहरे हो जाएं और मिट्टी की नमी 12-14% हो। सुबह या शाम के समय काटें।';
    } else if (lowerMessage.includes('rice') || lowerMessage.includes('चावल') || lowerMessage.includes('धान')) {
      return 'धान काटने का समय: जब 85% दाने पक जाएं और पत्ते पीले हो जाएं। मिट्टी की नमी 18-22% होनी चाहिए।';
    } else {
      return 'फसल काटने का समय: जब दाने पक जाएं और मिट्टी की नमी उचित हो। सुबह या शाम के समय काटें।';
    }
  }
  
  // Market/Price related queries
  if (lowerMessage.includes('market') || lowerMessage.includes('price') || lowerMessage.includes('बाजार') || 
      lowerMessage.includes('कीमत') || lowerMessage.includes('sell') || lowerMessage.includes('बेचना')) {
    return 'बाजार की कीमत जानने के लिए eNAM पोर्टल देखें। सीधे खरीदारों से संपर्क करके बेहतर दाम मिल सकते हैं। फसल की गुणवत्ता बनाए रखें और सही समय पर बेचें।';
  }
  
  // Default response for general queries
  return getRandomResponse('default');
};