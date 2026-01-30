# TensorFlow and NumPy Compatibility Fix

## Issue Description

You're encountering a compatibility issue between TensorFlow and NumPy versions. The error indicates:

```
A module that was compiled using NumPy 1.x cannot be run in NumPy 2.2.6 as it may crash.
```

This happens because TensorFlow was compiled with NumPy 1.x, but your environment has NumPy 2.x installed.

## Solutions

### Solution 1: Use the Automated Fix Scripts

We've provided two scripts to automatically fix this issue:

#### For Windows:
```bash
fix_tf_numpy.bat
```

#### For Linux/Mac:
```bash
chmod +x fix_tf_numpy.sh
./fix_tf_numpy.sh
```

These scripts will:
1. Create a new conda environment named `agri_tf_fix`
2. Install compatible versions of TensorFlow and NumPy
3. Install other required dependencies

### Solution 2: Manual Fix

If you prefer to fix the issue manually:

1. **Downgrade NumPy**:
   ```bash
   pip uninstall numpy -y
   pip install numpy==1.24.3
   ```

2. **Or reinstall TensorFlow**:
   ```bash
   pip uninstall tensorflow -y
   pip install tensorflow==2.12.0
   ```

3. **Verify versions**:
   ```python
   import numpy as np
   import tensorflow as tf
   print(f"NumPy version: {np.__version__}")
   print(f"TensorFlow version: {tf.__version__}")
   ```

### Solution 3: Use the Lightweight Analyzer

While fixing the environment, you can use the lightweight analyzer to explore the dataset:

```bash
python train_archive4_light.py
```

This script doesn't require TensorFlow and will show you information about the Archive4 dataset.

## Compatible Versions

The following versions are known to work together:

- **Python**: 3.9
- **TensorFlow**: 2.12.0
- **NumPy**: 1.24.3

## After Fixing

Once you've fixed the environment:

1. Activate the new environment:
   ```bash
   conda activate agri_tf_fix
   ```

2. Run the training script:
   ```bash
   python train_archive4_model.py
   ```

## Expected Training Time

Due to the large size of the Archive4 dataset (71 crop disease directories), training may take several hours depending on your hardware:

- **With GPU**: 2-4 hours
- **With CPU only**: 8-12 hours

Make sure you have sufficient RAM (at least 16GB recommended) and disk space (at least 10GB free).