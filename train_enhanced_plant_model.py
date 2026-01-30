import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
import json
import shutil
from PIL import Image
import cv2

class EnhancedPlantDiseaseTrainer:
    def __init__(self):
        self.img_size = (224, 224)
        self.batch_size = 32

        self.base_path = r"C:\Users\muska_ak5dqij\OneDrive\Desktop\agrispace\agrisphere-ai-93aee827\dataset"

        self.base_path = r"C:\Users\muska_ak5dqij\OneDrive\Desktop\agrispace\agrisphere-ai-93aee827\public"

        self.output_dir = "enhanced_model_output"
        
        # Disease mapping for standardization
        self.disease_mapping = {
            # Existing mappings
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
        try:
            with Image.open(image_path) as img:
                img.verify()
            return True
        except:
            return False

    def organize_dataset(self):
        print("Organizing enhanced dataset...")
        
        if os.path.exists("enhanced_dataset"):
            shutil.rmtree("enhanced_dataset")
        
        os.makedirs("enhanced_dataset/train", exist_ok=True)
        os.makedirs("enhanced_dataset/validation", exist_ok=True)
        
        # Initialize class counters
        class_counts = {}
        
        # Process PlantVillage dataset
        plantvillage_path = os.path.join(self.base_path, "PlantVillage")
        if os.path.exists(plantvillage_path):
            for folder_name in os.listdir(plantvillage_path):
                folder_path = os.path.join(plantvillage_path, folder_name)
                if os.path.isdir(folder_path) and folder_name in self.disease_mapping:
                    target_class = self.disease_mapping[folder_name]
                    self._process_folder(folder_path, target_class, class_counts, "PlantVillage")
        
        # Process Archive (4) dataset
        archive_path = os.path.join(self.base_path, "archive (4)", "data")
        if os.path.exists(archive_path):
            for folder_name in os.listdir(archive_path):
                folder_path = os.path.join(archive_path, folder_name)
                if os.path.isdir(folder_path) and folder_name in self.disease_mapping:
                    target_class = self.disease_mapping[folder_name]
                    self._process_folder(folder_path, target_class, class_counts, "Archive")
        
        # Print final counts
        print("\nFinal class distribution:")
        for class_name, count in sorted(class_counts.items()):
            print(f"   {class_name}: {count} images")
        
        return class_counts

    def _process_folder(self, folder_path, target_class, class_counts, source):
        print(f"Processing {os.path.basename(folder_path)} -> {target_class} ({source})")
        
        # Create class directories
        train_class_dir = f"enhanced_dataset/train/{target_class}"
        val_class_dir = f"enhanced_dataset/validation/{target_class}"
        os.makedirs(train_class_dir, exist_ok=True)
        os.makedirs(val_class_dir, exist_ok=True)
        
        valid_count = 0
        image_files = [f for f in os.listdir(folder_path) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        
        for i, filename in enumerate(image_files):
            if valid_count >= 100:  # Limit per source folder
                break
                
            src_path = os.path.join(folder_path, filename)
            
            if self.is_valid_image(src_path):
                # 80% train, 20% validation split
                if i % 5 == 0:  # Every 5th image goes to validation
                    dst_path = os.path.join(val_class_dir, f"{source}_{valid_count}_{filename}")
                else:
                    dst_path = os.path.join(train_class_dir, f"{source}_{valid_count}_{filename}")
                
                try:
                    shutil.copy2(src_path, dst_path)
                    valid_count += 1
                except Exception as e:
                    continue
        
        class_counts[target_class] = class_counts.get(target_class, 0) + valid_count
        print(f"Copied {valid_count} valid images")

    def create_model(self, num_classes):
        base_model = MobileNetV2(
            weights='imagenet',
            include_top=False,
            input_shape=(224, 224, 3)
        )
        
        # Freeze base model initially
        base_model.trainable = False
        
        # Add custom head
        x = base_model.output
        x = GlobalAveragePooling2D()(x)
        x = Dropout(0.3)(x)
        x = Dense(128, activation='relu')(x)
        x = Dropout(0.2)(x)
        predictions = Dense(num_classes, activation='softmax')(x)
        
        model = Model(inputs=base_model.input, outputs=predictions)
        return model, base_model

    def train_model(self):
        print("Enhanced AgriSphere AI - Plant Disease Classification Training")
        print("=" * 60)
        
        # Organize dataset
        class_counts = self.organize_dataset()
        
        if not class_counts:
            print("No training data found!")
            return False
        
        # Create output directory
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Data generators
        train_datagen = ImageDataGenerator(
            rescale=1./255,
            rotation_range=20,
            width_shift_range=0.2,
            height_shift_range=0.2,
            horizontal_flip=True,
            zoom_range=0.2,
            fill_mode='nearest'
        )
        
        val_datagen = ImageDataGenerator(rescale=1./255)
        
        train_generator = train_datagen.flow_from_directory(
            'enhanced_dataset/train',
            target_size=self.img_size,
            batch_size=self.batch_size,
            class_mode='categorical'
        )
        
        validation_generator = val_datagen.flow_from_directory(
            'enhanced_dataset/validation',
            target_size=self.img_size,
            batch_size=self.batch_size,
            class_mode='categorical'
        )
        
        num_classes = len(train_generator.class_indices)
        print(f"Training with {num_classes} classes: {list(train_generator.class_indices.keys())}")
        
        # Create model
        print("Creating enhanced model architecture...")
        model, base_model = self.create_model(num_classes)
        
        # Compile model
        model.compile(
            optimizer=Adam(learning_rate=0.0001),
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        
        # Callbacks
        callbacks = [
            EarlyStopping(patience=5, restore_best_weights=True),
            ReduceLROnPlateau(factor=0.2, patience=3),
            ModelCheckpoint(
                os.path.join(self.output_dir, 'best_model.h5'),
                save_best_only=True,
                monitor='val_accuracy'
            )
        ]
        
        # Phase 1: Train with frozen base
        print("Phase 1: Training with frozen base model...")
        history1 = model.fit(
            train_generator,
            epochs=15,
            validation_data=validation_generator,
            callbacks=callbacks,
            verbose=1
        )
        
        # Phase 2: Fine-tune top layers
        print("Phase 2: Fine-tuning top layers...")
        base_model.trainable = True
        for layer in base_model.layers[:-20]:
            layer.trainable = False
        
        model.compile(
            optimizer=Adam(learning_rate=0.00001),
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        
        history2 = model.fit(
            train_generator,
            epochs=10,
            validation_data=validation_generator,
            callbacks=callbacks,
            verbose=1
        )
        
        # Final evaluation
        train_loss, train_acc = model.evaluate(train_generator, verbose=0)
        val_loss, val_acc = model.evaluate(validation_generator, verbose=0)
        
        print(f"\nFinal Results:")
        print(f"   Training Accuracy: {train_acc:.4f}")
        print(f"   Validation Accuracy: {val_acc:.4f}")
        
        # Save model and metadata
        model.save(os.path.join(self.output_dir, 'enhanced_model.h5'))
        
        # Save class labels
        labels = {v: k for k, v in train_generator.class_indices.items()}
        with open(os.path.join(self.output_dir, 'labels.json'), 'w') as f:
            json.dump(labels, f)
        
        # Create prediction script
        self.create_prediction_script(labels)
        
        print(f"\n{'='*60}")
        print("ENHANCED TRAINING COMPLETE!")
        print(f"{'='*60}")
        print(f"Final Results:")
        print(f"   Training Accuracy: {train_acc:.4f}")
        print(f"   Validation Accuracy: {val_acc:.4f}")
        print(f"\nModel files saved in: {self.output_dir}")
        print(f"   - enhanced_model.h5 (Keras model)")
        print(f"   - labels.json (Class mapping)")
        print(f"   - predict_enhanced.py (Inference script)")
        print(f"\nTo test prediction:")
        print(f"   python {self.output_dir}/predict_enhanced.py <image_path>")
        
        return True

    def create_prediction_script(self, labels):
        script_content = f'''import tensorflow as tf
import numpy as np
from PIL import Image
import sys
import json

def predict_disease(image_path):
    # Load model and labels
    model = tf.keras.models.load_model('enhanced_model.h5')
    
    with open('labels.json', 'r') as f:
        labels = json.load(f)
    
    # Preprocess image
    img = Image.open(image_path).convert('RGB')
    img = img.resize((224, 224))
    img_array = np.array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)
    
    # Predict
    predictions = model.predict(img_array)
    predicted_class = np.argmax(predictions[0])
    confidence = predictions[0][predicted_class]
    
    disease = labels[str(predicted_class)]
    
    print(f"Predicted Disease: {{disease}}")
    print(f"Confidence: {{confidence:.2%}}")
    
    return disease, confidence

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python predict_enhanced.py <image_path>")
        sys.exit(1)
    
    image_path = sys.argv[1]
    predict_disease(image_path)
'''
        
        with open(os.path.join(self.output_dir, 'predict_enhanced.py'), 'w') as f:
            f.write(script_content)

if __name__ == "__main__":
    trainer = EnhancedPlantDiseaseTrainer()
    trainer.train_model()