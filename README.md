# 🏋️ FitVeda — Full-Stack Fitness & Diet Management Platform

FitVeda is a modern full-stack web application designed for personal trainers to create customized multi-day workout and diet plans, assign them to clients, and monitor real-time client progress analytics.

## 🚀 Key Features

### 👨‍🏫 Trainer Features
- **Client Overview**: View all registered clients in real time.
- **Multi-Step Plan Creator**: Build multi-day fitness and diet routines with custom exercise names, sets, reps, and day numbers.
- **Client Assignment**: Assign plans to clients with automatic date-overlap collision prevention.
- **Analytics Dashboard**: Interactive Chart.js analytics tracking daily client completion percentages.

### 🏃 Client Features
- **Daily Dashboard**: View active daily workouts and diet instructions tailored for the current day.
- **Interactive Logger**: Check off completed items and submit daily progress logs with personal notes.
- **Progress Tracking**: Real-time status indicators for completed vs. missed activities.

---

## 🛠️ Technology Stack
- **Backend**: Java 17+, Spring Boot 3.3.2, Spring Data JPA, Spring Security, JJWT (0.11.5), Bucket4j (8.10.1)
- **Database**: PostgreSQL (Docker container on port 5432)
- **Frontend**: React 19, Vite 8, Tailwind CSS v3, React Router v7, Axios, Chart.js
- **Authentication**: Stateless JWT Bearer Authentication with BCrypt Password Hashing
- **Rate Limiting**: IP-based rate limiting on Auth (10 req/hr) and REST APIs (60 req/min)

---

## 💻 Local Setup & Execution Guide

### Prerequisites
- Java 17 or higher & Maven
- Node.js (v18+) & npm
- Docker Desktop

### 1. Database Setup
```bash
docker run -d --name fitveda-postgres -e POSTGRES_DB=fitveda_db -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:latest
```

### 2. Backend Setup
```bash
cd fitveda-backend
mvn spring-boot:run
```
Backend server runs on `http://localhost:8080`

### 3. Frontend Setup
```bash
cd fitveda-frontend
npm install
npm run dev
```
Frontend app runs on `http://localhost:5173`

---

## 👥 Development Team
- **Adarsh Maurya** — Backend Engineer (Spring Boot, Security, PostgreSQL, Architecture)
- **Priya Manna** — Frontend Engineer (React Architecture, Context, Routing, API Integration)
- **Pari Marathe** — UI/UX Engineer (Tailwind CSS Design System, Reusable UI Components, Chart.js Analytics)
