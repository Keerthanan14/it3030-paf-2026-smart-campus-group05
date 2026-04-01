# 📁 Smart Campus Operations Hub — Folder Structure Guide

**VS Code | One Root Folder | Spring Boot + React + PostgreSQL + Tailwind CSS**

---

## 🗂️ Root Level

```
smartcampus/                        ← Open THIS folder in VS Code
│
├── backend/                             ← Spring Boot REST API (Java)
├── frontend/                            ← React App (Vite + Tailwind)
├── .gitignore                           ← Ignores node_modules, target, .env
└── README.md                            ← Setup instructions for evaluators
   
```

> Open VS Code → File → Open Folder → select `smartcampus/`
> You will see both `backend/` and `frontend/` side by side in the Explorer panel.

---

## 🟢 BACKEND — Spring Boot Folder Structure

```
backend/
│
├── src/
│   └── main/
│       ├── java/
│       │   └── com/
│       │       └── smartcampus/
│       │           │
│       │           ├── SmartCampusApiApplication.java        ← Main entry point (@SmartCampusApiApplication)
│       │           │
│       │           ├── config/                            ← All configuration classes
│       │           │   ├── CorsConfig.java                ← Allow React (localhost:5173) to call API
│       │           │   ├── FileStorageConfig.java         ← Upload directory configuration
│       │           │   ├── SecurityConfig.java            ← Spring Security + OAuth2 setup
│       │           │   └── WebSocketConfig.java           ← STOMP WebSocket broker config
│       │           │
│       │           ├── security/                          ← Security filters and handlers
│       │           │   ├── AuthUserPrincipal.java         ← Wraps User entity for Spring Security
│       │           │   ├── CustomOAuth2UserService.java   ← Handles Google login, creates user
│       │           │   ├── JwtAuthenticationFilter.java   ← Validates JWT on every request
│       │           │   ├── JwtTokenProvider.java          ← Generate and parse JWT tokens
│       │           │   └── OAuth2SuccessHandler.java      ← Issues JWT after OAuth2 success
│       │           │
│       │           ├── exception/                         ← Global error handling
│       │           │   ├── ConflictException.java         ← Thrown for booking conflicts (409)
│       │           │   ├── ErrorResponse.java             ← Standard error JSON structure
│       │           │   ├── ForbiddenException.java        ← Thrown for access denied (403)
│       │           │   ├── GlobalExceptionHandler.java    ← @ControllerAdvice for all errors
│       │           │   └── ResourceNotFoundException.java ← Thrown when entity not found (404)
│       │           │
│       │           ├── common/                            ← Shared utilities used by all modules
│       │           │   ├── ApiResponse.java               ← Standard success response wrapper
│       │           │   └── BaseEntity.java                ← id, createdAt, updatedAt (all entities extend this)
│       │           │
│       │           │
│       │           ├── user/                              ── MEMBER 4 owns this module
│       │           │   ├── AuthProvider.java              ← Enum: GOOGLE, LOCAL
│       │           │   ├── Role.java                      ← Enum: STUDENT, ADMIN, TECHNICIAN
│       │           │   ├── User.java                      ← JPA Entity
│       │           │   ├── UserController.java            ← REST endpoints (/api/users)
│       │           │   ├── UserRepository.java            ← Spring Data JPA repository
│       │           │   ├── UserService.java               ← Business logic interface
│       │           │   ├── UserServiceImpl.java           ← Business logic implementation
│       │           │   └── dto/
│       │           │       └── UserResponse.java          ← What the API returns
│       │           │
│       │           ├── resource/                          ── MEMBER 1 owns this module
│       │           │   ├── Resource.java                  ← JPA Entity
│       │           │   ├── ResourceType.java              ← Enum: ROOM, LAB, EQUIPMENT
│       │           │   ├── ResourceStatus.java            ← Enum: ACTIVE, OUT_OF_SERVICE
│       │           │   ├── ResourceRepository.java        ← Queries with filters
│       │           │   ├── ResourceService.java           ← Business logic
│       │           │   ├── ResourceController.java        ← REST endpoints + HATEOAS links
│       │           │   └── dto/
│       │           │       ├── CreateResourceRequest.java
│       │           │       ├── UpdateResourceRequest.java
│       │           │       ├── UpdateStatusRequest.java
│       │           │       └── ResourceResponse.java
│       │           │
│       │           ├── booking/                           ── MEMBER 2 owns this module
│       │           │   ├── Booking.java                   ← JPA Entity
│       │           │   ├── BookingStatus.java             ← Enum: PENDING, APPROVED, REJECTED, CANCELLED
│       │           │   ├── BookingRepository.java         ← Conflict detection query here
│       │           │   ├── BookingService.java            ← Workflow + conflict logic
│       │           │   ├── BookingController.java         ← REST endpoints + dynamic HATEOAS
│       │           │   ├── BookingExportService.java      ← PDF and Excel generation
│       │           │   └── dto/
│       │           │       ├── CreateBookingRequest.java
│       │           │       ├── RejectBookingRequest.java
│       │           │       └── BookingResponse.java
│       │           │
│       │           ├── ticket/                            ── MEMBER 3 owns this module
│       │           │   ├── Ticket.java                    ← JPA Entity
│       │           │   ├── TicketStatus.java              ← Enum: OPEN, IN_PROGRESS, RESOLVED, CLOSED, REJECTED
│       │           │   ├── TicketPriority.java            ← Enum: LOW, MEDIUM, HIGH, CRITICAL
│       │           │   ├── TicketRepository.java
│       │           │   ├── TicketService.java             ← Workflow + SLA tracking
│       │           │   ├── TicketController.java          ← REST endpoints + HATEOAS
│       │           │   ├── attachment/
│       │           │   │   ├── TicketAttachment.java      ← JPA Entity
│       │           │   │   ├── TicketAttachmentRepository.java
│       │           │   │   └── FileStorageService.java    ← Save/delete image files
│       │           │   ├── comment/
│       │           │   │   ├── Comment.java               ← JPA Entity
│       │           │   │   ├── CommentRepository.java
│       │           │   │   ├── CommentService.java        ← Ownership enforcement
│       │           │   │   └── CommentController.java
│       │           │   └── dto/
│       │           │       ├── CreateTicketRequest.java
│       │           │       ├── UpdateTicketStatusRequest.java
│       │           │       ├── AssignTicketRequest.java
│       │           │       ├── CreateCommentRequest.java
│       │           │       ├── TicketResponse.java
│       │           │       └── CommentResponse.java
│       │           │
│       │           ├── notification/                      ── MEMBER 4 owns this module
│       │           │   ├── EmailService.java              ← Spring Mail + Gmail SMTP
│       │           │   ├── Notification.java              ← JPA Entity
│       │           │   ├── NotificationController.java    ← REST endpoints
│       │           │   ├── NotificationRepository.java    ← Spring Data JPA repository
│       │           │   ├── NotificationService.java       ← Business logic interface
│       │           │   ├── NotificationServiceImpl.java   ← Business logic implementation
│       │           │   ├── NotificationType.java          ← Enum: BOOKING_APPROVED, etc.
│       │           │   ├── ReferenceType.java             ← Enum to link notifications to objects
│       │           │   └── dto/
│       │           │       ├── NotificationResponse.java
│       │           │       ├── NotificationUpdateResponse.java
│       │           │       └── PaginatedNotificationResponse.java
│       │           │
│       │           └── audit/                             ── MEMBER 3 owns this module
│       │               ├── AuditLog.java                  ← JPA Entity
│       │               ├── AuditLogRepository.java
│       │               ├── AuditLogService.java           ← Called by ALL other services
│       │               ├── AuditLogController.java        ← GET /api/audit-logs (Admin only)
│       │               └── dto/
│       │                   └── AuditLogResponse.java
│       │
│       └── resources/
│           ├── application.properties                     ← Main config (DB, JWT, Mail, OAuth2)
│           ├── application-dev.properties                 ← Local dev overrides
│           └── static/
│               └── uploads/                              ← Ticket image files stored here
│                   └── tickets/
│
├── src/
│   └── test/
│       └── java/
│           └── com/
│               └── smartcampus/
│                   ├── resource/
│                   │   └── ResourceServiceTest.java
│                   ├── booking/
│                   │   └── BookingServiceTest.java        ← Conflict detection unit tests
│                   └── ticket/
│                       └── TicketServiceTest.java
│
└── pom.xml                                               ← All dependencies here
```

