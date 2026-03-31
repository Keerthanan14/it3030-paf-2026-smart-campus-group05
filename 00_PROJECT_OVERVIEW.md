
# 🏛️ Smart Campus Operations Hub

## Product Requirements Document — Project Overview

**IT3030 | Programming Applications & Frameworks | SLIIT Faculty of Computing | 2026 Semester 1**

---

## 📋 Document Information

| Field               | Details                                                  |
| ------------------- | -------------------------------------------------------- |
| Course              | IT3030 — Programming Applications & Frameworks          |
| Institution         | SLIIT — Faculty of Computing                            |
| Assignment Weight   | 30% of Final Mark                                        |
| Assignment Released | 24th March 2026                                          |
| Viva / Demo Starts  | 11th April 2026 (TBA)                                    |
| Submission Deadline | 27th April 2026 — 11:45 PM (GMT +5:30) via Courseweb    |
| Team Size           | 4 Members (Individual contribution assessed)             |
| Required Stack      | Spring Boot 3 REST API + React (Vite) Client Application |
| Version Control     | GitHub Repository + GitHub Actions CI/CD                 |

---

## 1. Executive Summary

The **Smart Campus Operations Hub** is a full-stack, production-inspired web application built for a university to modernize its day-to-day operations. The platform replaces manual, paper-based processes with a unified digital system that handles two core domains:

* **Facility & Asset Bookings** — managing rooms, labs, and equipment reservations with a structured approval workflow.
* **Maintenance & Incident Ticketing** — allowing users to report faults, track repair progress, and communicate with assigned technicians.

The system is built on a **Java Spring Boot 3 REST API** backend following RESTful best practices and a **React** frontend that consumes the API. Authentication is handled via  **Google OAuth 2.0** , and the platform enforces **role-based access control** across all features.

The project also includes a suite of additional innovation features — real-time WebSocket notifications, email alerts, SLA tracking, an availability calendar, audit logging, PDF/Excel export, and dark mode — all designed to exceed the minimum assignment requirements and maximize marks in the creativity section.

---

## 2. Project Scope

### ✅ In Scope

* Complete Spring Boot 3 REST API with layered architecture, validation, and error handling
* React web application (Vite) consuming the REST API
* Google OAuth 2.0 authentication with JWT-based stateless sessions
* Role-based access control — USER, ADMIN, TECHNICIAN
* Five core functional modules: Resources, Bookings, Tickets, Notifications, Authentication
* Seven additional features: Real-time WebSocket notifications, Email notifications, Audit log, Dark mode, PDF/Excel export, Availability calendar, SLA timer for tickets
* GitHub repository with consistent commit history per member
* GitHub Actions CI/CD pipeline (build + test)
* Full documentation, Postman testing collection, and final report

### ❌ Out of Scope

* Mobile application (iOS / Android)
* Payment processing of any kind
* SMS notifications
* Third-party ERP or LMS integrations

---

## 3. Business Scenario

A university is modernising its day-to-day operations. The existing process for booking rooms and reporting faults is fragmented — handled via emails, phone calls, and spreadsheets. There is no central record, no audit trail, and no structured workflow for approvals or maintenance tracking.

The Smart Campus Operations Hub solves this by providing:

* A **single platform** where all staff and students can book bookable university resources
* A **structured approval workflow** so that admins review and approve or reject requests
* A **ticketing system** where users report incidents and technicians resolve them
* **Real-time visibility** into the status of bookings and tickets through notifications
* **Administrative oversight** through reports, audit logs, and analytics

---

## 4. Stakeholders & User Roles

| Role                 | Who They Are                        | What They Can Do                                                                                                                                                    |
| -------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **USER**       | Regular university staff or student | Browse resources, submit booking requests, raise incident tickets, view their own data, receive notifications                                                       |
| **ADMIN**      | System administrator                | All USER permissions + approve/reject bookings, assign technicians, view all bookings/tickets, manage resources, export reports, view audit logs, manage user roles |
| **TECHNICIAN** | Maintenance staff                   | View tickets assigned to them, update ticket status, add resolution notes, add comments                                                                             |

