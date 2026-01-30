#!/usr/bin/env python3
import json
import numpy as np
from PIL import Image
import joblib
import sys

def extract_enhanced_features(image_path):
    """Extract same features as training"""
    try:
        img = Image.open(image_path).convert('RGB')
        img = img.resize((128, 128))
        img_array = np.array(img)
        
        features = []
        
        # Color histograms and stats
        for channel in range(3):
            ch = img_array[:,:,channel]
            hist, _ = np.histogram(ch, bins=64, range=(0, 256))
            hist = hist / np.sum(hist)
            features.extend(hist)
            features.extend([
                np.mean(ch), np.std(ch), np.var(ch),
                np.median(ch), np.min(ch), np.max(ch),
                np.percentile(ch, 25), np.percentile(ch, 75)
            ])
        
        # HSV approximation
        r, g, b = img_array[:,:,0]/255.0, img_array[:,:,1]/255.0, img_array[:,:,2]/255.0
        max_rgb = np.maximum(np.maximum(r, g), b)
        min_rgb = np.minimum(np.minimum(r, g), b)
        diff = max_rgb - min_rgb
        v = max_rgb
        s = np.where(max_rgb != 0, diff / max_rgb, 0)
        features.extend([np.mean(v), np.std(v), np.mean(s), np.std(s)])
        
        # Disease indicators
        green_ratio = np.mean(img_array[:,:,1]) / (np.mean(img_array) + 1e-6)
        brown_mask = ((img_array[:,:,0] > 100) & (img_array[:,:,1] > 50) & 
                     (img_array[:,:,1] < 150) & (img_array[:,:,2] < 100))
        yellow_mask = ((img_array[:,:,0] > 150) & (img_array[:,:,1] > 150) & 
                      (img_array[:,:,2] < 100))
        brown_ratio = np.sum(brown_mask) / (128 * 128)
        yellow_ratio = np.sum(yellow_mask) / (128 * 128)
        features.extend([green_ratio, brown_ratio, yellow_ratio])
        
        # Texture
        gray = np.mean(img_array, axis=2)
        grad_x = np.abs(np.diff(gray, axis=1))
        grad_y = np.abs(np.diff(gray, axis=0))
        features.extend([np.mean(grad_x), np.std(grad_x), np.mean(grad_y), np.std(grad_y)])
        
        # Spatial
        h, w = 128, 128
        q1 = img_array[:h//2, :w//2]
        q2 = img_array[:h//2, w//2:]
        q3 = img_array[h//2:, :w//2]
        q4 = img_array[h//2:, w//2:]
        quad_means = [np.mean(q1), np.mean(q2), np.mean(q3), np.mean(q4)]
        features.extend([np.std(quad_means), np.var(quad_means)])
        
        return np.array(features).reshape(1, -1)
    except Exception as e:
        print(f"Error: {e}")
        return None

def predict_disease(image_path):
    """Predict disease"""
    model = joblib.load("ensemble_model.pkl")
    scaler = joblib.load("scaler.pkl")
    
    with open("labels.json", 'r') as f:
        class_names = json.load(f)
    
    features = extract_enhanced_features(image_path)
    if features is None:
        return None, None
    
    features_scaled = scaler.transform(features)
    prediction = model.predict(features_scaled)[0]
    probabilities = model.predict_proba(features_scaled)[0]
    
    return class_names[prediction], probabilities[prediction]

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python predict.py <image_path>")
        sys.exit(1)
    
    predicted_class, confidence = predict_disease(sys.argv[1])
    if predicted_class:
        print(f"Predicted: {predicted_class}")
        print(f"Confidence: {confidence:.2%}")
