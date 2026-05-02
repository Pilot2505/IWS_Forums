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
  delete_token_expires_at DATETIME DEFAULT NULL,
  password_reset_token_hash VARCHAR(255) DEFAULT NULL,
  password_reset_token_expires_at DATETIME DEFAULT NULL
) ENGINE=InnoDB;

-- Posts
CREATE TABLE IF NOT EXISTS posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  tags JSON DEFAULT NULL,
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

-- Bookmarks
CREATE TABLE IF NOT EXISTS bookmarks (
  user_id INT NOT NULL,
  post_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, post_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  actor_user_id INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  post_id INT DEFAULT NULL,
  comment_id INT DEFAULT NULL,
  message VARCHAR(255) NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
  INDEX idx_notifications_user_read_created (user_id, is_read, created_at)
) ENGINE=InnoDB;

SET time_zone = '+00:00';

-- =========================
-- USERS DATA
-- =========================
INSERT INTO users (id, username, fullname, email, password, bio, avatar, categories, created_at) VALUES
(3, 'pilot', 'Quan', 'pilot250504@gmail.com', '$2a$10$LvRULigNNg6KtXNsHNbO7.rKccqoZ.FovDGCIo8Z//G4P4U5Ll1aC', '', '/avatars/avatar.jpg', JSON_ARRAY('javascript', 'web', 'ai_ml'), '2026-02-15 21:11:31'),
(4, 'An', '', 'an@test.com', 'test123', '', '/avatars/avatar.jpg', JSON_ARRAY('devops', 'database'), '2026-02-15 21:11:31'),
(5, 'Kien', '', 'kien@test.com', 'test123', '', 'https://i.pravatar.cc/150?img=5', JSON_ARRAY('security', 'cloud'), '2026-02-15 21:11:31'),
(6, 'Linh', '', 'linh@test.com', 'test123', '', 'https://i.pravatar.cc/150?img=6', JSON_ARRAY('python', 'mobile'), '2026-02-15 21:11:31');

-- =========================
-- POSTS DATA
-- =========================
INSERT INTO posts (id, user_id, title, content, tags, created_at) VALUES
(9, 3, 'Getting Started with TypeScript in a Real Project',
'<img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80" alt="TypeScript code on screen" />
<p>TypeScript is one of the most practical upgrades you can make to a JavaScript project once the codebase starts growing. It adds static types on top of JavaScript, which helps catch mistakes before they reach the browser. In a small project, plain JavaScript feels fast and flexible. In a larger app with shared data models, API responses, and reusable components, TypeScript gives you structure.</p>
<p>A good way to start is to type only the parts that matter most: function inputs, return values, and component props. You do not need to convert everything at once. In fact, a gradual migration is usually the best approach because it keeps the team productive while still improving reliability.</p>
<p>TypeScript also makes editor support much better. Auto-complete becomes more accurate, refactoring becomes safer, and it is easier to understand what shape a piece of data should have. For a forum app, that matters when you are dealing with users, posts, comments, categories, and API responses coming from the server.</p>
<p>If you are learning modern web development, TypeScript is worth the effort. It is not just about stricter syntax. It is about writing code that scales better as the project becomes more complex.</p>',
JSON_ARRAY('typescript', 'react', 'frontend', 'web'),
'2026-04-22 08:00:00'),

(10, 4, 'How to Use Docker for Local Development Without Making Things Complicated',
'<img src="https://images.unsplash.com/photo-1605745341112-85968b19335b?auto=format&fit=crop&w=1200&q=80" alt="Docker containers on a laptop" />
<p>Docker is most useful when it removes friction instead of adding it. For local development, a very practical setup is to use Docker for MySQL while keeping the client and server running directly on your machine. That gives you one stable service that is easy to reset, while still letting you use fast local workflows for the frontend and backend.</p>
<p>This approach makes debugging easier. When the server runs locally, you can see console logs immediately and restart quickly with nodemon. When the client runs locally with Vite, hot reload works naturally. Meanwhile, Docker keeps the database isolated and consistent, so you do not need to install or configure MySQL manually on every machine.</p>
<p>The most important thing is consistency. If the schema or seed data changes, Docker makes it easier to recreate the same environment again. That is useful for assignments, demos, and team projects because everyone can work from the same database setup.</p>
<p>For beginners, Docker can feel intimidating at first, but you do not need to learn everything at once. Start with one container, one database, and one simple workflow. That is enough to understand why Docker is valuable in real projects.</p>',
JSON_ARRAY('docker', 'kubernetes', 'ci-cd', 'devops'),
'2026-04-22 08:10:00'),

