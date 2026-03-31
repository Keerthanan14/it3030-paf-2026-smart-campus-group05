
# 👤 Member 2 — Booking Management + Export Reports

## Individual PRD | IT3030 Smart Campus Operations Hub

---

## 📌 Quick Reference

| Field              | Details                                                          |
| ------------------ | ---------------------------------------------------------------- |
| Module Owned       | Module B — Booking Management                                   |
| Additional Feature | Export PDF / Excel Reports                                       |
| Total Endpoints    | 8 REST endpoints                                                 |
| Frontend Pages     | 5 pages / components                                             |
| Viva Readiness     | Must explain all 8 endpoints + conflict detection + export logic |

---

## 1. Overview of Responsibility

Member 2 owns the **core booking workflow** — the most business-critical module in the entire system. Every booking a user makes goes through your endpoints, your conflict detection logic, and your approval workflow.

Your job is to:

* Allow users to submit booking requests for resources from Module A
* Detect and prevent scheduling conflicts automatically at the database level
* Manage the full approval workflow (PENDING → APPROVED / REJECTED → CANCELLED)
* Give admins tools to review, approve, and reject requests with reasons
* Provide exportable reports in PDF and Excel format

This module depends on the `resources` table from Member 1. Agree on the `resources` data model with Member 1 in Week 1 before you start coding.

---

## 2. Functional Requirements

### 2.1 Booking Requests (User)

| ID     | Requirement                                                                                                                         | Priority    |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| FR-B01 | User can submit a booking request by selecting a resource and providing date, start time, end time, purpose, and expected attendees | Must Have   |
| FR-B02 | System must validate that the requested time is within the resource's availability windows                                          | Must Have   |
| FR-B03 | System must detect and reject any request that conflicts (overlaps) with an existing APPROVED booking for the same resource         | Must Have   |
| FR-B04 | When a conflict is detected, the system returns a helpful error message. Optionally suggest the next available slot                 | Should Have |
| FR-B05 | User can cancel their own booking if it is currently in APPROVED status                                                             | Must Have   |
| FR-B06 | User can view only their own bookings                                                                                               | Must Have   |

### 2.2 Booking Approval (Admin)

| ID     | Requirement                                                                                                                                   | Priority  |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| FR-B07 | Admin can view all bookings across all users with filter options (status, date range, resource)                                               | Must Have |
| FR-B08 | Admin can approve a PENDING booking request                                                                                                   | Must Have |
| FR-B09 | Admin can reject a PENDING booking request with a mandatory rejection reason                                                                  | Must Have |
| FR-B10 | When a booking is approved or rejected, a notification is triggered for the requesting user (handled by Module D — coordinate with Member 4) | Must Have |

### 2.3 Export Reports (Additional Feature)

| ID     | Requirement                                                                                                | Priority    |
| ------ | ---------------------------------------------------------------------------------------------------------- | ----------- |
| FR-B11 | Admin can download a full booking report as a formatted PDF file                                           | Should Have |
| FR-B12 | Admin can download a full booking report as an Excel (.xlsx) file                                          | Should Have |
| FR-B13 | Both exports support optional date range filtering                                                         | Should Have |
| FR-B14 | Exported file includes: booking ID, user name, resource name, date, time range, purpose, attendees, status | Should Have |

---

## 3. Booking Workflow — Full State Machine

This is the most important part of your module. Every status transition must be validated on the backend — you cannot trust the client to send the right status.

```
                    ┌─────────┐
         User       │ PENDING │       Admin only
       creates ────►│         │◄─── (can view, approve, reject)
                    └────┬────┘
                         │
              ┌──────────┼──────────┐
              │                     │
         Admin approves        Admin rejects
              │                     │
         ┌────▼────┐           ┌────▼────┐
         │APPROVED │           │REJECTED │  (terminal — no further transitions)
         └────┬────┘           └─────────┘
              │
         User cancels
              │
         ┌────▼────────┐
         │  CANCELLED  │  (terminal — no further transitions)
         └─────────────┘
```

### Valid Transitions

| From     | To        | Who   | Condition                              |
| -------- | --------- | ----- | -------------------------------------- |
| (none)   | PENDING   | USER  | New booking request submitted          |
| PENDING  | APPROVED  | ADMIN | No conflicts exist at time of approval |
| PENDING  | REJECTED  | ADMIN | Admin provides rejection reason        |
| APPROVED | CANCELLED | USER  | User cancels their own booking         |

### Invalid Transitions (must return 400)