> **Note:** Users are assigned the USER role by default on first login. ADMIN can promote any user to ADMIN or TECHNICIAN.

---

## 5. Core Modules — Summary

The system is divided into five functional modules. Each module has a designated owner from the team.

### Module A — Facilities & Assets Catalogue

**Owner: Member 1**

Maintains a catalogue of all bookable university resources — lecture halls, labs, meeting rooms, and equipment such as projectors and cameras. Each resource has metadata (type, capacity, location, availability windows, status). Users can search and filter the catalogue. Admins manage the resource list. An availability calendar gives users a visual overview of free and booked slots.

---

### Module B — Booking Management

**Owner: Member 2**

Allows users to request bookings for a resource by specifying date, time range, purpose, and attendee count. Bookings go through a structured workflow. The system automatically detects and prevents scheduling conflicts. Admins review and approve or reject requests. Users can cancel their own approved bookings. Admins can export booking records as PDF or Excel reports.

**Booking Workflow:**

```
PENDING → APPROVED → (can be CANCELLED by user)
        → REJECTED  (with mandatory reason from Admin)
```

---

### Module C — Maintenance & Incident Ticketing

**Owner: Member 3**

Users raise incident tickets for faults or issues at specific resources or locations. Tickets can include up to 3 image attachments as evidence. A technician is assigned by the admin and updates the status through the workflow. Users, technicians, and admins can all comment on tickets with ownership rules enforced. The SLA timer tracks response and resolution times, highlighting breaches.

**Ticket Workflow:**

```
OPEN → IN_PROGRESS → RESOLVED → CLOSED
                              → REJECTED (by Admin, with reason)
```

---

### Module D — Notifications

**Owner: Member 4**

Users receive notifications for key events: booking approved/rejected, ticket status changed, and new comment on their ticket. Notifications appear in a bell icon panel in the React UI with an unread count badge. Notifications are delivered in real-time via WebSocket (STOMP). Critical events also trigger email notifications via SMTP.

---

### Module E — Authentication & Authorization

**Owner: Member 4**

Users log in via Google OAuth 2.0 (Google Sign-In). On first login, their profile is automatically created with the USER role. JWT tokens are issued for stateless API authentication. All REST endpoints are secured with Spring Security and role-based access control. React frontend routes are protected — unauthenticated users are redirected to login.

---

## 6. Additional / Innovation Features

These features are beyond the minimum requirements and directly target the **10 Creativity marks** in the rubric.

| Feature                 | Technical Approach                                                                     | Owned By |
| ----------------------- | -------------------------------------------------------------------------------------- | -------- |
| Real-time Notifications | Spring WebSocket + STOMP + SockJS on React side                                        | Member 4 |
| Email Notifications     | Spring Mail + Gmail SMTP                                                               | Member 4 |
| Audit Log               | Service-level logging to audit_logs table. Admin panel UI                              | Member 3 |
| Dark Mode               | React Context + CSS variables / Tailwind. Preference in localStorage                   | Member 4 |
| Export PDF/Excel        | iText (PDF) + Apache POI (Excel) on backend. Download endpoint                         | Member 2 |
| Availability Calendar   | FullCalendar.js React library. Shows booked vs free slots per resource                 | Member 1 |
| SLA Timer for Tickets   | Backend timestamp tracking (first_response_at, resolved_at). React badges for breaches | Member 3 |

---

## 7. System Architecture

### 7.1 High-Level Overview

