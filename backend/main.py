from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

import cv2
import numpy as np
import json
import os
import subprocess
import math
import time
import urllib.request
import urllib.error
import urllib.parse

from dotenv import load_dotenv

from backend.services.detector import DroneDetector
from pydantic import BaseModel
from typing import Optional, Dict, Any

from backend.services.flood_risk import predict_flood_risk
from backend.services.sos_extractor import extract_sos_llm
from backend.services.priority import calculate_priority

# ============================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================

load_dotenv()


# ============================================================
# CONFIGURATION
# ============================================================

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

SWY_PATH = os.getenv(
    "SWYTCHCODE_PATH",
    r"C:\Users\Admin\AppData\Roaming\npm\swy.cmd"
)

GEMINI_MODEL = os.getenv(
    "GEMINI_MODEL",
    "gemini-2.5-flash"
)


# ============================================================
# CREATE FASTAPI APP
# ============================================================

app = FastAPI(
    title="FloodGuard Emergency Response API",
    description=(
        "FloodGuard API for drone detection, emergency "
        "shelter discovery, safe routing and AI recommendation."
    ),
    version="2.1.0"
)
Base.metadata.create_all(bind=engine)
# ============================================================
# FEATURE 1 / 3 / 4 REQUEST MODELS
# ============================================================

class FloodRiskRequest(BaseModel):
    water_level_cm: float
    water_level_rate_cm_per_min: float
    rainfall_mm_per_hr: float
    soil_moisture_pct: float
    elevation_m: float


class SOSRequest(BaseModel):
    message: str


class PriorityRequest(BaseModel):
    sos_data: Dict[str, Any]
    feature2_people_count: Optional[int] = None
    flood_severity: float = 0.0

# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
   allow_origins=[
    "http://localhost:3000",
    "http://127.0.0.1:3000",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# LOAD DRONE MODEL
# ============================================================

MODEL_PATH = "backend/models/floodguard_person_v2.pt"

detector = DroneDetector(
    model_path=MODEL_PATH,
    tile_size=512,
    overlap=0.25,
    conf_threshold=0.10,
    nms_iou=0.45
)


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "message": "FloodGuard Emergency Response API is running",
        "status": "healthy",
        "version": "2.1.0"
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "drone_model": "floodguard_person_v2.pt",
        "google_maps_configured": bool(GOOGLE_MAPS_API_KEY),
        "gemini_configured": bool(GEMINI_API_KEY),
        "swytchcode_path": SWY_PATH
    }


# ============================================================
# DRONE PREDICTION
# ============================================================

