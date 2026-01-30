from flask import Flask, request, jsonify, make_response
from flask_cors import CORS, cross_origin
import joblib
import pandas as pd
import numpy as np
import os
import tempfile
import json
from PIL import Image
from scipy import ndimage
from datetime import datetime
from improved_voice_assistant import AgriVoiceAssistant
import recommendation_engine
import pest_engine
import market_engine
import market_engine
import base64
import uuid

MARKET_DATA_FILE = "market_data.json"
LISTINGS_FILE = "listings.json"
COMMUNITY_DATA_FILE = "community_data.json"
CROP_LOSS_FILE = "crop_loss_data.json"
DEMANDS_FILE = "demands.json"

def load_demands():
    if os.path.exists(DEMANDS_FILE):
        try:
            with open(DEMANDS_FILE, 'r') as f:
                return json.load(f)
        except:
            return []
    return []

def save_demands(data):
    with open(DEMANDS_FILE, 'w') as f:
        json.dump(data, f, indent=4)

def load_crop_loss_data():
    if os.path.exists(CROP_LOSS_FILE):
        try:
            with open(CROP_LOSS_FILE, 'r') as f:
                return json.load(f)
        except:
            return []
    return []

def save_crop_loss_data(data):
    with open(CROP_LOSS_FILE, 'w') as f:
        json.dump(data, f, indent=4)

def load_community_data():
    if os.path.exists(COMMUNITY_DATA_FILE):
        try:
            with open(COMMUNITY_DATA_FILE, 'r') as f:
                return json.load(f)
        except:
            return {"posts": [], "chat": []}
    return {"posts": [], "chat": []}

def save_community_data(data):
    with open(COMMUNITY_DATA_FILE, 'w') as f:
        json.dump(data, f, indent=4)

# Online User Tracking (In-Memory)
active_users = {} # { "User Name": "2024-01-01T12:00:00" }

def update_user_status(username):
    active_users[username] = datetime.now().isoformat()

def get_active_users():
    # Return users active in last 5 minutes
    current_time = datetime.now()
    active = []
    to_remove = []
    
    for user, last_seen_str in active_users.items():
        try:
            last_seen = datetime.fromisoformat(last_seen_str)
            if (current_time - last_seen).total_seconds() < 300: # 5 minutes
                active.append(user)
            else:
                to_remove.append(user)
        except:
            to_remove.append(user)
            
    # Cleanup old users
    for user in to_remove:
        del active_users[user]
        
    return active

def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def verify_plant_with_groq(image_path):
    """
    Verify if the uploaded image contains a plant using Groq's Llama 4 Scout model.
    Returns: (is_plant: bool, message: str)
    """
    try:
        from groq import Groq
        api_key = os.getenv("GROQ_API_KEY") or os.getenv("VITE_GROQ_CHATBOT_API_KEY")
        if not api_key:
            print("Groq API Key missing for plant verification")
            return True, "Verification skipped (No API Key)"

        client = Groq(api_key=api_key)
        base64_image = encode_image(image_path)

        prompt = "Strictly analyze this image. Is it a plant, crop, fruit, vegetable, leaf, or soil? Answer 'YES' only if it is clearly related to agriculture or nature. If it is a man-made object, animal, human, or random object (like candy, toy, car), answer 'NO'. Answer with just 'YES' or 'NO'."

        completion = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            temperature=0.1,
            max_tokens=10
        )
        
        response = completion.choices[0].message.content.strip().upper()
        print(f"Plant Verification Response: {response}")
        
        if "YES" in response:
            return True, "Plant detected"
        else:
            return False, response

    except Exception as e:
        print(f"Plant verification error: {e}")
        return True, f"Verification skipped (Error: {str(e)})" # Fail open on error

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}) # Enable CORS for all routes

# Initialize voice assistant
voice_assistant = AgriVoiceAssistant()

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

@app.before_request
def handle_options():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200


# Lazy loading for yield models (load only when needed)
yield_models_loaded = False
model = None
scalers = None
encoders = None
feature_columns = None

def load_yield_models():
    """Lazy load yield models only when first requested"""
    global yield_models_loaded, model, scalers, encoders, feature_columns
    print(f"load_yield_models called. Current state - yield_models_loaded: {yield_models_loaded}")
    if not yield_models_loaded:
        try:
            print("Attempting to load yield prediction models...")
            print("Loading model...")
            model = joblib.load('models/yield_prediction_model.pkl')
            print("Model loaded successfully")
            print("Loading scalers...")
            scalers = joblib.load('models/scalers.pkl')
            print("Scalers loaded successfully")
            print("Loading encoders...")
            encoders = joblib.load('models/encoders.pkl')
            print("Encoders loaded successfully")
            print("Loading feature columns...")
            feature_columns = joblib.load('models/feature_columns.pkl')
            print("Feature columns loaded successfully")
            yield_models_loaded = True
            print("Yield prediction models loaded successfully")
        except Exception as e:
            print(f"Yield prediction models not available: {e}")
            import traceback
            traceback.print_exc()
    print(f"load_yield_models returning: {yield_models_loaded}")
    return yield_models_loaded

def predict_disease_archive4(image_path, model_path="archive4_model_output/model.h5", labels_path="archive4_model_output/labels.json"):
    """Predict plant disease using Archive4 TensorFlow model"""
    try:
        import tensorflow as tf
        
        # Load model and labels
        model = tf.keras.models.load_model(model_path)
        with open(labels_path, 'r') as f:
            class_mapping = json.load(f)
        
        # Preprocess image
        img = Image.open(image_path)
        img = img.convert('RGB')
        img = img.resize((224, 224))
        img_array = np.array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)
        
        # Predict
        predictions = model.predict(img_array, verbose=0)
        predicted_class_idx = np.argmax(predictions[0])
        confidence = predictions[0][predicted_class_idx]
        
        # Get class name
        predicted_class = class_mapping[str(predicted_class_idx)]
        
        return predicted_class, confidence
    except Exception as e:
        print(f"Archive4 model prediction error: {e}")
        return None, None

