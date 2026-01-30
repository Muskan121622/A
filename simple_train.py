#!/usr/bin/env python3
"""
AgriSphere AI - Lightweight Plant Disease Classification
Using scikit-learn and basic ML for compatibility with Python 3.14
"""

import os
import json
import shutil
import numpy as np
from PIL import Image
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from sklearn.preprocessing import StandardScaler
import joblib
import matplotlib.pyplot as plt
import seaborn as sns

class SimplePlantDiseaseTrainer:

    def __init__(self, dataset_path="dataset", output_dir="simple_model_output"):

    def __init__(self, dataset_path="public/PlantVillage", output_dir="simple_model_output"):

        self.dataset_path = Path(dataset_path)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # Create organized dataset structure
        self.organized_path = self.output_dir / "organized_dataset"
        self.organized_path.mkdir(exist_ok=True)
        
        self.class_mapping = {}
        self.class_counts = {}
        
    def organize_dataset(self):
        """Organize PlantVillage dataset into our required structure"""
        print("🔄 Organizing dataset...")
        
        # Define class mappings from PlantVillage to our structure
        class_mappings = {
            'healthy': ['healthy'],
            'leaf_blight': ['Early_blight', 'Late_blight', 'Blight'],
            'leaf_rust': ['rust', 'Rust'],
            'leaf_spot': ['Bacterial_spot', 'Target_Spot', 'Septoria_leaf_spot', 'spot'],
            'stem_rot': ['rot', 'Rot'],
            'pest_infected': ['Spider_mites', 'mites', 'pest'],
            'nutrient_deficiency': ['YellowLeaf', 'Curl_Virus', 'mosaic_virus', 'Mold']
        }
        
        # Create class directories
        for class_name in class_mappings.keys():
            (self.organized_path / class_name).mkdir(exist_ok=True)
        
        # Process each folder in PlantVillage
        for folder in self.dataset_path.iterdir():
            if not folder.is_dir():
                continue
                
            folder_name = folder.name
            target_class = 'healthy'  # default
            
            # Determine target class based on folder name
            for class_name, keywords in class_mappings.items():
                if any(keyword.lower() in folder_name.lower() for keyword in keywords):
                    target_class = class_name
                    break
            
            print(f"📁 Processing {folder_name} → {target_class}")
            
            # Copy images to organized structure (limit to 200 per folder for speed)
            image_count = 0
            for img_file in folder.glob("*"):
                if image_count >= 200:  # Limit for demo
                    break
                if img_file.suffix.lower() in ['.jpg', '.jpeg', '.png']:
                    try:
                        # Verify image can be opened
                        with Image.open(img_file) as img:
                            if img.size[0] > 0 and img.size[1] > 0:
                                target_file = self.organized_path / target_class / f"{folder_name}_{img_file.name}"
                                shutil.copy2(img_file, target_file)
                                image_count += 1
                    except Exception as e:
                        print(f"❌ Corrupted image removed: {img_file}")
                        continue
            
            print(f"✅ Copied {image_count} valid images")
    
    def extract_features(self, image_path, size=(64, 64)):
        """Extract simple features from image"""
        try:
            img = Image.open(image_path)
            img = img.convert('RGB')
            img = img.resize(size)
            
            # Convert to numpy array and flatten
            img_array = np.array(img)
            features = img_array.flatten()
            
            # Add some basic statistical features
            mean_rgb = np.mean(img_array, axis=(0, 1))
            std_rgb = np.std(img_array, axis=(0, 1))
            
            # Combine features
            all_features = np.concatenate([features, mean_rgb, std_rgb])
            return all_features
            
        except Exception as e:
            print(f"Error processing {image_path}: {e}")
            return None
    
    def prepare_dataset(self):
        """Prepare dataset for training"""
        print("🔄 Preparing dataset...")
        
        X = []
        y = []
        class_names = []
        
        for class_dir in self.organized_path.iterdir():
            if not class_dir.is_dir():
                continue
                
            class_name = class_dir.name
            class_names.append(class_name)
            class_idx = len(class_names) - 1
            
            print(f"📊 Processing class: {class_name}")
            
            image_count = 0
            for img_file in class_dir.glob("*"):
                if image_count >= 100:  # Limit for demo speed
                    break
                    
                features = self.extract_features(img_file)
                if features is not None:
                    X.append(features)
                    y.append(class_idx)
                    image_count += 1
            
            self.class_counts[class_name] = image_count
            print(f"✅ {class_name}: {image_count} samples")
        
        # Create class mapping
        self.class_mapping = {str(i): name for i, name in enumerate(class_names)}
        
        return np.array(X), np.array(y), class_names
    
    def train_model(self, X, y, class_names):
        """Train Random Forest model"""
        print("🚀 Training Random Forest model...")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Scale features
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        # Train Random Forest
        model = RandomForestClassifier(
            n_estimators=100,
            max_depth=20,
            random_state=42,
            n_jobs=-1
        )
        
        model.fit(X_train_scaled, y_train)
        
        # Predictions
        train_pred = model.predict(X_train_scaled)
        test_pred = model.predict(X_test_scaled)
        
        # Accuracies
        train_accuracy = accuracy_score(y_train, train_pred)
        test_accuracy = accuracy_score(y_test, test_pred)
        
        print(f"📊 Training Accuracy: {train_accuracy:.4f}")
        print(f"📊 Test Accuracy: {test_accuracy:.4f}")
        
        # Save model and scaler
        joblib.dump(model, self.output_dir / 'model.pkl')
        joblib.dump(scaler, self.output_dir / 'scaler.pkl')
        
        # Save class mapping
        with open(self.output_dir / 'labels.json', 'w') as f:
            json.dump(self.class_mapping, f, indent=2)
        
        # Classification report
        report = classification_report(y_test, test_pred, target_names=class_names, output_dict=True)
        with open(self.output_dir / 'classification_report.json', 'w') as f:
            json.dump(report, f, indent=2)
        
        # Confusion matrix
        cm = confusion_matrix(y_test, test_pred)
        
        # Plot confusion matrix
        plt.figure(figsize=(10, 8))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                   xticklabels=class_names, yticklabels=class_names)
        plt.title('Confusion Matrix')
        plt.ylabel('True Label')
        plt.xlabel('Predicted Label')
        plt.tight_layout()
        plt.savefig(self.output_dir / 'confusion_matrix.png', dpi=300, bbox_inches='tight')
        plt.close()
        
        return model, scaler, train_accuracy, test_accuracy, report, cm
    
    def create_inference_script(self):
        """Create prediction script"""
        inference_code = '''#!/usr/bin/env python3
"""
AgriSphere AI - Simple Plant Disease Prediction
Using scikit-learn Random Forest model
"""

import json
import numpy as np
from PIL import Image
import joblib
from pathlib import Path

class SimplePlantDiseasePredictor:
    def __init__(self, model_path="simple_model_output/model.pkl", 
                 scaler_path="simple_model_output/scaler.pkl",
                 labels_path="simple_model_output/labels.json"):
        self.model = joblib.load(model_path)
        self.scaler = joblib.load(scaler_path)
        
        with open(labels_path, 'r') as f:
            self.class_mapping = json.load(f)
        
        print(f"✅ Model loaded with {len(self.class_mapping)} classes")
        print(f"📋 Classes: {list(self.class_mapping.values())}")
    
    def extract_features(self, image_path, size=(64, 64)):
        """Extract features from image"""
        img = Image.open(image_path)
        img = img.convert('RGB')
        img = img.resize(size)
        
        # Convert to numpy array and flatten
        img_array = np.array(img)
        features = img_array.flatten()
        
        # Add statistical features
        mean_rgb = np.mean(img_array, axis=(0, 1))
        std_rgb = np.std(img_array, axis=(0, 1))
        
        # Combine features
        all_features = np.concatenate([features, mean_rgb, std_rgb])
        return all_features.reshape(1, -1)
    
    def predict(self, image_path):
        """Predict disease from image"""
        # Extract features
        features = self.extract_features(image_path)
        
        # Scale features
        features_scaled = self.scaler.transform(features)
        
        # Make prediction
        prediction = self.model.predict(features_scaled)[0]
        probabilities = self.model.predict_proba(features_scaled)[0]
        
        # Get class name and confidence
        predicted_class = self.class_mapping[str(prediction)]
        confidence = probabilities[prediction]
        
        return predicted_class, confidence
    
    def predict_with_details(self, image_path):
        """Predict with detailed probabilities"""
        features = self.extract_features(image_path)
        features_scaled = self.scaler.transform(features)
        probabilities = self.model.predict_proba(features_scaled)[0]
        
        results = []
        for idx, prob in enumerate(probabilities):
            class_name = self.class_mapping[str(idx)]
            results.append((class_name, prob))
        
        # Sort by probability
        results.sort(key=lambda x: x[1], reverse=True)
        return results

# Example usage
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) != 2:
        print("Usage: python simple_predict.py <image_path>")
        sys.exit(1)
    
    image_path = sys.argv[1]
    
    # Initialize predictor
    predictor = SimplePlantDiseasePredictor()
    
    # Make prediction
    predicted_class, confidence = predictor.predict(image_path)
    
    print(f"\\n🔍 Prediction Results:")
    print(f"📸 Image: {image_path}")
    print(f"🏷️  Predicted Class: {predicted_class}")
    print(f"🎯 Confidence: {confidence:.2%}")
    
    # Show top 3 predictions
    print(f"\\n📊 Top 3 Predictions:")
    detailed_results = predictor.predict_with_details(image_path)
    for i, (class_name, prob) in enumerate(detailed_results[:3]):
        print(f"   {i+1}. {class_name}: {prob:.2%}")
'''
        
        with open(self.output_dir / 'simple_predict.py', 'w') as f:
            f.write(inference_code)
        
        print("✅ Inference script created: simple_predict.py")

