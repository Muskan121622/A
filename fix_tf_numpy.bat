@echo off
echo 🔧 Fixing TensorFlow and NumPy compatibility...
echo ====================================================

REM Deactivate current environment
echo 🔄 Deactivating current environment...
call conda deactivate 2>nul

REM Create new environment with specific versions
echo 🏗️ Creating new environment with compatible versions...
call conda create -n agri_tf_fix python=3.9 -y

REM Activate new environment
echo 🔄 Activating new environment...
call conda activate agri_tf_fix

REM Install compatible versions
echo 📦 Installing compatible TensorFlow and NumPy...
pip install tensorflow==2.12.0 numpy==1.24.3

REM Install other required packages
echo 📦 Installing other required packages...
pip install Pillow scikit-learn matplotlib seaborn pandas

echo ====================================================
echo ✅ Environment setup completed!
echo 💡 To use this environment:
echo    conda activate agri_tf_fix
echo    python train_archive4_model.py
pause