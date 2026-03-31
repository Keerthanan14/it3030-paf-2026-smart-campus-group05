
# 👤 Member 4 — Authentication + Notifications + WebSocket + Email + Dark Mode

## Individual PRD | IT3030 Smart Campus Operations Hub

---

## 📌 Quick Reference

| Field                       | Details                                                                 |
| --------------------------- | ----------------------------------------------------------------------- |
| Modules Owned               | Module D — Notifications + Module E — Authentication & Authorization  |
| Additional Features         | Real-time WebSocket Notifications + Email Notifications + Dark Mode     |
| Total Endpoints             | 6 REST endpoints + 1 WebSocket endpoint                                 |
| Frontend Pages / Components | 6 components                                                            |
| Viva Readiness              | Must explain OAuth2 flow, JWT, WebSocket, email setup, role enforcement |

---

## 1. Overview of Responsibility

Member 4 owns the **security and communication layer** of the entire system. While other members own their data modules, your work underpins everything — without authentication and authorization, no endpoint in the system can safely operate.

Your job is to:

* Configure Google OAuth 2.0 login so users can sign in with their Google account
* Issue and validate JWT tokens for stateless API authentication
* Enforce role-based access control on all protected endpoints
* Build the notification system (in-app, real-time WebSocket, and email)
* Provide the dark mode toggle in the frontend

Because authentication is foundational, you should have the **OAuth 2.0 + JWT setup working in Week 1** — before other members even start their endpoints. Your security configuration directly affects everyone else's work.

---

## 2. Functional Requirements

### 2.1 Authentication (Module E)

| ID     | Requirement                                                                                         | Priority  |
| ------ | --------------------------------------------------------------------------------------------------- | --------- |
| FR-E01 | Users can log in using Google OAuth 2.0 (Google Sign-In button)                                     | Must Have |
| FR-E02 | On first Google login, user profile is automatically created in the `users`table with role = USER | Must Have |
| FR-E03 | On subsequent logins, existing user profile is loaded and returned                                  | Must Have |
| FR-E04 | After OAuth login, backend issues a JWT access token returned to the React frontend                 | Must Have |
| FR-E05 | JWT token is used as Bearer token in all subsequent API requests                                    | Must Have |
| FR-E06 | JWT tokens expire after 24 hours. Expired tokens return 401.                                        | Must Have |
| FR-E07 | All REST API endpoints require a valid JWT token (except the OAuth callback endpoints)              | Must Have |
| FR-E08 | Admin can change a user's role (USER / ADMIN / TECHNICIAN)                                          | Must Have |
| FR-E09 | React frontend routes are protected — unauthenticated users redirected to /login                   | Must Have |
| FR-E10 | After logout, the JWT token is invalidated (or frontend clears it and redirects to login)           | Must Have |

### 2.2 In-App Notifications (Module D)

| ID     | Requirement                                                                                | Priority  |
| ------ | ------------------------------------------------------------------------------------------ | --------- |
| FR-D01 | User receives a notification when their booking is approved                                | Must Have |
| FR-D02 | User receives a notification when their booking is rejected                                | Must Have |
| FR-D03 | User receives a notification when the status of their ticket changes                       | Must Have |
| FR-D04 | User receives a notification when a new comment is added to their ticket (by someone else) | Must Have |
| FR-D05 | Notifications appear in a bell icon panel in the navbar with an unread count badge         | Must Have |
| FR-D06 | User can mark a single notification as read                                                | Must Have |
| FR-D07 | User can mark all notifications as read                                                    | Must Have |
| FR-D08 | Notifications are paginated — show most recent first                                      | Must Have |

### 2.3 Real-time Notifications (WebSocket — Additional Feature)

| ID     | Requirement                                                                                                    | Priority    |
| ------ | -------------------------------------------------------------------------------------------------------------- | ----------- |
| FR-D09 | New notifications are pushed to the user's browser in real-time via WebSocket without requiring a page refresh | Should Have |
| FR-D10 | When a new notification arrives, the bell icon badge count increments immediately                              | Should Have |
| FR-D11 | A toast or pop-up briefly shows the notification message when it arrives                                       | Should Have |
| FR-D12 | WebSocket connection is authenticated — only the intended user receives their notifications                   | Should Have |

### 2.4 Email Notifications (Additional Feature)

