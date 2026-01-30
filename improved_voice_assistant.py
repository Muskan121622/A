#!/usr/bin/env python3
"""
Improved Voice Assistant for Agricultural Questions
Provides accurate answers in Hindi and English using Groq API (Llama 3)
"""

import json
import re
from datetime import datetime
import os
from dotenv import load_dotenv
from groq import Groq

# Load environment variables
load_dotenv()

# Configure Groq API
# Attempt to get key from environment, fallback to hardcoded if necessary (though env is preferred)
# Note: In production, rely strictly on os.environ
GROQ_API_KEY = os.environ.get("GROQ_API_KEY") or os.environ.get("VITE_GROQ_CHATBOT_API_KEY") or "gsk_y256a7183zXj7Z123" # Placeholder if missing, user should ensure env is set

class AgriVoiceAssistant:
    def __init__(self):
        try:
            self.client = Groq(api_key=GROQ_API_KEY)
            self.model = "llama-3.3-70b-versatile" # High quality model
            print(f"AgriVoiceAssistant initialized with Groq model: {self.model}")
        except Exception as e:
            print(f"Failed to initialize Groq client: {e}")
            self.client = None
            
        self.knowledge_base = self.load_agricultural_knowledge()
        
    def load_agricultural_knowledge(self):
        """Load comprehensive agricultural knowledge base"""
        return {
            # Crop Diseases
            "diseases": {
                "wheat_rust": {
                    "hindi": "गेहूं में रतुआ रोग",
                    "symptoms": ["पत्तियों पर नारंगी-लाल धब्बे", "पत्तियां पीली होना"],
                    "treatment": "प्रोपिकोनाजोल या टेबुकोनाजोल का छिड़काव करें",
                    "prevention": "प्रतिरोधी किस्मों का उपयोग करें"
                },
                "tomato_blight": {
                    "hindi": "टमाटर में झुलसा रोग", 
                    "symptoms": ["पत्तियों पर भूरे धब्बे", "फलों पर काले धब्बे"],
                    "treatment": "कॉपर सल्फेट या मैंकोजेब का छिड़काव करें",
                    "prevention": "उचित दूरी पर रोपाई करें"
                },
                "rice_blast": {
                    "hindi": "धान में ब्लास्ट रोग",
                    "symptoms": ["पत्तियों पर आंख के आकार के धब्बे", "बालियों का सूखना"],
                    "treatment": "ट्राइसाइक्लाजोल का छिड़काव करें",
                    "prevention": "संतुलित उर्वरक का प्रयोग करें"
                }
            },
            
            # Fertilizers and Nutrients
            "fertilizers": {
                "nitrogen_deficiency": {
                    "hindi": "नाइट्रोजन की कमी",
                    "symptoms": ["पुरानी पत्तियां पीली", "धीमी वृद्धि"],
                    "treatment": "यूरिया 2 किलो प्रति एकड़ डालें",
                    "timing": "बुआई के 20-25 दिन बाद"
                },
                "phosphorus_deficiency": {
                    "hindi": "फास्फोरस की कमी", 
                    "symptoms": ["पत्तियों का बैंगनी रंग", "जड़ों का कम विकास"],
                    "treatment": "डीएपी 1 बोरी प्रति एकड़ डालें",
                    "timing": "बुआई के समय"
                },
                "potassium_deficiency": {
                    "hindi": "पोटाश की कमी",
                    "symptoms": ["पत्तियों के किनारे जलना", "फलों का कम विकास"],
                    "treatment": "म्यूरेट ऑफ पोटाश 50 किलो प्रति एकड़",
                    "timing": "फूल आने के समय"
                }
            },
            
            # Irrigation and Water Management
            "irrigation": {
                "wheat": {
                    "hindi": "गेहूं की सिंचाई",
                    "frequency": "15-20 दिन के अंतराल पर",
                    "critical_stages": ["बुआई के बाद", "फूल आने पर", "दाना भरने पर"],
                    "water_amount": "5-6 सेमी पानी प्रति सिंचाई"
                },
                "rice": {
                    "hindi": "धान की सिंचाई",
                    "frequency": "खेत में हमेशा 2-3 सेमी पानी रखें",
                    "critical_stages": ["रोपाई के बाद", "कल्ले निकलने पर", "बाली आने पर"],
                    "water_amount": "150-200 सेमी पानी पूरे सीजन में"
                }
            },
            
            # Pest Management
            "pests": {
                "aphids": {
                    "hindi": "माहू कीट",
                    "identification": "छोटे हरे या काले कीड़े पत्तियों पर",
                    "treatment": "इमिडाक्लोप्रिड का छिड़काव करें",
                    "organic": "नीम का तेल या साबुन का घोल"
                },
                "bollworm": {
                    "hindi": "सुंडी कीट",
                    "identification": "फलों और फूलों को खाने वाली सुंडी",
                    "treatment": "बीटी या स्पिनोसैड का छिड़काव",
                    "prevention": "फेरोमोन ट्रैप लगाएं"
                }
            },
            
            # Weather and Timing
            "weather_advice": {
                "monsoon": {
                    "hindi": "बारिश के मौसम की सलाह",
                    "crops": "धान, मक्का, कपास की बुआई का समय",
                    "precautions": "जल निकासी की व्यवस्था करें"
                },
                "winter": {
                    "hindi": "सर्दी के मौसम की सलाह", 
                    "crops": "गेहूं, जौ, चना की बुआई",
                    "precautions": "पाला से बचाव करें"
                }
            }
        }
    
    def process_voice_input(self, text):
        """Process voice input and generate appropriate response"""
        text = text.lower().strip()
        
        # Detect language (simple heuristic)
        is_hindi = any(char in text for char in 'कखगघचछजझटठडढणतथदधनपफबभमयरलवशषसह')
        
        # Clean and normalize text
        text = self.normalize_text(text)
        
        # Identify query type and generate response
        response = self.generate_response(text, is_hindi)
        
        return response
    
    def normalize_text(self, text):
        """Normalize text for better matching"""
        # Simple cleanup without regex to avoid encoding issues
        text = text.replace('?', ' ').replace('.', ' ').replace(',', ' ').replace('!', ' ')
        return text.strip()
    
    def generate_response(self, text, is_hindi=False):
        """Generate appropriate agricultural response"""
        
        # 1. Direct Crop + Intent Check (Local Fast Path)
        # This bypasses generic checks to ensure we answer common crop questions locally
        # local_response = self.check_local_knowledge(text, is_hindi)
        # if local_response:
        #     return local_response

        # 2. General Fallback to simple keyword routing (Legacy)
        # if any(word in text for word in ['kharif', 'rabi', 'खरीफ', 'रबी']):
        #     return self.handle_crop_info_query(text, is_hindi)
            
        # 3. If no local match, try Groq AI
        return self.call_groq_api(text, is_hindi)

    def check_local_knowledge(self, text, is_hindi=False):
        """Check if we can answer from local knowledge base"""
        
        # Sowing/Farming Time (Kheti/Kab)
        if any(word in text for word in ['kab', 'when', 'time', 'samay', 'समय', 'mahina', 'month']):
             if any(word in text for word in ['kheti', 'farming', 'ugaye', 'laga', 'ki jati', 'boai', 'sowing', 'ropai', 'karen', 'करें']):
                 return self.handle_crop_info_query(text, is_hindi)
                 
        # Harvest
        if any(word in text for word in ['kaat', 'katai', 'harvest', 'katna', 'काटना', 'कटाई', 'kaatni', 'काटनी']):
             return self.handle_harvest_query(text, is_hindi)
             
        # Disease
        if any(word in text for word in ['rog', 'disease', 'bimari', 'kida', 'pest', 'रोग', 'बीमारी', 'कीड़ा', 'insects']):
             return self.handle_disease_query(text, is_hindi)
             
        # Fertilizer
        if any(word in text for word in ['khad', 'fertilizer', 'urvarak', 'dava', 'खाद', 'उर्वरक', 'दवा']):
             return self.handle_fertilizer_query(text, is_hindi)
             
        # Irrigation
        if any(word in text for word in ['pani', 'water', 'sinchai', 'पानी', 'सिंचाई']):
             return self.handle_irrigation_query(text, is_hindi)
             
        return None

    def handle_crop_info_query(self, text, is_hindi):
        """Handle crop information queries"""
        # Kharif/Rabi Definitions
        if 'kharif' in text or 'खरीफ' in text:
            if is_hindi:
                return {
                    'text': "खरीफ फसलें (जैसे धान, मक्का) बारिश में (जून-जुलाई) बोई जाती हैं और अक्टूबर-नवंबर में काटी जाती हैं।",
                    'audio_text': "खरीफ फसलें जून-जुलाई में बोई जाती हैं।",
                    'solution': "Sowing: June-July",
                    'timing': "Monsoon Season"
                }
        elif 'rabi' in text or 'रबी' in text:
             if is_hindi:
                return {
                    'text': "रबी फसलें (जैसे गेहूं, सरसों) सर्दी में (अक्टूबर-दिसंबर) बोई जाती हैं और मार्च-अप्रैल में काटी जाती हैं।",
                    'audio_text': "रबी फसलें अक्टूबर-दिसंबर में बोई जाती हैं।",
                    'solution': "Sowing: Oct-Dec",
                    'timing': "Winter Season"
                }

        # Specific Crop Sowing Logic
        if 'rice' in text or 'dhan' in text or 'धान' in text or 'chawal' in text or 'चावल' in text:
             if is_hindi:
                return {
                    'text': "धान (चावल) खरीफ की प्रमुख फसल है। इसकी नर्सरी मई-जून में और रोपाई जुलाई में की जाती है।",
                    'audio_text': "चावल की खेती जून-जुलाई में होती है।",
                    'solution': "Nursery: May-June, Transplanting: July",
                    'timing': "Monsoon (Kharif)"
                }
             else:
                return {
                    'text': "Rice is a Kharif crop. Nursery preparation starts in May-June, transplanting in July.",
                    'audio_text': "Rice farming is done in June-July.",
                    'solution': "Transplanting: July",
                    'timing': "Monsoon (Kharif)"
                }
                
        if 'wheat' in text or 'gehun' in text or 'गेहूं' in text:
             if is_hindi:
                return {
                    'text': "गेहूं रबी की फसल है। इसकी बुआई 15 नवंबर से 15 दिसंबर के बीच सबसे अच्छी मानी जाती है।",
                    'audio_text': "गेहूं की बुआई नवंबर-दिसंबर में करें।",
                    'solution': "Sowing: Nov 15 - Dec 15",
                    'timing': "Winter (Rabi)"
                }
             else:
                return {
                    'text': "Wheat is a Rabi crop. Best sowing time is 15th November to 15th December.",
                    'audio_text': "Sow wheat in November to December.",
                    'solution': "Sowing: Nov 15 - Dec 15",
                    'timing': "Winter (Rabi)"
                }

        # If we detected "farming query" but didn't match a crop above, try Groq for specific answer
        return self.call_groq_api(text, is_hindi)

    def call_groq_api(self, text, is_hindi):
        """Call Groq API for general queries with fallback"""
        if not self.client:
            return self.handle_general_fallback(text, is_hindi)

        try:
             # Construct the prompt
            system_instruction = """You are AgriSphere AI, an expert agricultural assistant for Indian farmers. 
            You provide accurate, practical farming advice strictly following ICAR (Indian Council of Agricultural Research) and FAO protocols.
            
            Analyze the following user query and provide a JSON response.
            The user might ask in English or Hindi. You MUST reply in the SAME language as the query (English or Hindi).
            
            Required JSON Structure:
            {
                "text": "Detailed, helpful answer (2-3 sentences max).",
                "audio_text": "A shorter, conversational version for text-to-speech (1 sentence).",
                "solution": "Key action item or direct solution (very brief).",
                "timing": "Best time to apply/do this (optional, string)."
            }
            
            Do NOT use markdown code blocks. Just valid JSON string.
            If the query is irrelevant to agriculture, politely steer back to farming.
            """
            
            completion = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": text}
                ],
                temperature=0.7,
                max_tokens=300,
                top_p=1,
                stream=False,
                stop=None,
            )

            response_text = completion.choices[0].message.content.strip()
            
            # Clean up if the model wrapped it in markdown
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
                
            response_data = json.loads(response_text)
            return response_data
            
        except Exception as e:
            print(f"Groq API Error: {e}")
            return self.handle_general_fallback(text, is_hindi)

    def handle_disease_query(self, text, is_hindi):
        """Handle disease-related queries"""
        # Detect crop type
        crop = self.detect_crop(text)
        
        if 'wheat' in text or 'gehun' in text or 'गेहूं' in text:
            disease_info = self.knowledge_base['diseases']['wheat_rust']
            if is_hindi:
                return {
                    'text': f"गेहूं में रतुआ रोग हो सकता है। उपचार: {disease_info['treatment']}। बचाव: {disease_info['prevention']}।",
                    'audio_text': f"गेहूं में रतुआ रोग है। प्रोपिकोनाजोल का छिड़काव करें।",
                    'solution': disease_info['treatment'],
                    'prevention': disease_info['prevention']
                }
            else:
                return {
                    'text': f"Wheat rust disease detected. Treatment: Apply propiconazole fungicide spray.",
                    'audio_text': "Wheat rust disease detected. Apply fungicide spray.",
                    'solution': "Apply propiconazole or tebuconazole spray",
                    'prevention': "Use resistant varieties"
                }
        
        elif 'tomato' in text or 'tamatar' in text or 'टमाटर' in text:
            disease_info = self.knowledge_base['diseases']['tomato_blight']
            if is_hindi:
                return {
                    'text': f"{disease_info['hindi']} हो सकता है। उपचार: {disease_info['treatment']}",
                    'audio_text': f"टमाटर में झुलसा रोग है। कॉपर सल्फेट का छिड़काव करें।",
                    'solution': disease_info['treatment'],
                    'prevention': disease_info['prevention']
                }
        
        # If specific disease not found, use Groq
        return self.call_groq_api(text, is_hindi)
    
    def handle_fertilizer_query(self, text, is_hindi):
        """Handle fertilizer-related queries"""
        if any(word in text for word in ['yellow', 'peela', 'पीला', 'nitrogen']):
            fert_info = self.knowledge_base['fertilizers']['nitrogen_deficiency']
            if is_hindi:
                return {
                    'text': f"{fert_info['hindi']} हो सकती है। उपचार: {fert_info['treatment']}",
                    'audio_text': "नाइट्रोजन की कमी है। यूरिया डालें।",
                    'solution': fert_info['treatment'],
                    'timing': fert_info['timing']
                }
        return self.call_groq_api(text, is_hindi)
    
    def handle_irrigation_query(self, text, is_hindi):
        """Handle irrigation queries"""
        crop = self.detect_crop(text)
        if crop == 'wheat':
            irr_info = self.knowledge_base['irrigation']['wheat']
            if is_hindi:
                return {
                    'text': f"{irr_info['hindi']}: {irr_info['frequency']} सिंचाई करें।",
                    'audio_text': "गेहूं में 15-20 दिन के अंतराल पर सिंचाई करें।",
                    'solution': f"Frequency: {irr_info['frequency']}",
                    'amount': irr_info['water_amount']
                }
        return self.call_groq_api(text, is_hindi)
    
    def handle_pest_query(self, text, is_hindi):
        """Handle pest-related queries"""
        return self.call_groq_api(text, is_hindi)
    
    def handle_harvest_query(self, text, is_hindi):
        """Handle harvest timing queries"""
        crop = self.detect_crop(text)
        if is_hindi:
            if crop == 'wheat':
                return {
                    'text': "गेहूं की कटाई मार्च-अप्रैल में करें जब दाने सुनहरे हो जाएं।",
                    'audio_text': "गेहूं की कटाई मार्च-अप्रैल में करें।",
                    'solution': "Harvest when grains turn golden",
                    'timing': "March-April"
                }
        return self.call_groq_api(text, is_hindi)
    
    def handle_weather_query(self, text, is_hindi):
        """Handle weather-related queries"""
        return self.call_groq_api(text, is_hindi)
    
    def handle_general_fallback(self, text, is_hindi):
        """Handle general farming queries when AI fails"""
        if is_hindi:
            return {
                'text': "मैं AgriSphere AI हूं। तकनीकी समस्या के कारण में संपर्क नहीं कर पा रहा।",
                'audio_text': "तकनीकी समस्या है। कृपया बाद में प्रयास करें।",
                'solution': "Server busy, try again later",
                'examples': ["फसल में रोग", "खाद की मात्रा", "सिंचाई का समय"]
            }
        else:
            return {
                'text': "I am AgriSphere AI. Due to technical issues, I cannot connect right now. Please try again later.",
                'audio_text': "Technical issue. Please try again later.",
                'solution': "Server busy, try again later",
                'examples': ["Crop diseases", "Fertilizer advice", "Irrigation timing"]
            }
    
    def detect_crop(self, text):
        """Detect crop type from text"""
        crop_keywords = {
            'wheat': ['wheat', 'gehun', 'गेहूं'],
            'rice': ['rice', 'dhan', 'धान', 'chawal', 'चावल'],
            'tomato': ['tomato', 'tamatar', 'टमाटर'],
            'potato': ['potato', 'aloo', 'आलू'],
            'cotton': ['cotton', 'kapas', 'कपास'],
            'sugarcane': ['sugarcane', 'ganna', 'गन्ना']
        }
        
        for crop, keywords in crop_keywords.items():
            if any(keyword in text for keyword in keywords):
                return crop
        
        return 'general'

# Example usage and testing
def test_voice_assistant():
    """Test the voice assistant with sample queries"""
    assistant = AgriVoiceAssistant()
    
    test_queries = [
        "गेहूं में रोग आ गया है, क्या करें?",
        "What is the best fertilizer for tomatoes?"
    ]
    
    print("AgriSphere AI Voice Assistant Test (Groq Powered)")
    print("=" * 50)
    
    for query in test_queries:
        print(f"\nQuery: {query}")
        response = assistant.process_voice_input(query)
        print(f"Response: {response}")

if __name__ == "__main__":
    test_voice_assistant()