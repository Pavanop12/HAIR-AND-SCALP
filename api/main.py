from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
from PIL import Image
import io
import os
import logging

from .scalp_validator import get_validator_model, validate_scalp_image

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="ScalpScan AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

IMG_SIZE = (224, 224)
HEALTHY_CONFIDENCE_THRESHOLD = 0.45
HEALTHY_PROBABILITY_GAP_THRESHOLD = 0.15
HEALTHY_SECONDARY_CONFIDENCE_THRESHOLD = 0.60
HEALTHY_SECONDARY_GAP_THRESHOLD = 0.20
TELOGEN_HEALTHY_CONFIDENCE_THRESHOLD = 0.65
CLASS_ACCEPTANCE_MIN_CONFIDENCE = {
    # Telogen tends to over-trigger on cosmetically healthy scalp images.
    # Require stronger evidence before accepting it as the final disease class.
    "Telogen Effluvium": 0.90,
}

CLASS_NAMES = [
    'Alopecia Areata', 'Contact Dermatitis', 'Folliculitis',
    'Head Lice', 'Lichen Planus', 'Male Pattern Baldness',
    'Psoriasis', 'Seborrheic Dermatitis', 'Telogen Effluvium', 'Tinea Capitis'
]

SEVERITY_WEIGHTS = {
    'Alopecia Areata': 0.75, 'Contact Dermatitis': 0.65,
    'Folliculitis': 0.80, 'Head Lice': 0.60,
    'Lichen Planus': 0.70, 'Male Pattern Baldness': 0.50,
    'Psoriasis': 0.75, 'Seborrheic Dermatitis': 0.70,
    'Telogen Effluvium': 0.65, 'Tinea Capitis': 0.85,
}

DISEASE_INFO = {
    'Alopecia Areata': {'description': 'Autoimmune condition causing patchy hair loss', 'treatment': 'Corticosteroid injections, topical immunotherapy'},
    'Contact Dermatitis': {'description': 'Skin inflammation from allergen contact', 'treatment': 'Avoid triggers, topical corticosteroids'},
    'Folliculitis': {'description': 'Inflammation of hair follicles from bacteria', 'treatment': 'Antibiotics, antifungal medications'},
    'Head Lice': {'description': 'Parasitic infestation of the scalp', 'treatment': 'Medicated shampoos, fine-tooth combing'},
    'Lichen Planus': {'description': 'Inflammatory condition affecting skin and hair', 'treatment': 'Corticosteroids, retinoids'},
    'Male Pattern Baldness': {'description': 'Hereditary hair thinning and recession', 'treatment': 'Minoxidil, finasteride, hair transplant'},
    'Psoriasis': {'description': 'Chronic autoimmune condition causing scaly patches', 'treatment': 'Medicated shampoos, biologics, light therapy'},
    'Seborrheic Dermatitis': {'description': 'Common condition causing scaly patches and dandruff', 'treatment': 'Ketoconazole or selenium sulfide shampoo'},
    'Telogen Effluvium': {'description': 'Excessive hair shedding due to stress/hormones', 'treatment': 'Treat underlying cause, nutritional supplements'},
    'Tinea Capitis': {'description': 'Fungal infection of the scalp', 'treatment': 'Oral antifungal medication, medicated shampoo'},
}

MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'best_model.keras')
model = None


def get_model():
    global model
    if model is None:
        import keras
        logger.info(f"Loading model from: {MODEL_PATH}")
        model = keras.models.load_model(MODEL_PATH)
        logger.info("Model loaded successfully!")
    return model


@app.on_event("startup")
async def startup():
    get_model()
    try:
        get_validator_model()
    except Exception as e:
        logger.error(f"Failed to load scalp validator: {e}")
        raise


@app.get("/health")
async def health():
    return {"status": "ok", "model_loaded": model is not None}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Empty image file")

        img = Image.open(io.BytesIO(contents)).convert("RGB")

        try:
            is_scalp, validation_details = validate_scalp_image(img)
        except Exception as validation_error:
            logger.error(f"Scalp validation error: {validation_error}")
            raise HTTPException(
                status_code=500,
                detail="Unable to validate the uploaded image. Please try again.",
            ) from validation_error

        if not is_scalp:
            logger.warning(
                "Rejected non-scalp upload: %s",
                validation_details,
            )
            return {
                "success": False,
                "message": (
                    "This image is not a scalp image. "
                    "Please upload a clear scalp photograph."
                ),
            }

        logger.info("Scalp validation passed: %s", validation_details.get("accept_reason"))

        img = img.resize(IMG_SIZE)
        img_array = np.array(img, dtype=np.float32)
        img_array = np.expand_dims(img_array, axis=0)

        m = get_model()
        predictions = m.predict(img_array, verbose=0)

        probs = predictions[0]
        sorted_indices = np.argsort(probs)[::-1]
        top_index = int(sorted_indices[0])
        top_confidence = float(probs[top_index])
        top_class = CLASS_NAMES[top_index]
        second_confidence = float(probs[int(sorted_indices[1])]) if len(sorted_indices) > 1 else 0.0
        probability_gap = top_confidence - second_confidence

        all_predictions = {
            CLASS_NAMES[i]: round(float(probs[i]) * 100, 2)
            for i in range(len(CLASS_NAMES))
        }

        # Primary healthy rule requested: low confidence + ambiguous top-2 gap.
        is_healthy_primary = (
            top_confidence < HEALTHY_CONFIDENCE_THRESHOLD
            and probability_gap < HEALTHY_PROBABILITY_GAP_THRESHOLD
        )
        # Secondary rule: catches uncertain predictions that otherwise get forced
        # into a disease class (common for healthy/OOD images).
        is_healthy_secondary = (
            top_confidence < HEALTHY_SECONDARY_CONFIDENCE_THRESHOLD
            and probability_gap < HEALTHY_SECONDARY_GAP_THRESHOLD
        )
        # Extra guardrail for frequent false positives as Telogen Effluvium.
        is_telogen_false_positive = (
            top_class == "Telogen Effluvium"
            and top_confidence < TELOGEN_HEALTHY_CONFIDENCE_THRESHOLD
            and probability_gap < HEALTHY_SECONDARY_GAP_THRESHOLD
        )

        class_min_confidence = CLASS_ACCEPTANCE_MIN_CONFIDENCE.get(top_class)
        fails_class_acceptance = (
            class_min_confidence is not None
            and top_confidence < class_min_confidence
        )

        is_healthy_scalp = (
            is_healthy_primary
            or is_healthy_secondary
            or is_telogen_false_positive
            or fails_class_acceptance
        )

        if is_healthy_scalp:
            return {
                "disease": "Healthy Scalp",
                "prediction": "Healthy Scalp",
                "confidence": round(top_confidence * 100, 2),
                "severity": "None",
                "severity_score": 0.0,
                "recommendation": "Your scalp appears healthy with no strong signs of disease.",
                "probability_gap": round(probability_gap, 4),
                "all_predictions": all_predictions,
                "info": {
                    "description": "No strong indicators of a scalp disease were detected.",
                    "treatment": "No treatment needed at this time.",
                },
            }

        disease = top_class
        confidence = top_confidence
        severity_score = round(confidence * SEVERITY_WEIGHTS[disease] * 100, 2)

        return {
            "disease": disease,
            "prediction": disease,
            "confidence": round(confidence * 100, 2),
            "severity_score": severity_score,
            "probability_gap": round(probability_gap, 4),
            "all_predictions": all_predictions,
            "info": DISEASE_INFO.get(disease, {}),
        }
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
