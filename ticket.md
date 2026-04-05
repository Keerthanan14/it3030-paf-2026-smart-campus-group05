# Module C Ticketing Implementation Plan (Phased)

## Purpose
This file breaks Member 3 work into clear phases so the Tickets + SLA + Audit scope is delivered without blocking integration.

## Module Scope
- Core module: Maintenance and Incident Ticketing
- Additional features: SLA timer and Audit Log
- Primary endpoints: Ticket CRUD flow, status workflow, assignment, comments, audit listing

## Phase 1 - Foundation and Data Model
Goal: establish stable entities, enums, migrations, and base repository layer.

Deliverables:
1. Create entities and DB tables:
- tickets
- ticket_attachments
- comments
- audit_logs

2. Create enums and constants:
- TicketStatus: OPEN, IN_PROGRESS, RESOLVED, CLOSED, REJECTED
- TicketPriority: LOW, MEDIUM, HIGH, CRITICAL
- SLA constants:
- FIRST_RESPONSE_TARGET_HOURS = 4
- RESOLUTION_TARGET_HOURS = 48

3. Add repository interfaces and basic query methods:
- find by user
- find by assigned technician
- filter by status/priority/category
- fetch comments/attachments by ticket id

4. Add DTO contracts and validation:
- create ticket request
- update status request
- assign technician request
- comment create/update request

Exit criteria:
- DB migrations run successfully.
- Entities and repositories compile.
- Validation rules are in place.

## Phase 2 - Core Ticket APIs (Without Files)
Goal: deliver reliable ticket lifecycle APIs first, then attach file upload complexity.

Deliverables:
1. Implement endpoints:
- GET /api/tickets
- GET /api/tickets/{id}
- POST /api/tickets
- PUT /api/tickets/{id}/status
- PUT /api/tickets/{id}/assign

2. Enforce role and ownership rules:
- USER can create and view own tickets.
- TECHNICIAN can view assigned tickets and allowed status updates.
- ADMIN can view all tickets, assign technicians, update status including reject.

3. Enforce workflow transitions:
- OPEN -> IN_PROGRESS -> RESOLVED -> CLOSED
- OPEN/IN_PROGRESS -> REJECTED (admin only)
- Block terminal state transitions.

4. Add consistent error handling:
- 400 for invalid transitions/validation
- 403 for permission violations
- 404 for missing ticket/resource/user

Exit criteria:
- Core endpoints pass Postman tests for happy and failure paths.
- Status transition guard is fully validated.

## Phase 3 - Attachments and Comments
Goal: complete real-world ticket collaboration behavior.

Deliverables:
1. Implement multipart ticket creation with attachments:
- Max 3 files
- Allowed types: image/jpeg, image/png
- Max 5MB per file
- UUID-based stored filename

2. Serve uploaded files via configured static path.

3. Implement comment endpoints:
- POST /api/tickets/{id}/comments
- PUT /api/tickets/{id}/comments/{cid}
- DELETE /api/tickets/{id}/comments/{cid}

4. Enforce comment ownership rules:
- Owner can edit own comment.
- Owner or admin can delete.

Exit criteria:
- File upload constraints are enforced.
- Comment permissions and auditability are correct.

## Phase 4 - SLA Timer and Audit Log
Goal: add innovation features with measurable outputs.

Deliverables:
1. SLA timestamp behavior:
- Set first_response_at on first transition away from OPEN
- Set resolved_at on transition to RESOLVED

2. SLA computed response fields in DTOs:
- timeToFirstResponse
- timeToResolution
- firstResponseBreached
- resolutionBreached

3. Add audit logging for key actions:
- ticket create
- ticket status change
- technician assignment
- comment create/edit/delete

4. Add audit endpoint support for admin filtering and pagination.

Exit criteria:
- SLA values are correct in API responses.
- Audit entries are produced for all critical transitions.

## Phase 5 - Integration, HATEOAS, and Hardening
Goal: finish cross-module integration and production readiness.

Deliverables:
1. Integrate notification trigger hooks (Module D):
- status change notification
- new comment notification to ticket owner

2. Add HATEOAS links:
- self
- update-status
- assign
- add-comment
- dynamic actions by current status/role where appropriate

3. Improve filtering and pagination quality:
- status, priority, category, assignedTo, slaBreached

4. Add backend tests:
- transition guards
- ownership permissions
- SLA timestamp logic
- comment authorization

5. Add frontend wiring checks for Member 3 pages:
- technician dashboard/tickets
- student tickets
- admin tickets/audit

Exit criteria:
- End-to-end flows run without manual data fixes.
- API behavior is consistent with project rubric and PRD.