@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    location: Optional[str] = Form(None)
):

    # --------------------------------------------------------
    # Validate image
    # --------------------------------------------------------

    if not file.content_type or not file.content_type.startswith(
        "image/"
    ):
        raise HTTPException(
            status_code=400,
            detail="Please upload a valid image file."
        )

    image_bytes = await file.read()

    if not image_bytes:
        raise HTTPException(
            status_code=400,
            detail="Uploaded image is empty."
        )

    image_array = np.frombuffer(
        image_bytes,
        np.uint8
    )

    image = cv2.imdecode(
        image_array,
        cv2.IMREAD_COLOR
    )

    if image is None:
        raise HTTPException(
            status_code=400,
            detail="Could not process the uploaded image."
        )

    # --------------------------------------------------------
    # Run AI detection
    # --------------------------------------------------------

    try:

        detections, annotated_image = detector.predict(
            image
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Detection failed: {str(e)}"
        )

    # --------------------------------------------------------
    # Format detections
    # --------------------------------------------------------

    formatted_detections = []

    for detection in detections:

        x1, y1, x2, y2, confidence = detection

        formatted_detections.append({

            "x1": round(x1, 2),

            "y1": round(y1, 2),

            "x2": round(x2, 2),

            "y2": round(y2, 2),

            "confidence": round(
                confidence,
                4
            )
        })

    # --------------------------------------------------------
    # Calculate detection statistics
    # --------------------------------------------------------

    people_detected = len(
        formatted_detections
    )

    if people_detected > 0:

        average_confidence = (
            sum(
                detection["confidence"]
                for detection
                in formatted_detections
            )
            /
            people_detected
        )

    else:

        average_confidence = 0.0

    # --------------------------------------------------------
    # Upload original image to Supabase Storage
    # --------------------------------------------------------

    try:

        original_filename = (
            file.filename
            or
            "drone_image.jpg"
        )

        # Prevent directory traversal
        safe_filename = os.path.basename(
            original_filename
        )

        # Make filename unique
        timestamp = int(time.time() * 1000)

        image_path = (
            f"detections/"
            f"{timestamp}_"
            f"{safe_filename}"
        )

        supabase.storage.from_(
            "drone-images"
        ).upload(
            image_path,
            image_bytes,
            {
                "content-type":
                    file.content_type
                    or
                    "image/jpeg"
            }
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=(
                f"Image upload to Supabase failed: "
                f"{str(e)}"
            )
        )

    # --------------------------------------------------------
    # Encode annotated image for existing frontend
    # --------------------------------------------------------

    success, encoded_image = cv2.imencode(
        ".jpg",
        annotated_image
    )

    if not success:

        raise HTTPException(
            status_code=500,
            detail="Could not encode annotated image."
        )

    # --------------------------------------------------------
    # Upload processed/annotated image to Supabase
    # --------------------------------------------------------

    try:

        processed_image_path = (
            f"detections/processed_"
            f"{timestamp}_"
            f"{safe_filename}"
        )

        supabase.storage.from_(
            "drone-images"
        ).upload(
            processed_image_path,
            encoded_image.tobytes(),
            {
                "content-type":
                    "image/jpeg"
            }
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=(
                f"Processed image upload to Supabase failed: "
                f"{str(e)}"
            )
        )

    # --------------------------------------------------------
    # Save detection information to Supabase
    # --------------------------------------------------------

    try:

        detection_record = {

            "image_path":
                processed_image_path,

            "location":
                location,

            "latitude":
                latitude,

            "longitude":
                longitude,

            # Current detector does not calculate
            # analysis duration.
            "time_span":
                None,

            "people_detected":
                people_detected,

            # Current person detector does not
            # calculate flooded area.
            "flood_area":
                None,

            # Do not use HIGH based only on
            # people detection.
            "severity":
                None,

            "confidence":
                round(
                    average_confidence,
                    4
                ),

            "model_name":
                "floodguard_person_v2.pt",

            "analysis_status":
                "COMPLETED"
        }

        db_response = (
            supabase
            .table("drone_detections")
            .insert(
                detection_record
            )
            .execute()
        )

    except Exception as e:

        # ----------------------------------------------------
        # If DB insert fails, remove the uploaded image
        # so we don't leave an orphaned Storage object.
        # ----------------------------------------------------

        try:

            supabase.storage.from_(
                "drone-images"
            ).remove([
                image_path,
                processed_image_path
            ])

        except Exception:

            pass

        raise HTTPException(
            status_code=500,
            detail=(
                f"Detection data could not be saved "
                f"to Supabase: {str(e)}"
            )
        )

    # --------------------------------------------------------
    # Existing frontend metadata
    # --------------------------------------------------------

    metadata = {

        "success":
            True,

        "filename":
            file.filename,

        "people_count":
            people_detected,

        "detections":
            formatted_detections,

        # New Supabase-related information
        "latitude":
            latitude,

        "longitude":
            longitude,

        "location":
            location,

        "image_path":
            processed_image_path,

        "confidence":
            round(
                average_confidence,
                4
            ),

        "model_name":
            "floodguard_person_v2.pt",

        "analysis_status":
            "COMPLETED"
    }

    metadata_json = json.dumps(
        metadata
    )

    # --------------------------------------------------------
    # Keep existing multipart/mixed response
    # --------------------------------------------------------

    boundary = "FloodGuardBoundary"

    body = (

        f"--{boundary}\r\n"

        f"Content-Type: application/json\r\n"

        f"Content-Disposition: "
        f"form-data; name=\"metadata\"\r\n"

        f"\r\n"

        f"{metadata_json}\r\n"

        f"--{boundary}\r\n"

        f"Content-Type: image/jpeg\r\n"

        f"Content-Disposition: inline; "
        f"name=\"image\"; filename=\"result.jpg\"\r\n"

        f"\r\n"

    ).encode("utf-8")

    body += encoded_image.tobytes()

    body += (
        f"\r\n--{boundary}--\r\n"
    ).encode("utf-8")

    return Response(
        content=body,
        media_type=(
            f"multipart/mixed; "
            f"boundary={boundary}"
        )
    )
# ============================================================
# FEATURE 1 — FLOOD RISK
# ============================================================

@app.post("/flood-risk")
async def flood_risk(request: FloodRiskRequest):

    try:

        result = predict_flood_risk(
            water_level_cm=request.water_level_cm,
            water_level_rate_cm_per_min=(
                request.water_level_rate_cm_per_min
            ),
            rainfall_mm_per_hr=request.rainfall_mm_per_hr,
            soil_moisture_pct=request.soil_moisture_pct,
            elevation_m=request.elevation_m
        )

        risk_to_severity = {
            "LOW": 0.25,
            "MEDIUM": 0.50,
            "HIGH": 0.75,
            "CRITICAL": 1.00
        }

        result["flood_severity"] = risk_to_severity.get(
            result["risk_label"],
            0.0
        )

        return result

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Flood risk prediction failed: {str(e)}"
        )
    
    # ============================================================
# FEATURE 3 — SOS INTELLIGENCE
# ============================================================

@app.post("/sos")
async def analyze_sos(
    request: SOSRequest,
    db: Session = Depends(get_db)
):

    try:

        # ========================================================
        # FEATURE 3 — SOS INTELLIGENCE
        # ========================================================

        result = extract_sos_llm(
            request.message
        )


        # ========================================================
        # FEATURE 4 — PRIORITY INTELLIGENCE
        # ========================================================

        priority_result = calculate_priority(
            sos_data=result,
            feature2_people_count=None,
            flood_severity=0.0
        )


        # Add Feature 4 result to the extracted data
        result["priority"] = priority_result


        # ========================================================
        # SAVE SOS TO DATABASE
        # ========================================================

        sos_record = SOSRequestModel(
            original_message=request.message,
            extracted_data=json.dumps(result),
            status="Pending"
        )

        db.add(sos_record)
        db.commit()
        db.refresh(sos_record)


        # ========================================================
        # RETURN RESULT
        # ========================================================

        return {
            "id": sos_record.id,
            "created_at": sos_record.created_at,
            "status": sos_record.status,
            "original_message": sos_record.original_message,
            "extracted_data": result
        }


    except ValueError as e:

        db.rollback()

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"SOS analysis failed: {str(e)}"
        )


