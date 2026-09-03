from typing import Any, Dict, Optional


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def safe_int(value) -> int:
    """
    Convert values like:
        5           -> 5
        "5"         -> 5
        "20-30"     -> 25
        "mentioned" -> 0
        None        -> 0
    """

    if value is None:
        return 0

    try:
        return int(value)
    except (ValueError, TypeError):
        pass

    if isinstance(value, str) and "-" in value:
        try:
            parts = value.split("-")
            low = int(parts[0].strip())
            high = int(parts[1].strip())
            return (low + high) // 2
        except (ValueError, TypeError):
            return 0

    return 0


def mentioned(value) -> bool:
    return (
        value is not None
        and str(value).lower() == "mentioned"
    )


# ============================================================
# FEATURE 4 — PRIORITY ENGINE
# ============================================================

def calculate_priority(
    sos_data: Dict[str, Any],
    feature2_people_count: Optional[int] = None,
    flood_severity: float = 0.0,
) -> Dict[str, Any]:

    people = sos_data.get("people", {})
    needs = sos_data.get("needs", {})
    location = sos_data.get("location", {})
    request = sos_data.get("request", {})

    # ========================================================
    # 1. PEOPLE / CROWD SCORE — MAX 20
    # ========================================================

    sos_people = safe_int(people.get("total"))

    if feature2_people_count is not None:
        try:
            feature2_people = max(0, int(feature2_people_count))
        except (ValueError, TypeError):
            feature2_people = 0
    else:
        feature2_people = 0

    # Multi-modal estimate:
    # use the larger SOS-reported or drone-detected count.
    effective_people = max(sos_people, feature2_people)

    if effective_people >= 50:
        people_score = 20
    elif effective_people >= 20:
        people_score = 18
    elif effective_people >= 10:
        people_score = 15
    elif effective_people >= 5:
        people_score = 10
    elif effective_people >= 1:
        people_score = 5
    else:
        people_score = 0

    # ========================================================
    # 2. VULNERABILITY SCORE — MAX 25
    # ========================================================

    vulnerability_score = 0

    children = safe_int(people.get("children"))
    elderly = safe_int(people.get("elderly"))
    pregnant = safe_int(people.get("pregnant"))
    injured = safe_int(people.get("injured"))
    deceased = safe_int(people.get("deceased"))
    mobility = safe_int(people.get("mobility_impaired"))

    if children > 0 or mentioned(people.get("children")):
        vulnerability_score += 4

    if elderly > 0 or mentioned(people.get("elderly")):
        vulnerability_score += 4

    if pregnant > 0 or mentioned(people.get("pregnant")):
        vulnerability_score += 5

    if injured > 0 or mentioned(people.get("injured")):
        vulnerability_score += 7

    if mobility > 0 or mentioned(people.get("mobility_impaired")):
        vulnerability_score += 5

    if deceased > 0 or mentioned(people.get("deceased")):
        vulnerability_score += 10

    vulnerability_score = min(25, vulnerability_score)

    # ========================================================
    # 3. IMMEDIATE NEEDS SCORE — MAX 20
    # ========================================================

    needs_score = 0

    if needs.get("rescue"):
        needs_score += 7

    if needs.get("medical_transfer"):
        needs_score += 8

    if needs.get("medicine"):
        needs_score += 3

    if needs.get("water"):
        needs_score += 3

    if needs.get("food"):
        needs_score += 2

    if needs.get("shelter"):
        needs_score += 2

    needs_score = min(20, needs_score)

    # ========================================================
    # 4. REQUEST TYPE SCORE — MAX 10
    # ========================================================

    request_type = str(request.get("type") or "").upper()

    if request_type == "MEDICAL":
        request_score = 8
    elif request_type == "RESCUE":
        request_score = 6
    elif request_type == "SUPPLIES":
        request_score = 3
    elif request_type == "SHELTER":
        request_score = 2
    else:
        request_score = 0

    request_score = min(10, request_score)

    # ========================================================
    # 5. FLOOD SEVERITY SCORE — MAX 20
    # ========================================================

    flood_severity = max(
        0.0,
        min(float(flood_severity), 1.0)
    )

    flood_score = round(flood_severity * 20)

    # ========================================================
    # 6. LOCATION AVAILABILITY SCORE — MAX 5
    # ========================================================

    location_score = 0

    if location.get("latitude") is not None:
        location_score += 2

    if location.get("longitude") is not None:
        location_score += 2

    if location.get("text"):
        location_score += 1

    location_score = min(5, location_score)

    # ========================================================
    # 7. FINAL SCORE — HARD MAX 100
    # ========================================================

    total_score = (
        people_score
        + vulnerability_score
        + needs_score
        + request_score
        + flood_score
        + location_score
    )

    # Defensive hard cap: the API can NEVER return >100.
    total_score = min(100, max(0, int(total_score)))

    # ========================================================
    # 8. PRIORITY LEVEL
    # ========================================================

    if total_score >= 85:
        priority = "CRITICAL"
    elif total_score >= 65:
        priority = "HIGH"
    elif total_score >= 45:
        priority = "MEDIUM"
    else:
        priority = "LOW"

    # ========================================================
    # 9. RECOMMENDED ACTIONS
    # ========================================================

    actions = []

    if needs.get("medical_transfer"):
        actions.append("MEDICAL_TRANSFER")

    if needs.get("rescue"):
        actions.append("RESCUE")

    if needs.get("water"):
        actions.append("WATER_SUPPLY")

    if needs.get("food"):
        actions.append("FOOD_SUPPLY")

    if needs.get("medicine"):
        actions.append("MEDICAL_SUPPLIES")

    if needs.get("shelter"):
        actions.append("SHELTER")

    if not actions:
        actions.append("ASSESSMENT")

    # ========================================================
    # 10. FINAL RESULT
    # ========================================================

    return {
        "priority": priority,
        "priority_score": total_score,

        "score_breakdown": {
            "people_score": people_score,
            "vulnerability_score": vulnerability_score,
            "needs_score": needs_score,
            "request_score": request_score,
            "flood_score": flood_score,
            "location_score": location_score,
        },

        "inputs": {
            "sos_people": sos_people,
            "feature2_people": feature2_people_count,
            "effective_people": effective_people,
            "flood_severity": flood_severity,
        },

        "recommended_actions": actions,
    }
