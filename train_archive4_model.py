#!/usr/bin/env python3
"""
AgriSphere AI - Archive4 Plant Disease Classification Model Training
High-accuracy CNN model using EfficientNetB0 with comprehensive data processing
Incorporates the extensive archive4 dataset from public/archive (4)/data
"""

import sys

# Fix NumPy compatibility
import numpy as np
if not hasattr(np, 'dtypes'):
    np.dtypes = type('dtypes', (), {})()

def check_environment_compatibility():
    """Check if the environment is compatible for TensorFlow training"""
    try:
        import numpy as np
        tf_version = "unknown"
        np_version = np.__version__
        
        # Try importing TensorFlow
        import tensorflow as tf
        tf_version = tf.__version__
        
        print(f"Environment check passed: TensorFlow {tf_version}, NumPy {np_version}")
        return True
        
    except ImportError as e:
        print(f"Missing required package: {e}")
        print("\nInstall required packages:")
        print("   pip install tensorflow numpy Pillow scikit-learn matplotlib seaborn pandas")
        return False
    except Exception as e:
        print(f"Environment check failed: {e}")
        return False

# Check environment before proceeding
if not check_environment_compatibility():
    print("\nTraining aborted due to environment incompatibility")
    sys.exit(1)

import os
import json
import shutil
import numpy as np
import pandas as pd
from PIL import Image
import tensorflow as tf
# Clear session to avoid conflicts
tf.keras.backend.clear_session()
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.layers import GlobalAveragePooling2D, Dense, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path

# Configuration
IMG_SIZE = 224
BATCH_SIZE = 64  # Increased for GPU
INITIAL_EPOCHS = 10  # Increased for GPU
FINE_TUNE_EPOCHS = 10  # Increased for GPU
MIN_SAMPLES_PER_CLASS = 800
TARGET_ACCURACY = 0.95

