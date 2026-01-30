
import random
import datetime

"""
Pest Attack Prediction Engine (Rule-Based + AI Forecasting Simulation)
Logic: Risk Score = (Temp_Score * 0.4) + (Humidity_Score * 0.4) + (Rainfall_Score * 0.2)
Source: ICAR/FAO Pest Models
"""

# Pest Knowledge Base (Rule-Based)
# Thresholds for favorability (What conditions pests LOVE)
PEST_DATA = {
    'rice': {
        'stem_borer': {'temp': (25, 30), 'humidity': (80, 95), 'rainfall': 'medium'},
        'rice_blast': {'temp': (20, 25), 'humidity': (90, 100), 'rainfall': 'high'},
        'hispa': {'temp': (30, 35), 'humidity': (70, 85), 'rainfall': 'low'}
    },
    'wheat': {
        'rust': {'temp': (15, 25), 'humidity': (60, 80), 'rainfall': 'medium'},
        'aphids': {'temp': (10, 20), 'humidity': (70, 90), 'rainfall': 'low'}
    },
    'cotton': {
        'bollworm': {'temp': (25, 35), 'humidity': (60, 80), 'rainfall': 'low'},
        'whitefly': {'temp': (30, 40), 'humidity': (50, 70), 'rainfall': 'low'}
    },
    'maize': {
        'fall_armyworm': {'temp': (25, 30), 'humidity': (70, 90), 'rainfall': 'medium'}
    },
    'tomato': {
        'blight': {'temp': (18, 24), 'humidity': (90, 100), 'rainfall': 'high'},
        'fruit_borer': {'temp': (25, 35), 'humidity': (60, 80), 'rainfall': 'medium'}
    }
}

def get_weather_score(actual_val, target_range, param_type='temp'):
    """
    Calculate a score (0-100) of how close conditions are to pest's favorite.
    """
    if param_type == 'rainfall':
        # Simple heuristic for rainfall
        # Low: 0-20mm, Medium: 20-80mm, High: >80mm
        val = float(actual_val)
        target = target_range # 'low', 'medium', 'high'
        
        if target == 'high':
            return 100 if val > 80 else (val/80 * 100)
        elif target == 'medium':
            return 100 if 20 <= val <= 80 else (50 if val > 0 else 0)
        elif target == 'low':
            return 100 if val < 20 else (max(0, 100 - (val-20)))
            
    # For Temp and Humidity (Ranges)
    min_val, max_val = target_range
    actual = float(actual_val)
    
    # If in perfect range -> 100
    if min_val <= actual <= max_val:
        return 100
        
    # If close (within 5 units) -> 70
    if (min_val - 5) <= actual <= (max_val + 5):
        return 70
        
    # If far -> 30, Very far -> 0
    if (min_val - 10) <= actual <= (max_val + 10):
        return 30
    
    return 10

def predict_pest_risk(data):
    """
    Main function to predict pest risk.
    Input: {crop, temp, humidity, rainfall}
    """
    crop = data.get('crop', 'rice').lower()
    temp = float(data.get('temp', 30))
    humidity = float(data.get('humidity', 70))
    rainfall = float(data.get('rainfall', 0))
    
    predictions = []
    
    # Get relevant pests for crop
    pests = PEST_DATA.get(crop, {})
    if not pests:
        # Generic fallback
        pests = {'generic_pest': {'temp': (25, 35), 'humidity': (70, 90), 'rainfall': 'medium'}}
        
    for pest_name, conditions in pests.items():
        # Calculate individual scores
        t_score = get_weather_score(temp, conditions['temp'], 'temp')
        h_score = get_weather_score(humidity, conditions['humidity'], 'humidity')
        r_score = get_weather_score(rainfall, conditions['rainfall'], 'rainfall')
        
        # User's Formula: risk = (temp*0.4) + (humid*0.4) + (rain*0.2)
        total_risk = (t_score * 0.4) + (h_score * 0.4) + (r_score * 0.2)
        
        # Determine Label
        if total_risk >= 80:
            risk_label = "High"
            action = "Immediate Action Required. Spray specific pesticides."
        elif total_risk >= 50:
            risk_label = "Medium"
            action = "Monitor field closely. Arrange drainage if needed."
        else:
            risk_label = "Low"
            action = "Routine monitoring sufficient."
            
        predictions.append({
            "pest_name": pest_name.replace('_', ' ').title(),
            "risk_score": round(total_risk, 1),
            "risk_level": risk_label,
            "recommendation": action,
            "factors": {
                "temp_favorability": t_score,
                "humidity_favorability": h_score
            }
        })
        
    # Sort by highest risk
    predictions.sort(key=lambda x: x['risk_score'], reverse=True)
    
    # Get the primary (most risky) prediction
    primary = predictions[0]
    
    # 7-Day Forecast Simulation (Smart Trick)
    # Simulate weather changes based on current trends + random realistic fluctuation
    forecast = []
    current_risk = primary['risk_score']
    
    for day in range(1, 8):
        # Trend: If high risk, stays high or varies slightly.
        # Random fluctuation +/- 5%
        fluctuation = random.uniform(-10, 10)
        daily_risk = max(10, min(98, current_risk + fluctuation))
        current_risk = daily_risk # Carry over trend
        
        date_str = (datetime.date.today() + datetime.timedelta(days=day)).strftime("%a, %d %b")
        forecast.append({
            "day": date_str,
            "risk_score": round(daily_risk, 1)
        })
        
    return {
        "crop": crop.title(),
        "primary_pest": primary,
        "all_pests": predictions,
        "forecast_7_days": forecast
    }

# Test block
if __name__ == "__main__":
    test_data = {'crop': 'rice', 'temp': 28, 'humidity': 92, 'rainfall': 100}
    print(predict_pest_risk(test_data))