```
┌─────────────────────────────────────┐
│         React Frontend (Vite)       │
│  Pages / Components / Context       │
│  Axios API Services / STOMP Client  │
└──────────────┬──────────────────────┘
               │  HTTP REST + WebSocket (STOMP)
┌──────────────▼──────────────────────┐
│      Spring Boot 3 REST API         │
│  Controller → Service → Repository  │
│  Spring Security + JWT + OAuth2     │
└────┬──────────────┬─────────────────┘
     │              │
┌────▼────┐   ┌─────▼──────┐   ┌──────────────┐
│ MySQL / │   │ Google     │   │ SMTP (Email) │
│Postgres │   │ OAuth 2.0  │   │ Spring Mail  │
└─────────┘   └────────────┘   └──────────────┘
               │
┌──────────────▼──────────────────────┐
│  GitHub Repository + GitHub Actions │
│  CI/CD: Build + Test on every push  │
└─────────────────────────────────────┘
```

### 7.2 Backend Layered Architecture

```
HTTP Request
     ↓
Controller Layer      ← Maps endpoints, handles HTTP in/out
     ↓
Service Layer         ← Business logic, workflow rules, notifications
     ↓
Repository Layer      ← Spring Data JPA, DB queries
     ↓
Database (MySQL/PostgreSQL)
```

Supporting layers:

* **DTO Layer** — Request/Response objects decoupled from JPA entities
* **Security Layer** — Spring Security filter chain, JWT validation, @PreAuthorize
* **Exception Handler** — @ControllerAdvice for consistent error JSON responses
* **WebSocket Config** — STOMP broker for real-time notification delivery

### 7.3 Frontend Architecture

```
src/
├── pages/            ← Top-level route components
├── components/       ← Reusable UI components
├── context/          ← AuthContext, NotificationContext, ThemeContext
├── services/         ← Axios API modules per domain
├── hooks/            ← Custom React hooks
├── routes/           ← Protected route wrappers
└── utils/            ← Helpers, formatters, constants
```

---

## 8. Database Schema Overview

Eight core tables. All use UUID primary keys. MySQL or PostgreSQL recommended.

| Table                  | Purpose                               | Key Columns                                                                                       |
| ---------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `users`              | Stores all authenticated users        | id, email, name, role, profile_picture                                                            |
| `resources`          | Bookable university resources         | id, name, type, capacity, location, status, availability_windows                                  |
| `bookings`           | Booking requests and their status     | id, user_id, resource_id, date, start_time, end_time, status, rejection_reason                    |
| `tickets`            | Incident/maintenance tickets          | id, user_id, resource_id, category, priority, status, assigned_to, first_response_at, resolved_at |
| `ticket_attachments` | Image attachments per ticket (max 3)  | id, ticket_id, file_url, file_name                                                                |
| `comments`           | Comments on tickets by any role       | id, ticket_id, user_id, content                                                                   |
| `notifications`      | In-app and real-time notifications    | id, user_id, type, message, is_read, reference_id, reference_type                                 |
| `audit_logs`         | Full action history across the system | id, user_id, action, entity_type, entity_id, old_value, new_value                                 |

### Entity Relationships

```
users ──────< bookings >────── resources
users ──────< tickets  >────── resources
tickets ────< ticket_attachments
tickets ────< comments >─────── users
users ──────< notifications
users ──────< audit_logs
tickets ────── assigned_to (FK → users)
```

---

## 9. REST API — Endpoint Summary

All endpoints prefixed with `/api`. JWT Bearer token required in `Authorization` header for all endpoints.

### Resources (Member 1)

| Method | Endpoint                         | Role       | Description                 |
| ------ | -------------------------------- | ---------- | --------------------------- |
| GET    | /api/resources                   | USER/ADMIN | List all with filters       |
| GET    | /api/resources/{id}              | USER/ADMIN | Get single resource         |
| POST   | /api/resources                   | ADMIN      | Create resource             |
| PUT    | /api/resources/{id}              | ADMIN      | Update resource             |
| PATCH  | /api/resources/{id}/status       | ADMIN      | Change status               |
| DELETE | /api/resources/{id}              | ADMIN      | Soft delete                 |
| GET    | /api/resources/{id}/availability | USER/ADMIN | Calendar availability slots |

