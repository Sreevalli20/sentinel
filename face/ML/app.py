from flask import Flask, request, jsonify
import pymysql
import cv2
import os
import pickle
import shutil
import numpy as np
from sklearn.preprocessing import LabelEncoder

app = Flask(__name__)

# MySQL Database Connection
conn = pymysql.connect(
    host='localhost',
    user='root',
    password='root',
    database='face_login_db'
)

# Directories
TRAINING_DIR = "D:/2025-2026/October/TK200066 - Online Voting System with Face Recognition/CODE/ML/TrainingImage/"
MODEL_DIR = "D:/2025-2026/October/TK200066 - Online Voting System with Face Recognition/CODE/ML/Trained_Model/"
TEMP_DIR = "D:/2025-2026/October/TK200066 - Online Voting System with Face Recognition/CODE/ML/Temp/"
MODEL_PATH = os.path.join(MODEL_DIR, "trainner.yml")

# Ensure directories exist
os.makedirs(TRAINING_DIR, exist_ok=True)
os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)

# Helper Functions
def preprocess_images(voter_id, temp_dir, training_dir):
    """
    Preprocess images by detecting faces, aligning, and saving them to the training directory.
    """
    try:
        # Create voter-specific training directory
        voter_training_dir = os.path.join(training_dir, voter_id)
        os.makedirs(voter_training_dir, exist_ok=True)

        # Get list of image paths - FIXED THE ENDSWITH CALL
        image_paths = [os.path.join(temp_dir, f) for f in os.listdir(temp_dir) 
                      if f.lower().endswith(('.jpg', '.jpeg', '.png'))]  # Fixed this line
        
        if not image_paths:
            return {"success": False, "message": "No images found for processing"}

        # Load Haar cascade for face detection
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

        processed_count = 0
        for image_path in image_paths:
            # Read image
            image = cv2.imread(image_path)
            if image is None:
                continue

            # Convert to grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

            # Detect faces
            faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))

            # If face detected, process and save
            if len(faces) > 0:
                for (x, y, w, h) in faces:
                    # Extract face region
                    face_roi = gray[y:y+h, x:x+w]
                    
                    # Resize to a standard size (e.g., 100x100)
                    face_roi = cv2.resize(face_roi, (100, 100))
                    
                    # Save the processed face image
                    output_path = os.path.join(voter_training_dir, f"{processed_count}.jpg")
                    cv2.imwrite(output_path, face_roi)
                    processed_count += 1

        # If no faces were detected in any image
        if processed_count == 0:
            return {"success": False, "message": "No faces detected in any images"}

        return {"success": True, "message": f"Processed {processed_count} face images"}

    except Exception as e:
        return {"success": False, "message": f"Error during image preprocessing: {str(e)}"}