| ID     | Requirement                                                                            | Priority     |
| ------ | -------------------------------------------------------------------------------------- | ------------ |
| FR-D13 | User receives an email when their booking is approved                                  | Should Have  |
| FR-D14 | User receives an email when their booking is rejected (includes rejection reason)      | Should Have  |
| FR-D15 | User receives an email when their incident ticket is resolved                          | Should Have  |
| FR-D16 | Email is sent to the user's Google account email address                               | Should Have  |
| FR-D17 | Emails have a clean, simple HTML template with the app name, event details, and a link | Nice to Have |

### 2.5 Dark Mode (Additional Feature)

| ID      | Requirement                                                                                    | Priority    |
| ------- | ---------------------------------------------------------------------------------------------- | ----------- |
| FR-DM01 | User can toggle between light and dark mode from the navbar                                    | Should Have |
| FR-DM02 | The selected mode is remembered across page refreshes (stored in localStorage)                 | Should Have |
| FR-DM03 | The entire application respects the theme setting — all pages and components switch correctly | Should Have |

---

## 3. OAuth 2.0 + JWT Flow

Understanding this flow is critical for the viva. Here is the complete login sequence:

```
1. User clicks "Sign in with Google" on the React frontend

2. React redirects to:
   GET /oauth2/authorization/google
   (Spring Security handles this redirect to Google's auth page)

3. User grants permission on Google's page

4. Google redirects back to:
   GET /login/oauth2/code/google?code=AUTHORIZATION_CODE
   (Spring Security OAuth2 client handles this automatically)

5. Spring Security exchanges the code for an access token with Google,
   fetches the user's profile (email, name, picture)

6. Your OAuth2UserService:
   - Checks if a user with this email exists in the database
   - If not: creates a new user with role = USER
   - If yes: loads the existing user
   - Records the user in SecurityContext

7. Your AuthenticationSuccessHandler:
   - Generates a JWT token containing: userId, email, role, expiry (24h)
   - Signs the JWT with a secret key (stored in application.properties)
   - Redirects to the React app with the JWT as a query parameter:
     http://localhost:3000/oauth2/callback?token=JWT_TOKEN_HERE

8. React frontend:
   - Reads the token from the URL query parameter
   - Stores it in memory (or secure cookie — NOT localStorage for security)
   - Clears the token from the URL
   - Stores user info in AuthContext
   - Redirects to the dashboard

9. All subsequent API requests:
   - React includes JWT in: Authorization: Bearer JWT_TOKEN_HERE
   - Spring Security JwtAuthenticationFilter validates the token on every request
   - If valid: sets the user in SecurityContext, request proceeds
   - If invalid/expired: returns 401 Unauthorized
```

---

## 4. Data Model

### `users` Table (you own this)

| Column          | Type         | Constraints            | Description               |
| --------------- | ------------ | ---------------------- | ------------------------- |
| id              | UUID         | PK, NOT NULL           | Auto-generated            |
| email           | VARCHAR(255) | UNIQUE, NOT NULL       | From Google profile       |
| name            | VARCHAR(255) | NOT NULL               | From Google profile       |
| profile_picture | TEXT         | NULLABLE               | Google profile photo URL  |
| role            | ENUM         | NOT NULL, DEFAULT USER | USER / ADMIN / TECHNICIAN |
| created_at      | TIMESTAMP    | NOT NULL               |                           |
| updated_at      | TIMESTAMP    | NOT NULL               |                           |

### `notifications` Table (you own this)

| Column         | Type         | Constraints              | Description                         |
| -------------- | ------------ | ------------------------ | ----------------------------------- |
| id             | UUID         | PK, NOT NULL             | Auto-generated                      |
| user_id        | UUID         | FK → users.id, NOT NULL | Recipient user                      |
| type           | VARCHAR(100) | NOT NULL                 | See notification types below        |
| message        | TEXT         | NOT NULL                 | Human-readable notification message |
| is_read        | BOOLEAN      | NOT NULL, DEFAULT false  | Whether the user has seen it        |
| reference_id   | UUID         | NULLABLE                 | ID of the related booking or ticket |
| reference_type | ENUM         | NULLABLE                 | BOOKING / TICKET                    |
| created_at     | TIMESTAMP    | NOT NULL                 |                                     |

### Notification Types

```
BOOKING_APPROVED     → "Your booking for [Resource] on [Date] has been approved."
BOOKING_REJECTED     → "Your booking for [Resource] on [Date] has been rejected: [reason]"
TICKET_STATUS_CHANGE → "Your ticket #[ID] status has been updated to [status]."
NEW_COMMENT          → "A new comment was added to your ticket #[ID]."
```