### Bookings (Member 2)

| Method | Endpoint                   | Role       | Description            |
| ------ | -------------------------- | ---------- | ---------------------- |
| GET    | /api/bookings              | USER/ADMIN | List bookings          |
| GET    | /api/bookings/{id}         | USER/ADMIN | Get single booking     |
| POST   | /api/bookings              | USER       | Create booking request |
| PUT    | /api/bookings/{id}/approve | ADMIN      | Approve booking        |
| PUT    | /api/bookings/{id}/reject  | ADMIN      | Reject with reason     |
| PUT    | /api/bookings/{id}/cancel  | USER       | Cancel own booking     |
| GET    | /api/bookings/export/pdf   | ADMIN      | Export PDF report      |
| GET    | /api/bookings/export/excel | ADMIN      | Export Excel report    |

### Tickets (Member 3)

| Method | Endpoint                         | Role        | Description            |
| ------ | -------------------------------- | ----------- | ---------------------- |
| GET    | /api/tickets                     | USER/ADMIN  | List tickets           |
| GET    | /api/tickets/{id}                | USER/ADMIN  | Get ticket detail      |
| POST   | /api/tickets                     | USER        | Create ticket + images |
| PUT    | /api/tickets/{id}/status         | ADMIN/TECH  | Update status          |
| PUT    | /api/tickets/{id}/assign         | ADMIN       | Assign technician      |
| POST   | /api/tickets/{id}/comments       | ALL         | Add comment            |
| PUT    | /api/tickets/{id}/comments/{cid} | OWNER       | Edit own comment       |
| DELETE | /api/tickets/{id}/comments/{cid} | OWNER/ADMIN | Delete comment         |
| GET    | /api/audit-logs                  | ADMIN       | Get audit logs         |

### Notifications & Auth (Member 4)

| Method | Endpoint                     | Role | Description                                         |
| ------ | ---------------------------- | ---- | --------------------------------------------------- |
| GET    | /api/auth/me                 | ALL  | Get current user profile                            |
| POST   | /api/auth/logout             | ALL  | Logout                                              |
| GET    | /api/notifications           | ALL  | Get user notifications                              |
| PUT    | /api/notifications/{id}/read | ALL  | Mark one as read                                    |
| PUT    | /api/notifications/read-all  | ALL  | Mark all as read                                    |
| WS     | /ws (STOMP)                  | ALL  | WebSocket — subscribe to /user/queue/notifications |

---

## 10. Tech Stack

| Layer           | Technology                                       | Purpose                                   |
| --------------- | ------------------------------------------------ | ----------------------------------------- |
| Language        | Java 17                                          | Backend                                   |
| Framework       | Spring Boot 3                                    | REST API, Security, Data, Mail, WebSocket |
| Security        | Spring Security + OAuth2 + JWT                   | Authentication & Authorization            |
| Database        | MySQL / PostgreSQL                               | Data persistence via Spring Data JPA      |
| File Storage    | Local filesystem / Cloudinary                    | Ticket image attachments                  |
| Email           | Spring Mail + Gmail SMTP                         | Email notifications                       |
| WebSocket       | Spring WebSocket (STOMP + SockJS)                | Real-time notification delivery           |
| Frontend        | React 18 + Vite                                  | Client web application                    |
| UI Styling      | Tailwind CSS or Material UI                      | Component styling                         |
| Calendar        | FullCalendar.js (React)                          | Resource availability view                |
| Charts          | Recharts or Chart.js                             | Admin analytics                           |
| Export          | iText PDF + Apache POI                           | Report generation                         |
| API Testing     | Postman Collection                               | Manual testing and docs                   |
| HATEOAS         | Spring HATEOAS (`spring-boot-starter-hateoas`) | Hypermedia links in API responses         |
| Version Control | Git + GitHub                                     | Source code management                    |
| CI/CD           | GitHub Actions                                   | Automated build and test                  |

