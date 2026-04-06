# Member 4 Implementation Plan (No Docker)

Project rule:
- No Docker / Docker Compose in this project.

Source:
- Based on MEMBER_4_AUTH_NOTIFICATIONS.md

## Phase 1 - Backend Auth Foundation (Priority: Blocker)
Goal:
- Make OAuth2 + JWT work first so other members can proceed.

Tasks:
- Add/verify dependencies for security and JWT (OAuth2 client, security, jjwt).
- Create user module core files:
  - User entity
  - Role enum (USER, ADMIN, TECHNICIAN)
  - User repository
- Implement JWT utilities:
  - token generate
  - token validate
  - extract claims (sub, email, role)
- Implement JWT authentication filter and register in security chain.
- Implement OAuth2 user service:
  - first login creates user with USER role
  - existing login loads user
- Implement OAuth2 success handler:
  - generate JWT
  - redirect to frontend callback with token
- Configure SecurityConfig route rules from PRD.

Deliverables:
- Working OAuth2 login endpoint flow.
- JWT accepted on protected endpoints.

## Phase 2 - Auth API + Staff Provisioning
Goal:
- Expose required auth endpoints with admin-created staff accounts and verified self-registration for normal users.

Tasks:
- Implement GET /api/auth/me.
- Implement POST /api/auth/logout (stateless logout response).
- Implement admin-only staff creation endpoint:
  - POST /api/admin/users/staff
  - allowed roles: ADMIN, TECHNICIAN only
  - generate temporary password
  - send SMTP email with username (email) + temporary password
- Implement normal-user registration flow:
  - POST /api/auth/register/request-code (send email verification code)
  - POST /api/auth/register/verify-code (validate code)
  - POST /api/auth/register/set-password (create USER account)
- Implement login endpoint for all account types.
- Add DTOs for auth responses, staff creation, verification requests, and password setup.
- Add role-based authorization guards.

Deliverables:
- Auth endpoints return expected JSON.
- Staff accounts are created only by admin and receive temporary credentials by email.
- Normal users complete email verification before setting password and account creation.

## Phase 3 - Notifications Backend (REST)
Goal:
- Build in-app notifications storage and read operations.

Tasks:
- Create notification module core files:
  - Notification entity
  - NotificationType enum
  - Notification repository
  - Notification service interface + implementation
- Implement endpoints:
  - GET /api/notifications (with pagination, unreadOnly)
  - PUT /api/notifications/{id}/read
  - PUT /api/notifications/read-all
- Add unread count in list response.
- Enforce ownership checks for notification read endpoints.

Deliverables:
- Notifications can be created, listed, marked read.

## Phase 4 - WebSocket + Email Notifications
Goal:
- Add real-time and email channels for notification events.

Tasks:
- Configure WebSocket STOMP endpoint /ws with SockJS.
- Add handshake interceptor for JWT from query parameter.
- Push notifications to /user/queue/notifications.
- Configure Spring Mail settings from env.
- Implement email templates:
  - booking approved
  - booking rejected
  - ticket resolved
- Expose shared methods for other members:
  - sendBookingNotification
  - sendTicketStatusNotification
  - sendNewCommentNotification

Deliverables:
- Real-time notification delivery works for authenticated user.
- Email notifications sent for enabled events.

## Phase 5 - Frontend Auth Flow
Goal:
- Integrate frontend login/callback/session handling.

Tasks:
- Create AuthContext with token + user profile state.
- Implement login page (/login) and Google sign-in button.
- Implement OAuth callback page:
  - read token from URL
  - store in memory/session
  - fetch /api/auth/me
  - redirect to dashboard
- Configure API client to attach Authorization header.
- Add ProtectedRoute and AdminRoute wrappers.

Deliverables:
- End-to-end login works.
- Protected pages block unauthenticated users.

## Phase 6 - Frontend Notifications + Theme
Goal:
- Finish user-facing notification and dark mode experience.