# ============================================================
# GET STORED SOS REQUESTS
# ============================================================

@app.get("/sos")
def get_sos_requests(
    db: Session = Depends(get_db)
):

    requests = (
        db.query(SOSRequestModel)
        .order_by(
            SOSRequestModel.created_at.desc()
        )
        .all()
    )

    result = []

    for request in requests:

        try:
            extracted_data = json.loads(
                request.extracted_data
            )
        except Exception:
            extracted_data = {}

        result.append({
            "id": request.id,
            "created_at": request.created_at,
            "status": request.status,
            "original_message": request.original_message,
            "extracted_data": extracted_data
        })

    return {
        "requests": result
    }
    
    # ============================================================
# FEATURE 4 — MULTI-MODAL PRIORITY
# ============================================================

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

# ============================================================
# DISTANCE HELPER
# ============================================================

def calculate_distance_km(
    lat1: float,
    lon1: float,
    lat2: float,
    lon2: float
):
    """
    Calculate straight-line distance using Haversine formula.
    """

    earth_radius_km = 6371.0

    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)

    delta_lat = math.radians(
        lat2 - lat1
    )

    delta_lon = math.radians(
        lon2 - lon1
    )

    a = (
        math.sin(delta_lat / 2) ** 2
        +
        math.cos(lat1_rad)
        *
        math.cos(lat2_rad)
        *
        math.sin(delta_lon / 2) ** 2
    )

    c = 2 * math.atan2(
        math.sqrt(a),
        math.sqrt(1 - a)
    )

    return earth_radius_km * c


# ============================================================
# EXTRACT JSON FROM SWYTCHCODE OUTPUT
# ============================================================

def _extract_json_object(text):

    if not text:
        return None

    text = text.strip()

    start = text.find("{")

    if start == -1:
        return None

    end = text.rfind("}")

    if end == -1:
        return None

    try:
        return json.loads(
            text[start:end + 1]
        )

    except json.JSONDecodeError:
        return None


# ============================================================
# FIND SHELTERS THROUGH SWYTCHCODE
# ============================================================

def _find_shelters_with_swytchcode(
    latitude: float,
    longitude: float
):

    if not GOOGLE_MAPS_API_KEY:

        raise HTTPException(
            status_code=500,
            detail=(
                "GOOGLE_MAPS_API_KEY is not configured. "
                "Check your .env file and restart FastAPI."
            )
        )

    query = (
        f"emergency shelters near "
        f"{latitude},{longitude}"
    )

    command = [

        SWY_PATH,

        "exec",

        "places.placessearchtext.create",

        "--input",
        f"textQuery={query}",

        "--input",
        f"key={GOOGLE_MAPS_API_KEY}",

        "--header",
        (
            "X-Goog-FieldMask="
            "places.displayName,"
            "places.id,"
            "places.formattedAddress,"
            "places.location"
        ),

        "--json"
    ]

    try:

        result = subprocess.run(
            command,
            capture_output=True,
            text=False,
            timeout=30
        )

    except subprocess.TimeoutExpired:

        raise HTTPException(
            status_code=504,
            detail="Swytchcode shelter search timed out."
        )

    except FileNotFoundError:

        raise HTTPException(
            status_code=500,
            detail=(
                "Swytchcode CLI was not found. "
                f"Expected path: {SWY_PATH}"
            )
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=(
                f"Failed to execute Swytchcode: {str(e)}"
            )
        )

    stdout = (
        (result.stdout or b"")
        .decode(
            "utf-8",
            errors="replace"
        )
        .strip()
    )

    stderr = (
        (result.stderr or b"")
        .decode(
            "utf-8",
            errors="replace"
        )
        .strip()
    )

    if result.returncode != 0:

        raise HTTPException(
            status_code=502,
            detail={
                "message": "Swytchcode shelter search failed.",
                "error": stderr or stdout
            }
        )

    response_data = _extract_json_object(
        stdout
    )

    if not response_data:

        raise HTTPException(
            status_code=502,
            detail={
                "message": (
                    "Could not parse Swytchcode shelter response."
                ),
                "raw_response": stdout[:2000]
            }
        )

    data = response_data.get(
        "data",
        response_data
    )

    places = []

    if isinstance(data, dict):

        places = data.get(
            "places",
            []
        )

    shelters = []

    for place in places:

        if not isinstance(place, dict):
            continue

        display_name = place.get(
            "displayName",
            {}
        )

        location = place.get(
            "location",
            {}
        )

        if isinstance(display_name, dict):

            name = display_name.get(
                "text"
            )

        else:

            name = display_name

        if isinstance(location, dict):

            place_latitude = location.get(
                "latitude"
            )

            place_longitude = location.get(
                "longitude"
            )

        else:

            place_latitude = None
            place_longitude = None

        if (
            place_latitude is None
            or
            place_longitude is None
        ):
            continue

        try:

            place_latitude = float(
                place_latitude
            )

            place_longitude = float(
                place_longitude
            )

        except (
            TypeError,
            ValueError
        ):

            continue

        distance_km = calculate_distance_km(
            latitude,
            longitude,
            place_latitude,
            place_longitude
        )

        shelters.append({

            "id": place.get(
                "id"
            ),

            "name": name or "Emergency Shelter",

            "address": place.get(
                "formattedAddress"
            ) or "Address unavailable",

            "latitude": place_latitude,

            "longitude": place_longitude,

            "distance_km": round(
                distance_km,
                2
            )

        })

    # --------------------------------------------------------
    # IMPORTANT:
    # Sort by actual distance BEFORE using the shelters.
    # --------------------------------------------------------

    shelters.sort(
        key=lambda item: item.get(
            "distance_km",
            float("inf")
        )
    )

    return shelters


