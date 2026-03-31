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
│       │           │   ├── SecurityConfig.java            ← Spring Security + OAuth2 setup
│       │           │   ├── JwtConfig.java                 ← JWT secret, expiry settings
│       │           │   ├── WebSocketConfig.java           ← STOMP WebSocket broker config
│       │           │   ├── CorsConfig.java                ← Allow React (localhost:5173) to call API
│       │           │   └── FileStorageConfig.java         ← Upload directory configuration
│       │           │
│       │           ├── security/                          ← Security filters and handlers
│       │           │   ├── JwtAuthenticationFilter.java   ← Validates JWT on every request
│       │           │   ├── JwtTokenProvider.java          ← Generate and parse JWT tokens
│       │           │   ├── OAuth2UserService.java         ← Handles Google login, creates user
│       │           │   ├── OAuth2SuccessHandler.java      ← Issues JWT after OAuth2 success
│       │           │   └── UserPrincipal.java             ← Wraps User entity for Spring Security
│       │           │
│       │           ├── exception/                         ← Global error handling
│       │           │   ├── GlobalExceptionHandler.java    ← @ControllerAdvice for all errors
│       │           │   ├── ResourceNotFoundException.java ← Thrown when entity not found (404)
│       │           │   ├── ConflictException.java         ← Thrown for booking conflicts (409)
│       │           │   ├── ForbiddenException.java        ← Thrown for access denied (403)
│       │           │   └── ErrorResponse.java             ← Standard error JSON structure
│       │           │
│       │           ├── common/                            ← Shared utilities used by all modules
│       │           │   ├── BaseEntity.java                ← id, createdAt, updatedAt (all entities extend this)
│       │           │   └── ApiResponse.java               ← Standard success response wrapper
│       │           │
│       │           │
│       │           ├── user/                              ── MEMBER 4 owns this module
│       │           │   ├── User.java                      ← JPA Entity
│       │           │   ├── Role.java                      ← Enum: USER, ADMIN, TECHNICIAN
│       │           │   ├── UserRepository.java            ← Spring Data JPA repository
│       │           │   ├── UserService.java               ← Business logic
│       │           │   ├── UserController.java            ← REST endpoints (/api/auth/me, etc.)
│       │           │   └── dto/
│       │           │       ├── UserResponse.java          ← What the API returns
│       │           │       └── UpdateRoleRequest.java     ← Request body for role change
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
│       │           │   ├── Notification.java              ← JPA Entity
│       │           │   ├── NotificationType.java          ← Enum: BOOKING_APPROVED, etc.
│       │           │   ├── NotificationRepository.java
│       │           │   ├── NotificationService.java       ← save + WebSocket push + email
│       │           │   ├── NotificationController.java    ← REST endpoints + HATEOAS
│       │           │   ├── EmailService.java              ← Spring Mail + Gmail SMTP
│       │           │   └── dto/
│       │           │       └── NotificationResponse.java
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
frontend/
│
├── public/
│   └── favicon.ico
│
├── src/
│   │
│   ├── main.jsx                          ← Entry point — renders <App />
│   ├── App.jsx                           ← Root component — routes + theme + auth wrapper
│   │
│   ├── assets/                           ← Images, logos, icons
│   │   └── logo.svg
│   │
│   ├── context/                          ← Global React state (shared across all pages)
│   │   ├── AuthContext.jsx               ← Current user, JWT token, login/logout — MEMBER 4
│   │   ├── NotificationContext.jsx       ← Unread count, notification list — MEMBER 4
│   │   └── ThemeContext.jsx              ← Dark / light mode toggle — MEMBER 4
│   │
│   ├── hooks/                            ← Custom reusable React hooks
│   │   ├── useAuth.js                    ← Access AuthContext easily
│   │   ├── useNotifications.js           ← Access NotificationContext
│   │   └── useTheme.js                   ← Access ThemeContext
│   │
│   ├── services/                         ← All Axios API calls — one file per module
│   │   ├── api.js                        ← Axios instance with base URL + JWT header
│   │   ├── authService.js                ← /api/auth/me, logout — MEMBER 4
│   │   ├── resourceService.js            ← /api/resources — MEMBER 1
│   │   ├── bookingService.js             ← /api/bookings — MEMBER 2
│   │   ├── ticketService.js              ← /api/tickets — MEMBER 3
│   │   └── notificationService.js        ← /api/notifications — MEMBER 4
│   │
│   ├── routes/                           ← Route protection wrappers
│   │   ├── ProtectedRoute.jsx            ← Redirects to /login if not authenticated
│   │   └── AdminRoute.jsx                ← Redirects if role is not ADMIN
│   │
│   ├── layouts/                          ← Page shell components
│   │   ├── MainLayout.jsx                ← Navbar + Sidebar + page content area
│   │   └── AuthLayout.jsx                ← Centered card layout for login page
│   │
│   ├── components/                       ← Reusable UI components (no page logic)
│   │   │
│   │   ├── common/                       ← Generic shared components
│   │   │   ├── Navbar.jsx                ← Top bar with user avatar + notification bell
│   │   │   ├── Sidebar.jsx               ← Left navigation links (role-aware)
│   │   │   ├── NotificationBell.jsx      ← Bell icon + badge + dropdown — MEMBER 4
│   │   │   ├── DarkModeToggle.jsx        ← Sun/moon icon button — MEMBER 4
│   │   │   ├── LoadingSpinner.jsx        ← Reusable loading indicator
│   │   │   ├── ConfirmDialog.jsx         ← Reusable confirmation modal
│   │   │   ├── StatusBadge.jsx           ← Coloured badge for statuses
│   │   │   ├── Pagination.jsx            ← Reusable pagination controls
│   │   │   └── EmptyState.jsx            ← "No results found" illustration + message
│   │   │
│   │   ├── resource/                     ── MEMBER 1
│   │   │   ├── ResourceCard.jsx          ← Single resource display card
│   │   │   ├── ResourceFilters.jsx       ← Search bar + filter dropdowns
│   │   │   └── AvailabilityCalendar.jsx  ← FullCalendar.js component
│   │   │
│   │   ├── booking/                      ── MEMBER 2
│   │   │   ├── BookingCard.jsx           ← Single booking row/card
│   │   │   ├── BookingStatusBadge.jsx    ← Coloured badge per status
│   │   │   └── RejectModal.jsx           ← Modal with rejection reason input
│   │   │
│   │   ├── ticket/                       ── MEMBER 3
│   │   │   ├── TicketCard.jsx            ← Single ticket display card
│   │   │   ├── SlaIndicator.jsx          ← SLA badge (green/orange/red)
│   │   │   ├── ImageUploader.jsx         ← Drag-drop image upload (max 3)
│   │   │   ├── ImageGallery.jsx          ← Thumbnail gallery with lightbox
│   │   │   └── CommentSection.jsx        ← Comments list + add comment form
│   │   │
│   │   └── notification/                 ── MEMBER 4
│   │       ├── NotificationItem.jsx      ← Single notification row
│   │       └── NotificationDropdown.jsx  ← The full dropdown panel
│   │
│   ├── pages/                            ← Top-level route pages
│   │   │
│   │   ├── auth/                         ── MEMBER 4
│   │   │   ├── LoginPage.jsx             ← Google Sign-In button page
│   │   │   └── OAuthCallbackPage.jsx     ← Reads JWT from URL, stores in context
│   │   │
│   │   ├── dashboard/
│   │   │   └── DashboardPage.jsx         ← Home after login (summary cards)
│   │   │
│   │   ├── resource/                     ── MEMBER 1
│   │   │   ├── ResourceListPage.jsx      ← Browse all resources with filters
│   │   │   ├── ResourceDetailPage.jsx    ← Single resource + book button
│   │   │   ├── ResourceCalendarPage.jsx  ← Availability calendar view
│   │   │   └── admin/
│   │   │       └── ResourceFormPage.jsx  ← Admin create/edit resource form
│   │   │
│   │   ├── booking/                      ── MEMBER 2
│   │   │   ├── BookingFormPage.jsx       ← New booking request form
│   │   │   ├── MyBookingsPage.jsx        ← User's own bookings list
│   │   │   ├── BookingDetailPage.jsx     ← Single booking detail
│   │   │   └── admin/
│   │   │       └── AdminBookingsPage.jsx ← Admin approve/reject panel + export
│   │   │
│   │   ├── ticket/                       ── MEMBER 3
│   │   │   ├── CreateTicketPage.jsx      ← New ticket form with image upload
│   │   │   ├── MyTicketsPage.jsx         ← User's own tickets list
│   │   │   ├── TicketDetailPage.jsx      ← Full ticket + SLA + comments
│   │   │   └── admin/
│   │   │       └── AdminTicketsPage.jsx  ← Admin manage tickets panel
│   │   │
│   │   ├── notification/                 ── MEMBER 4
│   │   │   └── NotificationsPage.jsx     ← Full notifications list page
│   │   │
│   │   └── admin/                        ── MEMBER 4
│   │       ├── UserManagementPage.jsx    ← Admin change user roles
│   │       └── AuditLogPage.jsx          ← Admin audit log table
│   │
│   └── utils/                            ← Helper functions
│       ├── formatDate.js                 ← Format dates nicely ("April 20, 2026")
│       ├── formatTime.js                 ← Format times ("09:00 AM")
│       ├── formatSla.js                  ← Convert minutes to "2h 15m"
│       └── constants.js                  ← API base URL, role names, status lists
│
├── index.html                            ← Vite HTML entry point
├── vite.config.js                        ← Vite config + proxy to backend
├── tailwind.config.js                    ← Tailwind config (darkMode: 'class')
├── postcss.config.js                     ← Required for Tailwind
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
