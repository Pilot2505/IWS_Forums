# Technical Sharing Forum

A full-stack technical discussion forum built with React, Node.js (Express), and TailwindCSS.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) (v10 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Technical_Sharing_Forum
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## 🛠️ Development

Start the development server (both frontend and backend):

```bash
npm run dev
```

The app will be available at `http://localhost:8080`.

## 📦 Building for Production

1. Build both the client and server:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

The production server runs on port 3000 by default (configurable via `PORT` environment variable).

## 📁 Project Structure

- `client/`: React SPA frontend
- `server/`: Express API backend (currently uses mock in-memory storage)
- `shared/`: Shared types and utilities
- `dist/`: Compiled production files (after building)
- `schema.sql`: MySQL database initialization script

## 🧪 Testing & Quality

- **Run tests**: `npm test`
- **Type check**: `npm run typecheck`

## 🗄️ Database Setup

The project includes a `schema.sql` file to initialize your MySQL database.

1. Create a new MySQL database.
2. Run the script:
   ```bash
   mysql -u your_username -p your_database_name < schema.sql
   ```

The schema includes:
- `users`: User accounts and credentials
- `posts`: Forum discussion threads
- `comments`: Replies to posts

## 🎨 Tech Stack

- **Frontend**: React 18, React Router 6, TailwindCSS 3, Lucide Icons, Sonner (Toasts)
- **Backend**: Express.js
- **Tooling**: Vite, TypeScript, Vitest
- **Package Manager**: npm