# ============================================================
# SHELTERS ENDPOINT
# ============================================================

@app.get("/shelters")
async def find_shelters(
    latitude: float,
    longitude: float
):

    if not -90 <= latitude <= 90:

        raise HTTPException(
            status_code=400,
            detail="Invalid latitude."
        )

    if not -180 <= longitude <= 180:

        raise HTTPException(
            status_code=400,
            detail="Invalid longitude."
        )

    shelters = _find_shelters_with_swytchcode(
        latitude,
        longitude
    )

    return {

        "success": True,

        "source": (
            "FloodGuard → Swytchcode → "
            "Google Maps Places API"
        ),

        "origin": {

            "latitude": latitude,

            "longitude": longitude
        },

        "count": len(shelters),

        "shelters": shelters
    }


# ============================================================
# GOOGLE ROUTES API
# ============================================================

def _google_routes_request(
    origin_latitude: float,
    origin_longitude: float,
    destination_latitude: float,
    destination_longitude: float
):

    if not GOOGLE_MAPS_API_KEY:
        return None

    url = (
        "https://routes.googleapis.com/"
        "directions/v2:computeRoutes"
    )

    payload = {

        "origin": {
            "location": {
                "latLng": {
                    "latitude": float(
                        origin_latitude
                    ),
                    "longitude": float(
                        origin_longitude
                    )
                }
            }
        },

        "destination": {
            "location": {
                "latLng": {
                    "latitude": float(
                        destination_latitude
                    ),
                    "longitude": float(
                        destination_longitude
                    )
                }
            }
        },

        "travelMode": "DRIVE",

        "routingPreference": "TRAFFIC_AWARE",

        "computeAlternativeRoutes": False,

        "languageCode": "en",

        "units": "METRIC"
    }

    request = urllib.request.Request(

        url,

        data=json.dumps(
            payload
        ).encode("utf-8"),

        method="POST",

        headers={

            "Content-Type":
                "application/json",

            "X-Goog-Api-Key":
                GOOGLE_MAPS_API_KEY,

            "X-Goog-FieldMask": (
                "routes.distanceMeters,"
                "routes.duration,"
                "routes.polyline.encodedPolyline"
            )
        }
    )

    try:

        with urllib.request.urlopen(
            request,
            timeout=30
        ) as response:

            raw = response.read().decode(
                "utf-8",
                errors="replace"
            )

            data = json.loads(
                raw
            )

            routes = data.get(
                "routes",
                []
            )

            if not routes:
                return None

            return {
                "route": routes[0],
                "provider": "Google Routes API"
            }

    except urllib.error.HTTPError as e:

        error_body = e.read().decode(
            "utf-8",
            errors="replace"
        )

        print(
            f"Google Routes API returned {e.code}: "
            f"{error_body[:1000]}"
        )

        return None

    except Exception as e:

        print(
            "Google Routes API failed:",
            str(e)
        )

        return None


# ============================================================
# OSRM FALLBACK ROUTING
# ============================================================

def _osrm_route_request(
    origin_latitude: float,
    origin_longitude: float,
    destination_latitude: float,
    destination_longitude: float
):
    """
    Free fallback routing service.

    This prevents the Safe Route page from failing completely
    when Google Routes API is unavailable or returns 401.

    OSRM coordinates are longitude,latitude.
    """

    url = (
        "https://router.project-osrm.org/"
        "route/v1/driving/"
        f"{origin_longitude},{origin_latitude};"
        f"{destination_longitude},{destination_latitude}"
        "?overview=full&geometries=geojson"
    )

    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "FloodGuard/1.0"
        }
    )

    try:

        with urllib.request.urlopen(
            request,
            timeout=30
        ) as response:

            raw = response.read().decode(
                "utf-8",
                errors="replace"
            )

            data = json.loads(
                raw
            )

    except Exception as e:

        print(
            "OSRM routing failed:",
            str(e)
        )

        return None

    routes = data.get(
        "routes",
        []
    )

    if not routes:
        return None

    route = routes[0]

    distance_meters = route.get(
        "distance"
    )

    duration_seconds = route.get(
        "duration"
    )

    geometry = (
        route.get(
            "geometry",
            {}
        )
    )

    raw_coordinates = (
        geometry.get(
            "coordinates",
            []
        )
        if isinstance(
            geometry,
            dict
        )
        else []
    )

    # OSRM returns [longitude, latitude].
    # Frontend receives [latitude, longitude].

    route_coordinates = []

    for coordinate in raw_coordinates:

        if (
            isinstance(coordinate, list)
            and
            len(coordinate) >= 2
        ):

            route_coordinates.append([
                coordinate[1],
                coordinate[0]
            ])

    return {

        "distance_meters":
            distance_meters,

        "duration_seconds":
            duration_seconds,

        "route_coordinates":
            route_coordinates,

        "provider":
            "OSRM"
    }


