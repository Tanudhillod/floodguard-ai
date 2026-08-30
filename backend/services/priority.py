from typing import Any, Dict, Optional


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def safe_int(value) -> int:
    """
    Convert values like:

    5        -> 5
    "5"      -> 5
    "20-30"  -> 25
    "mentioned" -> 0
    None     -> 0
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
    # 1. PEOPLE / CROWD SCORE
    # ========================================================

    # Number reported by Feature 3 / SOS message
    sos_people = safe_int(
        people.get("total")
    )


    # Number detected by Feature 2 / drone
    if feature2_people_count is not None:
        try:
            feature2_people = int(
                feature2_people_count
            )
        except (ValueError, TypeError):
            feature2_people = 0
    else:
        feature2_people = 0


    # --------------------------------------------------------
    # MULTI-MODAL PEOPLE ESTIMATE
    #
    # We use the larger value.
    #
    # Reason:
    # Feature 2 can miss people because of:
    # - occlusion
    # - water
    # - image quality
    # - small/distant people
    #
    # Therefore visual detection should NOT reduce
    # the number reported in an SOS.
    # --------------------------------------------------------

    effective_people = max(
        sos_people,
        feature2_people
    )


    people_score = 0


    if effective_people >= 1000:

        people_score = 30

    elif effective_people >= 500:

        people_score = 25

    elif effective_people >= 100:

        people_score = 20

    elif effective_people >= 50:

        people_score = 15

    elif effective_people >= 20:

        people_score = 10

    elif effective_people >= 5:

        people_score = 5

    elif effective_people >= 1:

        people_score = 2


    # ========================================================
    # 2. VULNERABILITY SCORE
    # ========================================================

    vulnerability_score = 0


    children = safe_int(
        people.get("children")
    )

    elderly = safe_int(
        people.get("elderly")
    )

    pregnant = safe_int(
        people.get("pregnant")
    )

    injured = safe_int(
        people.get("injured")
    )

    deceased = safe_int(
        people.get("deceased")
    )

    mobility = safe_int(
        people.get("mobility_impaired")
    )


    if (
        children > 0
        or mentioned(people.get("children"))
    ):
        vulnerability_score += 8


    if (
        elderly > 0
        or mentioned(people.get("elderly"))
    ):
        vulnerability_score += 7


    if (
        pregnant > 0
        or mentioned(people.get("pregnant"))
    ):
        vulnerability_score += 10


    if (
        injured > 0
        or mentioned(people.get("injured"))
    ):
        vulnerability_score += 15


    if (
        mobility > 0
        or mentioned(people.get("mobility_impaired"))
    ):
        vulnerability_score += 10


    # Existing deaths increase urgency
    if deceased > 0:
        vulnerability_score += 15


    # ========================================================
    # 3. IMMEDIATE NEEDS SCORE
    # ========================================================

    needs_score = 0


    if needs.get("rescue"):
        needs_score += 15


    if needs.get("medical_transfer"):
        needs_score += 20


    if needs.get("medicine"):
        needs_score += 8


    if needs.get("water"):
        needs_score += 8


    if needs.get("food"):
        needs_score += 6


    if needs.get("shelter"):
        needs_score += 5


    # ========================================================
    # 4. REQUEST TYPE
    # ========================================================

    request_score = 0


    request_type = str(
        request.get("type") or ""
    ).upper()


    if request_type == "MEDICAL":

        request_score += 15

    elif request_type == "RESCUE":

        request_score += 10

    elif request_type == "SUPPLIES":

        request_score += 5

    elif request_type == "SHELTER":

        request_score += 5


    # ========================================================
    # 5. FLOOD SEVERITY — FEATURE 1
    # ========================================================

    # Expected range: 0.0 - 1.0

    flood_severity = max(
        0.0,
        min(float(flood_severity), 1.0)
    )


    flood_score = round(
        flood_severity * 25
    )


    # ========================================================
    # 6. LOCATION AVAILABILITY
    # ========================================================

    location_score = 0


    if location.get("latitude") is not None:
        location_score += 3


    if location.get("longitude") is not None:
        location_score += 3


    if location.get("text"):
        location_score += 2


    # ========================================================
    # 7. FINAL SCORE
    # ========================================================

    total_score = (
        people_score
        + vulnerability_score
        + needs_score
        + request_score
        + flood_score
        + location_score
    )


    # ========================================================
    # 8. PRIORITY LEVEL
    # ========================================================

    if total_score >= 60:

        priority = "CRITICAL"

    elif total_score >= 40:

        priority = "HIGH"

    elif total_score >= 20:

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

            "vulnerability_score":
                vulnerability_score,

            "needs_score":
                needs_score,

            "request_score":
                request_score,

            "flood_score":
                flood_score,

            "location_score":
                location_score
        },


        # ----------------------------------------------------
        # IMPORTANT FOR DEBUGGING / DEMO
        # ----------------------------------------------------

        "inputs": {

            "sos_people":
                sos_people,

            "feature2_people":
                feature2_people_count,

            "effective_people":
                effective_people,

            "flood_severity":
                flood_severity
        },


        "recommended_actions":
            actions
    }