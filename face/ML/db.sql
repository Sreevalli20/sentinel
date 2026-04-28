-- Create the database (only if not already created)
CREATE DATABASE IF NOT EXISTS face_login_db;

-- Use the database
USE face_login_db;

-- Create the users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL
);
