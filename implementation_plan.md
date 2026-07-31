# FitVeda — Detailed Implementation Plan (v2)

## Project Overview

**FitVeda** is a full-stack fitness management platform that connects Trainers with their Clients through a structured plan-and-progress lifecycle. Trainers build multi-day workout/diet plans; clients consume those plans daily and log their progress; trainers then close the feedback loop by viewing completion analytics.

---

## Design Decisions (Locked In)

> [!IMPORTANT]
> These decisions are final. Do not deviate without team discussion.

| # | Decision | Resolution |
|---|---|---|
| 1 | **Password hashing in Phase 2** | ✅ Yes — BCrypt-encode all passwords from the very first `/register` call, even before Spring Security is fully wired. Avoids data migration. |
| 2 | **Trainer–Client relationship** | ✅ Through Plans only — no `trainer_id` on the `users` table. `GET /api/clients` returns distinct clients across all plans owned by the logged-in trainer. |
| 3 | **Multi-plan support** | ❌ No overlapping plans — a client can have only one active plan at a time. `assignClient` must reject if the client already has an active plan whose date range overlaps. |
| 4 | **ProgressLog granularity** | ✅ One ProgressLog per Exercise per day — gives the most granular per-exercise analytics for the completion chart. |
| 5 | **Registration flow** | ✅ Both Trainers and Clients self-register. After a Client registers, their first action is to be assigned to a Trainer (via a Trainer creating and assigning a Plan to them). |

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Backend Framework | Spring Boot 3.x (Maven) | REST API server |
| ORM | Spring Data JPA + Hibernate | Entity management & DB queries |
| Database | PostgreSQL | Persistent relational storage |
| Security | Spring Security + JWT (jjwt 0.11.5) | Auth & role-based access control |
| Rate Limiting | Bucket4j (in-memory) | API rate limiting per IP / per user |
| Input Validation | Jakarta Bean Validation (`spring-boot-starter-validation`) | Request body validation |
| Frontend Framework | React 18 (Vite scaffold) | SPA for both dashboards |
| Styling | Tailwind CSS | Utility-first responsive UI |
| HTTP Client | Axios | API calls from frontend |
| Routing | React Router DOM v6 | Client-side navigation |
| Charts | Chart.js + react-chartjs-2 | Progress analytics |
| Testing (API) | Postman | Manual endpoint verification |

---

## Team Roles

| Member | Domain |
|---|---|
| **Adarsh** | Backend — Spring Boot, JPA, Spring Security, JWT, Rate Limiting |
| **Priya** | Frontend Logic — React state, API integration, routing, auth flow |
| **Pari** | Frontend Styling — Tailwind CSS, components, responsive design, Chart.js |

---

## Entity & Data Model (Reference for Everyone)

```
User          { id, name, email, password (BCrypt), role [TRAINER|CLIENT] }
Plan          { id, name, startDate, endDate, trainer (User), client (User) }
Exercise      { id, dayNumber, type [WORKOUT|DIET], name, sets, reps, plan (Plan) }
ProgressLog   { id, date, status [COMPLETED|MISSED], notes, client (User), exercise (Exercise) }
```

**Key Relationships:**
- One Trainer (User) → Many Plans → Many Clients *(no direct Trainer→Client FK)*
- One Client → at most ONE active Plan at any time *(enforced in service layer)*
- One Plan → Many Exercises
- One Client → Many ProgressLogs
- One ProgressLog → exactly One Exercise (one log per exercise per day)

---

## API Contract (Reference for Everyone)

| Method | Endpoint | Role | Rate Limit | Purpose |
|---|---|---|---|---|
| POST | `/api/auth/register` | Public | 10 req/hr per IP | Register new user |
| POST | `/api/auth/login` | Public | 10 req/hr per IP | Login, returns JWT |
| POST | `/api/plans` | TRAINER | 30 req/min per user | Create a new plan |
| POST | `/api/plans/{planId}/exercises` | TRAINER | 60 req/min per user | Add exercises to a plan |
| PUT | `/api/plans/{planId}/assign/{clientId}` | TRAINER | 30 req/min per user | Assign plan to client |
| GET | `/api/clients` | TRAINER | 60 req/min per user | List trainer's clients |
| GET | `/api/clients/{clientId}/progress` | TRAINER | 60 req/min per user | Fetch progress for analytics |
| GET | `/api/plans/my-plan` | CLIENT | 60 req/min per user | Get active plan for today |
| POST | `/api/progress` | CLIENT | 30 req/min per user | Submit a daily progress log |

---

## Security Architecture Overview

```
[Browser] ──HTTPS──▶ [React SPA] ──Axios + JWT Bearer──▶ [Spring Boot]
                                                              │
                                                    ┌─────────▼──────────┐
                                                    │  JwtFilter          │  (validates token)
                                                    │  RateLimitFilter    │  (Bucket4j per IP/user)
                                                    │  SecurityConfig     │  (role-based access)
                                                    └─────────┬──────────┘
                                                              │
                                                    ┌─────────▼──────────┐
                                                    │  Service Layer      │  (ownership checks)
                                                    │  Validation Layer   │  (Bean Validation)
                                                    └─────────┬──────────┘
                                                              │
                                                         PostgreSQL
```

**Layers of defense:**
1. **Rate Limiting Filter** — stops brute force & abuse before auth even runs.
2. **JWT Filter** — validates token signature, expiry, and user existence.
3. **Spring Security Role Guards** — TRAINER vs CLIENT endpoint separation.
4. **Service-Level Ownership Checks** — trainer can only touch their own plans/clients.
5. **Input Validation** — all request bodies validated with `@Valid` + `@NotBlank`, `@Future`, etc.
6. **Structured Error Responses** — never expose stack traces to the client.

---

---

# Phase 1 — Environment Setup & Foundational Architecture

**Goal:** Scaffold both projects, establish DB connection, create entities, set up routing and base UI components, and implement the foundational security & rate-limiting skeleton.

---

## Adarsh — Backend Setup

