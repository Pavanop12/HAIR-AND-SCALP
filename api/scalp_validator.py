"""
Lightweight pre-check: is the uploaded image likely a human scalp photo?
Uses ImageNet-pretrained MobileNetV2 (no changes to the disease model).
"""
import logging
import re
from typing import Any

import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

_validator_model = None

# Top-N ImageNet predictions to inspect
_TOP_K = 10

# Reject when a non-scalp label appears in the top ranks with at least this score.
_NON_SCALP_TOP3_MIN_SCORE = 0.18
_NON_SCALP_TOP1_MIN_SCORE = 0.12

# Strong top-1 non-scalp object (cars, animals, etc.)
_STRONG_NON_SCALP_TOP1_SCORE = 0.28

# Ambiguous close-ups (often real scalp crops) tend to have a very flat top-1 score.
_AMBIGUOUS_TOP1_MAX_SCORE = 0.14

# Substrings matched against ImageNet label text (underscores normalized to spaces).
NON_SCALP_SUBSTRINGS = (
    # Cars, vehicles
    "sports car", "convertible", "limousine", "minivan", "jeep", "beach wagon",
    "pickup", "police van", "garbage truck", "fire engine", "ambulance", "school bus",
    "motorcycle", "bicycle", "truck", "trailer", "racer", "go-kart", "cab", "taxicab",
    "passenger car", "model t", "recreational vehicle", "streetcar", "trolleybus", 
    "forklift", "tractor", "harvester", "airplane", "airliner", "warplane", 
    "helicopter", "space shuttle", "steam locomotive", "electric locomotive", 
    "bullet train", "submarine", "yacht", "liner", "canoe", "speedboat", "container ship",
    
    # Animals (except furry/hair-like ones: porcupine, Persian cat, Angora, etc.)
    "golden retriever", "labrador", "german shepherd", "rottweiler", "doberman",
    "siberian husky", "malamute", "retriever", "terrier", "spaniel", "poodle",
    "collie", "shepherd", "bulldog", "chihuahua", "pug", "boxer", "husky",
    "tabby", "siamese cat", "egyptian cat", "tiger cat",
    "lion", "tiger", "leopard", "cheetah", "jaguar", "bear", "polar bear",
    "brown bear", "american black bear", "sloth bear", "mongoose", "meerkat",
    "red panda", "lesser panda", "fox", "wolf", "coyote", "hyena", "wild boar",
    "hippopotamus", "zebra", "elephant", "rhinoceros", "giraffe", "camel",
    "macaque", "baboon", "gorilla", "chimpanzee", "orangutan", "gibbon",
    "squirrel", "hamster", "rabbit", "hare", "mouse", "rat",
    "beaver", "otter", "skunk", "raccoon", "kitten", "puppy",
    "bird", "eagle", "owl", "penguin", "flamingo", "pelican", "king penguin",
    "rooster", "hen", "ostrich", "parrot", "macaw", "cockatoo", "hummingbird",
    "duck", "goose", "swan", "crane", "albatross", "vulture",
    "fish", "shark", "goldfish", "stingray", "jellyfish", "starfish",
    "whale", "dolphin", "sea lion", "seal", "otter",
    "snake", "lizard", "crocodile", "alligator", "turtle", "frog", "toad",
    "spider", "scorpion", "centipede", "cockroach", "grasshopper", "bee", "ant",
    "butterfly", "dragonfly", "ladybug", "beetle", "tree frog",
    
    # Electronics, computers, office
    "desktop computer", "laptop", "notebook computer", "keyboard", "monitor",
    "screen", "television", "cellular", "iphone", "remote control", "mouse",
    "printer", "hard disc", "cd player", "tape player", "projector", "solar dish",
    "radar", "blackboard", "whiteboard", "bulletin board", "easel", "globe",
    "microscope", "telescope", "barometer", "thermometer", "scale",
    
    # Books, paper items (except tissue/towel/handkerchief)
    "book jacket", "notebook", "envelope", "binder", "menu", "comic book",
    "carton", "packet", "shopping cart",
    
    # Furniture, home furnishings
    "dining table", "desk", "office chair", "barber chair", "folding chair",
    "studio couch", "couch", "bed", "four-poster", "wardrobe", "bookcase",
    "china cabinet", "file", "chest", "rug", "carpet", "window shade", "window screen",
    "pot", "pan", "box", "shade", "curtain", "blind", "mat", "doormat",
    
    # Web, text
    "web site", "website", "internet site", "crossword", "puzzle", "slate",
    "pencil", "fountain pen", "ballpoint", "felt-pen", "felt-tip", "highlighter",
    "ruler", "rule", "slide rule", "clipboard", "wallet", "typewriter", "mortarboard",
    "tray", "paper", "document", "signature", "handwriting", "writing", "text",
    
    # Household structures, buildings, scenery
    "mobile home", "patio", "boathouse", "bannister", "yurt", "shack", "greenhouse", 
    "barn", "poultry house", "cinema", "monument", "tomb", "castle", "totem pole", 
    "obelisk", "triumphal arch", "dock", "breakwater", "amusement park", "street", 
    "courtyard", "park bench", "fountain", "gazebo", "cabin", "cottage", "villa", 
    "home", "house", "building", "apartment", "hotel", "chalet", "church", "monastery", 
    "palace", "mosque", "library", "restaurant", "viaduct", "dam", "pier", 
    "steel arch bridge", "suspension bridge", "mountain", "volcano", "alp", 
    "lakeside", "seashore", "cliff", "promontory", "valley", "canyon", "geyser", 
    "lighthouse", "picket fence", "chainlink fence", "traffic light", "street sign", 
    "scoreboard", "balloon", "flagpole", "sandbar", "coral reef", "reef",
    
    # Building parts, materials
    "wall", "shingle", "tile", "roof", "wood", "wooden",
    
    # Apparel, personal items (except hair/scalp friendly ones: wig, shower cap, etc.)
    "sock", "shoe", "boot", "sandal", "slipper", "glove", "mitten", "suit", 
    "coat", "jacket", "vest", "skirt", "dress", "pants", "jeans", "trousers", 
    "shorts", "shirt", "t-shirt", "sweater", "cardigan", "blouse", "brassiere", 
    "diaper", "apron", "poncho", "toga", "cloak", "tie", "necktie", "bow tie", 
    "scarf", "shawl", "belt", "scabbard", "holster", "backpack", "purse", 
    "handbag", "suitcase", "umbrella", "parasol", "crutch", "wheelchair",
    
    # Sports equipment
    "racket", "paddle", "skate", "ski", "snowboard", "surfboard", "scuba", 
    "snorkel", "dumbbell", "barbell", "treadmill", "whistle", "stopwatch", "compass",
    "ballplayer", "baseball", "basketball", "football helmet", "rugby ball",
    "tennis ball", "golf ball", "soccer ball", "volleyball",
    
    # Weapons
    "rifle", "shotgun", "pistol", "revolver", "machine gun", "cannon", "missile", 
    "projectile", "sword", "dagger", "axe", "shield", "bow", "arrow",
    
    # Musical instruments
    "guitar", "piano", "drum", "violin", "trumpet", "saxophone",
    
    # Food, kitchen
    "pizza", "cheeseburger", "hotdog", "ice cream", "bagel", "pretzel",
    "mashed potato", "head cabbage", "broccoli", "cauliflower", "cucumber",
    "orange", "lemon", "banana", "pineapple", "strawberry", "fig", "apple",
    "plate", "cup", "coffee mug", "wine bottle", "beer bottle", "cleaver", "knife", "bib",
    
    # Clocks, time
    "clock", "wall clock", "analog clock", "digital clock",
    
    # Other plants, trees
    "sunflower", "daisy", "rose", "orchid", "mushroom", "corn", "hay",
    "oak tree", "fig tree", "palm tree",
)

