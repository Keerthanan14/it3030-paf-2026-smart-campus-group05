
# 👤 Member 3 — Maintenance & Incident Ticketing + SLA Timer + Audit Log

## Individual PRD | IT3030 Smart Campus Operations Hub

---

## 📌 Quick Reference

| Field               | Details                                                     |
| ------------------- | ----------------------------------------------------------- |
| Module Owned        | Module C — Maintenance & Incident Ticketing                |
| Additional Features | SLA Timer for Tickets + Audit Log                           |
| Total Endpoints     | 9 REST endpoints                                            |
| Frontend Pages      | 5 pages / components                                        |
| Viva Readiness      | Must explain all 9 endpoints + SLA logic + audit log design |

---

## 1. Overview of Responsibility

Member 3 owns the **incident and maintenance ticketing system** — the operational side of the platform. When something breaks on campus (a projector fails, a lab has a plumbing issue, a computer crashes), this is where the report goes. Your module handles the full lifecycle from report to resolution.

Your job is to:

* Allow users to create incident tickets with image evidence
* Manage the full ticket workflow from OPEN to CLOSED
* Allow admins to assign technicians to tickets
* Allow all parties (users, technicians, admins) to comment on tickets with ownership rules
* Track SLA (Service Level Agreement) metrics — how fast tickets are responded to and resolved
* Maintain a system-wide audit log of all significant actions

This module is the most feature-rich individual module. Plan your time carefully — the image upload and SLA tracking are the most complex parts. Start with the basic ticket CRUD first, then layer in comments, then SLA, then audit log.

---

## 2. Functional Requirements

### 2.1 Ticket Creation (User)

| ID     | Requirement                                                                                                                              | Priority  |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| FR-C01 | User can create an incident ticket with: resource/location, category, description, priority, and preferred contact details               | Must Have |
| FR-C02 | Ticket can include up to 3 image attachments uploaded as files (JPEG/PNG only, max 5MB each)                                             | Must Have |
| FR-C03 | Images are stored on the server and served back via a URL. Stored filenames should be unique to avoid collisions (use UUID-based naming) | Must Have |
| FR-C04 | User can view only their own tickets                                                                                                     | Must Have |

### 2.2 Ticket Workflow (Admin / Technician)

| ID     | Requirement                                                                                                       | Priority  |
| ------ | ----------------------------------------------------------------------------------------------------------------- | --------- |
| FR-C05 | Ticket follows the workflow: OPEN → IN_PROGRESS → RESOLVED → CLOSED. Admin may also set REJECTED with a reason | Must Have |
| FR-C06 | Admin can assign a technician (USER with TECHNICIAN role) to a ticket                                             | Must Have |
| FR-C07 | Technician (or admin) can update ticket status and add resolution notes                                           | Must Have |
| FR-C08 | Admin can view all tickets with filters. Technician can view their assigned tickets                               | Must Have |
| FR-C09 | When ticket status changes, a notification is triggered for the ticket owner (coordinate with Member 4)           | Must Have |

### 2.3 Comments

| ID     | Requirement                                                                                                                    | Priority  |
| ------ | ------------------------------------------------------------------------------------------------------------------------------ | --------- |
| FR-C10 | Any authenticated user involved in the ticket (owner, assigned technician, admin) can add a comment                            | Must Have |
| FR-C11 | Only the comment's author can edit their own comment                                                                           | Must Have |
| FR-C12 | Only the comment's author or an admin can delete a comment                                                                     | Must Have |
| FR-C13 | When a new comment is added to a ticket, a notification is triggered for the ticket owner (if they are not the one commenting) | Must Have |

### 2.4 SLA Timer (Additional Feature)

| ID     | Requirement                                                                                                                                                          | Priority     |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| FR-C14 | System records `first_response_at`— the timestamp when the ticket status first changes from OPEN (i.e., when a technician or admin first acts on it)              | Should Have  |
| FR-C15 | System records `resolved_at`— the timestamp when the ticket status changes to RESOLVED                                                                            | Should Have  |
| FR-C16 | API response includes computed SLA fields: time_to_first_response (hours/minutes), time_to_resolution (hours/minutes), and whether each SLA target has been breached | Should Have  |
| FR-C17 | SLA targets: first response within 4 hours, resolution within 48 hours. These can be constants in the code                                                           | Should Have  |
| FR-C18 | Admin can filter tickets to show only those with SLA breaches                                                                                                        | Nice to Have |

