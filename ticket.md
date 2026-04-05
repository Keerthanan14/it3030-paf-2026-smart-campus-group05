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
