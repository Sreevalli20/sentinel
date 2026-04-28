import os
import cv2
import json
import base64
import pickle
import shutil
import numpy as np
from sklearn.preprocessing import LabelEncoder
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_mail import Mail, Message
from insightface.app import FaceAnalysis
import mysql.connector
from mysql.connector import Error
import uuid
import logging
from threading import Thread

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = 'your-secret-key-change-in-production'
CORS(app, supports_credentials=True)

# Flask-Mail Configuration
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USE_SSL'] = False
app.config['MAIL_USERNAME'] = 'cse.takeoff@gmail.com'
app.config['MAIL_PASSWORD'] = 'digkagfgyxcjltup'
app.config['MAIL_DEFAULT_SENDER'] = 'cse.takeoff@gmail.com'

mail = Mail(app)

# Initialize InsightFace pipeline
pipeline = FaceAnalysis(name='buffalo_l')
pipeline.prepare(ctx_id=0, det_size=(640, 640))

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'root',
    'database': 'face_recognition_db'
}

# Directories
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TRAINING_DIR = os.path.join(BASE_DIR, "TrainingImage")
MODEL_DIR = os.path.join(BASE_DIR, "Trained_Model")
TEMP_DIR = os.path.join(BASE_DIR, "Temp")
MODEL_PATH = os.path.join(MODEL_DIR, "trainner.yml")
LABEL_ENCODER_PATH = os.path.join(MODEL_DIR, 'label_encoder.pkl')

# Ensure directories exist
os.makedirs(TRAINING_DIR, exist_ok=True)
os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)

# Constants
MAX_TRAINING_IMAGES = 25  # Store exactly 25 images per person

def get_db_connection():
    """Create database connection"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except Error as e:
        logger.error(f"Database connection error: {e}")
        return None

def init_database():
    """Initialize database tables if they don't exist"""
    connection = get_db_connection()
    if not connection:
        return False
    
    try:
        cursor = connection.cursor()
        
        # Create teachers table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS teachers (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                type VARCHAR(20) NOT NULL,
                subject VARCHAR(100),
                photo LONGTEXT,
                registration_date DATETIME,
                face_descriptor TEXT,
                INDEX idx_name (name)
            )
        """)
        
        # Create students table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS students (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                roll_no VARCHAR(50) UNIQUE,
                email VARCHAR(100),
                branch VARCHAR(100),
                age INT,
                photo LONGTEXT,
                id_card_photo LONGTEXT,
                registration_date DATETIME,
                face_descriptor TEXT,
                INDEX idx_name (name),
                INDEX idx_roll_no (roll_no),
                INDEX idx_email (email)
            )
        """)
        
        # Create guests table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS guests (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(100),
                photo LONGTEXT,
                registration_date DATETIME,
                face_descriptor TEXT,
                INDEX idx_name (name)
            )
        """)
        
        # Create sessions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id VARCHAR(50) PRIMARY KEY,
                subject VARCHAR(100),
                start_time DATETIME,
                end_time DATETIME,
                stats JSON,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create absentees table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS absentees (
                id VARCHAR(50) PRIMARY KEY,
                session_id VARCHAR(50),
                student_id VARCHAR(50),
                student_name VARCHAR(100),
                roll_no VARCHAR(50),
                email VARCHAR(100),
                subject VARCHAR(100),
                session_date DATETIME,
                email_sent BOOLEAN DEFAULT FALSE,
                email_sent_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES sessions(id),
                INDEX idx_session (session_id),
                INDEX idx_email_sent (email_sent)
            )
        """)
        
        connection.commit()
        logger.info("Database tables initialized successfully")
        return True
        
    except Error as e:
        logger.error(f"Database initialization error: {e}")
        return False
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

# Initialize database on startup
init_database()

