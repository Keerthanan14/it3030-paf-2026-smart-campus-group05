
# 👤 Member 1 — Facilities & Assets Catalogue + Availability Calendar

## Individual PRD | IT3030 Smart Campus Operations Hub

---

## 📌 Quick Reference

| Field              | Details                                       |
| ------------------ | --------------------------------------------- |
| Module Owned       | Module A — Facilities & Assets Catalogue     |
| Additional Feature | Availability Calendar View                    |
| Total Endpoints    | 7 REST endpoints                              |
| Frontend Pages     | 4 pages / components                          |
| Viva Readiness     | Must explain all 7 endpoints + calendar logic |

---

## 1. Overview of Responsibility

Member 1 is responsible for the **foundation of the entire system** — the resource catalogue. Every booking and every incident ticket references a resource from this module. If this module is not solid, nothing else in the system works properly.

Your job is to:

* Build and maintain the catalogue of all bookable university resources
* Allow users to search and filter resources in a meaningful way
* Allow admins to manage the lifecycle of each resource (create, update, delete, change status)
* Provide a visual availability calendar so users can see when a resource is free before booking

This module directly feeds into Module B (Bookings) and Module C (Tickets) — so the data model you design here affects your teammates' work too. Agree on the `resources` table structure with the team in Week 1 before anyone starts coding.

---

## 2. Functional Requirements

### 2.1 Resource Management (Admin)

| ID     | Requirement                                                                                                                                   | Priority  |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| FR-A01 | Admin can create a new bookable resource with name, type, capacity, location, description, availability windows, and status                   | Must Have |
| FR-A02 | Admin can update any field of an existing resource                                                                                            | Must Have |
| FR-A03 | Admin can delete a resource. Use soft delete — set a `deleted`flag rather than physically removing the record, since bookings reference it | Must Have |
| FR-A04 | Admin can change resource status between ACTIVE and OUT_OF_SERVICE at any time                                                                | Must Have |
| FR-A05 | When a resource is set to OUT_OF_SERVICE, the system should not allow new booking requests for it                                             | Must Have |

### 2.2 Resource Browsing (All Users)

| ID     | Requirement                                                              | Priority  |
| ------ | ------------------------------------------------------------------------ | --------- |
| FR-A06 | Any authenticated user can view a paginated list of all ACTIVE resources | Must Have |
| FR-A07 | Users can search resources by name or description (keyword search)       | Must Have |
| FR-A08 | Users can filter resources by type (ROOM / LAB / EQUIPMENT)              | Must Have |
| FR-A09 | Users can filter resources by minimum capacity                           | Must Have |
| FR-A10 | Users can filter resources by location                                   | Must Have |
| FR-A11 | Users can view the full details of a single resource                     | Must Have |

### 2.3 Availability Calendar (Additional Feature)

| ID     | Requirement                                                                                                        | Priority     |
| ------ | ------------------------------------------------------------------------------------------------------------------ | ------------ |
| FR-A12 | Each resource has an availability calendar page showing booked time slots visually                                 | Should Have  |
| FR-A13 | The calendar fetches approved bookings for the resource and displays them as blocked time blocks                   | Should Have  |
| FR-A14 | Free slots are clearly visible in a different colour from booked slots                                             | Should Have  |
| FR-A15 | Users can navigate by week or month                                                                                | Should Have  |
| FR-A16 | Hovering/clicking a booked block shows booking details (purpose, time) — but not the requester's name for privacy | Nice to Have |

---

## 3. Non-Functional Requirements

| Category       | Requirement                                                                                                                            |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Validation     | Resource name is required (max 255 chars). Capacity must be a positive integer. Type must be a valid enum value. Location is required. |
| Security       | Only ADMIN can create, update, delete, or change status of resources. All authenticated users can read.                                |
| Performance    | Resource list endpoint must respond within 500ms including filter queries.                                                             |
| Data Integrity | Resource cannot be hard-deleted if bookings or tickets reference it. Use soft delete.                                                  |
| Error Handling | Return 404 with descriptive message if resource ID does not exist. Return 400 with field-level errors if validation fails.             |

