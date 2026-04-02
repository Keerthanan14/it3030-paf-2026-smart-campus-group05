# Member 1 Resource Module Plan (Phased)

## Purpose
This file breaks the Resource + Availability Calendar work into clear phases so implementation, testing, and viva prep can be done in order.

## Scope Summary
- Module: Facilities and Assets Catalogue
- Additional feature: Availability Calendar
- Backend endpoints: 7
- Frontend targets: resource list, resource detail, add/edit form, calendar view

## Must-Follow Frontend Rule
For any frontend update, follow `FrontendRule.md` strictly:
- Keep pages thin in `pages/` (layout/composition only)
- Put API logic only in `core/api/`
- Put reusable logic in hooks (`core/hooks` or `features/<feature>/hooks`)
- Put reusable UI in `shared/components/ui/`
- Keep feature-specific blocks inside `features/resources/`
- Do not call APIs directly inside page components

## Phase 0 - Team Alignment (Day 1)
1. Confirm `resources` table shape and enums with all members.
2. Confirm integration contracts:
- Booking uses `resource_id` UUID
- Ticket uses `resource_id` UUID
- OUT_OF_SERVICE should block new bookings
3. Confirm shared error response format and status code behavior.

Deliverables:
- Final agreed schema and contracts documented
- No coding until this is agreed

## Phase 1 - Backend Domain + CRUD Foundation
### Goals
Build resource entity, DTOs, validation, repository, service, and core CRUD endpoints.

### Work Items
1. Create resource model with fields:
- name, type, capacity, location, description
- availabilityWindows (JSON)
- status, deleted, timestamps
2. Add enums:
- ResourceType: ROOM, LAB, EQUIPMENT
- ResourceStatus: ACTIVE, OUT_OF_SERVICE
3. Implement validation rules for create/update.
4. Implement endpoints:
- `GET /api/resources`
- `GET /api/resources/{id}`
- `POST /api/resources`
- `PUT /api/resources/{id}`
- `DELETE /api/resources/{id}` (soft delete)
5. Add security guards:
- ADMIN only for create/update/delete
- USER and ADMIN for reads
6. Add global exception responses with field errors.

Acceptance Criteria
- Soft delete works (`deleted=true`)
- 400/401/403/404/409 returned correctly
- Non-admin cannot modify resources

## Phase 2 - Search, Filter, Pagination, and Status Patch
### Goals
Complete list endpoint behavior and status lifecycle endpoint.

### Work Items
1. Add list filters:
- keyword (name/description)
- type
- minimum capacity
- location
- status (admin use)
2. Add pageable response:
- content, totalElements, totalPages, currentPage
3. Implement status change endpoint:
- `PATCH /api/resources/{id}/status`
4. Enforce rule: OUT_OF_SERVICE resources are not bookable for new requests.

Acceptance Criteria
- Filter combinations return correct subset
- Pagination metadata is correct
- Status patch updates only status behavior

## Phase 3 - Availability Calendar Backend
### Goals
Provide date-range availability data for calendar UI.

### Work Items
1. Implement endpoint:
- `GET /api/resources/{id}/availability?from=YYYY-MM-DD&to=YYYY-MM-DD`
2. Return:
- resourceId, resourceName, availabilityWindows, bookedSlots[]
3. Include only approved bookings in blocked slots.
4. Validate date range and return 400 for invalid input.

Acceptance Criteria
- Correct blocked slots in range
- Unknown resource returns 404
- Invalid range returns 400

## Phase 4 - HATEOAS Links (Controller Layer)
### Goals
Satisfy REST uniform interface requirement with dynamic links.

### Work Items
1. Add Spring HATEOAS dependency.
2. Wrap responses with `EntityModel<ResourceResponse>`.
3. Add dynamic links by state:
- ACTIVE: self, availability, book, update, delete, all-resources
- OUT_OF_SERVICE: self, activate, all-resources
4. Add list-level collection links.

Acceptance Criteria
- `_links` present in single and collection responses
- Link set changes correctly when status changes

## Phase 5 - Frontend Resource Feature (Following FrontendRule)
### Folder Plan
- `src/features/resources/components/` -> cards, filter bar, form sections, calendar block
- `src/features/resources/hooks/` -> resource list state, filter sync, calendar range hook
- `src/core/api/resourceApi.ts` -> all resource endpoints only
- `src/pages/...` -> compose feature components only

### UI Work Items
1. Resource Listing (`/resources`)
- Search + filters + pagination
- Admin sees add button
2. Resource Detail (`/resources/:id`)
- Full details + actions
- Book button + view calendar button
3. Add/Edit Resource (`/admin/resources/new`, `/admin/resources/:id/edit`)
- Validated form + availability windows controls
4. Availability Calendar (`/resources/:id/calendar`)
- Month/week navigation
- Fetch by visible date range
- Booked slots colored distinctly

Acceptance Criteria
- Pages remain thin and mostly compositional
- API calls are only in service layer/hooks
- Feature-specific logic stays inside `features/resources`

## Phase 6 - Testing, QA, and Demo Readiness
### Backend Tests
- Validation tests
- Service tests for soft delete and status transitions
- Endpoint tests for auth and error codes

### Frontend Tests / Checks
- List filter and pagination behavior
- Form validation and submit success/fail paths
- Calendar fetch on view navigation

### Demo Checklist
- Explain soft delete rationale
- Explain PATCH vs PUT for status
- Explain dynamic HATEOAS behavior
- Explain OUT_OF_SERVICE booking impact
- Explain availability window JSON usage

## Commit Plan (Small and Meaningful)
1. `feat: add resource domain model and CRUD endpoints`
2. `feat: add resource filters pagination and status patch`
3. `feat: add resource availability endpoint`
4. `feat: add hateoas links for resource responses`
5. `feat: add resource list and detail pages`
6. `feat: add resource create edit form and validations`
7. `feat: add resource availability calendar UI`
8. `test: add backend and frontend coverage for resource module`

## Notes
- Never hard delete resources referenced by bookings/tickets.
- Keep booking/ticket integration contract stable to avoid cross-member breaks.
- If status becomes OUT_OF_SERVICE, clearly signal this in UI badges and disabled actions.
