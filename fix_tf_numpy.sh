#!/bin/bash
# Script to fix TensorFlow and NumPy compatibility issues

echo "🔧 Fixing TensorFlow and NumPy compatibility..."

# Deactivate current environment
echo "🔄 Deactivating current environment..."
conda deactivate 2>/dev/null || true

# Create new environment with specific versions
echo "🏗️ Creating new environment with compatible versions..."
conda create -n agri_tf_fix python=3.9 -y

# Activate new environment
echo "🔄 Activating new environment..."
conda activate agri_tf_fix

# Install compatible versions
echo "📦 Installing compatible TensorFlow and NumPy..."
pip install tensorflow==2.12.0 numpy==1.24.3

# Install other required packages
echo "📦 Installing other required packages..."
pip install Pillow scikit-learn matplotlib seaborn pandas

echo "✅ Environment setup completed!"
echo "💡 To use this environment:"
echo "   conda activate agri_tf_fix"
echo "   python train_archive4_model.py"