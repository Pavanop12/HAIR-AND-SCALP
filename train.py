import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
import os
import numpy as np
from sklearn.utils.class_weight import compute_class_weight

# Parameters
BATCH_SIZE = 32
IMG_SIZE = (224, 224)
INITIAL_EPOCHS = 30
FINE_TUNE_EPOCHS = 15

# Dataset paths
base_dir = r"c:\Users\ASUS\Desktop\hairandscalp\clean_dataset"
train_dir = os.path.join(base_dir, 'train')
val_dir = os.path.join(base_dir, 'val')
test_dir = os.path.join(base_dir, 'test')

# Load datasets
train_dataset = tf.keras.utils.image_dataset_from_directory(train_dir, shuffle=True, batch_size=BATCH_SIZE, image_size=IMG_SIZE)
val_dataset = tf.keras.utils.image_dataset_from_directory(val_dir, shuffle=True, batch_size=BATCH_SIZE, image_size=IMG_SIZE)
test_dataset = tf.keras.utils.image_dataset_from_directory(test_dir, shuffle=True, batch_size=BATCH_SIZE, image_size=IMG_SIZE)

class_names = train_dataset.class_names
num_classes = len(class_names)
print(f"Classes: {class_names}")

# Prefetch only (no cache for augmented data)
AUTOTUNE = tf.data.AUTOTUNE
train_dataset = train_dataset.shuffle(1000).prefetch(buffer_size=AUTOTUNE)
val_dataset = val_dataset.prefetch(buffer_size=AUTOTUNE)
test_dataset = test_dataset.prefetch(buffer_size=AUTOTUNE)

# Stronger Data Augmentation
data_augmentation = tf.keras.Sequential([
    tf.keras.layers.RandomFlip('horizontal'),
    tf.keras.layers.RandomRotation(0.3),
    tf.keras.layers.RandomZoom(0.3),
    tf.keras.layers.RandomContrast(0.2),
    tf.keras.layers.RandomBrightness(0.2),
])

preprocess_input = tf.keras.applications.mobilenet_v2.preprocess_input

# Build model
inputs = tf.keras.Input(shape=(224, 224, 3))
x = data_augmentation(inputs)
x = preprocess_input(x)

base_model = MobileNetV2(input_shape=(224, 224, 3), include_top=False, weights='imagenet')
base_model.trainable = False

x = base_model(x, training=False)
x = GlobalAveragePooling2D()(x)
x = Dropout(0.3)(x)
outputs = Dense(num_classes, activation='softmax')(x)
model = Model(inputs, outputs)

# Class weights (handle imbalance)
labels = np.concatenate([y for x, y in train_dataset], axis=0)
class_weights = compute_class_weight(class_weight='balanced', classes=np.unique(labels), y=labels)
class_weights = dict(enumerate(class_weights))
print("Class Weights:", class_weights)

# Loss with label smoothing
loss_fn = tf.keras.losses.SparseCategoricalCrossentropy()
# Compile
model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=1e-4),
              loss=loss_fn,
              metrics=['accuracy'])

# Callbacks
callbacks = [
    EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True),
    ModelCheckpoint('best_model.keras', monitor='val_loss', save_best_only=True),
    ReduceLROnPlateau(monitor='val_loss', factor=0.3, patience=3)
]

# Initial training
history = model.fit(train_dataset,
                    epochs=INITIAL_EPOCHS,
                    validation_data=val_dataset,
                    class_weight=class_weights,
                    callbacks=callbacks)

# Fine-tuning (only last 30 layers)
base_model.trainable = True

for layer in base_model.layers[:-30]:
    layer.trainable = False

model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5),
              loss=loss_fn,
              metrics=['accuracy'])

# Continue training
history_fine = model.fit(train_dataset,
                         epochs=INITIAL_EPOCHS + FINE_TUNE_EPOCHS,
                         initial_epoch=history.epoch[-1] + 1,
                         validation_data=val_dataset,
                         class_weight=class_weights,
                         callbacks=callbacks)

# Evaluate
loss, accuracy = model.evaluate(test_dataset)
print(f"Test Accuracy: {accuracy:.4f}")

# Save model
model.save('final_model.keras')
print("Model saved")
