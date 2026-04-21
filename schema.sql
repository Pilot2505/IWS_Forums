-- Create database
CREATE DATABASE IF NOT EXISTS IWS;
USE IWS;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  fullname VARCHAR(100),
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  bio TEXT,
  avatar VARCHAR(255),
  categories JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  delete_requested_at DATETIME DEFAULT NULL,
  delete_confirmed_at DATETIME DEFAULT NULL,
  delete_after_at DATETIME DEFAULT NULL,
  delete_token_hash VARCHAR(255) DEFAULT NULL,
  delete_token_expires_at DATETIME DEFAULT NULL
) ENGINE=InnoDB;

-- Posts
CREATE TABLE IF NOT EXISTS posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  user_id INT NOT NULL,
  parent_id INT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Followers
CREATE TABLE IF NOT EXISTS followers (
  follower_id INT NOT NULL,
  following_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_seen DATETIME DEFAULT NULL,
  PRIMARY KEY (follower_id, following_id),
  FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
  CHECK (follower_id <> following_id)
) ENGINE=InnoDB;

-- Votes
CREATE TABLE IF NOT EXISTS post_votes (
  post_id INT NOT NULL,
  user_id INT NOT NULL,
  vote TINYINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (post_id, user_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CHECK (vote IN (-1, 1))
) ENGINE=InnoDB;

-- =========================
-- USERS DATA
-- =========================
INSERT INTO users (id, username, fullname, email, password, created_at, bio, avatar) VALUES
(3, 'pilot', 'Quan', 'pilot250504@gmail.com', '$2a$10$LvRULigNNg6KtXNsHNbO7.rKccqoZ.FovDGCIo8Z//G4P4U5Ll1aC', '2026-02-15 21:11:31', '', '/avatars/avatar.jpg'),
(4, 'An', '', 'an@test.com', 'test123', '2026-02-15 21:11:31', '', '/avatars/avatar.jpg'),
(5, 'Kien', '', 'kien@test.com', 'test123', '2026-02-15 21:11:31', '', 'https://i.pravatar.cc/150?img=5'),
(6, 'Linh', '', 'linh@test.com', 'test123', '2026-02-15 21:11:31', '', 'https://i.pravatar.cc/150?img=6'),
(10, 'client', 'Client', 'client@email.com', '$2b$10$uefLTMdHHNsyW4p5/WOyyuDSqabkPcqxqNJmxPdfNDhIGO4man8tu', '2026-02-22 22:42:53', '', '/avatars/1771774973654-11343870.ico'),
(11, 'Testing', 'Testing', 'test@testgmail.com', '$2b$10$Q4N5xUBOZDhu9xEexR5jLexM9Sv73IoSXxArTVh7mH/Mtxy1coLY6', '2026-02-24 13:07:23', '', NULL),
(12, 'Quan', 'Minh Quan', 'quanminh250504@gmail.com', '$2b$10$paafh0v9dwZod2lZBTCsLusbu8mSjbYo2sO4X5huJC5PzoHJGgVXG', '2026-03-10 19:40:51', '', '/avatars/1773146450845-820990629.jpg');


-- =========================
-- POSTS DATA
-- =========================
INSERT INTO posts (id, user_id, title, content, created_at) VALUES
(6, 4, 'How to Learn Java Effectively',
'Java is one of the most widely used programming languages in the world. It powers enterprise systems, Android apps, and backend services. To master Java, you need to understand OOP concepts, memory management, multithreading, and design patterns.',
'2026-02-15 21:15:25'),

(7, 5, 'React Best Practices for Beginners',
'React is powerful but can feel overwhelming at first. Start by understanding components, props, and state. Keep your components small and reusable. Avoid unnecessary re-renders.',
'2026-02-15 21:15:25'),

(8, 6, 'Understanding SQL Joins',
'SQL joins allow you to combine data from multiple tables. INNER JOIN returns matching rows. LEFT JOIN returns all rows from the left table. RIGHT JOIN returns all rows from the right table.',
'2026-02-15 21:15:25'),

(27, 4, 'Postman', 'Testing', '2026-02-24 12:58:27'),
(28, 3, 'Test2', 'Test2', '2026-02-24 21:57:11'),
(30, 3, 'Test4', 'Test4', '2026-02-24 22:11:04'),
(31, 4, 'Postman', 'Testing', '2026-02-24 22:31:12'),
(32, 4, 'Postman', 'Testing', '2026-02-24 22:31:19'),
(40, 3, 'saf', 'asf', '2026-03-03 20:06:49');


-- =========================
-- COMMENTS DATA
-- =========================
INSERT INTO comments (id, post_id, user_id, parent_id, content, created_at) VALUES
(31, 8, 4, NULL, 'Đây là comment mẫu từ user 4', '2026-02-22 22:07:13'),
(42, 40, 3, NULL, 'test', '2026-03-10 19:10:40');


-- =========================
-- FOLLOWERS DATA
-- =========================
INSERT INTO followers (follower_id, following_id, created_at, last_seen) VALUES
(3,4,'2026-02-24 22:30:38','2026-03-10 19:09:53'),
(3,5,'2026-02-18 22:15:36','2026-02-22 17:04:33'),
(3,6,'2026-02-24 22:19:16','2026-02-24 22:19:16'),
(3,10,'2026-02-24 22:19:36','2026-02-24 22:19:46'),
(3,11,'2026-02-24 22:19:44','2026-02-24 22:19:44'),
(4,3,'2026-02-18 22:15:36',NULL),
(5,3,'2026-02-18 22:15:36',NULL),
(5,6,'2026-02-18 22:15:36',NULL);

-- =========================
-- POST VOTES DATA
-- =========================
INSERT INTO post_votes (post_id, user_id, vote, created_at, updated_at) VALUES
(6, 3, 1, '2026-03-10 19:00:00', '2026-03-10 19:00:00'),
(6, 4, -1, '2026-03-10 19:01:00', '2026-03-10 19:01:00'),
(7, 3, 1, '2026-03-10 19:02:00', '2026-03-10 19:02:00'),
(8, 5, 1, '2026-03-10 19:03:00', '2026-03-10 19:03:00'),
(40, 4, 1, '2026-03-10 19:04:00', '2026-03-10 19:04:00');