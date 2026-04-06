# IWS Forums Docker Guide

## Prerequisites

Make sure Docker Desktop is installed and running.

## Start the project

From the project root, run:

```bash
docker compose up --build
```

This will build the images, start MySQL, and launch both the server and client.

## Open the app

- Frontend: http://localhost:8080
- Backend API: http://localhost:3000

## Restart or rerun containers

If the containers are already running and you only want to bring them back up without rebuilding, use:

```bash
docker compose up -d
```

To restart everything:

```bash
docker compose restart
```

To restart only the backend server:

```bash
docker compose restart server
```

## Hot reload

The server uses nodemon and the compose file mounts the server source into the container, so saving files in `server/` should restart the backend automatically.

If hot reload does not trigger on Windows, recreate the server container:

```bash
docker compose up -d --force-recreate server
```

## Stop the project

To stop the containers:

```bash
docker compose down
```

This removes the running containers but keeps the database volume.

