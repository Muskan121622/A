
import datetime
import random
import os
import json
from groq import Groq
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
GROQ_API_KEY = os.environ.get("GROQ_API_KEY") or os.environ.get("VITE_GROQ_CHATBOT_API_KEY")

"""
Seed-to-Market Advisory Engine
Provides end-to-end intelligence:
1. Seed Selection & Sowing
2. Fertilizer & Irrigation
3. Harvest Prediction
4. Market Forecast & Selling Options
"""

def generate_ai_advisory(crop, sowing_date, acres, current_price, state="India"):
    """
    Uses Groq API to generate detailed agronomic and market advice based on the specific state.
    """
    try:
        client = Groq(
            api_key=GROQ_API_KEY,
        )

        prompt = f"""
    You are an expert agricultural consultant for farmers in {state}, India. 
    The farmer is growing {crop}. 
    Sowing date was {sowing_date}. 
    Field size is {acres} acres.
    Current market price is ₹{current_price}/Quintal.

    Analyze the situation and provide a strictly valid JSON response.
    Do NOT use markdown code blocks. Just the raw JSON.
    
    CRITICAL: FIRST, validate if growing {crop} in {state} during this month (based on sowing date) is agronomically suitable.
    Strictly follow these Indian Season Rules:
    - Wheat (Rabi): Must be sown in Oct, Nov, or Dec. Sowing in Summer (May-Aug) is IMPOSSIBLE/WRONG.
    - Rice/Paddy (Kharif): Typically sown in June-July.
    - Cotton: Sown in April-May (North) or June-July (Central/South).
    - Maize: Kharif (June-July), Rabi (Oct-Nov), or Spring.
    - Mustard: Rabi (Oct-Nov).
    
    If data violates these rules, set is_valid to false and provide a warning.

    Structure:
    {{
        "seasonality_check": {{
            "is_valid": true/false,
            "message": "Start with '⚠️ Warning:' if invalid. Explain WHY the crop/date combination is risky or wrong. If valid, leave empty or 'Good timing'."
        }},
        "crop": "{crop}",
        "state": "{state}",
        "stage_1": {{
            "seed_varieties": ["Variety 1", "Variety 2"],
            "seed_treatment": "Chemicals to use",
            "recommended_technique": "How to sow",
            "voice_summary_en": "Short conversational summary of seed advice in English (max 2 sentences).",
            "voice_summary_hi": "Short conversational summary of seed advice in Hindi (max 2 sentences)."
        }},
        "stage_2": {{
            "fertilizer_plan": "Basal and top dressing detailed",
            "irrigation_schedule": "When to water",
            "pest_protection": "What to watch for",
            "voice_summary_en": "Short conversational summary of growth advice in English.",
            "voice_summary_hi": "Short conversational summary of growth advice in Hindi."
        }},
        "stage_3": {{
            "days_remaining": 120,
            "harvest_window": "DD Mon - DD Mon YYYY",
            "harvest_signs": "Visual signs of maturity",
            "post_harvest_care": "Drying and storage tips",
            "voice_summary_en": "Short conversational summary of harvest advice in English.",
            "voice_summary_hi": "Short conversational summary of harvest advice in Hindi."
        }},
        "stage_4": {{
            "current_price": {current_price},
            "estimated_revenue": "₹XXXXX",
            "trend": "Bullish/Bearish/Stable",
            "forecast": [
                {{"week": "Week 1", "price": 0}},
                {{"week": "Week 2", "price": 0}},
                {{"week": "Week 3", "price": 0}},
                {{"week": "Week 4", "price": 0}}
            ],
            "best_mandi": "Name of best nearby mandi in {state}",
            "voice_summary_en": "Short conversational market advice and mandi recommendation in English.",
            "voice_summary_hi": "Short conversational market advice and mandi recommendation in Hindi."
        }}
    }}
    """

        completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.5,
            response_format={"type": "json_object"}
        )

        return json.loads(completion.choices[0].message.content)

    except Exception as e:
        print(f"Error generating AI advisory: {e}")
        return {} # Fallback to empty dict if AI fails

