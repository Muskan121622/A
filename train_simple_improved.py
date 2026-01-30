#!/usr/bin/env python3
"""
Simple Improved Plant Disease Model - Higher Accuracy
"""

import os
import json
import numpy as np
from PIL import Image
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
from sklearn.preprocessing import StandardScaler
import joblib
import random

# Configuration
IMG_SIZE = 128
SAMPLES_PER_CLASS = 500
OUTPUT_DIR = "improved_model_output"

class SimpleImprovedTrainer:
    def __init__(self):
        self.output_dir = OUTPUT_DIR
        os.makedirs(self.output_dir, exist_ok=True)
        self.scaler = StandardScaler()
        
    def extract_enhanced_features(self, image_path):
        """Extract enhanced features without complex dependencies"""
        try:
            img = Image.open(image_path).convert('RGB')
            img = img.resize((IMG_SIZE, IMG_SIZE))
            img_array = np.array(img)
            
            features = []
            
            # 1. Enhanced color histograms
            for channel in range(3):
                ch = img_array[:,:,channel]
                # More detailed histogram
                hist, _ = np.histogram(ch, bins=64, range=(0, 256))
                hist = hist / np.sum(hist)
                features.extend(hist)
                
                # Statistical features
                features.extend([
                    np.mean(ch), np.std(ch), np.var(ch),
                    np.median(ch), np.min(ch), np.max(ch),
                    np.percentile(ch, 25), np.percentile(ch, 75)
                ])
            
            # 2. Color space conversions
            # HSV approximation
            r, g, b = img_array[:,:,0]/255.0, img_array[:,:,1]/255.0, img_array[:,:,2]/255.0
            max_rgb = np.maximum(np.maximum(r, g), b)
            min_rgb = np.minimum(np.minimum(r, g), b)
            diff = max_rgb - min_rgb
            
            # Value (brightness)
            v = max_rgb
            # Saturation
            s = np.where(max_rgb != 0, diff / max_rgb, 0)
            
            features.extend([np.mean(v), np.std(v), np.mean(s), np.std(s)])
            
            # 3. Disease-specific features
            # Green ratio (healthy vegetation indicator)
            green_ratio = np.mean(img_array[:,:,1]) / (np.mean(img_array) + 1e-6)
            
            # Brown/yellow disease indicators
            brown_mask = ((img_array[:,:,0] > 100) & (img_array[:,:,1] > 50) & 
                         (img_array[:,:,1] < 150) & (img_array[:,:,2] < 100))
            yellow_mask = ((img_array[:,:,0] > 150) & (img_array[:,:,1] > 150) & 
                          (img_array[:,:,2] < 100))
            
            brown_ratio = np.sum(brown_mask) / (IMG_SIZE * IMG_SIZE)
            yellow_ratio = np.sum(yellow_mask) / (IMG_SIZE * IMG_SIZE)
            
            features.extend([green_ratio, brown_ratio, yellow_ratio])
            
            # 4. Texture approximation using gradients
            gray = np.mean(img_array, axis=2)
            grad_x = np.abs(np.diff(gray, axis=1))
            grad_y = np.abs(np.diff(gray, axis=0))
            
            features.extend([
                np.mean(grad_x), np.std(grad_x),
                np.mean(grad_y), np.std(grad_y)
            ])
            
            # 5. Spatial distribution
            h, w = IMG_SIZE, IMG_SIZE
            q1 = img_array[:h//2, :w//2]
            q2 = img_array[:h//2, w//2:]
            q3 = img_array[h//2:, :w//2]
            q4 = img_array[h//2:, w//2:]
            
            quad_means = [np.mean(q1), np.mean(q2), np.mean(q3), np.mean(q4)]
            features.extend([np.std(quad_means), np.var(quad_means)])
            
            return np.array(features)
            
        except Exception as e:
            print(f"Error processing {image_path}: {e}")
            return None

    def prepare_dataset(self, dataset_path="dataset"):
        """Prepare dataset"""
        print("Preparing enhanced dataset...")
        
        X, y, class_names = [], [], []
        
        if not os.path.exists(dataset_path):
            print(f"Dataset path {dataset_path} not found. Creating sample data...")
            return self.create_sample_data()
        
        class_dirs = [d for d in os.listdir(dataset_path) 
                     if os.path.isdir(os.path.join(dataset_path, d))]
        
        print(f"Found {len(class_dirs)} classes: {class_dirs}")
        
        for class_idx, class_name in enumerate(class_dirs):
            class_path = os.path.join(dataset_path, class_name)
            print(f"Processing {class_name}...")
            
            image_files = [f for f in os.listdir(class_path) 
                          if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
            
            if len(image_files) > SAMPLES_PER_CLASS:
                image_files = random.sample(image_files, SAMPLES_PER_CLASS)
            
            valid_samples = 0
            for img_file in image_files:
                img_path = os.path.join(class_path, img_file)
                features = self.extract_enhanced_features(img_path)
                
                if features is not None:
                    X.append(features)
                    y.append(class_idx)
                    valid_samples += 1
            
            class_names.append(class_name)
            print(f"  Processed {valid_samples} images")
        
        return np.array(X), np.array(y), class_names
    
    def create_sample_data(self):
        """Create sample data for testing"""
        print("Creating sample data...")
        
        class_names = ['healthy', 'diseased', 'pest_damage']
        n_samples = 300
        n_features = 220  # Approximate feature count
        
        X = np.random.rand(n_samples, n_features)
        y = np.random.randint(0, len(class_names), n_samples)
        
        # Add some pattern to make it learnable
        for i in range(len(class_names)):
            mask = y == i
            X[mask] += i * 0.5  # Add class-specific bias
        
        return X, y, class_names

    def train_ensemble_model(self, X, y, class_names):
        """Train improved ensemble model"""
        print("\nTraining enhanced ensemble model...")
        
        # Split dataset
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Enhanced ensemble
        rf = RandomForestClassifier(
            n_estimators=200, max_depth=20, min_samples_split=3,
            random_state=42, n_jobs=-1, class_weight='balanced'
        )
        
        gb = GradientBoostingClassifier(
            n_estimators=150, max_depth=6, learning_rate=0.1,
            random_state=42
        )
        
        # Ensemble
        ensemble = VotingClassifier(
            estimators=[('rf', rf), ('gb', gb)],
            voting='soft'
        )
        
        ensemble.fit(X_train_scaled, y_train)
        
        # Evaluate
        test_pred = ensemble.predict(X_test_scaled)
        test_acc = accuracy_score(y_test, test_pred)
        
        print(f"\nModel Performance:")
        print(f"  Testing Accuracy: {test_acc:.4f}")
        
        report = classification_report(y_test, test_pred, target_names=class_names, output_dict=True)
        
        return ensemble, test_acc, report

    def save_model(self, model, class_names, accuracy, report):
        """Save the model"""
        print(f"\nSaving model to {self.output_dir}...")
        
        joblib.dump(model, os.path.join(self.output_dir, "ensemble_model.pkl"))
        joblib.dump(self.scaler, os.path.join(self.output_dir, "scaler.pkl"))
        
        with open(os.path.join(self.output_dir, "labels.json"), 'w') as f:
            json.dump(class_names, f)
        
        with open(os.path.join(self.output_dir, "report.json"), 'w') as f:
            json.dump(report, f, indent=2)
        
        # Create prediction script
        self.create_prediction_script()
        
        print(f"Model saved! Accuracy: {accuracy:.4f}")

    def create_prediction_script(self):
        """Create prediction script"""
        script = '''#!/usr/bin/env python3
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
'''
        
        with open(os.path.join(self.output_dir, "predict.py"), 'w') as f:
            f.write(script)

def main():
    """Main function"""
    print("AgriSphere AI - Enhanced Plant Disease Model")
    print("=" * 50)
    
    trainer = SimpleImprovedTrainer()
    
    # Prepare dataset
    X, y, class_names = trainer.prepare_dataset()
    
    # Train model
    model, accuracy, report = trainer.train_ensemble_model(X, y, class_names)
    
    # Save model
    trainer.save_model(model, class_names, accuracy, report)
    
    print("\n" + "=" * 50)
    print("TRAINING COMPLETE!")
    print(f"Accuracy: {accuracy:.4f}")
    print(f"Model saved in: {OUTPUT_DIR}/")

if __name__ == "__main__":
    main()