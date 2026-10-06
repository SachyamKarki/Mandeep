# Claim Survey Management Database

DATA 210 project for **Mangaldeep Consulting Pvt. Ltd.**, an insurance surveyor in Bagbazar, Kathmandu.
Team: Shaksham Karki, Bikram Timalsina, Rosis KC.

A MySQL database replaces the shared Excel sheet. A Next.js app on top lets staff sign in, manage claims and see the SQL behind every screen.
All claim data is made-up dummy data.

See [CHANGELOG.md](CHANGELOG.md) for what changed in each release.

## Project structure

```
database/            SQL files, run in order by npm run db:setup (01-04), plus reports and roles
docs/presentation/   the project slides (PDF and PowerPoint)
scripts/db-setup.mjs builds the database from /database
src/
  app/               pages only (Next.js App Router)
    (app)/           signed-in pages: dashboard, claims, site visits, invoices, directory, users, audit, docs
    (auth)/          sign-in page and first-run administrator page
  actions/           server actions, one file per feature (claims, visits, invoices, directory, users, ...)
    shared.ts        form validation helpers and error messages used by every action
  components/
    ui/              shared building blocks: buttons, cards, tables, pagination, toolbar, modals, toasts
    layout/          the sidebar and page frame
    claims/ visits/ invoices/ directory/ audit/ auth/   pieces used by one feature
  hooks/             React hooks (form submission with toasts)
  lib/
    queries/         every SQL query, one file per feature
    env.ts           settings read from .env.local
    db.ts            MySQL connection pool and transactions
    auth.ts          passwords, sessions and access checks
    validation.ts    the validation rules shared by forms and server actions
  proxy.ts           sends signed-out visitors to the login page
```

Secrets live only in `.env.local`, which git ignores. `.env.example` lists every setting.

## Database (`/database`)

| File | What it does |
| --- | --- |
| `01_schema.sql` | Creates `mangaldeep_claims`: the 6 ERD tables (keys, `UNIQUE`, `CHECK`, `ENUM`) plus the login tables `app_user` (one admin, enforced by `uq_one_admin`) and `user_session` |
| `02_seed.sql` | Dummy data: 6 insurers, 14 clients, 6 surveyors, 30 claims, 43 site visits, 19 invoices (118 rows) |
| `03_views.sql` | `v_claim_overview` and `v_unpaid_invoices` |
| `04_audit.sql` | `audit_log` table and 21 triggers that record every insert, edit and delete as JSON, with who did it |
| `05_queries.sql` | 13 report queries: JOINs, GROUP BY / HAVING, subqueries, CTEs, window functions, JSON |
| `06_access.sql` | MySQL roles: `mcs_read`, `mcs_staff` (no deletes), `mcs_admin` (deletes, logins). `audit_log` is read-only for everyone but the schema owner |
| `benchmark_practice.sql` | 28 read-only practice queries to run one at a time in MySQL Workbench (the last one needs the admin account) |

### Database accounts

| Account | Role | Used for |
| --- | --- | --- |
| `mcs_owner` | all privileges on `mangaldeep_claims` | `npm run db:setup` (`DB_SETUP_USER`); owns the views and triggers |
| `mcs_app` | `mcs_admin` | the Next.js app (`DB_USER`); the app decides what staff vs admin users may do |
| `wb_admin` / `wb_staff` | `mcs_admin` / `mcs_staff` | the administrator and staff working in MySQL Workbench |

Create the roles once as root with `06_access.sql` after the first `npm run db:setup`, then create the accounts (see the end of that file). MySQL keeps the grants when `db:setup` rebuilds the tables.

Relationships: insurer, client and surveyor each have 1 to many claims. A claim has 1 to many site visits and 1 invoice (`UNIQUE (claim_id)` on `invoice`).

## Run it

1. Copy `.env.example` to `.env.local` and fill in the MySQL accounts and passwords (see **Database accounts**).
2. **Once per MySQL server**, allow the audit triggers. Binary logging is on by default in MySQL 8, so a non-root user cannot create triggers without this. It asks for the MySQL **root** password:

   ```bash
   mysql -u root -p -e "SET PERSIST log_bin_trust_function_creators = 1;"
   ```

3. Build the database. This resets all claim data, but keeps login accounts:

   ```bash
   npm run db:setup
   ```

4. Start the app and open http://localhost:3000:

   ```bash
   npm run dev
   ```

5. The first visit asks you to create the administrator account. After that, the administrator adds staff from **Users**.

## Signing in

- Passwords are stored as scrypt hashes. Sessions are random tokens in an httpOnly cookie, and the database keeps only their SHA-256 hash.
- "Remember this device" keeps you signed in for 30 days; otherwise the session ends when the browser closes (or after 12 hours).
- 5 wrong passwords lock the account for 15 minutes.
- One **administrator** (the first account, created on a new install) manages the system: deletes records and manages users.
- Everyone else is **staff**: they can add and edit records. Only the administrator can create accounts, on the Users page; there is no self sign-up.
- MySQL enforces the single administrator: `app_user.admin_slot` has a UNIQUE key.
- Every page and every server action checks the session, not just the redirect in `src/proxy.ts`.

## App pages

- **Dashboard**: headline figures, shortcuts, the latest open claims and unpaid fees, claims by loss type
- **Claims**: search (claim no., client, insurer), filter by status, loss type and possible duplicates (same client, insurer and loss type, flagged on the list and on the claim), add, edit and delete. On each claim: site visits, status, invoice, payments and the claim's change history
- **Site visits**: every visit across all claims, with search, a claim-status filter and Add visit
- **Invoices**: fees billed, collected and owed, with search and a Paid / Part paid / Unpaid filter
- **Directory**: tabs for insurers, clients and surveyors, with search and a "used on claims" filter. Deleting is blocked while claims still use the record
- **Audit Trail**: every change, filterable by record type, change and person. Staff do not see login-account changes
- **Users** (administrator only): add staff, edit, switch off, reset passwords
- **Documentation** (administrator only): the schema, access and roles, how the audit trail works, the SQL behind every screen, and the 13 reports from `05_queries.sql` run live
- **My account**: change password, sign out other devices

Adding and editing happens in modal dialogs. Every list has pagination (10 per page), and every save shows a toast (green on success, red on failure).

## Validation

Every rule is checked in the browser and again on the server (`src/lib/validation.ts`), and MySQL's own constraints are the last line of defence:

- Names 2–120 characters; Nepali phone numbers (`98XXXXXXXX` or `01-4412345`); licence numbers like `NIA-SV-1042`
- Amounts above 0 with at most 2 decimals; a payment can never exceed the balance due
- Visit dates cannot be in the future; findings 5–2000 characters
- Closed claims cannot get new visits or invoices

All writes use parameterised `?` queries in a transaction, and every change is written to the audit trail.

## Backup and restore

Back up (as the schema owner, so the triggers and views are included):

```bash
mysqldump -u mcs_owner -p --no-tablespaces --routines --triggers --single-transaction mangaldeep_claims > backup.sql
```

Restore into an empty `mangaldeep_claims` database:

```bash
mysql -u root -p mangaldeep_claims < backup.sql
```

`npm run db:setup` creates the triggers one statement at a time; sent as one batch, MySQL keeps a trailing `;` in each trigger body and the backup would not restore.
