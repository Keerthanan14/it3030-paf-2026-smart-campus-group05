# Module C Handover Needs from Other Modules (Phase Integration)

## Purpose
This file defines what the Tickets module needs from other modules so Member 3 can complete integration without blockers.

## Current Module C Responsibility
Member 3 owns:
- Ticket lifecycle and status transitions
- Technician assignment
- Ticket comments
- SLA timer fields
- Audit log feature

To complete this module properly, the following contracts are needed from other members.

## Needs from Module A (Resources)

### 1. Resource Validation Contract
Tickets need to optionally link incidents to a valid resource.

Required from Module A:
1. A reliable way to verify resource existence by id.
2. Resource details endpoint should return at least:
- id
- name
- location
- status

Expected behavior in Module C:
- If resourceId is provided and not found, reject ticket creation with 404.
- If resourceId is omitted, allow general-location ticket creation.

### 2. Resource Status Consistency
For resource-linked incidents, status metadata should be readable for context in ticket detail views.

Required from Module A:
- Stable status values (for example ACTIVE, OUT_OF_SERVICE).
- No breaking changes to resource response fields used by ticket UI.

## Needs from Module B (Bookings)

### 1. Booking-to-Ticket Context (Recommended)
If a user reports an incident during a booking, linking improves traceability.

Required from Module B (recommended, not mandatory):
1. Optional bookingId reference validation endpoint or service contract.
2. Ability to confirm booking belongs to requesting user.

Expected behavior in Module C if implemented:
- Accept optional bookingId when creating ticket.
- Reject invalid or unauthorized bookingId with 400/403.

### 2. Shared Audit Semantics
Audit logs should use consistent action/entity naming across modules.

Required from Module B:
- Agree on common action names (CREATE, UPDATE, STATUS_CHANGE).
- Agree on entity type naming (BOOKING, TICKET, RESOURCE, USER, COMMENT).

## Needs from Module D (Auth + Notifications)

### 1. Role and User Identity Availability (Critical)
Tickets depend on role checks and user lookup.

Required from Module D:
1. Stable JWT principal mapping with user id and role.
2. Reliable role set: USER, ADMIN, TECHNICIAN.
3. User lookup support for technician assignment.

Expected behavior in Module C:
- Enforce owner-only and role-based access checks.
- Reject assignment if user is not TECHNICIAN.

### 2. Notification Trigger Contract (Critical)
Ticket events must create notifications for users.

Required from Module D:
1. Notification service method/event contract with at least:
- targetUserId
- type
- message
- referenceId
- referenceType

2. Delivery path:
- in-app notification persistence
- websocket push to user channel
- optional email for critical events

Ticket events that must notify:
1. Ticket status changed
2. Ticket assigned/reassigned
3. New comment added by someone else

## Needs from Frontend Integration

### 1. Member 3 Pages Must Consume Final APIs
Expected pages:
- StudentTicketsPage
- TechnicianTicketsPage / TechnicianDashboardPage
- AdminTicketsPage

Required UI behavior:
1. Respect role-based action visibility.
2. Display SLA badges clearly (breached / within target).
3. Show comments timeline and attachment previews.

### 2. Shared API Client Contracts
Required from frontend core:
- Consistent error shape handling from backend.
- Auth token attachment in API client.
- Pagination and filtering query support.

## Integration Checklist
Mark complete only after all are true.

Status legend:
- DONE = Implemented and verified in current module.
- PARTIAL = Implemented in Module C, but cross-module confirmation still pending.
- PENDING = Not yet completed.

- [x] Resource existence validation integrated in ticket create flow. (DONE)
- [x] Role checks aligned with auth module. (DONE)
- [x] Technician assignment validates TECHNICIAN role. (DONE)
- [x] Notification events fire for status and comments. (DONE)
- [ ] SLA fields shown in frontend pages. (PENDING)
- [ ] Audit action/entity naming aligned across modules. (PARTIAL)
- [ ] Cross-module test scenarios documented in Postman. (PENDING)

## Suggested Cross-Module Test Scenarios
1. Create ticket with valid resourceId -> success.
2. Create ticket with invalid resourceId -> 404.
3. Assign non-technician user -> 400.
4. Status update by unauthorized user -> 403.
5. Status update by technician/admin -> notification created.
6. Comment by technician on user ticket -> owner gets notification.
7. SLA breach case appears in admin filter.

## Coordination Note
Module C can be considered fully complete only when technical implementation and cross-module contracts are both verified in integrated testing.
