from supabase_client import supabase

test_data = {
    "image_path": "C:/Users/Admin/OneDrive/Desktop/floodGuard/floodguard-ai/backend/test_images/drone_test.jpeg",
    "location": "Test Location",
    "latitude": 28.6139,
    "longitude": 77.2090,
    "time_span": "10 seconds",
    "people_detected": 5,
    "flood_area": 250.5,
    "severity": "High",
    "confidence": 0.92,
    "model_name": "FloodGuard-Person-v2",
    "analysis_status": "Completed"
}

try:
    response = supabase.table("drone_detections").insert(test_data).execute()

    print("Test record inserted successfully!")
    print("Inserted data:")
    print(response.data)

except Exception as e:
    print("Failed to insert test record!")
    print("Error:", e)