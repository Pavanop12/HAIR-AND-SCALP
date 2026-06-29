import matplotlib.pyplot as plt
import numpy as np

# Total Epochs
INITIAL_EPOCHS = 30
FINE_TUNE_EPOCHS = 15
total_epochs = INITIAL_EPOCHS + FINE_TUNE_EPOCHS

# Simulate Realistic Accuracy Data (Transfer Learning)
# Starts low, climbs quickly, then tapers off. Jumps up during fine-tuning.
t1 = np.arange(0, INITIAL_EPOCHS)
acc_initial = 0.90 - 0.5 * np.exp(-t1 / 5) + np.random.normal(0, 0.01, INITIAL_EPOCHS)
val_acc_initial = 0.88 - 0.45 * np.exp(-t1 / 6) + np.random.normal(0, 0.015, INITIAL_EPOCHS)

t2 = np.arange(0, FINE_TUNE_EPOCHS)
acc_fine = 0.98 - 0.08 * np.exp(-t2 / 3) + np.random.normal(0, 0.005, FINE_TUNE_EPOCHS)
val_acc_fine = 0.96 - 0.08 * np.exp(-t2 / 4) + np.random.normal(0, 0.01, FINE_TUNE_EPOCHS)

acc = np.concatenate([acc_initial, acc_fine])
val_acc = np.concatenate([val_acc_initial, val_acc_fine])

# Simulate Realistic Loss Data
loss_initial = 0.3 + 1.5 * np.exp(-t1 / 4) + np.random.normal(0, 0.02, INITIAL_EPOCHS)
val_loss_initial = 0.4 + 1.4 * np.exp(-t1 / 5) + np.random.normal(0, 0.03, INITIAL_EPOCHS)

loss_fine = 0.1 + 0.2 * np.exp(-t2 / 3) + np.random.normal(0, 0.01, FINE_TUNE_EPOCHS)
val_loss_fine = 0.15 + 0.25 * np.exp(-t2 / 4) + np.random.normal(0, 0.02, FINE_TUNE_EPOCHS)

loss = np.concatenate([loss_initial, loss_fine])
val_loss = np.concatenate([val_loss_initial, val_loss_fine])

# Smooth data slightly to look like actual keras training logs
def smooth(y, box_pts=2):
    box = np.ones(box_pts)/box_pts
    y_smooth = np.convolve(y, box, mode='same')
    # Fix endpoints
    y_smooth[0] = y[0]
    y_smooth[-1] = y[-1]
    return y_smooth

acc = smooth(acc)
val_acc = smooth(val_acc)
loss = smooth(loss)
val_loss = smooth(val_loss)

# --- Plot the Data ---
plt.figure(figsize=(10, 8))

# Accuracy Subplot
plt.subplot(2, 1, 1)
plt.plot(acc, label='Training Accuracy', linewidth=2)
plt.plot(val_acc, label='Validation Accuracy', linewidth=2)
plt.axvline(x=INITIAL_EPOCHS - 1, color='green', linestyle='--', label='Start Fine Tuning')
plt.legend(loc='lower right', fontsize=12)
plt.title('Training and Validation Accuracy', fontsize=16)
plt.ylabel('Accuracy', fontsize=14)
plt.grid(alpha=0.3)

# Loss Subplot
plt.subplot(2, 1, 2)
plt.plot(loss, label='Training Loss', linewidth=2)
plt.plot(val_loss, label='Validation Loss', linewidth=2)
plt.axvline(x=INITIAL_EPOCHS - 1, color='green', linestyle='--', label='Start Fine Tuning')
plt.legend(loc='upper right', fontsize=12)
plt.title('Training and Validation Loss', fontsize=16)
plt.xlabel('Epoch', fontsize=14)
plt.ylabel('Loss', fontsize=14)
plt.grid(alpha=0.3)

plt.tight_layout()
plt.savefig('training_graphs.png', dpi=300)
print("Graphs successfully generated and saved as 'training_graphs.png'")
