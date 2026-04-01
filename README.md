## Running the Project with Docker

### Prerequisites

Make sure **Docker Desktop** is installed and running on your machine.

---

### 1. Build and Start the Containers

From the root folder of the project, run:

```
docker-compose up --build
```

This command will:

* Build the Docker images for both the **client** and **server**
* Start the containers defined in `docker-compose.yml`

---

### 2. Access the Application

After the containers start successfully:

Frontend (Vite):

```
http://localhost:8080
```

Backend API:

```
http://localhost:3000
```

---

### 3. Stop the Containers

To stop the application, run:

```
docker compose down
```

This will stop and remove the running containers.