Tasks:
- Create NotificationContext.
- Create bell component with unread badge and dropdown.
- Connect WebSocket client (@stomp/stompjs + sockjs-client).
- Implement mark one read and mark all read actions.
- Add notifications page.
- Create ThemeContext and navbar dark mode toggle.
- Persist theme in localStorage and apply globally.

Deliverables:
- Realtime bell updates and read actions work.
- Dark mode works across app.

## Phase 7 - HATEOAS + QA + Viva Readiness
Goal:
- Align with rubric and finalize quality.

Tasks:
- Add HATEOAS links in auth and notification responses.
- Verify status codes and error handling.
- Add basic unit/integration tests for auth and notifications.
- Run manual test checklist from PRD.
- Prepare viva notes for:
  - OAuth2 flow
  - JWT filter chain
  - WebSocket auth
  - notification ownership rules
  - dark mode approach

Deliverables:
- Member 4 module ready for demo and integration.

---

## Execution Order (Strict)
1. Phase 1
2. Phase 2
3. Phase 3
4. Phase 4
5. Phase 5
6. Phase 6
7. Phase 7

## Current Start Point
- Environment setup done (backend/frontend .env templates and local files created).
- Next action: begin Phase 1 implementation in backend.

## Status Review

### Done
- Backend auth foundation is in place: OAuth2, JWT generation/validation, user persistence, security filter chain, and OAuth2 success redirect.
- Auth endpoints are available: login, logout, refresh, me, register request-code, verify-code, set-password, staff creation, and change-password.
- Notification backend is implemented: entity, service, repository, REST endpoints, unread count, ownership checks, WebSocket push, and email sending.
- Frontend auth plumbing exists: login page, OAuth callback page, token storage, API bearer header injection, and route guards.

### Partial
- Frontend auth is functional but still uses a Zustand store instead of a dedicated AuthContext.
- Theme support exists in a basic form, but the app does not yet have a full ThemeContext-driven implementation.
- Notification screens exist, but the bell dropdown, live unread badge, and notification list are still placeholder-level in the UI.
- Backend email notifications work, but the HTML template layer described in the PRD is not finished.

### Not Started
- Frontend realtime notification client with SockJS/STOMP.
- Full notification bell integration with live badge updates and toast/pop-up handling.
- HATEOAS links for auth and notification responses.
- Auth and notification test coverage.
- Viva prep notes or documentation extracted from the implementation.

## Revised Remaining Phases

## Phase 8 - Frontend Notifications Foundation
Goal:
- Turn the notification backend into a working UI experience.

Tasks:
- Create the Member 4 frontend notification layer under the guide-aligned folders:
  - frontend/src/features/notification/
  - frontend/src/features/admin/
  - frontend/src/shared/components/layout/Navbar.tsx
- Create NotificationContext or equivalent shared state for unread count and latest items.
- Build the bell icon in the navbar with unread badge and dropdown panel.
- Fetch notifications from the backend and render the latest items from the notification list response.
- Implement mark one read and mark all read actions from the notification UI.
- Add navigation hooks so a notification click can route to the related booking or ticket.

Deliverables:
- Users can see notifications in the navbar and manage read state from the UI.

## Phase 9 - Realtime + Theme Completion
Goal:
- Finish the live notification client and dark mode system.

Tasks:
- Add SockJS and STOMP client dependencies.
- Connect the frontend to the WebSocket notification channel.
- Show toast or pop-up messages for incoming notifications.
- Introduce a full ThemeContext and apply theme globally.
- Persist and restore the selected theme across refreshes.

Deliverables:
- Realtime notification updates work in the browser.
- Dark mode is applied consistently across the app.

## Phase 10 - HATEOAS, QA, and Viva Readiness
Goal:
- Polish the API contract and prepare for submission/demo.

Tasks:
- Add HATEOAS links to auth and notification responses.
- Verify response codes and error handling.
- Add basic unit and integration tests for auth and notifications.
- Write viva notes for OAuth2, JWT, WebSocket auth, notification ownership, and dark mode.

Deliverables:
- Member 4 work is demo-ready, testable, and easy to explain in the viva.
