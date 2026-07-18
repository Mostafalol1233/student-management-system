---
name: Security hardening applied
description: Summary of all security and feature fixes applied to the student management system
---

# Security Hardening Applied

## What was done

**Why:** Full review of all API routes showed no authentication on most endpoints, hardcoded JWT secret, and blocked npm package.

## Rules to apply on future edits

- All `/api/*` routes are protected by a global `requireAuth` middleware in `server/index.ts`. Public exceptions: `/api/health`, `/api/auth/login`, `/api/auth/logout`.
- `server/auth.ts`: JWT_SECRET throws in production if not set; warns in dev.
- `@whiskeysockets/baileys` is REMOVED — it depends on `protobufjs` which is blocked by Replit security policy. The `server/whatsapp-service.ts` is fully stubbed (file-based queue only, no live socket). Do NOT re-add baileys without resolving the CVE block.
- `qrcode-terminal` and `whatsapp` npm packages are also removed from package.json.
- Settings PUT (`/api/settings/:key`) is admin-only via `requireRole("admin")`.
- Seed endpoint (`/api/seed`) is admin-only.
- Change-password endpoint: `POST /api/auth/change-password` (requires currentPassword + newPassword).

## Features added

- **Change password UI**: Settings page → "أمان" tab with change-password form.
- **Mobile sidebar**: Dashboard has `mobileSidebarOpen` state; Sidebar renders a mobile overlay when `mobileOpen=true`; Header has hamburger `<Menu>` button that calls `onMenuToggle`.
- **Real user info in sidebar footer**: uses `useAuth()` to show actual name/email and a logout button.
- **Real user initials in header avatar**: uses `useAuth()` to compute initials.
- **Login form no longer pre-fills credentials** (was `admin@school.edu` / `admin123`).
- **Finance print report**: `printFinanceReport()` function added; "طباعة" button next to "تصدير CSV".
- **Security info card** in settings shows JWT_SECRET reminder.

**How to apply:** Keep the global middleware in place. Any new API endpoint that should be public must be explicitly added to `PUBLIC_API_PATHS` in `server/index.ts`.