class Archive4PlantDiseaseTrainer:

    def __init__(self, dataset_path="public/archive (4)/data", output_dir="archive4_model_output"):
        self.dataset_path = Path(dataset_path)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # Create organized dataset structure
        self.organized_path = self.output_dir / "organized_dataset"
        self.organized_path.mkdir(exist_ok=True)
        
        self.class_mapping = {}
        self.class_counts = {}
        
    def organize_archive4_dataset(self):
        """Organize Archive4 dataset into our required structure"""
        print(" Organizing Archive4 dataset...")
        
        # Define class mappings from Archive4 folder names to our structure
        # This mapping groups similar diseases together for better generalization
        class_mappings = {
            'healthy': ['healthy'],
            'leaf_blight': ['blight', 'early_blight', 'late_blight', 'bacterial_wilt'],
            'leaf_rust': ['rust'],
            'leaf_spot': ['spot', 'septoria', 'target_spot', 'leaf_scorch', 'brown_spot', 'gray_spot', 'black_spot'],
            'rot': ['rot', 'fruit_rot'],
            'pest_infected': ['pest', 'mite', 'aphid', 'beetle', 'caterpillar', 'thrip', 'whitefly', 'spider_mite'],
            'viral_disease': ['virus', 'mosaic', 'curl_virus', 'yellow_leaf'],
            'powdery_mildew': ['powdery_mildew'],
            'scab': ['scab'],
            'anthracnose': ['anthracnose'],
            'downy_mildew': ['downy_mildew']
        }
        
        # Create class directories
        for class_name in class_mappings.keys():
            (self.organized_path / class_name).mkdir(exist_ok=True)
        
        # Process each folder in Archive4 dataset
        processed_folders = 0
        for folder in self.dataset_path.iterdir():
            if not folder.is_dir():
                continue
                
            folder_name = folder.name
            target_class = 'unknown'  # default
            
            # Extract disease name from folder name (everything after ___)
            if '___' in folder_name:
                disease_part = folder_name.split('___')[1].lower()
                
                # Determine target class based on disease name
                for class_name, keywords in class_mappings.items():
                    if any(keyword.lower() in disease_part for keyword in keywords):
                        target_class = class_name
                        break
                
                # If no match found, use the disease part as class name
                if target_class == 'unknown':
                    target_class = disease_part.replace(' ', '_')
                    (self.organized_path / target_class).mkdir(exist_ok=True)
            
            print(f" Processing {folder_name} -> {target_class}")
            
            # Copy images to organized structure
            image_count = 0
            for img_file in folder.glob("*"):
                if img_file.suffix.lower() in ['.jpg', '.jpeg', '.png']:
                    try:
                        # Verify image can be opened
                        with Image.open(img_file) as img:
                            if img.size[0] > 0 and img.size[1] > 0:
                                target_file = self.organized_path / target_class / f"{folder_name}_{img_file.name}"
                                shutil.copy2(img_file, target_file)
                                image_count += 1
                    except Exception as e:
                        print(f"Corrupted image removed: {img_file}")
                        continue
            
            print(f" Copied {image_count} valid images")
            processed_folders += 1
        
        print(f"Processed {processed_folders} folders from Archive4 dataset")
    
    def clean_and_count_dataset(self):
        """Clean corrupted images and count samples per class"""
        print(" Cleaning dataset and counting samples...")
        
        for class_dir in self.organized_path.iterdir():
            if not class_dir.is_dir():
                continue
                
            class_name = class_dir.name
            valid_images = 0
            
            for img_file in class_dir.glob("*"):
                try:
                    with Image.open(img_file) as img:
                        # Verify image is valid
                        img.verify()
                        valid_images += 1
                except Exception:
                    print(f" Removing corrupted: {img_file}")
                    img_file.unlink()
            
            if valid_images == 0:
                print(f" Skipping empty class: {class_name}")
                shutil.rmtree(class_dir)
            else:
                self.class_counts[class_name] = valid_images
                print(f" {class_name}: {valid_images} images")
        
        return self.class_counts
    
    def augment_data(self):
        """Augment classes with fewer samples to reach minimum threshold"""
        print(" Augmenting underrepresented classes...")
        
        datagen = ImageDataGenerator(
            rotation_range=20,
            shear_range=0.2,
            zoom_range=0.2,
            horizontal_flip=True,
            brightness_range=[0.8, 1.2],
            fill_mode='nearest'
        )
        
        for class_name, count in self.class_counts.items():
            if count < MIN_SAMPLES_PER_CLASS:
                needed = MIN_SAMPLES_PER_CLASS - count
                print(f" Augmenting {class_name}: need {needed} more images")
                
                class_dir = self.organized_path / class_name
                augmented_dir = self.organized_path / f"{class_name}_augmented"
                augmented_dir.mkdir(exist_ok=True)
                
                # Get existing images
                existing_images = list(class_dir.glob("*"))
                augmented_count = 0
                
                while augmented_count < needed:
                    for img_path in existing_images:
                        if augmented_count >= needed:
                            break
                            
                        try:
                            img = Image.open(img_path)
                            img_array = np.array(img.resize((IMG_SIZE, IMG_SIZE)))
                            img_array = np.expand_dims(img_array, axis=0)
                            
                            # Generate augmented image
                            aug_iter = datagen.flow(img_array, batch_size=1)
                            aug_img = next(aug_iter)[0].astype(np.uint8)
                            
                            # Save augmented image
                            aug_pil = Image.fromarray(aug_img)
                            aug_path = class_dir / f"aug_{augmented_count}_{img_path.name}"
                            aug_pil.save(aug_path)
                            augmented_count += 1
                            
                        except Exception as e:
                            continue
                
                # Update count
                self.class_counts[class_name] = len(list(class_dir.glob("*")))
                print(f" {class_name} now has {self.class_counts[class_name]} images")
    
    def create_model(self, num_classes):
        """Create EfficientNetB0-based model"""
        print(" Creating model architecture...")
        
        # Clear any existing models
        tf.keras.backend.clear_session()
        
        # Load pre-trained EfficientNetB0 without weights to avoid conflicts
        base_model = EfficientNetB0(
            weights=None,
            include_top=False,
            input_shape=(IMG_SIZE, IMG_SIZE, 3)
        )
        
        # Freeze base model initially
        base_model.trainable = False
        
        # Add custom head
        x = base_model.output
        x = GlobalAveragePooling2D()(x)
        x = Dense(256, activation='relu')(x)
        x = Dropout(0.4)(x)
        predictions = Dense(num_classes, activation='softmax')(x)
        
        model = Model(inputs=base_model.input, outputs=predictions)
        
        # Compile model
        model.compile(
            optimizer=Adam(learning_rate=0.0001),
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        
        return model, base_model
    
    def train_model(self):
        """Train the model with callbacks and fine-tuning"""
        print(" Starting model training...")
        
        # Create data generators
        train_datagen = ImageDataGenerator(
            rescale=1./255,
            rotation_range=20,
            shear_range=0.2,
            zoom_range=0.2,
            horizontal_flip=True,
            brightness_range=[0.8, 1.2],
            validation_split=0.2
        )
        
        test_datagen = ImageDataGenerator(
            rescale=1./255,
            validation_split=0.2
        )
        
        # Create data generators
        train_generator = train_datagen.flow_from_directory(
            self.organized_path,
            target_size=(IMG_SIZE, IMG_SIZE),
            batch_size=BATCH_SIZE,
            class_mode='categorical',
            subset='training'
        )
        
        validation_generator = test_datagen.flow_from_directory(
            self.organized_path,
            target_size=(IMG_SIZE, IMG_SIZE),
            batch_size=BATCH_SIZE,
            class_mode='categorical',
            subset='validation'
        )
        
        # Save class mapping
        self.class_mapping = {v: k for k, v in train_generator.class_indices.items()}
        with open(self.output_dir / 'labels.json', 'w') as f:
            json.dump(self.class_mapping, f, indent=2)
        
        num_classes = len(self.class_mapping)
        print(f" Training with {num_classes} classes: {list(self.class_mapping.values())}")
        
        # Create model
        model, base_model = self.create_model(num_classes)
        
        # Callbacks
        callbacks = [
            ModelCheckpoint(
                str(self.output_dir / 'best_model.h5'),
                monitor='val_accuracy',
                save_best_only=True,
                verbose=1
            ),
            EarlyStopping(
                monitor='val_accuracy',
                patience=5,
                restore_best_weights=True,
                verbose=1
            ),
            ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.2,
                patience=3,
                min_lr=1e-7,
                verbose=1
            )
        ]
        
        # Initial training
        print(" Phase 1: Training with frozen base model...")
        history1 = model.fit(
            train_generator,
            epochs=INITIAL_EPOCHS,
            validation_data=validation_generator,
            callbacks=callbacks,
            verbose=1
        )
        
        # Evaluate initial training
        val_accuracy = max(history1.history['val_accuracy'])
        train_accuracy = max(history1.history['accuracy'])
        
        print(f" Initial Results:")
        print(f"   Training Accuracy: {train_accuracy:.4f}")
        print(f"   Validation Accuracy: {val_accuracy:.4f}")
        
        # Fine-tuning if accuracy is below threshold
        if val_accuracy < TARGET_ACCURACY:
            print(f" Accuracy below {TARGET_ACCURACY:.1%}, starting fine-tuning...")
            
            # Unfreeze last 50 layers
            base_model.trainable = True
            for layer in base_model.layers[:-50]:
                layer.trainable = False
            
            # Recompile with lower learning rate
            model.compile(
                optimizer=Adam(learning_rate=0.00001),
                loss='categorical_crossentropy',
                metrics=['accuracy']
            )
            
            # Fine-tune training
            print(" Phase 2: Fine-tuning unfrozen layers...")
            history2 = model.fit(
                train_generator,
                epochs=FINE_TUNE_EPOCHS,
                validation_data=validation_generator,
                callbacks=callbacks,
                verbose=1
            )
            
            # Update accuracies
            val_accuracy = max(history2.history['val_accuracy'])
            train_accuracy = max(history2.history['accuracy'])
        
        # Save final model
        model.save(str(self.output_dir / 'model.h5'))
        model.save(str(self.output_dir / 'saved_model'))
        
        print(f"2 Final Results:")
        print(f"   Training Accuracy: {train_accuracy:.4f}")
        print(f"   Validation Accuracy: {val_accuracy:.4f}")
        
        return model, train_generator, validation_generator, train_accuracy, val_accuracy
    
    def evaluate_model(self, model, validation_generator):
        """Generate evaluation metrics"""
        print(" Generating evaluation metrics...")
        
        # Predictions
        validation_generator.reset()
        predictions = model.predict(validation_generator)
        predicted_classes = np.argmax(predictions, axis=1)
        true_classes = validation_generator.classes
        
        # Classification report
        class_names = list(self.class_mapping.values())
        report = classification_report(
            true_classes, 
            predicted_classes, 
            target_names=class_names,
            output_dict=True
        )
        
        # Save classification report
        with open(self.output_dir / 'classification_report.json', 'w') as f:
            json.dump(report, f, indent=2)
        
        # Confusion matrix
        cm = confusion_matrix(true_classes, predicted_classes)
        
        # Plot confusion matrix
        plt.figure(figsize=(12, 10))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                   xticklabels=class_names, yticklabels=class_names)
        plt.title('Confusion Matrix')
        plt.ylabel('True Label')
        plt.xlabel('Predicted Label')
        plt.tight_layout()
        plt.savefig(self.output_dir / 'confusion_matrix.png', dpi=300, bbox_inches='tight')
        plt.close()
        
        return report, cm
    
    def create_inference_script(self):
        """Create prediction script for inference"""
        inference_code = '''#!/usr/bin/env python3
"""
AgriSphere AI - Archive4 Plant Disease Prediction Script
Load trained model and predict disease from plant images
"""
import json
import numpy as np
from PIL import Image
import tensorflow as tf
from pathlib import Path

class Archive4PlantDiseasePredictor:
    def __init__(self, model_path="archive4_model_output/model.h5", labels_path="archive4_model_output/labels.json"):
        self.model = tf.keras.models.load_model(model_path)
        
        with open(labels_path, 'r') as f:
            self.class_mapping = json.load(f)
        
        print(f" Model loaded with {len(self.class_mapping)} classes")
        print(f" Classes: {list(self.class_mapping.values())}")
    
    def preprocess_image(self, image_path):
        """Preprocess image for prediction"""
        img = Image.open(image_path)
        img = img.convert('RGB')
        img = img.resize((224, 224))
        img_array = np.array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)
        return img_array
    
    def predict(self, image_path):
        """Predict disease from image"""
        # Preprocess image
        img_array = self.preprocess_image(image_path)
        
        # Make prediction
        predictions = self.model.predict(img_array, verbose=0)
        predicted_class_idx = np.argmax(predictions[0])
        confidence = predictions[0][predicted_class_idx]
        
        # Get class name
        predicted_class = self.class_mapping[str(predicted_class_idx)]
        
        return predicted_class, confidence
    
    def predict_with_details(self, image_path):
        """Predict with detailed probabilities for all classes"""
        img_array = self.preprocess_image(image_path)
        predictions = self.model.predict(img_array, verbose=0)[0]
        
        results = []
        for idx, prob in enumerate(predictions):
            class_name = self.class_mapping[str(idx)]
            results.append((class_name, prob))
        
        # Sort by probability
        results.sort(key=lambda x: x[1], reverse=True)
        return results

# Example usage
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) != 2:
        print("Usage: python predict_archive4.py <image_path>")
        sys.exit(1)
    
    image_path = sys.argv[1]
    
    # Initialize predictor
    predictor = Archive4PlantDiseasePredictor()
    
    # Make prediction
    predicted_class, confidence = predictor.predict(image_path)
    
    print(f"\\n Prediction Results:")
    print(f" Image: {image_path}")
    print(f" Predicted Class: {predicted_class}")
    print(f" Confidence: {confidence:.2%}")
    
    # Show top 3 predictions
    print(f"\\n Top 3 Predictions:")
    detailed_results = predictor.predict_with_details(image_path)
    for i, (class_name, prob) in enumerate(detailed_results[:3]):
        print(f"   {i+1}. {class_name}: {prob:.2%}")
'''
        
        with open(self.output_dir / 'predict_archive4.py', 'w') as f:
            f.write(inference_code)
        
        print(" Inference script created: predict_archive4.py")

