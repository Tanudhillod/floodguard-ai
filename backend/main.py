from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

import cv2
import numpy as np
import json

from backend.services.detector import DroneDetector


# ============================================================
# 1. CREATE FASTAPI APP
# ============================================================

app = FastAPI(
    title="FloodGuard Drone API",
    description="Drone-based person detection API for FloodGuard",
    version="1.0.0"
)


# ============================================================
# 2. CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# 3. LOAD DRONE MODEL
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
# 4. ROOT ENDPOINT
# ============================================================

@app.get("/")
def root():
    return {
        "message": "FloodGuard Drone API is running",
        "status": "healthy"
    }


# ============================================================
# 5. HEALTH CHECK
# ============================================================

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model": "floodguard_person_v2.pt"
    }


# ============================================================
# 6. DRONE PREDICTION
# ============================================================

@app.post("/predict")
async def predict(file: UploadFile = File(...)):

    # --------------------------------------------------------
    # Check file
    # --------------------------------------------------------

    if not file.content_type or not file.content_type.startswith(
        "image/"
    ):
        raise HTTPException(
            status_code=400,
            detail="Please upload a valid image file."
        )

    # --------------------------------------------------------
    # Read uploaded image
    # --------------------------------------------------------

    image_bytes = await file.read()

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
    # Run detector
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
    # Format detection data
    # --------------------------------------------------------

    formatted_detections = []

    for detection in detections:

        x1, y1, x2, y2, confidence = detection

        formatted_detections.append({
            "x1": round(x1, 2),
            "y1": round(y1, 2),
            "x2": round(x2, 2),
            "y2": round(y2, 2),
            "confidence": round(confidence, 4)
        })

    # --------------------------------------------------------
    # Encode annotated image as JPEG
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
    # Return image + metadata
    #
    # We use multipart/mixed so the frontend receives:
    #   Part 1 → JSON detection data
    #   Part 2 → annotated image
    # --------------------------------------------------------

    metadata = {
        "success": True,
        "filename": file.filename,
        "people_count": len(formatted_detections),
        "detections": formatted_detections
    }

    metadata_json = json.dumps(
        metadata
    )

    boundary = "FloodGuardBoundary"

    body = (
        f"--{boundary}\r\n"
        f"Content-Type: application/json\r\n"
        f"Content-Disposition: form-data; name=\"metadata\"\r\n"
        f"\r\n"
        f"{metadata_json}\r\n"
        f"--{boundary}\r\n"
        f"Content-Type: image/jpeg\r\n"
        f"Content-Disposition: inline; name=\"image\"; filename=\"result.jpg\"\r\n"
        f"\r\n"
    ).encode("utf-8")

    body += encoded_image.tobytes()

    body += (
        f"\r\n--{boundary}--\r\n"
    ).encode("utf-8")

    return Response(
        content=body,
        media_type=f"multipart/mixed; boundary={boundary}"
    )