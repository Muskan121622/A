import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
from tensorflow.keras.utils import to_categorical
from sklearn.metrics import classification_report, confusion_matrix
import json
import shutil
from PIL import Image
import matplotlib.pyplot as plt
import seaborn as sns


class HighAccuracyPlantDiseaseTrainer:
    def __init__(self):
        self.img_size = (224, 224)
        self.batch_size = 32

        self.base_path =  r"C:\Users\muska_ak5dqij\OneDrive\Desktop\agri\agrisphere-ai-93aee827"

        self.base_path =  r"C:\Users\muska_ak5dqij\OneDrive\Desktop\agrispace\agrisphere-ai-93aee827\public"

        self.output_dir = "high_accuracy_model"
        self.target_accuracy = 0.95
        self.min_samples_per_class = 800
        
        # Disease mapping for standardization
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
            
            # Archive (4) mappings
            'Apple___healthy': 'healthy',
            'Apple___alternaria_leaf_spot': 'leaf_spot',
            'Apple___black_rot': 'stem_rot',
            'Apple___brown_spot': 'leaf_spot',
            'Apple___gray_spot': 'leaf_spot',
            'Apple___rust': 'leaf_rust',
            'Apple___scab': 'leaf_spot',
            'Bell_pepper___bacterial_spot': 'leaf_spot',
            'Bell_pepper___healthy': 'healthy',
            'Blueberry___healthy': 'healthy',
            'Cassava___healthy': 'healthy',
            'Cassava___bacterial_blight': 'leaf_blight',
            'Cassava___brown_streak_disease': 'nutrient_deficiency',
            'Cassava___green_mottle': 'nutrient_deficiency',
            'Cassava___mosaic_disease': 'nutrient_deficiency',
            'Cherry___healthy': 'healthy',
            'Cherry___powdery_mildew': 'nutrient_deficiency',
            'Coffee___healthy': 'healthy',
            'Coffee___red_spider_mite': 'pest_infected',
            'Coffee___rust': 'leaf_rust',
            'Corn___healthy': 'healthy',
            'Corn___common_rust': 'leaf_rust',
            'Corn___gray_leaf_spot': 'leaf_spot',
            'Corn___northern_leaf_blight': 'leaf_blight',
            'Grape___healthy': 'healthy',
            'Grape___black_measles': 'nutrient_deficiency',
            'Grape___black_rot': 'stem_rot',
            'Grape___Leaf_blight': 'leaf_blight',
            'Orange___citrus_greening': 'nutrient_deficiency',
            'Peach___healthy': 'healthy',
            'Peach___bacterial_spot': 'leaf_spot',
            'Potato___bacterial_wilt': 'stem_rot',
            'Potato___early_blight': 'leaf_blight',
            'Potato___healthy': 'healthy',
            'Potato___late_blight': 'leaf_blight',
            'Potato___leafroll_virus': 'nutrient_deficiency',
            'Potato___mosaic_virus': 'nutrient_deficiency',
            'Potato___nematode': 'pest_infected',
            'Potato___pests': 'pest_infected',
            'Potato___phytophthora': 'leaf_blight',
            'Raspberry___healthy': 'healthy',
            'Rice___healthy': 'healthy',
            'Rice___bacterial_blight': 'leaf_blight',
            'Rice___blast': 'leaf_spot',
            'Rice___brown_spot': 'leaf_spot',
            'Rice___tungro': 'nutrient_deficiency',
            'Rose___healthy': 'healthy',
            'Rose___rust': 'leaf_rust',
            'Rose___slug_sawfly': 'pest_infected',
            'Soybean___healthy': 'healthy',
            'Squash___powdery_mildew': 'nutrient_deficiency',
            'Strawberry___healthy': 'healthy',
            'Strawberry___leaf_scorch': 'leaf_spot',
            'Sugercane___healthy': 'healthy',
            'Sugercane___mosaic': 'nutrient_deficiency',
            'Sugercane___red_rot': 'stem_rot',
            'Sugercane___rust': 'leaf_rust',
            'Sugercane___yellow_leaf': 'nutrient_deficiency',
            'Tomato___bacterial_spot': 'leaf_spot',
            'Tomato___early_blight': 'leaf_blight',
            'Tomato___healthy': 'healthy',
            'Tomato___late_blight': 'leaf_blight',
            'Tomato___leaf_curl': 'nutrient_deficiency',
            'Tomato___leaf_mold': 'nutrient_deficiency',
            'Tomato___mosaic_virus': 'nutrient_deficiency',
            'Tomato___septoria_leaf_spot': 'leaf_spot',
            'Tomato___spider_mites': 'pest_infected',
            'Tomato___target_spot': 'leaf_spot',
            'Watermelon___healthy': 'healthy',
            'Watermelon___anthracnose': 'leaf_spot',
            'Watermelon___downy_mildew': 'nutrient_deficiency',
            'Watermelon___mosaic_virus': 'nutrient_deficiency'
        }
    
        
    def is_valid_image(self, image_path):
        """Check if image can be opened and is valid"""
        try:
            with Image.open(image_path) as img:
                img.verify()
            return True
        except:
            return False

    def clean_and_organize_dataset(self):
        """Load, clean and organize dataset with automatic corruption removal"""
        print("=" * 60)
        print("DATASET LOADING & CLEANING")
        print("=" * 60)

        
        # Check if dataset exists but don't delete it
        if os.path.exists("dataset"):
            print("Dataset folder already exists. Using existing data to prevent deletion.")
        else:
            # Create dataset structure only if it doesn't exist
            for class_name in ['healthy', 'leaf_blight', 'leaf_rust', 'leaf_spot', 'stem_rot', 'pest_infected', 'nutrient_deficiency']:
                os.makedirs(f"dataset/{class_name}", exist_ok=True)


        # Check if dataset already exists with valid images before any cleanup
        if os.path.exists("dataset"):
            class_counts = {}
            for class_name in ['healthy', 'leaf_blight', 'leaf_rust', 'leaf_spot', 'stem_rot', 'pest_infected', 'nutrient_deficiency']:
                class_dir = f"dataset/{class_name}"
                if os.path.exists(class_dir):
                    images = [f for f in os.listdir(class_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
                    valid_images = [img for img in images if self.is_valid_image(os.path.join(class_dir, img))]
                    class_counts[class_name] = len(valid_images)
            if all(count > 0 for count in class_counts.values()) and len(class_counts) == 7:
                print("Existing dataset found with valid images in all classes. Skipping cleaning and organization.")
                print(f"\nClass counts:")
                for class_name, count in sorted(class_counts.items()):
                    print(f"   {class_name}: {count} images")
                return class_counts


        # Safe dataset cleanup
        if os.path.exists("dataset"):
            try:
                shutil.rmtree("dataset")
            except PermissionError:
                print("Warning: Could not remove existing dataset folder. Using existing structure.")
                # Clear existing files instead
                for root, dirs, files in os.walk("dataset"):
                    for file in files:
                        try:
                            os.remove(os.path.join(root, file))
                        except:
                            pass

        # Create dataset structure
        for class_name in ['healthy', 'leaf_blight', 'leaf_rust', 'leaf_spot', 'stem_rot', 'pest_infected', 'nutrient_deficiency']:
            os.makedirs(f"dataset/{class_name}", exist_ok=True)

        class_counts = {}
        corrupted_count = 0


        
        # Create dataset structure
        for class_name in ['healthy', 'leaf_blight', 'leaf_rust', 'leaf_spot', 'stem_rot', 'pest_infected', 'nutrient_deficiency']:
            os.makedirs(f"dataset/{class_name}", exist_ok=True)
        
        class_counts = {}
        corrupted_count = 0
        
        # Process PlantVillage dataset
        plantvillage_path = os.path.join(self.base_path, "PlantVillage")
        if os.path.exists(plantvillage_path):
            corrupted_count += self._process_source(plantvillage_path, class_counts, "PlantVillage")

        # Process Archive (4) dataset
        archive_path = os.path.join(self.base_path, "archive (4)","data")
        if os.path.exists(archive_path):
            corrupted_count += self._process_source(archive_path, class_counts, "Archive")
 
        # Remove empty classes
        final_classes = {}
        for class_name, count in class_counts.items():
            if count > 0:
                final_classes[class_name] = count
            else:
                print(f"Skipping empty class: {class_name}")
                if os.path.exists(f"dataset/{class_name}"):
                    os.rmdir(f"dataset/{class_name}")
        
        print(f"\nCleaning Summary:")
        print(f"   Corrupted/unreadable images removed: {corrupted_count}")
        print(f"   Valid classes: {len(final_classes)}")
        
        print(f"\nClass counts after cleaning:")
        for class_name, count in sorted(final_classes.items()):
            print(f"   {class_name}: {count} images")
        
        return final_classes

    def _process_source(self, source_path, class_counts, source_name):
        """Process a data source and clean corrupted images"""
        corrupted_count = 0
        
        for folder_name in os.listdir(source_path):
            folder_path = os.path.join(source_path, folder_name)
            if os.path.isdir(folder_path) and folder_name in self.disease_mapping:
                target_class = self.disease_mapping[folder_name]
                
                print(f"Processing {folder_name} -> {target_class} ({source_name})")
                
                valid_count = 0
                image_files = [f for f in os.listdir(folder_path) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
                
                for filename in image_files:
                    src_path = os.path.join(folder_path, filename)
                    
                    if self.is_valid_image(src_path):
                        dst_path = os.path.join(f"dataset/{target_class}", f"{source_name}_{valid_count}_{filename}")
                        try:
                            shutil.copy2(src_path, dst_path)
                            valid_count += 1
                        except Exception:
                            corrupted_count += 1
                    else:
                        corrupted_count += 1
                
                class_counts[target_class] = class_counts.get(target_class, 0) + valid_count
                print(f"   Valid images: {valid_count}")
        
        return corrupted_count









    
    def balance_classes_with_augmentation(self, class_counts):
        """Auto class balancing using augmentation"""
        print("\n" + "=" * 60)
        print("AUTO CLASS BALANCING")
        print("=" * 60)
        
        # High-intensity augmentation for balancing
        balance_datagen = ImageDataGenerator(
            rotation_range=20,
            shear_range=0.2,
            zoom_range=0.2,
            horizontal_flip=True,
            brightness_range=[0.8, 1.2],
            width_shift_range=0.1,
            height_shift_range=0.1,
            fill_mode='nearest'
        )
        
        balanced_counts = {}
        
        for class_name, current_count in class_counts.items():
            if current_count < self.min_samples_per_class:
                needed = self.min_samples_per_class - current_count
                print(f"Augmenting {class_name}: {current_count} -> {self.min_samples_per_class} (+{needed})")
                
                # Generate augmented images
                class_dir = f"dataset/{class_name}"
                images = [f for f in os.listdir(class_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
                
                augmented = 0
                while augmented < needed and images:
                    for img_file in images:
                        if augmented >= needed:
                            break
                        
                        img_path = os.path.join(class_dir, img_file)
                        try:
                            img = Image.open(img_path).convert('RGB')
                            img_array = np.array(img.resize(self.img_size))
                            img_array = np.expand_dims(img_array, axis=0)
                            
                            # Generate augmented image
                            aug_iter = balance_datagen.flow(img_array, batch_size=1)
                            aug_img = next(aug_iter)[0].astype(np.uint8)
                            
                            # Save augmented image
                            aug_pil = Image.fromarray(aug_img)
                            aug_path = os.path.join(class_dir, f"aug_{augmented}_{img_file}")
                            aug_pil.save(aug_path)
                            augmented += 1
                            
                        except Exception:
                            continue
                
                balanced_counts[class_name] = current_count + augmented
            else:
                balanced_counts[class_name] = current_count
                print(f"{class_name}: {current_count} (sufficient)")
        
        print(f"\nBalanced class distribution:")
        for class_name, count in sorted(balanced_counts.items()):
            print(f"   {class_name}: {count} images")
        
        return balanced_counts

    def create_efficientnet_model(self, num_classes):
        """Create high-accuracy model with EfficientNetB0"""
        print("\n" + "=" * 60)
        print("MODEL ARCHITECTURE (HIGH ACCURACY)")
        print("=" * 60)
        
        # Base model: EfficientNetB0
        base_model = EfficientNetB0(
            weights='imagenet',
            include_top=False,
            input_shape=(224, 224, 3)
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


        # Build the model to ensure proper initialization
        model.build((None, 224, 224, 3))


        # Compile model
        model.compile(
            optimizer=Adam(learning_rate=0.0001),
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        
        print("Model Architecture:")
        print(f"   Base: EfficientNetB0 (ImageNet weights)")
        print(f"   Head: GlobalAveragePooling2D -> Dense(256) -> Dropout(0.4) -> Dense({num_classes})")
        print(f"   Optimizer: Adam(lr=0.0001)")
        print(f"   Loss: categorical_crossentropy")
        
        return model, base_model

    def train_high_accuracy_model(self):
        """Train model with ≥95% accuracy target"""
        print("HIGH ACCURACY PLANT DISEASE CLASSIFICATION TRAINING")
        print("Target: ≥95% Validation Accuracy")
        print("=" * 60)
        
        # Step 1: Clean and organize dataset
        class_counts = self.clean_and_organize_dataset()
        
        if not class_counts:
            print("No training data found!")
            return False
        
        # Step 2: Balance classes with augmentation
        balanced_counts = self.balance_classes_with_augmentation(class_counts)
        
        # Step 3: Create data generators
        train_datagen = ImageDataGenerator(
            rescale=1./255,
            validation_split=0.2,
            rotation_range=15,
            width_shift_range=0.1,
            height_shift_range=0.1,
            horizontal_flip=True,
            zoom_range=0.1
        )
        
        train_generator = train_datagen.flow_from_directory(
            'dataset',
            target_size=self.img_size,
            batch_size=self.batch_size,
            class_mode='categorical',
            subset='training'
        )
        
        validation_generator = train_datagen.flow_from_directory(
            'dataset',
            target_size=self.img_size,
            batch_size=self.batch_size,
            class_mode='categorical',
            subset='validation'
        )
        
        num_classes = len(train_generator.class_indices)
        print(f"\nTraining with {num_classes} classes: {list(train_generator.class_indices.keys())}")
        
        # Step 4: Create model
        model, base_model = self.create_efficientnet_model(num_classes)
        
        # Create output directory
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Step 5: Training callbacks
        callbacks = [
            ModelCheckpoint(
                os.path.join(self.output_dir, 'best_model'),
                save_best_only=True,
                monitor='val_accuracy',
                mode='max',
                save_format='tf'

                os.path.join(self.output_dir, 'best_model.h5'),
                save_best_only=True,
                monitor='val_accuracy',
                mode='max'

            ),
            EarlyStopping(
                patience=5,
                restore_best_weights=True,
                monitor='val_accuracy'
            ),
            ReduceLROnPlateau(
                factor=0.2,
                patience=3,
                monitor='val_accuracy'
            )
        ]
        
        # Step 6: Initial training (30 epochs)
        print("\n" + "=" * 60)
        print("TRAINING STRATEGY - Phase 1: Frozen Base (30 epochs)")
        print("=" * 60)
        
        history1 = model.fit(
            train_generator,
            epochs=30,
            validation_data=validation_generator,
            callbacks=callbacks,
            verbose=1
        )
        
        # Evaluate initial results
        train_loss, train_acc = model.evaluate(train_generator, verbose=0)
        val_loss, val_acc = model.evaluate(validation_generator, verbose=0)
        
        print(f"\nPhase 1 Results:")
        print(f"   Training Accuracy: {train_acc:.4f}")
        print(f"   Validation Accuracy: {val_acc:.4f}")
        
        # Step 7: Fine-tuning if accuracy < 95%
        if val_acc < self.target_accuracy:
            print(f"\nValidation accuracy {val_acc:.4f} < {self.target_accuracy}")
            print("Starting fine-tuning phase...")
            
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
            
            print("\n" + "=" * 60)
            print("TRAINING STRATEGY - Phase 2: Fine-tuning (50 epochs)")
            print("=" * 60)
            
            # Extended training
            history2 = model.fit(
                train_generator,
                epochs=50,
                validation_data=validation_generator,
                callbacks=callbacks,
                verbose=1
            )
            
            # Final evaluation
            train_loss, train_acc = model.evaluate(train_generator, verbose=0)
            val_loss, val_acc = model.evaluate(validation_generator, verbose=0)
        
        # Step 8: Final results and export
        print("\n" + "=" * 60)
        print("FINAL RESULTS")
        print("=" * 60)
        print(f"Training Accuracy: {train_acc:.4f}")
        print(f"Validation Accuracy: {val_acc:.4f}")
        
        if val_acc >= self.target_accuracy:
            print(f"🎉 SUCCESS! Achieved target accuracy of ≥{self.target_accuracy}")
        else:
            print(f"⚠️  Target accuracy {self.target_accuracy} not reached, but model saved")
        
        # Step 9: Model export
        self.export_model(model, train_generator, validation_generator)
        
        return True

    def export_model(self, model, train_generator, validation_generator):
        """Export model and create inference files"""
        print("\n" + "=" * 60)
        print("MODEL EXPORT")
        print("=" * 60)
        
        # Save model in multiple formats
        model.save(os.path.join(self.output_dir, 'model.h5'))

        model.save(os.path.join(self.output_dir, 'saved_model'), save_format='tf')

        model.save(os.path.join(self.output_dir, 'saved_model'))

        
        # Save label mapping
        labels = {v: k for k, v in train_generator.class_indices.items()}
        with open(os.path.join(self.output_dir, 'labels.json'), 'w') as f:
            json.dump(labels, f, indent=2)
        
        # Generate predictions for confusion matrix
        validation_generator.reset()
        predictions = model.predict(validation_generator)
        predicted_classes = np.argmax(predictions, axis=1)
        true_classes = validation_generator.classes
        
        # Confusion matrix
        cm = confusion_matrix(true_classes, predicted_classes)
        plt.figure(figsize=(10, 8))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                   xticklabels=list(labels.values()), 
                   yticklabels=list(labels.values()))
        plt.title('Confusion Matrix')
        plt.ylabel('True Label')
        plt.xlabel('Predicted Label')
        plt.tight_layout()
        plt.savefig(os.path.join(self.output_dir, 'confusion_matrix.png'))
        plt.close()
        
        # Classification report
        class_names = list(labels.values())
        report = classification_report(true_classes, predicted_classes, 
                                     target_names=class_names, output_dict=True)
        
        with open(os.path.join(self.output_dir, 'classification_report.json'), 'w') as f:
            json.dump(report, f, indent=2)
        
        # Create inference script
        self.create_inference_script(labels)
        
        print("Exported files:")
        print(f"   ✓ model.h5 (Keras model)")
        print(f"   ✓ saved_model/ (TensorFlow SavedModel)")
        print(f"   ✓ labels.json (Class mapping)")
        print(f"   ✓ confusion_matrix.png")
        print(f"   ✓ classification_report.json")
        print(f"   ✓ predict.py (Inference script)")
        
        print(f"\nLocation of saved model files: {self.output_dir}/")

    def create_inference_script(self, labels):
        """Create sample inference code"""
        script_content = f'''import tensorflow as tf
import numpy as np
from PIL import Image
import sys
import json

def predict_disease(image_path):
    """
    Predict plant disease from image
    
    Args:
        image_path: Path to input image
    
    Returns:
        predicted_class: Disease class name
        confidence: Prediction confidence (0-1)
    """
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
        print("Example: python predict.py sample_leaf.jpg")
        sys.exit(1)
    
    image_path = sys.argv[1]
    
    try:
        predict_disease(image_path)
    except Exception as e:
        print(f"Error: {{e}}")
        print("Make sure the image file exists and is a valid image format.")
'''
        
        with open(os.path.join(self.output_dir, 'predict.py'), 'w') as f:
            f.write(script_content)

if __name__ == "__main__":
    trainer = HighAccuracyPlantDiseaseTrainer()
    success = trainer.train_high_accuracy_model()
    
    if success:
        print("\n🎉 HIGH ACCURACY MODEL TRAINING COMPLETED!")
        print("Ready for deployment in AgriSphere AI application.")
    else:
        print("\n❌ Training failed. Please check the dataset and try again.")