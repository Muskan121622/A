#!/usr/bin/env python3
"""
AgriSphere AI - Plant Disease Classification using Scikit-learn
Alternative training script using traditional ML instead of deep learning
"""

import os
import json
import numpy as np
from PIL import Image
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import joblib
from joblib import Parallel, delayed
import seaborn as sns
import matplotlib.pyplot as plt
from collections import Counter
import random
from xgboost import XGBClassifier

# Configuration
IMG_SIZE = 128  # Increased for better feature extraction
SAMPLES_PER_CLASS = 1000  # More samples for better training
OUTPUT_DIR = "sklearn_model_output"
N_JOBS = -1  # Use all available CPU cores

def extract_features_worker(image_path):
    """
    Standalone function for feature extraction to allow parallel processing
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
        # print(f"Error processing {image_path}: {e}")
        return None

class SklearnPlantDiseaseTrainer:
    def __init__(self):
        self.output_dir = OUTPUT_DIR
        os.makedirs(self.output_dir, exist_ok=True)

    def prepare_dataset(self, dataset_paths=None):
        """
        Prepare dataset with feature extraction from multiple sources using Parallel processing
        """
        if dataset_paths is None:
            dataset_paths = ["dataset", os.path.join("public", "archive (4)", "data")]
            
        print(f"Preparing dataset with parallel feature extraction (using {os.cpu_count()} cores)...")
        
        # first pass to collect all unique class names to ensure consistent ordering
        all_classes = set()
        for d_path in dataset_paths:
            if not os.path.exists(d_path):
                print(f"Warning: Dataset path not found: {d_path}")
                continue
                
            classes = [d for d in os.listdir(d_path) 
                      if os.path.isdir(os.path.join(d_path, d))]
            all_classes.update(classes)
            
        class_names = sorted(list(all_classes))
        print(f"Found {len(class_names)} total unique classes across all datasets")
        
        # Create a mapping from class name to index
        class_to_idx = {name: i for i, name in enumerate(class_names)}
        
        # Collect all image tasks
        all_image_tasks = [] # List of tuples (image_path, class_idx)
        
        for dataset_path in dataset_paths:
            if not os.path.exists(dataset_path):
                continue
            
            print(f"Scanning dataset source: {dataset_path}")
            current_class_dirs = [d for d in os.listdir(dataset_path) 
                                if os.path.isdir(os.path.join(dataset_path, d))]
            
            for class_name in current_class_dirs:
                class_path = os.path.join(dataset_path, class_name)
                class_idx = class_to_idx[class_name]
                
                image_files = [f for f in os.listdir(class_path) 
                              if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
                
                if len(image_files) > SAMPLES_PER_CLASS:
                    image_files = random.sample(image_files, SAMPLES_PER_CLASS)
                
                for img_file in image_files:
                    img_path = os.path.join(class_path, img_file)
                    all_image_tasks.append((img_path, class_idx))

        print(f"Total images to process: {len(all_image_tasks)}")
        print("Starting parallel feature extraction...")
        
        # Process in parallel
        # We process batches effectively by using n_jobs=-1
        results = Parallel(n_jobs=N_JOBS, verbose=10)(
            delayed(extract_features_worker)(img_path) for img_path, _ in all_image_tasks
        )
        
        # Filter None results (failed processing) and separate X, y
        X = []
        y = []
        
        for i, features in enumerate(results):
            if features is not None:
                X.append(features)
                y.append(all_image_tasks[i][1]) # Get label
        
        X = np.array(X)
        y = np.array(y)
        
        print(f"\nTotal Dataset prepared:")
        print(f"  Features shape: {X.shape}")
        print(f"  Labels shape: {y.shape}")
        
        return X, y, class_names

    def train_model(self, X, y, class_names):
        """
        Train Ensemble Model (Random Forest + XGBoost)
        """
        print("\nTraining Ensemble model (Random Forest + XGBoost)...")
        
        # Split dataset
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # 1. Random Forest
        print("  Initializing Random Forest...")
        rf_clf = RandomForestClassifier(
            n_estimators=300,
            max_depth=None, # Let it grow deep
            min_samples_split=2,
            min_samples_leaf=1,
            random_state=42,
            n_jobs=N_JOBS,
            class_weight='balanced'
        )
        
        # 2. XGBoost
        print("  Initializing XGBoost...")
        xgb_clf = XGBClassifier(
            n_estimators=300,
            max_depth=10,
            learning_rate=0.05,
            objective='multi:softprob',
            eval_metric='mlogloss',
            n_jobs=N_JOBS,
            random_state=42,
            tree_method='hist' # Faster training
        )
        
        # 3. Voting Classifier
        print("  Initializing Ensemble...")
        # Fix for WinError 87: Do not use parallel training for VotingClassifier on Windows
        # with large datasets. We train sequentially, but each model uses n_jobs=-1 internally.
        ensemble = VotingClassifier(
            estimators=[('rf', rf_clf), ('xgb', xgb_clf)],
            voting='soft',
            n_jobs=1 # Train sequentially to allow internal models to use full CPU
        )
        
        print("  Fitting model (this may take a while)...")
        ensemble.fit(X_train, y_train)
        
        # Evaluate model
        print("  Evaluating...")
        train_pred = ensemble.predict(X_train)
        test_pred = ensemble.predict(X_test)
        
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
        
        return ensemble, test_acc, report, cm, X_test, y_test

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