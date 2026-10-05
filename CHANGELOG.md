# Changelog

## 2026-10-05: production-ready release

### Access and security
- One administrator, everyone else is staff. MySQL enforces it with a UNIQUE key on `app_user.admin_slot`.
- No self sign-up: only the administrator creates accounts (Users page). The sign-up page is used once, on a new install, to create the administrator.
- MySQL roles in `database/06_access.sql`: `mcs_read`, `mcs_staff` (no deletes), `mcs_admin`. Separate accounts for the schema owner (`mcs_owner`), the app (`mcs_app`) and Workbench (`wb_admin`, `wb_staff`). Only the schema owner can change `audit_log`.
- All settings and passwords come from `.env.local` (ignored by git); `.env.example` lists them. The app stops with a clear message if a setting is missing.

### Features
- Site visits page, with search, a claim-status filter and Add visit.
- Possible duplicate claims (same client, insurer and loss type) flagged on the Claims list and on the claim page.
- Documentation page (administrator only): schema, access and roles, audit trail, the SQL behind every screen and the 13 reports.
- Directory split into tabs (Insurers, Clients, Surveyors).

### Interface
- Add and edit in modal dialogs; tables have an Actions column with Edit (and Payment on invoices).
- Search and filters in a toolbar inside every table; pagination (10 per page) on every list.
- Toasts for every save: green on success, red on failure.
- Loading skeletons, responsive layout (tables become cards on phones), status shown as coloured text.
- Validation in the browser and again on the server (`src/lib/validation.ts`).

### Fixes
- Audit triggers are created one statement at a time by `npm run db:setup`. Sent as one batch, MySQL kept a trailing `;` in each trigger body and mysqldump backups failed to restore.
- Pages no longer overflow on tablets; table columns line up.

### Code structure
- Server actions split by feature into `src/actions/`; SQL queries split by feature into `src/lib/queries/`.
- Components grouped into `ui/`, `layout/` and one folder per feature.
- Removed unused files: Create Next App images in `public/`, the old `/claims/new` and `/setup` pages, the test script, the old database backup file and the HTML slide draft (backups are made with mysqldump; see the README).
- Slides moved to `docs/presentation/`.
