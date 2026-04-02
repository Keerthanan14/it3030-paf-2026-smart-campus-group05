# Booking Module Plan (Member 2)

## Purpose
This document breaks Module B (Booking Management + Export) into practical phases so implementation, testing, and viva prep can be completed on time.

## Module Scope
- Booking lifecycle: `PENDING -> APPROVED/REJECTED -> CANCELLED`
- Conflict detection for same resource/date/time overlap
- Role rules: USER and ADMIN behavior separation
- Export reports: PDF and Excel
- Integration: Resource status check, Notifications, Audit logs, HATEOAS

## Phase Split

## Phase 1 - Foundation and Data Model
### Goals
- Finalize booking entity, enum, DTOs, validations
- Create repository queries for filtering and conflict checks
- Add required dependencies for HATEOAS + export libraries

### Deliverables
- `Booking` entity and `BookingStatus` enum
- DTOs: create request, reject request, response DTO
- Repository methods:
  - conflict query using overlap formula
  - user-specific and admin-specific list queries
- migration/schema for `bookings` table columns

### Exit Criteria
- Build passes
- Validation works for date/time/purpose/attendees

## Phase 2 - Core Booking API
### Goals
- Implement main endpoints with business rules
- Enforce role-based access and ownership checks

### Endpoints
- `GET /api/bookings`
- `GET /api/bookings/{id}`
- `POST /api/bookings`
- `PUT /api/bookings/{id}/approve`
- `PUT /api/bookings/{id}/reject`
- `PUT /api/bookings/{id}/cancel`

### Business Rules
- Create booking checks:
  - resource exists and is bookable
  - within availability window
  - no overlap with approved booking
- Approve booking checks:
  - booking is `PENDING`
  - re-check overlap before approval
  - re-check resource still bookable
- Reject booking checks:
  - booking is `PENDING`
  - rejection reason required
- Cancel booking checks:
  - owner only
  - only from `APPROVED`

### Exit Criteria
- Endpoints return correct status codes (`200/201/400/403/404/409`)
- Invalid transitions blocked

## Phase 3 - Cross-Module Integration
### Goals
- Complete dependency contracts with other module owners

### Integration Tasks
- Resource module:
  - consume `isResourceBookable(resourceId)`
  - auto-reject pending bookings when resource becomes `OUT_OF_SERVICE`
  - save reason exactly: `Resource is out of service.`
- Notification module:
  - trigger notification on approve/reject/auto-reject
- Audit module:
  - write booking status-change audit entries

### Exit Criteria
- Integration scenario tests pass
- Auto-rejected bookings visible in listing and detail responses

## Phase 4 - Export Reports (Additional Feature)
### Goals
- Implement admin download endpoints and report generation

### Endpoints
- `GET /api/bookings/export/pdf`
- `GET /api/bookings/export/excel`

### Report Content
- Booking ID, user, resource, date, start/end, purpose, attendees, status, rejection reason
- optional filters: status/resource/date range

### Exit Criteria
- Correct `Content-Type` and `Content-Disposition`
- Files open correctly and include filtered data

## Phase 5 - HATEOAS and Frontend Wiring
### Goals
- Add dynamic links based on booking status
- Connect React pages to API behavior

### HATEOAS Rules
- `PENDING`: `self`, `approve`, `reject`, `all-bookings`
- `APPROVED`: `self`, `cancel`, `all-bookings`
- `REJECTED`/`CANCELLED`: `self`, `all-bookings`

### Frontend Tasks
- User bookings list + detail + cancel
- Admin booking panel approve/reject modal
- Export buttons with loading state
- Conflict and validation error UX

### Exit Criteria
- UI actions align with `_links` actions
- No hardcoded invalid actions shown

## Phase 6 - Test and Viva Readiness
### Test Checklist
- create on ACTIVE resource -> success
- create on OUT_OF_SERVICE resource -> blocked
- approve pending -> success when no conflict
- approve pending after resource becomes OUT_OF_SERVICE -> blocked
- overlap at create and at approve -> `409 Conflict`
- auto-reject pending when resource changes to OUT_OF_SERVICE
- export includes rejected/auto-rejected records with reason

### Viva Talking Points
- overlap formula and why approval re-check is needed
- difference between `400` and `409`
- dynamic HATEOAS links as state-driven actions
- ownership and role enforcement strategy

## Recommended Delivery Order
1. Data model + validations
2. Create/List/Detail endpoints
3. Approve/Reject/Cancel workflow
4. Resource + notification + audit integration
5. PDF/Excel export
6. HATEOAS polishing + frontend finalization
7. test evidence + demo script
