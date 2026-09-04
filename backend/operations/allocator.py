"""
allocator.py
------------
MODULE 5: Rescue Resource Allocation

This is the core optimization logic. It:
  1. Fetches active incidents and available resources from Supabase.
  2. Builds an assignment problem and solves it with OR-Tools CP-SAT.
  3. Writes the resulting assignments back to Supabase.
  4. Updates resource / incident status to reflect the new state.

No ML model is trained or used here. This is pure optimization
(integer programming) over live database data.
"""

import math
from typing import List, Dict, Any, Optional

from ortools.sat.python import cp_model

from backend.operations.db_client import supabase

# ------------------------------------------------------------------
# Tunable weights for the objective function.
# See the explanation below the code for why these were chosen.
# ------------------------------------------------------------------
PEOPLE_PRIORITY_WEIGHT = 1.0     # weight per (priority_score * person rescued)
TRAVEL_PENALTY_PER_KM = 0.02     # small penalty per km, acts as a tie-breaker only
SCALING_FACTOR = 1000            # CP-SAT needs integer coefficients; we scale floats up


# ------------------------------------------------------------------
# STEP 1: FETCH LIVE DATA FROM SUPABASE
# ------------------------------------------------------------------

def fetch_active_incidents() -> List[Dict[str, Any]]:
    """
    Get all incidents that still need rescue (not fully assigned).
    """
    response = (
        supabase.table("rescue_incidents")
        .select("*")
        .in_("status", ["WAITING_FOR_RESCUE", "PARTIALLY_ASSIGNED"])
        .gt("people_remaining", 0)
        .execute()
    )
    return response.data


def fetch_available_resources() -> List[Dict[str, Any]]:
    """
    Get all resources that still have unused capacity and are not offline.
    """
    response = (
        supabase.table("rescue_resources")
        .select("*")
        .neq("status", "OFFLINE")
        .gt("capacity_remaining", 0)
        .execute()
    )
    return response.data


# ------------------------------------------------------------------
# STEP 2: DISTANCE HELPER (simple straight-line distance, NOT routing)
# ------------------------------------------------------------------

def haversine_km(lat1, lon1, lat2, lon2) -> Optional[float]:
    """
    Straight-line ("as the crow flies") distance between two points
    in kilometers. This is a rough proxy for travel burden — it is
    NOT real routing. Actual road/water routing belongs to Module 6.

    Returns None if any coordinate is missing, so we never invent
    a distance from unknown data.
    """
    if None in (lat1, lon1, lat2, lon2):
        return None
    R = 6371.0  # Earth radius in km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


# ------------------------------------------------------------------
# STEP 3: BUILD AND SOLVE THE OPTIMIZATION MODEL
# ------------------------------------------------------------------

def solve_allocation(incidents: List[Dict[str, Any]], resources: List[Dict[str, Any]]):
    """
    Decision variable:
        x[i][j] = number of people assigned from incident i to resource j

    Constraints:
        1. x[i][j] >= 0                                  (no negative people)
        2. sum_j x[i][j] <= people_remaining[i]           (can't over-assign an incident)
        3. sum_i x[i][j] <= capacity_remaining[j]         (can't exceed resource capacity)

    Objective:
        maximize   sum_i sum_j ( priority_score[i] * PEOPLE_PRIORITY_WEIGHT
                                  - distance_km(i,j) * TRAVEL_PENALTY_PER_KM ) * x[i][j]

    Why this objective:
        - Multiplying by priority_score means rescuing one person from a
          CRITICAL incident is worth more than rescuing one person from a
          LOW priority incident — so the solver prefers to fully cover
          high-priority incidents before spending capacity on low-priority ones.
        - The distance penalty is deliberately small. It should only break
          ties between resources that are otherwise equally good — it must
          NOT be strong enough to override priority (that's why the weight
          is 0.02/km, not 1.0/km). If a resource's location is unknown, the
          penalty is simply 0 for that pair, since we don't invent distances.
        - This is ONE reasonable formulation, not the only one. E.g., you
          could instead maximize (min priority level fully covered), or add
          a hard constraint that CRITICAL incidents must be attempted first.
          We chose a single linear objective because it's simple to explain,
          easy to tune, and works well for a hackathon demo.
    """
    model = cp_model.CpModel()

    x = {}
    for i in incidents:
        for j in resources:
            max_possible = min(i["people_remaining"], j["capacity_remaining"])
            x[(i["incident_id"], j["resource_id"])] = model.NewIntVar(
                0, max_possible, f"x_{i['incident_id']}_{j['resource_id']}"
            )

    # Constraint: don't assign more people to an incident than remain
    for i in incidents:
        model.Add(
            sum(x[(i["incident_id"], j["resource_id"])] for j in resources)
            <= i["people_remaining"]
        )

    # Constraint: don't exceed a resource's remaining capacity
    for j in resources:
        model.Add(
            sum(x[(i["incident_id"], j["resource_id"])] for i in incidents)
            <= j["capacity_remaining"]
        )

    # Objective
    objective_terms = []
    for i in incidents:
        for j in resources:
            dist = haversine_km(
                i.get("latitude"), i.get("longitude"),
                j.get("latitude"), j.get("longitude"),
            )
            distance_penalty = (dist * TRAVEL_PENALTY_PER_KM) if dist is not None else 0.0
            coefficient = (i["priority_score"] * PEOPLE_PRIORITY_WEIGHT) - distance_penalty
            scaled_coefficient = int(round(coefficient * SCALING_FACTOR))
            objective_terms.append(scaled_coefficient * x[(i["incident_id"], j["resource_id"])])

    model.Maximize(sum(objective_terms))

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 10.0
    status = solver.Solve(model)

    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        raise RuntimeError(f"OR-Tools could not find a solution (status={status})")

    assignments = []
    for i in incidents:
        for j in resources:
            people = solver.Value(x[(i["incident_id"], j["resource_id"])])
            if people > 0:
                assignments.append({
                    "incident_id": i["incident_id"],
                    "resource_id": j["resource_id"],
                    "people_assigned": people,
                })

    return assignments