---

## 🔵 FRONTEND — React + Vite + Tailwind CSS Folder Structure

```
src/
├── main.tsx                      # Entry point 
├── App.tsx                        # Root component — wraps router + providers
│
├── app/                         # Core app setup
│   ├── router.tsx               # Central route configuration
│   └── store/                   # Zustand global state
│       ├── authStore.ts         # User auth + token
│       └── uiStore.ts           # UI state (theme, loading, modals)
│
├── assets/                      # Static files
│   └── images/
│       └── logo.svg             # App logo
│
├── shared/                      # Reusable global logic
│   ├── components/              # Buttons, Navbar, Modals, Spinner, etc.
│   │ 
│   ├── services/
│   │   └── api.ts               # Axios instance + interceptors
│   └── utils/                   # formatDate, formatTime, constants
│
├── features/                    # Feature modules
│   ├── auth/                    # MEMBER 4
│   │   ├── pages/               # LoginPage, OAuthCallbackPage
│   │   ├── components/          # Auth UI components
│   │   ├── services/            # authService.ts
│   │   ├── hooks/               # useAuth.ts
│   │   └── store/               # Optional local Zustand slice
│   ├── booking/                 # MEMBER 2
│   │   ├── pages/               # Booking pages
│   │   ├── components/          # BookingCard, StatusBadge, RejectModal
│   │   ├── services/            # bookingService.ts
│   │   ├── hooks/               # useBookings.ts
│   │   └── types/               # bookingTypes.ts/ts
│   ├── ticket/                  # MEMBER 3
│   │   ├── pages/
│   │   ├── components/
│   │   ├── services/
│   │   └── hooks/
│   ├── resource/                # MEMBER 1
│   │   ├── pages/
│   │   ├── components/
│   │   ├── services/
│   │   └── hooks/
│   ├── notification/            # MEMBER 4
│   │   ├── pages/
│   │   ├── components/
│   │   ├── services/
│   │   └── hooks/
│   └── admin/                   # MEMBER 4
│       ├── pages/
│       ├── components/
│       ├── services/
│       ├── hooks/               
│       └── store/ 
│
├── layouts/                     # Page layouts
│   ├── MainLayout.tsx
│   └── AuthLayout.tsx
│
├── routes/                      # Route guards
│   ├── ProtectedRoute.tsx
│   └── AdminRoute.tsx
│
├── index.html                            ← Vite HTML entry point
├── vite.config.ts                        ← Vite config + proxy to backend
├── tailwind.config.ts                    ← Tailwind config (darkMode: 'class')
├── postcss.config.ts                     ← Required for Tailwind
└── package.json                          ← All npm dependencies
```

