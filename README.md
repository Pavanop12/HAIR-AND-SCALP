# Hair & Scalp Disease Detection

An AI-powered web application that detects common hair and scalp diseases from uploaded images using a deep learning model based on **MobileNetV2**. The system provides disease predictions, confidence scores, and an intuitive user interface for quick analysis.

---

## Features

- Upload scalp images for disease detection
- Deep learning-based image classification
- Confidence score for each prediction
- FastAPI backend for model inference
- React frontend with a user-friendly interface
- REST API integration
- Responsive web design

---

## Tech Stack

### Frontend
- React.js
- HTML5
- CSS3
- JavaScript

### Backend
- FastAPI
- Python

### Deep Learning
- TensorFlow
- Keras
- MobileNetV2

### Database
- Supabase

---

## Project Structure

```
HAIR-AND-SCALP/
│
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   └── ...
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── model/
│   └── hair_model.keras
│
├── README.md
└── .gitignore
```

---

## Installation

### Clone the repository

```bash
git clone https://github.com/Pavanop12/HAIR-AND-SCALP.git
```

Move into the project directory:

```bash
cd HAIR-AND-SCALP
```

---

## Backend Setup

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it:

### Windows

```bash
.venv\Scripts\activate
```

### Install dependencies

```bash
pip install -r requirements.txt
```

Start the FastAPI server:

```bash
uvicorn app:app --reload
```

---

## Frontend Setup

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm start
```

---

## Model

The project uses a fine-tuned **MobileNetV2** convolutional neural network trained to classify multiple hair and scalp diseases from image inputs.

---

## Workflow

1. Upload a scalp image.
2. Image is preprocessed.
3. MobileNetV2 predicts the disease.
4. Backend returns prediction and confidence score.
5. Results are displayed on the frontend.

---

## Future Improvements

- Healthy scalp detection
- Disease severity estimation
- Treatment recommendations
- Progress tracking over time
- Explainable AI using Grad-CAM
- Cloud deployment

---

## Author

**Pavan Shirodkar**

GitHub: https://github.com/Pavanop12

---

## License

This project is intended for educational and research purposes.