---

## 11. Workload Allocation

| Member   | Core Module                         | Additional Features           | Endpoints     |
| -------- | ----------------------------------- | ----------------------------- | ------------- |
| Member 1 | Module A — Resources & Assets      | Availability Calendar View    | 7             |
| Member 2 | Module B — Booking Management      | Export PDF / Excel Reports    | 8             |
| Member 3 | Module C — Maintenance & Tickets   | SLA Timer + Audit Log         | 9             |
| Member 4 | Modules D+E — Notifications & Auth | WebSocket + Email + Dark Mode | 6 + WebSocket |

### Git Branching Strategy

```
main                              ← Protected. Production-ready only.
  └── develop                     ← Integration branch. All features merge here.
        ├── feature/member1-resources
        ├── feature/member2-bookings
        ├── feature/member3-tickets
        └── feature/member4-auth-notifications
```

Each member raises a **Pull Request** from their feature branch to `develop`. No direct pushes to `main` or `develop`.

---

## 12. Development Timeline

| Week   | Period       | Phase                  | Key Goals                                                                                                                  |
| ------ | ------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Week 1 | Now → 6 Apr | Planning & Setup       | Finalize split, design DB schema, set up GitHub repo, init Spring Boot + React, configure OAuth 2.0, set up GitHub Actions |
| Week 2 | 7 → 14 Apr  | Core Backend           | Each member builds their REST API endpoints, connects DB, implements security.**⚠️ VIVA STARTS 11 APR**            |
| Week 3 | 15 → 21 Apr | Frontend + Integration | React UI pages per member, connect to API, Google login flow in React, WebSocket client                                    |
| Week 4 | 22 → 27 Apr | Polish + Submit        | Additional features, end-to-end testing, Postman collection, final report, screenshots/video, submit by 27 Apr 11:45 PM    |

---

## 13. HATEOAS — Hypermedia As The Engine Of Application State

### What It Is

HATEOAS is one of the **six REST architectural constraints** and is directly tested in the rubric under "Follows the Six REST Architectural Styles (10 marks — Individual)." It means every API response includes a `_links` section telling the client what actions are available next — the client does not need to hardcode any URLs.

**Without HATEOAS:**

```json
{
  "id": "abc-123",
  "status": "PENDING"
}
```

The frontend has to already know that to approve this booking it should call `PUT /api/bookings/abc-123/approve`. That knowledge is hardcoded.

**With HATEOAS:**

```json
{
  "id": "abc-123",
  "status": "PENDING",
  "_links": {
    "self":    { "href": "/api/bookings/abc-123" },
    "approve": { "href": "/api/bookings/abc-123/approve" },
    "reject":  { "href": "/api/bookings/abc-123/reject" }
  }
}
```

The frontend reads `_links` and shows the Approve/Reject buttons dynamically. No hardcoded URLs.

