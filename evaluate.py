import tensorflow as tf
import numpy as np
import os
import matplotlib.pyplot as plt
from sklearn.metrics import classification_report, confusion_matrix
import seaborn as sns

BATCH_SIZE = 32
IMG_SIZE = (224, 224)

# Dataset paths
base_dir = r"c:\Users\ASUS\Desktop\hairandscalp\clean_dataset"
test_dir = os.path.join(base_dir, 'test')

# Load test dataset WITHOUT shuffling so true labels align with predictions
print("Loading test dataset...")
test_dataset = tf.keras.utils.image_dataset_from_directory(
    test_dir, 
    shuffle=False, 
    batch_size=BATCH_SIZE, 
    image_size=IMG_SIZE
)
class_names = test_dataset.class_names

print("Loading the best model...")
model = tf.keras.models.load_model('best_model.keras')

print("\n" + "="*40)
print("1. OVERALL ACCURACY")
print("="*40)
loss, accuracy = model.evaluate(test_dataset)
print(f"Overall Accuracy:  {accuracy * 100:.2f}%")
print(f"Overall Test Loss: {loss:.4f}")

print("\n" + "="*40)
print("2. DETAILED CLASSIFICATION REPORT")
print("="*40)
print("Generating predictions...")
y_true = []
for _, labels in test_dataset:
    y_true.extend(labels.numpy())
y_true = np.array(y_true)

predictions = model.predict(test_dataset)
y_pred = np.argmax(predictions, axis=1)

print(classification_report(y_true, y_pred, target_names=class_names))

print("\n" + "="*40)
print("3. CONFUSION MATRIX")
print("="*40)
cm = confusion_matrix(y_true, y_pred)

plt.figure(figsize=(12, 10))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
            xticklabels=class_names, yticklabels=class_names)
plt.title('Confusion Matrix for Hair & Scalp Disease Detection', fontsize=16)
plt.xlabel('Predicted Disease', fontsize=14)
plt.ylabel('True Disease', fontsize=14)
plt.xticks(rotation=45, ha='right')
plt.yticks(rotation=0)
plt.tight_layout()

# Save the plot
output_img = 'confusion_matrix.png'
plt.savefig(output_img)
print(f"Confusion matrix visualized and successfully saved as '{output_img}'")