def main():
    """Main training pipeline"""
    print("🌱 AgriSphere AI - Simple Plant Disease Classification Training")
    print("=" * 60)
    
    # Initialize trainer
    trainer = SimplePlantDiseaseTrainer()
    
    # Step 1: Organize dataset
    trainer.organize_dataset()
    
    # Step 2: Prepare dataset
    X, y, class_names = trainer.prepare_dataset()
    
    print(f"\\n📊 Dataset prepared:")
    print(f"   Total samples: {len(X)}")
    print(f"   Features per sample: {X.shape[1]}")
    print(f"   Classes: {len(class_names)}")
    
    for class_name, count in trainer.class_counts.items():
        print(f"   {class_name}: {count} samples")
    
    # Step 3: Train model
    model, scaler, train_acc, test_acc, report, cm = trainer.train_model(X, y, class_names)
    
    # Step 4: Create inference script
    trainer.create_inference_script()
    
    # Final summary
    print("\\n" + "=" * 60)
    print("🎉 TRAINING COMPLETE!")
    print("=" * 60)
    print(f"📊 Final Results:")
    print(f"   Training Accuracy: {train_acc:.4f}")
    print(f"   Test Accuracy: {test_acc:.4f}")
    print(f"\\n📁 Model files saved in: {trainer.output_dir}")
    print(f"   - model.pkl (Random Forest model)")
    print(f"   - scaler.pkl (Feature scaler)")
    print(f"   - labels.json (Class mapping)")
    print(f"   - simple_predict.py (Inference script)")
    print(f"   - confusion_matrix.png")
    print(f"   - classification_report.json")
    
    print(f"\\n🚀 To test prediction:")
    print(f"   python simple_model_output/simple_predict.py <image_path>")

if __name__ == "__main__":
    main()