(11, 5, 'React Hooks That Actually Matter in Everyday Projects',
'<img src="https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80" alt="React development setup" />
<p>React hooks are easiest to understand when you think about the problems they solve. useState helps a component remember something. useEffect handles work that happens after render, such as fetching data or syncing with localStorage. Custom hooks help you move repeated logic into a reusable function.</p>
<p>In a real project, the hooks you use most often are usually the simplest ones. A form needs state, a page needs data loading, and a button may need loading feedback. Hooks let you manage all of that without turning every component into a large class or a messy block of state logic.</p>
<p>Custom hooks are especially useful when the same logic appears in multiple screens. For example, if your app has repeated follow behavior, vote behavior, or user-loading behavior, extracting it into a hook keeps the code cleaner and easier to maintain.</p>
<p>The best rule is to keep hooks focused. A hook should do one job well. When hooks stay small, the project becomes easier to test, easier to debug, and much easier to read later.</p>',
JSON_ARRAY('react', 'hooks', 'state', 'javascript'),
'2026-04-22 08:20:00'),

(12, 6, 'JWT Authentication Explained for Real Applications',
'<img src="https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=1200&q=80" alt="Security and authentication concept" />
<p>JWT authentication is a common way to keep users logged in after they sign in. When the server verifies a username and password, it can issue a signed token. The frontend stores that token and sends it with future requests so the backend knows who the user is.</p>
<p>This works well because the server does not need to ask for the password on every request. Instead, it checks the token signature and trusts the claims inside the token if they are valid. That makes the system efficient and convenient for applications that need to protect many routes.</p>
<p>The important part is not just generating the token. It is handling the token carefully. Tokens should expire, they should be sent only when needed, and they should be protected from unnecessary exposure. If a token is stolen, the attacker can act as that user until the token expires or is invalidated.</p>
<p>JWT is useful, but it should always be paired with proper password hashing, protected routes, and sensible session handling. Good authentication is not about one magic tool. It is about using the tool correctly.</p>',
JSON_ARRAY('jwt', 'security', 'authentication', 'backend'),
'2026-04-22 08:30:00'),

(13, 3, 'Why MySQL Indexes Matter When Your App Starts Growing',
'<img src="https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=1200&q=80" alt="Database planning and query optimization" />
<p>Database performance often looks fine when the project is small, then suddenly starts slowing down as the data grows. One of the first tools to understand is indexing. A MySQL index helps the database find rows faster when you search, filter, or join on certain columns.</p>
<p>For a forum app, columns like username, email, post_id, and created_at are often good candidates for indexing. For example, login queries search by email or username all the time. Post lists may sort by date. Comments may load by post ID. Those are exactly the kinds of patterns where indexes help.</p>
<p>Indexes are not free, though. They use storage and can slow down inserts and updates a little bit, because the database has to maintain them. That is why it is better to add indexes where they solve an actual problem instead of adding them everywhere just because you can.</p>
<p>A good habit is to think about the queries your app really runs. If you see the same WHERE clause, JOIN condition, or ORDER BY column over and over, that is usually where an index belongs.</p>',
JSON_ARRAY('mysql', 'database', 'indexing', 'sql'),
'2026-04-22 08:40:00'),

(14, 4, 'Using Vite Proxy Correctly in a Frontend and Backend Setup',
'<img src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80" alt="Frontend development on a laptop" />
<p>When you build a React frontend and a separate backend, a Vite proxy can save you a lot of trouble during development. Instead of calling the backend with a full URL everywhere, the frontend can use paths like /api/login or /api/posts, and Vite forwards those requests to the correct server.</p>
<p>This keeps the code cleaner and makes development easier. You do not need to rewrite every fetch call when the backend address changes. You also avoid many cross-origin issues because the browser talks to the Vite server, and Vite handles the forwarding behind the scenes.</p>
<p>The main thing to keep in mind is that the proxy target must match the way your backend is running. If the server is local, the proxy should point to localhost. If the server is inside Docker or another service environment, the target must match that setup instead.</p>
<p>Once configured correctly, the proxy becomes one of those small tools that quietly improves the whole developer experience.</p>',
JSON_ARRAY('vite', 'frontend', 'api', 'web'),
'2026-04-22 08:50:00'),