### 2.5 Audit Log (Additional Feature)

| ID     | Requirement                                                                                                                                                                                  | Priority     |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| FR-C19 | System records an audit log entry for every significant action across the whole platform: resource created/updated/deleted, booking status changed, ticket status changed, user role changed | Should Have  |
| FR-C20 | Each audit log entry records: who performed the action, what action, what entity type and ID, old value (JSON), new value (JSON), timestamp                                                  | Should Have  |
| FR-C21 | Admin can view a paginated audit log sorted by most recent                                                                                                                                   | Should Have  |
| FR-C22 | Admin can filter audit logs by entity type, action type, or user                                                                                                                             | Nice to Have |

---

## 3. Ticket Workflow — Full State Machine

```
                 ┌──────┐
    User         │ OPEN │
   creates ─────►│      │
                 └──┬───┘
                    │
           Admin/Technician acts
                    │
              ┌─────▼───────┐
              │ IN_PROGRESS  │
              └─────┬────────┘
                    │
           Technician resolves
                    │
              ┌─────▼────┐
              │ RESOLVED  │
              └─────┬─────┘
                    │
           Admin closes
                    │
              ┌─────▼───┐
              │  CLOSED  │  (terminal)
              └──────────┘

  At any point before RESOLVED:
              ┌──────────┐
              │ REJECTED  │  (terminal — Admin only, with reason)
              └──────────┘
```

### Valid Transitions

| From        | To          | Who                | Notes                              |
| ----------- | ----------- | ------------------ | ---------------------------------- |
| (none)      | OPEN        | USER               | New ticket submitted               |
| OPEN        | IN_PROGRESS | ADMIN / TECHNICIAN | Starts SLA first_response_at timer |
| IN_PROGRESS | RESOLVED    | ADMIN / TECHNICIAN | Records resolved_at timestamp      |
| RESOLVED    | CLOSED      | ADMIN              | Final closure                      |
| OPEN        | REJECTED    | ADMIN              | With mandatory reason              |
| IN_PROGRESS | REJECTED    | ADMIN              | With mandatory reason              |

### Invalid Transitions (return 400)

* CLOSED → anything
* REJECTED → anything
* RESOLVED → IN_PROGRESS (cannot go backwards)
* User cannot change ticket status (403)

---

## 4. Data Model

### `tickets` Table

| Column            | Type         | Constraints                  | Description                                                     |
| ----------------- | ------------ | ---------------------------- | --------------------------------------------------------------- |
| id                | UUID         | PK, NOT NULL                 | Auto-generated                                                  |
| user_id           | UUID         | FK → users.id, NOT NULL     | Ticket creator                                                  |
| resource_id       | UUID         | FK → resources.id, NULLABLE | The affected resource (nullable for general location incidents) |
| category          | VARCHAR(100) | NOT NULL                     | Electrical / Plumbing / IT Equipment / HVAC / Other             |
| description       | TEXT         | NOT NULL                     | Full description of the incident                                |
| priority          | ENUM         | NOT NULL                     | LOW / MEDIUM / HIGH / CRITICAL                                  |
| status            | ENUM         | NOT NULL, DEFAULT OPEN       | OPEN / IN_PROGRESS / RESOLVED / CLOSED / REJECTED               |
| assigned_to       | UUID         | FK → users.id, NULLABLE     | Assigned technician                                             |
| resolution_notes  | TEXT         | NULLABLE                     | Technician's resolution summary                                 |
| rejection_reason  | TEXT         | NULLABLE                     | Required when status is set to REJECTED                         |
| preferred_contact | VARCHAR(255) | NULLABLE                     | Phone or email provided by user                                 |
| first_response_at | TIMESTAMP    | NULLABLE                     | Set on first status change away from OPEN (SLA)                 |
| resolved_at       | TIMESTAMP    | NULLABLE                     | Set when status changes to RESOLVED (SLA)                       |
| created_at        | TIMESTAMP    | NOT NULL                     |                                                                 |
| updated_at        | TIMESTAMP    | NOT NULL                     |                                                                 |

### `ticket_attachments` Table

