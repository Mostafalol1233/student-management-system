---
name: Professionalization features
description: Tracks which audit-report issues are fixed and which were deferred
---

## Fixed in this session

### Backend
- **Student code generation** (`server/db-storage.ts`): Changed from random 4-digit to sequential (max+1, starting at 1001). Eliminates collision risk entirely.
- **API role enforcement** (`server/routes.ts`):
  - `POST /api/students` → `requireRole("admin", "reception")`
  - `PUT /api/students/:id` → `requireRole("admin", "reception")`
  - `DELETE /api/students/:id` → `requireRole("admin")`
  - `POST /api/sessions` → `requireAuth`
  - `PUT /api/sessions/:id` → `requireAuth`
  - `DELETE /api/sessions/:id` → `requireAuth`
  - `DELETE /api/attendance/:id` → `requireAuth` + teacher-ownership check (teacher can only delete their own session's records; accountant/reception blocked)
  - `DELETE /api/grades/:id` → `requireRole("admin", "teacher")`
- **Default settings** (`server/routes.ts`): Added `grades_list` and `sections_list` default values.

### Frontend
- **Homework subjects bug** (`homework-management.tsx` line 161): Was referencing undefined `SUBJECTS` constant; fixed to `subjectOptions`.
- **Settings-driven grades/sections** (`student-registration.tsx`, `group-management.tsx`): Both now load grades/sections from `settings.grades_list` / `settings.sections_list` with hardcoded fallback arrays.
- **Settings page UI** (`settings-page.tsx`): Added text inputs for `grades_list` and `sections_list` so admins can configure curriculum-specific values.

## Already fixed before this session (no action needed)
- #3 Smart analytics real data, #6 grade scale from settings, #8 delete dependency checks,
  #10 CSV overdue status, #12 reception partial payment, #13 attendance session guard,
  #15 last_login, #16 attendance notes field, #17 score cap, #18 timetable implemented,
  #21 Arabic sort, #22 delete confirmations, #24 mark-all-absent, #27 per_student salary,
  #30 nationalId/photoUrl fields

## Deferred / not applicable
- #23 WhatsApp reconnect after session loss — requires persistent WA session storage; complex
- #4 Salary report performance — correctness is fine; in-memory filter is acceptable for current scale
- #11 Homework onBlur stale state — backend upsert handles it; no data loss possible