(15, 5, 'Best Practices for Uploading and Storing Images in a Forum App',
'<img src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80" alt="Image upload and coding workflow" />
<p>Image upload features seem simple until you start thinking about file size, file type, cleanup, and storage. A forum app usually needs uploads for avatars, post images, or embedded content. The first step is to validate the file before saving it. That means checking the MIME type, limiting the file size, and rejecting anything that does not belong.</p>
<p>In many projects, the best approach is to store the image on disk and save only the file path in the database. That keeps the database lean and makes it easier to serve or remove files later. It also means the frontend can render the image URL directly once the upload succeeds.</p>
<p>Cleanup is just as important as upload. If users replace avatars or delete accounts, old images should not stay forever unless there is a reason to keep them. Otherwise the server slowly fills up with files that no one uses anymore.</p>
<p>Good image handling is mostly about discipline. Validate early, store consistently, and clean up when records are removed. Those small habits make the feature much more reliable in the long run.</p>',
JSON_ARRAY('upload', 'images', 'storage', 'backend'),
'2026-04-22 09:00:00'),

(16, 6, 'How to Structure a Full-Stack Forum Project Cleanly',
'<img src="https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=1200&q=80" alt="Full stack project structure" />
<p>A forum project becomes much easier to manage when the frontend, backend, and database responsibilities are clearly separated. The client should focus on presentation and user interaction. The server should handle validation, authentication, business logic, and database access. The database should store the actual data in a structured way that supports the rest of the app.</p>
<p>This separation also makes debugging easier. If a screen looks wrong, the issue is probably in the client. If the request fails, the issue may be in the backend. If the data itself is wrong, the problem may be in the schema or seed data. Knowing where each responsibility lives saves a lot of time.</p>
<p>It also helps to keep your project setup simple during development. Running the client and server locally while using Docker only for the database is a practical choice because it reduces friction. You can edit files, see logs, and restart services without needing to rebuild everything every time.</p>
<p>Good structure is not about making the project bigger. It is about making the project easier to understand, change, and maintain. That matters in any codebase, even a student project.</p>',
JSON_ARRAY('full-stack', 'architecture', 'backend', 'frontend'),
'2026-04-22 09:10:00'),

(17, 4, 'Cursor Pagination for Infinite Scroll Feeds',
'<img src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80" alt="Code review on a laptop" />
<p>Cursor pagination keeps feed requests stable as new records are added. Instead of relying on page numbers, the client asks for the next batch after the last item it already has.</p>
<p>This sample row helps verify that the next cursor continues from the correct point when the list grows beyond the first page.</p>',
JSON_ARRAY('pagination', 'cursor', 'feed', 'api'),
'2026-04-22 09:20:00'),

(18, 5, 'Designing Notification Lists That Stay Useful',
'<img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80" alt="Notifications on a screen" />
<p>A notification list works best when it stays readable and avoids unnecessary repetition. The cursor test is easier when there are enough rows to move past the first page and fetch a second one.</p>
<p>Use this row to verify that older notifications still appear in the correct order after the first batch is loaded.</p>',
JSON_ARRAY('notifications', 'ux', 'cursor', 'api'),
'2026-04-22 09:25:00'),

(19, 6, 'Bookmark Lists That Need Pagination',
'<img src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80" alt="Laptop with code" />
<p>Saved posts often grow faster than a user expects, so bookmark lists need the same cursor behavior as feeds. This entry helps confirm that the load-more flow keeps working once the first page is full.</p>
<p>It is useful for checking that the next cursor advances when the list contains more items than the initial limit.</p>',
JSON_ARRAY('bookmarks', 'pagination', 'saved', 'cursor'),
'2026-04-22 09:30:00'),

(20, 4, 'Testing Cursor Based Lists with Seed Data',
'<img src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80" alt="Developer workspace" />
<p>Seed data is most helpful when it is large enough to force edge cases. A list with only a few rows does not tell you much about cursor pagination.</p>
<p>This row gives the bookmark page another item beyond the first ten so the second request can be verified in the UI.</p>',
JSON_ARRAY('testing', 'seed', 'pagination', 'ui'),
'2026-04-22 09:35:00'),

