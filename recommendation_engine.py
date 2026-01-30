
# Fertilizer & Irrigation Recommendation Engine
# Uses Rule-Based Logic + Light ML principles

# Reference Data (ICAR / FAO style tables)
# In a real app, this would be in a database
FERTILIZER_TABLES = {
    "rice": {
        "N": {"low": 120, "medium": 80, "high": 40},
        "P": {"low": 60, "medium": 40, "high": 20},
        "K": {"low": 40, "medium": 20, "high": 0}
    },
    "wheat": {
        "N": {"low": 100, "medium": 60, "high": 30},
        "P": {"low": 50, "medium": 30, "high": 15},
        "K": {"low": 30, "medium": 15, "high": 0}
    },
    "default": { # Fallback for other crops
        "N": {"low": 100, "medium": 50, "high": 25},
        "P": {"low": 50, "medium": 25, "high": 12},
        "K": {"low": 50, "medium": 25, "high": 12}
    }
}

def get_fertilizer_recommendation(crop, soil_n, soil_p, soil_k):
    """
    Returns fertilizer recommendation (N, P, K) in kg/ha based on crop and soil nutrient levels.
    """
    crop_key = crop.lower().strip()
    if crop_key not in FERTILIZER_TABLES:
        crop_key = "default"
    
    table = FERTILIZER_TABLES[crop_key]
    
    # Normalize inputs to lowercase
    n_level = soil_n.lower() if soil_n else "medium"
    p_level = soil_p.lower() if soil_p else "medium"
    k_level = soil_k.lower() if soil_k else "medium"
    
    # Simple validation/fallback
    valid_levels = ["low", "medium", "high"]
    if n_level not in valid_levels: n_level = "medium"
    if p_level not in valid_levels: p_level = "medium"
    if k_level not in valid_levels: k_level = "medium"

    return {
        "nitrogen": f"{table['N'][n_level]} kg/ha",
        "phosphorus": f"{table['P'][p_level]} kg/ha",
        "potassium": f"{table['K'][k_level]} kg/ha"
    }

def get_irrigation_recommendation(soil_moisture, rainfall_forecast, crop_stage):
    """
    Returns irrigation schedule based on soil moisture and rainfall forecast.
    """
    recommendation = {}
    
    # Basic logic from user prompt
    # IF soil moisture < threshold → Recommend irrigation
    # IF rainfall forecast > X → Reduce water schedule
    
    # Thresholds can be adjusted by crop, but using generic specific logic here
    MOISTURE_THRESHOLD_LOW = 30
    MOISTURE_THRESHOLD_MED = 45
    RAINFALL_HEAVY_THRESHOLD = 10 # mm
    
    # Determine immediate need
    if soil_moisture < MOISTURE_THRESHOLD_LOW:
        if rainfall_forecast > RAINFALL_HEAVY_THRESHOLD:
             # It's dry, but rain is coming
             status = "Delay Irrigation"
             details = f"Soil is dry ({soil_moisture}%), but heavy rainfall ({rainfall_forecast}mm) is forecasted. Wait for rain."
             water_amount = "0 mm"
        else:
             status = "Irrigate Immediately"
             details = "Soil moisture is critically low. Irrigate within 24 hours."
             water_amount = "25-30 mm" # General baseline
             
    elif soil_moisture < MOISTURE_THRESHOLD_MED:
         if rainfall_forecast > 5:
             status = "No Irrigation Needed"
             details = "Moisture is moderate and rain is expected."
             water_amount = "0 mm"
         else:
             status = "Light Irrigation Advised"
             details = "Soil moisture is depleting. Schedule light irrigation in next 2 days."
             water_amount = "15-20 mm"
    else:
        status = "No Irrigation Needed"
        details = "Soil moisture is sufficient."
        water_amount = "0 mm"

    # Schedule Logic
    recommendation = {
        "status": status,
        "details": details,
        "water_amount": water_amount,
        "schedule": {
            "today": status,
            "next_3_days": "Rain Expected" if rainfall_forecast > 5 else "Monitor Moisture" 
        }
    }
    
    return recommendation

def engine_run(data):
    """
    Main entry point for the recommendation engine.
    Expected data dict keys:
    - crop (str)
    - soil_n, soil_p, soil_k (str: 'low', 'medium', 'high')
    - soil_moisture (float/int)
    - rainfall (float/int) - forecast or last 7 days
    - stage (str) - optional
    """
    crop = data.get('crop', 'rice')
    soil_n = data.get('soil_n', 'medium')
    soil_p = data.get('soil_p', 'medium')
    soil_k = data.get('soil_k', 'medium')
    soil_moisture = float(data.get('soil_moisture', 50))
    rainfall = float(data.get('rainfall', 0))
    stage = data.get('stage', 'vegetative')
    
    
    # pH Logic
    ph_status = "Normal"
    ph_recommendation = ""
    soil_ph = float(data.get('soil_ph', 6.5))
    
    if soil_ph < 5.5:
        ph_status = "Acidic"
        ph_recommendation = "Apply Lime (CaCO3) @ 2-3 tonnes/ha during land preparation to neutralize acidity."
    elif soil_ph > 8.5:
        ph_status = "Alkaline"
        ph_recommendation = "Apply Gypsum @ 2-5 tonnes/ha to reduce alkalinity."

    # Light ML / Smart Adjustment Logic
    # Adjust NPK based on rainfall (Leaching risk) and Temperature (Volatilization risk)
    # Simple heuristic "Weights" simulating a model
    
    # Calculate base recommendations
    fert_rec = get_fertilizer_recommendation(crop, soil_n, soil_p, soil_k)
    irri_rec = get_irrigation_recommendation(soil_moisture, rainfall, stage)
    
    # Parse base values
    n_val = int(fert_rec['nitrogen'].split()[0])
    p_val = int(fert_rec['phosphorus'].split()[0])
    k_val = int(fert_rec['potassium'].split()[0])
    
    adjustments = []
    
    # 1. High Rainfall -> Nitrogen Leaching Risk -> Split application or increase slightly to compensate
    if rainfall > 100: # Heavy rain forecast/recent
        n_val += 10 
        adjustments.append("Increased N (+10kg) due to leaching risk from heavy rain.")
        
    # 2. High Temp -> Volatilization of Urea -> Recommend splitting
    temp = float(data.get('temperature', 25))
    if temp > 35:
        adjustments.append("High temperature detected. Split Nitrogen application to reduce volatilization loss.")

    return {
        "source": "ICAR Soil Health Card / FAO Norms",
        "fertilizer": {
            "nitrogen": f"{n_val} kg/ha",
            "phosphorus": f"{p_val} kg/ha",
            "potassium": f"{k_val} kg/ha",
            "adjustments": adjustments
        },
        "soil_health": {
            "ph_status": ph_status,
            "recommendation": ph_recommendation
        },
        "irrigation": irri_rec,
        "inputs_used": {
            "crop": crop,
            "soil_health": {"N": soil_n, "P": soil_p, "K": soil_k, "pH": soil_ph},
            "environment": {"moisture": soil_moisture, "rainfall": rainfall, "temp": temp}
        }
    }