def analyze_market(data):
    """
    Input: { "crop": "Rice", "sowing_date": "YYYY-MM-DD", "acres": 5, "state": "Punjab" }
    """
    crop = data.get('crop', 'rice').lower()
    sowing_date_str = data.get('sowing_date', datetime.date.today().strftime("%Y-%m-%d"))
    state = data.get('state', 'India')
    
    try:
        acres = float(data.get('acres', 1))
    except (ValueError, TypeError):
        acres = 1.0

    try:
        sowing_date = datetime.datetime.strptime(sowing_date_str, "%Y-%m-%d").date()
    except ValueError:
        sowing_date = datetime.date.today()

    # 1. Base Simulations (Quantitative)
    harvest_data = calculate_harvest_window(crop, sowing_date)
    market_data = simulate_market_prices(crop)
    
    # 2. AI Advisory Generation (Qualitative)
    # Use Groq to fill in specific agronomic advice
    ai_advisory = generate_ai_advisory(crop, sowing_date_str, acres, market_data['current_price'], state)
    
    # Merge Quantitative and Qualitative data into standard sections
    # Note: ai_advisory structure depends on the Prompt above (nested stage_X objects)
    return {
        "crop": crop.title(),
        "sowing_date": sowing_date.strftime("%Y-%m-%d"),
        "acres": acres,
        "state": state,
        "seasonality_check": ai_advisory.get('seasonality_check', {'is_valid': True, 'message': ''}),
        
        # Section 1: Pre-Sowing
        "stage_1": {
            "title": "Seed & Sowing",
            "recommended_technique": ai_advisory.get('stage_1', {}).get('recommended_technique', 'Standard drilling method'),
            "seed_varieties": ai_advisory.get('stage_1', {}).get('seed_varieties', ['Standard High Yield']),
            "seed_treatment": ai_advisory.get('stage_1', {}).get('seed_treatment', 'Treat with fungicide'),
            "voice_summary_en": ai_advisory.get('stage_1', {}).get('voice_summary_en', f"Here is the sowing advice for {crop}."),
            "voice_summary_hi": ai_advisory.get('stage_1', {}).get('voice_summary_hi', f"यहा {crop} की बुआई की सलाह है।")
        },
        
        # Section 2: Growth (Fertilizer & Irrigation)
        "stage_2": {
            "title": "Growth & Nutrition",
            "fertilizer_plan": ai_advisory.get('stage_2', {}).get('fertilizer_plan', 'Apply standard NPK'),
            "irrigation_schedule": ai_advisory.get('stage_2', {}).get('irrigation_schedule', 'Irrigate as needed'),
            "pest_protection": ai_advisory.get('stage_2', {}).get('pest_protection', 'Monitor for pests'),
            "voice_summary_en": ai_advisory.get('stage_2', {}).get('voice_summary_en', "Follow the fertilizer and irrigation plan."),
            "voice_summary_hi": ai_advisory.get('stage_2', {}).get('voice_summary_hi', "खाद और सिंचाई योजना का पालन करें।")
        },
        
        # Section 3: Harvest
        "stage_3": {
            "title": "Harvest Planning",
            "harvest_window": f"{harvest_data['start'].strftime('%d %b')} - {harvest_data['end'].strftime('%d %b %Y')}",
            "days_remaining": harvest_data['days_remaining'],
            "harvest_signs": ai_advisory.get('stage_3', {}).get('harvest_signs', 'Grains harden and change color'),
            "post_harvest_care": ai_advisory.get('stage_3', {}).get('post_harvest_care', 'Dry grain to 12% moisture'),
            "voice_summary_en": ai_advisory.get('stage_3', {}).get('voice_summary_en', "Harvest when mature."),
            "voice_summary_hi": ai_advisory.get('stage_3', {}).get('voice_summary_hi', "फसल पकने पर कटाई करें।")
        },
        
        # Section 4: Market & Sales
        "stage_4": {
            "title": "Market & Sales",
            "current_price": market_data['current_price'],
            "forecast": market_data['forecast'],
            "trend": market_data['trend'],
            "best_mandi": ai_advisory.get('stage_4', {}).get('best_mandi', f'Major {state} Mandi'),
            "estimated_revenue": calculate_revenue(crop, acres, market_data['current_price']),
            "voice_summary_en": ai_advisory.get('stage_4', {}).get('voice_summary_en', "Check market prices before selling."),
            "voice_summary_hi": ai_advisory.get('stage_4', {}).get('voice_summary_hi', "बेचने से पहले बाजार भाव चेक करें।")
        },
        
        "generated_at": datetime.datetime.now().strftime("%I:%M %p")
    }

def calculate_harvest_window(crop, sowing_date):
    # Simplified maturity days
    maturity_map = {
        'rice': (120, 150), 'wheat': (110, 140), 'cotton': (150, 180),
        'maize': (90, 110), 'tomato': (60, 80), 'potato': (90, 120),
        'sugarcane': (300, 365)
    }
    min_days, max_days = maturity_map.get(crop, (90, 120))
    
    start = sowing_date + datetime.timedelta(days=min_days)
    end = sowing_date + datetime.timedelta(days=max_days)
    days_remaining = (start - datetime.date.today()).days
    
    return {
        "start": start, "end": end, 
        "days_remaining": max(0, days_remaining)
    }

