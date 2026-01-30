#!/usr/bin/env python3
"""
Setup script to fix environment issues for TensorFlow compatibility
"""

import subprocess
import sys
import os

def get_pip_list():
    """Get list of installed packages"""
    try:
        result = subprocess.run([sys.executable, "-m", "pip", "list"], 
                              capture_output=True, text=True)
        return result.stdout
    except Exception as e:
        print(f"Error getting pip list: {e}")
        return ""

def check_and_fix_environment():
    """Check and fix environment for TensorFlow compatibility"""
    print("🔍 Analyzing environment...")
    
    # Get installed packages
    pip_list = get_pip_list()
    
    # Check for NumPy version
    numpy_lines = [line for line in pip_list.split('\n') if 'numpy' in line.lower()]
    if numpy_lines:
        print(f"📦 Found NumPy: {numpy_lines[0]}")
    
    # Check for TensorFlow version
    tf_lines = [line for line in pip_list.split('\n') if 'tensorflow' in line.lower()]
    if tf_lines:
        print(f"🧠 Found TensorFlow: {tf_lines[0]}")
    
    # Check if we're in the right conda environment
    if 'CONDA_DEFAULT_ENV' in os.environ:
        print(f"🐍 Conda environment: {os.environ['CONDA_DEFAULT_ENV']}")
    
    print("\n🔧 Applying fixes...")
    
    try:
        # Reinstall TensorFlow with forced dependencies
        print("🔄 Reinstalling TensorFlow...")
        subprocess.check_call([sys.executable, "-m", "pip", "uninstall", "tensorflow", "-y"])
        subprocess.check_call([sys.executable, "-m", "pip", "install", "tensorflow==2.19.1"])
        
        # Ensure NumPy is compatible
        print("🔄 Ensuring NumPy compatibility...")
        subprocess.check_call([sys.executable, "-m", "pip", "uninstall", "numpy", "-y"])
        subprocess.check_call([sys.executable, "-m", "pip", "install", "numpy==1.26.4"])
        
        # Install other required packages
        required_packages = [
            "Pillow",
            "scikit-learn",
            "matplotlib",
            "seaborn",
            "pandas"
        ]
        
        for package in required_packages:
            print(f"📦 Installing {package}...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", package])
        
        print("\n✅ Environment setup completed successfully!")
        print("🔄 Please restart your terminal/IDE and try running the training script again")
        
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error during environment setup: {e}")
        return False

def create_requirements_file():
    """Create a requirements file for consistent environment setup"""
    requirements = """tensorflow==2.19.1
numpy==1.26.4
Pillow>=9.0.0
scikit-learn>=1.2.0
matplotlib>=3.5.0
seaborn>=0.11.0
pandas>=1.5.0
"""
    
    with open("requirements_fixed.txt", "w") as f:
        f.write(requirements)
    
    print("📄 Created requirements_fixed.txt for consistent environment setup")

def main():
    print("🔧 TensorFlow Environment Setup")
    print("=" * 40)
    
    # Create requirements file
    create_requirements_file()
    
    # Check and fix environment
    if check_and_fix_environment():
        print("\n🎉 Environment is now ready for TensorFlow!")
        print("\n📁 Additional files created:")
        print("   - requirements_fixed.txt: Fixed package versions")
        print("\n💡 To manually set up environment, run:")
        print("   pip install -r requirements_fixed.txt")
    else:
        print("\n❌ Environment setup failed")
        print("💡 Try manually installing packages:")
        print("   pip install tensorflow==2.19.1 numpy==1.26.4")

if __name__ == "__main__":
    main()