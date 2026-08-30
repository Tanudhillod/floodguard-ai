# FloodGuard AI

FloodGuard is an AI-powered emergency response system designed to help identify flood risks, analyze emergency SOS requests, detect people from drone imagery, and prioritize incidents for faster response.

## Features

- **Flood Risk Analysis** — ML-based flood risk prediction.
- **Drone Intelligence** — Detects people from drone imagery.
- **SOS Intelligence** — Uses Lyzr AI to extract structured information from emergency messages.
- **Multi-Modal Priority** — Combines SOS, drone, and flood-risk information to prioritize emergency incidents.
- **User SOS Interface** — Mobile-friendly interface for submitting emergency requests.
- **Administrator Command Center** — Monitor and manage emergency response operations.

## Tech Stack

**Frontend:** Next.js, React, TypeScript, Tailwind CSS  
**Backend:** FastAPI, Python  
**AI/ML:** Lyzr, Ultralytics YOLO, Scikit-learn/Joblib  
**Maps & Routing:** Leaflet, Google Maps, OSRM

## How to Run

### 1. Clone the repository

```bash
git clone <repository-url>
cd floodguard-ai
2. Backend

Create and activate a virtual environment:

python -m venv .venv
.venv\Scripts\activate

Install dependencies:

python -m pip install -r backend\requirements.txt

Create a .env file with the required API keys:

LYZR_API_KEY=your_lyzr_api_key
LYZR_AGENT_ID=your_lyzr_agent_id
LYZR_USER_ID=floodguard

Start the backend:

python -m uvicorn backend.main:app --reload

Backend:

http://127.0.0.1:8000
3. Frontend

Open a new terminal in the project folder:

npm install
npm run dev

Frontend:

http://localhost:3000
Application

Open:

http://localhost:3000

Choose:

User — Submit emergency SOS requests.
Administrator — Access the emergency response command center.

Note: Never commit .env files or API keys to the repository.

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.
