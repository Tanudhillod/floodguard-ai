"""
db_client.py
------------
Same as before, placed at backend/operations/db_client.py so it's
importable as `from backend.operations.db_client import supabase`,
matching your repo's existing import style
(e.g. `from backend.services.flood_risk import predict_flood_risk`).
"""

import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_FLOODGAURD_URL = os.environ.get("SUPABASE_FLOODGAURD_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_FLOODGAURD_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError(
        "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in your .env file."
    )

supabase: Client = create_client(SUPABASE_FLOODGAURD_URL, SUPABASE_SERVICE_ROLE_KEY)
