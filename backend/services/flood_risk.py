from pathlib import Path
import joblib
import pandas as pd
from pathlib import Path

MODELS_DIR = Path(__file__).resolve().parent

_model = None
_mapping = None
_feats = None
_inv_mapping = None


def _load_artifacts():
    global _model, _mapping, _feats, _inv_mapping

    if _model is None:
        _model = joblib.load(MODELS_DIR / "best_flood_risk_model.joblib")
        _mapping = joblib.load(MODELS_DIR / "label_mapping.joblib")
        _feats = joblib.load(MODELS_DIR / "feature_names.joblib")
        _inv_mapping = {v: k for k, v in _mapping.items()}


def predict_flood_risk(
    water_level_cm,
    water_level_rate_cm_per_min,
    rainfall_mm_per_hr,
    soil_moisture_pct,
    elevation_m,
):
    _load_artifacts()

    row = {
        "water_level_cm": water_level_cm,
        "water_level_rate_cm_per_min": water_level_rate_cm_per_min,
        "rainfall_mm_per_hr": rainfall_mm_per_hr,
        "soil_moisture_pct": soil_moisture_pct,
        "elevation_m": elevation_m,
    }

    row["rain_x_rate"] = (
        row["rainfall_mm_per_hr"] *
        row["water_level_rate_cm_per_min"]
    )

    row["level_div_elevation"] = (
        row["water_level_cm"] /
        (row["elevation_m"] + 1.0)
    )

    row["soil_x_rain"] = (
        row["soil_moisture_pct"] *
        row["rainfall_mm_per_hr"]
    )

    row["level_x_rate"] = (
        row["water_level_cm"] *
        row["water_level_rate_cm_per_min"]
    )

    row["rain_div_soil"] = (
        row["rainfall_mm_per_hr"] /
        (row["soil_moisture_pct"] + 1.0)
    )

    input_df = pd.DataFrame([row])[_feats]

    pred_encoded = int(_model.predict(input_df)[0])
    pred_proba = _model.predict_proba(input_df)[0]

    pred_label = _inv_mapping[pred_encoded]
    confidence = float(pred_proba[pred_encoded])

    return {
        "risk_class": pred_encoded,
        "risk_label": pred_label,
        "confidence": round(confidence, 4),
    }