| Column      | Type         | Constraints                | Description                         |
| ----------- | ------------ | -------------------------- | ----------------------------------- |
| id          | UUID         | PK, NOT NULL               | Auto-generated                      |
| ticket_id   | UUID         | FK → tickets.id, NOT NULL | Parent ticket                       |
| file_name   | VARCHAR(255) | NOT NULL                   | Original file name                  |
| stored_name | VARCHAR(255) | NOT NULL                   | UUID-based unique file name on disk |
| file_url    | TEXT         | NOT NULL                   | URL path to access the file         |
| file_size   | BIGINT       | NOT NULL                   | Size in bytes                       |
| created_at  | TIMESTAMP    | NOT NULL                   |                                     |

### `comments` Table

| Column     | Type      | Constraints                | Description         |
| ---------- | --------- | -------------------------- | ------------------- |
| id         | UUID      | PK, NOT NULL               | Auto-generated      |
| ticket_id  | UUID      | FK → tickets.id, NOT NULL | Parent ticket       |
| user_id    | UUID      | FK → users.id, NOT NULL   | Comment author      |
| content    | TEXT      | NOT NULL                   | Comment text        |
| created_at | TIMESTAMP | NOT NULL                   |                     |
| updated_at | TIMESTAMP | NOT NULL                   | Updated when edited |

### `audit_logs` Table

| Column      | Type         | Constraints              | Description                                            |
| ----------- | ------------ | ------------------------ | ------------------------------------------------------ |
| id          | UUID         | PK, NOT NULL             | Auto-generated                                         |
| user_id     | UUID         | FK → users.id, NULLABLE | Who performed the action (null for system actions)     |
| action      | VARCHAR(100) | NOT NULL                 | CREATE / UPDATE / DELETE / STATUS_CHANGE / ROLE_CHANGE |
| entity_type | VARCHAR(100) | NOT NULL                 | RESOURCE / BOOKING / TICKET / USER / COMMENT           |
| entity_id   | UUID         | NOT NULL                 | ID of the affected record                              |
| old_value   | JSON         | NULLABLE                 | Previous state (relevant fields only)                  |
| new_value   | JSON         | NOT NULL                 | New state after the action                             |
| created_at  | TIMESTAMP    | NOT NULL                 | When the action occurred                               |

---

## 5. REST API Endpoints

All endpoints are prefixed with `/api`. JWT Bearer token required in `Authorization` header.

---

### GET /api/tickets

**Purpose:** List tickets. USER sees only their own. ADMIN and TECHNICIAN see filtered views.

**Auth required:** USER, ADMIN, TECHNICIAN

**Query Parameters:**

| Parameter   | For        | Description                                  |
| ----------- | ---------- | -------------------------------------------- |
| status      | ADMIN/TECH | Filter by ticket status                      |
| priority    | ADMIN/TECH | Filter by priority                           |
| category    | ADMIN      | Filter by category                           |
| assignedTo  | ADMIN      | Filter by technician UUID                    |
| slaBreached | ADMIN      | true/false — show only SLA-breached tickets |
| page, size  | All        | Pagination                                   |

**Role behaviour:**

* USER → always filtered to own tickets only
* TECHNICIAN → sees only tickets assigned to them
* ADMIN → sees all tickets with full filter access

**Success Response:** `200 OK` — Paginated list with SLA fields included per ticket

---

### GET /api/tickets/

**Purpose:** Get full detail of a single ticket including attachments, comments, and SLA info.

**Auth required:** USER (own only), ADMIN, TECHNICIAN (assigned only)

**Success Response:** `200 OK`

```
{
  "id": "...",
  "category": "IT Equipment",
  "description": "...",
  "priority": "HIGH",
  "status": "IN_PROGRESS",
  "assignedTo": { "id": "...", "name": "Tech Name" },
  "attachments": [ { "fileUrl": "...", "fileName": "..." } ],
  "comments": [ { "id": "...", "author": "...", "content": "...", "createdAt": "..." } ],
  "sla": {
    "firstResponseAt": "2026-04-10T10:30:00",
    "resolvedAt": null,
    "timeToFirstResponse": "2h 15m",
    "firstResponseBreached": false,
    "timeToResolution": null,
    "resolutionBreached": false
  },
  "createdAt": "..."
}
```

**Error Responses:**

* `403 Forbidden` — USER accessing another user's ticket
* `404 Not Found`

---

### POST /api/tickets

