"""Exercise answer validation — extensible per exercise type.

HOW: Each type has a validate() function. Backend is authoritative;
frontend never sends is_correct.
"""
import re
import unicodedata
from typing import Any


def normalize_text(text: str) -> str:
    """Normalize for speech/type comparison: case, whitespace, punctuation."""
    if not isinstance(text, str):
        text = str(text)
    text = unicodedata.normalize("NFKD", text)
    text = "".join(c for c in text if not unicodedata.combining(c))
    text = text.lower().strip()
    text = re.sub(r"[^\w\s]", "", text)
    text = re.sub(r"\s+", " ", text)
    return text


def validate_multiple_choice(user_answer: Any, payload: dict) -> tuple[bool, Any]:
    correct = payload.get("correct_option_id")
    return user_answer == correct, correct


def validate_word_bank(user_answer: Any, payload: dict) -> tuple[bool, Any]:
    expected = payload.get("correct_sequence", [])
    answer = user_answer if isinstance(user_answer, list) else []
    return answer == expected, expected


def validate_match_pairs(user_answer: Any, payload: dict) -> tuple[bool, Any]:
    pairs = payload.get("pairs", {})
    answer = user_answer if isinstance(user_answer, dict) else {}
    is_correct = answer == pairs
    return is_correct, pairs


def validate_fill_blank(user_answer: Any, payload: dict) -> tuple[bool, Any]:
    expected = payload.get("correct_answer", "")
    return normalize_text(str(user_answer)) == normalize_text(str(expected)), expected


def validate_type_answer(user_answer: Any, payload: dict) -> tuple[bool, Any]:
    acceptable = payload.get("acceptable_answers", [payload.get("correct_answer", "")])
    normalized = normalize_text(str(user_answer))
    for ans in acceptable:
        if normalized == normalize_text(str(ans)):
            return True, acceptable[0]
    return False, acceptable[0]


def validate_audio(user_answer: Any, payload: dict) -> tuple[bool, Any]:
    return validate_type_answer(user_answer, payload)


def validate_speech(user_answer: Any, payload: dict) -> tuple[bool, Any]:
    return validate_type_answer(user_answer, payload)


def validate_image_choice(user_answer: Any, payload: dict) -> tuple[bool, Any]:
    return validate_multiple_choice(user_answer, payload)


VALIDATORS = {
    "multiple_choice": validate_multiple_choice,
    "word_bank": validate_word_bank,
    "match_pairs": validate_match_pairs,
    "fill_blank": validate_fill_blank,
    "type_answer": validate_type_answer,
    "audio": validate_audio,
    "speech": validate_speech,
    "image_choice": validate_image_choice,
}


def validate_answer(exercise_type: str, user_answer: Any, payload: dict) -> tuple[bool, Any]:
    validator = VALIDATORS.get(exercise_type)
    if not validator:
        raise ValueError(f"Unknown exercise type: {exercise_type}")
    return validator(user_answer, payload)


def sanitize_payload_for_client(exercise_type: str, payload: dict) -> dict:
    """Strip correct answers from payload before sending to client."""
    safe = dict(payload)
    keys_to_remove = [
        "correct_option_id",
        "correct_sequence",
        "pairs",
        "correct_answer",
        "acceptable_answers",
    ]
    for key in keys_to_remove:
        safe.pop(key, None)
    if exercise_type == "match_pairs":
        safe["left_items"] = payload.get("left_items", [])
        safe["right_items"] = payload.get("right_items", [])
    if exercise_type == "word_bank":
        safe["word_bank"] = payload.get("word_bank", [])
    if exercise_type == "multiple_choice" or exercise_type == "image_choice":
        safe["options"] = payload.get("options", [])
    if exercise_type == "fill_blank":
        safe["sentence"] = payload.get("sentence", "")
        safe["hint"] = payload.get("hint")
    return safe
