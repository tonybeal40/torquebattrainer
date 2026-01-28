#!/usr/bin/env python3
"""
Baseball Swing Analyzer using MediaPipe Pose Estimation
Detects hip and hand movement timing to classify swing mechanics.
Uses MediaPipe Tasks API (0.10.x+)
"""

import sys
import json
import cv2
import numpy as np
import urllib.request
import os

MODEL_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task"
MODEL_PATH = "/tmp/pose_landmarker_lite.task"

def download_model():
    """Download the pose landmarker model if not present."""
    if not os.path.exists(MODEL_PATH):
        print(f"Downloading model to {MODEL_PATH}...", file=sys.stderr)
        urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
    return MODEL_PATH

def analyze_swing(video_path: str) -> dict:
    """
    Analyze a baseball swing video to detect hip vs hand timing.
    
    Returns:
        dict with hip_start_frame, hand_start_frame, frames_processed, and error if any
    """
    import mediapipe as mp
    from mediapipe.tasks import python
    from mediapipe.tasks.python import vision
    
    model_path = download_model()
    
    cap = cv2.VideoCapture(video_path)
    
    if not cap.isOpened():
        return {"error": "Could not open video file", "frames_processed": 0}
    
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    hip_positions = []
    hand_positions = []
    frames_processed = 0
    
    base_options = python.BaseOptions(model_asset_path=model_path)
    options = vision.PoseLandmarkerOptions(
        base_options=base_options,
        output_segmentation_masks=False
    )
    
    with vision.PoseLandmarker.create_from_options(options) as landmarker:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            frames_processed += 1
            
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)
            
            result = landmarker.detect(mp_image)
            
            if result.pose_landmarks and len(result.pose_landmarks) > 0:
                landmarks = result.pose_landmarks[0]
                
                left_hip = landmarks[23]
                right_hip = landmarks[24]
                hip_x = (left_hip.x + right_hip.x) / 2
                hip_y = (left_hip.y + right_hip.y) / 2
                hip_vis = (left_hip.visibility + right_hip.visibility) / 2
                
                left_wrist = landmarks[15]
                right_wrist = landmarks[16]
                hand_x = (left_wrist.x + right_wrist.x) / 2
                hand_y = (left_wrist.y + right_wrist.y) / 2
                hand_vis = (left_wrist.visibility + right_wrist.visibility) / 2
                
                hip_positions.append({
                    "frame": frames_processed,
                    "x": hip_x,
                    "y": hip_y,
                    "visibility": hip_vis
                })
                
                hand_positions.append({
                    "frame": frames_processed,
                    "x": hand_x,
                    "y": hand_y,
                    "visibility": hand_vis
                })
            else:
                hip_positions.append({"frame": frames_processed, "x": None, "y": None, "visibility": 0})
                hand_positions.append({"frame": frames_processed, "x": None, "y": None, "visibility": 0})
    
    cap.release()
    
    if frames_processed < 10:
        return {
            "error": "Video too short for analysis",
            "frames_processed": frames_processed
        }
    
    hip_start = detect_movement_start(hip_positions, threshold=0.02)
    hand_start = detect_movement_start(hand_positions, threshold=0.025)
    
    return {
        "frames_processed": frames_processed,
        "fps": fps,
        "hip_start_frame": hip_start,
        "hand_start_frame": hand_start,
        "error": None
    }

def detect_movement_start(positions: list, threshold: float = 0.02, window: int = 3) -> int:
    """
    Detect when significant movement starts by looking for velocity changes.
    
    Args:
        positions: List of position dicts with x, y coordinates
        threshold: Minimum velocity to consider as movement
        window: Number of frames to smooth over
        
    Returns:
        Frame number where movement starts, or None if not detected
    """
    if len(positions) < window + 1:
        return None
    
    valid_positions = [p for p in positions if p["x"] is not None and p["visibility"] > 0.3]
    
    if len(valid_positions) < window + 1:
        return None
    
    for i in range(window, len(valid_positions)):
        velocities = []
        for j in range(i - window, i):
            if j + 1 < len(valid_positions):
                dx = valid_positions[j + 1]["x"] - valid_positions[j]["x"]
                dy = valid_positions[j + 1]["y"] - valid_positions[j]["y"]
                velocity = np.sqrt(dx**2 + dy**2)
                velocities.append(velocity)
        
        if velocities:
            avg_velocity = np.mean(velocities)
            if avg_velocity > threshold:
                return valid_positions[i - window]["frame"]
    
    return None

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No video path provided"}))
        sys.exit(1)
    
    video_path = sys.argv[1]
    
    try:
        result = analyze_swing(video_path)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({
            "error": str(e),
            "frames_processed": 0
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()