**Purpose:** Create a new incident ticket. Supports file upload for images.

**Auth required:** USER, ADMIN

**Request:** `multipart/form-data`

```
Fields:
  resourceId    (optional UUID)
  category      (required string)
  description   (required string)
  priority      (required: LOW/MEDIUM/HIGH/CRITICAL)
  preferredContact (optional string)

Files:
  images[]      (optional, max 3 files, JPEG/PNG only, max 5MB each)
```

**Success Response:** `201 Created` — Returns the created ticket with attachment URLs

**Error Responses:**

* `400 Bad Request` — Validation errors, more than 3 images, invalid file type, file too large
* `404 Not Found` — Resource ID not found (if provided)

**File handling:**

* Generate a UUID-based filename for each uploaded file to prevent naming collisions
* Store files in a configured directory (e.g., `uploads/tickets/`)
* Save the URL path (e.g., `/uploads/tickets/uuid-filename.jpg`) to the database
* Serve files statically from Spring Boot (configure a resource handler)

---

### PUT /api/tickets//status

**Purpose:** Update the status of a ticket.

**Auth required:** ADMIN, TECHNICIAN (for IN_PROGRESS and RESOLVED only)

**Request Body:**

```
{
  "status": "IN_PROGRESS",
  "resolutionNotes": "Replaced faulty projector lamp.",  (required when setting to RESOLVED)
  "rejectionReason": "Duplicate ticket already open."    (required when setting to REJECTED)
}
```

**Success Response:** `200 OK` — Returns updated ticket

**Important behaviour:**

* Validate the transition is allowed (see state machine above)
* When transitioning away from OPEN for the first time, record `first_response_at = now()`
* When transitioning to RESOLVED, record `resolved_at = now()`
* Trigger a notification to the ticket owner about the status change (coordinate with Member 4)
* Write an entry to `audit_logs` recording the status change

**Error Responses:**

* `400 Bad Request` — Invalid transition, missing required reason/notes
* `403 Forbidden` — User role not permitted for this transition
* `404 Not Found`

---

### PUT /api/tickets//assign

**Purpose:** Admin assigns a technician to a ticket.

**Auth required:** ADMIN only

**Request Body:**

```
{
  "technicianId": "uuid-of-technician-user"
}
```

**Success Response:** `200 OK` — Returns updated ticket with assigned technician

**Error Responses:**

* `400 Bad Request` — Provided userId does not have TECHNICIAN role
* `403 Forbidden`
* `404 Not Found`

---

### POST /api/tickets//comments

**Purpose:** Add a comment to a ticket.

**Auth required:** USER (own ticket only), ADMIN, TECHNICIAN (assigned ticket)

**Request Body:**

```
{
  "content": "I have also experienced this issue in Lab B."
}
```

**Success Response:** `201 Created` — Returns the created comment

**Important behaviour:**

* If the commenter is not the ticket owner, trigger a notification to the ticket owner (coordinate with Member 4)
* Write an audit log entry for the comment creation

**Error Responses:**

* `400 Bad Request` — Empty content
* `403 Forbidden` — USER commenting on a ticket they don't own

---

### PUT /api/tickets//comments/

**Purpose:** Edit an existing comment.

**Auth required:** Comment owner only (any role — but only YOUR own comment)

**Request Body:**

```
{
  "content": "Updated comment text here."
}
```

**Success Response:** `200 OK` — Returns the updated comment

**Error Responses:**

* `403 Forbidden` — Not the comment owner
* `404 Not Found` — Comment or ticket not found

---

### DELETE /api/tickets//comments/

**Purpose:** Delete a comment.

**Auth required:** Comment owner OR ADMIN

**Success Response:** `204 No Content`

**Error Responses:**

* `403 Forbidden` — Not the comment owner and not an admin
* `404 Not Found`

---

### GET /api/audit-logs

**Purpose:** Get paginated audit logs for the admin dashboard.

**Auth required:** ADMIN only

**Query Parameters:**

| Parameter  | Description                                            |
| ---------- | ------------------------------------------------------ |
| entityType | Filter by RESOURCE / BOOKING / TICKET / USER / COMMENT |
| action     | Filter by CREATE / UPDATE / DELETE / STATUS_CHANGE     |
| userId     | Filter by who performed the action                     |
| from       | Filter from this timestamp                             |
| to         | Filter to this timestamp                               |
| page, size | Pagination                                             |