---

## 5. REST API Endpoints

All endpoints prefixed with `/api`. JWT Bearer token required except auth endpoints.

---

### GET /api/auth/me

**Purpose:** Returns the currently authenticated user's profile based on the JWT token.

**Auth required:** Any authenticated user

**Success Response:** `200 OK`

```
{
  "id": "uuid-here",
  "email": "user@gmail.com",
  "name": "John Doe",
  "profilePicture": "https://googleprofile.com/...",
  "role": "USER",
  "createdAt": "2026-03-01T10:00:00"
}
```

**Use:** React calls this on app load to check if the user is logged in and get their role.

---

### POST /api/auth/logout

**Purpose:** Logs out the current user.

**Auth required:** Any authenticated user

**Request Body:** None

**Success Response:** `200 OK`

```
{ "message": "Logged out successfully." }
```

**Behaviour:** Since JWT is stateless, the backend cannot truly invalidate a token without a token blacklist. For this assignment, you have two approaches:

* Simple approach: just return 200 and let React clear the token from memory
* Better approach: maintain a Set of revoked token IDs (jti claim) in memory or Redis, check it in the filter

For the assignment, the simple approach is acceptable.

---

### GET /api/notifications

**Purpose:** Get the authenticated user's notifications, most recent first.

**Auth required:** Any authenticated user

**Query Parameters:**

| Parameter  | Description                                    |
| ---------- | ---------------------------------------------- |
| unreadOnly | true/false — return only unread notifications |
| page       | Page number (default 0)                        |
| size       | Page size (default 20)                         |

**Success Response:** `200 OK`

```
{
  "content": [
    {
      "id": "...",
      "type": "BOOKING_APPROVED",
      "message": "Your booking for Lab A on 2026-04-20 has been approved.",
      "isRead": false,
      "referenceId": "booking-uuid",
      "referenceType": "BOOKING",
      "createdAt": "2026-04-10T14:30:00"
    }
  ],
  "unreadCount": 3,
  "totalElements": 25,
  "totalPages": 2
}
```

---

### PUT /api/notifications//read

**Purpose:** Mark a single notification as read.

**Auth required:** Notification owner only

**Path Parameters:** `id` — UUID of the notification

**Success Response:** `200 OK` — Returns updated notification

**Error Responses:**

* `403 Forbidden` — Not the notification owner
* `404 Not Found`

---

### PUT /api/notifications/read-all

**Purpose:** Mark all of the current user's notifications as read.

**Auth required:** Any authenticated user

**Request Body:** None

**Success Response:** `200 OK`

```
{ "message": "All notifications marked as read.", "updatedCount": 3 }
```

---

### WebSocket Endpoint — STOMP over SockJS

**Endpoint:** `/ws`

**Protocol:** STOMP over SockJS

**Auth:** Pass JWT token as query parameter on connection: `/ws?token=JWT_HERE`
Your WebSocket handshake interceptor validates this token and associates the connection with the user.

**Subscribe channel per user:** `/user/queue/notifications`

When any other service (Member 2's booking approval, Member 3's ticket status change) triggers a notification, your `NotificationService.send(userId, notification)` method:

1. Saves the notification to the `notifications` table
2. Pushes it to the user's WebSocket channel: `/user/{userId}/queue/notifications`
3. Optionally sends an email (if email notifications enabled for this event type)

**Message format pushed to client:**

```
{
  "id": "...",
  "type": "BOOKING_APPROVED",
  "message": "Your booking for Lab A has been approved.",
  "referenceId": "...",
  "referenceType": "BOOKING",
  "createdAt": "..."
}
```

---

## 6. NotificationService — Shared Interface

This is the most important interface you define. Every other member calls this service to send notifications. Define it clearly and early — other members cannot finish their modules without it.

### Interface (Java)

```
public interface NotificationService {

    // Called by Member 2 after booking approved/rejected
    void sendBookingNotification(UUID userId, String type, UUID bookingId, String message);

    // Called by Member 3 after ticket status change
    void sendTicketStatusNotification(UUID userId, UUID ticketId, String newStatus);

    // Called by Member 3 after new comment
    void sendNewCommentNotification(UUID ticketOwnerId, UUID ticketId, String commenterName);
}
```

### What your implementation does