# ============================================================
# ROUTE NORMALIZATION
# ============================================================

def _duration_seconds(
    duration_value
):

    if duration_value is None:
        return None

    if isinstance(
        duration_value,
        (int, float)
    ):
        return float(
            duration_value
        )

    value = str(
        duration_value
    ).strip()

    if value.endswith("s"):

        try:
            return float(
                value[:-1]
            )

        except ValueError:
            return None

    try:
        return float(
            value
        )

    except ValueError:
        return None


def _format_duration(
    seconds
):

    if seconds is None:
        return None

    seconds = int(
        round(seconds)
    )

    hours = seconds // 3600

    minutes = (
        seconds % 3600
    ) // 60

    if hours > 0:

        return (
            f"{hours} hr "
            f"{minutes} min"
        )

    if minutes <= 0:
        return "<1 min"

    return f"{minutes} min"


# ============================================================
# GOOGLE POLYLINE DECODER
# ============================================================

def _decode_polyline(
    encoded
):

    if not encoded:
        return []

    coordinates = []

    index = 0

    latitude = 0

    longitude = 0

    while index < len(encoded):

        result = 0
        shift = 0

        while True:

            if index >= len(encoded):
                return coordinates

            byte = (
                ord(encoded[index])
                - 63
            )

            index += 1

            result |= (
                (byte & 0x1F)
                << shift
            )

            shift += 5

            if byte < 0x20:
                break

        latitude_change = (
            -(result >> 1)
            if result & 1
            else result >> 1
        )

        latitude += latitude_change

        result = 0
        shift = 0

        while True:

            if index >= len(encoded):
                return coordinates

            byte = (
                ord(encoded[index])
                - 63
            )

            index += 1

            result |= (
                (byte & 0x1F)
                << shift
            )

            shift += 5

            if byte < 0x20:
                break

        longitude_change = (
            -(result >> 1)
            if result & 1
            else result >> 1
        )

        longitude += longitude_change

        coordinates.append([
            latitude / 100000.0,
            longitude / 100000.0
        ])

    return coordinates


# ============================================================
# DETERMINISTIC ROUTE SCORING
# ============================================================

def _deterministic_recommendation(
    candidates
):

    if not candidates:
        return None

    usable = [

        candidate

        for candidate in candidates

        if (
            candidate.get(
                "route_distance_km"
            ) is not None
            and
            candidate.get(
                "duration_seconds"
            ) is not None
        )
    ]

    if not usable:
        return None

    max_distance = max(
        candidate[
            "route_distance_km"
        ]
        for candidate in usable
    ) or 1

    max_duration = max(
        candidate[
            "duration_seconds"
        ]
        for candidate in usable
    ) or 1

    for candidate in usable:

        distance_score = (
            1
            -
            (
                candidate[
                    "route_distance_km"
                ]
                /
                max_distance
            )
        )

        duration_score = (
            1
            -
            (
                candidate[
                    "duration_seconds"
                ]
                /
                max_duration
            )
        )

        score = (
            distance_score * 0.55
            +
            duration_score * 0.45
        )

        candidate[
            "safety_score"
        ] = round(
            70 + score * 29,
            1
        )

    usable.sort(

        key=lambda item: (

            -item[
                "safety_score"
            ],

            item[
                "route_distance_km"
            ],

            item[
                "duration_seconds"
            ]
        )
    )

    return usable[0]


# ============================================================
# GEMINI DIRECT API
# ============================================================

def _extract_json_from_text(
    text
):

    if not text:
        return None

    cleaned = text.strip()

    if cleaned.startswith("```"):

        cleaned = cleaned.replace(
            "```json",
            "",
            1
        )

        cleaned = cleaned.replace(
            "```",
            "",
            1
        ).strip()

    first = cleaned.find("{")

    last = cleaned.rfind("}")

    if (
        first == -1
        or
        last == -1
        or
        last <= first
    ):
        return None

    try:

        return json.loads(
            cleaned[
                first:last + 1
            ]
        )

    except json.JSONDecodeError:

        return None


