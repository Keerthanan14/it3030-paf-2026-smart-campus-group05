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
- Frontend notification UX is implemented: bell dropdown, unread badge, mark-read/mark-all actions, notifications pages, and realtime bridge wiring.
- Dark mode runtime is implemented with theme store/toggle and persisted preference.

### Partial
- Backend email notifications work, but current content is plain text; HTML template format from PRD is still pending.
- Auth state management works, but token is currently stored in localStorage (security hardening item remains).

### Not Started
- Frontend route/page for admin audit logs (`/admin/audit-logs`).
- Frontend route/page for user profile (`/profile`).
- HATEOAS links for auth and notification responses.
- Auth and notification test coverage.
- Viva prep notes or documentation extracted from the implementation.

## Current Remaining Work (Apr 10)

1. Add frontend route/page for `/admin/audit-logs`.
2. Add frontend route/page for `/profile`.
3. Implement HATEOAS links in `GET /api/auth/me` and notification responses (item + collection level, including conditional `mark-read`).
4. Upgrade notification emails to HTML template format (booking approved/rejected, ticket resolved).
5. Align first-time OAuth role behavior with PRD expectation (`USER`) or update PRD/team agreement to current role (`STUDENT`).
6. Improve auth token storage strategy (move away from localStorage for access token where feasible).
7. Improve logout flow to clear refresh cookie on backend response.

## Revised Remaining Phases

## Phase 9 - Routing and UX Completion
Goal:
- Complete missing frontend routes required by Member 4 scope.

Tasks:
- Add `/admin/audit-logs` route and connect it to the existing audit API/UI.
- Add `/profile` route and user profile page.
- Ensure both are linked from navigation where appropriate.

Deliverables:
- Required Member 4 frontend routes are present and accessible.

## Phase 10 - HATEOAS, QA, and Viva Readiness
Goal:
- Polish the API contract and prepare for submission/demo.

Tasks:
- Add HATEOAS links to auth and notification responses.
- Add dynamic notification links based on state (`mark-read` only when unread, `reference` by type).
- Verify response codes and error handling.
- Add basic unit and integration tests for auth and notifications.
- Write viva notes for OAuth2, JWT, WebSocket auth, notification ownership, and dark mode.

## Phase 11 - Security and Email Hardening
Goal:
- Close the remaining security and communication quality gaps.

Tasks:
- Convert notification emails to HTML templates with consistent branding/content blocks.
- Clear refresh cookie during logout response.
- Decide and implement final access-token handling strategy (memory/cookie/localStorage) aligned with team policy.
- Confirm and lock OAuth first-login default role behavior with the team and PRD.

Deliverables:
- Security and email behavior are aligned with PRD and ready for viva justification.

Deliverables:
- Member 4 work is demo-ready, testable, and easy to explain in the viva.
