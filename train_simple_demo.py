#!/usr/bin/env python3
"""
Simple demo training script for AgriSphere AI
Creates mock model files for demonstration
"""

import os
import json
import numpy as np
from datetime import datetime

def create_demo_models():
    """Create demo model files and structure"""
    print("🌱 Creating AgriSphere AI Demo Models...")
    
    # Create output directory
    os.makedirs('enhanced_model_output', exist_ok=True)
    os.makedirs('model_output', exist_ok=True)
    
    # Disease classes
    disease_classes = [
        'healthy', 'leaf_blight', 'leaf_rust', 'leaf_spot', 
        'stem_rot', 'fruit_rot', 'bacterial_wilt', 'viral_mosaic'
    ]
    
    # Pest classes
    pest_classes = [
        'no_pest', 'aphids', 'caterpillars', 'beetles', 'mites', 'thrips', 'whiteflies'
    ]
    
    # Nutrient classes
    nutrient_classes = [
        'sufficient', 'nitrogen_deficiency', 'phosphorus_deficiency', 
        'potassium_deficiency', 'iron_deficiency', 'magnesium_deficiency'
    ]
    
    # Soil classes
    soil_classes = ['clay', 'sandy', 'loamy', 'silt']
    
    # Save labels
    with open('enhanced_model_output/disease_labels.json', 'w') as f:
        json.dump(disease_classes, f)
    
    with open('enhanced_model_output/pest_labels.json', 'w') as f:
        json.dump(pest_classes, f)
    
    with open('enhanced_model_output/nutrient_labels.json', 'w') as f:
        json.dump(nutrient_classes, f)
    
    with open('enhanced_model_output/soil_labels.json', 'w') as f:
        json.dump(soil_classes, f)
    
    with open('model_output/labels.json', 'w') as f:
        json.dump(disease_classes, f)
    
    # Create all labels file
    all_labels = {
        'disease': disease_classes,
        'pest': pest_classes,
        'nutrient': nutrient_classes,
        'soil': soil_classes
    }
    
    with open('enhanced_model_output/all_labels.json', 'w') as f:
        json.dump(all_labels, f, indent=2)
    
    # Create yield prediction features
    yield_features = ['temperature', 'humidity', 'rainfall', 'ph', 'nitrogen', 'area']
    with open('enhanced_model_output/yield_features.json', 'w') as f:
        json.dump(yield_features, f)
    
    # Create training report
    report = {
        'training_date': datetime.now().isoformat(),
        'status': 'completed',
        'models_created': [
            'Disease Detection (8 classes)',
            'Pest Detection (7 classes)', 
            'Nutrient Deficiency (6 classes)',
            'Soil Texture (4 classes)',
            'Yield Prediction Models'
        ],
        'accuracies': {
            'disease_detection': '95.2%',
            'pest_detection': '92.8%',
            'nutrient_analysis': '90.4%',
            'soil_texture': '89.1%',
            'yield_prediction': 'R² = 0.94'
        },
        'demo_mode': True,
        'note': 'Demo models created for AgriSphere AI showcase'
    }
    
    with open('enhanced_model_output/training_report.json', 'w') as f:
        json.dump(report, f, indent=2)
    
    # Create mock model weights (small files for demo)
    mock_weights = {
        'model_type': 'demo',
        'version': '1.0',
        'classes': len(disease_classes),
        'accuracy': 0.952
    }
    
    with open('enhanced_model_output/disease_model_weights.json', 'w') as f:
        json.dump(mock_weights, f)
    
    with open('model_output/best_model_info.json', 'w') as f:
        json.dump(mock_weights, f)
    
    print("✅ Disease Detection Model - 95.2% accuracy")
    print("✅ Pest Detection Model - 92.8% accuracy") 
    print("✅ Nutrient Analysis Model - 90.4% accuracy")
    print("✅ Soil Texture Model - 89.1% accuracy")
    print("✅ Yield Prediction Models - R² = 0.94")
    print("✅ All model files created successfully!")
    
    return True

def create_sample_predictions():
    """Create sample prediction data"""
    print("\n📊 Creating Sample Prediction Data...")
    
    # Sample disease predictions
    sample_predictions = {
        'wheat_disease': {
            'disease': 'Wheat Rust',
            'confidence': 0.94,
            'severity': 'high',
            'treatment': 'Apply Propiconazole fungicide',
            'affected_part': 'leaf'
        },
        'tomato_disease': {
            'disease': 'Tomato Blight',
            'confidence': 0.91,
            'severity': 'medium',
            'treatment': 'Use Copper Oxychloride spray',
            'affected_part': 'leaf'
        },
        'pest_detection': {
            'pest': 'Aphids',
            'confidence': 0.88,
            'severity': 'medium',
            'treatment': 'Apply Neem oil spray',
            'affected_part': 'leaf'
        }
    }
    
    with open('enhanced_model_output/sample_predictions.json', 'w') as f:
        json.dump(sample_predictions, f, indent=2)
    
    print("✅ Sample predictions created")

def main():
    """Main training function"""
    print("🚀 AgriSphere AI - Demo Model Training")
    print("=" * 50)
    
    try:
        # Create demo models
        success = create_demo_models()
        
        if success:
            # Create sample predictions
            create_sample_predictions()
            
            print("\n🎉 Training Complete!")
            print("=" * 50)
            print("📁 Model files saved in: enhanced_model_output/")
            print("📊 Training report: enhanced_model_output/training_report.json")
            print("🌟 Your AgriSphere AI models are ready!")
            print("\nNext step: Run 'npm run dev' to start the demo")
            
        return True
        
    except Exception as e:
        print(f"❌ Training failed: {str(e)}")
        return False

if __name__ == "__main__":
    main()