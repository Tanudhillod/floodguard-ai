import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# Load the drone Supabase configuration from backend/services/.env
env_path = Path(__file__).resolve().parent / "services" / ".env"
load_dotenv(dotenv_path=env_path)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY")

if not SUPABASE_URL or not SUPABASE_SECRET_KEY:
    raise ValueError(
        "Drone Supabase URL or secret key is missing from backend/services/.env"
    )

supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_SECRET_KEY
)

print("Supabase connection initialized successfully!")