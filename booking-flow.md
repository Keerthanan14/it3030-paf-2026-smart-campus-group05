# Module B - Booking Management Flow

## Key Points

- Users can request a booking by providing:
  - resource
  - booking date
  - start time and end time
  - purpose
  - expected attendees (where applicable)

- Booking status workflow:
  - PENDING -> APPROVED
  - PENDING -> REJECTED
  - APPROVED -> CANCELLED

- Scheduling conflict prevention:
  - The system must block overlapping bookings for the same resource and date/time range.

- Admin actions:
  - Review booking requests
  - Approve bookings
  - Reject bookings with a reason

- Visibility rules:
  - USER can view only own bookings
  - ADMIN can view all bookings with filters

## Status Transition Rules

- Only PENDING bookings can be approved or rejected.
- Rejection should include a clear reason.
- Only APPROVED bookings can be cancelled.
- REJECTED and CANCELLED are terminal states.

## Validation Focus

- Validate time range (end time must be after start time).
- Validate availability window constraints.
- Validate conflict checks at create and approve stages.
- Enforce role-based access for all booking operations.