def main():
    """Main training pipeline"""
    print("\n AgriSphere AI - Archive4 Plant Disease Classification Training")
    print("=" * 60)
    
    # Enable GPU
    gpus = tf.config.list_physical_devices('GPU')
    if gpus:
        print(f" GPU detected: {len(gpus)} GPU(s) available")
        for gpu in gpus:
            tf.config.experimental.set_memory_growth(gpu, True)
    else:
        print(" No GPU detected, using CPU")
    
    # Initialize trainer
    trainer = Archive4PlantDiseaseTrainer()
    
    # Step 1: Organize dataset
    trainer.organize_archive4_dataset()
    
    # Step 2: Clean and count
    class_counts = trainer.clean_and_count_dataset()
    print(f"\n Class counts after cleaning:")
    for class_name, count in class_counts.items():
        print(f"   {class_name}: {count} images")
    
    # Step 3: Augment data
    trainer.augment_data()
    
    # Step 4: Train model
    model, train_gen, val_gen, train_acc, val_acc = trainer.train_model()
    
    # Step 5: Evaluate model
    report, cm = trainer.evaluate_model(model, val_gen)
    
    # Step 6: Create inference script
    trainer.create_inference_script()
    
    # Final summary
    print("\n" + "=" * 60)
    print(" TRAINING COMPLETE!")
    print("=" * 60)
    print(f" Final Results:")
    print(f"   Training Accuracy: {train_acc:.4f}")
    print(f"   Validation Accuracy: {val_acc:.4f}")
    print(f"\n Model files saved in: {trainer.output_dir}")
    print(f"   - model.h5 (Keras model)")
    print(f"   - saved_model/ (TensorFlow SavedModel)")
    print(f"   - labels.json (Class mapping)")
    print(f"   - predict_archive4.py (Inference script)")
    print(f"   - confusion_matrix.png")
    print(f"   - classification_report.json")
    
    print(f"\n To test prediction:")
    print(f"   python archive4_model_output/predict_archive4.py <image_path>")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n Training interrupted by user")
    except Exception as e:
        print(f"\n\n Training failed with error: {e}")
        print("\n Check TENSORFLOW_FIX.md for troubleshooting tips")
        sys.exit(1)