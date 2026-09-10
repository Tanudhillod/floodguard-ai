# FloodGuard AI

**Every flood tells a thousand stories in seconds. FloodGuard listens to all of them, and answers the one that can't wait.**

## Problem

During floods, emergency teams must interpret incomplete SOS messages, locate people, assess risk, and coordinate limited resources under time pressure. Unstructured information slows every decision.

## Solution

FloodGuard combines AI-powered SOS extraction, flood-risk prediction, drone detection, geospatial routing, shelter recommendations, and operational allocation in one emergency response platform.

## Why FloodGuard Is Different

FloodGuard connects the complete response chain. A natural-language SOS becomes validated emergency data, a mapped incident, a priority score, and an input to rescue allocation. That record can also be enriched with drone observations and flood severity instead of remaining an isolated text message.

## Key Features

- **Field Hardware:** Flood sensors provide readings such as water level, rainfall, soil moisture, and related conditions to support flood-risk prediction. Mesh hopping helps relay this field data when direct connectivity is unreliable.
- **Flood Risk Analysis:** Predicts risk from water level, rainfall, soil moisture, elevation, and rate of change.
- **SOS Intelligence:** Extracts location, people, vulnerabilities, situation, needs, and requested resources.
- **Drone Intelligence:** Detects people in uploaded flood imagery and stores annotated results.
- **Multi-Modal Priority:** Combines SOS, drone, and flood information to rank incidents.
- **Safe Route Planning:** Finds available shelters and compares driving routes, distance, and ETA.
- **Operations:** Supports rescue-resource allocation, shelter allocation, and relief planning.

## How It Works

```text
SENSE       Field sensors and mesh hopping reveal changing flood conditions while users submit SOS messages from affected locations

UNDERSTAND  FloodGuard predicts flood risk and Lyzr converts each SOS message into structured, actionable information

OBSERVE     Drone intelligence detects people and adds field evidence from uploaded flood imagery

DECIDE      SOS, flood, drone, vulnerability, and location data are combined to rank incidents and identify the best response

GUIDE       Safe-route planning compares available shelters, driving distance, and ETA for evacuation decisions

ACT         Rescue resources, shelter capacity, and relief operations are allocated through the command center
```

## Tech Stack & Integrations

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS, Leaflet, Recharts
- **Backend:** FastAPI, Python, Uvicorn, Pydantic
- **AI/ML:** Lyzr AI, Google Gemini, Ultralytics YOLO, scikit-learn, Joblib
- **Data:** Supabase and local SOS JSON persistence
- **Maps:** Google Maps Platform, OSRM, and OpenStreetMap tiles
- **Optimization:** OR-Tools
- **Lyzr AI:** Powers SOS extraction in `backend/services/sos_extractor.py`; validated results feed geocoding, priority calculation, incident persistence, and rescue allocation.
- **Google Gemini:** The safe-route workflow calls Gemini's `generateContent` API to recommend a shelter using route distance and ETA data, with deterministic scoring as a fallback.
- **Render:** Used to deploy and host the FloodGuard frontend and backend services.
- **Swytchcode:** Project integration configuration is represented by `SWYTCHCODE_PATH` in `backend/main.py` and exposed through `/health`; the repository also includes the Swytchcode integration contract in `.github/copilot-instructions.md`.

## Lyzr AI Integration

FloodGuard uses **Lyzr AI** as the intelligence layer for transforming unstructured emergency messages into actionable rescue data.

When a user submits an SOS message, the Lyzr agent analyzes it and extracts:

- Location and coordinates
- Total people requiring assistance
- Children, elderly, pregnant, injured, missing, and deceased people
- Emergency situation and severity indicators
- Required resources such as food, water, medicine, shelter, and rescue
- Medical-transfer requirements
- Contact information

The extracted response is validated through a strict structured schema before entering the rescue workflow. This prevents the rest of the system from depending on unreliable free-form AI output.

### Lyzr-Powered Emergency Workflow

```text
User SOS message
	|
	v
Lyzr AI agent
	|
	v
Structured emergency extraction
	|
	v
Schema validation
	|
	v
Location resolution and geocoding
	|
	v
Priority calculation
	|
	v
Incident creation in Supabase
	|
	v
Rescue-resource allocation
```

If coordinates are missing, FloodGuard resolves the extracted location through Google Geocoding and Places APIs. Validated Lyzr data is combined with flood risk, drone detections, vulnerabilities, and resource needs to calculate priority, create an incident, and trigger allocation. Each SOS uses an isolated session, with responses parsed and normalized before entering the rescue workflow.

## Prerequisites

- Node.js and npm
- Python 3.11 or newer
- Lyzr, Gemini, Google Maps, Supabase, and ThingSpeak credentials as required
- Configured Supabase tables and storage for operational modules

## How to Run

Run backend commands from the project root because `backend.main` imports the `backend` package.

### 1. Clone the repository

```bash
git clone <repository-url>
cd floodguard-ai
```

### 2. Start the backend

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn backend.main:app --reload
```

The backend runs at `http://127.0.0.1:8000`.

### 3. Start the frontend

Open a second terminal in the project root:

```powershell
npm install
npm run dev
```

The frontend runs at `http://localhost:3000`.

## Environment Variables

Create both environment files below. They are loaded by different backend modules.

### 1. `backend/services/.env`

Used by Lyzr SOS extraction and the drone Supabase client:

```text
LYZR_API_KEY
LYZR_AGENT_ID
LYZR_USER_ID
SUPABASE_URL
SUPABASE_SECRET_KEY
```

### 2. Project-root `.env`

Used by the main API and rescue, shelter, and relief operations:

```text
SUPABASE_FLOODGAURD_URL
SUPABASE_SERVICE_ROLE_KEY
GOOGLE_MAPS_API_KEY
GEMINI_API_KEY
GEMINI_MODEL
SWYTCHCODE_PATH
THINGSPEAK_CHANNEL_ID
THINGSPEAK_READ_API_KEY
NEXT_PUBLIC_FLOODGAURD_API_URL
NEXT_PUBLIC_API_URL
```

Never commit environment files or credentials.

## API Overview

```text
GET  /health                         Service status
POST /predict                        Drone image prediction
POST /flood-risk                     Flood-risk prediction
POST /sos                            SOS extraction and incident creation
POST /priority                       Emergency priority calculation
GET  /priority-dashboard              Ranked multi-modal emergencies
GET  /shelters                        Available shelters
GET  /safe-route                      Route and shelter recommendation
POST /api/module5/run                 Rescue allocation
POST /api/module7/run                 Shelter allocation
POST /api/module8/run                 Relief planning
GET  /api/rescue-resources            Live rescue data
GET  /api/shelters-live               Live shelter data
GET  /api/relief-status               Relief status and budgets
GET  /api/thingspeak/sensor-data      Sensor feed data
```

## Project Structure

```text
app/                 Next.js routes and pages
components/          Command-center and operations UI
lib/                 Frontend API helpers and shared data
backend/main.py      FastAPI app and core workflows
backend/services/    AI extraction, detection, risk, and priority
backend/operations/  Rescue, shelter, and relief operations
public/               Static assets
```

## Available Scripts

```powershell
npm run dev
npm run build
npm run start
```

## Future Improvements

- Add richer real-time sensor ingestion and notifications.
- Expand route-aware rescue dispatch and operational analytics.
- Add automated integration tests for the end-to-end SOS workflow.

## Contributing

Keep changes focused, preserve existing API contracts, and verify both frontend and backend workflows before opening a pull request.