**Success Response:** `200 OK` — Paginated list of audit log entries

```
{
  "content": [
    {
      "id": "...",
      "user": { "id": "...", "name": "Admin User" },
      "action": "STATUS_CHANGE",
      "entityType": "TICKET",
      "entityId": "...",
      "oldValue": { "status": "OPEN" },
      "newValue": { "status": "IN_PROGRESS" },
      "createdAt": "2026-04-10T11:00:00"
    }
  ],
  "totalElements": 150,
  "totalPages": 15
}
```

---

## 6. SLA Timer Logic

### Target Values (constants in your code)

```
FIRST_RESPONSE_TARGET = 4 hours
RESOLUTION_TARGET     = 48 hours
```

### How to Track

1. When a ticket is created, record `created_at`
2. When the ticket's status changes from OPEN for the first time, record `first_response_at = LocalDateTime.now()`
3. When the ticket's status changes to RESOLVED, record `resolved_at = LocalDateTime.now()`

### How to Compute SLA Fields in the API Response

```
timeToFirstResponse = first_response_at - created_at
  → if first_response_at is null, use now() - created_at (still waiting)

firstResponseBreached =
  (first_response_at is null AND now() > created_at + 4h)
  OR
  (first_response_at is not null AND first_response_at > created_at + 4h)

timeToResolution = resolved_at - created_at
  → if resolved_at is null and status is not RESOLVED/CLOSED/REJECTED, use now() - created_at

resolutionBreached =
  (resolved_at is null AND status is not terminal AND now() > created_at + 48h)
  OR
  (resolved_at is not null AND resolved_at > created_at + 48h)
```

### Frontend Display

* If `firstResponseBreached = true` → show a red badge: "First Response SLA Breached"
* If `resolutionBreached = true` → show a red badge: "Resolution SLA Breached"
* Otherwise show green: "Within SLA"
* Show elapsed time in human-readable format: "2h 15m", "1d 3h"

---

## 7. Audit Log Design

The audit log should be populated from service methods — not controllers. Every time a significant action occurs, call `auditLogService.log(...)` at the end of the service method.

### What to Log

| Action        | Entity   | Trigger                                  |
| ------------- | -------- | ---------------------------------------- |
| CREATE        | RESOURCE | Admin creates a new resource             |
| UPDATE        | RESOURCE | Admin edits resource details             |
| DELETE        | RESOURCE | Admin soft-deletes a resource            |
| STATUS_CHANGE | RESOURCE | Admin changes resource to OUT_OF_SERVICE |
| STATUS_CHANGE | BOOKING  | Booking approved, rejected, or cancelled |
| STATUS_CHANGE | TICKET   | Ticket status changes                    |
| CREATE        | TICKET   | User creates a ticket                    |
| CREATE        | COMMENT  | Comment added to ticket                  |
| DELETE        | COMMENT  | Comment deleted                          |
| ROLE_CHANGE   | USER     | Admin changes a user's role              |

### AuditLogService Interface

Define a shared service that all other members can call:

```
auditLogService.log(
  userId,        // UUID of who did the action
  action,        // "STATUS_CHANGE", "CREATE", etc.
  entityType,    // "BOOKING", "TICKET", "RESOURCE", etc.
  entityId,      // UUID of the affected record
  oldValue,      // Map<String, Object> or JSON string of old state
  newValue       // Map<String, Object> or JSON string of new state
)
```

Other members (Member 1, 2, 4) will call this service from their own service layers. You own the `AuditLogService` and `AuditLog` entity — define the interface clearly so others can use it without knowing the internals.

---

## 8. Frontend Pages & Components

### 8.1 Create Ticket Form

**Route:** `/tickets/new`

**What it shows:**

* Resource selector (optional — searchable dropdown)
* Category dropdown (Electrical, Plumbing, IT Equipment, HVAC, Other)
* Description textarea
* Priority selector (LOW / MEDIUM / HIGH / CRITICAL) — with colour indicators
* Preferred contact input
* Image upload area — drag and drop or file picker, shows thumbnail previews, max 3 files
* Submit button

**Key behaviours:**

* File validation before upload: type must be JPEG/PNG, size must be under 5MB
* Show preview thumbnails of selected images
* On submit, use FormData to send multipart request
* Show validation errors inline