---

## 🗂️ VS Code Workspace Setup

### Step 1 — Open the Root Folder

```
File → Open Folder → select smartcampus/
```

You will see this in the VS Code Explorer:

```
SMARTCAMPUS
  ├── backend/
  ├── frontend/
  ├── .github/
  ├── .gitignore
  └── README.md
```

### Step 2 — Recommended VS Code Extensions

Install these extensions for the best experience:

**For Java / Spring Boot:**

| Extension                  | Publisher |
| -------------------------- | --------- |
| Extension Pack for Java    | Microsoft |
| Spring Boot Extension Pack | VMware    |
| Lombok Annotations Support | GabrielBB |

**For React / Frontend:**

| Extension                              | Publisher     |
| -------------------------------------- | ------------- |
| ES7+ React/Redux/React-Native snippets | dsznajder     |
| Tailwind CSS IntelliSense              | Tailwind Labs |
| Prettier — Code Formatter             | Prettier      |
| ESLint                                 | Microsoft     |
| Auto Rename Tag                        | Jun Han       |

**For Both:**

| Extension      | Publisher                                   |
| -------------- | ------------------------------------------- |
| GitLens        | GitKraken                                   |
| Thunder Client | Rangav (lightweight Postman inside VS Code) |
| PostgreSQL     | Chris Kolkman                               |
| DotENV         | mikestead                                   |

