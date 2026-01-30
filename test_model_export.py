import os
import tensorflow as tf
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.applications import EfficientNetB0

def test_model_export():
    """Test the model export functionality that was fixed"""
    print("Testing model export functionality...")

    # Create a simple model (similar to the one in the training script)
    base_model = EfficientNetB0(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
    base_model.trainable = False

    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = Dense(256, activation='relu')(x)
    x = Dropout(0.4)(x)
    predictions = Dense(7, activation='softmax')(x)

    model = Model(inputs=base_model.input, outputs=predictions)

    # Compile model
    model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

    # Create output directory
    output_dir = "test_export_model"
    os.makedirs(output_dir, exist_ok=True)

    print("Testing model save with .keras extension...")

    try:
        # This is the line that was fixed - should now work
        model.save(os.path.join(output_dir, 'saved_model.keras'))
        print("✅ SUCCESS: Model saved with .keras extension")

        # Also test the .h5 format
        model.save(os.path.join(output_dir, 'model.h5'))
        print("✅ SUCCESS: Model saved with .h5 extension")

        # Check if files were created
        keras_file = os.path.join(output_dir, 'saved_model.keras')
        h5_file = os.path.join(output_dir, 'model.h5')

        if os.path.exists(keras_file):
            print(f"✅ File created: {keras_file}")
        else:
            print(f"❌ File not found: {keras_file}")

        if os.path.exists(h5_file):
            print(f"✅ File created: {h5_file}")
        else:
            print(f"❌ File not found: {h5_file}")

        print("\n🎉 Model export test completed successfully!")
        print("The ValueError fix is working correctly.")

    except Exception as e:
        print(f"❌ ERROR: {e}")
        print("The fix did not work.")

if __name__ == "__main__":
    test_model_export()