---

## 4. Data Model

### `resources` Table

| Column               | Type         | Constraints              | Description                                   |
| -------------------- | ------------ | ------------------------ | --------------------------------------------- |
| id                   | UUID         | PK, NOT NULL             | Auto-generated primary key                    |
| name                 | VARCHAR(255) | NOT NULL                 | Display name (e.g., "Lab A — Room 201")      |
| type                 | ENUM         | NOT NULL                 | ROOM / LAB / EQUIPMENT                        |
| capacity             | INT          | NOT NULL, > 0            | Maximum number of people                      |
| location             | VARCHAR(255) | NOT NULL                 | Building and floor (e.g., "Block A, Floor 2") |
| description          | TEXT         | NULLABLE                 | Additional details about the resource         |
| availability_windows | JSON         | NULLABLE                 | Operating hours per day. See format below.    |
| status               | ENUM         | NOT NULL, DEFAULT ACTIVE | ACTIVE / OUT_OF_SERVICE                       |
| deleted              | BOOLEAN      | NOT NULL, DEFAULT false  | Soft delete flag                              |
| created_at           | TIMESTAMP    | NOT NULL                 | Record creation time                          |
| updated_at           | TIMESTAMP    | NOT NULL                 | Last update time                              |

### Availability Windows — JSON Format

This column stores which days and times the resource is available for booking.

```
Example value:
{
  "MONDAY":    { "open": "08:00", "close": "20:00" },
  "TUESDAY":   { "open": "08:00", "close": "20:00" },
  "WEDNESDAY": { "open": "08:00", "close": "20:00" },
  "THURSDAY":  { "open": "08:00", "close": "20:00" },
  "FRIDAY":    { "open": "08:00", "close": "17:00" },
  "SATURDAY":  { "open": "09:00", "close": "13:00" }
}
```

Days not listed are treated as unavailable. This is used by Module B's conflict detection logic.

### Resource Types — Enum Values

```
ROOM       → Lecture halls, meeting rooms, seminar rooms
LAB        → Computer labs, science labs, workshops
EQUIPMENT  → Projectors, cameras, microphones, tripods
```

### Resource Status — Enum Values

```
ACTIVE          → Available for booking
OUT_OF_SERVICE  → Not available (under maintenance, broken, etc.)
```

---

## 5. REST API Endpoints

All endpoints are prefixed with `/api`. JWT Bearer token required in `Authorization` header.

---

### GET /api/resources

**Purpose:** List all resources with optional search and filters. Paginated.

**Auth required:** USER, ADMIN

**Query Parameters:**

| Parameter | Type    | Required | Description                                    |
| --------- | ------- | -------- | ---------------------------------------------- |
| type      | String  | No       | Filter by ROOM / LAB / EQUIPMENT               |
| capacity  | Integer | No       | Minimum capacity filter                        |
| location  | String  | No       | Filter by location (partial match)             |
| keyword   | String  | No       | Search by name or description                  |
| status    | String  | No       | Filter by ACTIVE / OUT_OF_SERVICE (Admin only) |
| page      | Integer | No       | Page number (default 0)                        |
| size      | Integer | No       | Page size (default 10)                         |

**Success Response:** `200 OK`

```
{
  "content": [ ...list of resource objects... ],
  "totalElements": 24,
  "totalPages": 3,
  "currentPage": 0
}
```

**Error Responses:**

* `401 Unauthorized` — No or invalid JWT token

---

### GET /api/resources/

**Purpose:** Get full details of a single resource by ID.

**Auth required:** USER, ADMIN

**Path Parameters:** `id` — UUID of the resource

**Success Response:** `200 OK`

```
{
  "id": "uuid-here",
  "name": "Lab A — Room 201",
  "type": "LAB",
  "capacity": 40,
  "location": "Block A, Floor 2",
  "description": "...",
  "availabilityWindows": { ... },
  "status": "ACTIVE",
  "createdAt": "2026-03-01T10:00:00"
}
```

**Error Responses:**

* `404 Not Found` — Resource ID does not exist or is soft-deleted
* `401 Unauthorized`