### Step 3 — Two Integrated Terminals Side by Side

Open two terminals in VS Code (`Ctrl + `` then split):

```
Terminal 1 (Backend):
  cd backend
  ./mvnw spring-boot:run

Terminal 2 (Frontend):
  cd frontend
  npm run dev
```

Backend runs on → `http://localhost:8080`
Frontend runs on → `http://localhost:5173`

### Step 4 — Vite Proxy Configuration

In `frontend/vite.config.js`, add a proxy so frontend API calls go to backend without CORS issues during development:

```
server: {
  proxy: {
    '/api': 'http://localhost:8080',
    '/oauth2': 'http://localhost:8080',
    '/ws': {
      target: 'http://localhost:8080',
      ws: true
    }
  }
}
```

---

## 👥 Who Owns What — At a Glance

### Backend (Spring Boot)

| Folder                                    | Owner                           |
| ----------------------------------------- | ------------------------------- |
| `security/`,`user/`,`notification/` | Member 4                        |
| `resource/`                             | Member 1                        |
| `booking/`                              | Member 2                        |
| `ticket/`,`audit/`                    | Member 3                        |
| `config/`,`exception/`,`common/`    | All — agree together in Week 1 |

### Frontend (React)

| Folder                                                                                                                          | Owner                            |
| ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| `context/`,`pages/auth/`,`pages/admin/`,`pages/notification/`,`components/common/Navbar`,`components/notification/` | Member 4                         |
| `pages/resource/`,`components/resource/`                                                                                    | Member 1                         |
| `pages/booking/`,`components/booking/`                                                                                      | Member 2                         |
| `pages/ticket/`,`components/ticket/`                                                                                        | Member 3                         |
| `layouts/`,`routes/`,`hooks/`,`utils/`,`services/api.js`                                                              | All — set up together in Week 1 |

---

## 📦 Key Files Every Member Must Know

| File                                                  | Why It Matters                                                                   |
| ----------------------------------------------------- | -------------------------------------------------------------------------------- |
| `backend/src/main/resources/application.properties` | DB connection, JWT secret, mail config, OAuth2 keys — never commit to GitHub    |
| `backend/pom.xml`                                   | All Spring Boot dependencies — everyone adds their own here                     |
| `frontend/src/services/api.js`                      | Single Axios instance — every service file imports from here                    |
| `frontend/src/context/AuthContext.jsx`              | Every page uses this to get current user and token                               |
| `frontend/tailwind.config.js`                       | `darkMode: 'class'`must be set here for dark mode to work                      |
| `.gitignore`                                        | Must include:`target/`,`node_modules/`,`.env`,`*.properties`with secrets |

---

## ⚠️ Critical Rules for the Team

* **Never commit** `application.properties` with real secrets — use environment variables or a `.env` file and add it to `.gitignore`
* **Never push** to `main` or `develop` directly — always use your feature branch and raise a PR
* Each member works only inside their own module folders — do not edit another member's files without discussion
* The `config/`, `exception/`, and `common/` backend folders and `layouts/`, `routes/`, `services/api.js` frontend files are **shared** — discuss before changing them
* Run `./mvnw clean install` in backend and `npm install` in frontend after every Pull Request merge to stay up to date

---

*End of Folder Structure Guide*
*IT3030 — SLIIT Faculty of Computing — 2026 Semester 1*