### Dependency — Add to Every Member's `pom.xml`

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-hateoas</artifactId>
</dependency>
```

### Six REST Constraints — How Your Project Satisfies All Six

| Constraint        | How You Implement It                                           |
| ----------------- | -------------------------------------------------------------- |
| Client-Server     | React frontend and Spring Boot backend are completely separate |
| Stateless         | JWT token in every request — no server-side session           |
| Cacheable         | `Cache-Control`headers on GET responses                      |
| Uniform Interface | Consistent `/api/resources/{id}`naming + HATEOAS links       |
| Layered System    | Controller → Service → Repository architecture               |
| **HATEOAS** | **`_links`in every EntityModel response**              |

### Who Implements What

| Member   | Key HATEOAS Behaviour                                                                                                         |
| -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Member 1 | Resource response includes links to self, availability, book, update, delete                                                  |
| Member 2 | **Dynamic links**— PENDING booking gets approve+reject links, APPROVED gets cancel link, terminal states get self only |
| Member 3 | Ticket response includes links to self, update-status, assign, add-comment                                                    |
| Member 4 | Notification response includes self, mark-read, and link to the related booking or ticket                                     |

### Most Important — Member 2's Dynamic Links

The booking module demonstrates HATEOAS most powerfully because the available links  **change based on the booking's current status** . This is exactly what HATEOAS was designed for and will impress the examiner most.

```
PENDING booking  →  _links: self, approve, reject
APPROVED booking →  _links: self, cancel
REJECTED booking →  _links: self  (no further actions)
CANCELLED booking → _links: self  (no further actions)
```

---

## 14. Marking Rubric — Target Summary

| Criteria                                | Marks         | Graded     | Target                                                                                            |
| --------------------------------------- | ------------- | ---------- | ------------------------------------------------------------------------------------------------- |
| Documentation — Final Report           | 15            | Group      | Clear structure, diagrams, endpoint list, test evidence, contribution table                       |
| REST API — Endpoint Naming             | 5             | Individual | RESTful names, consistent, meaningful                                                             |
| REST API — Six REST Constraints        | 10            | Individual | Stateless JWT, uniform interface, layered system, caching,**HATEOAS (_links in responses)** |
| REST API — HTTP Methods & Status Codes | 10            | Individual | Correct GET/POST/PUT/DELETE with 200/201/204/400/404                                              |
| REST API — Code Quality                | 5             | Individual | Clean layered architecture, Java conventions, documented                                          |
| REST API — Satisfying Requirements     | 5             | Individual | All endpoints working with auth, CRUD, validation                                                 |
| Client App — Architecture              | 5             | Individual | Modular React, clean folder structure, reusable components                                        |
| Client App — Requirements              | 5             | Individual | All features working, smooth API integration                                                      |
| Client App — UI/UX                     | 10            | Individual | Visually appealing, intuitive, dark mode, responsive                                              |
| Version Control — Git                  | 5             | Group      | Meaningful commits, branching, PR workflow                                                        |
| Version Control — GitHub Actions       | 5             | Group      | Working CI pipeline on every push/PR                                                              |
| Authentication — OAuth 2.0             | 10            | Group      | Google Sign-In, JWT, role enforcement, session management                                         |
| Creativity / Innovation                 | 10            | Group      | 7 additional features implemented                                                                 |
| **TOTAL**                         | **100** | —         | —                                                                                                |

---

## 15. Submission Checklist

* [ ] GitHub repository created: `it3030-paf-2026-smart-campus-groupXX`
* [ ] README with clear local setup instructions
* [ ] Active, meaningful commit history from all 4 members
* [ ] GitHub Actions CI pipeline passing (build + test)
* [ ] Spring Boot API running locally without errors
* [ ] React frontend running locally, fully connected to API
* [ ] Google OAuth 2.0 login working end-to-end
* [ ] All core module endpoints implemented and tested
* [ ] All 7 additional features implemented
* [ ] Postman collection with all endpoint tests exported
* [ ] Final report PDF: `IT3030_PAF_Assignment_2026_GroupXX.pdf`
* [ ] Screenshots or short video of key workflows and OAuth login
* [ ] Submission `.zip` uploaded to Courseweb by **11:45 PM, 27th April 2026**

---

## 16. Academic Integrity

* Every member must commit regularly — avoid single-day bulk commits.
* Every member must fully explain their own endpoints, DB design, and UI components at the viva.
* AI-generated code (ChatGPT, Gemini, etc.) is **allowed but must be disclosed** in the documentation.
* The README and final report must match what is actually implemented.
* Copying from seniors or other groups results in **zero marks** for affected components.
* The repository must clearly indicate which member implemented which endpoints and UI components.

---

*End of Project Overview PRD*
*IT3030 — SLIIT Faculty of Computing — 2026 Semester 1*
