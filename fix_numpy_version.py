#!/usr/bin/env python3
"""
Script to fix NumPy version compatibility issues with TensorFlow
"""

import subprocess
import sys

def check_versions():
    """Check current versions of NumPy and TensorFlow"""
    try:
        import numpy as np
        print(f"NumPy version: {np.__version__}")
    except ImportError:
        print("NumPy not installed")
        return False
    
    try:
        import tensorflow as tf
        print(f"TensorFlow version: {tf.__version__}")
    except ImportError:
        print("TensorFlow not installed")
        return False
    
    return True

def fix_numpy_version():
    """Downgrade NumPy to a version compatible with TensorFlow"""
    print("Attempting to downgrade NumPy to version 1.24.3...")
    
    try:
        # Uninstall current NumPy
        subprocess.check_call([sys.executable, "-m", "pip", "uninstall", "numpy", "-y"])
        
        # Install compatible NumPy version
        subprocess.check_call([sys.executable, "-m", "pip", "install", "numpy==1.24.3"])
        
        print("✅ NumPy successfully downgraded to version 1.24.3")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to fix NumPy version: {e}")
        return False

def main():
    print("🔧 Checking NumPy and TensorFlow compatibility...")
    print("=" * 50)
    
    if not check_versions():
        print("❌ Could not check versions")
        return
    
    # Check if NumPy version is 2.x
    import numpy as np
    if np.__version__.startswith("2."):
        print("⚠️  NumPy 2.x detected, which is incompatible with TensorFlow")
        print("🔧 Attempting to fix...")
        
        if fix_numpy_version():
            print("\n✅ NumPy version fixed!")
            print("🔄 Please restart your Python environment and try running the training script again")
        else:
            print("\n❌ Failed to fix NumPy version")
            print("💡 Manual fix: Run 'pip install numpy==1.24.3' in your environment")
    else:
        print("✅ NumPy version is compatible with TensorFlow")

if __name__ == "__main__":
    main()