def _call_gemini(
    candidates
):

    if not GEMINI_API_KEY:
        return None

    candidate_payload = []

    for candidate in candidates:

        candidate_payload.append({

            "rank":
                candidate.get(
                    "rank"
                ),

            "name":
                candidate.get(
                    "name"
                ),

            "address":
                candidate.get(
                    "address"
                ),

            "road_distance_km":
                candidate.get(
                    "route_distance_km"
                ),

            "eta_minutes":
                candidate.get(
                    "duration_minutes"
                ),

            "straight_line_distance_km":
                candidate.get(
                    "distance_km"
                )

        })

    prompt = """
You are FloodGuard AI, an emergency evacuation
recommendation assistant.

Select the safest PRACTICAL shelter from the
candidate shelters.

Only use facts supplied in the candidate data.

Do NOT invent:
- flood risk
- capacity
- availability
- road closures
- emergency conditions

Use:
- actual road distance
- driving ETA
- straight-line distance

Prefer shorter road distance and shorter ETA.

Return ONLY valid JSON in exactly this format:

{
  "recommended_rank": 1,
  "priority": "HIGH",
  "confidence": 90,
  "summary": "Short explanation.",
  "reasons": [
    "Reason one.",
    "Reason two.",
    "Reason three."
  ]
}

Candidate shelters:

""" + json.dumps(
        candidate_payload,
        ensure_ascii=False
    )

    url = (
        "https://generativelanguage.googleapis.com/"
        "v1beta/models/"
        f"{GEMINI_MODEL}:generateContent"
        f"?key={urllib.parse.quote(GEMINI_API_KEY)}"
    )

    payload = {

        "contents": [

            {

                "parts": [

                    {
                        "text": prompt
                    }

                ]

            }

        ],

        "generationConfig": {

            "temperature": 0.1,

            "responseMimeType":
                "application/json"

        }

    }

    request = urllib.request.Request(

        url,

        data=json.dumps(
            payload
        ).encode("utf-8"),

        method="POST",

        headers={
            "Content-Type":
                "application/json"
        }

    )

    try:

        with urllib.request.urlopen(
            request,
            timeout=45
        ) as response:

            raw = response.read().decode(
                "utf-8",
                errors="replace"
            )

            data = json.loads(
                raw
            )

    except urllib.error.HTTPError as e:

        error_body = e.read().decode(
            "utf-8",
            errors="replace"
        )

        print(
            "Gemini API error:",
            e.code,
            error_body[:1000]
        )

        return None

    except Exception as e:

        print(
            "Gemini request failed:",
            str(e)
        )

        return None

    try:

        generated_candidates = data.get(
            "candidates",
            []
        )

        if not generated_candidates:
            return None

        content = (
            generated_candidates[0]
            .get(
                "content",
                {}
            )
        )

        parts = content.get(
            "parts",
            []
        )

        if not parts:
            return None

        text = parts[0].get(
            "text",
            ""
        )

        return _extract_json_from_text(
            text
        )

    except Exception:

        return None


# ============================================================
# BUILD RECOMMENDATION
# ============================================================

def _build_recommendation(
    candidates
):

    deterministic = (
        _deterministic_recommendation(
            candidates
        )
    )

    if not deterministic:

        return {

            "priority":
                "UNKNOWN",

            "confidence":
                0,

            "summary":
                "No reliable route recommendation available.",

            "reasons":
                [],

            "engine":
                "FloodGuard route scoring",

            "recommended_rank":
                None,

            "ai_enabled":
                False
        }

    ai_result = _call_gemini(
        candidates
    )

    if ai_result:

        try:

            recommended_rank = int(
                ai_result.get(
                    "recommended_rank"
                )
            )

        except (
            TypeError,
            ValueError
        ):

            recommended_rank = (
                deterministic.get(
                    "rank"
                )
            )

        selected = next(

            (
                candidate

                for candidate
                in candidates

                if candidate.get(
                    "rank"
                )
                ==
                recommended_rank
            ),

            None
        )

        if selected:

            priority = str(
                ai_result.get(
                    "priority",
                    "HIGH"
                )
            ).upper()

            if priority not in {
                "HIGH",
                "MEDIUM",
                "LOW"
            }:

                priority = "HIGH"

            try:

                confidence = float(
                    ai_result.get(
                        "confidence",
                        selected.get(
                            "safety_score",
                            0
                        )
                    )
                )

            except (
                TypeError,
                ValueError
            ):

                confidence = selected.get(
                    "safety_score",
                    0
                )

            confidence = max(
                0,
                min(
                    100,
                    confidence
                )
            )

            reasons = ai_result.get(
                "reasons",
                []
            )

            if not isinstance(
                reasons,
                list
            ):

                reasons = []

            return {

                "priority":
                    priority,

                "confidence":
                    round(
                        confidence,
                        1
                    ),

                "summary":
                    ai_result.get(
                        "summary",
                        "Recommended using route distance and ETA."
                    ),

                "reasons":
                    reasons[:5],

                "engine":
                    "FloodGuard + Gemini",

                "recommended_rank":
                    selected.get(
                        "rank"
                    ),

                "ai_enabled":
                    True
            }

    return {

        "priority":
            "HIGH",

        "confidence":
            deterministic.get(
                "safety_score",
                0
            ),

        "summary":
            (
                "Recommended using actual road distance "
                "and driving ETA."
            ),

        "reasons": [

            "Shortest practical road route among candidates.",

            "Driving ETA is included in the recommendation.",

            "No unsupported shelter capacity or flood-risk "
            "information was assumed."
        ],

        "engine":
            "FloodGuard route scoring",

        "recommended_rank":
            deterministic.get(
                "rank"
            ),

        "ai_enabled":
            False
    }


# ============================================================
# SAFE ROUTE
# ============================================================

