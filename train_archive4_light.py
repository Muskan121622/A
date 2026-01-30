#!/usr/bin/env python3
"""
Lightweight version of the Archive4 training script with reduced dependencies
"""

import os
import json
import shutil
from pathlib import Path

# Simple class to demonstrate the dataset organization without TensorFlow
class LightArchive4Trainer:
    def __init__(self, dataset_path="public/archive (4)/data", output_dir="light_archive4_output"):
        self.dataset_path = Path(dataset_path)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # Create organized dataset structure
        self.organized_path = self.output_dir / "organized_dataset"
        self.organized_path.mkdir(exist_ok=True)
        
        self.class_mapping = {}
        self.class_counts = {}
    
    def analyze_dataset(self):
        """Analyze the Archive4 dataset structure"""
        print("🔍 Analyzing Archive4 dataset...")
        
        if not self.dataset_path.exists():
            print("❌ Dataset path does not exist")
            return False
        
        # Count directories
        dirs = [d for d in self.dataset_path.iterdir() if d.is_dir()]
        print(f"✅ Found {len(dirs)} crop disease directories")
        
        # Show sample directories
        print("\n📂 Sample directories:")
        for i, dir_path in enumerate(dirs[:10]):
            print(f"   {i+1}. {dir_path.name}")
        
        # Analyze disease categories
        disease_categories = {}
        for dir_path in dirs:
            if '___' in dir_path.name:
                parts = dir_path.name.split('___')
                if len(parts) == 2:
                    crop, disease = parts
                    if disease not in disease_categories:
                        disease_categories[disease] = []
                    disease_categories[disease].append(crop)
        
        print(f"\n📊 Found {len(disease_categories)} unique disease types:")
        for disease, crops in list(disease_categories.items())[:10]:
            print(f"   - {disease}: {len(crops)} crops ({', '.join(crops[:3])}{', ...' if len(crops) > 3 else ''})")
        
        return True
    
    def create_dataset_info(self):
        """Create information file about the dataset"""
        info = {
            "dataset_path": str(self.dataset_path),
            "output_dir": str(self.output_dir),
            "analysis_date": "2025-12-06",
            "notes": "This is a lightweight analysis of the Archive4 dataset without actual model training"
        }
        
        with open(self.output_dir / "dataset_info.json", "w") as f:
            json.dump(info, f, indent=2)
        
        print(f"\nℹ️  Dataset information saved to {self.output_dir / 'dataset_info.json'}")

def main():
    """Main function to analyze the Archive4 dataset"""
    print("🌱 AgriSphere AI - Archive4 Dataset Analyzer (Lightweight)")
    print("=" * 60)
    
    # Initialize analyzer
    trainer = LightArchive4Trainer()
    
    # Analyze dataset
    if trainer.analyze_dataset():
        # Create dataset info
        trainer.create_dataset_info()
        
        print("\n🎉 Analysis completed successfully!")
        print("\n📁 Output saved in: light_archive4_output/")
        print("   - dataset_info.json: Dataset information")
        print("   - organized_dataset/: (Empty - would contain organized data in full version)")
        
        print("\n🚀 To train a full model with this dataset, ensure you have:")
        print("   - TensorFlow installed (compatible with your NumPy version)")
        print("   - Sufficient RAM and GPU memory")
        print("   - Several hours for training (due to large dataset size)")
        print("\n💡 Run the full training script after fixing environment issues:")
        print("   python train_archive4_model.py")

if __name__ == "__main__":
    main()