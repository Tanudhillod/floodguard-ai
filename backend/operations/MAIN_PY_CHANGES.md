# Changes to make in backend/main.py

## 1. Add these imports (near your existing feature imports)

```python
from backend.operations.allocator import run_module5
from backend.operations.shelter_allocator import run_module7
from backend.operations.relief_planner import run_module8
from backend.operations.adapter import priority_result_to_incident_row
from backend.operations.db_client import supabase
```

## 2. Modify your EXISTING /priority endpoint

Find this:
```python
@app.post("/priority")
async def calculate_emergency_priority(
    request: PriorityRequest
):

    try:

        result = calculate_priority(
            sos_data=request.sos_data,
            feature2_people_count=(
                request.feature2_people_count
            ),
            flood_severity=request.flood_severity
        )

        return result

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Priority calculation failed: {str(e)}"
        )
```

Replace the `return result` line with this (everything else stays the same):

```python
        result = calculate_priority(
            sos_data=request.sos_data,
            feature2_people_count=(
                request.feature2_people_count
            ),
            flood_severity=request.flood_severity
        )

        # --- NEW: automatically log this as a rescue incident ---
        # Feature 4's output is unchanged -- we just also persist it
        # so Module 5 can act on it. If this fails, we still return
        # the original priority result (frontend behavior unaffected)
        # but log the failure so it's not silently lost.
        try:
            location_text = request.sos_data.get("location", {}).get("text")
            incident_row = priority_result_to_incident_row(
                result, location_text=location_text
            )
            supabase.table("rescue_incidents").upsert(incident_row).execute()
        except Exception as log_err:
            print(f"[WARN] Failed to save incident to rescue_incidents: {log_err}")

        return result
```

## 3. Add three new routes (anywhere after your existing routes)

```python
# ============================================================
# MODULE 5 / 7 / 8 — OPERATIONAL OPTIMIZATION
# ============================================================

@app.post("/api/module5/run")
async def trigger_module5():
    try:
        assignments = run_module5()
        return {"success": True, "assignments": assignments, "count": len(assignments)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Module 5 failed: {str(e)}")


@app.post("/api/module7/run")
async def trigger_module7():
    try:
        assignments = run_module7()
        return {"success": True, "assignments": assignments, "count": len(assignments)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Module 7 failed: {str(e)}")


@app.post("/api/module8/run")
async def trigger_module8():
    try:
        assessments = run_module8()
        return {"success": True, "assessments": assessments, "count": len(assessments)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Module 8 failed: {str(e)}")
```

## 4. Add SQL + Python dependencies

- Run `00_extend_incidents_schema.sql` (adds children/elderly/injured/
  mobility_impaired/flood_risk columns) plus all the Module 5/7/8
  schema SQL from earlier, in your Supabase project.
- Add to `backend/requirements.txt`:
  ```
  ortools>=9.10
  supabase>=2.7.0
  ```
  (`fastapi`, `python-dotenv` should already be there since main.py uses them.)
- Add to your `.env` (same file main.py already loads via `load_dotenv()`):
  ```
  SUPABASE_URL=https://your-project-ref.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
  ```

## 5. Restart your server and test

```bash
uvicorn backend.main:app --reload
```
Visit `http://localhost:8000/docs` — you should now see `/priority`,
`/flood-risk`, `/sos`, and the three new `/api/module5/run` etc.
routes all in the same app.

Test it: call `/priority` with your existing demo SOS payload, then
check Supabase Table Editor → `rescue_incidents` — a new row should
appear automatically. Then call `/api/module5/run` and confirm
`rescue_assignments` gets populated.
