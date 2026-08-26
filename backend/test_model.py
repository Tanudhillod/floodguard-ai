import cv2
import torch
from ultralytics import YOLO


# ============================================================
# 1. LOAD TRAINED MODEL
# ============================================================

MODEL_PATH = "backend/models/floodguard_person_v2.pt"
IMAGE_PATH = "backend/test_images/drone_test.jpeg"
OUTPUT_PATH = "backend/test_images/result.jpg"

model = YOLO(MODEL_PATH)

print("Model loaded successfully!")
print("Model classes:", model.names)


# ============================================================
# 2. SETTINGS
# ============================================================

TILE_SIZE = 512
OVERLAP = 0.25

# Lower threshold for small/weak detections
CONF_THRESHOLD = 0.10

# Remove duplicate detections from overlapping tiles
NMS_IOU = 0.45

# GPU if available, otherwise CPU
DEVICE = 0 if torch.cuda.is_available() else "cpu"

print(
    "Device:",
    "GPU" if DEVICE == 0 else "CPU"
)


# ============================================================
# 3. LOAD IMAGE
# ============================================================

image = cv2.imread(IMAGE_PATH)

if image is None:
    raise FileNotFoundError(
        f"Could not read image: {IMAGE_PATH}"
    )

height, width = image.shape[:2]

print(
    f"Original image size: {width} x {height}"
)


# ============================================================
# 4. CREATE TILES
# ============================================================

stride = int(
    TILE_SIZE * (1 - OVERLAP)
)

detections = []

tile_number = 0


for y in range(0, height, stride):

    for x in range(0, width, stride):

        # Make sure final tiles reach image boundaries
        x2 = min(
            x + TILE_SIZE,
            width
        )

        y2 = min(
            y + TILE_SIZE,
            height
        )

        x1 = max(
            0,
            x2 - TILE_SIZE
        )

        y1 = max(
            0,
            y2 - TILE_SIZE
        )

        tile = image[y1:y2, x1:x2]

        tile_number += 1


        # ====================================================
        # RUN YOLO ON TILE
        # ====================================================

        results = model.predict(
            source=tile,
            conf=CONF_THRESHOLD,
            imgsz=640,
            device=DEVICE,
            verbose=False
        )

        result = results[0]

        if result.boxes is None:
            continue


        boxes = (
            result.boxes.xyxy
            .cpu()
            .numpy()
        )

        scores = (
            result.boxes.conf
            .cpu()
            .numpy()
        )

        classes = (
            result.boxes.cls
            .cpu()
            .numpy()
        )


        # ====================================================
        # CONVERT TILE COORDINATES
        # TO ORIGINAL IMAGE COORDINATES
        # ====================================================

        for box, score, cls in zip(
            boxes,
            scores,
            classes
        ):

            # Class 0 = person
            if int(cls) != 0:
                continue

            bx1, by1, bx2, by2 = box

            # Move tile coordinates
            # back to original image
            bx1 += x1
            bx2 += x1

            by1 += y1
            by2 += y1

            detections.append([
                float(bx1),
                float(by1),
                float(bx2),
                float(by2),
                float(score)
            ])


print("\n================================")
print("Tiled inference completed!")
print("Tiles processed:", tile_number)
print("Raw detections:", len(detections))
print("================================")


# ============================================================
# 5. IOU CALCULATION
# ============================================================

def calculate_iou(box1, box2):

    x1 = max(
        box1[0],
        box2[0]
    )

    y1 = max(
        box1[1],
        box2[1]
    )

    x2 = min(
        box1[2],
        box2[2]
    )

    y2 = min(
        box1[3],
        box2[3]
    )

    intersection = (
        max(0, x2 - x1)
        *
        max(0, y2 - y1)
    )


    area1 = (
        max(0, box1[2] - box1[0])
        *
        max(0, box1[3] - box1[1])
    )


    area2 = (
        max(0, box2[2] - box2[0])
        *
        max(0, box2[3] - box2[1])
    )


    union = (
        area1
        +
        area2
        -
        intersection
    )


    if union == 0:
        return 0


    return intersection / union


# ============================================================
# 6. NON-MAXIMUM SUPPRESSION
# ============================================================

def nms(
    detections,
    iou_threshold=0.45
):

    if len(detections) == 0:
        return []


    # Highest confidence first
    detections = sorted(
        detections,
        key=lambda x: x[4],
        reverse=True
    )


    keep = []


    while detections:

        best = detections.pop(0)

        keep.append(best)

        remaining = []


        for detection in detections:

            iou = calculate_iou(
                best,
                detection
            )

            if iou < iou_threshold:
                remaining.append(
                    detection
                )


        detections = remaining


    return keep


final_detections = nms(
    detections,
    iou_threshold=NMS_IOU
)


# ============================================================
# 7. DRAW FINAL DETECTIONS
# ============================================================

output = image.copy()


for i, detection in enumerate(
    final_detections,
    1
):

    x1, y1, x2, y2, confidence = detection

    x1 = int(x1)
    y1 = int(y1)
    x2 = int(x2)
    y2 = int(y2)


    # Bounding box
    cv2.rectangle(
        output,
        (x1, y1),
        (x2, y2),
        (255, 0, 0),
        2
    )


    # Label
    label = (
        f"Person {confidence:.2f}"
    )


    cv2.putText(
        output,
        label,
        (
            x1,
            max(20, y1 - 5)
        ),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.5,
        (255, 0, 0),
        2
    )


# ============================================================
# 8. SAVE FINAL RESULT
# ============================================================

cv2.imwrite(
    OUTPUT_PATH,
    output
)


# ============================================================
# 9. FINAL RESULT
# ============================================================

print("\n================================")
print("       FLOODGUARD RESULT")
print("================================")

print(
    "People detected:",
    len(final_detections)
)

print(
    "Result saved to:",
    OUTPUT_PATH
)

print("================================")