def predict_disease(image_path, model_path="sklearn_model_output/model.pkl", labels_path="sklearn_model_output/labels.json"):
    """
    Predict plant disease from image using enhanced feature extraction
    """
    try:
        IMG_SIZE = 128  # Must match training size
        
        # Open and resize image
        img = Image.open(image_path).convert('RGB')
        img = img.resize((IMG_SIZE, IMG_SIZE))

        # Convert to numpy array
        img_array = np.array(img)

        # Extract enhanced features (same as training)
        # 1. Color histogram features (more bins for better detail)
        hist_r, _ = np.histogram(img_array[:,:,0], bins=64, range=(0, 256))
        hist_g, _ = np.histogram(img_array[:,:,1], bins=64, range=(0, 256))
        hist_b, _ = np.histogram(img_array[:,:,2], bins=64, range=(0, 256))
        
        # Normalize histograms
        hist_r = hist_r / (IMG_SIZE * IMG_SIZE)
        hist_g = hist_g / (IMG_SIZE * IMG_SIZE)
        hist_b = hist_b / (IMG_SIZE * IMG_SIZE)
        
        # 2. Statistical features per channel
        mean_rgb = np.mean(img_array, axis=(0, 1))
        std_rgb = np.std(img_array, axis=(0, 1))
        median_rgb = np.median(img_array, axis=(0, 1))
        min_rgb = np.min(img_array, axis=(0, 1))
        max_rgb = np.max(img_array, axis=(0, 1))
        
        # 3. Color space conversions
        hsv_img = img.convert('HSV')
        hsv_array = np.array(hsv_img)
        mean_hsv = np.mean(hsv_array, axis=(0, 1))
        std_hsv = np.std(hsv_array, axis=(0, 1))
        
        # 4. Texture features
        gray = np.mean(img_array, axis=2).astype(np.float32)
        laplacian = np.array([[0, 1, 0], [1, -4, 1], [0, 1, 0]])
        edges = ndimage.convolve(gray, laplacian)
        edge_mean = np.mean(np.abs(edges))
        edge_std = np.std(edges)
        
        # 5. Green channel analysis
        green_ratio = np.mean(img_array[:,:,1]) / (np.mean(img_array) + 1e-6)
        
        # 6. Disease color indicators
        brown_mask = (img_array[:,:,0] > 100) & (img_array[:,:,1] > 50) & (img_array[:,:,1] < 150) & (img_array[:,:,2] < 100)
        brown_ratio = np.sum(brown_mask) / (IMG_SIZE * IMG_SIZE)
        
        yellow_mask = (img_array[:,:,0] > 150) & (img_array[:,:,1] > 150) & (img_array[:,:,2] < 100)
        yellow_ratio = np.sum(yellow_mask) / (IMG_SIZE * IMG_SIZE)
        
        # 7. Spatial variance
        h, w = img_array.shape[:2]
        q1 = img_array[:h//2, :w//2]
        q2 = img_array[:h//2, w//2:]
        q3 = img_array[h//2:, :w//2]
        q4 = img_array[h//2:, w//2:]
        quad_means = np.array([np.mean(q1), np.mean(q2), np.mean(q3), np.mean(q4)])
        spatial_variance = np.std(quad_means)
        
        # 8. Combine all features
        features = np.concatenate([
            hist_r, hist_g, hist_b,
            mean_rgb, std_rgb, median_rgb, min_rgb, max_rgb,
            mean_hsv, std_hsv,
            [edge_mean, edge_std],
            [green_ratio, brown_ratio, yellow_ratio],
            [spatial_variance]
        ])
        features = features.reshape(1, -1)

        # Load model and labels
        model = joblib.load(model_path)

        with open(labels_path, 'r') as f:
            class_names = json.load(f)

        # Predict
        prediction = model.predict(features)[0]
        probabilities = model.predict_proba(features)[0]

        predicted_class = class_names[prediction]
        confidence = probabilities[prediction]

        return predicted_class, confidence
    except Exception as e:
        print(f"Error processing {image_path}: {e}")
        import traceback
        traceback.print_exc()
        return None, None

@app.route('/predict', methods=['POST'])
def predict_yield():
    print("Attempting to load yield models...")
    models_loaded = load_yield_models()
    print(f"Models loaded: {models_loaded}")
    if not models_loaded:
        print("Returning 503 error: Yield prediction models not available")
        return jsonify({'error': 'Yield prediction models not available'}), 503

    try:
        data = request.json

        # Create input dataframe
        # Use the same year normalization approach as in training
        # Based on the dataset range (2010 to 2023)
        year_min, year_max = 2010, 2023
        
        # Get historical average for better estimates
        hist_avg = get_historical_average(data['crop'], data['district'])
        
        input_data = pd.DataFrame([{
            'year_normalized': (data['year'] - year_min) / (year_max - year_min),
            'crop_encoded': encoders['crop'].transform([data['crop']])[0],
            'district_encoded': encoders['district'].transform([data['district']])[0],
            'season_encoded': encoders['season'].transform([data['season']])[0],
            'area_hectares': data['area_hectares'],
            'production_tonnes': data.get('production_tonnes', data['area_hectares'] * (hist_avg / 1000)),  # Convert kg to tonnes
            'area_log': np.log1p(data['area_hectares']),
            'production_log': np.log1p(data.get('production_tonnes', data['area_hectares'] * (hist_avg / 1000))),
            'yield_trend_3yr': data.get('yield_trend_3yr', hist_avg),
            'yield_trend_5yr': data.get('yield_trend_5yr', hist_avg)
        }])

        # Make prediction
        prediction = model.predict(input_data)[0]

        # Calculate confidence interval (±15%)
        lower = prediction * 0.85
        upper = prediction * 1.15

        return jsonify({
            'predicted_yield': float(prediction),
            'confidence_interval': {
                'lower': float(lower),
                'upper': float(upper)
            }
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/crops', methods=['GET'])
def get_crops():
    print("Attempting to load yield models for /crops...")
    models_loaded = load_yield_models()
    print(f"Models loaded for /crops: {models_loaded}")
    if not models_loaded:
        print("Returning 503 error for /crops: Yield prediction models not available")
        return jsonify({'error': 'Yield prediction models not available'}), 503
    return jsonify(encoders['crop'].classes_.tolist())

@app.route('/districts', methods=['GET'])
def get_districts():
    print("Attempting to load yield models for /districts...")
    models_loaded = load_yield_models()
    print(f"Models loaded for /districts: {models_loaded}")
    if not models_loaded:
        print("Returning 503 error for /districts: Yield prediction models not available")
        return jsonify({'error': 'Yield prediction models not available'}), 503
    return jsonify(encoders['district'].classes_.tolist())

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'message': 'API server is running'})

@app.route('/detect-disease', methods=['POST'])
def detect_disease():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400

        image_file = request.files['image']
        if image_file.filename == '':
            return jsonify({'error': 'No image selected'}), 400

        # Save uploaded image to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
            image_file.save(temp_file.name)
            temp_path = temp_file.name

        try:
            # 1. Verify if it is a plant using Groq Vision
            is_plant, verification_msg = verify_plant_with_groq(temp_path)
            if not is_plant:
                return jsonify({
                    'error': f"Cannot detect. This is not a plant. ({verification_msg})",
                    'is_plant': False
                }), 400

            # Try Archive4 model first (TensorFlow)
            if os.path.exists('archive4_model_output/model.h5'):
                predicted_class, confidence = predict_disease_archive4(temp_path)
                if predicted_class:
                    result = {
                        'disease': predicted_class,
                        'confidence': float(confidence),
                        'severity': 'high' if confidence > 0.8 else 'medium' if confidence > 0.6 else 'low',
                        'treatment': get_treatment_recommendation(predicted_class),
                        'affectedPart': get_affected_part(predicted_class),
                        'symptoms': get_symptoms(predicted_class),
                        'preventiveMeasures': get_preventive_measures(predicted_class),
                        'economicImpact': get_economic_impact(predicted_class),
                        'model': 'archive4_tensorflow'
                    }
                    return jsonify(result)
            
            # Fallback to sklearn model
            predicted_class, confidence = predict_disease(
                temp_path,
                model_path='sklearn_model_output/model.pkl',
                labels_path='sklearn_model_output/labels.json'
            )

            if predicted_class is None:
                return jsonify({'error': 'Failed to process image'}), 500

            # Map predictions to the expected format for frontend
            result = {
                'disease': predicted_class,
                'confidence': float(confidence),
                'severity': 'high' if confidence > 0.8 else 'medium' if confidence > 0.6 else 'low',
                'treatment': get_treatment_recommendation(predicted_class),
                'affectedPart': get_affected_part(predicted_class),
                'symptoms': get_symptoms(predicted_class),
                'preventiveMeasures': get_preventive_measures(predicted_class),
                'economicImpact': get_economic_impact(predicted_class),
                'model': 'sklearn'
            }

            return jsonify(result)

        finally:
            # Clean up temporary file
            os.unlink(temp_path)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

def smart_disease_lookup(disease_name, dictionary, default_value):
    """
    Smart lookup that handles specific names (e.g. Potato___early_blight)
    by trying exact match -> healthy -> mapped keywords -> default
    """
    if not disease_name:
        return default_value
        
    # 1. Exact match
    if disease_name in dictionary:
        return dictionary[disease_name]
        
    name_lower = disease_name.lower()
    
    # 2. Healthy check
    if 'healthy' in name_lower:
        return dictionary.get('healthy', default_value)
        
    # 3. Keyword mapping to generic keys
    keyword_map = {
        'early_blight': 'leaf_blight',
        'late_blight': 'leaf_blight', # Could be more specific if dict supported it
        'blight': 'leaf_blight',
        'rust': 'leaf_rust',
        'scab': 'scab',
        'powdery_mildew': 'powdery_mildew',
        'downy_mildew': 'downy_mildew',
        'mold': 'leaf_mold',
        'mildew': 'powdery_mildew',
        'mosaic': 'viral_disease',
        'virus': 'viral_disease',
        'mite': 'pest_infected',
        'spot': 'leaf_spot',
        'rot': 'rot',
        'wilt': 'bacterial_wilt',
        'curl': 'viral_disease',
        'anthracnose': 'anthracnose'
    }
    
    for keyword, target_key in keyword_map.items():
        if keyword in name_lower:
            return dictionary.get(target_key, default_value)
            
    return default_value

def get_treatment_recommendation(disease):
    treatments = {
        'healthy': 'No treatment needed - plant is healthy',
        'leaf_blight': 'Apply copper-based fungicide every 7-10 days, improve air circulation',
        'leaf_rust': 'Apply systemic fungicide, remove infected leaves',
        'leaf_spot': 'Apply fungicide spray, ensure proper plant spacing',
        'leaf_mold': 'Improve ventilation, reduce humidity, apply fungicide',
        'nutrient_deficiency': 'Apply appropriate fertilizer based on soil test',
        'pest_infected': 'Use integrated pest management - beneficial insects and organic sprays',
        'stem_rot': 'Remove infected plants, apply fungicide to healthy plants',
        'rot': 'Remove infected parts, improve drainage, apply fungicide',
        'viral_disease': 'Remove infected plants, control insect vectors, use resistant varieties',
        'powdery_mildew': 'Apply sulfur-based fungicide, improve air circulation',
        'downy_mildew': 'Apply systemic fungicide, reduce humidity, improve drainage',
        'scab': 'Apply fungicide spray, remove fallen leaves, prune for air circulation',
        'anthracnose': 'Apply copper fungicide, remove infected debris, avoid overhead watering',
        'bacterial_wilt': 'Remove infected plants immediately, solarize soil, rotate crops'
    }
    return smart_disease_lookup(disease, treatments, 'Consult agricultural expert')

def get_affected_part(disease):
    parts = {
        'healthy': 'none',
        'leaf_blight': 'leaf',
        'leaf_rust': 'leaf',
        'leaf_spot': 'leaf',
        'leaf_mold': 'leaf',
        'nutrient_deficiency': 'whole_plant',
        'pest_infected': 'multiple',
        'stem_rot': 'stem',
        'rot': 'fruit_stem',
        'viral_disease': 'whole_plant',
        'powdery_mildew': 'leaf',
        'downy_mildew': 'leaf',
        'scab': 'fruit_leaf',
        'anthracnose': 'fruit_leaf',
        'bacterial_wilt': 'whole_plant'
    }
    return smart_disease_lookup(disease, parts, 'unknown')

def get_symptoms(disease):
    symptoms = {
        'healthy': ['No visible symptoms'],
        'leaf_blight': ['Brown spots with yellow halos', 'Wilting leaves', 'Premature leaf drop'],
        'leaf_rust': ['Orange-red pustules on leaf undersides', 'Yellow spots on upper surface'],
        'leaf_spot': ['Circular spots on leaves', 'Spots may have dark borders'],
        'leaf_mold': ['Pale yellow spots on upper leaf', 'Olive-green mold on underside'],
        'nutrient_deficiency': ['Yellowing of older leaves', 'Stunted growth', 'Poor fruit development'],
        'pest_infected': ['Holes in leaves', 'Sticky residue', 'Distorted growth'],
        'stem_rot': ['Dark, water-soaked lesions on stem', 'Soft, mushy tissue'],
        'rot': ['Soft, decaying tissue', 'Foul odor', 'Discoloration'],
        'viral_disease': ['Mosaic patterns on leaves', 'Stunted growth', 'Leaf curling', 'Yellow streaks'],
        'powdery_mildew': ['White powdery coating on leaves', 'Distorted leaves', 'Reduced growth'],
        'downy_mildew': ['Yellow patches on upper leaf surface', 'Gray fuzzy growth on undersides'],
        'scab': ['Dark, rough lesions on fruit', 'Corky spots on leaves'],
        'anthracnose': ['Dark sunken lesions', 'Fruit rot', 'Leaf spots with dark margins'],
        'bacterial_wilt': ['Rapid wilting of leaves', 'Stems remain green', 'White ooze from cut stems']
    }
    return smart_disease_lookup(disease, symptoms, ['Symptoms not specified'])

def get_preventive_measures(disease):
    measures = {
        'healthy': ['Continue good agricultural practices'],
        'leaf_blight': ['Avoid overhead watering', 'Remove infected debris', 'Plant resistant varieties'],
        'leaf_rust': ['Ensure good air circulation', 'Avoid high humidity', 'Use resistant cultivars'],
        'leaf_spot': ['Avoid overhead watering', 'Ensure proper plant spacing', 'Remove infected leaves'],
        'leaf_mold': ['Improve air circulation', 'Use drip irrigation', 'Sanitize tools'],
        'nutrient_deficiency': ['Regular soil testing', 'Balanced fertilization', 'Proper irrigation'],
        'pest_infected': ['Crop rotation', 'Beneficial insects', 'Regular monitoring'],
        'stem_rot': ['Improve drainage', 'Avoid overwatering', 'Use pathogen-free seeds'],
        'rot': ['Proper storage conditions', 'Avoid mechanical damage', 'Good sanitation'],
        'viral_disease': ['Control insect vectors', 'Use virus-free planting material', 'Remove infected plants'],
        'powdery_mildew': ['Reduce humidity', 'Improve air circulation', 'Avoid dense planting'],
        'downy_mildew': ['Improve drainage', 'Reduce leaf wetness', 'Use resistant varieties'],
        'scab': ['Remove fallen leaves', 'Prune for air flow', 'Apply preventive fungicides'],
        'anthracnose': ['Crop rotation', 'Remove plant debris', 'Avoid overhead irrigation'],
        'bacterial_wilt': ['Use resistant varieties', 'Control nematodes', 'Crop rotation']
    }
    return smart_disease_lookup(disease, measures, ['Follow good agricultural practices'])

def get_economic_impact(disease):
    impacts = {
        'healthy': 'No economic impact',
        'leaf_blight': 'Can reduce yield by 20-40% if untreated',
        'leaf_rust': 'Yield loss of 15-30% in severe cases',
        'leaf_spot': 'Yield reduction of 10-25% depending on severity',
        'leaf_mold': 'Yield loss of 10-20% in greenhouse conditions',
        'nutrient_deficiency': 'Reduced yield and quality, increased input costs',
        'pest_infected': 'Yield loss varies by pest type and infestation level',
        'stem_rot': 'Complete plant loss in severe infections',
        'rot': 'Post-harvest losses of 30-50%, reduced market value',
        'viral_disease': 'Severe yield loss 40-100%, no cure available',
        'powdery_mildew': 'Yield reduction of 10-30%, quality degradation',
        'downy_mildew': 'Yield loss of 20-50% in favorable conditions',
        'scab': 'Reduced fruit quality and marketability, 20-40% loss',
        'anthracnose': 'Significant fruit losses 30-60%, quality issues',
        'bacterial_wilt': 'Total crop loss possible, 30-100% reduction'
    }
    return smart_disease_lookup(disease, impacts, 'Economic impact varies')

@app.route('/voice-query', methods=['POST'])
def handle_voice_query():
    """Handle voice assistant queries"""
    try:
        data = request.json
        query_text = data.get('text', '')
        language_code = data.get('language', 'en-IN')
        
        if not query_text:
            return jsonify({'error': 'No query text provided'}), 400
        
        # Process query with voice assistant
        response = voice_assistant.process_voice_input(query_text, language_code)
        
        return jsonify({
            'success': True,
            'response': response,
            'timestamp': str(datetime.now())
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/voice-examples', methods=['GET'])
def get_voice_examples():
    """Get example voice queries"""
    examples = {
        'hindi': [
            "गेहूं में रोग आ गया है, क्या करें?",
            "आज पानी देना चाहिए?", 
            "फसल कब काटनी चाहिए?",
            "खाद कितनी डालनी चाहिए?"
        ],
        'english': [
            "Wheat has disease, what to do?",
            "Should I water today?",
            "When should I harvest?",
            "How much fertilizer to apply?"
        ]
    }
    return jsonify(examples)

@app.route('/demands', methods=['GET', 'POST'])
def handle_demands():
    print(f"Demands Endpoint Hit: {request.method}")
    if request.method == 'GET':
        return jsonify(load_demands())
    
    if request.method == 'POST':
        try:
            new_demand = request.json
            print(f"Received new demand: {new_demand}")
            new_demand['id'] = str(uuid.uuid4())
            new_demand['timestamp'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            demands = load_demands()
            demands.append(new_demand)
            save_demands(demands)
            
            return jsonify({"message": "Demand posted successfully", "demand": new_demand}), 201
        except Exception as e:
            print(f"Error saving demand: {e}")
            return jsonify({"error": str(e)}), 500

@app.route('/recommend-fertilizer', methods=['POST'])
def recommend_fertilizer():
    """
    Get fertilizer and irrigation recommendations based on crop and environmental data using Groq (Llama 3).
    """
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No input data provided'}), 400
            
        print(f"Recommendation Request: {data}")

        # Initialize Groq client
        from groq import Groq
        api_key = os.getenv("GROQ_API_KEY") or os.getenv("VITE_GROQ_CHATBOT_API_KEY")
        if not api_key:
             return jsonify({'error': 'GROQ_API_KEY not found'}), 500
             
        client = Groq(api_key=api_key)

        # Construct Prompt
        prompt = f"""
        You are an expert agricultural scientist following ICAR (Indian Council of Agricultural Research) and FAO standards.
        Analyze the following field data and provide a precise fertilizer and irrigation plan.

        Field Data:
        - Crop: {data.get('crop')}
        - Soil N-P-K: {data.get('soil_n')}-{data.get('soil_p')}-{data.get('soil_k')}
        - Soil pH: {data.get('soil_ph')}
        - Soil Moisture: {data.get('soil_moisture')}%
        - Rainfall Forecast: {data.get('rainfall')} mm
        - Growth Stage: {data.get('stage')}
        - Soil Type: {data.get('soil_type')}

        Task:
        1. Calculate N-P-K recommendation in kg/ha based on crop needs and soil status.
        2. Provide irrigation advice based on moisture and rainfall.
        3. Suggest pH corrections if needed.
        4. List 2-3 specific agronomic adjustments (e.g., split application).

        Return ONLY valid JSON in this exact structure:
        {{
            "source": "AgriSphere AI (ICAR/FAO Standards)",
            "fertilizer": {{
                "nitrogen": "XX kg/ha",
                "phosphorus": "XX kg/ha",
                "potassium": "XX kg/ha",
                "adjustments": ["Tip 1", "Tip 2"]
            }},
            "soil_health": {{
                "ph_status": {data.get('soil_ph')},
                "ph_recommendation": "Advice for pH correction or maintenance",
                "recommendation": "General soil health tip"
            }},
            "irrigation": {{
                "status": "Irrigate Immediately" OR "No Irrigation Needed",
                "water_amount": "XX mm",
                "schedule": {{
                    "next_3_days": "Rain Expected" OR "Clear"
                }}
            }}
        }}
        """

        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a helpful agricultural AI. Output valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=600,
            response_format={"type": "json_object"}
        )

        response_content = completion.choices[0].message.content
        recommendation = json.loads(response_content)
        
        return jsonify(recommendation)
        
    except Exception as e:
        print(f"Groq Recommendation Error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/predict-pest', methods=['POST'])
def predict_pest():
    """
    Get pest risk prediction based on weather data using Groq (Llama 3).
    """
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No input data provided'}), 400
            
        print(f"Pest Prediction Request: {data}")

        # Initialize Groq client
        from groq import Groq
        api_key = os.getenv("GROQ_API_KEY") or os.getenv("VITE_GROQ_CHATBOT_API_KEY")
        if not api_key:
             return jsonify({'error': 'GROQ_API_KEY not found'}), 500
             
        client = Groq(api_key=api_key)
        
        # Get next 7 days for forecast labels
        from datetime import datetime, timedelta
        days = [(datetime.now() + timedelta(days=i)).strftime("%a") for i in range(7)]
        days_str = ", ".join(days)

        prompt = f"""
        You are an expert agricultural entomologist following strictly ICAR (Indian Council of Agricultural Research) and FAO protocols.
        Analyze the following environmental conditions and predict the pest attack risk for the specified crop.

        Conditions:
        - Crop: {data.get('crop')}
        - Temperature: {data.get('temp')}°C
        - Humidity: {data.get('humidity')}%
        - Rainfall: {data.get('rainfall')} mm

        Task:
        1. Identify the most likely pest threat for this crop under these conditions according to Indian agricultural region standards.
        2. Estimate the risk probability (0-100%).
        3. Determine risk level (Low/Medium/High).
        4. Provide a specific preventive or curative recommendation (ICAR approved).
        5. Forecast risk trend for the next 7 days ({days_str}) based on simple weather assumptions (e.g., if high humidity persists).

        Return ONLY valid JSON in this exact structure:
        {{
            "primary_pest": {{
                "pest_name": "Name of Pest",
                "risk_score": 85,
                "risk_level": "High",
                "recommendation": "Specific advice"
            }},
            "forecast_7_days": [
                {{ "day": "{days[0]}", "risk_score": 80 }},
                {{ "day": "{days[1]}", "risk_score": 82 }},
                {{ "day": "{days[2]}", "risk_score": 75 }},
                {{ "day": "{days[3]}", "risk_score": 70 }},
                {{ "day": "{days[4]}", "risk_score": 65 }},
                {{ "day": "{days[5]}", "risk_score": 60 }},
                {{ "day": "{days[6]}", "risk_score": 55 }}
            ]
        }}
        """

        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a helpful agricultural AI. Output valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=600,
            response_format={"type": "json_object"}
        )

        response_content = completion.choices[0].message.content
        result = json.loads(response_content)
        
        return jsonify(result)
        
    except Exception as e:
        print(f"Groq Pest Prediction Error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/market-advisory', methods=['POST'])
def market_advisory():
    """
    Get seed-to-market advisory (harvest timing + price forecast).
    """
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No input data provided'}), 400
            
        print(f"Market Advisory Request: {data}")
        result = market_engine.analyze_market(data)
        return jsonify(result)
        
    except Exception as e:
        print(f"Market Advisory Error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/market-prices', methods=['POST'])
def market_prices():
    """
    Get real-time market prices for specific location.
    """
    try:
        data = request.json
        if not data:
             return jsonify({'error': 'No input data provided'}), 400
             
        state = data.get('state')
        district = data.get('district')
        market = data.get('market', 'General')
        category = data.get('category', 'All')
        
        print(f"Fetching prices for: {state}, {district}, {market}")
        
        prices = market_engine.get_market_prices(state, district, market, category)
        return jsonify(prices)
        
    except Exception as e:
        print(f"Market Prices Error: {e}")
        return jsonify({'error': str(e)}), 500

LISTINGS_FILE = 'marketplace_listings.json'

def load_listings():
    if not os.path.exists(LISTINGS_FILE):
        return []
    try:
        with open(LISTINGS_FILE, 'r') as f:
            return json.load(f)
    except:
        return []

def save_listings(listings):
    with open(LISTINGS_FILE, 'w') as f:
        json.dump(listings, f, indent=4)

@app.route('/listings', methods=['GET', 'POST', 'OPTIONS'])
def handle_listings():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200

    if request.method == 'GET':
        listings = load_listings()
        return jsonify(listings)
    
    if request.method == 'POST':
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        required_fields = ['farmerName', 'contactNumber', 'cropName', 'quantity', 'price', 'location']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing field: {field}'}), 400
                
        new_listing = {
            'id': f"list_{int(datetime.now().timestamp())}",
            'farmerName': data['farmerName'],
            'contactNumber': data['contactNumber'],
            'cropName': data['cropName'],
            'quantity': data['quantity'],
            'price': data['price'],
            'location': data['location'],
            'harvestDate': data.get('harvestDate', 'Not specified'),
            'quality': data.get('quality', 'Standard'),
            'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'verified': True # Mock verification
        }
        
        listings = load_listings()
        listings.insert(0, new_listing) # Add to top
        save_listings(listings)
        
        return jsonify(new_listing), 201

# Online Status Endpoints
@app.route('/community/heartbeat', methods=['POST'])
def handle_heartbeat():
    data = request.json
    username = data.get('username')
    if username:
        update_user_status(username)
        return jsonify({'status': 'updated'})
    return jsonify({'error': 'Username required'}), 400

@app.route('/community/online', methods=['GET'])
def get_online_users():
    users = get_active_users()
    return jsonify(users)

# Buyer Dashboard Models & Routes
BUYER_INTERACTIONS_FILE = "buyer_interactions.json"

def load_buyer_interactions():
    if os.path.exists(BUYER_INTERACTIONS_FILE):
        try:
            with open(BUYER_INTERACTIONS_FILE, 'r') as f:
                return json.load(f)
        except:
            return []
    return []

def save_buyer_interactions(data):
    with open(BUYER_INTERACTIONS_FILE, 'w') as f:
        json.dump(data, f, indent=4)

@app.route('/buyer/insights', methods=['POST'])
def get_buyer_insights_api():
    data = request.json
    crop = data.get('crop')
    state = data.get('state')
    district = data.get('district', '')
    
    if not crop or not state:
        return jsonify({'error': 'Crop and State are required'}), 400
        
    insights = market_engine.get_buyer_insights(crop, state, district)
    return jsonify(insights)

@app.route('/buyer/interactions', methods=['GET', 'POST'])
def handle_buyer_interactions():
    if request.method == 'GET':
        # Filter by buyerId if provided query param
        buyer_id = request.args.get('buyerId')
        interactions = load_buyer_interactions()
        if buyer_id:
            interactions = [i for i in interactions if i.get('buyerId') == buyer_id]
        return jsonify(interactions)
        
    if request.method == 'POST':
        data = request.json
        interactions = load_buyer_interactions()
        
        new_interaction = {
            'id': str(uuid.uuid4()),
            'buyerId': data.get('buyerId'),
            'listingId': data.get('listingId'),
            'farmerName': data.get('farmerName'),
            'crop': data.get('crop'),
            'status': 'Contacted',
            'timestamp': datetime.now().isoformat()
        }
        
        interactions.insert(0, new_interaction)
        save_buyer_interactions(interactions)
        return jsonify({'message': 'Interaction recorded', 'id': new_interaction['id']}), 201

# Community Endpoints
@app.route('/community/posts', methods=['GET', 'POST'])
def handle_community_posts():
    data = load_community_data()
    if request.method == 'GET':
        posts = data.get('posts', [])
        return jsonify(posts)
    
    if request.method == 'POST':
        new_post = request.json
        if not new_post:
            return jsonify({'error': 'No data provided'}), 400
            
        new_post['id'] = str(uuid.uuid4())
        new_post['timestamp'] = datetime.now().isoformat()
        new_post['likes'] = 0
        new_post['comments'] = []
        
        # Ensure posts list exists
        if 'posts' not in data:
            data['posts'] = []
            
        data['posts'].insert(0, new_post)
        save_community_data(data)
        return jsonify({'message': 'Post created', 'id': new_post['id']}), 201

@app.route('/community/chat', methods=['GET', 'POST'])
def handle_community_chat():
    data = load_community_data()
    if request.method == 'GET':
        chat = data.get('chat', [])
        return jsonify(chat)
    
    if request.method == 'POST':
        msg = request.json
        if not msg:
            return jsonify({'error': 'No data provided'}), 400
            
        msg['id'] = str(uuid.uuid4())
        msg['timestamp'] = datetime.now().isoformat()
        
        # Ensure chat list exists
        if 'chat' not in data:
            data['chat'] = []
            
        data['chat'].append(msg)
        # Keep only last 100 messages
        if len(data['chat']) > 100:
            data['chat'] = data['chat'][-100:]
            
        save_community_data(data)
        return jsonify({'message': 'Message sent'}), 201

@app.route('/community/posts/<post_id>/comments', methods=['POST'])
def handle_post_comment(post_id):
    data = load_community_data()
    posts = data.get('posts', [])
    
    # Find post
    post_index = next((index for (index, d) in enumerate(posts) if d["id"] == post_id), None)
    
    if post_index is None:
        return jsonify({'error': 'Post not found'}), 404
        
    comment_data = request.json
    if not comment_data or 'text' not in comment_data:
         return jsonify({'error': 'No comment text provided'}), 400
         
    new_comment = {
        'id': str(uuid.uuid4()),
        'author': comment_data.get('author', 'Anonymous'),
        'text': comment_data['text'],
        'timestamp': datetime.now().isoformat()
    }
    
    # Initialize comments is it doesn't exist (legacy data support)
    if 'comments' not in posts[post_index]:
        posts[post_index]['comments'] = []
        
    posts[post_index]['comments'].append(new_comment)
    data['posts'] = posts # Update data structure
    
    save_community_data(data)
    return jsonify({'message': 'Comment added', 'comment': new_comment}), 201

@app.route('/generate-digital-twin', methods=['POST'])
def generate_digital_twin():
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        print(f"Generating Digital Twin for: {data}")
        
        # Call Groq to generate realistic farm data
        success, result = generate_digital_twin_with_groq(data)
        
        if success:
            return jsonify(result)
        else:
            return jsonify({'error': result}), 500

    except Exception as e:
        print(f"Error in digital twin generation: {e}")
        return jsonify({'error': str(e)}), 500

def generate_digital_twin_with_groq(farm_data):
    """
    Generate realistic digital twin data using Groq based on location (Lat/Lng OR Text) and size.
    """
    try:
        from groq import Groq
        api_key = os.getenv("GROQ_API_KEY") or os.getenv("VITE_GROQ_CHATBOT_API_KEY")
        if not api_key:
            return False, "Groq API Key missing"

        client = Groq(api_key=api_key)
        
        # Calculate hectares from acres (approx)
        acres = float(farm_data.get('size', 10))
        hectares = round(acres * 0.404686, 2)
        
        # Construct Location Context
        lat = farm_data.get('latitude')
        lng = farm_data.get('longitude')
        location_text = ""
        
        if farm_data.get('town') and farm_data.get('district'):
            location_text = f"{farm_data.get('town')}, {farm_data.get('district')}, {farm_data.get('state')}"
        
        prompt = f"""
        Generate a realistic 'Digital Twin' dataset for a farm.
        
        INPUTS:
        - Name: {farm_data.get('farmName')}
        - Owner: {farm_data.get('ownerName')}
        - Size: {acres} Acres ({hectares} Hectares)
        - Location Coordinates: Lat {lat}, Lng {lng}
        - Location Name: {location_text}
        
        Task:
        1. **Location Resolution**: 
           - If 'Location Name' is provided but Coordinates are missing/zero, ESTIMATE the Lat/Lng for that town/village.
           - If Coordinates are provided, use them to identify the micro-region.
           
        2. **Agricultural Profiling (DIVERSITY IS CRITICAL)**:
           - Create a UNIQUE profile specific to this exact location.
           - **CRITICAL**: Generate AT LEAST 3-4 *DISTINCT* items for Pests and Crops. Do NOT repeat the same pest/crop 4 times.
           - Example: If Pest 1 is "Stem Borer", Pest 2 MUST be different (e.g., "Leaf Folder").
           - Example: Include variety in Crop Stages (e.g., one field "vegetative", another "flowering").

        OUTPUT JSON format ONLY. Structure:
        {{
            "location": {{ "lat": 22.123, "lng": 88.123 }}, 
            "farmBoundary": {{ "area": {hectares} }},
            "visual_summary": "Located in [Town], [District]. The soil is [Type], suitable for [Crops].",
            "soilZones": [
                {{ "id": "zone-1", "soilType": "loamy", "ph": 6.5, "nutrients": {{ "nitrogen": 40, "phosphorus": 30, "potassium": 20 }}, "organicMatter": 3.5, "fertility": "high", "recommendations": ["specific advice"] }},
                {{ "id": "zone-2", "soilType": "sandy loam", "ph": 7.0, "nutrients": {{ "nitrogen": 35, "phosphorus": 25, "potassium": 15 }}, "organicMatter": 3.0, "fertility": "medium", "recommendations": ["different advice"] }}
            ],
            "irrigationZones": [
                {{ "id": "irrig-1", "type": "drip", "efficiency": 92, "status": "active" }}
            ],
            "pestProneAreas": [
                 {{ "id": "pest-1", "pestType": "Specific Pest A", "riskLevel": "high", "preventiveMeasures": ["measure A"] }},
                 {{ "id": "pest-2", "pestType": "Specific Pest B", "riskLevel": "medium", "preventiveMeasures": ["measure B"] }},
                 {{ "id": "pest-3", "pestType": "Specific Pest C", "riskLevel": "low", "preventiveMeasures": ["measure C"] }}
            ],
            "cropGrowthStages": [
                 {{ "id": "crop-1", "cropType": "Crop A", "stage": "vegetative", "health": 85, "plantingDate": "2024-11-01" }},
                 {{ "id": "crop-2", "cropType": "Crop B", "stage": "flowering", "health": 90, "plantingDate": "2024-10-15" }},
                 {{ "id": "crop-3", "cropType": "Crop C", "stage": "harvesting", "health": 80, "plantingDate": "2024-09-01" }}
            ],
            "weatherData": {{ "temperature": 28, "humidity": 60, "rainfall": 12, "windSpeed": 5 }}
        }}
        """

        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are an agricultural data scientist. Provide specific, variable, and diverse data. Never repeat the same item in a list."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.8,
            max_tokens=2500,
            response_format={"type": "json_object"}
        )
        
        response_content = completion.choices[0].message.content
        result = json.loads(response_content)
        return True, result

    except Exception as e:
        print(f"Groq generation error: {e}")
        return False, str(e)

@app.route('/analyze-health', methods=['POST', 'OPTIONS'])
def analyze_health():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200

    """
    Analyze overall plant health using Groq based on detected issues.
    """
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No input data provided'}), 400

        print(f"Health Analysis Request: {data}")

        # Initialize Groq client
        from groq import Groq
        api_key = os.getenv("GROQ_API_KEY") or os.getenv("VITE_GROQ_CHATBOT_API_KEY")
        if not api_key:
             return jsonify({'error': 'GROQ_API_KEY not found'}), 500
             
        client = Groq(api_key=api_key)

        prompt = f"""
        You are an expert agricultural scientist. Analyze the following plant health findings and provide a summary assessment.
        
        Findings:
        - Diseases: {json.dumps(data.get('diseases', []), indent=2)}
        - Pests: {json.dumps(data.get('pests', []), indent=2)}
        - Nutrient Deficiencies: {json.dumps(data.get('nutrients', []), indent=2)}
        - Soil Analysis: {json.dumps(data.get('soil', {}), indent=2)}
        
        Task:
        1. Determine an overall Health Score (0-100). 100 is perfect health, 0 is dead. Be realistic based on severity.
        2. Assign a Health Status (one of: 'excellent', 'good', 'fair', 'poor', 'critical').
        3. Provide 3 specific, high-priority, actionable recommendations for the farmer. Focus on the most critical issues first.
           - Recommendations should be concise instructions (e.g., "Apply copper fungicide immediately").
           
        Return ONLY valid JSON in this exact structure:
        {{
            "score": 75,
            "status": "fair",
            "recommendations": [
                "Recommendation 1",
                "Recommendation 2",
                "Recommendation 3"
            ]
        }}
        """

        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a helpful agricultural AI. Output valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=300,
            response_format={"type": "json_object"}
        )

        response_content = completion.choices[0].message.content
        result = json.loads(response_content)
        
        return jsonify(result)

    except Exception as e:
        print(f"Health Analysis Error: {e}")
        return jsonify({'error': str(e)}), 500

# Government Dashboard Endpoints
@app.route('/gov/stats', methods=['GET'])
def get_gov_stats():
    # Aggregate data for dashboard
    listings = load_listings()
    community = load_community_data()
    crop_loss_cases = load_crop_loss_data()
    
    # Calculate stats
    total_farmers = 1250 # Mock base
    active_farmers = 850 + len(community.get('posts', []))
    
    # Market stats
    total_listings = len(listings)
    total_volume = sum([float(l.get('quantity', 0)) for l in listings])
    
    # Community stats
    total_issues = len(community.get('posts', []))
    resolved_issues = len([p for p in community.get('posts', []) if len(p.get('comments', [])) > 0])
    
    # Pending cases
    pending_cases = len([c for c in crop_loss_cases if c.get('status') == 'Pending'])
    
    return jsonify({
        'overview': {
            'totalFarmers': total_farmers,
            'activeFarmers': active_farmers,
            'diseaseDetections': 342, # Mock
            'pestAlerts': 128, # Mock
            'fieldsMapped': 560
        },
        'market': {
            'totalListings': total_listings,
            'totalVolume': total_volume,
            'listings': listings[:5] # Top 5 recent
        },
        'community': {
            'totalIssues': total_issues,
            'resolvedIssues': resolved_issues,
            'recenttopics': [{
                'id': p.get('id'),
                'title': p.get('title'),
                'content': p.get('content'),
                'author': p.get('author'),
                'timestamp': p.get('timestamp'),
                'likes': p.get('likes', 0),
                'replies': len(p.get('comments', []))
            } for p in community.get('posts', [])[:5]]
        },
        'cropLoss': {
            'pendingCases': pending_cases,
            'totalDisbursed': 4500000 # Mock ₹
        }
    })

@app.route('/gov/crop-loss', methods=['GET', 'POST'])
def handle_crop_loss():
    cases = load_crop_loss_data()
    
    if request.method == 'GET':
        return jsonify(cases)
        
    if request.method == 'POST':
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        # Parse detailed fields
        damage_percentage = float(data.get('damagePercentage', 0))
        cause = data.get('causeOfLoss', 'Unknown')
        affected_area = float(data.get('affectedArea', 0))
        crop_name = data.get('cropName', 'Unknown Crop')
        
        # Calculate Estimated Loss (Mock Logic)
        # Avg Yield (Qt/Acre) * Avg Price (Rs/Qt) * Impact Area * Damage %
        # Mock Yields & Prices
        yields = {'Wheat': 20, 'Rice': 25, 'Cotton': 10, 'Maize': 30, 'Potato': 100}
        prices = {'Wheat': 2275, 'Rice': 2200, 'Cotton': 6000, 'Maize': 2090, 'Potato': 1000}
        
        avg_yield = yields.get(crop_name, 20)
        avg_price = prices.get(crop_name, 2000)
        
        estimated_loss_calc = (avg_yield * affected_area) * avg_price * (damage_percentage / 100)
        
        # Rule-based Logic
        is_eligible = damage_percentage >= 33 and cause in ['Drought', 'Flood', 'Pest', 'Disease', 'Hailstorm', 'Heatwave']
        
        suggested_scheme = 'None'
        if is_eligible:
            suggested_scheme = 'PMFBY' if data.get('insuranceStatus') == 'Yes' else 'State Disaster Relief Fund (SDRF)'
        
        suggested_compensation = (estimated_loss_calc * 0.70) if is_eligible else 0

        new_case = {
            'id': f"case_{str(uuid.uuid4())[:8]}",
            'farmerName': data.get('farmerName', 'Unknown Farmer'),
            'crop': crop_name,
            'season': data.get('season', 'Kharif'),
            'damagePercentage': damage_percentage,
            'cause': cause,
            'status': 'Under Verification', # Default to Under Verification for digital claims
            'timestamp': datetime.now().isoformat(),
            'location': data.get('location', 'Unknown'),
            'estimatedLoss': int(estimated_loss_calc),
            'suggestedCompensation': int(suggested_compensation),
            'isEligible': is_eligible,
            'suggestedScheme': suggested_scheme,
            'advisoryCompliance': data.get('advisoryCompliance', {}),
            'evidence': data.get('evidence', 'No files uploaded')
        }
        
        cases.insert(0, new_case)
        save_crop_loss_data(cases)
        return jsonify(new_case), 201

@app.route('/gov/crop-loss/<case_id>/action', methods=['POST'])
def handle_crop_loss_action(case_id):
    cases = load_crop_loss_data()
    action_data = request.json
    action = action_data.get('action') # 'approve', 'reject', 'verify'
    
    case_index = next((index for (index, d) in enumerate(cases) if d["id"] == case_id), None)
    
    if case_index is None:
        return jsonify({'error': 'Case not found'}), 404
        
    case_to_update = cases[case_index]
    
    if action == 'approve':
        case_to_update['status'] = 'Approved'
    elif action == 'reject':
        case_to_update['status'] = 'Rejected'
    elif action == 'verify':
        case_to_update['status'] = 'Under Verification'
        case_to_update['verificationRequestedAt'] = datetime.now().isoformat()
    # No else for invalid action to keep it simple or add check if needed, but existing code had basic check
        
    cases[case_index] = case_to_update
    save_crop_loss_data(cases)
    
    return jsonify(case_to_update), 200

if __name__ == '__main__':
    print("\n" + "="*50)
    print("AgriSphere AI API Server Starting...")
    print("="*50)
    print("Server will be available at: http://localhost:5000")
    print("Health check: http://localhost:5000/health")
    print("Disease detection: POST to /detect-disease")
    print("Yield prediction: POST to /predict")
    print("Voice assistant: POST to /voice-query")
    print("Fertilizer Recommendation: POST to /recommend-fertilizer")
    print("Pest Prediction: POST to /predict-pest")
    print("Market Advisory: POST to /market-advisory")
    print("Voice examples: GET /voice-examples")
    print("="*50 + "\n")
    app.run(debug=True, port=5000, threaded=True)