@app.get("/safe-route")
async def safe_route(
    latitude: float,
    longitude: float
):

    if not -90 <= latitude <= 90:

        raise HTTPException(
            status_code=400,
            detail="Invalid latitude."
        )

    if not -180 <= longitude <= 180:

        raise HTTPException(
            status_code=400,
            detail="Invalid longitude."
        )

    # --------------------------------------------------------
    # 1. Find real nearby shelters
    # --------------------------------------------------------

    shelters = _find_shelters_with_swytchcode(
        latitude,
        longitude
    )

    if not shelters:

        return {

            "success":
                False,

            "message":
                "No emergency shelters were found near this location.",

            "origin": {

                "latitude":
                    latitude,

                "longitude":
                    longitude

            },

            "recommended_shelter":
                None,

            "route":
                None,

            "shelters":
                [],

            "recommendation":
                None
        }

    # --------------------------------------------------------
    # 2. Take nearest candidates
    # --------------------------------------------------------

    valid_shelters = [

        shelter

        for shelter in shelters

        if (
            shelter.get(
                "latitude"
            ) is not None
            and
            shelter.get(
                "longitude"
            ) is not None
        )
    ]

    if not valid_shelters:

        return {

            "success":
                False,

            "message":
                "Shelter coordinates are unavailable.",

            "origin": {

                "latitude":
                    latitude,

                "longitude":
                    longitude

            },

            "recommended_shelter":
                None,

            "route":
                None,

            "shelters":
                shelters,

            "recommendation":
                None
        }

    # Already sorted by straight-line distance.
    candidates = valid_shelters[:5]

    routed_candidates = []

    # --------------------------------------------------------
    # 3. Calculate route for each candidate
    # --------------------------------------------------------

    for index, shelter in enumerate(
        candidates
    ):

        destination_latitude = float(
            shelter[
                "latitude"
            ]
        )

        destination_longitude = float(
            shelter[
                "longitude"
            ]
        )

        routed = dict(
            shelter
        )

        routed[
            "rank"
        ] = index + 1

        google_result = (
            _google_routes_request(

                latitude,

                longitude,

                destination_latitude,

                destination_longitude

            )
        )

        # ----------------------------------------------------
        # GOOGLE ROUTES
        # ----------------------------------------------------

        if google_result:

            google_route = (
                google_result[
                    "route"
                ]
            )

            distance_meters = (
                google_route.get(
                    "distanceMeters"
                )
            )

            duration_seconds = (
                _duration_seconds(
                    google_route.get(
                        "duration"
                    )
                )
            )

            encoded_polyline = (

                google_route
                .get(
                    "polyline",
                    {}
                )
                .get(
                    "encodedPolyline"
                )
            )

            route_coordinates = (
                _decode_polyline(
                    encoded_polyline
                )
            )

            road_distance_km = (

                float(
                    distance_meters
                ) / 1000.0

                if distance_meters is not None

                else None
            )

            routed[
                "route_distance_km"
            ] = (

                round(
                    road_distance_km,
                    2
                )

                if road_distance_km is not None

                else None
            )

            routed[
                "duration_seconds"
            ] = duration_seconds

            routed[
                "duration_minutes"
            ] = (

                round(
                    duration_seconds / 60,
                    1
                )

                if duration_seconds is not None

                else None
            )

            routed[
                "duration_text"
            ] = _format_duration(
                duration_seconds
            )

            routed[
                "route_polyline"
            ] = encoded_polyline

            routed[
                "route_coordinates"
            ] = route_coordinates

            routed[
                "route_status"
            ] = "AVAILABLE"

            routed[
                "route_provider"
            ] = "Google Routes API"

        else:

            # ------------------------------------------------
            # GOOGLE FAILED → OSRM FALLBACK
            # ------------------------------------------------

            osrm_result = (
                _osrm_route_request(

                    latitude,

                    longitude,

                    destination_latitude,

                    destination_longitude

                )
            )

            if osrm_result:

                distance_meters = (
                    osrm_result.get(
                        "distance_meters"
                    )
                )

                duration_seconds = (
                    osrm_result.get(
                        "duration_seconds"
                    )
                )

                routed[
                    "route_distance_km"
                ] = (

                    round(
                        float(
                            distance_meters
                        ) / 1000.0,
                        2
                    )

                    if distance_meters is not None

                    else None
                )

                routed[
                    "duration_seconds"
                ] = duration_seconds

                routed[
                    "duration_minutes"
                ] = (

                    round(
                        float(
                            duration_seconds
                        ) / 60,
                        1
                    )

                    if duration_seconds is not None

                    else None
                )

                routed[
                    "duration_text"
                ] = _format_duration(
                    duration_seconds
                )

                routed[
                    "route_polyline"
                ] = None

                routed[
                    "route_coordinates"
                ] = osrm_result.get(
                    "route_coordinates",
                    []
                )

                routed[
                    "route_status"
                ] = "AVAILABLE"

                routed[
                    "route_provider"
                ] = "OSRM"

            else:

                routed[
                    "route_distance_km"
                ] = None

                routed[
                    "duration_seconds"
                ] = None

                routed[
                    "duration_minutes"
                ] = None

                routed[
                    "duration_text"
                ] = None

                routed[
                    "route_polyline"
                ] = None

                routed[
                    "route_coordinates"
                ] = []

                routed[
                    "route_status"
                ] = "UNAVAILABLE"

        routed_candidates.append(
            routed
        )

    # --------------------------------------------------------
    # 4. Only candidates with routes
    # --------------------------------------------------------

    usable_candidates = [

        candidate

        for candidate
        in routed_candidates

        if (
            candidate.get(
                "route_distance_km"
            ) is not None

            and

            candidate.get(
                "duration_seconds"
            ) is not None
        )
    ]

    if not usable_candidates:

        return {

            "success":
                False,

            "message": (
                "Shelters were found, but no driving route "
                "could be calculated."
            ),

            "origin": {

                "latitude":
                    latitude,

                "longitude":
                    longitude

            },

            "recommended_shelter":
                None,

            "route":
                None,

            "shelters":
                routed_candidates,

            "recommendation":
                None
        }

    # --------------------------------------------------------
    # 5. Recommendation
    # --------------------------------------------------------

    recommendation = (
        _build_recommendation(
            usable_candidates
        )
    )

    recommended_rank = (
        recommendation.get(
            "recommended_rank"
        )
    )

    recommended = next(

        (

            candidate

            for candidate
            in usable_candidates

            if candidate.get(
                "rank"
            )
            ==
            recommended_rank

        ),

        None
    )

    if recommended is None:

        recommended = min(

            usable_candidates,

            key=lambda item: (

                item.get(
                    "route_distance_km",
                    float("inf")
                ),

                item.get(
                    "duration_seconds",
                    float("inf")
                )

            )
        )

    # --------------------------------------------------------
    # 6. Rank all shelters
    # --------------------------------------------------------

    ranked_candidates = [

        dict(candidate)

        for candidate
        in usable_candidates
    ]

    _deterministic_recommendation(
        ranked_candidates
    )

    ranked_candidates.sort(

        key=lambda item: (

            -float(
                item.get(
                    "safety_score",
                    0
                )
            ),

            item.get(
                "route_distance_km",
                float("inf")
            )
        )
    )

    final_shelters = []

    for position, shelter in enumerate(
        ranked_candidates
    ):

        item = dict(
            shelter
        )

        item[
            "recommendation_rank"
        ] = position + 1

        if (
            shelter.get(
                "id"
            )
            ==
            recommended.get(
                "id"
            )
        ):

            item[
                "recommendation"
            ] = "RECOMMENDED"

        elif position == 1:

            item[
                "recommendation"
            ] = "ALTERNATIVE"

        else:

            item[
                "recommendation"
            ] = "BACKUP"

        final_shelters.append(
            item
        )

    # --------------------------------------------------------
    # 7. Google Maps navigation URL
    # --------------------------------------------------------

    origin = (
        f"{latitude},{longitude}"
    )

    destination = (
        f"{recommended['latitude']},"
        f"{recommended['longitude']}"
    )

    maps_url = (

        "https://www.google.com/maps/dir/?api=1"

        f"&origin="
        f"{urllib.parse.quote(origin)}"

        f"&destination="
        f"{urllib.parse.quote(destination)}"

        "&travelmode=driving"
    )

    # --------------------------------------------------------
    # 8. Route object
    # --------------------------------------------------------

    route = {

        "type":
            "driving",

        "status":
            "AVAILABLE",

        "distance_km":
            recommended.get(
                "route_distance_km"
            ),

        "duration_seconds":
            recommended.get(
                "duration_seconds"
            ),

        "duration_minutes":
            recommended.get(
                "duration_minutes"
            ),

        "duration_text":
            recommended.get(
                "duration_text"
            ),

        "polyline":
            recommended.get(
                "route_polyline"
            ),

        "coordinates":
            recommended.get(
                "route_coordinates",
                []
            ),

        "navigation_url":
            maps_url,

        "provider":
            recommended.get(
                "route_provider"
            )
    }

    # --------------------------------------------------------
    # 9. Final response
    # --------------------------------------------------------

    return {

        "success":
            True,

        "origin": {

            "latitude":
                latitude,

            "longitude":
                longitude
        },

        "recommended_shelter": {

            "id":
                recommended.get(
                    "id"
                ),

            "name":
                recommended.get(
                    "name"
                ),

            "address":
                recommended.get(
                    "address"
                ),

            "latitude":
                recommended.get(
                    "latitude"
                ),

            "longitude":
                recommended.get(
                    "longitude"
                ),

            "straight_line_distance_km":
                recommended.get(
                    "distance_km"
                ),

            "road_distance_km":
                recommended.get(
                    "route_distance_km"
                ),

            "eta_minutes":
                recommended.get(
                    "duration_minutes"
                ),

            "eta_text":
                recommended.get(
                    "duration_text"
                ),

            "safety_score":
                recommended.get(
                    "safety_score"
                ),

            "maps_url":
                maps_url
        },

        "route":
            route,

        "shelters":
            final_shelters,

        "recommendation":
            recommendation,

        "data_sources": {

            "shelters":
                "Swytchcode → Google Maps Places API",

            "route":
                recommended.get(
                    "route_provider"
                ),

            "recommendation":
                recommendation.get(
                    "engine"
                )
        }
    }