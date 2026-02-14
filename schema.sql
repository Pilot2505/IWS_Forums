-- Technical Sharing Forum Database Schema

-- Create Database (Optional, uncomment if needed)
-- CREATE DATABASE IF NOT EXISTS technical_forum;
-- USE technical_forum;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Posts Table
CREATE TABLE IF NOT EXISTS posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Comments Table
CREATE TABLE IF NOT EXISTS comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Sample Data
INSERT INTO users (username, email, password) VALUES 
('admin', 'admin@example.com', 'admin123'),
('student1', 'student1@school.edu', 'pass123');

INSERT INTO posts (user_id, title, content) VALUES 
(1, 'Welcome to the Technical Forum', 'This is the first post in our new sharing platform. Feel free to ask questions!'),
(2, 'How to use React Hooks?', 'I am learning React and I am confused about useEffect. Can someone help?');

INSERT INTO comments (post_id, user_id, content) VALUES 
(2, 1, 'Check out the official documentation or some tutorials on YouTube! hooks are great.');
