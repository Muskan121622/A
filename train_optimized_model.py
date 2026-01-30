import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
import json
import shutil
from PIL import Image
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import classification_report, confusion_matrix

class OptimizedPlantDiseaseTrainer:
    def __init__(self):
        self.img_size = (224, 224)
        self.batch_size = 64  # Increased batch size

        self.base_path = r"C:\Users\muska_ak5dqij\OneDrive\Desktop\agrispace\agrisphere-ai-93aee827\dataset"
        self.base_path = r"C:\Users\muska_ak5dqij\OneDrive\Desktop\agrispace\agrisphere-ai-93aee827\public"

        self.output_dir = "optimized_model"
        self.max_samples_per_class = 2000  # Limit to prevent overly large dataset
        
        # Disease mapping
        self.disease_mapping = {
            # PlantVillage mappings
            'Pepper__bell___Bacterial_spot': 'leaf_spot',
            'Pepper__bell___healthy': 'healthy',
            'Potato___Early_blight': 'leaf_blight',
            'Potato___healthy': 'healthy',
            'Potato___Late_blight': 'leaf_blight',
            'Tomato_Bacterial_spot': 'leaf_spot',
            'Tomato_Early_blight': 'leaf_blight',
            'Tomato_healthy': 'healthy',
            'Tomato_Late_blight': 'leaf_blight',
            'Tomato_Leaf_Mold': 'nutrient_deficiency',
            'Tomato_Septoria_leaf_spot': 'leaf_spot',
            'Tomato_Spider_mites_Two_spotted_spider_mite': 'pest_infected',
            'Tomato__Target_Spot': 'leaf_spot',
            'Tomato__Tomato_mosaic_virus': 'nutrient_deficiency',
            'Tomato__Tomato_YellowLeaf__Curl_Virus': 'nutrient_deficiency',
            
            # Archive (4) mappings - key ones only
            'Apple___healthy': 'healthy',
            'Apple___alternaria_leaf_spot': 'leaf_spot',
            'Apple___black_rot': 'stem_rot',
            'Apple___rust': 'leaf_rust',
            'Apple___scab': 'leaf_spot',
            'Bell_pepper___bacterial_spot': 'leaf_spot',
            'Bell_pepper___healthy': 'healthy',
            'Corn___healthy': 'healthy',
            'Corn___common_rust': 'leaf_rust',
            'Corn___gray_leaf_spot': 'leaf_spot',
            'Corn___northern_leaf_blight': 'leaf_blight',
            'Grape___healthy': 'healthy',
            'Grape___black_rot': 'stem_rot',
            'Grape___Leaf_blight': 'leaf_blight',
            'Potato___early_blight': 'leaf_blight',
            'Potato___healthy': 'healthy',
            'Potato___late_blight': 'leaf_blight',
            'Rice___bacterial_blight': 'leaf_blight',
            'Rice___blast': 'leaf_spot',
            'Rice___brown_spot': 'leaf_spot',
            'Tomato___bacterial_spot': 'leaf_spot',
            'Tomato___early_blight': 'leaf_blight',
            'Tomato___healthy': 'healthy',
            'Tomato___late_blight': 'leaf_blight',
            'Tomato___leaf_curl': 'nutrient_deficiency',
            'Tomato___septoria_leaf_spot': 'leaf_spot',
            'Tomato___spider_mites': 'pest_infected'
        }

    def is_valid_image(self, image_path):
        try:
            with Image.open(image_path) as img:
                img.verify()
            return True
        except:
            return False

    def create_balanced_dataset(self):
        """Create a balanced, optimized dataset"""
        print("OPTIMIZED DATASET CREATION")
        print("=" * 60)
        
        # Clean existing dataset
        if os.path.exists("optimized_dataset"):
            try:
                shutil.rmtree("optimized_dataset")
            except:
                pass
        
        # Create structure
        for class_name in ['healthy', 'leaf_blight', 'leaf_rust', 'leaf_spot', 'stem_rot', 'pest_infected', 'nutrient_deficiency']:
            os.makedirs(f"optimized_dataset/{class_name}", exist_ok=True)
        
        class_counts = {}
        
        # Process both datasets with sampling
        self._process_dataset_optimized(class_counts)
        
        print(f"\nOptimized class distribution:")
        total_images = 0
        for class_name, count in sorted(class_counts.items()):
            print(f"   {class_name}: {count} images")
            total_images += count
        
        print(f"\nTotal dataset size: {total_images} images")
        return class_counts

    def _process_dataset_optimized(self, class_counts):
        """Process datasets with intelligent sampling"""
        
        # Process PlantVillage
        plantvillage_path = os.path.join(self.base_path, "PlantVillage")
        if os.path.exists(plantvillage_path):
            self._sample_from_source(plantvillage_path, class_counts, "PlantVillage", 800)
        
        # Process Archive (4) - selective folders only
        archive_path = os.path.join(self.base_path, "archive (4)", "data")
        if os.path.exists(archive_path):
            self._sample_from_source(archive_path, class_counts, "Archive", 1200)

    def _sample_from_source(self, source_path, class_counts, source_name, max_per_folder):
        """Sample images from source with limits"""
        
        for folder_name in os.listdir(source_path):
            if folder_name not in self.disease_mapping:
                continue
                
            folder_path = os.path.join(source_path, folder_name)
            if not os.path.isdir(folder_path):
                continue
                
            target_class = self.disease_mapping[folder_name]
            current_class_count = class_counts.get(target_class, 0)
            
            # Skip if class already has enough samples
            if current_class_count >= self.max_samples_per_class:
                continue
            
            print(f"Sampling {folder_name} -> {target_class} ({source_name})")
            
            # Get all valid images
            image_files = [f for f in os.listdir(folder_path) 
                          if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
            
            # Sample intelligently
            needed = min(max_per_folder, self.max_samples_per_class - current_class_count)
            if len(image_files) > needed:
                # Take every nth image for better distribution
                step = len(image_files) // needed
                sampled_files = image_files[::step][:needed]
            else:
                sampled_files = image_files
            
            valid_count = 0
            for filename in sampled_files:
                src_path = os.path.join(folder_path, filename)
                
                if self.is_valid_image(src_path):
                    dst_path = os.path.join(f"optimized_dataset/{target_class}", 
                                          f"{source_name}_{valid_count}_{filename}")
                    try:
                        shutil.copy2(src_path, dst_path)
                        valid_count += 1
                    except:
                        continue
            
            class_counts[target_class] = class_counts.get(target_class, 0) + valid_count
            print(f"   Added {valid_count} images")

    def create_efficient_model(self, num_classes):
        """Create EfficientNetB0 model with optimizations"""
        print("\nMODEL ARCHITECTURE")
        print("=" * 60)
        
        # EfficientNetB0 base
        base_model = EfficientNetB0(
            weights='imagenet',
            include_top=False,
            input_shape=(224, 224, 3)
        )
        
        # Freeze most layers initially
        base_model.trainable = False
        
        # Custom head
        x = base_model.output
        x = GlobalAveragePooling2D()(x)
        x = Dense(256, activation='relu')(x)
        x = Dropout(0.4)(x)
        predictions = Dense(num_classes, activation='softmax')(x)
        
        model = Model(inputs=base_model.input, outputs=predictions)
        
        # Compile
        model.compile(
            optimizer=Adam(learning_rate=0.001),  # Higher initial LR
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        
        print(f"Model: EfficientNetB0 + Custom Head")
        print(f"Classes: {num_classes}")
        print(f"Trainable params: {model.count_params():,}")
        
        return model, base_model

    def train_optimized_model(self):
        """Train with optimized strategy"""
        print("OPTIMIZED PLANT DISEASE CLASSIFICATION TRAINING")
        print("Target: High Accuracy with Efficient Training")
        print("=" * 60)
        
        # Create optimized dataset
        class_counts = self.create_balanced_dataset()
        
        if not class_counts:
            print("No training data found!")
            return False
        
        # Create output directory
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Optimized data generators
        train_datagen = ImageDataGenerator(
            rescale=1./255,
            validation_split=0.2,
            rotation_range=20,
            width_shift_range=0.2,
            height_shift_range=0.2,
            horizontal_flip=True,
            zoom_range=0.2,
            brightness_range=[0.8, 1.2],
            fill_mode='nearest'
        )
        
        train_generator = train_datagen.flow_from_directory(
            'optimized_dataset',
            target_size=self.img_size,
            batch_size=self.batch_size,
            class_mode='categorical',
            subset='training',
            shuffle=True
        )
        
        validation_generator = train_datagen.flow_from_directory(
            'optimized_dataset',
            target_size=self.img_size,
            batch_size=self.batch_size,
            class_mode='categorical',
            subset='validation',
            shuffle=False
        )
        
        num_classes = len(train_generator.class_indices)
        print(f"\nTraining setup:")
        print(f"   Classes: {list(train_generator.class_indices.keys())}")
        print(f"   Training samples: {train_generator.samples}")
        print(f"   Validation samples: {validation_generator.samples}")
        print(f"   Batch size: {self.batch_size}")
        
        # Create model
        model, base_model = self.create_efficient_model(num_classes)
        
        # Callbacks
        callbacks = [
            ModelCheckpoint(
                os.path.join(self.output_dir, 'best_model.h5'),
                save_best_only=True,
                monitor='val_accuracy',
                mode='max',
                verbose=1
            ),
            EarlyStopping(
                patience=7,
                restore_best_weights=True,
                monitor='val_accuracy',
                verbose=1
            ),
            ReduceLROnPlateau(
                factor=0.3,
                patience=3,
                monitor='val_accuracy',
                verbose=1,
                min_lr=1e-7
            )
        ]
        
        # Phase 1: Train head only
        print("\nPHASE 1: Training classification head (20 epochs)")
        print("=" * 60)
        
        history1 = model.fit(
            train_generator,
            epochs=20,
            validation_data=validation_generator,
            callbacks=callbacks,
            verbose=1
        )
        
        # Evaluate Phase 1
        train_loss, train_acc = model.evaluate(train_generator, verbose=0)
        val_loss, val_acc = model.evaluate(validation_generator, verbose=0)
        
        print(f"\nPhase 1 Results:")
        print(f"   Training Accuracy: {train_acc:.4f}")
        print(f"   Validation Accuracy: {val_acc:.4f}")
        
        # Phase 2: Fine-tune if needed
        if val_acc < 0.90:  # If not achieving 90%+
            print(f"\nPHASE 2: Fine-tuning (validation acc: {val_acc:.4f} < 0.90)")
            print("=" * 60)
            
            # Unfreeze top layers
            base_model.trainable = True
            for layer in base_model.layers[:-30]:
                layer.trainable = False
            
            # Lower learning rate
            model.compile(
                optimizer=Adam(learning_rate=0.0001),
                loss='categorical_crossentropy',
                metrics=['accuracy']
            )
            
            # Continue training
            history2 = model.fit(
                train_generator,
                epochs=15,
                validation_data=validation_generator,
                callbacks=callbacks,
                verbose=1
            )
            
            # Final evaluation
            train_loss, train_acc = model.evaluate(train_generator, verbose=0)
            val_loss, val_acc = model.evaluate(validation_generator, verbose=0)
        
        # Final results
        print("\n" + "=" * 60)
        print("FINAL RESULTS")
        print("=" * 60)
        print(f"Training Accuracy: {train_acc:.4f}")
        print(f"Validation Accuracy: {val_acc:.4f}")
        
        # Export model
        self.export_optimized_model(model, train_generator, validation_generator)
        
        return True

    def export_optimized_model(self, model, train_generator, validation_generator):
        """Export model and create evaluation metrics"""
        print("\nMODEL EXPORT")
        print("=" * 60)
        
        # Save model
        model.save(os.path.join(self.output_dir, 'model.h5'))
        model.save(os.path.join(self.output_dir, 'saved_model'))
        
        # Save labels
        labels = {v: k for k, v in train_generator.class_indices.items()}
        with open(os.path.join(self.output_dir, 'labels.json'), 'w') as f:
            json.dump(labels, f, indent=2)
        
        # Generate confusion matrix
        validation_generator.reset()
        predictions = model.predict(validation_generator, verbose=1)
        predicted_classes = np.argmax(predictions, axis=1)
        true_classes = validation_generator.classes
        
        # Confusion matrix plot
        cm = confusion_matrix(true_classes, predicted_classes)
        plt.figure(figsize=(10, 8))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                   xticklabels=list(labels.values()),
                   yticklabels=list(labels.values()))
        plt.title('Confusion Matrix')
        plt.ylabel('True Label')
        plt.xlabel('Predicted Label')
        plt.tight_layout()
        plt.savefig(os.path.join(self.output_dir, 'confusion_matrix.png'), dpi=300)
        plt.close()
        
        # Classification report
        class_names = list(labels.values())
        report = classification_report(true_classes, predicted_classes,
                                     target_names=class_names, output_dict=True)
        
        with open(os.path.join(self.output_dir, 'classification_report.json'), 'w') as f:
            json.dump(report, f, indent=2)
        
        # Create inference script
        self.create_predict_script(labels)
        
        print("Files exported:")
        print(f"   ✓ model.h5")
        print(f"   ✓ saved_model/")
        print(f"   ✓ labels.json")
        print(f"   ✓ confusion_matrix.png")
        print(f"   ✓ classification_report.json")
        print(f"   ✓ predict.py")
        
        # Print classification report summary
        print(f"\nClassification Report Summary:")
        for class_name in class_names:
            if class_name in report:
                precision = report[class_name]['precision']
                recall = report[class_name]['recall']
                f1 = report[class_name]['f1-score']
                print(f"   {class_name}: P={precision:.3f}, R={recall:.3f}, F1={f1:.3f}")

    def create_predict_script(self, labels):
        """Create optimized prediction script"""
        script_content = f'''import tensorflow as tf
import numpy as np
from PIL import Image
import sys
import json

def predict_disease(image_path):
    """Predict plant disease from image"""
    # Load model and labels
    model = tf.keras.models.load_model('model.h5')
    
    with open('labels.json', 'r') as f:
        labels = json.load(f)
    
    # Preprocess image
    img = Image.open(image_path).convert('RGB')
    img = img.resize((224, 224))
    img_array = np.array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)
    
    # Predict
    predictions = model.predict(img_array, verbose=0)
    predicted_class_idx = np.argmax(predictions[0])
    confidence = predictions[0][predicted_class_idx]
    
    predicted_class = labels[str(predicted_class_idx)]
    
    print(f"Predicted Disease: {{predicted_class}}")
    print(f"Confidence: {{confidence:.2%}}")
    
    # Show top 3 predictions
    top_3_idx = np.argsort(predictions[0])[-3:][::-1]
    print(f"\\nTop 3 predictions:")
    for i, idx in enumerate(top_3_idx, 1):
        class_name = labels[str(idx)]
        conf = predictions[0][idx]
        print(f"   {{i}}. {{class_name}}: {{conf:.2%}}")
    
    return predicted_class, confidence

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python predict.py <image_path>")
        sys.exit(1)
    
    image_path = sys.argv[1]
    predict_disease(image_path)
'''
        
        with open(os.path.join(self.output_dir, 'predict.py'), 'w') as f:
            f.write(script_content)

if __name__ == "__main__":
    trainer = OptimizedPlantDiseaseTrainer()
    success = trainer.train_optimized_model()
    
    if success:
        print("\n🎉 OPTIMIZED MODEL TRAINING COMPLETED!")
        print("Model ready for AgriSphere AI integration.")
    else:
        print("\n❌ Training failed.")