"""
relief_planner.py
------------------
MODULE 8: Relief + Budget Planning

Reads live shelter population (from Module 7's work), computes what
basic-needs relief would cost, compares that against the REAL
remaining government budget (allocations minus actual expenses), and
records how much of each shelter's need could be funded.

No OR-Tools here — this is a straightforward accounting chain
(population -> quantity -> cost -> compare to budget), not a
combinatorial optimization problem. See the chat explanation for why.
"""

from typing import List, Dict, Any

from backend.operations.db_client import supabase

# ------------------------------------------------------------------
# PROTOTYPE_ASSUMPTIONS — placeholder per-person costs.
# These are NOT official government figures. Replace with verified
# numbers before using this for anything beyond a hackathon demo.
# ------------------------------------------------------------------
PROTOTYPE_ASSUMPTIONS = {
    "FOOD_PER_PERSON_PER_DAY": 100.00,
    "WATER_PER_PERSON_PER_DAY": 5.00,
    "MEDICINE_PER_PERSON_PER_DAY": 20.00,
    "HYGIENE_PER_PERSON_PER_DAY": 15.00,
    "BLANKET_PER_PERSON_ONE_TIME": 300.00,
}

PLANNING_DAYS = 7  # how many days of food/water/medicine/hygiene we plan for per run


# ------------------------------------------------------------------
# STEP 1: FETCH LIVE DATA
# ------------------------------------------------------------------

def fetch_sheltered_populations() -> List[Dict[str, Any]]:
    """
    Shelters with people currently in them. Sorted by population
    descending -- see PART B in chat for why this ordering was chosen,
    and how to change it.
    """
    response = (
        supabase.table("shelters")
        .select("shelter_id, name, current_occupancy")
        .gt("current_occupancy", 0)
        .execute()
    )
    shelters = response.data
    shelters.sort(key=lambda s: s["current_occupancy"], reverse=True)
    return shelters


def fetch_remaining_budget() -> float:
    """
    Remaining budget = sum(all budget allocations) - sum(all expenses).
    Always computed live from the actual rows, never cached, so it
    can't silently drift from reality.
    """
    budgets_resp = supabase.table("budgets").select("total_allocated").execute()
    total_allocated = sum(float(b["total_allocated"]) for b in budgets_resp.data)

    expenses_resp = supabase.table("expenses").select("amount").execute()
    total_spent = sum(float(e["amount"]) for e in expenses_resp.data)

    return total_allocated - total_spent


# ------------------------------------------------------------------
# STEP 2: COMPUTE REQUIREMENT FOR ONE SHELTER
# ------------------------------------------------------------------

def compute_shelter_requirement(population: int) -> Dict[str, float]:
    a = PROTOTYPE_ASSUMPTIONS
    food_cost = population * a["FOOD_PER_PERSON_PER_DAY"] * PLANNING_DAYS
    water_cost = population * a["WATER_PER_PERSON_PER_DAY"] * PLANNING_DAYS
    medicine_cost = population * a["MEDICINE_PER_PERSON_PER_DAY"] * PLANNING_DAYS
    hygiene_cost = population * a["HYGIENE_PER_PERSON_PER_DAY"] * PLANNING_DAYS
    blanket_cost = population * a["BLANKET_PER_PERSON_ONE_TIME"]  # one-time, not multiplied by days

    total = food_cost + water_cost + medicine_cost + hygiene_cost + blanket_cost

    return {
        "food_cost": round(food_cost, 2),
        "water_cost": round(water_cost, 2),
        "medicine_cost": round(medicine_cost, 2),
        "hygiene_cost": round(hygiene_cost, 2),
        "blanket_cost": round(blanket_cost, 2),
        "total_required_cost": round(total, 2),
    }


# ------------------------------------------------------------------
# STEP 3: ALLOCATE BUDGET ACROSS SHELTERS (greedy, priority-ordered)
# ------------------------------------------------------------------

def allocate_budget(shelters: List[Dict[str, Any]], remaining_budget: float) -> List[Dict[str, Any]]:
    """
    Walks shelters in priority order (largest population first).
    For each shelter:
      - if remaining budget covers the full requirement -> FULLY_COVERED
      - if it covers part of it -> PARTIALLY_COVERED
      - if there's nothing left -> SHORTAGE (0 funded)

    This is intentionally simple sequential accounting, not an
    optimizer -- see PART B for why that's the right tool here.
    """
    assessments = []
    budget_left = remaining_budget

    for shelter in shelters:
        population = shelter["current_occupancy"]
        req = compute_shelter_requirement(population)
        required = req["total_required_cost"]

        if budget_left <= 0:
            funded = 0.0
            status = "SHORTAGE"
        elif budget_left >= required:
            funded = required
            status = "FULLY_COVERED"
        else:
            funded = round(budget_left, 2)
            status = "PARTIALLY_COVERED"

        budget_left = round(budget_left - funded, 2)

        assessments.append({
            "shelter_id": shelter["shelter_id"],
            "shelter_name": shelter["name"],
            "population": population,
            **req,
            "amount_funded": funded,
            "status": status,
        })

    return assessments


# ------------------------------------------------------------------
# STEP 4: WRITE RESULTS BACK (assessments + actual expense records)
# ------------------------------------------------------------------

def write_relief_results(assessments: List[Dict[str, Any]]):
    if not assessments:
        print("No shelters with population to assess.")
        return

    # Write one assessment row per shelter (audit trail)
    assessment_rows = [{
        "shelter_id": a["shelter_id"],
        "population": a["population"],
        "food_cost": a["food_cost"],
        "water_cost": a["water_cost"],
        "medicine_cost": a["medicine_cost"],
        "hygiene_cost": a["hygiene_cost"],
        "blanket_cost": a["blanket_cost"],
        "total_required_cost": a["total_required_cost"],
        "amount_funded": a["amount_funded"],
        "status": a["status"],
    } for a in assessments]

    supabase.table("relief_assessments").insert(assessment_rows).execute()

    # Record actual expenses for whatever was funded (proportionally
    # across categories, so the expense ledger stays consistent with
    # what was actually "spent" this run).
    expense_rows = []
    for a in assessments:
        if a["amount_funded"] <= 0:
            continue
        ratio = a["amount_funded"] / a["total_required_cost"] if a["total_required_cost"] > 0 else 0
        for category, cost_key in [
            ("FOOD", "food_cost"), ("WATER", "water_cost"), ("MEDICINE", "medicine_cost"),
            ("HYGIENE", "hygiene_cost"), ("BLANKETS", "blanket_cost"),
        ]:
            spent_on_category = round(a[cost_key] * ratio, 2)
            if spent_on_category > 0:
                expense_rows.append({
                    "shelter_id": a["shelter_id"],
                    "category": category,
                    "amount": spent_on_category,
                    "description": f"Module 8 relief planning run ({a['status']})",
                })

    if expense_rows:
        supabase.table("expenses").insert(expense_rows).execute()

    print(f"Wrote {len(assessment_rows)} relief assessment(s) and {len(expense_rows)} expense record(s).")


# ------------------------------------------------------------------
# STEP 5: MAIN ENTRY POINT
# ------------------------------------------------------------------

def run_module8():
    shelters = fetch_sheltered_populations()
    if not shelters:
        print("No shelters currently have any population. Nothing to plan for.")
        return []

    remaining_budget = fetch_remaining_budget()
    print(f"Remaining government budget: Rs. {remaining_budget:,.2f}")
    print(f"Planning for {len(shelters)} shelter(s) with population, over {PLANNING_DAYS} days.")

    assessments = allocate_budget(shelters, remaining_budget)
    write_relief_results(assessments)
    return assessments