(21, 5, 'Avoiding Noisy Notification Feeds',
'<img src="https://images.unsplash.com/photo-1526378722484-bd91ca387e72?auto=format&fit=crop&w=1200&q=80" alt="Planning board" />
<p>Notification feeds become much easier to test once they include more than one screenful of rows. That makes it possible to check whether the cursor points to the correct last record.</p>
<p>This extra post is here so the notification samples can extend well beyond the default first load size.</p>',
JSON_ARRAY('notifications', 'feed', 'cursor', 'testing'),
'2026-04-22 09:40:00'),

(22, 6, 'Making Saved Content Lists Easy to Browse',
'<img src="https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80" alt="Coding environment" />
<p>Saved content lists should be predictable when the user returns later. A cursor test is more reliable when there are enough items to span two pages.</p>
<p>This final post gives the bookmark dataset enough variety to load a second page with the next cursor.</p>',
JSON_ARRAY('bookmarks', 'saved', 'ux', 'pagination'),
'2026-04-22 09:45:00'),

(23, 3, 'Building Reusable UI Components in a Forum App',
'<img src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80" alt="Reusable UI components" />
<p>Reusable UI components help keep a forum codebase consistent as the number of screens grows. Buttons, cards, modals, and list rows can all share the same structure while still adapting to each page.</p>
<p>Once a component is used in multiple places, even a small improvement can have a big impact on maintainability.</p>',
JSON_ARRAY('react', 'ui', 'components', 'frontend'),
'2026-04-22 09:50:00'),

(24, 3, 'Writing Better API Responses for Cleaner Frontends',
'<img src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80" alt="API response design" />
<p>Clear API responses make frontend code easier to read and easier to maintain. When the shape of the payload stays predictable, the UI can focus on rendering instead of defensive checks.</p>
<p>That is especially useful in a forum app where lists, feeds, and detail pages all depend on consistent response data.</p>',
JSON_ARRAY('api', 'backend', 'json', 'frontend'),
'2026-04-22 10:00:00'),

(25, 3, 'Managing Content Growth in a Forum Database',
'<img src="https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=1200&q=80" alt="Database tables and growth" />
<p>As a forum grows, the database starts carrying more responsibility. Posts, comments, votes, bookmarks, and notifications all add up, so it helps to keep the schema simple and the relationships clear.</p>
<p>Good structure early on makes later changes much less painful.</p>',
JSON_ARRAY('database', 'schema', 'sql', 'scaling'),
'2026-04-22 10:10:00'),

(26, 3, 'Keeping User Interactions Fast and Predictable',
'<img src="https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=1200&q=80" alt="Fast user interactions" />
<p>Fast user interactions matter because people expect a forum to respond immediately. Small optimizations in fetch logic, pagination, and feedback states make the app feel much smoother.</p>
<p>Even a simple loading state can make a screen feel more intentional.</p>',
JSON_ARRAY('ux', 'performance', 'pagination', 'frontend'),
'2026-04-22 10:20:00');

