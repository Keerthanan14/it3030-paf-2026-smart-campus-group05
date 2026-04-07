# User Management Module Plan (Admin Panel)

Date: 2026-04-07
Owner: Member 4 scope extension
Status: Planned

## Confirmed Requirements

- Roles used in system: ADMIN, TECHNICIAN, STUDENT.
- Staff creation means only ADMIN or TECHNICIAN accounts.
- Only one Create Staff action is needed (top-right button with plus icon).
- Create action opens a modal (not a full page form).
- Backend already sends temporary password email after staff create.
- Reports required: PDF and CSV.
- Report generation must open a modal first, apply filters, then generate.
- User growth chart is required as a line chart.
- Chart should not show Admin growth series.
- Tab styling should follow uploaded UI direction (clean segmented tabs).

## Delivery Strategy

We implement in small phases so each phase is testable and demo-ready.

## Phase 1 - API Contract Alignment (Backend + Frontend Types)

Goal:
- Align payloads and response models required by UI tabs, reports, and growth chart.

Tasks:
- Verify and document existing endpoints:
  - GET /api/users
  - GET /api/users/{id}
  - POST /api/admin/users/staff
- Extend user list response to include createdAt for growth chart and date filtering.
- Add frontend TypeScript types for:
  - User list item
  - Staff create request/response
  - Report filter payload
  - Growth data points
- Add role normalizer utility for ADMIN/TECHNICIAN/STUDENT handling.

Deliverables:
- Stable frontend API layer for user management.
- createdAt available for chart/report logic.

## Phase 2 - User Management Screen Foundation

Goal:
- Build the main Admin User Management screen with tab-based segmentation.

Tasks:
- Build page layout sections:
  - Header title
  - Top-right actions area (Create Staff + Report buttons)
  - Metrics summary cards
  - Tabs section
  - Data table section
- Implement tabs with requested style:
  - All
  - Student
  - Staff
- Inside Staff, support role filtering:
  - ADMIN
  - TECHNICIAN
- Add search by name/email and optional pagination controls.

Deliverables:
- Fully navigable User Management page with segmented tabs.

## Phase 3 - Create Staff Modal

Goal:
- Provide a clean modal flow for creating Admin/Technician users.

Tasks:
- Add plus-button in top-right action area.
- Open modal with fields:
  - Name
  - Email
  - Role (ADMIN or TECHNICIAN)
- Add client validation:
  - Required fields
  - Valid email
- Submit to POST /api/admin/users/staff.
- Success feedback:
  - Toast message that temp password email is sent by backend.
  - Refresh table after create.
- Error feedback with API-safe messages.

Deliverables:
- Working modal staff creation flow with role select and user refresh.

## Phase 4 - Report Generation Modal (PDF + CSV)

Goal:
- Generate user reports from a filter-driven modal.

Tasks:
- Add Report button in top-right action area.
- Open report modal with filters:
  - Role scope (All/Student/Staff/Admin/Technician)
  - Date range (from/to)
  - Optional search keyword
- Generate CSV from filtered dataset.
- Generate PDF from filtered dataset.
- Include report metadata in output:
  - Generated timestamp
  - Applied filters summary

Package plan (frontend):
- CSV: papaparse
- PDF: jspdf + jspdf-autotable

Deliverables:
- Report modal creates downloadable CSV and PDF using selected filters.

## Phase 5 - User Growth Analytics (Line Chart)

Goal:
- Show yearly user growth trend with line chart and requested role visibility.

Tasks:
- Add chart panel in User Management page.
- Add year selector.
- Aggregate monthly growth data from users createdAt.
- Render line chart series:
  - STUDENT
  - TECHNICIAN
- Exclude ADMIN series from chart as requested.
- Add no-data and loading states.

Package plan (frontend):
- Chart: recharts

Deliverables:
- Year-based line chart for user growth, excluding admin line.

## Phase 6 - QA, UX Polish, and Demo Checks

Goal:
- Ensure reliability and clean UX for submission/demo.

Tasks:
- Edge-case testing:
  - Empty data
  - API errors
  - Slow loading
- Accessibility checks for modal and tabs keyboard flow.
- Verify tab visual style consistency with uploaded reference.
- Add responsive behavior for mobile/tablet.
- Smoke test end-to-end:
  - Create staff
  - Filter tabs
  - Generate PDF/CSV
  - View growth line chart

Deliverables:
- Stable and presentation-ready user management module.

---

## Technical Notes

Current backend already has:
- POST /api/admin/users/staff
- GET /api/users

Current gap to support chart/report date filtering robustly:
- GET /api/users response needs createdAt included in DTO.

## Implementation Order (Strict)

1. Phase 1
2. Phase 2
3. Phase 3
4. Phase 4
5. Phase 5
6. Phase 6

## Definition of Done

- Admin can open User Management and switch tab filters.
- Admin can create Admin/Technician via modal from top-right plus button.
- Temporary password is sent by backend email service.
- Admin can open Report modal, choose filters, generate CSV/PDF.
- Admin can see yearly line-chart growth for Student and Technician only.
- Module passes basic manual QA and responsive checks.