* REJECTED → anything
* CANCELLED → anything
* APPROVED → REJECTED (cannot reject after approving)
* User cannot approve or reject (403)

---

## 4. Conflict Detection Logic

This is technically the most complex part of your module. You must prevent two bookings from occupying the same resource at the same time.

### Rule

A new booking request CONFLICTS with an existing booking if all three of the following are true:

1. Both bookings are for the **same resource** (`resource_id` matches)
2. Both bookings are on the **same date** (`booking_date` matches)
3. The time ranges **overlap**

### Overlap Condition

Two time ranges [A_start, A_end] and [B_start, B_end] overlap if:

```
A_start < B_end  AND  A_end > B_start
```

In plain English: they overlap unless one ends before the other starts.

### When to Check for Conflicts

* When a new booking request is submitted (POST) — check against all APPROVED bookings
* When an admin approves a booking (PUT /approve) — check again at the moment of approval, because another booking may have been approved in the meantime

### Database Query Approach

In your repository, write a query that checks for conflicting bookings:

```
Find any booking where:
  resource_id = :resourceId
  AND booking_date = :date
  AND status = 'APPROVED'
  AND start_time < :endTime
  AND end_time > :startTime
  AND id != :currentBookingId  (exclude self when checking at approval time)
```

If this query returns any result, there is a conflict. Return a 409 Conflict response.

### Race Condition Consideration

Two users might submit conflicting requests at almost exactly the same time. Both would pass the conflict check simultaneously. To handle this safely:

* Use `@Transactional` on your service method
* Use `SELECT ... FOR UPDATE` or `@Lock(LockModeType.PESSIMISTIC_WRITE)` on the conflict check query if race conditions are a concern in your implementation

---

## 5. Data Model

### `bookings` Table

| Column           | Type      | Constraints                  | Description                                 |
| ---------------- | --------- | ---------------------------- | ------------------------------------------- |
| id               | UUID      | PK, NOT NULL                 | Auto-generated primary key                  |
| user_id          | UUID      | FK → users.id, NOT NULL     | The user who made the request               |
| resource_id      | UUID      | FK → resources.id, NOT NULL | The resource being booked                   |
| booking_date     | DATE      | NOT NULL                     | Date of the booking                         |
| start_time       | TIME      | NOT NULL                     | Start time of the booking                   |
| end_time         | TIME      | NOT NULL                     | End time (must be after start_time)         |
| purpose          | TEXT      | NOT NULL                     | Reason for booking                          |
| attendees_count  | INT       | NULLABLE                     | Expected attendees (for rooms/labs)         |
| status           | ENUM      | NOT NULL, DEFAULT PENDING    | PENDING / APPROVED / REJECTED / CANCELLED   |
| rejection_reason | TEXT      | NULLABLE                     | Required when Admin sets status to REJECTED |
| created_at       | TIMESTAMP | NOT NULL                     | When the request was submitted              |
| updated_at       | TIMESTAMP | NOT NULL                     | Last status change time                     |

---

## 6. REST API Endpoints

All endpoints are prefixed with `/api`. JWT Bearer token required in `Authorization` header.

---

### GET /api/bookings

**Purpose:** List bookings. USER sees only their own. ADMIN sees all with optional filters.

**Auth required:** USER, ADMIN

**Query Parameters:**

| Parameter  | Type    | For   | Description                                         |
| ---------- | ------- | ----- | --------------------------------------------------- |
| status     | String  | ADMIN | Filter by PENDING / APPROVED / REJECTED / CANCELLED |
| resourceId | UUID    | ADMIN | Filter by specific resource                         |
| from       | Date    | ADMIN | Filter bookings from this date                      |
| to         | Date    | ADMIN | Filter bookings up to this date                     |
| page       | Integer | Both  | Page number (default 0)                             |
| size       | Integer | Both  | Page size (default 10)                              |

**Success Response:** `200 OK` — Paginated list of booking objects

**Important:** Your service layer must check the current user's role. If USER, add `WHERE user_id = :currentUserId` regardless of what filters they pass. Never let a USER see other users' bookings.

---

### GET /api/bookings/

**Purpose:** Get full details of a single booking.

**Auth required:** USER (own booking only), ADMIN (any booking)

**Path Parameters:** `id` — UUID of the booking

**Success Response:** `200 OK` — Full booking object with resource details and user name

**Error Responses:**

* `403 Forbidden` — USER trying to access another user's booking
* `404 Not Found`

---

### POST /api/bookings

**Purpose:** Submit a new booking request.

**Auth required:** USER, ADMIN