-- =========================
-- COMMENTS DATA
-- =========================
INSERT INTO comments (id, post_id, user_id, parent_id, content, created_at) VALUES
(31, 9, 4, NULL, 'This is a strong intro to TypeScript. I like the focus on gradual migration instead of rewriting everything at once.', '2026-04-22 09:00:00'),
(32, 9, 5, 31, 'Agreed. Starting small is the only realistic way to introduce TypeScript into an existing project.', '2026-04-22 09:05:00'),
(33, 10, 3, NULL, 'Using Docker only for the database is a clean setup for local development. It keeps the workflow simple and predictable.', '2026-04-22 09:10:00'),
(34, 11, 6, NULL, 'useState, useEffect, and custom hooks are the three hooks I reach for most often in real apps.', '2026-04-22 09:15:00'),
(35, 12, 4, NULL, 'This explains JWT clearly. The part about balancing expiration time is especially important.', '2026-04-22 09:20:00'),
(36, 13, 5, NULL, 'Indexes make a huge difference once the table grows. Great explanation of the tradeoff between reads and writes.', '2026-04-22 09:25:00'),
(37, 14, 3, NULL, 'The Vite proxy section is practical. It is one of those settings that removes a lot of development friction.', '2026-04-22 09:30:00'),
(38, 15, 6, NULL, 'The cleanup reminder is important. Upload features always need a deletion strategy too.', '2026-04-22 09:35:00'),
(39, 16, 4, NULL, 'This is a good summary of full-stack project structure. Separation of concerns really makes debugging easier.', '2026-04-22 09:40:00'),
(40, 9, 4, NULL, 'Good example for testing cursor pagination on the feed.', '2026-04-22 09:20:00'),
(41, 13, 5, NULL, 'This post works well as a second page sample in the feed.', '2026-04-22 09:25:00'),
(42, 9, 6, NULL, 'Helpful when checking that newer notifications appear first.', '2026-04-22 09:30:00'),
(43, 13, 4, NULL, 'The cursor flow is easier to verify with extra rows like this.', '2026-04-22 09:35:00'),
(44, 9, 5, NULL, 'Adding more seed data makes pagination bugs easier to catch.', '2026-04-22 09:40:00'),
(45, 10, 4, 33, 'Nice reference point for reply notifications.', '2026-04-22 09:45:00'),
(46, 10, 5, 33, 'This should create another notification for the same comment.', '2026-04-22 09:50:00'),
(47, 10, 6, 33, 'Good for testing repeated reply activity.', '2026-04-22 09:55:00'),
(48, 23, 4, NULL, 'Nice example of a reusable component focused post.', '2026-04-22 10:05:00'),
(49, 23, 5, 48, 'This reply makes a good nested comment sample.', '2026-04-22 10:08:00'),
(50, 24, 6, NULL, 'Clear API responses make the frontend much easier to maintain.', '2026-04-22 10:12:00'),
(51, 24, 4, 50, 'Agree. Consistent payload shapes save a lot of time.', '2026-04-22 10:16:00'),
(52, 25, 5, NULL, 'The database structure section is useful for a growing forum.', '2026-04-22 10:20:00'),
(53, 25, 6, 52, 'A clean schema matters once the app has more traffic.', '2026-04-22 10:24:00'),
(54, 26, 4, NULL, 'Good reminder that UI feedback changes how a product feels.', '2026-04-22 10:28:00'),
(55, 17, 5, NULL, 'Cursor pagination is a solid choice for long feeds.', '2026-04-22 10:32:00'),
(56, 18, 6, NULL, 'Notification lists get messy fast without a clear structure.', '2026-04-22 10:36:00'),
(57, 19, 4, NULL, 'Bookmarks are one of the easiest places to test load-more behavior.', '2026-04-22 10:40:00'),
(58, 20, 5, NULL, 'Seed data like this is great for catching edge cases.', '2026-04-22 10:44:00'),
(59, 21, 6, NULL, 'Adding more rows makes pagination behavior easier to trust.', '2026-04-22 10:48:00');

-- =========================
-- FOLLOWERS DATA
-- =========================
INSERT INTO followers (follower_id, following_id, created_at, last_seen) VALUES
(3, 4, '2026-04-22 07:45:00', '2026-04-22 07:45:00'),
(3, 5, '2026-04-22 07:46:00', '2026-04-22 07:46:00'),
(3, 6, '2026-04-22 07:47:00', NULL),
(4, 3, '2026-04-22 07:48:00', '2026-04-22 08:05:00'),
(4, 5, '2026-04-22 07:49:00', NULL),
(5, 3, '2026-04-22 07:50:00', '2026-04-22 08:15:00'),
(5, 4, '2026-04-22 07:51:00', '2026-04-22 07:51:00'),
(6, 3, '2026-04-22 07:52:00', NULL),
(6, 4, '2026-04-22 07:53:00', '2026-04-22 07:53:00');

-- =========================
-- POST VOTES DATA
-- =========================
INSERT INTO post_votes (post_id, user_id, vote, created_at, updated_at) VALUES
(9, 3, 1, '2026-04-22 08:05:00', '2026-04-22 08:05:00'),
(9, 4, 1, '2026-04-22 08:06:00', '2026-04-22 08:06:00'),
(10, 5, 1, '2026-04-22 08:12:00', '2026-04-22 08:12:00'),
(11, 6, 1, '2026-04-22 08:22:00', '2026-04-22 08:22:00'),
(12, 3, 1, '2026-04-22 08:32:00', '2026-04-22 08:32:00'),
(12, 4, -1, '2026-04-22 08:33:00', '2026-04-22 08:33:00'),
(13, 5, 1, '2026-04-22 08:42:00', '2026-04-22 08:42:00'),
(14, 6, 1, '2026-04-22 08:52:00', '2026-04-22 08:52:00'),
(15, 3, 1, '2026-04-22 09:02:00', '2026-04-22 09:02:00'),
(16, 4, 1, '2026-04-22 09:12:00', '2026-04-22 09:12:00');