---

### 8.2 My Tickets List Page (User)

**Route:** `/tickets`

**What it shows:**

* List of current user's tickets
* Each row: category, priority badge, status badge, SLA indicator, created date
* Filter by status
* Click row → goes to ticket detail

**SLA indicator:** A small coloured dot or tag. Green = within SLA, Red = breached, Orange = warning (approaching SLA limit).

---

### 8.3 Ticket Detail Page

**Route:** `/tickets/:id`

**What it shows:**

* Full ticket info: category, description, priority, status, assigned technician, preferred contact
* Image attachments — thumbnail gallery with lightbox to view full image
* SLA section: first response time, resolution time, breach indicators
* Status history / timeline (if time allows)
* Comments section (threaded list with Add Comment form below)
* For comments: Edit and Delete buttons visible only on user's own comments

**Key behaviours:**

* Comments form submits to `POST /api/tickets/:id/comments`
* Edit comment → inline edit or modal → calls `PUT /api/tickets/:id/comments/:cid`
* Delete comment → confirmation dialog → calls `DELETE /api/tickets/:id/comments/:cid`

---

### 8.4 Admin Ticket Management Panel

**Route:** `/admin/tickets`

**What it shows:**

* Table of all tickets
* Columns: User, Category, Priority, Status, SLA Status, Assigned To, Created At, Actions
* Filter bar: status, priority, category, SLA breach toggle, assigned technician
* Actions column: "Assign Technician" button, "Update Status" button
* Assign Technician → modal with searchable user dropdown (shows only TECHNICIAN role users)
* Update Status → modal with status dropdown + resolution notes / rejection reason fields

---

### 8.5 Admin Audit Log Page

**Route:** `/admin/audit-logs`

**What it shows:**

* Paginated table of all audit log entries
* Columns: Timestamp, User, Action, Entity Type, Entity ID, Old Value, New Value
* Filter bar: entity type, action, date range
* Old/New Value columns show compact JSON summary (expandable)

---

## 9. HTTP Status Codes Reference

| Status                | When                                                       |
| --------------------- | ---------------------------------------------------------- |
| 200 OK                | Successful GET, PUT                                        |
| 201 Created           | Ticket created, comment added                              |
| 204 No Content        | Comment deleted                                            |
| 400 Bad Request       | Validation errors, invalid status transition, invalid file |
| 401 Unauthorized      | No or expired JWT                                          |
| 403 Forbidden         | Role not allowed for action                                |
| 404 Not Found         | Ticket, comment, or resource not found                     |
| 413 Payload Too Large | Image file exceeds 5MB                                     |

---

## 10. Integration Points with Other Members

| Integration                    | With            | Details                                                                                                               |
| ------------------------------ | --------------- | --------------------------------------------------------------------------------------------------------------------- |
| Resource reference             | Member 1        | Tickets reference resources.id. Validate resource exists when ticket is created.                                      |
| Notifications on status change | Member 4        | After ticket status changes or new comment, call notification service with userId, type, ticketId, message.           |
| Notifications on new comment   | Member 4        | When new comment is added, notify ticket owner if they are not the commenter.                                         |
| Audit log called by all        | Members 1, 2, 4 | You define AuditLogService. Share the interface early. Other members call your service from their own service layers. |

---

## 11. HATEOAS — Hypermedia Links for Tickets and Audit Logs