**Request Body:** `application/json`

```
{
  "resourceId": "uuid-of-resource",
  "bookingDate": "2026-04-20",
  "startTime": "09:00",
  "endTime": "11:00",
  "purpose": "Project team meeting",
  "attendeesCount": 8
}
```

**Success Response:** `201 Created` — Returns the created booking with status PENDING

**Error Responses:**

* `400 Bad Request` — Validation errors (missing fields, end time before start time, outside availability windows)
* `409 Conflict` — Overlapping booking already exists for this resource/date/time
* `404 Not Found` — Resource ID does not exist
* `400 Bad Request` — Resource is OUT_OF_SERVICE

---

### PUT /api/bookings//approve

**Purpose:** Admin approves a PENDING booking request.

**Auth required:** ADMIN only

**Path Parameters:** `id` — UUID of the booking

**Request Body:** None required (optional notes field could be added)

**Success Response:** `200 OK` — Returns the updated booking with status APPROVED

**Important behaviour:**

* Must re-check for conflicts at the moment of approval (another booking may have been approved since this one was submitted)
* If conflict found at approval time, return `409 Conflict` — Admin must reject the conflicting one first
* After successful approval, trigger a notification to the booking owner (call Member 4's notification service)

**Error Responses:**

* `400 Bad Request` — Booking is not in PENDING status
* `403 Forbidden`
* `404 Not Found`
* `409 Conflict` — Conflict detected at approval time

---

### PUT /api/bookings//reject

**Purpose:** Admin rejects a PENDING booking request with a reason.

**Auth required:** ADMIN only

**Path Parameters:** `id` — UUID of the booking

**Request Body:**

```
{
  "rejectionReason": "Room is reserved for an exam on this date."
}
```

**Success Response:** `200 OK` — Returns updated booking with status REJECTED

**Important behaviour:**

* `rejectionReason` is mandatory — return 400 if blank
* After successful rejection, trigger a notification to the booking owner
* Cannot reject an already APPROVED or CANCELLED booking

**Error Responses:**

* `400 Bad Request` — Booking not in PENDING status, or rejectionReason is empty
* `403 Forbidden`
* `404 Not Found`

---

### PUT /api/bookings//cancel

**Purpose:** User cancels their own APPROVED booking.

**Auth required:** USER (own booking only)

**Path Parameters:** `id` — UUID of the booking

**Request Body:** None

**Success Response:** `200 OK` — Returns updated booking with status CANCELLED

**Important behaviour:**

* Only the booking's owner can cancel it
* Only APPROVED bookings can be cancelled (not PENDING or REJECTED)
* No notification is needed for cancellation (user chose this themselves)

**Error Responses:**

* `400 Bad Request` — Booking not in APPROVED status
* `403 Forbidden` — Not the booking owner
* `404 Not Found`

---

### GET /api/bookings/export/pdf

**Purpose:** Download a PDF report of all bookings (with optional filters).

**Auth required:** ADMIN only

**Query Parameters:** Same as GET /api/bookings (status, resourceId, from, to)

**Success Response:** `200 OK`

```
Response Headers:
  Content-Type: application/pdf
  Content-Disposition: attachment; filename="bookings-report-2026-04-10.pdf"
```

**Body:** Binary PDF file stream

**Library to use:** iText 7 (add `com.itextpdf:itext7-core` to pom.xml)

**PDF Content:**

* Title: "Booking Report — [date range]"
* Generated at: [timestamp]
* Table with columns: Booking ID (shortened), User Name, Resource, Date, Start Time, End Time, Purpose, Attendees, Status
* Total count at bottom

---

### GET /api/bookings/export/excel

**Purpose:** Download an Excel report of all bookings.

**Auth required:** ADMIN only

**Query Parameters:** Same filters as PDF export

**Success Response:** `200 OK`

```
Response Headers:
  Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
  Content-Disposition: attachment; filename="bookings-report-2026-04-10.xlsx"
```

**Body:** Binary Excel file stream

**Library to use:** Apache POI (add `org.apache.poi:poi-ooxml` to pom.xml)

**Excel Content:**

* Sheet name: "Bookings Report"
* Bold header row with column names
* One row per booking
* Auto-sized columns

---

## 7. Frontend Pages & Components

### 7.1 Booking Request Form

**Route:** `/bookings/new` (or accessible from Resource Detail page as "Book This Resource")

**What it shows:**

* Resource selector (pre-filled if coming from resource page)
* Date picker
* Start time and end time pickers
* Purpose text area
* Attendees count input (shown only for ROOM/LAB type resources)
* Submit button

**Key behaviours:**

* Calls `POST /api/bookings` on submit
* If 409 returned, show "This slot is already booked. Try [suggested time]" message
* If 400 returned, show field-level validation errors
* On success, navigate to My Bookings page with a success toast

---

### 7.2 My Bookings Page (User View)

**Route:** `/bookings`

**What it shows:**

* List/table of the current user's bookings
* Each row: resource name, date, time range, purpose, status badge
* Filter tabs or dropdown: All / Pending / Approved / Rejected / Cancelled
* "Cancel" button visible only for APPROVED bookings
* "Book Again" shortcut button

**Key behaviours:**

* Calls `GET /api/bookings` (user sees only their own)
* Cancel button calls `PUT /api/bookings/:id/cancel` with confirmation dialog
* Clicking a row opens the booking detail

---

### 7.3 Booking Detail View

**Route:** `/bookings/:id`

**What it shows:**

* Full booking information
* Status history (if implemented) or just current status with timestamp
* For REJECTED bookings: rejection reason displayed prominently
* Cancel button (if APPROVED and owner)

---

### 7.4 Admin Booking Management Panel

**Route:** `/admin/bookings`

**What it shows:**

* Table of ALL bookings from all users
* Columns: User, Resource, Date, Time, Purpose, Attendees, Status, Actions
* Filter bar: status dropdown, date range pickers, resource filter
* For PENDING bookings: Approve and Reject buttons in the Actions column
* Approve triggers confirmation → calls approve endpoint
* Reject opens a modal with a rejection reason text field → calls reject endpoint
* Export buttons: "Download PDF" and "Download Excel"

**Key behaviours:**

* On approve, refresh the list — show the booking as APPROVED
* On reject, modal requires non-empty reason before Submit is enabled
* Export buttons call the export endpoints and trigger a browser file download

---

### 7.5 Export Download Buttons

These can be part of the Admin Booking Management Panel rather than separate pages.

**What they do:**

* "Download PDF" button → calls `GET /api/bookings/export/pdf` (with current active filters)
* "Download Excel" button → calls `GET /api/bookings/export/excel`
* Browser automatically downloads the file with the correct filename
* Show a loading spinner while the file is being generated

---

## 8. HTTP Status Codes Reference

| Status           | When to use                                                                          |
| ---------------- | ------------------------------------------------------------------------------------ |
| 200 OK           | Successful GET, PUT                                                                  |
| 201 Created      | Successful POST (booking created)                                                    |
| 204 No Content   | Not used heavily in this module                                                      |
| 400 Bad Request  | Validation failed, invalid transition, missing rejection reason                      |
| 401 Unauthorized | No or invalid JWT                                                                    |
| 403 Forbidden    | User trying to see/modify another user's booking, or non-admin using admin endpoints |
| 404 Not Found    | Booking or resource ID not found                                                     |
| 409 Conflict     | Overlapping booking detected                                                         |

---

## 9. Validation Rules

| Field           | Rule                                                                                                  |
| --------------- | ----------------------------------------------------------------------------------------------------- |
| resourceId      | Required. Must reference an existing, non-deleted resource. Resource must be ACTIVE.                  |
| bookingDate     | Required. Must be today or a future date.                                                             |
| startTime       | Required. Must be a valid time in HH:mm format.                                                       |
| endTime         | Required. Must be after startTime. Must be in HH:mm format.                                           |
| purpose         | Required. Min 5 characters. Max 500 characters.                                                       |
| attendeesCount  | Optional for EQUIPMENT type. Must be positive integer if provided. Must not exceed resource capacity. |
| rejectionReason | Required when rejecting. Min 10 characters.                                                           |

---

## 10. Integration Points with Other Members

| Integration                     | With     | Details                                                                                                                                                                   |
| ------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resource data                   | Member 1 | Booking requires a valid resource_id. Must validate resource exists and is ACTIVE. Read availability_windows to validate time is within opening hours.                    |
| Notifications on approve/reject | Member 4 | After approving or rejecting, call the notification service. Pass: userId, type (BOOKING_APPROVED or BOOKING_REJECTED), bookingId, message. Agree on the interface early. |
| Availability calendar slots     | Member 1 | Member 1's calendar endpoint reads APPROVED bookings data. Make sure your bookings table is queryable by resource_id and date range.                                      |
| Audit log on status changes     | Member 3 | When a booking status changes, Member 3's audit log service should record it. Either Member 2 calls the audit service directly, or use a Spring event/listener pattern.   |

---

## 11. HATEOAS — Dynamic Hypermedia Links for Bookings

This is the  **most powerful use of HATEOAS in the entire project** . The links in a booking response change dynamically based on the booking's current status. This is exactly what HATEOAS was designed for.

### Dependency

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-hateoas</artifactId>
</dependency>
```

### Dynamic Links by Booking Status

**PENDING booking** — Admin can approve or reject. User cannot do anything yet.

```json
{
  "id": "abc-123",
  "status": "PENDING",
  "resourceName": "Lab A",
  "_links": {
    "self":          { "href": "/api/bookings/abc-123" },
    "approve":       { "href": "/api/bookings/abc-123/approve" },
    "reject":        { "href": "/api/bookings/abc-123/reject" },
    "all-bookings":  { "href": "/api/bookings" }
  }
}
```

**APPROVED booking** — User can cancel. No approve/reject links (already approved).

```json
{
  "id": "abc-123",
  "status": "APPROVED",
  "_links": {
    "self":         { "href": "/api/bookings/abc-123" },
    "cancel":       { "href": "/api/bookings/abc-123/cancel" },
    "all-bookings": { "href": "/api/bookings" }
  }
}
```

**REJECTED booking** — Terminal state. No further actions possible.

```json
{
  "id": "abc-123",
  "status": "REJECTED",
  "_links": {
    "self":         { "href": "/api/bookings/abc-123" },
    "all-bookings": { "href": "/api/bookings" }
  }
}
```

**CANCELLED booking** — Terminal state. No further actions possible.

```json
{
  "id": "abc-123",
  "status": "CANCELLED",
  "_links": {
    "self":         { "href": "/api/bookings/abc-123" },
    "all-bookings": { "href": "/api/bookings" }
  }
}
```

### Logic in the Controller

Build the links conditionally based on booking status after getting the DTO from the service:

```
EntityModel<BookingResponse> model = EntityModel.of(bookingDto);
model.add(selfLink);
model.add(allBookingsLink);

if status == PENDING:
    model.add(approveLink)
    model.add(rejectLink)

if status == APPROVED:
    model.add(cancelLink)

// REJECTED and CANCELLED: only self + all-bookings already added
return model;
```

### Collection Response — Booking List

```json
{
  "_embedded": {
    "bookings": [ ...each booking with its own _links... ]
  },
  "_links": {
    "self":   { "href": "/api/bookings" },
    "create": { "href": "/api/bookings" }
  }
}
```

### How This Helps the React Frontend

Instead of the React component checking `if (booking.status === 'PENDING')` to show the Approve button, it checks `if (booking._links.approve)`. The backend controls what is allowed — the frontend just follows the links. This is cleaner, more RESTful, and more maintainable.

### Why This Is the Most Important HATEOAS in the Project

The booking module's dynamic links perfectly demonstrate the HATEOAS principle — the  **state of the resource drives the available hypermedia actions** . This is what "Engine Of Application State" means. Mention this explicitly in your viva.

---

## 12. Viva Preparation Checklist

* [ ] Explain the conflict detection algorithm step by step (the overlap formula)
* [ ] Explain HATEOAS — what dynamic links are returned for each booking status and why
* [ ] Explain what "Engine Of Application State" means using your booking example
* [ ] Explain how `EntityModel` wraps your DTO and links are added conditionally in the controller
* [ ] Explain why conflicts are checked again at approval time
* [ ] Explain what happens when two users try to book the same slot simultaneously
* [ ] Explain the full booking state machine and why invalid transitions return 400
* [ ] Explain why USER cannot see other users' bookings and how this is enforced in the service
* [ ] Explain how iText PDF generation works in Spring Boot
* [ ] Explain how Apache POI Excel generation works
* [ ] Explain how file download responses work (Content-Disposition header)
* [ ] Explain how @Transactional is used and why it matters here
* [ ] Explain the difference between 409 Conflict and 400 Bad Request in this context

---

## 13. Individual Commit Guidelines

* Commit after every meaningful unit of work
* Use clear, specific commit messages:
  * `feat: add POST /api/bookings with conflict detection`
  * `feat: add booking approval and rejection endpoints`
  * `feat: add booking export to PDF using iText`
  * `feat: build admin booking management panel`
  * `fix: fix conflict detection not checking date correctly`
* All commits must be on branch `feature/member2-bookings`
* Raise a Pull Request to `develop` once your feature is tested

---

*End of Member 2 PRD*
*IT3030 — SLIIT Faculty of Computing — 2026 Semester 1*