-- =========================
-- BOOKMARKS DATA
-- =========================
INSERT INTO bookmarks (user_id, post_id, created_at) VALUES
(3, 10, '2026-04-22 08:15:00'),
(3, 13, '2026-04-22 08:45:00'),
(3, 15, '2026-04-22 09:05:00'),
(3, 9, '2026-04-22 09:15:00'),
(3, 11, '2026-04-22 09:20:00'),
(3, 12, '2026-04-22 09:25:00'),
(3, 14, '2026-04-22 09:30:00'),
(3, 16, '2026-04-22 09:35:00'),
(3, 17, '2026-04-22 09:40:00'),
(3, 18, '2026-04-22 09:45:00'),
(3, 19, '2026-04-22 09:50:00'),
(3, 20, '2026-04-22 09:55:00'),
(3, 21, '2026-04-22 10:00:00'),
(3, 22, '2026-04-22 10:05:00'),
(4, 9, '2026-04-22 08:08:00'),
(4, 14, '2026-04-22 08:55:00'),
(5, 12, '2026-04-22 08:35:00'),
(5, 13, '2026-04-22 08:46:00'),
(6, 11, '2026-04-22 08:25:00'),
(6, 16, '2026-04-22 09:14:00');

-- =========================
-- NOTIFICATIONS DATA
-- =========================
INSERT INTO notifications (id, user_id, actor_user_id, type, post_id, comment_id, message, is_read, created_at) VALUES
(1, 3, 4, 'follow', NULL, NULL, 'started following you', 1, '2026-04-22 07:45:00'),
(2, 4, 3, 'follow', NULL, NULL, 'started following you', 1, '2026-04-22 07:48:00'),
(3, 3, 4, 'comment', 9, 31, 'commented on your post', 0, '2026-04-22 09:00:00'),
(4, 4, 5, 'comment', 10, 33, 'commented on your post', 0, '2026-04-22 09:10:00'),
(5, 5, 6, 'comment', 11, 34, 'commented on your post', 1, '2026-04-22 09:15:00'),
(6, 4, 5, 'comment_reply', 9, 32, 'replied to your comment', 0, '2026-04-22 09:05:00'),
(7, 3, 4, 'comment', 9, 40, 'commented on your post', 0, '2026-04-22 09:20:00'),
(8, 3, 5, 'comment', 13, 41, 'commented on your post', 1, '2026-04-22 09:25:00'),
(9, 3, 6, 'comment', 9, 42, 'commented on your post', 0, '2026-04-22 09:30:00'),
(10, 3, 4, 'comment', 13, 43, 'commented on your post', 0, '2026-04-22 09:35:00'),
(11, 3, 5, 'comment', 9, 44, 'commented on your post', 1, '2026-04-22 09:40:00'),
(12, 3, 4, 'comment_reply', 10, 45, 'replied to your comment', 0, '2026-04-22 09:45:00'),
(13, 3, 5, 'comment_reply', 10, 46, 'replied to your comment', 0, '2026-04-22 09:50:00'),
(14, 3, 6, 'comment_reply', 10, 47, 'replied to your comment', 1, '2026-04-22 09:55:00'),
(15, 3, 4, 'follow', NULL, NULL, 'started following you', 0, '2026-04-22 10:00:00'),
(16, 3, 5, 'comment', 9, 40, 'commented on your post', 0, '2026-04-22 10:05:00'),
(17, 3, 6, 'comment_reply', 10, 45, 'replied to your comment', 1, '2026-04-22 10:10:00'),
(18, 3, 4, 'comment', 13, 41, 'commented on your post', 0, '2026-04-22 10:15:00'),
(19, 3, 5, 'follow', NULL, NULL, 'started following you', 1, '2026-04-22 10:20:00'),
(20, 3, 6, 'comment_reply', 10, 46, 'replied to your comment', 0, '2026-04-22 10:25:00'),
(21, 3, 4, 'comment', 9, 42, 'commented on your post', 0, '2026-04-22 10:30:00'),
(22, 3, 5, 'comment', 13, 43, 'commented on your post', 1, '2026-04-22 10:35:00'),
(23, 3, 6, 'follow', NULL, NULL, 'started following you', 0, '2026-04-22 10:40:00'),
(24, 3, 4, 'comment_reply', 10, 47, 'replied to your comment', 0, '2026-04-22 10:45:00');