# IWS Forums

A technical forum app built with a React client, an Express server, and MySQL.

## Project Structure

- `client/` - React frontend
- `server/` - Express API
- `schema.sql` - database schema and seed data
- `docker-compose.yml` - MySQL container setup

## Requirements

- Node.js 20+
- npm
- Docker Desktop, if you want to run MySQL in Docker

## Setup

### 1. Install dependencies

From the project root:
```bash
cd server
npm install

cd ../client
npm install
```

### 2. Start MySQL
```bash
docker compose up -d
```

This starts the MySQL container defined in `docker-compose.yml`.

### 3. Configure the server

Make sure `server/.env` is set for local development:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=IWS

JWT_SECRET=your_secret_here
REFRESH_TOKEN_SECRET=your_refresh_secret_here
JWT_EXPIRES_IN=1d

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM="Tech Pulse"
CLIENT_URL=http://localhost:8080
```

## Run the App Locally

Open two terminals.

### Server
```bash
cd server
npm run dev
```

The server runs with nodemon.

### Client
```bash
cd client
npm run dev
```

The client runs on Vite.

## Access the App

- Frontend: http://localhost:8080
- Backend API: http://localhost:3000

## Database Notes

The database schema and seed data are in `schema.sql`.

If the MySQL volume already exists, the seed inserts will not run again automatically.

To reset the Docker MySQL database and reload the schema:
```bash
docker compose down -v
docker compose up -d
```

## Stop the App

- Stop the server with `Ctrl + C`
- Stop the client with `Ctrl + C`
- Stop MySQL Docker container with:
```bash
docker compose down
```