For each call:

1. Create a `Notification` entity and save to database
2. Push to user's WebSocket channel via `SimpMessagingTemplate`
3. If event type is configured for email, send email via `JavaMailSender`

---

## 7. Email Notification Setup

### Spring Mail Configuration

In `application.properties`:

```
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=YOUR_GMAIL@gmail.com
spring.mail.password=YOUR_APP_PASSWORD
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

**Important:** Use a Gmail App Password (not your real Gmail password). Generate it from your Google account at: Account → Security → 2-Step Verification → App passwords.

### Email Templates

Use `JavaMailSender` with `MimeMessageHelper` to send HTML emails.

**Booking Approved Email:**

```
Subject: Your booking has been approved — Smart Campus Hub
Body (HTML):
  Hi [Name],
  Your booking for [Resource Name] on [Date] from [Start Time] to [End Time]
  has been approved.
  Purpose: [Purpose]
  Log in to Smart Campus Hub to view details.
```

**Booking Rejected Email:**

```
Subject: Your booking request was not approved — Smart Campus Hub
Body (HTML):
  Hi [Name],
  Unfortunately, your booking for [Resource Name] on [Date] was not approved.
  Reason: [Rejection Reason]
  You may submit a new request for a different date or time.
```

**Ticket Resolved Email:**

```
Subject: Your incident ticket has been resolved — Smart Campus Hub
Body (HTML):
  Hi [Name],
  Your incident ticket #[Ticket ID short] has been marked as RESOLVED.
  Resolution Notes: [Resolution Notes]
  Please log in to review and close the ticket.
```

---

## 8. WebSocket Configuration

### Spring Boot Side

You need to configure:

1. A WebSocket message broker (`@EnableWebSocketMessageBroker`)
2. SockJS fallback support
3. STOMP destination prefixes
4. A handshake interceptor that validates the JWT from the query string and sets the authenticated user in the WebSocket session

### React Side (SockJS + STOMP Client)

Use the `@stomp/stompjs` package together with `sockjs-client`:

```
On login:
  1. Create a SockJS connection to /ws?token=JWT
  2. Connect via STOMP
  3. On connection success, subscribe to /user/queue/notifications
  4. On message received: update NotificationContext state
     → increment unread count
     → add notification to the list
     → show a toast pop-up

On logout:
  Disconnect the STOMP client