SCALP_HINT_SUBSTRINGS = (
    "wig", "hair slide", "hair spray", "comb", "shower cap", "bathing cap",
    "face powder", "lipstick", "mask", "band aid", "sunglass",
)

# Labels that look like scalp hints but are not (e.g. "bald eagle").
SCALP_HINT_BLOCKLIST = (
    "bald eagle", "hair slide",  # hair slide is accessory not scalp
)


def get_validator_model():
    global _validator_model
    if _validator_model is None:
        from keras.applications.mobilenet_v2 import MobileNetV2

        logger.info("Loading MobileNetV2 scalp validator (ImageNet weights)...")
        _validator_model = MobileNetV2(weights="imagenet", include_top=True)
        logger.info("Scalp validator model loaded.")
    return _validator_model


def _normalize_label(label: str) -> str:
    return label.lower().replace("_", " ")


def _is_non_scalp_label(label: str) -> bool:
    normalized = _normalize_label(label)
    if normalized == "bald eagle" or "bald eagle" in normalized:
        return True
    for term in NON_SCALP_SUBSTRINGS:
        if term in normalized:
            pattern = rf"\b{re.escape(term)}\b"
            if re.search(pattern, normalized):
                return True
    return False


def _is_scalp_hint_label(label: str) -> bool:
    normalized = _normalize_label(label)
    if any(blocked in normalized for blocked in SCALP_HINT_BLOCKLIST):
        return False
    return any(term in normalized for term in SCALP_HINT_SUBSTRINGS)