def simulate_market_prices(crop):
    # Simulation logic (preserved/simplified from original)
    base_prices = {'rice': 2200, 'wheat': 2125, 'cotton': 6000, 'maize': 2090, 
                   'tomato': 1500, 'potato': 1200, 'sugarcane': 315}
                   
    base = base_prices.get(crop, 2000)
    volatility = 0.05
    
    # Current fluctuation
    current_price = int(base * (1 + random.uniform(-volatility, volatility)))
    
    # Forecast
    forecast = []
    trend_type = random.choice(['Bullish', 'Bearish', 'Stable'])
    trend_factor = 0.02 if trend_type == 'Bullish' else -0.02 if trend_type == 'Bearish' else 0
    
    temp_price = current_price
    for i in range(1, 5):
        change = random.uniform(-0.01, 0.01) + trend_factor
        temp_price = int(temp_price * (1 + change))
        forecast.append({"week": f"Week {i}", "price": temp_price})
        
    return {"current_price": current_price, "forecast": forecast, "trend": trend_type}

def calculate_revenue(crop, acres, price):
    # Yield in Quintals per acre
    yields = {'rice': 25, 'wheat': 20, 'cotton': 10, 'maize': 30, 'tomato': 150, 'potato': 100}
    estimated_yield = yields.get(crop, 20) * acres
    return f"₹{int(estimated_yield * price):,}"

def get_market_prices(state, district, market, category="Use best judgement"):
    """
    Fetch/Simulate real-time market prices using Groq AI.
    """
    try:
        from groq import Groq
        client = Groq(api_key=GROQ_API_KEY)
        
        category_str = "vegetables and fruits" if not category or category == "All" else category
        
        prompt = f"""
        You are a Real-Time Agriculture Market Price API for India (Agmarknet).
        Provide the CURRENT market prices for '{category_str}' in:
        State: {state}
        District: {district}
        (Focus on the primary mandi in this district)

        Return a comprehensive list of at least 8-10 key commodities available in this market right now.
        Include correct varieties (e.g., Tomato - Hybrid, Potato - Desi).
        
        CRITICAL: Prices must be in **₹ per kg** (Kilogram). Do NOT use Quintals.
        
        STRICT JSON FORMAT ONLY:
        [
            {{
                "commodity": "Name",
                "variety": "Variety",
                "min_price": 20,
                "max_price": 30,
                "modal_price": 25,
                "date": "{datetime.date.today().strftime('%d %b %Y')}"
            }}
        ]
        """
        
        completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        
        # Parse response (Groq might return {"commodities": [...] } or just [...])
        content = completion.choices[0].message.content
        data = json.loads(content)
        
        if isinstance(data, list):
            return data
        elif isinstance(data, dict):
            # Try to find the list inside
            for key, val in data.items():
                if isinstance(val, list):
                    return val
            return []
            
        return []

    except Exception as e:
        print(f"Error fetching market prices: {e}")
        return []

def get_buyer_insights(crop, state, district=""):
    """
    Generate AI-driven buying insights for a specific crop/location.
    """
    try:
        from groq import Groq
        client = Groq(api_key=GROQ_API_KEY)

        # Get simulated/real price to ground the AI's analysis
        price_data = simulate_market_prices(crop)
        current_price = price_data.get('current_price', 'N/A')
        
        prompt = f"""
        You are a Strategic Agricultural Procurement Advisor for a bulk buyer.
        Provide market intelligence for:
        Crop: {crop}
        Location: {district}, {state}, India
        Current Market Price: ₹{current_price}/Quintal
        
        Analyze current trends and provide 3 strategic insights aimed at a BUYER (trader/retailer).
        
        Insights should cover:
        1. Price Trend (Rising/Falling and why)
        2. Best Procurement Strategy (Buy now vs Wait)
        3. Quality/Logistics Advice (e.g., "Sourcing from X district is better due to low moisture")
        
        RETURN JSON Structure:
        {{
            "analysis_brief": "Short summary of the market situation (max 2 sentences).",
            "demand_indicator": "High" | "Medium" | "Low",
            "price_forecast": "Likely to Rise" | "Stable" | "Likely to Drop",
            "msp_comparison": "Above MSP" | "Below MSP" | "Near MSP",
            "current_price": {current_price}, 
            "insights": [
                {{
                    "type": "Trend",
                    "text": "..."
                }},
                {{
                    "type": "Strategy",
                    "text": "..."
                }},
                {{
                    "type": "Logistics",
                    "text": "..."
                }}
            ]
        }}
        """
        
        completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.4,
            response_format={"type": "json_object"}
        )
        
        content = completion.choices[0].message.content
        result = json.loads(content)
        # Ensure price is passed through even if AI misses it
        result['current_price'] = current_price
        return result
        
    except Exception as e:
        print(f"Error generating buyer insights: {e}")
        import traceback
        traceback.print_exc()
        return {
            "analysis_brief": "Unable to generate insights at the moment.",
            "demand_indicator": "Medium",
            "current_price": "N/A",
            "insights": []
        }

if __name__ == "__main__":
    # Test
    print(analyze_market({'crop': 'rice', 'state': 'Punjab'}))