```

---

## 9. Frontend Pages & Components

### 9.1 Login Page

**Route:** `/login`

**What it shows:**

* Smart Campus Operations Hub logo / title
* "Sign in with Google" button
* A brief description of the platform
* Dark/light background depending on theme

**Key behaviour:**

* "Sign in with Google" button makes a GET request to `/oauth2/authorization/google`
* After OAuth callback, React reads the JWT from the URL and stores it in AuthContext
* Redirects to the dashboard

---

### 9.2 Notification Bell Component

**Location:** Navbar (present on every page when logged in)

**What it shows:**

* Bell icon
* Red badge with unread count (hidden when count is 0)
* Clicking the bell opens a dropdown panel

**Dropdown panel shows:**

* List of most recent 10 notifications
* Each notification: icon (based on type), message, time ago ("2 hours ago")
* Unread notifications have a different background colour
* "Mark all as read" button at the top
* "View all notifications" link at the bottom

**Key behaviours:**

* On app load, calls `GET /api/notifications?size=10` to populate
* WebSocket subscription updates count and list in real-time
* Clicking a notification marks it as read and navigates to the relevant booking or ticket

---

### 9.3 User Profile Page

**Route:** `/profile`

**What it shows:**

* Google profile picture
* Name and email
* Current role (USER / ADMIN / TECHNICIAN) as a badge
* Account created date

---

### 9.4 Admin — User Role Management

**Route:** `/admin/users`

**What it shows:**

* Table of all registered users
* Columns: Profile picture, Name, Email, Role, Joined
* Role dropdown per user — Admin can change to USER / ADMIN / TECHNICIAN
* Changing role calls `PATCH /api/users/{id}/role` (this endpoint can be under auth or a separate admin endpoint — define it cleanly)

---

### 9.5 Audit Log Page (Shared — but you set up the route)

**Route:** `/admin/audit-logs`

This page displays the data from Member 3's audit log endpoint. You own the route and layout in the React frontend. Member 3 owns the backend endpoint.

---

### 9.6 Dark Mode Toggle

**Location:** Navbar, next to the notification bell

**What it does:**

* A sun/moon icon button
* Clicking it switches between light and dark theme
* Theme preference stored in `localStorage`
* On app load, reads localStorage to apply the correct theme immediately

**Implementation approach:**

Option A — Tailwind CSS:

* Add `darkMode: 'class'` to tailwind.config.js
* Toggle the `dark` class on the `<html>` or `<body>` element
* All components use Tailwind dark: variants for styling

Option B — CSS Variables:

* Define CSS variables for colours in `:root` and `[data-theme="dark"]`
* Toggle `data-theme="dark"` attribute on `<html>`
* All components reference CSS variables for colours

Use a `ThemeContext` that wraps the whole app and exposes `theme` and `toggleTheme`.

---

## 10. Security Configuration Summary

This is what your Spring Security configuration must achieve:

### Public endpoints (no JWT required)

```
/oauth2/**             → OAuth2 login flow
/login/oauth2/**       → OAuth2 callback
/ws/**                 → WebSocket (JWT validated in handshake separately)
```

### Protected endpoints by role

```
/api/auth/**           → Any authenticated user
/api/notifications/**  → Any authenticated user (own data only)
/api/resources         → GET: any authenticated user
/api/resources/**      → POST/PUT/PATCH/DELETE: ADMIN only
/api/bookings          → GET/POST: any authenticated user
/api/bookings/*/approve → ADMIN only
/api/bookings/*/reject  → ADMIN only
/api/bookings/export/** → ADMIN only
/api/tickets           → Any authenticated user
/api/tickets/*/status  → ADMIN or TECHNICIAN
/api/tickets/*/assign  → ADMIN only
/api/audit-logs        → ADMIN only
/api/admin/**          → ADMIN only
```

Use `@PreAuthorize` annotations on service or controller methods, or configure these in the `SecurityFilterChain` bean.

---

## 11. JWT Token Structure

### JWT Claims (payload)

```
{
  "sub": "user-uuid",
  "email": "user@gmail.com",
  "role": "USER",
  "iat": 1712700000,
  "exp": 1712786400
}
```

### Signing

Use HMAC-SHA256 (`HS256`) with a secret key stored in `application.properties`:

```
jwt.secret=your-256-bit-or-longer-secret-key-here
jwt.expiration=86400000
```

### Recommended library

Add to pom.xml:

```
io.jsonwebtoken:jjwt-api
io.jsonwebtoken:jjwt-impl
io.jsonwebtoken:jjwt-jackson
```

---

## 12. Integration Points with Other Members

| Integration                            | With            | Details                                                                                                                                                                                                                           |
| -------------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| JWT filter on all endpoints            | All members     | Your JwtAuthenticationFilter runs on every request. Coordinate which endpoints are public vs protected early. Other members' endpoints rely on `SecurityContextHolder.getContext().getAuthentication()`to get the current user. |
| NotificationService called by Member 2 | Member 2        | After booking approved/rejected, Member 2 calls your `NotificationService.sendBookingNotification(...)`. Share the interface in Week 1.                                                                                         |
| NotificationService called by Member 3 | Member 3        | After ticket status change or new comment, Member 3 calls your service. Same interface.                                                                                                                                           |
| User entity read by all members        | All members     | Every entity (bookings, tickets, comments) references `users.id`. Your `users`table is the shared reference. Don't rename or restructure it without telling the team.                                                         |
| Getting current user in other services | Members 1, 2, 3 | Other members call a shared utility to get the current user:`SecurityContextHolder.getContext().getAuthentication()`. Make sure your JWT filter sets this up correctly so they can rely on it.                                  |
| Dark mode affects all UI               | Members 1, 2, 3 | The dark mode context wraps the whole app. Other members should use Tailwind dark: variants or CSS variables in their components. Agree on the approach early.                                                                    |

---

## 13. HATEOAS — Hypermedia Links for Notifications and Auth

### Dependency

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-hateoas</artifactId>
</dependency>
```

### Notification Response — State-Based Links

Links on a notification depend on whether it has been read yet.

**Unread notification:**

```json
{
  "id": "notif-uuid",
  "type": "BOOKING_APPROVED",
  "message": "Your booking for Lab A on 2026-04-20 has been approved.",
  "isRead": false,
  "referenceType": "BOOKING",
  "referenceId": "booking-uuid",
  "_links": {
    "self":       { "href": "/api/notifications/notif-uuid" },
    "mark-read":  { "href": "/api/notifications/notif-uuid/read" },
    "mark-all":   { "href": "/api/notifications/read-all" },
    "reference":  { "href": "/api/bookings/booking-uuid" }
  }
}
```

**Already read notification:**

```json
{
  "id": "notif-uuid",
  "isRead": true,
  "_links": {
    "self":      { "href": "/api/notifications/notif-uuid" },
    "mark-all":  { "href": "/api/notifications/read-all" },
    "reference": { "href": "/api/bookings/booking-uuid" }
  }
}
```

> The `mark-read` link disappears once the notification is already read — no point marking it read again. This is dynamic HATEOAS based on notification state.

### The `reference` Link — Navigating to the Related Entity

This is a particularly useful link. When a user clicks a notification, the frontend can follow `_links.reference` to navigate directly to the related booking or ticket — without hardcoding the URL pattern.

```
referenceType = BOOKING  →  reference href = /api/bookings/{referenceId}
referenceType = TICKET   →  reference href = /api/tickets/{referenceId}
```

Build this conditionally in the controller based on `referenceType`.

### Auth Response — `GET /api/auth/me`

```json
{
  "id": "user-uuid",
  "email": "user@gmail.com",
  "role": "USER",
  "_links": {
    "self":          { "href": "/api/auth/me" },
    "notifications": { "href": "/api/notifications" },
    "bookings":      { "href": "/api/bookings" },
    "tickets":       { "href": "/api/tickets" },
    "logout":        { "href": "/api/auth/logout" }
  }
}
```

This response acts as the **API entry point** — after login, the React app calls `/api/auth/me` and gets back not just the user profile but also the links to all key resources. This is excellent HATEOAS design.

### Collection Notification Response

```json
{
  "_embedded": {
    "notifications": [ ...each notification with its own _links... ]
  },
  "_links": {
    "self":     { "href": "/api/notifications" },
    "mark-all": { "href": "/api/notifications/read-all" }
  },
  "unreadCount": 3
}
```

### Why `/api/auth/me` as Entry Point Matters

In pure HATEOAS design, a client only needs to know **one URL** — the root — and then navigates entirely through links. Your `/api/auth/me` response serves this role in your project. After login, the React app calls this endpoint and receives links to everything it needs. Mention this in the viva as your understanding of the HATEOAS philosophy.

---

## 14. Viva Preparation Checklist

* [ ] Explain the full OAuth 2.0 login flow step by step (Google → Spring → JWT → React)
* [ ] Explain HATEOAS on notifications — why mark-read link disappears when isRead is true
* [ ] Explain how the `reference` link dynamically points to either a booking or a ticket
* [ ] Explain why `/api/auth/me` acts as an API entry point in HATEOAS design
* [ ] Explain what a JWT is, what claims it contains, and how it is validated on each request
* [ ] Explain how Spring Security FilterChain works and where your JWT filter sits
* [ ] Explain how @PreAuthorize works and give an example from your endpoints
* [ ] Explain how WebSocket authentication works (JWT in handshake query param)
* [ ] Explain how STOMP topic subscription works and how user-specific channels work (`/user/queue/...`)
* [ ] Explain how Spring Mail is configured and how you send HTML emails
* [ ] Explain how dark mode is implemented technically (Tailwind class toggle OR CSS variables)
* [ ] Explain why JWT is stateless and what the trade-offs are vs sessions
* [ ] Explain what happens if a user's JWT token expires mid-session

---

## 15. Individual Commit Guidelines

* Commit after every meaningful unit of work — start early since others depend on you
* Use clear, specific commit messages:
  * `feat: configure Spring Security OAuth2 with Google and JWT`
  * `feat: add JWT authentication filter`
  * `feat: add GET /api/auth/me and POST /api/auth/logout`
  * `feat: implement NotificationService with WebSocket push`
  * `feat: add Spring Mail email notifications for booking events`
  * `feat: build notification bell component with real-time updates`
  * `feat: add dark mode toggle with ThemeContext`
  * `fix: fix WebSocket auth not reading JWT from query param`
* All commits must be on branch `feature/member4-auth-notifications`
* Raise a Pull Request to `develop` once your feature is tested
* **Prioritise getting the JWT filter and OAuth flow merged first** — other members are blocked on this

---

*End of Member 4 PRD*
*IT3030 — SLIIT Faculty of Computing — 2026 Semester 1*
