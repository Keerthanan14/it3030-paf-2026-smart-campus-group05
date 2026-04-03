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
- [ ] Audit logs written for booking status transitions (Pending - depends on Admin/Audit module implementation)
- [ ] Exports include rejected records and rejection reasons (Pending - Phase 4)
- [x] USER data isolation verified
- [x] Admin filters and actions verified

## Current Status Note
- Booking side integration is complete for resource checks, conflict handling, ownership rules, and notification triggers.
- Admin audit logging is an external dependency and will be completed once the Admin/Audit module service is available.