def preprocess_images(voter_id, temp_dir, training_dir):
    """
    Preprocess images by detecting faces, aligning, and saving them to the training directory.
    Stores exactly MAX_TRAINING_IMAGES images per person.
    """
    try:
        # Create voter-specific training directory
        voter_training_dir = os.path.join(training_dir, str(voter_id))
        os.makedirs(voter_training_dir, exist_ok=True)
        
        # Check existing images count
        existing_images = [f for f in os.listdir(voter_training_dir) 
                          if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        existing_count = len(existing_images)
        
        if existing_count >= MAX_TRAINING_IMAGES:
            return {"success": False, "message": f"Already have {MAX_TRAINING_IMAGES} images for this user"}

        # Get list of image paths
        image_paths = [os.path.join(temp_dir, f) for f in os.listdir(temp_dir) 
                      if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        
        if not image_paths:
            return {"success": False, "message": "No images found for processing"}

        # Load Haar cascade for face detection
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        processed_count = existing_count
        for image_path in image_paths:
            if processed_count >= MAX_TRAINING_IMAGES:
                break
                
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
                # Use the largest face
                (x, y, w, h) = max(faces, key=lambda rect: rect[2] * rect[3])
                
                # Extract face region with margin
                margin = int(0.2 * w)
                x = max(0, x - margin)
                y = max(0, y - margin)
                w = min(gray.shape[1] - x, w + 2*margin)
                h = min(gray.shape[0] - y, h + 2*margin)
                
                face_roi = gray[y:y+h, x:x+w]
                
                # Resize to standard size
                face_roi = cv2.resize(face_roi, (150, 150))
                
                # Save the processed face image
                output_path = os.path.join(voter_training_dir, f"{processed_count}.jpg")
                cv2.imwrite(output_path, face_roi)
                processed_count += 1

        if processed_count == existing_count:
            return {"success": False, "message": "No faces detected in any images"}

        return {"success": True, "message": f"Processed {processed_count - existing_count} face images. Total: {processed_count}/{MAX_TRAINING_IMAGES}"}

    except Exception as e:
        return {"success": False, "message": f"Error during image preprocessing: {str(e)}"}

def train_model():
    """Train the face recognition model using all stored images"""
    try:
        recognizer = cv2.face.LBPHFaceRecognizer_create()
        faces = []
        ids = []
        
        # Load images from all voter subdirectories
        for voter_dir in os.listdir(TRAINING_DIR):
            voter_path = os.path.join(TRAINING_DIR, voter_dir)
            if not os.path.isdir(voter_path):
                continue
                
            try:
                voter_id = int(voter_dir)
            except ValueError:
                logger.warning(f"Skipping invalid voter directory: {voter_dir}")
                continue
            
            # Get image files in this voter's directory
            image_files = [f for f in os.listdir(voter_path) 
                          if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
            
            logger.info(f"Found {len(image_files)} images for voter {voter_id}")
            
            for img_file in image_files:
                image_path = os.path.join(voter_path, img_file)
                img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
                if img is None:
                    logger.warning(f"Failed to load training image: {image_path}")
                    continue
                
                # Apply histogram equalization for better recognition
                img = cv2.equalizeHist(img)
                
                faces.append(img)
                ids.append(voter_id)
        
        if len(faces) < 2:
            return {"success": False, "error": "Need at least 2 training images to train model."}
        
        logger.info(f"Training with {len(faces)} images and {len(set(ids))} unique IDs")
        logger.info(f"IDs found: {set(ids)}")
        
        # Train the model
        le = LabelEncoder()
        ids_encoded = le.fit_transform(ids)
        recognizer.train(faces, np.array(ids_encoded))
        recognizer.save(MODEL_PATH)
        
        # Save label encoder
        with open(LABEL_ENCODER_PATH, 'wb') as f:
            pickle.dump(le, f)
        
        logger.info(f"Model saved to {MODEL_PATH}")
        return {"success": True, "message": f"Trained with {len(faces)} images from {len(set(ids))} users"}
    
    except Exception as e:
        logger.error(f"Training error: {e}")
        return {"success": False, "error": str(e)}

def verify_face(image_data):
    """Verify face against trained model"""
    try:
        # Load Haar cascade
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        # Convert image_data to OpenCV Mat
        nparr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return {"success": False, "error": "Failed to decode image"}
        
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
        
        if len(faces) == 0:
            return {"success": False, "error": "No face detected in image"}
        
        # Use the largest face
        (x, y, w, h) = max(faces, key=lambda rect: rect[2] * rect[3])
        
        # Extract and resize face
        face_roi = gray[y:y+h, x:x+w]
        face_roi = cv2.resize(face_roi, (150, 150))
        face_roi = cv2.equalizeHist(face_roi)
        
        # Load model and label encoder
        if not os.path.exists(MODEL_PATH) or not os.path.exists(LABEL_ENCODER_PATH):
            return {"success": False, "error": "Model not trained yet. Please register users first."}
        
        recognizer = cv2.face.LBPHFaceRecognizer_create()
        recognizer.read(MODEL_PATH)
        
        with open(LABEL_ENCODER_PATH, 'rb') as f:
            le = pickle.load(f)
        
        # Predict
        id_pred, confidence = recognizer.predict(face_roi)
        predicted_voter_id = le.inverse_transform([id_pred])[0]
        
        logger.info(f"Predicted Voter ID: {predicted_voter_id}, Confidence: {confidence}")
        
        # Lower confidence means better match for LBPH
        if confidence < 75:
            return {"success": True, "voterId": int(predicted_voter_id), "confidence": confidence}
        else:
            return {"success": False, "error": "Unknown face", "confidence": confidence}
    
    except Exception as e:
        logger.error(f"Verification error: {e}")
        return {"success": False, "error": f"Verification error: {str(e)}"}

def extract_face_descriptor(image_base64):
    """Extract face descriptor using InsightFace"""
    try:
        if ',' in image_base64:
            image_base64 = image_base64.split(',')[1]

        image_data = base64.b64decode(image_base64)
        nparr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            logger.error("Failed to decode image")
            return None

        faces = pipeline.get(img)

        if not faces or len(faces) == 0:
            logger.warning("No face detected by InsightFace")
            return None

        best_face = max(faces, key=lambda x: x.det_score)
        embedding = best_face.normed_embedding
        return embedding.tolist()

    except Exception as e:
        logger.error(f"Face extraction error: {e}")
        return None

def cosine_similarity(a, b):
    """Calculate cosine similarity between two vectors"""
    a = a / (np.linalg.norm(a) + 1e-9)
    b = b / (np.linalg.norm(b) + 1e-9)
    return float(np.dot(a, b))

def check_duplicate_face(face_descriptor, threshold=0.35):
    """Check if face already exists in any table"""
    connection = get_db_connection()
    if not connection:
        return False
    
    try:
        cursor = connection.cursor()
        current_desc = np.array(face_descriptor)
        
        # Check all tables for duplicate face
        tables = ['students', 'teachers', 'guests']
        for table in tables:
            cursor.execute(f"SELECT face_descriptor FROM {table} WHERE face_descriptor IS NOT NULL")
            for row in cursor.fetchall():
                if row[0]:
                    existing_desc = np.array(json.loads(row[0]))
                    similarity = cosine_similarity(current_desc, existing_desc)
                    if similarity > threshold:
                        return True
        
        return False
        
    except Exception as e:
        logger.error(f"Duplicate check error: {e}")
        return False
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

def send_absentee_email(recipient_email, student_name, roll_no, subject, session_date):
    """Send email to absent student"""
    try:
        if not recipient_email:
            logger.warning(f"No email address for student: {student_name}")
            return False
            
        msg = Message(
            subject=f"Attendance Notification - Absent for {subject}",
            recipients=[recipient_email]
        )
        msg.html = f"""
        <html>
        <body style="font-family: Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #e74c3c;">Attendance Alert</h2>
                <p>Dear {student_name},</p>
                <p>This is to inform you that you were marked <strong style="color: #e74c3c;">ABSENT</strong> for the following session:</p>
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
                    <p><strong>Subject:</strong> {subject}</p>
                    <p><strong>Date:</strong> {session_date}</p>
                    <p><strong>Roll Number:</strong> {roll_no}</p>
                </div>
                <p>Please ensure regular attendance for future sessions.</p>
                <hr style="margin: 20px 0;">
                <p style="color: #666; font-size: 12px;">This is an automated message from the Face Recognition Attendance System.</p>
            </div>
        </body>
        </html>
        """
        mail.send(msg)
        logger.info(f"Email sent successfully to {recipient_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {recipient_email}: {e}")
        return False

# Routes
@app.route('/train/<voter_id>', methods=['POST'])
def train(voter_id):
    """Train face recognition model for a specific voter"""
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
            if saved_count >= MAX_TRAINING_IMAGES:
                break
            if file and file.filename.lower().endswith(('.jpg', '.jpeg', '.png')):
                filename = f"image_{saved_count}.jpg"
                file.save(os.path.join(temp_dir, filename))
                saved_count += 1
        
        if saved_count == 0:
            return jsonify({"success": False, "message": "No valid images uploaded"}), 400
            
        logger.info(f"Saved {saved_count} images to temp directory")
        
        # Preprocess images
        preprocess_result = preprocess_images(voter_id, temp_dir, TRAINING_DIR)
        
        # Clean up temp directory
        shutil.rmtree(temp_dir, ignore_errors=True)
        
        if not preprocess_result["success"]:
            return jsonify(preprocess_result), 400

        # Train the model
        train_result = train_model()
        if not train_result["success"]:
            return jsonify({"success": False, "message": f"Preprocessing succeeded but training failed: {train_result.get('error', 'Unknown error')}"}), 500

        return jsonify({
            "success": True, 
            "message": f"{preprocess_result['message']}. {train_result['message']}"
        })
           
    except Exception as e:
        temp_dir = os.path.join(TEMP_DIR, f"temp_{voter_id}")
        shutil.rmtree(temp_dir, ignore_errors=True)
        logger.error(f"Training route error: {e}")
        return jsonify({"success": False, "message": f"Training failed: {str(e)}"}), 500

@app.route('/verify', methods=['POST'])
def verify():
    """Verify face against trained model"""
    if 'image' not in request.files:
        return jsonify({"success": False, "error": "No image provided"}), 400
    
    image_file = request.files['image']
    image_data = image_file.read()
    result = verify_face(image_data)
    return jsonify(result)

@app.route('/api/register', methods=['POST'])
def register_user():
    """Register a new user (TEACHER / STUDENT / GUEST)"""
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        user_type = data.get('type')
        name = data.get('name')
        photo = data.get('photo')

        if not user_type or not name or not photo:
            return jsonify({'error': 'type, name and photo are required'}), 400

        # Extract face descriptor
        face_descriptor = extract_face_descriptor(photo)
        if not face_descriptor:
            return jsonify({'error': 'No face detected in the photo. Please retake with clear face.'}), 400

        # Check for duplicate face
        if check_duplicate_face(face_descriptor):
            return jsonify({'error': 'This person is already registered.'}), 409

        user_id = str(uuid.uuid4())
        registration_date = datetime.now()

        connection = get_db_connection()
        if not connection:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = connection.cursor()

        if user_type == 'TEACHER':
            subject = data.get('subject')
            if not subject:
                return jsonify({'error': 'Subject is required for teachers'}), 400

            cursor.execute("""
                INSERT INTO teachers 
                (id, name, type, subject, photo, registration_date, face_descriptor)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (user_id, name, user_type, subject, photo, 
                  registration_date, json.dumps(face_descriptor)))

        elif user_type == 'STUDENT':
            roll_no = data.get('rollNo')
            branch = data.get('branch')
            age = data.get('age')
            email = data.get('email')
            id_card_photo = data.get('idCardPhoto')

            if not roll_no:
                return jsonify({'error': 'Roll number is required for students'}), 400

            # Check duplicate roll number
            cursor.execute("SELECT id FROM students WHERE roll_no = %s", (roll_no,))
            if cursor.fetchone():
                return jsonify({'error': 'Roll number already exists'}), 409

            cursor.execute("""
                INSERT INTO students 
                (id, name, roll_no, email, branch, age, photo, id_card_photo, 
                 registration_date, face_descriptor)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (user_id, name, roll_no, email, branch, age, photo, id_card_photo, 
                  registration_date, json.dumps(face_descriptor)))

        else:  # GUEST
            cursor.execute("""
                INSERT INTO guests 
                (id, name, photo, registration_date, face_descriptor)
                VALUES (%s, %s, %s, %s, %s)
            """, (user_id, name, photo, registration_date, json.dumps(face_descriptor)))

        connection.commit()
        logger.info(f"User registered successfully: {user_type} - {name} (ID: {user_id})")

        return jsonify({
            'success': True,
            'message': 'Registration successful',
            'userId': user_id
        })

    except Exception as e:
        logger.error(f"Registration error: {e}", exc_info=True)
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'connection' in locals() and connection and connection.is_connected():
            connection.close()

@app.route('/api/recognize', methods=['POST'])
def recognize_face():
    """Recognize face from image and return user info"""
    try:
        data = request.json
        image_base64 = data.get('image')
        
        if not image_base64:
            return jsonify({'error': 'No image provided'}), 400
        
        # Extract face descriptor
        face_descriptor = extract_face_descriptor(image_base64)
        if not face_descriptor:
            return jsonify({'error': 'No face detected'}), 400
        
        current_desc = np.array(face_descriptor)
        threshold = 0.35
        best_match = None
        best_score = 0
        
        connection = get_db_connection()
        if not connection:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = connection.cursor(dictionary=True)
        
        # Search in all tables
        queries = [
            ("SELECT id, name, roll_no, email, branch, photo, face_descriptor, 'STUDENT' as type FROM students WHERE face_descriptor IS NOT NULL"),
            ("SELECT id, name, subject, photo, face_descriptor, 'TEACHER' as type FROM teachers WHERE face_descriptor IS NOT NULL"),
            ("SELECT id, name, photo, face_descriptor, 'GUEST' as type FROM guests WHERE face_descriptor IS NOT NULL")
        ]
        
        for query in queries:
            cursor.execute(query)
            for user in cursor.fetchall():
                if user['face_descriptor']:
                    existing_desc = np.array(json.loads(user['face_descriptor']))
                    similarity = cosine_similarity(current_desc, existing_desc)
                    if similarity > threshold and similarity > best_score:
                        best_score = similarity
                        best_match = user
        
        if best_match:
            best_match['confidence'] = best_score
            best_match.pop('face_descriptor', None)
            return jsonify(best_match)
        else:
            return jsonify({'error': 'No match found'}), 404
            
    except Exception as e:
        logger.error(f"Recognition error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

@app.route('/api/sessions', methods=['POST'])
def save_session():
    """Save session attendance data and send emails to absent students"""
    connection = None
    cursor = None
    try:
        data = request.json
        logger.info(f"Received session data: {data}")
        
        session_id = str(uuid.uuid4())
        subject = data.get('subject', 'Unknown Subject')
        start_time = data.get('startTime')
        end_time = data.get('endTime')
        stats = data.get('stats')
        
        if not stats:
            return jsonify({'error': 'No stats data provided'}), 400
        
        # Convert datetime strings
        start_time = datetime.fromisoformat(start_time.replace('Z', '+00:00')) if start_time else datetime.now()
        end_time = datetime.fromisoformat(end_time.replace('Z', '+00:00')) if end_time else datetime.now()
        
        connection = get_db_connection()
        if not connection:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = connection.cursor()
        
        # Insert session
        cursor.execute("""
            INSERT INTO sessions (id, subject, start_time, end_time, stats)
            VALUES (%s, %s, %s, %s, %s)
        """, (session_id, subject, start_time, end_time, json.dumps(stats, default=str)))
        connection.commit()
        
        logger.info(f"Session saved successfully with ID: {session_id}")
        
        # Send emails to absent students
        email_sent_count = 0
        if stats and 'studentSummaries' in stats:
            absent_students = [s for s in stats['studentSummaries'] if s.get('attendanceStatus') == 'ABSENT']
            logger.info(f"Found {len(absent_students)} absent students")
            
            session_date = datetime.now().strftime("%B %d, %Y at %I:%M %p")
            
            for student in absent_students:
                try:
                    cursor.execute("""
                        SELECT id, email, name, roll_no FROM students 
                        WHERE name = %s OR roll_no = %s
                    """, (student.get('name'), student.get('rollNo')))
                    student_data = cursor.fetchone()
                    
                    if student_data and student_data[1]:
                        student_id, student_email, student_name, student_roll = student_data
                        
                        email_sent = send_absentee_email(
                            recipient_email=student_email,
                            student_name=student_name,
                            roll_no=student_roll,
                            subject=subject,
                            session_date=session_date
                        )
                        
                        absentee_id = str(uuid.uuid4())
                        cursor.execute("""
                            INSERT INTO absentees 
                            (id, session_id, student_id, student_name, roll_no, email, subject, session_date, email_sent, email_sent_at)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """, (absentee_id, session_id, student_id, student_name, 
                              student_roll, student_email, subject, 
                              datetime.now(), email_sent, 
                              datetime.now() if email_sent else None))
                        
                        if email_sent:
                            email_sent_count += 1
                            
                except Exception as e:
                    logger.error(f"Error processing email for student {student.get('name')}: {e}")
            
            connection.commit()
        
        return jsonify({
            'success': True, 
            'sessionId': session_id, 
            'message': 'Session saved successfully',
            'emailsSent': email_sent_count
        })
        
    except Exception as e:
        logger.error(f"Save session error: {e}", exc_info=True)
        if connection:
            connection.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()

# Helper routes for getting data
@app.route('/api/teachers', methods=['GET'])
def get_teachers():
    """Get all teachers"""
    try:
        connection = get_db_connection()
        if not connection:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = connection.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, name, type, subject, photo, registration_date
            FROM teachers ORDER BY name
        """)
        
        return jsonify(cursor.fetchall())
        
    except Exception as e:
        logger.error(f"Get teachers error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

@app.route('/api/students', methods=['GET'])
def get_students():
    """Get all students"""
    try:
        connection = get_db_connection()
        if not connection:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = connection.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, name, roll_no, email, branch, age, photo, id_card_photo, registration_date
            FROM students ORDER BY name
        """)
        
        return jsonify(cursor.fetchall())
        
    except Exception as e:
        logger.error(f"Get students error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

@app.route('/api/guests', methods=['GET'])
def get_guests():
    """Get all guests"""
    try:
        connection = get_db_connection()
        if not connection:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = connection.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, name, photo, registration_date
            FROM guests ORDER BY name
        """)
        
        return jsonify(cursor.fetchall())
        
    except Exception as e:
        logger.error(f"Get guests error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

@app.route('/api/students/attendance', methods=['GET'])
def get_students_for_attendance():
    """Get all students with default attendance data"""
    try:
        connection = get_db_connection()
        if not connection:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = connection.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, name, roll_no, email, branch, age, photo, registration_date
            FROM students ORDER BY name
        """)
        
        students = cursor.fetchall()
        formatted_students = [{
            'id': s['id'],
            'name': s['name'],
            'rollNo': s['roll_no'],
            'email': s['email'],
            'branch': s['branch'],
            'age': s['age'],
            'photo': s['photo'],
            'registrationDate': s['registration_date'].isoformat() if s['registration_date'] else None,
            'engagementScore': 0,
            'emotion': 'Neutral',
            'action': 'Not Detected',
            'attendanceStatus': 'ABSENT',
            'phoneDetected': False,
            'sessionAlertCount': 0,
            'history': []
        } for s in students]
        
        return jsonify({'success': True, 'students': formatted_students})
        
    except Exception as e:
        logger.error(f"Get students for attendance error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

@app.route('/api/teachers/attendance', methods=['GET'])
def get_teachers_for_attendance():
    """Get all teachers with default attendance data"""
    try:
        connection = get_db_connection()
        if not connection:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = connection.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, name, type, subject, photo, registration_date
            FROM teachers ORDER BY name
        """)
        
        teachers = cursor.fetchall()
        formatted_teachers = [{
            'id': t['id'],
            'type': 'TEACHER',
            'name': t['name'],
            'subject': t['subject'],
            'photo': t['photo'],
            'registrationDate': t['registration_date'].isoformat() if t['registration_date'] else None,
            'engagementScore': 85,
            'engagementStatus': 'HIGH',
            'emotion': 'Focused',
            'action': 'Teaching',
            'attendanceStatus': 'PRESENT',
            'phoneDetected': False,
            'sessionAlertCount': 0,
            'history': []
        } for t in teachers]
        
        return jsonify({'success': True, 'teachers': formatted_teachers})
        
    except Exception as e:
        logger.error(f"Get teachers for attendance error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)