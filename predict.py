import tensorflow as tf
import numpy as np
import sys
import os

IMG_SIZE = (224, 224)

# Exact class names in the same order as training
CLASS_NAMES = [
    'Alopecia Areata',
    'Contact Dermatitis',
    'Folliculitis',
    'Head Lice',
    'Lichen Planus',
    'Male Pattern Baldness',
    'Psoriasis',
    'Seborrheic Dermatitis',
    'Telogen Effluvium',
    'Tinea Capitis'
]

def predict_single_image(image_path, model_path='best_model.keras'):
    # 1. Check if image exists
    if not os.path.exists(image_path):
        print(f"\nError: Could not find image at '{image_path}'")
        return

    # 2. Load trained model
    print(f"Loading trained model from '{model_path}'...")
    try:
        model = tf.keras.models.load_model(model_path)
    except Exception as e:
        print(f"Error loading model: {e}")
        return

    # 3. Load and prepare image
    print("Preparing image...")
    # Load image and resize to 224x224
    img = tf.keras.utils.load_img(image_path, target_size=IMG_SIZE)
    
    # Convert image to array
    img_array = tf.keras.utils.img_to_array(img)
    
    # Add batch dimension -> (1, 224, 224, 3)
    img_array = np.expand_dims(img_array, axis=0)

    # 4. Predict using trained model
    print("Making prediction...")
    predictions = model.predict(img_array, verbose=0)

    # 5. Get the result
    # Get highest probability class
    predicted_class_index = np.argmax(predictions[0])
    
    # Convert confidence score to percentage
    confidence = predictions[0][predicted_class_index] * 100
    
    # Get disease name
    predicted_disease = CLASS_NAMES[predicted_class_index]

    # 6. Print prediction result
    print("\n" + "=" * 40)
    print("PREDICTION RESULT")
    print("=" * 40)
    print(f"Image:      {os.path.basename(image_path)}")
    print(f"Disease:    {predicted_disease}")
    print(f"Confidence: {confidence:.2f}%")
    print("=" * 40)


# Main execution starts here
if __name__ == "__main__":
    # Check if image path is passed in terminal
    if len(sys.argv) < 2:
        print("\nUsage Error: Missing image path.")
        print("Example: python predict.py C:\\Users\\ASUS\\Desktop\\test_image.jpg")
    else:
        # Take image path from command line
        test_image_path = sys.argv[1]
        
        # Call prediction function
        predict_single_image(test_image_path)