### Task 1.1 — Spring Boot Project Initialization
- Go to [start.spring.io](https://start.spring.io) and generate a **Maven** project.
- **Group:** `com.fitveda` | **Artifact:** `fitveda-backend`
- **Java version:** 17+
- **Dependencies to include at generation time:**
  - Spring Web
  - Spring Data JPA
  - PostgreSQL Driver
  - Spring Security
  - Spring Boot Starter Validation
  - Lombok *(reduces boilerplate)*
- Unzip into a dedicated `fitveda-backend/` folder.

### Task 1.2 — Add Additional Dependencies to `pom.xml`
Add manually after generation:
```xml
<!-- JWT -->
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.11.5</version>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>0.11.5</version>
    <scope>runtime</scope>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId>
    <version>0.11.5</version>
    <scope>runtime</scope>
</dependency>

<!-- Rate Limiting -->
<dependency>
    <groupId>com.github.vladimir-bukhtoyarov</groupId>
    <artifactId>bucket4j-core</artifactId>
    <version>8.7.0</version>
</dependency>
```

### Task 1.3 — PostgreSQL Database Setup
- Create a local PostgreSQL database: `CREATE DATABASE fitveda_db;`
- Configure `src/main/resources/application.properties`:
  ```properties
  spring.datasource.url=jdbc:postgresql://localhost:5432/fitveda_db
  spring.datasource.username=YOUR_PG_USER
  spring.datasource.password=YOUR_PG_PASSWORD
  spring.jpa.hibernate.ddl-auto=update
  spring.jpa.show-sql=true
  spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

  # JWT secret (min 256-bit for HS256 — generate with: openssl rand -hex 32)
  jwt.secret=REPLACE_WITH_64_CHAR_HEX_STRING
  jwt.expiration.ms=86400000

  # Never expose stack traces in API responses
  server.error.include-stacktrace=never
  server.error.include-message=never
  ```
- Verify connection: run the app and confirm no startup errors.

### Task 1.4 — Entity Classes
Create under `com.fitveda.model`:

**`User.java`**
```java
@Entity @Table(name = "users")
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @NotBlank public String name;
    @Column(unique = true) @Email @NotBlank public String email;
    @NotBlank public String password;   // Always stored BCrypt-encoded
    @Enumerated(EnumType.STRING) public Role role;
}
public enum Role { TRAINER, CLIENT }
```

**`Plan.java`**
```java
@Entity
public class Plan {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @NotBlank public String name;
    public LocalDate startDate;
    public LocalDate endDate;
    @ManyToOne public User trainer;
    @ManyToOne public User client;      // null until assigned
    @OneToMany(mappedBy = "plan", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<Exercise> exercises = new ArrayList<>();
}
```

**`Exercise.java`**
```java
@Entity
public class Exercise {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    public int dayNumber;
    @Enumerated(EnumType.STRING) public ExerciseType type;
    @NotBlank public String name;
    public int sets;
    @NotBlank public String reps;
    @ManyToOne public Plan plan;
}
public enum ExerciseType { WORKOUT, DIET }
```

**`ProgressLog.java`**
```java
@Entity
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"client_id", "exercise_id", "date"}))
public class ProgressLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    public LocalDate date;
    @Enumerated(EnumType.STRING) public LogStatus status;
    public String notes;
    @ManyToOne public User client;
    @ManyToOne public Exercise exercise;   // One log per exercise per day
}
public enum LogStatus { COMPLETED, MISSED }
```

> **Security Note:** The `@UniqueConstraint` on `ProgressLog` prevents a client from double-logging the same exercise on the same day at the DB level, not just the service layer.

### Task 1.5 — Global Exception Handler (Security-Safe Errors)
Create `com.fitveda.exception.GlobalExceptionHandler`:
```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    // Returns { "error": "...", "status": 4xx } — never a stack trace
    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<?> handleForbidden(...)  // 403

    @ExceptionHandler(EntityNotFoundException.class)
    ResponseEntity<?> handleNotFound(...)   // 404

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<?> handleValidation(...) // 400 with field-level errors

    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<?> handleDuplicate(...)  // 409 (e.g., duplicate email)

    @ExceptionHandler(Exception.class)
    ResponseEntity<?> handleGeneric(...)    // 500 with generic "Internal error"
}
```

### Task 1.6 — Disable Default Spring Security Until Phase 3
Since Spring Security is on the classpath but not yet configured, add a **temporary** permissive config so endpoints work without auth during Phase 2:
```java
// com.fitveda.security.DevSecurityConfig.java
// DELETE THIS FILE before Merge Point 3
@Configuration
@EnableWebSecurity
@Profile("dev")  // Only active in dev profile
public class DevSecurityConfig {
    @Bean SecurityFilterChain devChain(HttpSecurity http) throws Exception {
        return http.csrf(csrf -> csrf.disable())
                   .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
                   .build();
    }
    @Bean PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(); // Already active — used in Phase 2
    }
}
```
Set `spring.profiles.active=dev` in `application.properties`. **Remove this profile in Phase 3.**

### Task 1.7 — Verify Schema Generation
- Run the Spring Boot application.
- Open your PostgreSQL client and confirm: `users`, `plan`, `exercise`, `progress_log` tables created.
- Verify the unique constraint on `progress_log(client_id, exercise_id, date)` exists.
- Fix any mapping errors before proceeding.

---

## Priya — Frontend Logic Setup

### Task 1.8 — Scaffold React App with Vite
```bash
npm create vite@latest fitveda-frontend -- --template react
cd fitveda-frontend
npm install
```

### Task 1.9 — Install Core Dependencies
```bash
npm install react-router-dom axios
```

### Task 1.10 — Directory Structure
```
src/
├── pages/
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── TrainerDashboard.jsx
│   └── ClientDashboard.jsx
├── components/
│   ├── ui/               # Pari's base components
│   └── ProtectedRoute.jsx
├── services/
│   └── api.js            # All Axios calls here
├── context/
│   └── AuthContext.jsx
└── utils/
    ├── helpers.js
    └── mockData.js
```

### Task 1.11 — Core Router Setup
In `App.jsx`:
```jsx
<Routes>
  <Route path="/"         element={<LoginPage />} />
  <Route path="/register" element={<RegisterPage />} />
  <Route path="/trainer"  element={<TrainerDashboard />} />
  <Route path="/client"   element={<ClientDashboard />} />
</Routes>
```
Each page renders a simple `<h1>` placeholder for now. `ProtectedRoute` is wired in Phase 3.

### Task 1.12 — AuthContext Shell
`src/context/AuthContext.jsx` — provides `{ user, token, login, logout }`:
- On mount: read `token`, `role`, `userId`, `name` from `localStorage`.
- `login(data)`: stores data in `localStorage` + state.
- `logout()`: clears `localStorage` + state + redirects to `/`.
- JWT interceptor is added in Phase 3, but the context object structure must be finalized now.

### Task 1.13 — Frontend Security Baseline
Add an Axios **response interceptor** now (even before JWT is live) to handle global error states:
```js
// src/services/api.js
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = "/";   // Force re-login on 401
    }
    return Promise.reject(err);
  }
);
```

---

## Pari — Frontend Styling Setup

### Task 1.14 — Install & Configure Tailwind CSS
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```
`tailwind.config.js`:
```js
content: ["./index.html", "./src/**/*.{js,jsx}"],
theme: {
  extend: {
    colors: {
      primary:   "#2563EB",
      primaryDk: "#1D4ED8",
      surface:   "#F8FAFC",
      muted:     "#64748B",
      success:   "#22C55E",
      danger:    "#EF4444",
    },
    fontFamily: { sans: ["Inter", "sans-serif"] },
    borderRadius: { xl: "1rem", "2xl": "1.5rem" },
  },
},
```
Add to `index.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Task 1.15 — Reusable Base Components
Build inside `src/components/ui/`:

| Component | File | Key Variants / Notes |
|---|---|---|
| `Button` | `Button.jsx` | `primary`, `secondary`, `danger`, `disabled` state, loading spinner |
| `Input` | `Input.jsx` | Labelled, error message below, `type` prop (text/email/password) |
| `Card` | `Card.jsx` | `shadow-md rounded-2xl p-6 bg-white` |
| `NavBar` | `NavBar.jsx` | Logo left, user name + Logout button right |
| `Badge` | `Badge.jsx` | `WORKOUT` (blue), `DIET` (orange), `COMPLETED` (green), `MISSED` (red) |
| `Toast` | `Toast.jsx` | Slide-in notifications for success/error API responses |
| `Spinner` | `Spinner.jsx` | Used for loading states across all pages |

### Task 1.16 — Draft Mock Data File
`src/utils/mockData.js`:
```js
export const mockPlan = {
  id: 1, name: "Week 1 Strength", startDate: "2026-08-01", endDate: "2026-08-07",
  currentDayNumber: 1,
  exercises: [
    { id: 1, dayNumber: 1, type: "WORKOUT", name: "Squats",       sets: 3, reps: "12" },
    { id: 2, dayNumber: 1, type: "DIET",    name: "Protein Shake", sets: 1, reps: "1 serving" },
    { id: 3, dayNumber: 2, type: "WORKOUT", name: "Push-ups",     sets: 4, reps: "15" },
  ]
};
export const mockClients = [
  { id: 2, name: "Raj Mehta",   email: "raj@example.com" },
  { id: 3, name: "Sneha Patel", email: "sneha@example.com" },
];
export const mockProgress = [
  { date: "2026-08-01", completionPercent: 100 },
  { date: "2026-08-02", completionPercent: 67 },
  { date: "2026-08-03", completionPercent: 33 },
];
```

---

## ✅ MERGE POINT 1 — "Foundations Verified"

> **Stop here. All three members sync before proceeding to Phase 2.**

**Checklist — All must pass before moving on:**
- [ ] Spring Boot starts on `dev` profile without errors.
- [ ] All 4 tables (`users`, `plan`, `exercise`, `progress_log`) exist in PostgreSQL with correct columns.
- [ ] `progress_log` unique constraint `(client_id, exercise_id, date)` is present.
- [ ] React app runs on `localhost:5173` with 4 routes navigable.
- [ ] `DevSecurityConfig` is active — all endpoints return data without any auth header.
- [ ] Global error handler returns `{ error, status }` for 400/404/500 — verified in Postman.
- [ ] Tailwind applied — all base UI components (`Button`, `Card`, `Badge`, `Toast`, `Spinner`) render correctly.
- [ ] `AuthContext` shell created and wraps `App.jsx` — `useAuth()` hook accessible in all pages.
- [ ] Axios 401 response interceptor is wired — redirects to `/` on 401.
- [ ] Adarsh shares the **exact JSON response shapes** for all 9 API endpoints as a shared Postman collection or markdown doc.
- [ ] Pari's `mockData.js` shapes match Adarsh's agreed response format exactly.

**Deliverable:** Shared Postman collection + agreed API response shapes document distributed to all team members.

---

---

# Phase 2 — Core Business Logic & Interface Construction

**Goal:** Build all CRUD APIs with validation and business rule enforcement, construct both dashboards with mock-then-real data, and add service-level security (ownership checks, overlap prevention, BCrypt encoding).

---

## Adarsh — Repositories, Services & Controllers

### Task 2.1 — Repository Interfaces
Create under `com.fitveda.repository`:
```java
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    List<User> findByRole(Role role);
    boolean existsByEmail(String email);
}

public interface PlanRepository extends JpaRepository<Plan, Long> {
    List<Plan> findByTrainerId(Long trainerId);

    // For overlap check: any plan for this client where date ranges intersect
    @Query("SELECT p FROM Plan p WHERE p.client.id = :clientId " +
           "AND p.startDate <= :endDate AND p.endDate >= :startDate")
    List<Plan> findOverlappingPlansForClient(Long clientId, LocalDate startDate, LocalDate endDate);

    // For getActivePlan (today falls within range)
    Optional<Plan> findByClientIdAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
        Long clientId, LocalDate today1, LocalDate today2);
}

public interface ExerciseRepository extends JpaRepository<Exercise, Long> {
    List<Exercise> findByPlanIdAndDayNumber(Long planId, int dayNumber);
}

public interface ProgressLogRepository extends JpaRepository<ProgressLog, Long> {
    List<ProgressLog> findByClientIdAndDateBetween(Long clientId, LocalDate start, LocalDate end);
    Optional<ProgressLog> findByClientIdAndExerciseIdAndDate(
        Long clientId, Long exerciseId, LocalDate date);
}
```

### Task 2.2 — Request/Response DTOs
Create `com.fitveda.dto` — never expose JPA entities directly from controllers:

```java
// Incoming
record PlanRequest(
    @NotBlank String name,
    @NotNull LocalDate startDate,
    @NotNull LocalDate endDate
) {}

record ExerciseRequest(
    @Min(1) int dayNumber,
    @NotNull ExerciseType type,
    @NotBlank String name,
    @Min(1) int sets,
    @NotBlank String reps
) {}

record ProgressRequest(
    @NotNull Long exerciseId,
    @NotNull LogStatus status,
    String notes
) {}

record RegisterRequest(
    @NotBlank String name,
    @Email @NotBlank String email,
    @NotBlank @Size(min = 8) String password,  // Min 8 chars enforced here
    @NotNull Role role
) {}

record LoginRequest(@Email @NotBlank String email, @NotBlank String password) {}

// Outgoing
record PlanResponse(Long id, String name, LocalDate startDate, LocalDate endDate,
                    String clientName, List<ExerciseResponse> exercises) {}
record ExerciseResponse(Long id, int dayNumber, ExerciseType type,
                        String name, int sets, String reps) {}
record ProgressSummaryResponse(LocalDate date, int totalExercises,
                               int completedCount, int completionPercent) {}
record ClientResponse(Long id, String name, String email) {}
record AuthResponse(String token, String role, Long userId, String name) {}
```

### Task 2.3 — Service Layer
Create under `com.fitveda.service`:

**`PlanService.java`**
```java
// createPlan(PlanRequest req, Long trainerId)
//   - Validate: startDate must be today or future, endDate > startDate
//   - Trainer must exist and have TRAINER role
//   - Save Plan with client = null initially

// addExercise(Long planId, ExerciseRequest req, Long trainerId)
//   - OWNERSHIP CHECK: plan.trainer.id must equal trainerId → throw 403 if not
//   - Validate: dayNumber must be between 1 and (endDate - startDate + 1)
//   - Save Exercise linked to Plan

// assignClient(Long planId, Long clientId, Long trainerId)
//   - OWNERSHIP CHECK: plan.trainer.id must equal trainerId
//   - Verify clientId is a USER with role CLIENT
//   - OVERLAP CHECK: call planRepository.findOverlappingPlansForClient(clientId, plan.startDate, plan.endDate)
//     If result is non-empty → throw ConflictException("Client already has an active plan in this date range")
//   - Set plan.client = clientUser, save

// getActivePlanForClient(Long clientId)
//   - Find plan where today is within [startDate, endDate]
//   - Calculate dayNumber = ChronoUnit.DAYS.between(startDate, today) + 1
//   - Return only exercises for that dayNumber (filter from plan.exercises)
//   - If no active plan found → return empty response (not 404, let UI show "No plan assigned")

// getClientsForTrainer(Long trainerId)
//   - findByTrainerId → stream → map plan.client → deduplicate by client.id → return ClientResponse list
```

**`ProgressService.java`**
```java
// logProgress(ProgressRequest req, Long clientId)
//   - OWNERSHIP CHECK: verify the exercise belongs to a plan assigned to this clientId
//   - Upsert: findByClientIdAndExerciseIdAndDate → update if found, create if not
//   - Save and return updated log

// getProgressSummary(Long clientId, Long requestingTrainerId)
//   - OWNERSHIP CHECK: verify the client's active plan belongs to requestingTrainerId
//   - For each date from plan.startDate to today:
//       totalExercises = exercises where dayNumber = (date - startDate + 1)
//       completedCount = progressLogs where date = d and status = COMPLETED
//       completionPercent = (completedCount / totalExercises) * 100
//   - Return List<ProgressSummaryResponse>
```

**`UserService.java`**
```java
// registerUser(RegisterRequest req)
//   - Check existsByEmail → throw ConflictException if duplicate
//   - Encode password: passwordEncoder.encode(req.password())
//   - Save User

// Note: loginUser handled in AuthController via Spring Security in Phase 3
// In Phase 2, auth endpoints are stubbed: register saves user, login returns a placeholder token
```

### Task 2.4 — REST Controllers
Create under `com.fitveda.controller`:

**`PlanController.java`**
```
POST  /api/plans                            → planService.createPlan()    @Valid @RequestBody
POST  /api/plans/{planId}/exercises         → planService.addExercise()   @Valid @RequestBody
PUT   /api/plans/{planId}/assign/{clientId} → planService.assignClient()
GET   /api/plans/my-plan                    → planService.getActivePlanForClient()
GET   /api/clients                          → planService.getClientsForTrainer()
```

**`ProgressController.java`**
```
POST /api/progress                          → progressService.logProgress()       @Valid
GET  /api/clients/{clientId}/progress       → progressService.getProgressSummary()
```

**`AuthController.java`** *(stub — full JWT wired in Phase 3)*
```
POST /api/auth/register  → userService.registerUser()   (BCrypt already active)
POST /api/auth/login     → return placeholder { token: "dev-token", role, userId, name }
```

> **Phase 2 Security Note:** `DevSecurityConfig` is still active. Hardcode `Long trainerId = 1L` and `Long clientId = 2L` ONLY in Postman tests — never in source code. Service methods accept these IDs as parameters to be swapped with `SecurityContext` extraction in Phase 3 with zero method signature changes.

### Task 2.5 — Postman Testing Checklist
Test in this exact order (simulates real user journey):

| # | Request | Verify |
|---|---|---|
| 1 | `POST /api/auth/register` (TRAINER) | User in DB with BCrypt-hashed password |
| 2 | `POST /api/auth/register` (CLIENT) | Client user in DB |
| 3 | `POST /api/auth/register` (same email) | 409 Conflict returned |
| 4 | `POST /api/plans` | Plan created with `client = null` |
| 5 | `POST /api/plans/1/exercises` × 3 | Exercises linked to plan |
| 6 | `POST /api/plans/1/exercises` with `dayNumber=99` | 400 Bad Request (out of range) |
| 7 | `PUT /api/plans/1/assign/2` | `plan.client` set in DB |
| 8 | `PUT /api/plans/1/assign/2` (re-assign same client) | 409 Conflict (overlap check) |
| 9 | `GET /api/plans/my-plan` | Only today's exercises returned |
| 10 | `POST /api/progress` × 2 | ProgressLog records in DB |
| 11 | `POST /api/progress` same exercise again | Upserts (not duplicate) |
| 12 | `GET /api/clients/2/progress` | `completionPercent` calculated correctly |
| 13 | Any endpoint with invalid body | `{ error, status: 400 }` with field errors |

---

## Priya — Trainer Dashboard Logic & State

### Task 2.6 — Axios Service File (Final Structure)
`src/services/api.js`:
```js
import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:8080/api" });

// Request interceptor — attaches JWT (populated in Phase 3, slot exists now)
api.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — global 401 handler
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);

export default api;

// Auth
export const register = (data) => api.post("/auth/register", data);
export const login    = (data) => api.post("/auth/login", data);

// Plans (Trainer)
export const createPlan    = (data)              => api.post("/plans", data);
export const addExercise   = (planId, data)      => api.post(`/plans/${planId}/exercises`, data);
export const assignClient  = (planId, clientId)  => api.put(`/plans/${planId}/assign/${clientId}`);
export const getClients    = ()                  => api.get("/clients");
export const getMyPlan     = ()                  => api.get("/plans/my-plan");

// Progress
export const submitProgress    = (data)     => api.post("/progress", data);
export const getClientProgress = (clientId) => api.get(`/clients/${clientId}/progress`);
```

### Task 2.7 — Trainer Dashboard Page
`src/pages/TrainerDashboard.jsx`:

**Section A — Client Grid:**
- `useEffect` calls `getClients()` on mount.
- Renders each client as a `Card` (name, email, "View Progress" button).
- Shows `Spinner` during loading; empty state message if no clients.

**Section B — Create Plan Form (Multi-Step):**
- **Step 1:** Plan name (`@NotBlank`), start date, end date, client selector dropdown (populated from `getClients()`).
- **Step 2:** Dynamic "Add Exercise" rows — for each row: day number (select from 1..planDurationDays), type dropdown (WORKOUT/DIET), name, sets, reps. Allow adding/removing rows.
- **Step 3:** Review summary — list all exercises grouped by day. Submit button calls `createPlan()` → for each exercise `addExercise()` → then `assignClient()` — all in sequence using `async/await`.
- On success: show `Toast` ("Plan created and assigned!"), reset form.
- On API error: show `Toast` with error message from `err.response.data.error`.

**Section C — Progress Panel:**
- Clicking "View Progress" on a client card sets `selectedClientId` in state.
- Opens a slide-in right panel (Pari handles styling) — hosts the Chart.js chart (Phase 3).

### Task 2.8 — Error Handling Pattern
Standard pattern for all API calls in the project:
```js
const [loading, setLoading] = useState(false);
const [error, setError]     = useState(null);

const handleSubmit = async () => {
  setLoading(true); setError(null);
  try {
    await createPlan(formData);
    showToast("Success!");
  } catch (err) {
    setError(err.response?.data?.error || "Something went wrong");
  } finally {
    setLoading(false);
  }
};
```
Use this pattern consistently — never leave `.catch(console.error)` in production code.

---

## Pari — Client Dashboard UI

### Task 2.9 — Client Dashboard Layout
`src/pages/ClientDashboard.jsx` — mobile-first:

**Header:**
- Greeting: "Good morning, [Client Name]" (name from `AuthContext`).
- Today's date in a readable format (e.g., "Wednesday, 30 Jul 2026").
- Sub-line: "Day 3 of your Week 1 Strength Plan".

**Plan Title Card:**
- Shows plan name + date range badge.
- If no active plan: centered empty state illustration + "Your trainer hasn't assigned a plan yet."

**Workout Section:** List of WORKOUT exercises for today, each as `ChecklistItem`.
**Diet Section:** List of DIET exercises for today, each as `ChecklistItem`.

**Submit Button:**
- "Log Today's Progress" — disabled if no items are checked.
- On click: calls `submitProgress()` for each checked item.
- Button shows `Spinner` during API calls; replaced by "✓ Logged!" on success.

### Task 2.10 — ChecklistItem Component
`src/components/ChecklistItem.jsx`:
- Displays exercise name, `sets × reps` sub-text.
- Custom animated toggle: CSS transition on a div acting as checkbox — 200ms ease-in-out.
- **Checked state:** Green background tint, text gets `line-through` and `text-muted`, checkmark icon appears.
- `Badge` on the right: WORKOUT (blue) or DIET (amber).
- Accessibility: `role="checkbox"` + `aria-checked` + `tabIndex=0` + keyboard Enter/Space support.

### Task 2.11 — Responsive Testing
- **375px (iPhone SE):** Full usability — checklist items have min 44px tap height, large submit button.
- **768px (tablet):** Two-column exercise layout (workout | diet side by side).
- **1280px (desktop):** Centered card with max-width, comfortable whitespace.

---

## ✅ MERGE POINT 2 — "Live Data Integration"

> **Stop here. All three members sync, connect frontend to backend, and run end-to-end tests.**

**Checklist — All must pass before moving on:**
- [ ] All 13 Postman tests from Task 2.5 pass (including error and edge-case tests).
- [ ] BCrypt hashing verified — password column in DB is NOT plain text.
- [ ] Overlap prevention verified — assigning a client to two overlapping plans returns 409.
- [ ] Priya replaces **all** mock data with real `api.js` calls.
- [ ] `getClients()` populates the trainer's client grid from real DB data.
- [ ] `getMyPlan()` populates the client checklist with today's exercises only.
- [ ] `submitProgress()` creates ProgressLog records — verified in DB.
- [ ] All API errors display via `Toast` component — no raw `console.error` output.
- [ ] Loading `Spinner` appears during all API calls.
- [ ] Empty states render correctly (no clients, no active plan).
- [ ] No hardcoded user IDs in any JSX or service file.
- [ ] CORS configured globally in Spring Boot (`WebMvcConfigurer` bean, not per-controller `@CrossOrigin`):
  ```java
  allowedOrigins("http://localhost:5173")
  allowedMethods("GET","POST","PUT","DELETE","OPTIONS")
  allowedHeaders("*")
  allowCredentials(true)
  ```

**Deliverable:** Working full-stack app (dev profile, no JWT auth) where the complete plan-and-log journey works on localhost with real PostgreSQL data.

---

---

# Phase 3 — Authentication, Rate Limiting, Analytics & Final Polish

**Goal:** Replace `DevSecurityConfig` with production-grade Spring Security + JWT, add Bucket4j rate limiting, wire the full login/register UI flow, add Chart.js analytics, and conduct the final integration test.

---

## Adarsh — Spring Security, JWT & Rate Limiting

### Task 3.1 — JWT Utility Class
`com.fitveda.security.JwtUtil`:
```java
@Component
public class JwtUtil {
    @Value("${jwt.secret}") private String secret;
    @Value("${jwt.expiration.ms}") private long expirationMs;

    // generateToken(UserDetails user) — HS256, includes email + role claims, expirationMs expiry
    // validateToken(String token, UserDetails user) → boolean
    // extractEmail(String token) → String
    // extractRole(String token) → String
    // extractAllClaims(String token) → Claims (private, uses secret key)
}
```
> **Security:** Secret key must be at least 256 bits (32 bytes). Never hardcode it — always read from `application.properties` (or env var in production).

### Task 3.2 — JWT Filter
`com.fitveda.security.JwtFilter extends OncePerRequestFilter`:
```java
// 1. Skip filter for /api/auth/** paths
// 2. Read Authorization header — if missing/malformed → chain.doFilter (Spring Security handles 401)
// 3. extractEmail from token
// 4. Load UserDetails from UserDetailsService (queries DB by email)
// 5. validateToken → if invalid, do NOT set SecurityContext (request will be rejected as 401)
// 6. Create UsernamePasswordAuthenticationToken and set in SecurityContextHolder
```

### Task 3.3 — UserDetailsService Implementation
`com.fitveda.security.FitVedaUserDetailsService implements UserDetailsService`:
```java
// loadUserByUsername(String email) → loads User from UserRepository
// Maps User.role to GrantedAuthority: "ROLE_TRAINER" or "ROLE_CLIENT"
```

### Task 3.4 — Rate Limiting with Bucket4j
`com.fitveda.security.RateLimitFilter extends OncePerRequestFilter`:

**Strategy:**
- **Public endpoints** (`/api/auth/**`): limit by **IP address** — 10 requests per hour per IP (prevents brute-force registration/login).
- **Authenticated endpoints**: limit by **authenticated user ID** — 30–60 requests per minute per user (see API contract table).

```java
// Use ConcurrentHashMap<String, Bucket> to store buckets per IP or userId
// On each request:
//   1. Determine key: IP for public, userId from JWT for authenticated
//   2. Get or create Bucket for that key
//   3. bucket.tryConsume(1) → if false, return 429 Too Many Requests
//       { "error": "Too many requests. Please try again later.", "status": 429 }

// Bucket configurations:
Bucket authBucket     = Bucket.builder().addLimit(Bandwidth.simple(10, Duration.ofHours(1))).build();
Bucket trainerBucket  = Bucket.builder().addLimit(Bandwidth.simple(60, Duration.ofMinutes(1))).build();
Bucket clientBucket   = Bucket.builder().addLimit(Bandwidth.simple(30, Duration.ofMinutes(1))).build();
```

> **Note:** In-memory buckets reset on app restart. Sufficient for this project. For production, use Bucket4j with Redis backend.

### Task 3.5 — Production Spring Security Configuration
`com.fitveda.security.SecurityConfig` — **replaces `DevSecurityConfig`** (delete the dev config file):
```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    @Bean
    SecurityFilterChain chain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())           // Disabled: stateless JWT, no session
            .sessionManagement(sm -> sm.sessionCreationPolicy(STATELESS))
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/plans").hasRole("TRAINER")
                .requestMatchers(HttpMethod.POST, "/api/plans/*/exercises").hasRole("TRAINER")
                .requestMatchers(HttpMethod.PUT,  "/api/plans/*/assign/*").hasRole("TRAINER")
                .requestMatchers(HttpMethod.GET,  "/api/clients/**").hasRole("TRAINER")
                .requestMatchers(HttpMethod.GET,  "/api/plans/my-plan").hasRole("CLIENT")
                .requestMatchers(HttpMethod.POST, "/api/progress").hasRole("CLIENT")
                .anyRequest().authenticated()
            )
            .addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((req, res, e) -> {
                    res.setStatus(401);
                    res.getWriter().write("{\"error\":\"Unauthorized\",\"status\":401}");
                })
                .accessDeniedHandler((req, res, e) -> {
                    res.setStatus(403);
                    res.getWriter().write("{\"error\":\"Forbidden\",\"status\":403}");
                })
            )
            .build();
    }

    @Bean PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }
}
```

### Task 3.6 — Auth Controller (Full Implementation)
`com.fitveda.controller.AuthController`:

**`POST /api/auth/register`**
- Accepts `@Valid RegisterRequest` — validation enforces `@Email`, `@NotBlank`, `@Size(min=8)` on password.
- Calls `userService.registerUser()` (already BCrypt-encodes from Phase 2).
- Returns `{ message: "Registration successful. Please log in." }`.
- **Security:** Returns the same generic message whether email exists or not (prevents email enumeration). The 409 conflict exception is now mapped to the same 200-like message, or return 409 with just `"Email already in use"` — decide with the team.

**`POST /api/auth/login`**
- Accepts `@Valid LoginRequest`.
- Loads user by email → `passwordEncoder.matches(raw, encoded)`.
- If mismatch: **wait 500ms** before returning 401 (timing attack mitigation) and return generic `"Invalid credentials"`.
- If match: generate JWT, return `AuthResponse(token, role, userId, name)`.

### Task 3.7 — Service Layer: Replace Hardcoded IDs with SecurityContext
In all service methods, replace `Long trainerId = 1L` with:
```java
Authentication auth = SecurityContextHolder.getContext().getAuthentication();
String email = auth.getName();
User currentUser = userRepository.findByEmail(email).orElseThrow();
Long trainerId = currentUser.id;
```
This is why service methods were designed to accept `trainerId`/`clientId` as parameters in Phase 2 — now those parameters are populated from `SecurityContext` in the controller, keeping service logic unchanged.

### Task 3.8 — Data Isolation Final Verification
Every service method must enforce ownership:

| Method | Ownership Check |
|---|---|
| `addExercise` | `plan.trainer.id == currentUser.id` |
| `assignClient` | `plan.trainer.id == currentUser.id` |
| `logProgress` | `exercise.plan.client.id == currentUser.id` |
| `getProgressSummary` | `exercise.plan.trainer.id == currentUser.id` |

Throw `AccessDeniedException` (mapped to 403 by `GlobalExceptionHandler`) if check fails.

---

## Priya — Auth Flow & Protected Routes

### Task 3.9 — Login Page (Full Implementation)
`src/pages/LoginPage.jsx`:
- Email input, password input, animated role toggle (TRAINER / CLIENT pill selector).
- "Don't have an account? Register" link → `/register`.
- Calls `login({ email, password })`.
- On success: `authContext.login({ token, role, userId, name })` → navigate to `/trainer` or `/client` based on role.
- On error: inline error message "Invalid email or password" — no specific "email not found" vs "wrong password" (mirrors backend).
- Show `Spinner` on button during API call.

### Task 3.10 — Register Page (Full Implementation)
`src/pages/RegisterPage.jsx`:
- Fields: Full Name, Email, Password (show/hide toggle), Role selector (TRAINER / CLIENT).
- Client-side validation before API call: password min 8 chars, email format.
- Calls `register(data)`.
- On success: `Toast("Registration successful! Please log in.")` → navigate to `/`.
- If CLIENT: show info banner: "After registering, ask your trainer to assign you a plan to get started."

### Task 3.11 — Protected Route Wrapper
`src/components/ProtectedRoute.jsx`:
```jsx
const ProtectedRoute = ({ requiredRole, children }) => {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/" replace />;
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === "TRAINER" ? "/trainer" : "/client"} replace />;
  }
  return children;
};

// Usage in App.jsx:
<Route path="/trainer" element={
  <ProtectedRoute requiredRole="TRAINER"><TrainerDashboard /></ProtectedRoute>
} />
<Route path="/client" element={
  <ProtectedRoute requiredRole="CLIENT"><ClientDashboard /></ProtectedRoute>
} />
```

### Task 3.12 — Token Expiry Handling
The Axios response interceptor from Task 1.13 already handles 401 → clear + redirect.
Additionally, on app mount in `AuthContext`:
- Decode JWT (use `atob` on the payload segment) to read `exp`.
- If `exp * 1000 < Date.now()` → call `logout()` immediately without waiting for an API failure.

### Task 3.13 — Logout
- NavBar Logout button → `authContext.logout()`.
- `logout()`: `localStorage.clear()` → clear `AuthContext` state → `navigate("/")`.
- **Security:** On the backend, JWT is stateless (no blacklist). Acceptable for this scope. Tokens expire after 24hr.

---

## Pari — Analytics, Rate Limit UX & Final Polish

### Task 3.14 — Install Chart.js
```bash
npm install chart.js react-chartjs-2
```

### Task 3.15 — Progress Line Chart Component
`src/components/ProgressChart.jsx`:
- Receives `clientId` as prop.
- Calls `getClientProgress(clientId)` → array of `{ date, completionPercent }`.
- Renders `<Line>` chart:
  - X-axis: formatted dates (e.g., "Aug 1")
  - Y-axis: 0–100%, labelled "Completion %"
  - Dataset: smooth curve (`tension: 0.4`), filled gradient area below line (brand primary color at 20% opacity).
  - Hover tooltips: "Day 3: 85% complete (5/6 exercises)"
  - Point dots: colored by completion (green ≥80%, amber 50–79%, red <50%).
- Empty state: "No progress logged yet for this client."
- Embedded in the slide-in right panel on the Trainer Dashboard.

### Task 3.16 — Rate Limit UX Handling
When the backend returns `429 Too Many Requests`:
- Axios response interceptor catches it (status 429).
- Show a `Toast` with a warning icon: "You're doing that too fast. Please wait a moment."
- Disable the triggering button for 10 seconds (countdown displayed).
- Add to `api.js`:
  ```js
  if (err.response?.status === 429) {
    showGlobalToast("Too many requests — please slow down.", "warning");
  }
  ```

### Task 3.17 — Comprehensive Style Review
**Typography:**
- [ ] All headings: `font-bold` (700), sub-headings: `font-semibold` (600), body: `font-normal` (400).
- [ ] Consistent text size scale: `text-2xl` (page titles), `text-lg` (section headers), `text-sm` (meta/labels).

**Components:**
- [ ] All `Button` states: default, hover (`primaryDk`), active (scale-95), disabled (opacity-50 + cursor-not-allowed), loading (spinner replaces text).
- [ ] `Card` uniformity: `shadow-md rounded-2xl p-6 bg-white`.
- [ ] `Badge` colors match design tokens only.

**States:**
- [ ] Loading: `Spinner` centered in the content area, not overlapping the NavBar.
- [ ] Empty: centered icon + descriptive text + action CTA (e.g., "Create your first plan").
- [ ] Error: `Toast` slides in from top-right, auto-dismisses after 4 seconds.
- [ ] Success: `Toast` with green checkmark.
- [ ] Rate limited: `Toast` with amber warning icon.

**Responsive:**
- [ ] 375px: NavBar collapses logo to icon only; checklist items stack vertically.
- [ ] 768px: Trainer client grid is 2-column; plan form is split into steps.
- [ ] 1280px: Trainer Dashboard: 3-column client grid + right panel for progress chart.

### Task 3.18 — Security Headers (Frontend)
Add meta tags to `index.html`:
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com">
<meta http-equiv="X-Content-Type-Options" content="nosniff">
<meta http-equiv="Referrer-Policy" content="no-referrer">
```

---

## ✅ MERGE POINT 3 — "Full System Integration Test"

> **Stop here. Execute the complete production-grade user journey as a team. All 15 test steps must pass.**

**End-to-End Test Script:**

| Step | Actor | Action | Expected Result |
|---|---|---|---|
| 1 | Adarsh | `POST /api/auth/register` (TRAINER) | 200 OK, password BCrypt-hashed in DB |
| 2 | Adarsh | `POST /api/auth/register` (duplicate email) | 409 Conflict |
| 3 | Adarsh | `POST /api/auth/register` (CLIENT) | 200 OK |
| 4 | Priya | Login as TRAINER on frontend | JWT stored, redirected to `/trainer` |
| 5 | Priya | Create a plan with 3 days of exercises | Plan + exercises in DB, client = null |
| 6 | Priya | Assign plan to CLIENT | `plan.client` set in DB |
| 7 | Priya | Assign SAME client to ANOTHER overlapping plan | 409 Conflict |
| 8 | Priya | Login as CLIENT on frontend | JWT stored, redirected to `/client` |
| 9 | Pari | Today's exercises appear in checklist | Correct day number and exercises shown |
| 10 | Pari | Check 2/3 exercises, submit | ProgressLog records in DB with COMPLETED |
| 11 | Pari | Login as TRAINER, click "View Progress" | Line chart renders with real data |
| 12 | Adarsh | Use CLIENT JWT to call `POST /api/plans` | 403 Forbidden |
| 13 | Adarsh | Use TRAINER JWT to call `GET /api/plans/my-plan` | 403 Forbidden |
| 14 | Adarsh | Use expired/tampered JWT | 401 Unauthorized |
| 15 | Adarsh | Hit `/api/auth/login` 11 times in 1 hour (same IP) | 429 Too Many Requests on attempt 11 |

**Final Security Checklist:**
- [ ] All 15 test steps pass.
- [ ] No stack traces exposed in any API response (check all 4xx and 5xx responses).
- [ ] `DevSecurityConfig.java` file is deleted — `dev` profile no longer exists.
- [ ] JWT secret in `application.properties` is 64+ hex chars, not "mysecret" or similar.
- [ ] Passwords in DB are BCrypt hashes (start with `$2a$`), never plain text.
- [ ] Rate limit returns 429 with correct JSON body (not Spring's default error page).
- [ ] CORS allows only `http://localhost:5173` — test that `http://localhost:3000` is rejected.
- [ ] `ProtectedRoute` — accessing `/trainer` without token redirects to `/`.
- [ ] `ProtectedRoute` — CLIENT JWT accessing `/trainer` redirects to `/client`.
- [ ] Token expiry checked on app mount — expired token forces re-login immediately.
- [ ] No sensitive data (passwords, secrets) logged to console or Spring logs.
- [ ] Chart renders correctly with 3+ days of progress data.
- [ ] App fully functional on 375px mobile viewport.
- [ ] `Content-Security-Policy` meta tag present in built `index.html`.

**Deliverable:** A production-ready FitVeda application, fully tested end-to-end, secured at every layer, and ready for demo or deployment.

---

---

# Summary Timeline

```
Week 1  │ Phase 1 — Setup, Entities, Base Security Skeleton
        │ MERGE POINT 1: Schema verified · Routes live · Components render ·
        │                DevSecurityConfig active · Error handler tested
        │
Week 2  │ Phase 2 — CRUD APIs + Business Rules + Both Dashboards
        │ MERGE POINT 2: BCrypt confirmed · Overlap prevention works ·
        │                Full-stack connected · All 13 Postman tests pass
        │
Week 3  │ Phase 3 — JWT Auth · Rate Limiting · Analytics · Polish
        │ MERGE POINT 3: All 15 E2E tests pass · DevSecurityConfig deleted ·
        │                Rate limits verified · Full security checklist done
```

---

# Security Quick Reference (For Everyone)

> [!TIP]
> Keep this table open while coding. If any item is missing, the feature is incomplete.

| Concern | Where Enforced | How |
|---|---|---|
| Password storage | Backend — `UserService` | `BCryptPasswordEncoder` always |
| Brute force (auth) | Backend — `RateLimitFilter` | 10 req/hr per IP on `/api/auth/**` |
| Brute force (API) | Backend — `RateLimitFilter` | 30–60 req/min per userId |
| Token validation | Backend — `JwtFilter` | Signature + expiry check every request |
| Role access | Backend — `SecurityConfig` | HTTP method + path matchers |
| Data isolation | Backend — `Service layer` | Ownership check before every write/read |
| Input validation | Backend — `@Valid` + DTOs | `@NotBlank`, `@Email`, `@Size`, `@Min` |
| Duplicate logs | Backend — DB constraint | `UNIQUE(client_id, exercise_id, date)` |
| Overlap prevention | Backend — `PlanService` | JPQL overlap query before assign |
| Stack trace exposure | Backend — `GlobalExceptionHandler` | Catch-all returns generic message |
| Unauthenticated access | Frontend — `ProtectedRoute` | Redirects to `/` if no token |
| Token expiry (client) | Frontend — `AuthContext` mount | Decode JWT exp, logout if expired |
| 401 auto-logout | Frontend — Axios interceptor | Clears storage + redirects on 401 |
| Rate limit UX | Frontend — Axios interceptor | Toast + button cooldown on 429 |
| Sensitive headers | Frontend — `index.html` meta | CSP, X-Content-Type-Options |
| CORS | Backend — `WebMvcConfigurer` | Whitelist `localhost:5173` only |