## Frontend Ticket Integration (First Priority)
Goal: complete Member 3 frontend ticket flow in clear phases while following project frontend rules.

### Frontend Phase F1 - API Layer and Types
Goal: define ticket API service contracts before UI implementation.

Deliverables:
1. Implement `src/core/api/ticketApi.ts`:
- list tickets with filters (status, priority, category, assignedTo, slaBreached, page, size)
- get ticket by id
- create ticket (json and multipart)
- update ticket status
- assign technician
- comment create/update/delete

2. Update/verify `src/types/ticket.ts`:
- ticket list item and detail contracts
- attachment and comment contracts
- SLA fields (`timeToFirstResponse`, `timeToResolution`, `firstResponseBreached`, `resolutionBreached`)
- links contract for backend action links

Exit criteria:
- No direct ticket API calls from pages/components.
- All ticket requests are typed and centralized in `core/api`.

### Frontend Phase F2 - Feature Hooks and State
Goal: move reusable ticket logic to hooks/store and keep pages thin.

Deliverables:
1. Add ticket hooks under `src/features/ticket/hooks/`:
- `useTicketsList`
- `useTicketDetail`
- `useTicketActions` (status update, assignment)
- `useTicketComments`

2. Use `src/core/store/ticketStore.ts` only for truly shared ticket state:
- list filters/pagination cache
- selected ticket id if needed across views

3. Keep business logic out of pages:
- loading/error/success flows managed in hooks

Exit criteria:
- Pages only compose UI and call hooks.
- No duplicated ticket logic across student/technician/admin pages.

### Frontend Phase F3 - Page Wiring (Thin Pages)
Goal: wire all Member 3 pages to backend through hooks.

Deliverables:
1. Student tickets page:
- load own tickets
- open detail view
- add/edit/delete own comments

2. Technician tickets page:
- load assigned tickets
- update allowed statuses
- comment on assigned tickets

3. Admin tickets page:
- load all tickets with filters
- assign technician
- update status including reject/close

4. Admin audit view integration:
- consume audit log endpoint with filters and pagination

Exit criteria:
- Student, technician, and admin ticket flows work end-to-end.
- Role-based action visibility matches backend permissions.

### Frontend Phase F4 - SLA and UX Hardening
Goal: complete SLA visibility and user feedback quality.

Deliverables:
1. SLA indicators in ticket list and detail:
- show elapsed time text
- show breached/within-SLA badges

2. File upload UX for ticket create:
- max 3 images
- type/size validation hints
- preview selected files

3. Comment UX polish:
- inline edit state
- delete confirmation
- optimistic or immediate refresh behavior

4. Error handling consistency:
- use shared toast/error UI
- map backend validation messages cleanly

Exit criteria:
- SLA data is clearly visible on all ticket pages.
- Ticket UI behavior is stable and demo-ready.

### Frontend Phase F5 - Final Integration Checks
Goal: confirm frontend and backend contracts are fully aligned.

Deliverables:
1. Verify filters and query params align with backend.
2. Verify ticket action buttons use backend-provided links/permissions.
3. Verify notification-driven refresh for status/comment updates (where applicable).
4. Add a short frontend test checklist in project docs.

Exit criteria:
- Frontend ticket integration is complete and consistent with backend rules.
- Member 3 pages are viva-ready.

### Frontend F5 Validation Checklist (Completed)
1. Filters and query params aligned with backend controller contract:
- `status`, `priority`, `category`, `assignedTo`, `slaBreached`, `page`, `size`

2. Action buttons aligned with backend link permissions (`ticket.links`):
- `assign` controls assignment action visibility/usability
- `updateStatus` controls status transition actions
- `addComment` controls comment creation/deletion availability

3. Notification-driven refresh behavior:
- Added frontend auto-refresh polling fallback (`20s`) for selected ticket details and list sync while real-time notification/WebSocket consumer is pending.

4. Frontend quick test list:
- Student: create ticket (with/without images), add/edit/delete own comment, verify SLA badges
- Technician: open assigned ticket, valid status transitions, comment operations, SLA breached filter
- Admin: filter all tickets, assign technician using valid technician id, status changes, audit log filters/pagination
- Permission UX: buttons disabled when corresponding backend link is absent

## Suggested Timeline
- Phase 1: Day 1-2
- Phase 2: Day 3-5
- Phase 3: Day 6-7
- Phase 4: Day 8-9
- Phase 5: Day 10-11

## Definition of Done
- All ticket endpoints implemented and secured.
- SLA and audit features fully working.
- Notification integration completed.
- Postman tests updated and passing.
- Member 3 can explain architecture, transitions, SLA, and audit decisions in viva.
