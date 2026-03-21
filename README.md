# Vesta

Vesta is a full-stack smart home management app that lets you monitor and control IoT devices across different houses and rooms. The core focus of this project is real-time communication—using MQTT and WebSockets to make sure device statuses update instantly on the frontend. 

It also handles multi-user setups, so you can share access to a home using invite codes and restrict what certain users (like kids) can do.

---

## Features

* **Multi-Home Support:** Set up multiple houses and invite other users to them via unique codes.
* **Real-Time Control:** Instantly toggle and monitor IoT devices via an MQTT broker and WebSocket connections.
* **Room Layouts:** Group devices logically into customizable rooms (Living Room, Kitchen, Garage, etc.).
* **Access Control:** Basic role-based access separating "Admin" users from "Child" accounts.
* **Dashboard Analytics:** Quick visual stats and charts for device activity.
* **Responsive UI:** A clean, mobile-friendly interface built with Material-UI.

---

## Tech Stack

### Frontend
* **Core:** React 19 (TypeScript), Vite, React Router
* **UI:** Material-UI (MUI)
* **Forms & Data:** Formik, Yup, Axios
* **Real-time:** WebSockets

### Backend
* **Core:** NestJS, TypeScript
* **Database:** PostgreSQL with Prisma ORM
* **IoT/Real-time:** MQTT, WebSocket Gateway
* **Security:** JWT auth, bcrypt, HTTPS/SSL
* **API Docs:** Swagger

### Tooling
* **Monorepo:** Nx
* **Testing:** Jest, Vitest
* **Formatting:** ESLint, Prettier

---

## Architecture

The project is structured as an **Nx monorepo** to keep the frontend and backend closely aligned. 

```text
vesta/
├── apps/vesta/          # React frontend
│   ├── src/
│   │   ├── pages/       # Views: Dashboard, Homes, Rooms, Auth, etc.
│   │   ├── components/  # Shared UI elements
│   │   ├── context/     # Auth state management
│   │   ├── services/    # API calls
│   │   └── hooks/       # Custom React hooks
├── api/                 # NestJS backend
│   ├── src/
│   │   ├── app/
│   │   │   ├── auth/    # JWT Authentication
│   │   │   ├── homes/   # Home management & invites
│   │   │   ├── rooms/   # Room organization
│   │   │   └── devices/ # MQTT integration & device logic
│   └── prisma/          # Database schema and migrations
└── api-e2e/             # End-to-end tests
```

---

## Technical Highlights

* **REST + WebSockets:** Uses a standard REST API for CRUD operations (homes, rooms, users) but offloads device state changes to bidrectional WebSockets for zero-refresh updates.
* **IoT Integration:** Acts as a bridge between the web client and an external MQTT broker to physically control smart devices.
* **Database Design:** Relational Prisma schema handling cascading deletes (e.g., deleting a home removes its rooms and devices) and unique constraints.
* **Microservices-ready:** Built with NestJS modules, making it easy to break out the MQTT or Auth services later if needed.

### Database Schema Overview
* **Users:** Handles auth credentials and roles.
* **Home:** Groups rooms and stores invite codes.
* **Room:** Tracks floor level and room type.
* **Devices:** Stores device metadata, current status, and ties back to specific rooms.

---

## Getting Started

### Prerequisites
You'll need Node.js (v20+), a running PostgreSQL instance, and an MQTT broker to get everything working locally.

### Local Setup

```bash
# Install dependencies
npm install

# Push the schema to your database
cd api
npx prisma migrate dev

# Start the dev servers
npx nx serve vesta          # Frontend: https://localhost:4200
npx nx serve api            # Backend: https://localhost:3000
```

### Building & Testing

```bash
# Build for production
npx nx build vesta
npx nx build api

# Run test suites
npx nx test vesta
npx nx test api
```

---

## Core Concepts Explored
I built this project to get hands-on experience with a few specific concepts:
* Wiring up real-time protocols (MQTT + WebSockets) with a modern web stack.
* Managing a full-stack TypeScript monorepo using Nx.
* Handling complex relational database modeling with Prisma.
* Building scalable backend modules with NestJS.
* Designing an intuitive, state-heavy React frontend.

## License
MIT