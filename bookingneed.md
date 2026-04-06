# Booking Module Dependency Needs (Member 2)

## Purpose
This document lists everything Module B needs from other modules so Booking can be completed without blockers.

## Need 1 - From Module A (Resources)
### Required Contracts
- Resource lookup by ID (active resource metadata)
- Bookable-state contract: `isResourceBookable(resourceId)`
- Resource availability window details for booking-time validation

### Required Events/Callbacks
- Resource status change hook when `ACTIVE -> OUT_OF_SERVICE`
- Booking module callable operation to auto-reject pending bookings for that resource

### Data Expectations
- Stable resource ID (UUID)
- resource status values include `ACTIVE` and `OUT_OF_SERVICE`
- resource capacity and type (ROOM/LAB/EQUIPMENT)

### Why Needed
- Block booking create/approve when resource is unavailable
- Enforce phase-2 integration requirement for auto-rejection

## Need 2 - From Module D (Notifications)
### Required Contracts
- Method to send in-app notification to user by userId
- Notification types for booking:
  - `BOOKING_APPROVED`
  - `BOOKING_REJECTED`

### Payload Needed
- recipient userId
- bookingId (referenceId)
- message text
- type

### Trigger Points
- after admin approval
- after admin rejection
- after auto-rejection due to OUT_OF_SERVICE

## Need 3 - From Module C (Tickets/Audit)
### Required Contracts
- Audit logging API/service for booking status changes

### Audit Fields Needed
- actor userId
- action (APPROVE/REJECT/CANCEL/AUTO_REJECT)
- entity type `BOOKING`
- entityId bookingId
- old value and new value
- timestamp

### Why Needed
- Traceability for viva + admin oversight

## Need 4 - From Module E (Auth/Security)
### Required Contracts
- current user context from JWT
- role checks (`USER`, `ADMIN`)

### Booking Rules Depending on Auth
- USER sees only own bookings
- USER can cancel only own approved booking
- ADMIN can approve/reject and view all bookings

## Need 5 - Frontend Integration Inputs
### Required UI Pages
- user booking form
- user booking list/detail
- admin booking management panel
- export download actions

### Required UI Behavior
- respect HATEOAS links instead of only status text
- display rejection reason clearly
- show friendly conflict error (`409`)

### Frontend File Plan (Project Standard)
- `frontend/src/types/booking.ts` -> booking types and response contracts
- `frontend/src/core/api/bookingApi.ts` -> booking API client methods only
- `frontend/src/core/store/bookingStore.ts` -> booking global state and async actions
- `frontend/src/features/bookings/components/` -> reusable booking UI blocks
- `frontend/src/features/bookings/hooks/` -> booking-specific logic hooks
- `frontend/src/pages/student/StudentBookingsPage.tsx` -> thin page composition only
- `frontend/src/pages/admin/AdminBookingsPage.tsx` -> thin page composition only

### Current Frontend Status (As-Is)
- `frontend/src/core/api/bookingApi.ts` is empty.
- `frontend/src/core/store/bookingStore.ts` is empty.
- `frontend/src/types/booking.ts` is empty.
- `frontend/src/pages/student/StudentBookingsPage.tsx` is currently a header-only placeholder.
- `frontend/src/pages/admin/` does not currently contain a booking management page.

### Frontend Acceptance Checklist (Phase 5)
- [x] Booking types defined in `frontend/src/types/booking.ts`
- [x] API methods added in `frontend/src/core/api/bookingApi.ts`
- [x] Store actions/selectors added in `frontend/src/core/store/bookingStore.ts`
- [x] Student booking list/detail/cancel flow wired
- [x] Admin approve/reject flow with rejection reason modal wired
- [x] PDF/Excel export buttons wired with loading and file download
- [x] `409` conflict and validation errors shown with clear UI messages
- [x] HATEOAS action links consumed when backend links are available

### Frontend Phase Split

#### Frontend Phase F1 - Contracts and API Layer
- Create booking contracts in `frontend/src/types/booking.ts`
- Add API client methods in `frontend/src/core/api/bookingApi.ts`:
  - getBookings
  - getBookingById
  - createBooking
  - approveBooking
  - rejectBooking
  - cancelBooking
  - exportBookingsPdf
  - exportBookingsExcel
- Normalize API error handling for `400/403/404/409`

#### Frontend Phase F2 - Store and State Wiring
- Implement booking store in `frontend/src/core/store/bookingStore.ts`
- Add loading, error, and pagination state
- Add actions for list/detail/create/approve/reject/cancel/export
- Add filter state: status, resourceId, from, to

#### Frontend Phase F3 - Student Flows
- Build booking list + detail in `frontend/src/pages/student/StudentBookingsPage.tsx`
- Add cancel action for `APPROVED` bookings only
- Show rejection reason for `REJECTED` bookings
- Show friendly conflict message for `409`

#### Frontend Phase F4 - Admin Booking Management
- Create `frontend/src/pages/admin/AdminBookingsPage.tsx`
- Add pending booking actions: approve/reject
- Add rejection reason modal and validation
- Add filter controls: status, date range, resource

#### Frontend Phase F5 - Export Integration
- Add PDF and Excel export buttons in admin page
- Pass current filters to export endpoints
- Show loading states during file generation
- Trigger browser download with server file names

#### Frontend Phase F6 - HATEOAS Consumption and Polish
- Read `_links` from booking responses when backend HATEOAS is ready
- Render action buttons based on available links (not status text only)
- Final UI polish, empty states, and responsive checks
- Add manual test checklist evidence for viva/demo

## Need 6 - DevOps/Project Standards
### Required Setup
- CI build includes booking unit/integration tests
- API docs/Postman collection updated for all 8 endpoints
- sample data for bookings/resources/users for demo

## Phase-wise External Dependency Checklist
- Phase 1: Resource schema finalized and status enum agreed
- Phase 2: Auth role access stable in backend security config
- Phase 3: Resource status-change callback wired
- Phase 3: Notification send API available and tested
- Phase 3: Audit logging integration available
- Phase 4: Export libraries and file download headers validated
- Phase 5: Frontend consumes booking API + `_links`
- Phase 6: End-to-end test evidence prepared for viva

## Final Acceptance Checklist
- [x] Create booking blocked for OUT_OF_SERVICE resources
- [x] Approve booking blocked when resource turns OUT_OF_SERVICE
- [x] Pending bookings auto-reject on resource OUT_OF_SERVICE
- [x] Auto-rejection reason stored exactly: `Resource is out of service.`
- [x] Notifications sent for approve/reject/auto-reject
- [x] Audit logs written for booking status transitions
- [x] Exports include rejected records and rejection reasons
- [x] USER data isolation verified
- [x] Admin filters and actions verified

## Current Status Note
- Booking side integration is complete for resource checks, conflict handling, ownership rules, notification triggers, and audit logging.
- Backend export endpoints are implemented for PDF and Excel with optional filters.
- Frontend booking wiring is implemented through F1-F6, including HATEOAS-first action rendering with safe fallback when links are absent.
