import os
import cv2
import json
import base64
import numpy as np
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
import face_recognition
import mysql.connector
from mysql.connector import Error
import uuid

app = Flask(__name__)
CORS(app)  # Allow React frontend to connect

# Database config - Change database name if needed
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'root',
    'database': 'face_recognition_db'   # or 'face_recognition_system'
}

GALLERY_DIR = r"D:\projects\face\gallery_images"
if not os.path.exists(GALLERY_DIR):
    os.makedirs(GALLERY_DIR)

def get_db_connection():
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except Error as e:
        print(f"Database error: {e}")
        return None

# Initialize database tables (run once)
def init_database():
    conn = get_db_connection()
    if not conn:
        return
    cursor = conn.cursor()
    # Create a simple unified table for now (you can expand later)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(50) PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            type VARCHAR(20) NOT NULL,
            roll_no VARCHAR(50),
            subject VARCHAR(100),
            branch VARCHAR(100),
            age INT,
            photo TEXT,
            face_encoding TEXT,
            registration_date DATETIME
        )
    """)
    conn.commit()
    cursor.close()
    conn.close()

init_database()

def extract_face_encoding(image_base64):
    """Extract 128-d face encoding using face_recognition"""
    try:
        if ',' in image_base64:
            image_base64 = image_base64.split(',')[1]
        
        image_data = base64.b64decode(image_base64)
        nparr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        encodings = face_recognition.face_encodings(rgb_img)
        
        if len(encodings) == 0:
            return None
        return encodings[0].tolist()   # Return first face encoding as list
        
    except Exception as e:
        print(f"Encoding error: {e}")
        return None

@app.route('/api/register', methods=['POST'])
def register_user():
    try:
        data = request.json
        user_type = data.get('type')
        name = data.get('name')
        photo = data.get('photo')

        if not name or not photo:
            return jsonify({'error': 'Name and photo are required'}), 400

        encoding = extract_face_encoding(photo)
        if not encoding:
            return jsonify({'error': 'No face detected in photo'}), 400

        user_id = str(uuid.uuid4())
        registration_date = datetime.now()

        conn = get_db_connection()
        cursor = conn.cursor()

        face_encoding_json = json.dumps(encoding)

        if user_type == 'TEACHER':
            subject = data.get('subject')
            cursor.execute("""
                INSERT INTO users (id, name, type, subject, photo, face_encoding, registration_date)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (user_id, name, user_type, subject, photo, face_encoding_json, registration_date))

        elif user_type == 'STUDENT':
            roll_no = data.get('rollNo')
            branch = data.get('branch')
            age = data.get('age')
            cursor.execute("""
                INSERT INTO users (id, name, type, roll_no, branch, age, photo, face_encoding, registration_date)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (user_id, name, user_type, roll_no, branch, age, photo, face_encoding_json, registration_date))

        else:  # GUEST
            cursor.execute("""
                INSERT INTO users (id, name, type, photo, face_encoding, registration_date)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (user_id, name, user_type, photo, face_encoding_json, registration_date))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({'success': True, 'userId': user_id})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Add this endpoint so frontend doesn't crash
@app.route('/api/extract-descriptor', methods=['POST'])
def extract_descriptor():
    try:
        data = request.json
        image = data.get('image')
        encoding = extract_face_encoding(image)
        if not encoding:
            return jsonify({'error': 'No face detected'}), 400
        return jsonify({'descriptor': encoding})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("Starting Flask API server on http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)