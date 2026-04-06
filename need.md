# Module B Handover Needs from Resource Module (Phase 2 Integration)

## Purpose
This file tells Member 2 exactly what must be done in Booking so Resource Management Phase 2 is fully complete across modules.

## Current State from Module A (Already Ready)
Module A has already provided these capabilities:

1. Resource status lifecycle endpoint exists.
2. Resource status supports ACTIVE and OUT_OF_SERVICE.
3. Resource service now includes a booking contract method:
- isResourceBookable(resourceId)
4. Non-admin resource list visibility is restricted to ACTIVE status only.

## What Module B Must Implement Now

### 1. Booking Create Flow Must Validate Resource Bookable State
Before creating any booking request, Booking service must check if the resource is bookable.

Required behavior:
1. Call Resource contract check for the target resource id.
2. If not bookable, reject create request immediately.
3. Return an error message:
- Resource is out of service.

Recommended status code:
- 409 Conflict (preferred for business rule conflict)
- 400 Bad Request is acceptable only if your team standard already uses 400 for business validation.

### 2. Booking Approve Flow Must Re-Validate Resource Bookable State
Even if request was created earlier, approval must validate again.

Why:
- Resource may become OUT_OF_SERVICE between create and approve.

Required behavior:
1. Re-check resource bookable state at approval time.
2. If not bookable, block approval.
3. Return clear reason:
- Cannot approve booking. Resource is out of service.

### 3. Pending Bookings Must Be Auto-Rejected When Resource Becomes OUT_OF_SERVICE
This is a cross-module contract from Member 1 PRD.

Required behavior in Booking module:
1. Listen for resource status change event/hook OR provide a callable booking service method from Resource transition hook.
2. Find all pending bookings for that resource.
3. Mark each as REJECTED.
4. Save rejection reason exactly:
- Resource is out of service.
5. Trigger normal notification flow for affected users.

### 4. Export and Listing Logic Must Respect Rejected State Changes
If pending bookings are auto-rejected due to OUT_OF_SERVICE:
1. Booking list endpoints should show updated status and reason.
2. PDF/Excel export should include those rejected records consistently.

## API/Service Contract Recommendation
Use one of these integration options:

1. Same backend module direct service call:
- BookingService depends on ResourceService and calls isResourceBookable(resourceId).

2. HTTP integration (if split service style):
- Booking calls Resource endpoint by resource id and uses status field.
- Bookable when status is ACTIVE and deleted is false.

Preferred:
- Direct service call inside same monolith for simplicity and consistency.

## Acceptance Checklist for Member 2
Mark done only when all are complete.

 [x] Booking create blocks OUT_OF_SERVICE resources.
 [x] Booking approve blocks OUT_OF_SERVICE resources.
 [x] Pending bookings auto-reject on resource OUT_OF_SERVICE transition.
 [x] Rejection reason is stored exactly as agreed.
 [x] Notification flow works for auto-rejected bookings.
 [x] Booking list and export reflect updated statuses.
 [x] Test coverage added for all above cases.

## Suggested Test Cases for Module B

1. Create booking for ACTIVE resource -> success.
2. Create booking for OUT_OF_SERVICE resource -> blocked with expected message.
3. Approve pending booking after resource switched to OUT_OF_SERVICE -> blocked.
4. Resource switched to OUT_OF_SERVICE with existing pending bookings -> all become REJECTED with exact reason.
5. Export includes auto-rejected bookings with reason.

## Coordination Note
Owner mapping:
- Module A: provides resource status and bookable contract.
- Module B: must enforce booking rules and status transition consequences.

Phase 2 can be treated fully complete only after Module B finishes the above integration tasks.
