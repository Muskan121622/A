#!/usr/bin/env python3
"""
AgriSphere AI - Plant Disease Classification using Scikit-learn
Alternative training script using traditional ML instead of deep learning
"""

import os
import json
import numpy as np
from PIL import Image
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import joblib
import seaborn as sns
import matplotlib.pyplot as plt
from collections import Counter
import random

# Configuration
IMG_SIZE = 128  # Increased for better feature extraction
SAMPLES_PER_CLASS = 1000  # More samples for better training
OUTPUT_DIR = "sklearn_model_output"

class SklearnPlantDiseaseTrainer:
    def __init__(self):
        self.output_dir = OUTPUT_DIR
        os.makedirs(self.output_dir, exist_ok=True)
        
    def extract_features(self, image_path):
        """
        Extract enhanced features from image for better disease classification
        """
        try:
            # Open and resize image
            img = Image.open(image_path).convert('RGB')
            img = img.resize((IMG_SIZE, IMG_SIZE))
            
            # Convert to numpy array
            img_array = np.array(img)
            
            # Extract enhanced features
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
            
            # 3. Color space conversions for better disease detection
            # Convert to HSV for better color representation
            from PIL import Image as PILImage
            hsv_img = img.convert('HSV')
            hsv_array = np.array(hsv_img)
            
            # HSV statistics
            mean_hsv = np.mean(hsv_array, axis=(0, 1))
            std_hsv = np.std(hsv_array, axis=(0, 1))
            
            # 4. Texture features using Laplacian (edge detection)
            gray = np.mean(img_array, axis=2).astype(np.float32)
            laplacian = np.array([
                [0, 1, 0],
                [1, -4, 1],
                [0, 1, 0]
            ])
            from scipy import ndimage
            edges = ndimage.convolve(gray, laplacian)
            edge_mean = np.mean(np.abs(edges))
            edge_std = np.std(edges)
            
            # 5. Green channel analysis (important for leaf diseases)
            green_ratio = np.mean(img_array[:,:,1]) / (np.mean(img_array) + 1e-6)
            
            # 6. Brown/Yellow color detection (disease indicators)
            # Brown is high red, medium green, low blue
            brown_mask = (img_array[:,:,0] > 100) & (img_array[:,:,1] > 50) & (img_array[:,:,1] < 150) & (img_array[:,:,2] < 100)
            brown_ratio = np.sum(brown_mask) / (IMG_SIZE * IMG_SIZE)
            
            # Yellow is high red, high green, low blue
            yellow_mask = (img_array[:,:,0] > 150) & (img_array[:,:,1] > 150) & (img_array[:,:,2] < 100)
            yellow_ratio = np.sum(yellow_mask) / (IMG_SIZE * IMG_SIZE)
            
            # 7. Variance in quadrants (spatial distribution of disease)
            h, w = img_array.shape[:2]
            q1 = img_array[:h//2, :w//2]
            q2 = img_array[:h//2, w//2:]
            q3 = img_array[h//2:, :w//2]
            q4 = img_array[h//2:, w//2:]
            
            quad_means = np.array([np.mean(q1), np.mean(q2), np.mean(q3), np.mean(q4)])
            spatial_variance = np.std(quad_means)
            
            # 8. Flatten and combine all features
            features = np.concatenate([
                hist_r, hist_g, hist_b,  # 192 features
                mean_rgb, std_rgb, median_rgb, min_rgb, max_rgb,  # 15 features
                mean_hsv, std_hsv,  # 6 features
                [edge_mean, edge_std],  # 2 features
                [green_ratio, brown_ratio, yellow_ratio],  # 3 features
                [spatial_variance]  # 1 feature
            ])
            
            return features
        except Exception as e:
            print(f"Error processing {image_path}: {e}")
            import traceback
            traceback.print_exc()
            return None

    def prepare_dataset(self, dataset_path="dataset"):
        """
        Prepare dataset with feature extraction
        """
        print("Preparing dataset with feature extraction...")
        
        X = []  # Features
        y = []  # Labels
        class_names = []
        
        # Get class directories
        class_dirs = [d for d in os.listdir(dataset_path) 
                     if os.path.isdir(os.path.join(dataset_path, d))]
        
        print(f"Found {len(class_dirs)} classes: {class_dirs}")
        
        for class_idx, class_name in enumerate(class_dirs):
            class_path = os.path.join(dataset_path, class_name)
            print(f"Processing {class_name}...")
            
            # Get image files
            image_files = [f for f in os.listdir(class_path) 
                          if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
            
            # Limit samples per class for faster training
            if len(image_files) > SAMPLES_PER_CLASS:
                image_files = random.sample(image_files, SAMPLES_PER_CLASS)
            
            valid_samples = 0
            for img_file in image_files:
                img_path = os.path.join(class_path, img_file)
                
                # Extract features
                features = self.extract_features(img_path)
                if features is not None:
                    X.append(features)
                    y.append(class_idx)
                    valid_samples += 1
            
            class_names.append(class_name)
            print(f"  Extracted features from {valid_samples} images")
        
        X = np.array(X)
        y = np.array(y)
        
        print(f"\nDataset prepared:")
        print(f"  Features shape: {X.shape}")
        print(f"  Labels shape: {y.shape}")
        print(f"  Classes: {class_names}")
        
        return X, y, class_names

    def train_model(self, X, y, class_names):
        """
        Train Random Forest classifier
        """
        print("\nTraining Random Forest model...")
        
        # Split dataset
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Create and train model with improved parameters
        model = RandomForestClassifier(
            n_estimators=200,  # More trees for better accuracy
            max_depth=30,  # Deeper trees
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1,
            class_weight='balanced'  # Handle class imbalance
        )
        
        model.fit(X_train, y_train)
        
        # Evaluate model
        train_pred = model.predict(X_train)
        test_pred = model.predict(X_test)
        
        train_acc = accuracy_score(y_train, train_pred)
        test_acc = accuracy_score(y_test, test_pred)
        
        print(f"\nModel Performance:")
        print(f"  Training Accuracy: {train_acc:.4f}")
        print(f"  Testing Accuracy: {test_acc:.4f}")
        
        # Detailed classification report
        report = classification_report(
            y_test, test_pred, 
            target_names=class_names,
            output_dict=True
        )
        
        # Confusion matrix
        cm = confusion_matrix(y_test, test_pred)
        
        return model, test_acc, report, cm, X_test, y_test

    def save_model(self, model, class_names, test_acc, report, cm, X_test, y_test):
        """
        Save model and related files
        """
        print(f"\nSaving model and outputs to {self.output_dir}...")
        
        # Save model
        joblib.dump(model, os.path.join(self.output_dir, "model.pkl"))
        
        # Save class names
        with open(os.path.join(self.output_dir, "labels.json"), 'w') as f:
            json.dump(class_names, f)
        
        # Save classification report
        with open(os.path.join(self.output_dir, "classification_report.json"), 'w') as f:
            json.dump(report, f, indent=2)
        
        # Plot and save confusion matrix
        plt.figure(figsize=(10, 8))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                   xticklabels=class_names, yticklabels=class_names)
        plt.title('Confusion Matrix')
        plt.ylabel('True Label')
        plt.xlabel('Predicted Label')
        plt.tight_layout()
        plt.savefig(os.path.join(self.output_dir, "confusion_matrix.png"))
        plt.close()
        
        # Create prediction script
        self.create_prediction_script(class_names)
        
        print("Model saved successfully!")
        print(f"Testing Accuracy: {test_acc:.4f}")

    def create_prediction_script(self, class_names):
        """
        Create a simple prediction script
        """
        script_content = f'''#!/usr/bin/env python3
"""
AgriSphere AI - Plant Disease Prediction Script (Scikit-learn version)
"""

import json
import numpy as np
from PIL import Image
import joblib
import sys
from scipy import ndimage

IMG_SIZE = 128

def extract_features(image_path):
    """
    Extract same enhanced features as used in training
    """
    try:
        # Open and resize image
        img = Image.open(image_path).convert('RGB')
        img = img.resize((IMG_SIZE, IMG_SIZE))
        
        # Convert to numpy array
        img_array = np.array(img)
        
        # Extract enhanced features
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
        
        return features.reshape(1, -1)  # Reshape for prediction
    except Exception as e:
        print(f"Error processing {{image_path}}: {{e}}")
        return None

def predict_disease(image_path, model_path="model.pkl", labels_path="labels.json"):
    """
    Predict plant disease from image
    """
    # Load model and labels
    model = joblib.load(model_path)
    
    with open(labels_path, 'r') as f:
        class_names = json.load(f)
    
    # Extract features
    features = extract_features(image_path)
    if features is None:
        return None, None
    
    # Predict
    prediction = model.predict(features)[0]
    probabilities = model.predict_proba(features)[0]
    
    predicted_class = class_names[prediction]
    confidence = probabilities[prediction]
    
    return predicted_class, confidence

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python predict.py <image_path>")
        sys.exit(1)
    
    image_path = sys.argv[1]
    predicted_class, confidence = predict_disease(image_path)
    
    if predicted_class is None:
        print("Error: Could not process image")
        sys.exit(1)
    
    print(f"Predicted Disease: {{predicted_class}}")
    print(f"Confidence: {{confidence:.2%}}")
'''
        
        with open(os.path.join(self.output_dir, "predict.py"), 'w') as f:
            f.write(script_content)

def main():
    """
    Main training function
    """
    print("🌱 AgriSphere AI - Scikit-learn Plant Disease Classification")
    print("=" * 60)
    
    # Initialize trainer
    trainer = SklearnPlantDiseaseTrainer()
    
    # Prepare dataset
    X, y, class_names = trainer.prepare_dataset()
    
    # Train model
    model, accuracy, report, cm, X_test, y_test = trainer.train_model(X, y, class_names)
    
    # Save model and outputs
    trainer.save_model(model, class_names, accuracy, report, cm, X_test, y_test)
    
    print("\n" + "=" * 60)
    print("🎉 TRAINING COMPLETE!")
    print("=" * 60)
    print(f"✅ Model saved in: {OUTPUT_DIR}/")
    print(f"✅ Testing Accuracy: {accuracy:.4f}")
    print(f"✅ Model files:")
    print(f"   - model.pkl (Trained model)")
    print(f"   - labels.json (Class names)")
    print(f"   - classification_report.json")
    print(f"   - confusion_matrix.png")
    print(f"   - predict.py (Prediction script)")
    print(f"\nTo test prediction:")
    print(f"   python {OUTPUT_DIR}/predict.py <image_path>")

if __name__ == "__main__":
    main()