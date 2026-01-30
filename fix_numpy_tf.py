"""Fix NumPy compatibility with TensorFlow"""
import numpy as np
import sys

# Add dtypes attribute if missing
if not hasattr(np, 'dtypes'):
    np.dtypes = type('dtypes', (), {})()

print(f"NumPy {np.__version__} patched for TensorFlow compatibility")