---

### POST /api/resources

**Purpose:** Create a new resource.

**Auth required:** ADMIN only

**Request Body:** `application/json`

```
{
  "name": "Meeting Room 5",
  "type": "ROOM",
  "capacity": 15,
  "location": "Block C, Floor 1",
  "description": "Equipped with projector and whiteboard",
  "availabilityWindows": {
    "MONDAY": { "open": "08:00", "close": "18:00" }
  }
}
```

**Success Response:** `201 Created` — Returns the created resource object

**Error Responses:**

* `400 Bad Request` — Validation errors (missing required fields, invalid enum values)
* `403 Forbidden` — Non-admin user attempting to create

---

### PUT /api/resources/

**Purpose:** Update all fields of an existing resource.

**Auth required:** ADMIN only

**Path Parameters:** `id` — UUID of the resource

**Request Body:** Same structure as POST. All fields should be provided.

**Success Response:** `200 OK` — Returns the updated resource object

**Error Responses:**

* `400 Bad Request` — Validation errors
* `403 Forbidden` — Non-admin user
* `404 Not Found` — Resource not found

---

### PATCH /api/resources//status

**Purpose:** Change the status of a resource between ACTIVE and OUT_OF_SERVICE.

**Auth required:** ADMIN only

**Path Parameters:** `id` — UUID of the resource

**Request Body:**

```
{
  "status": "OUT_OF_SERVICE"
}
```

**Success Response:** `200 OK` — Returns the updated resource

**Error Responses:**

* `400 Bad Request` — Invalid status value
* `403 Forbidden`
* `404 Not Found`

**Important behaviour:** When a resource is set to OUT_OF_SERVICE, any PENDING booking requests for it should be automatically rejected with the reason "Resource is out of service." This logic lives in the Booking service (Module B), but Member 1 must communicate this to Member 2 clearly.

---

### DELETE /api/resources/

**Purpose:** Soft-delete a resource. Sets `deleted = true`. Does not remove from database.

**Auth required:** ADMIN only

**Path Parameters:** `id` — UUID of the resource

**Success Response:** `204 No Content`

**Error Responses:**

* `403 Forbidden`
* `404 Not Found`
* `409 Conflict` — If resource has active APPROVED bookings in the future (should not allow deletion)

---

### GET /api/resources//availability

**Purpose:** Returns the booked time slots for a resource within a given date range, for use by the calendar view.

**Auth required:** USER, ADMIN

**Path Parameters:** `id` — UUID of the resource

**Query Parameters:**

| Parameter | Type              | Required | Description         |
| --------- | ----------------- | -------- | ------------------- |
| from      | Date (YYYY-MM-DD) | Yes      | Start date of range |
| to        | Date (YYYY-MM-DD) | Yes      | End date of range   |

**Success Response:** `200 OK`

```
{
  "resourceId": "uuid-here",
  "resourceName": "Lab A",
  "availabilityWindows": {
    "MONDAY": { "open": "08:00", "close": "20:00" }
  },
  "bookedSlots": [
    {
      "date": "2026-04-10",
      "startTime": "09:00",
      "endTime": "11:00",
      "purpose": "CS Lecture"
    }
  ]
}
```

**Error Responses:**

* `400 Bad Request` — Missing or invalid date range
* `404 Not Found`

---

## 6. Frontend Pages & Components

### 6.1 Resource Listing Page

**Route:** `/resources`

**What it shows:**

* Grid or list of resource cards
* Each card shows: name, type badge, capacity, location, status badge (ACTIVE / OUT_OF_SERVICE)
* Search bar at the top (searches name and description)
* Filter panel on the side or top: type dropdown, minimum capacity input, location input
* Clicking a card navigates to the Resource Detail page
* Admin sees an "Add Resource" button

**Key behaviours:**

* Calls `GET /api/resources` with query params on search/filter change
* Pagination controls at the bottom
* OUT_OF_SERVICE resources shown with a grey/red badge, still visible but visually distinct

---

### 6.2 Resource Detail Page

**Route:** `/resources/:id`

**What it shows:**