def train_model():
    recognizer = cv2.face.LBPHFaceRecognizer_create()
    faces = []
    ids = []
   
    # CHANGED: Recursively load from voter subdirectories
    for voter_dir in os.listdir(TRAINING_DIR):
        voter_path = os.path.join(TRAINING_DIR, voter_dir)
        if not os.path.isdir(voter_path):
            continue
        try:
            voter_id = int(voter_dir)  # Voter ID from subdirectory name
        except ValueError:
            print(f"Skipping invalid voter directory: {voter_dir}")
            continue
        
        # Get image files in this voter's directory
        image_files = [f for f in os.listdir(voter_path) 
                       if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        
        print(f"Found {len(image_files)} images for voter {voter_id}")
        
        for img_file in image_files:
            image_path = os.path.join(voter_path, img_file)
            img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
            if img is None:
                print(f"Failed to load training image: {image_path}")
                continue
           
            faces.append(img)
            ids.append(voter_id)
   
    if not faces:
        return {"success": False, "error": "No valid training images found."}
    print(f"Training with {len(faces)} images and {len(set(ids))} unique IDs")
    print(f"IDs found: {set(ids)}")
   
    le = LabelEncoder()
    ids_encoded = le.fit_transform(ids)
    recognizer.train(faces, np.array(ids_encoded))
    recognizer.save(MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")
    with open(os.path.join(MODEL_DIR, 'label_encoder.pkl'), 'wb') as f:
        pickle.dump(le, f)
    return {"success": True, "message": f"Trained with {len(faces)} images from {len(set(ids))} users"}

def verify_face(image_data):
    try:
        # Load Haar cascade for face detection (same as training)
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        # Convert image_data (bytes) to OpenCV Mat
        nparr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)  # Decode as color first for better detection
        if img is None:
            return {"success": False, "error": "Failed to decode image"}
        
        # Convert to grayscale for detection
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Detect faces (same params as training)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
        
        if len(faces) == 0:
            return {"success": False, "error": "No face detected in image"}
        
        # Extract the first detected face ROI (you could average multiple if needed)
        (x, y, w, h) = faces[0]  # Take the largest/first face
        face_roi = gray[y:y+h, x:x+w]
        
        # Resize to match training size (100x100)
        face_roi = cv2.resize(face_roi, (100, 100))
        
        # Load model and LabelEncoder
        recognizer = cv2.face.LBPHFaceRecognizer_create()
        recognizer.read(MODEL_PATH)
        with open(os.path.join(MODEL_DIR, 'label_encoder.pkl'), 'rb') as f:
            le = pickle.load(f)
        
        # Predict
        id_pred, confidence = recognizer.predict(face_roi)
        predicted_voter_id = int(le.inverse_transform([id_pred])[0])
        print(f"Predicted Voter ID: {predicted_voter_id}, Confidence (distance): {confidence}")  

        if confidence < 75:
            id_real = le.inverse_transform([id_pred])[0]
            return {"success": True, "voterId": int(id_real), "confidence": confidence}
        else:
            return {"success": False, "error": "Unknown face", "confidence": confidence}
    
    except cv2.error as e:
        return {"success": False, "error": f"Failed to load trained model: {str(e)}"}
    except Exception as e:
        return {"success": False, "error": f"Verification error: {str(e)}"}

# Routes
@app.route('/train/<voter_id>', methods=['POST'])
def train(voter_id):
    try:
        # Create temp directory for uploaded images
        temp_dir = os.path.join(TEMP_DIR, f"temp_{voter_id}")
        os.makedirs(temp_dir, exist_ok=True)
       
        # Save uploaded images
        if 'faceImages' not in request.files:
            return jsonify({"success": False, "message": "No images uploaded"}), 400
           
        files = request.files.getlist('faceImages')
        if not files or files[0].filename == '':
            return jsonify({"success": False, "message": "No images selected"}), 400
       
        saved_count = 0
        for file in files:
            if file and file.filename.lower().endswith(('.jpg', '.jpeg', '.png')):
                filename = f"image_{saved_count}.jpg"
                file.save(os.path.join(temp_dir, filename))
                saved_count += 1
       
        if saved_count == 0:
            return jsonify({"success": False, "message": "No valid images uploaded"}), 400
           
        print(f"Saved {saved_count} images to temp directory")
        print(f"Processing images from: {temp_dir}")
       
        # Preprocess images
        preprocess_result = preprocess_images(voter_id, temp_dir, TRAINING_DIR)
       
        # Clean up temp directory
        shutil.rmtree(temp_dir, ignore_errors=True)
       
        if not preprocess_result["success"]:
            return jsonify(preprocess_result), 400

        # CHANGED: Train the model after successful preprocessing
        train_result = train_model()
        if not train_result["success"]:
            return jsonify({"success": False, "message": f"Preprocessing succeeded but training failed: {train_result.get('error', 'Unknown error')}"}), 500

        # Combine messages for full success response
        return jsonify({
            "success": True, 
            "message": f"{preprocess_result['message']}. {train_result['message']}"
        })
           
    except Exception as e:
        # Clean up on error
        temp_dir = os.path.join(TEMP_DIR, f"temp_{voter_id}")
        shutil.rmtree(temp_dir, ignore_errors=True)
        return jsonify({"success": False, "message": f"Training failed: {str(e)}"}), 500

@app.route('/verify', methods=['POST'])
def verify():
    if 'image' not in request.files:
        return jsonify({"success": False, "error": "No image provided"}), 400
    image_file = request.files['image']
    image_data = image_file.read()
    result = verify_face(image_data)
    print(result)
    return jsonify(result)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000, debug=True)