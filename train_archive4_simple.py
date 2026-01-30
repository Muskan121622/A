#!/usr/bin/env python3
"""
Simple version of the Archive4 training script with a fresh model architecture
"""

import os
import json
import shutil
import numpy as np
from PIL import Image
import tensorflow as tf
# Clear session to avoid conflicts
tf.keras.backend.clear_session()
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.layers import GlobalAveragePooling2D, Dense, Dropout, Input
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
INITIAL_EPOCHS = 10  # Increased for better training
FINE_TUNE_EPOCHS = 15   # Increased for better training
MIN_SAMPLES_PER_CLASS = 800
TARGET_ACCURACY = 0.95

class SimpleArchive4PlantDiseaseTrainer:
    def __init__(self, dataset_path="public/archive (4)/data", output_dir="simple_archive4_output"):
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
        print("🔄 Organizing Archive4 dataset...")
        
        # Define class mappings from Archive4 folder names to our structure
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
            
            print(f"📁 Processing {folder_name} → {target_class}")
            
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
                        print(f"❌ Corrupted image removed: {img_file}")
                        continue
            
            print(f"✅ Copied {image_count} valid images")
            processed_folders += 1
        
        print(f"📊 Processed {processed_folders} folders from Archive4 dataset")
    
    def clean_and_count_dataset(self):
        """Clean corrupted images and count samples per class"""
        print("🧹 Cleaning dataset and counting samples...")
        
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
                    print(f"❌ Removing corrupted: {img_file}")
                    img_file.unlink()
            
            if valid_images == 0:
                print(f"⚠️ Skipping empty class: {class_name}")
                shutil.rmtree(class_dir)
            else:
                self.class_counts[class_name] = valid_images
                print(f"📊 {class_name}: {valid_images} images")
        
        return self.class_counts
    
    def augment_data(self):
        """Augment classes with fewer samples to reach minimum threshold"""
        print("🔄 Augmenting underrepresented classes...")
        
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
                print(f"🔄 Augmenting {class_name}: need {needed} more images")
                
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
                print(f"✅ {class_name} now has {self.class_counts[class_name]} images")
    
    def create_fresh_model(self, num_classes):
        """Create a fresh model architecture without cached weights issues"""
        print("🏗️ Creating fresh model architecture...")
        
        # Create a new model from scratch
        inputs = Input(shape=(IMG_SIZE, IMG_SIZE, 3))
        
        # Use EfficientNetB0 but reinitialize weights
        base_model = EfficientNetB0(
            weights=None,  # No pre-trained weights to avoid conflicts
            include_top=False,
            input_tensor=inputs
        )
        
        # Add custom head
        x = base_model.output
        x = GlobalAveragePooling2D()(x)
        x = Dense(256, activation='relu')(x)
        x = Dropout(0.4)(x)
        predictions = Dense(num_classes, activation='softmax')(x)
        
        model = Model(inputs=inputs, outputs=predictions)
        
        # Compile model
        model.compile(
            optimizer=Adam(learning_rate=0.0001),
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        
        return model
    
    def train_model(self):
        """Train the model with callbacks and fine-tuning"""
        print("🚀 Starting model training...")
        
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
        print(f"📊 Training with {num_classes} classes: {list(self.class_mapping.values())}")
        
        # Create model
        model = self.create_fresh_model(num_classes)
        
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
                patience=7,  # Increased patience for GPU training
                restore_best_weights=True,
                verbose=1
            ),
            ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.2,
                patience=4,  # Increased patience for GPU training
                min_lr=1e-7,
                verbose=1
            )
        ]
        
        # Enable mixed precision for faster training on GPU
        try:
            from tensorflow.keras.mixed_precision import experimental as mixed_precision
            policy = mixed_precision.Policy('mixed_float16')
            mixed_precision.set_policy(policy)
            print("⚡ Mixed precision enabled for faster GPU training")
        except:
            print("ℹ️  Mixed precision not available, using default precision")
        
        # Train model
        print("🎯 Training model...")
        history = model.fit(
            train_generator,
            epochs=INITIAL_EPOCHS,
            validation_data=validation_generator,
            callbacks=callbacks,
            verbose=1
        )
        
        # Evaluate training
        val_accuracy = max(history.history['val_accuracy'])
        train_accuracy = max(history.history['accuracy'])
        
        print(f"📊 Results:")
        print(f"   Training Accuracy: {train_accuracy:.4f}")
        print(f"   Validation Accuracy: {val_accuracy:.4f}")
        
        # Save final model
        model.save(str(self.output_dir / 'model.h5'))
        model.save(str(self.output_dir / 'saved_model'))
        
        print(f"🎉 Training completed!")
        
        return model, train_generator, validation_generator, train_accuracy, val_accuracy

def main():
    """Main training pipeline"""
    print("\n🌱 AgriSphere AI - Simple Archive4 Plant Disease Classification Training")
    print("=" * 60)
    
    # Initialize trainer
    trainer = SimpleArchive4PlantDiseaseTrainer()
    
    # Step 1: Organize dataset
    trainer.organize_archive4_dataset()
    
    # Step 2: Clean and count
    class_counts = trainer.clean_and_count_dataset()
    print(f"\n📊 Class counts after cleaning:")
    for class_name, count in class_counts.items():
        print(f"   {class_name}: {count} images")
    
    # Step 3: Augment data
    trainer.augment_data()
    
    # Step 4: Train model
    model, train_gen, val_gen, train_acc, val_acc = trainer.train_model()
    
    # Final summary
    print("\n" + "=" * 60)
    print("🎉 TRAINING COMPLETE!")
    print("=" * 60)
    print(f"📊 Final Results:")
    print(f"   Training Accuracy: {train_acc:.4f}")
    print(f"   Validation Accuracy: {val_acc:.4f}")
    print(f"\n📁 Model files saved in: {trainer.output_dir}")
    print(f"   - model.h5 (Keras model)")
    print(f"   - saved_model/ (TensorFlow SavedModel)")
    print(f"   - labels.json (Class mapping)")

if __name__ == "__main__":
    main()