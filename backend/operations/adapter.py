"""
adapter.py
----------
Converts the ACTUAL output of calculate_priority() (Feature 4,
already built by your team, confirmed from backend/services/priority.py)
into a row for the rescue_incidents table.

Confirmed real return shape of calculate_priority():
    {
        "incident_id": "INC101",      # dynamically generated, confirmed
        "latitude": 28.6139,
        "longitude": 77.2090,
        "people": 400,
        "children": 40,
        "elderly": 30,
        "injured": 5,
        "mobility_impaired": 10,
        "flood_risk": 92,
        "priority_score": 96,
        "status": "WAITING_FOR_RESCUE"
    }

Two things this dict does NOT include, that rescue_incidents wants:
  - priority_level (CRITICAL/HIGH/MEDIUM/LOW) -- DERIVED here from
    priority_score using explicit thresholds. This is a designed
    mapping, not an invented model output -- see derive_priority_level().
  - location_text -- not present in calculate_priority()'s output
    (only lat/long are). Stored as None/null if not supplied; pass it
    in explicitly if you have it available at the call site (e.g. from
    the original SOS structured data).
"""

from typing import Dict, Any, Optional


def derive_priority_level(priority_score: float) -> str:
    """
    Explicit, documented threshold mapping from the 0-100 priority_score
    your Feature 4 already produces, to a priority_level label.
    These thresholds are a design choice for Module 5's prioritization
    logic -- adjust them if your team has different cutoffs in mind.
    """
    if priority_score >= 80:
        return "CRITICAL"
    elif priority_score >= 60:
        return "HIGH"
    elif priority_score >= 40:
        return "MEDIUM"
    else:
        return "LOW"


def priority_result_to_incident_row(
    priority_result: Dict[str, Any],
    location_text: Optional[str] = None,
) -> Dict[str, Any]:
    """
    priority_result: the exact dict returned by calculate_priority().
    location_text: optional human-readable location, if you have it
                   available (e.g. from the SOS structured data's
                   location.text field) -- not required.
    """
    required_fields = ["incident_id", "people", "priority_score", "status"]
    missing = [f for f in required_fields if f not in priority_result]
    if missing:
        raise ValueError(f"priority_result is missing required fields: {missing}")

    priority_score = priority_result["priority_score"]

    return {
        "incident_id": priority_result["incident_id"],
        "location_text": location_text,
        "latitude": priority_result.get("latitude"),
        "longitude": priority_result.get("longitude"),
        "people_count": int(priority_result["people"]),
        "people_remaining": int(priority_result["people"]),
        "priority_score": int(priority_score),
        "priority_level": derive_priority_level(priority_score),
        "status": priority_result.get("status", "WAITING_FOR_RESCUE"),
        "children": priority_result.get("children"),
        "elderly": priority_result.get("elderly"),
        "injured": priority_result.get("injured"),
        "mobility_impaired": priority_result.get("mobility_impaired"),
        "flood_risk": priority_result.get("flood_risk"),
    }
