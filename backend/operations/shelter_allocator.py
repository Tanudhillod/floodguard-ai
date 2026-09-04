"""
shelter_allocator.py
---------------------
MODULE 7: Shelter Allocation

Fetches "people who have been rescued but not yet sheltered" (derived
from the EXISTING rescue_incidents / rescue_assignments tables — no
new ML, no invented completion-tracking system), fetches available
shelters, runs OR-Tools CP-SAT to decide the split, writes results
back, and updates shelter occupancy live.
"""

import math
from typing import List, Dict, Any, Optional

from ortools.sat.python import cp_model

from backend.operations.db_client import supabase

PRIORITY_WEIGHT = 1.0
TRAVEL_PENALTY_PER_KM = 0.02
SCALING_FACTOR = 1000


# ------------------------------------------------------------------
# STEP 1: FETCH LIVE DATA
# ------------------------------------------------------------------

def fetch_people_needing_shelter() -> List[Dict[str, Any]]:
    """
    A person "needs shelter" once they've been assigned to a rescue
    resource (Module 5) but haven't yet been placed in a shelter.

    people_rescued    = people_count - people_remaining   (from Module 5)
    people_needing_shelter = people_rescued - people_sheltered

    This is an explicit, documented assumption (see PART A in chat) —
    NOT a claim that Module 6 confirmed physical drop-off.
    """
    response = supabase.table("rescue_incidents").select("*").execute()
    incidents = response.data

    needing_shelter = []
    for inc in incidents:
        people_rescued = inc["people_count"] - inc["people_remaining"]
        remaining_need = people_rescued - inc.get("people_sheltered", 0)
        if remaining_need > 0:
            needing_shelter.append({
                "incident_id": inc["incident_id"],
                "people_remaining": remaining_need,   # reuse the same field name pattern as Module 5
                "priority_score": inc["priority_score"],
                "latitude": inc.get("latitude"),
                "longitude": inc.get("longitude"),
            })
    return needing_shelter


def fetch_available_shelters() -> List[Dict[str, Any]]:
    response = (
        supabase.table("shelters")
        .select("*")
        .eq("status", "OPEN")
        .gt("capacity_remaining", 0)
        .execute()
    )
    return response.data


# ------------------------------------------------------------------
# STEP 2: DISTANCE HELPER (same straight-line approach as Module 5)
# ------------------------------------------------------------------

def haversine_km(lat1, lon1, lat2, lon2) -> Optional[float]:
    if None in (lat1, lon1, lat2, lon2):
        return None
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


# ------------------------------------------------------------------
# STEP 3: BUILD AND SOLVE
# ------------------------------------------------------------------

def solve_shelter_allocation(groups: List[Dict[str, Any]], shelters: List[Dict[str, Any]]):
    """
    Decision variable:
        y[g][s] = number of people from group g placed in shelter s

    Constraints:
        1. y[g][s] >= 0
        2. sum_s y[g][s] <= people_remaining[g]      (can't place more than are waiting)
        3. sum_g y[g][s] <= capacity_remaining[s]     (can't exceed shelter capacity)

    Objective: same reasoning as Module 5 — prioritize higher-priority
    incidents' people getting settled first, use distance as a small
    tie-breaker only. This intentionally allows SPLITTING a group
    across multiple shelters (per your Section 10 example) since
    there's no constraint forcing y[g][s] to be all-or-nothing.
    """
    model = cp_model.CpModel()

    y = {}
    for g in groups:
        for s in shelters:
            max_possible = min(g["people_remaining"], s["capacity_remaining"])
            y[(g["incident_id"], s["shelter_id"])] = model.NewIntVar(
                0, max_possible, f"y_{g['incident_id']}_{s['shelter_id']}"
            )

    for g in groups:
        model.Add(
            sum(y[(g["incident_id"], s["shelter_id"])] for s in shelters)
            <= g["people_remaining"]
        )

    for s in shelters:
        model.Add(
            sum(y[(g["incident_id"], s["shelter_id"])] for g in groups)
            <= s["capacity_remaining"]
        )

    objective_terms = []
    for g in groups:
        for s in shelters:
            dist = haversine_km(g.get("latitude"), g.get("longitude"), s.get("latitude"), s.get("longitude"))
            penalty = (dist * TRAVEL_PENALTY_PER_KM) if dist is not None else 0.0
            coeff = (g["priority_score"] * PRIORITY_WEIGHT) - penalty
            scaled = int(round(coeff * SCALING_FACTOR))
            objective_terms.append(scaled * y[(g["incident_id"], s["shelter_id"])])

    model.Maximize(sum(objective_terms))

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 10.0
    status = solver.Solve(model)

    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        raise RuntimeError(f"OR-Tools could not find a solution (status={status})")

    assignments = []
    for g in groups:
        for s in shelters:
            people = solver.Value(y[(g["incident_id"], s["shelter_id"])])
            if people > 0:
                assignments.append({
                    "incident_id": g["incident_id"],
                    "shelter_id": s["shelter_id"],
                    "people_assigned": people,
                })
    return assignments


# ------------------------------------------------------------------
# STEP 4: WRITE RESULTS BACK
# ------------------------------------------------------------------

def write_shelter_assignments(assignments: List[Dict[str, Any]]):
    if not assignments:
        print("No shelter assignments to write — nobody currently needs shelter, or no capacity available.")
        return

    supabase.table("shelter_assignments").insert(assignments).execute()

    # Update people_sheltered on each affected incident
    per_incident: Dict[str, int] = {}
    for a in assignments:
        per_incident[a["incident_id"]] = per_incident.get(a["incident_id"], 0) + a["people_assigned"]

    for incident_id, placed_now in per_incident.items():
        current = (
            supabase.table("rescue_incidents")
            .select("people_sheltered")
            .eq("incident_id", incident_id)
            .single()
            .execute()
        )
        new_total = current.data["people_sheltered"] + placed_now
        supabase.table("rescue_incidents").update({"people_sheltered": new_total}).eq("incident_id", incident_id).execute()

    # Update capacity_remaining / current_occupancy / status on each shelter
    per_shelter: Dict[str, int] = {}
    for a in assignments:
        per_shelter[a["shelter_id"]] = per_shelter.get(a["shelter_id"], 0) + a["people_assigned"]

    for shelter_id, used_now in per_shelter.items():
        current = (
            supabase.table("shelters")
            .select("capacity_remaining, current_occupancy")
            .eq("shelter_id", shelter_id)
            .single()
            .execute()
        )
        capacity_after = max(0, current.data["capacity_remaining"] - used_now)
        occupancy_after = current.data["current_occupancy"] + used_now
        new_status = "FULL" if capacity_after == 0 else "OPEN"

        supabase.table("shelters").update({
            "capacity_remaining": capacity_after,
            "current_occupancy": occupancy_after,
            "status": new_status,
        }).eq("shelter_id", shelter_id).execute()

    print(f"Wrote {len(assignments)} shelter assignment(s) and updated shelter/incident status.")


# ------------------------------------------------------------------
# STEP 5: MAIN ENTRY POINT
# ------------------------------------------------------------------

def run_module7():
    groups = fetch_people_needing_shelter()
    shelters = fetch_available_shelters()

    if not groups:
        print("Nobody currently needs shelter (based on rescued-but-unsheltered counts). Nothing to do.")
        return []
    if not shelters:
        print("No open shelters with capacity right now.")
        return []

    print(f"Fetched {len(groups)} group(s) needing shelter and {len(shelters)} open shelter(s).")

    assignments = solve_shelter_allocation(groups, shelters)
    write_shelter_assignments(assignments)
    return assignments