### Dependency

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-hateoas</artifactId>
</dependency>
```

### Ticket Response — Dynamic Links by Status

Like bookings, ticket links change based on the current status. Available actions differ for each status.

**OPEN ticket:**

```json
{
  "id": "ticket-uuid",
  "status": "OPEN",
  "_links": {
    "self":          { "href": "/api/tickets/ticket-uuid" },
    "update-status": { "href": "/api/tickets/ticket-uuid/status" },
    "assign":        { "href": "/api/tickets/ticket-uuid/assign" },
    "add-comment":   { "href": "/api/tickets/ticket-uuid/comments" },
    "all-tickets":   { "href": "/api/tickets" }
  }
}
```

**IN_PROGRESS ticket:**

```json
{
  "id": "ticket-uuid",
  "status": "IN_PROGRESS",
  "_links": {
    "self":          { "href": "/api/tickets/ticket-uuid" },
    "update-status": { "href": "/api/tickets/ticket-uuid/status" },
    "add-comment":   { "href": "/api/tickets/ticket-uuid/comments" },
    "all-tickets":   { "href": "/api/tickets" }
  }
}
```

> Note: `assign` link removed — technician is already assigned at this stage.

**RESOLVED ticket:**

```json
{
  "id": "ticket-uuid",
  "status": "RESOLVED",
  "_links": {
    "self":          { "href": "/api/tickets/ticket-uuid" },
    "update-status": { "href": "/api/tickets/ticket-uuid/status" },
    "add-comment":   { "href": "/api/tickets/ticket-uuid/comments" },
    "all-tickets":   { "href": "/api/tickets" }
  }
}
```

**CLOSED or REJECTED ticket** — Terminal state. No status update possible.

```json
{
  "id": "ticket-uuid",
  "status": "CLOSED",
  "_links": {
    "self":        { "href": "/api/tickets/ticket-uuid" },
    "add-comment": { "href": "/api/tickets/ticket-uuid/comments" },
    "all-tickets": { "href": "/api/tickets" }
  }
}
```

### Comment Response — Ownership-Based Links

Links on a comment depend on whether the current user is the author.

**Comment owned by current user:**

```json
{
  "id": "comment-uuid",
  "content": "I also noticed this in Lab B.",
  "_links": {
    "self":   { "href": "/api/tickets/ticket-uuid/comments/comment-uuid" },
    "edit":   { "href": "/api/tickets/ticket-uuid/comments/comment-uuid" },
    "delete": { "href": "/api/tickets/ticket-uuid/comments/comment-uuid" }
  }
}
```

**Comment owned by someone else (or Admin viewing):**

```json
{
  "id": "comment-uuid",
  "content": "I also noticed this in Lab B.",
  "_links": {
    "self":   { "href": "/api/tickets/ticket-uuid/comments/comment-uuid" },
    "delete": { "href": "/api/tickets/ticket-uuid/comments/comment-uuid" }
  }
}
```

> Admin always gets the delete link. Non-owner non-admin gets only self.

### Audit Log Response

Audit logs are read-only so links are minimal:

```json
{
  "id": "log-uuid",
  "action": "STATUS_CHANGE",
  "entityType": "TICKET",
  "entityId": "ticket-uuid",
  "_links": {
    "self":       { "href": "/api/audit-logs/log-uuid" },
    "entity":     { "href": "/api/tickets/ticket-uuid" },
    "all-logs":   { "href": "/api/audit-logs" }
  }
}
```

The `entity` link navigates directly to the affected record — very useful in the admin audit log UI.

---

## 12. Viva Preparation Checklist

* [ ] Explain the ticket state machine and all valid/invalid transitions
* [ ] Explain HATEOAS on tickets — why update-status link disappears on CLOSED/REJECTED
* [ ] Explain comment ownership-based links — why edit link only appears for comment owner
* [ ] Explain the `entity` link in audit logs and why it is useful
* [ ] Explain how multipart file upload works in Spring Boot (MultipartFile)
* [ ] Explain how files are stored and served statically
* [ ] Explain how comment ownership is enforced (only edit/delete your own)
* [ ] Explain how SLA first_response_at is set only once (on first status change from OPEN)
* [ ] Explain how SLA breach is computed in the API response
* [ ] Explain the audit log design — what triggers a log entry and how other members use it
* [ ] Explain how TECHNICIAN role is different from USER and ADMIN in this context
* [ ] Explain why image files get UUID-based stored names
* [ ] Explain how paginated responses work in Spring Boot (Page`<T>`)

---

## 13. Individual Commit Guidelines

* Commit after every meaningful unit of work
* Use clear, specific commit messages:
  * `feat: add POST /api/tickets with multipart image upload`
  * `feat: add ticket status update with SLA tracking`
  * `feat: add comment CRUD with ownership enforcement`
  * `feat: implement audit log service and GET /api/audit-logs`
  * `feat: build ticket detail page with SLA indicators`
  * `fix: fix SLA breach calculation for resolved tickets`
* All commits must be on branch `feature/member3-tickets`
* Raise a Pull Request to `develop` once your feature is tested

---

*End of Member 3 PRD*
*IT3030 — SLIIT Faculty of Computing — 2026 Semester 1*
