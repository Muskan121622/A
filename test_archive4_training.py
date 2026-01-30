#!/usr/bin/env python3
"""
Test script to verify Archive4 dataset integration with the training pipeline
"""

import os
import sys
from pathlib import Path

def test_dataset_structure():
    """Test if the Archive4 dataset structure is as expected"""
    dataset_path = Path("public/archive (4)/data")
    
    if not dataset_path.exists():
        print("❌ Archive4 dataset not found")
        return False
    
    # Count directories
    dirs = [d for d in dataset_path.iterdir() if d.is_dir()]
    print(f"✅ Found {len(dirs)} crop disease directories in Archive4 dataset")
    
    # Show first 5 directories as examples
    print("📂 Sample directories:")
    for i, dir_path in enumerate(dirs[:5]):
        print(f"   {i+1}. {dir_path.name}")
    
    if len(dirs) > 0:
        print("✅ Archive4 dataset structure verified")
        return True
    else:
        print("❌ No directories found in Archive4 dataset")
        return False

def test_training_script():
    """Test if we can import and instantiate the trainer"""
    try:
        # Add current directory to Python path
        sys.path.append('.')
        
        # Test importing the trainer
        from train_model import PlantDiseaseTrainer
        
        # Test creating trainer with Archive4 dataset path
        trainer = PlantDiseaseTrainer(
            dataset_path="public/archive (4)/data",
            output_dir="test_archive4_output"
        )
        
        print("✅ Training script imports and initializes correctly with Archive4 dataset")
        return True
        
    except Exception as e:
        print(f"❌ Error testing training script: {e}")
        return False

def create_training_instructions():
    """Create instructions for training with Archive4 dataset"""
    instructions = """
📝 Training Instructions for Archive4 Dataset:

To train the model with the Archive4 crop disease dataset, you can use either:

Option 1: Use the enhanced training script (recommended)
   python train_archive4_model.py

Option 2: Use the modified original training script
   python train_model.py

The training process will:
1. Organize the Archive4 dataset into appropriate categories
2. Clean and validate all images
3. Augment underrepresented classes
4. Train an EfficientNetB0 model
5. Evaluate model performance
6. Generate prediction scripts

Expected results:
- Higher accuracy due to larger and more diverse dataset
- Support for 50+ different crop diseases
- Better generalization across crop types
"""
    
    print(instructions)
    
    # Also create a simple training batch file
    batch_content = """@echo off
echo Starting Archive4 Crop Disease Training...
echo ========================================
python train_archive4_model.py
pause
"""
    
    with open("train_archive4.bat", "w", encoding="utf-8") as f:
        f.write(batch_content)
    
    print("✅ Created train_archive4.bat for easy training")

def main():
    """Run all tests"""
    print("🧪 Testing Archive4 Dataset Integration")
    print("=" * 50)
    
    # Test 1: Dataset structure
    print("\n1. Testing dataset structure...")
    if not test_dataset_structure():
        return
    
    # Test 2: Training script
    print("\n2. Testing training script...")
    if not test_training_script():
        return
    
    # Create instructions
    print("\n3. Creating training instructions...")
    create_training_instructions()
    
    print("\n🎉 All tests passed! You're ready to train with the Archive4 dataset.")
    print("\n🚀 To start training, run:")
    print("   python train_archive4_model.py")

if __name__ == "__main__":
    main()