# ------------------------------------------------------------------
# STEP 4: WRITE RESULTS BACK TO SUPABASE
# ------------------------------------------------------------------

def write_assignments_and_update_status(assignments: List[Dict[str, Any]]):
    """
    Writes each assignment as a row in rescue_assignments, then updates
    the remaining capacity/people count on the affected resources and
    incidents. Also flips status fields (AVAILABLE -> BUSY, etc.)

    NOTE ON CONSISTENCY (see explanation below):
    This does read-then-write updates. For a hackathon this is an
    acceptable trade-off, but it is NOT safe against two allocator
    runs happening at the exact same moment. See notes below the code.
    """
    if not assignments:
        print("No assignments to write — nothing to rescue right now, or no capacity available.")
        return

    # 1. Insert assignment rows
    supabase.table("rescue_assignments").insert(assignments).execute()

    # 2. Update each affected incident's people_remaining/status
    incident_totals: Dict[str, int] = {}
    for a in assignments:
        incident_totals[a["incident_id"]] = incident_totals.get(a["incident_id"], 0) + a["people_assigned"]

    for incident_id, assigned_now in incident_totals.items():
        current = (
            supabase.table("rescue_incidents")
            .select("people_remaining")
            .eq("incident_id", incident_id)
            .single()
            .execute()
        )
        remaining_before = current.data["people_remaining"]
        remaining_after = max(0, remaining_before - assigned_now)
        new_status = "FULLY_ASSIGNED" if remaining_after == 0 else "PARTIALLY_ASSIGNED"

        supabase.table("rescue_incidents").update({
            "people_remaining": remaining_after,
            "status": new_status,
        }).eq("incident_id", incident_id).execute()

    # 3. Update each affected resource's capacity_remaining/status
    resource_totals: Dict[str, int] = {}
    for a in assignments:
        resource_totals[a["resource_id"]] = resource_totals.get(a["resource_id"], 0) + a["people_assigned"]

    for resource_id, used_now in resource_totals.items():
        current = (
            supabase.table("rescue_resources")
            .select("capacity_remaining")
            .eq("resource_id", resource_id)
            .single()
            .execute()
        )
        capacity_before = current.data["capacity_remaining"]
        capacity_after = max(0, capacity_before - used_now)
        new_status = "BUSY" if capacity_after == 0 else "AVAILABLE"

        supabase.table("rescue_resources").update({
            "capacity_remaining": capacity_after,
            "status": new_status,
        }).eq("resource_id", resource_id).execute()

    print(f"Wrote {len(assignments)} assignment(s) and updated resource/incident status.")


# ------------------------------------------------------------------
# STEP 5: MAIN ENTRY POINT
# ------------------------------------------------------------------

def run_module5():
    incidents = fetch_active_incidents()
    resources = fetch_available_resources()

    if not incidents:
        print("No active incidents waiting for rescue. Nothing to do.")
        return []
    if not resources:
        print("No available resources right now. Nothing can be assigned.")
        return []

    print(f"Fetched {len(incidents)} active incident(s) and {len(resources)} available resource(s).")

    assignments = solve_allocation(incidents, resources)
    write_assignments_and_update_status(assignments)
    return assignments