* Full resource information: name, type, location, capacity, description, availability hours, status
* "Book This Resource" button (navigates to booking form pre-filled with resource — links to Member 2's UI)
* "View Availability Calendar" button (navigates to the calendar view)
* Admin sees "Edit" and "Delete" buttons and a status toggle

---

### 6.3 Add / Edit Resource Form (Admin)

**Route:** `/admin/resources/new` and `/admin/resources/:id/edit`

**What it shows:**

* Form fields: name (text), type (dropdown), capacity (number), location (text), description (textarea), status (dropdown for edit only)
* Availability windows section — for each day of the week, toggle it on/off and set open/close times
* Save and Cancel buttons

**Key behaviours:**

* On save, calls `POST /api/resources` (new) or `PUT /api/resources/:id` (edit)
* Shows field-level validation errors inline
* On success, navigates back to the resource list

---

### 6.4 Availability Calendar Page

**Route:** `/resources/:id/calendar`

**Library:** FullCalendar.js (React package `@fullcalendar/react`)

**What it shows:**

* A month/week calendar for the resource
* Booked time slots appear as coloured blocks (e.g., red or orange)
* Free slots within availability windows appear in green
* Outside availability hours shown as grey/blocked background
* Week navigation arrows

**Key behaviours:**

* On load, calls `GET /api/resources/:id/availability?from=...&to=...` with current view's date range
* When view changes (next week / next month), re-fetches data for new date range
* Clicking a booked block shows a tooltip with: purpose, date, time range
* "Book this slot" button available on free slot click (navigates to booking form with date/time pre-filled)

---

## 7. HTTP Status Codes Reference

| Status           | When to use                                 |
| ---------------- | ------------------------------------------- |
| 200 OK           | Successful GET, PUT, PATCH                  |
| 201 Created      | Successful POST (resource created)          |
| 204 No Content   | Successful DELETE                           |
| 400 Bad Request  | Validation failed, invalid input            |
| 401 Unauthorized | No JWT token or token expired               |
| 403 Forbidden    | Valid token but insufficient role           |
| 404 Not Found    | Resource ID does not exist                  |
| 409 Conflict     | Cannot delete resource with active bookings |

---

## 8. Validation Rules

| Field               | Rule                                                                                |
| ------------------- | ----------------------------------------------------------------------------------- |
| name                | Required. Min 3 characters. Max 255 characters.                                     |
| type                | Required. Must be ROOM, LAB, or EQUIPMENT.                                          |
| capacity            | Required. Must be a positive integer greater than 0.                                |
| location            | Required. Min 3 characters. Max 255 characters.                                     |
| description         | Optional. Max 1000 characters if provided.                                          |
| status              | Required on update. Must be ACTIVE or OUT_OF_SERVICE.                               |
| availabilityWindows | Optional. If provided, times must be valid HH:mm format. open must be before close. |

---

## 9. Error Response Format

All error responses follow this consistent JSON structure. This should be handled by the global `@ControllerAdvice` exception handler.

```
{
  "timestamp": "2026-04-10T10:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/resources",
  "fieldErrors": [
    { "field": "capacity", "message": "must be greater than 0" },
    { "field": "name", "message": "must not be blank" }
  ]
}
```

---

## 10. Integration Points with Other Members

| Integration                     | With     | Details                                                                                                                                                                                                                                   |
| ------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resource ID in bookings         | Member 2 | Booking requests reference `resource_id`. Confirm UUID type and table name early.                                                                                                                                                       |
| Resource ID in tickets          | Member 3 | Incident tickets reference `resource_id`. Same UUID as above.                                                                                                                                                                           |
| OUT_OF_SERVICE behaviour        | Member 2 | When Member 1 sets a resource OUT_OF_SERVICE, Member 2's booking service should reject new requests for it. Communicate this contract clearly.                                                                                            |
| Availability slots for calendar | Member 2 | The `/availability`endpoint reads approved bookings from the bookings table. Member 1 calls Member 2's data but Member 1 owns this endpoint — coordinate on how to query booking data (through a shared service or direct repository). |
| Resource name in notifications  | Member 4 | When notifications are sent for booking/ticket events, the resource name is often part of the message. Make sure the resource name is accessible.                                                                                         |

---

## 11. HATEOAS — Hypermedia Links for Resources

### Dependency

Add to `pom.xml`:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-hateoas</artifactId>
</dependency>
```

### What Links to Include

Wrap your resource DTO in `EntityModel<ResourceResponse>` inside the controller. Add links based on the current state of the resource.

**Single Resource Response — ACTIVE status:**

```json
{
  "id": "uuid",
  "name": "Lab A",
  "type": "LAB",
  "capacity": 40,
  "status": "ACTIVE",
  "_links": {
    "self":         { "href": "/api/resources/uuid" },
    "availability": { "href": "/api/resources/uuid/availability" },
    "book":         { "href": "/api/bookings" },
    "update":       { "href": "/api/resources/uuid" },
    "delete":       { "href": "/api/resources/uuid" },
    "all-resources":{ "href": "/api/resources" }
  }
}
```

**Single Resource Response — OUT_OF_SERVICE status:**

```json
{
  "id": "uuid",
  "name": "Lab A",
  "status": "OUT_OF_SERVICE",
  "_links": {
    "self":          { "href": "/api/resources/uuid" },
    "activate":      { "href": "/api/resources/uuid/status" },
    "all-resources": { "href": "/api/resources" }
  }
}
```

> Note: When a resource is OUT_OF_SERVICE, the `book` and `availability` links are removed — there is no point navigating to them. This is dynamic HATEOAS based on resource state.

**Collection Response — Resource List:**

```json
{
  "_embedded": {
    "resources": [ ...list of resource objects with their own _links... ]
  },
  "_links": {
    "self": { "href": "/api/resources" },
    "create": { "href": "/api/resources" }
  }
}
```

### Where to Add Links — In the Controller Only

HATEOAS links are added in the  **Controller layer** , not the Service. Your Service returns a plain `ResourceResponse` DTO. Your Controller wraps it:

```
Controller receives plain DTO from Service
  → wraps in EntityModel.of(dto)
  → adds .add(linkTo(...).withSelfRel())
  → adds other relevant links
  → returns EntityModel to client
```

### Why This Matters for Your Marks

This satisfies the **Uniform Interface** and **HATEOAS** REST constraints in the rubric under "Follows the Six REST Architectural Styles (10 marks)." Without it you can only reach Good (5–7). With it you reach Excellent (8–10).

---

## 12. Viva Preparation Checklist

You must be able to explain all of the following during the viva:

* [ ] Why soft delete is used instead of hard delete for resources
* [ ] How HATEOAS `_links` are added in the Controller using `EntityModel` and `linkTo()`
* [ ] Why the links change when a resource is OUT_OF_SERVICE (dynamic HATEOAS)
* [ ] How HATEOAS satisfies the Uniform Interface REST constraint
* [ ] How the availability_windows JSON column works and how it is used
* [ ] How the search and filter query is constructed in the repository layer
* [ ] How pagination works in the Spring Boot response
* [ ] Why PATCH is used for status change instead of PUT
* [ ] How the availability calendar endpoint works — what data it fetches and returns
* [ ] How FullCalendar.js is integrated in React and how you feed it booking data
* [ ] What happens when a resource is set to OUT_OF_SERVICE
* [ ] How @PreAuthorize is used to restrict create/update/delete to ADMIN only
* [ ] The difference between 400, 403, 404, and 409 and when each is returned

---

## 13. Individual Commit Guidelines

* Commit after every meaningful unit of work — do not batch everything into one commit at the end
* Use clear, specific commit messages:
  * `feat: add GET /api/resources with filter and pagination`
  * `feat: add soft delete for resources`
  * `feat: add availability calendar endpoint`
  * `feat: build resource listing page with search`
  * `fix: fix capacity validation allowing zero`
* All commits must be on branch `feature/member1-resources`
* Raise a Pull Request to `develop` once your feature is stable and tested

---

*End of Member 1 PRD*
*IT3030 — SLIIT Faculty of Computing — 2026 Semester 1*