def validate_scalp_image(img: Image.Image) -> tuple[bool, dict[str, Any]]:
    """
    Return (is_scalp, details).
    details includes top predictions for logging and debugging.
    """
    from keras.applications.mobilenet_v2 import decode_predictions, preprocess_input

    try:
        model = get_validator_model()
        rgb = img.convert("RGB").resize((224, 224))
        batch = np.expand_dims(np.array(rgb, dtype=np.float32), axis=0)
        batch = preprocess_input(batch)

        preds = model.predict(batch, verbose=0)
        decoded = decode_predictions(preds, top=_TOP_K)[0]

        prediction_summary = [
            {"label": label, "score": round(float(score), 4)}
            for _, label, score in decoded
        ]
        details: dict[str, Any] = {"predictions": prediction_summary}

        top_label = decoded[0][1]
        top_score = float(decoded[0][2])
        details["top_label"] = top_label
        details["top_score"] = round(top_score, 4)

        logger.info(
            "Scalp validation predictions (top 5): %s",
            prediction_summary[:5],
        )

        for rank, (_, label, score) in enumerate(decoded[:3]):
            score_f = float(score)
            if not _is_non_scalp_label(label):
                continue
            threshold = (
                _STRONG_NON_SCALP_TOP1_SCORE if rank == 0 else _NON_SCALP_TOP3_MIN_SCORE
            )
            if score_f >= threshold:
                details["reject_reason"] = "non_scalp_object_detected"
                details["matched_label"] = label
                details["matched_score"] = round(score_f, 4)
                details["matched_rank"] = rank
                return False, details

        for _, label, score in decoded:
            if _is_scalp_hint_label(label) and float(score) >= 0.04:
                details["accept_reason"] = "scalp_hint_detected"
                details["matched_label"] = label
                return True, details

        if top_score <= _AMBIGUOUS_TOP1_MAX_SCORE:
            details["accept_reason"] = "ambiguous_closeup"
            return True, details

        if _is_non_scalp_label(top_label) and top_score >= _NON_SCALP_TOP1_MIN_SCORE:
            details["reject_reason"] = "top_prediction_non_scalp"
            details["matched_label"] = top_label
            details["matched_score"] = round(top_score, 4)
            return False, details

        details["accept_reason"] = "no_strong_non_scalp_signal"
        return True, details

    except Exception as exc:
        logger.exception("Scalp validation failed: %s", exc)
        raise
