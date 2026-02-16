# Vesta - Smart Home Management System

## 🏠 Project Overview

Vesta is a full-stack IoT smart home management platform that enables users to monitor and control smart devices across multiple homes and rooms. The system features real-time device communication via MQTT protocol, multi-user home management with role-based access control, and a modern responsive web interface.

## 🎯 Key Features

- **Multi-Home Management**: Create and manage multiple smart homes with unique invitation codes for sharing access
- **Real-Time Device Control**: Monitor and control IoT devices using MQTT protocol with WebSocket integration
- **Room Organization**: Organize devices by rooms with customizable room types (Living Room, Bedroom, Kitchen, Bathroom, Garage)
- **Role-Based Access Control**: Secure authentication system with Admin and Child user roles
- **Dashboard Analytics**: Visual data representation using charts and statistics
- **Responsive UI**: Modern Material-UI based interface optimized for desktop and mobile devices

## 🛠️ Technology Stack

### Frontend
- **React 19** with TypeScript
- **Material-UI (MUI)** for component library and theming
- **React Router** for navigation
- **Formik & Yup** for form management and validation
- **Axios** for HTTP requests
- **WebSocket** for real-time updates
- **Vite** for fast development and building

### Backend
- **NestJS** - Progressive Node.js framework
- **PostgreSQL** with Prisma ORM
- **MQTT** for IoT device communication
- **JWT Authentication** with bcrypt for security
- **Swagger** for API documentation
- **WebSocket Gateway** for real-time client updates

### Development Tools
- **Nx Monorepo** for workspace management
- **TypeScript** for type safety
- **Jest & Vitest** for testing
- **ESLint & Prettier** for code quality
- **HTTPS/SSL** support for secure communications

## 🏗️ Architecture

The project uses a modern **Nx monorepo** structure with clear separation of concerns:

```
vesta/
├── apps/vesta/          # React frontend application
│   ├── src/
│   │   ├── pages/       # Dashboard, Homes, Rooms, Devices, Auth
│   │   ├── components/  # Reusable UI components
│   │   ├── context/     # React context (Auth)
│   │   ├── services/    # API integration layer
│   │   └── hooks/       # Custom React hooks
├── api/                 # NestJS backend API
│   ├── src/
│   │   ├── app/
│   │   │   ├── auth/    # Authentication module
│   │   │   ├── homes/   # Homes management
│   │   │   ├── rooms/   # Rooms management
│   │   │   └── devices/ # Device control & MQTT
│   └── prisma/          # Database schema and migrations
└── api-e2e/             # End-to-end tests
```

## 💡 Technical Highlights

- **RESTful API Design**: Clean API architecture with DTOs and validation pipes
- **Database Relations**: Complex Prisma schema with cascading deletes and unique constraints
- **Real-Time Communication**: Bidirectional WebSocket connections for instant device updates
- **IoT Integration**: MQTT broker integration for smart device control
- **Security**: JWT-based authentication, password hashing, HTTPS support, CORS configuration
- **Scalability**: Microservices-ready architecture using NestJS modules
- **Type Safety**: End-to-end TypeScript for reduced runtime errors
- **Modern DevOps**: Nx Cloud integration for CI/CD optimization

## 📊 Database Schema

The system uses PostgreSQL with the following core models:
- **Users**: Authentication and role management
- **Home**: Multi-user home management with invite codes
- **Room**: Room organization with types and floor information
- **Devices**: IoT device registration and status tracking

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+)
- PostgreSQL database
- MQTT broker

### Installation

```bash
# Install dependencies
npm install

# Setup database
cd api
npx prisma migrate dev

# Start development servers
npx nx serve vesta          # Frontend on https://localhost:4200
npx nx serve api            # Backend on https://localhost:3000
```

### Building for Production

```bash
# Build all applications
npx nx build vesta
npx nx build api

# Run tests
npx nx test vesta
npx nx test api
```

## 🎓 Learning Outcomes

This project demonstrates proficiency in:
- Full-stack JavaScript/TypeScript development
- Modern React patterns (Context API, Hooks, Custom Hooks)
- Backend API design with NestJS
- Database modeling and ORM usage
- Real-time communication protocols (WebSocket, MQTT)
- Authentication and authorization
- Monorepo management and tooling
- DevOps and deployment workflows
- IoT device integration
- Material Design principles

## 📄 License

MIT

## 👤 Author

Mikołaj Root
