import os
import cv2
import tkinter as tk
from tkinter import filedialog, messagebox
import face_recognition

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'root',
    'database': 'face_recognition_system'
}

# Directories
GALLERY_DIR = r"gallery_images"
TEST_DIR = r"test_images"

if not os.path.exists(GALLERY_DIR):
    os.makedirs(GALLERY_DIR)
if not os.path.exists(TEST_DIR):
    os.makedirs(TEST_DIR)

def get_db_connection():
    """Create database connection"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except Error as e:
        messagebox.showerror("Database Error", f"Error connecting to database: {e}")
        return None

def save_face_descriptor_to_db(teacher_id, name, subject, photo_path, face_encoding):
    """Save teacher data with face descriptor to database"""
    connection = get_db_connection()
    if not connection:
        return False
    
    try:
        cursor = connection.cursor()
        
        # Convert face encoding to list (JSON serializable)
        face_descriptor_list = face_encoding.tolist() if isinstance(face_encoding, np.ndarray) else face_encoding
        
        # Read image as base64
        import base64
        with open(photo_path, "rb") as image_file:
            photo_base64 = base64.b64encode(image_file.read()).decode('utf-8')
            photo_data = f"data:image/jpeg;base64,{photo_base64}"
        
        # Insert or update teacher record
        sql = """
        INSERT INTO teachers (id, name, type, subject, photo, registration_date, face_descriptor)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        subject = VALUES(subject),
        photo = VALUES(photo),
        face_descriptor = VALUES(face_descriptor)
        """
        
        registration_date = datetime.now()
        values = (teacher_id, name, "TEACHER", subject, photo_data, registration_date, json.dumps(face_descriptor_list))
        
        cursor.execute(sql, values)
        connection.commit()
        
        return True
        
    except Error as e:
        messagebox.showerror("Database Error", f"Error saving to database: {e}")
        return False
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

def get_all_teachers_from_db():
    """Retrieve all teachers from database"""
    connection = get_db_connection()
    if not connection:
        return []
    
    try:
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT id, name, subject, face_descriptor FROM teachers")
        teachers = cursor.fetchall()
        
        # Parse JSON face descriptors
        for teacher in teachers:
            if teacher['face_descriptor']:
                teacher['face_descriptor'] = np.array(json.loads(teacher['face_descriptor']))
        
        return teachers
        
    except Error as e:
        messagebox.showerror("Database Error", f"Error retrieving teachers: {e}")
        return []
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()    


# Function to enroll face
def enroll_face():
    file_path = filedialog.askopenfilename(
        title="Select an Image for Enrollment",
        filetypes=[("Image Files", "*.jpg;*.png;*.jpeg")]
    )
    if not file_path:
        return

    img = cv2.imread(file_path)
    face_locations = face_recognition.face_locations(img)

    if len(face_locations) == 0:
        messagebox.showerror("Error", "No face detected in the image.")
        return

    # Save to gallery
    filename = os.path.basename(file_path)
    save_path = os.path.join(GALLERY_DIR, filename)
    cv2.imwrite(save_path, img)

    messagebox.showinfo("Success", f"Face enrolled and saved as {save_path}")


# Function to recognize face from image
def recognize_from_image():
    file_path = filedialog.askopenfilename(
        title="Select an Image for Recognition",
        filetypes=[("Image Files", "*.jpg;*.png;*.jpeg")]
    )
    if not file_path:
        return

    test_img = face_recognition.load_image_file(file_path)
    test_encodings = face_recognition.face_encodings(test_img)

    if len(test_encodings) == 0:
        messagebox.showerror("Error", "No face detected in the test image.")
        return

    test_encoding = test_encodings[0]

    # Compare with gallery
    for file in os.listdir(GALLERY_DIR):
        gallery_img_path = os.path.join(GALLERY_DIR, file)
        gallery_img = face_recognition.load_image_file(gallery_img_path)
        gallery_encodings = face_recognition.face_encodings(gallery_img)

        if len(gallery_encodings) == 0:
            continue

        result = face_recognition.compare_faces([gallery_encodings[0]], test_encoding)

        if result[0]:
            messagebox.showinfo("Result", f"Match Found: {file}")
            return

    messagebox.showinfo("Result", "No Match Found.")


# Function to recognize face from webcam
def recognize_from_webcam():
    known_encodings = []
    known_names = []

    # Load all gallery images
    for file in os.listdir(GALLERY_DIR):
        gallery_img_path = os.path.join(GALLERY_DIR, file)
        gallery_img = face_recognition.load_image_file(gallery_img_path)
        gallery_encodings = face_recognition.face_encodings(gallery_img)

        if len(gallery_encodings) > 0:
            known_encodings.append(gallery_encodings[0])
            known_names.append(file)

    if not known_encodings:
        messagebox.showerror("Error", "No enrolled faces in gallery.")
        return

    cap = cv2.VideoCapture(0)
    messagebox.showinfo("Info", "Press 'q' to quit webcam.")

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        face_locations = face_recognition.face_locations(rgb_frame)
        face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)

        for (top, right, bottom, left), face_encoding in zip(face_locations, face_encodings):
            matches = face_recognition.compare_faces(known_encodings, face_encoding)
            name = "Unknown"

            if True in matches:
                match_index = matches.index(True)
                name = known_names[match_index]

            cv2.rectangle(frame, (left, top), (right, bottom), (0, 255, 0), 2)
            cv2.putText(frame, name, (left, top - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)

        cv2.imshow("Webcam Recognition", frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()


# GUI Setup
root = tk.Tk()
root.title("Face Recognition App")
root.geometry("400x300")

tk.Label(root, text="Face Recognition System", font=("Arial", 16, "bold")).pack(pady=20)

tk.Button(root, text="Enroll Face", width=20, height=2, command=enroll_face).pack(pady=10)
tk.Button(root, text="Recognize from Image", width=20, height=2, command=recognize_from_image).pack(pady=10)
tk.Button(root, text="Recognize from Webcam", width=20, height=2, command=recognize_from_webcam).pack(pady=10)

root.mainloop()
