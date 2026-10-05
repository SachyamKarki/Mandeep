# Claim Survey Management Database

DATA 210 project for **Mangaldeep Consulting Pvt. Ltd.**, an insurance surveyor in Bagbazar, Kathmandu.
Team: Shaksham Karki, Bikram Timalsina, Rosis KC.

A MySQL database replaces the shared Excel sheet. A Next.js app on top lets staff sign in, manage claims and see the SQL behind every screen.
All claim data is made-up dummy data.

## Database (`/database`)

| File | What it does |
| --- | --- |
| `01_schema.sql` | Creates `mangaldeep_claims`: the 6 ERD tables (keys, `UNIQUE`, `CHECK`, `ENUM`) plus the login tables `app_user` and `user_session` |
| `02_seed.sql` | Dummy data: 5 insurers, 8 clients, 4 surveyors, 15 claims, 19 site visits, 8 invoices |
| `03_views.sql` | `v_claim_overview` and `v_unpaid_invoices` |
| `04_audit.sql` | `audit_log` table and 21 triggers that record every insert, edit and delete as JSON, with who did it |
| `05_queries.sql` | 13 report queries: JOINs, GROUP BY / HAVING, subqueries, CTEs, window functions, JSON |

Relationships: insurer, client and surveyor each have 1 to many claims. A claim has 1 to many site visits and 1 invoice (`UNIQUE (claim_id)` on `invoice`).

## Run it

1. Copy `.env.example` to `.env.local` and fill in your MySQL user and password.
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

5. The first visit opens **Set up**, where you create the first administrator. After that, add the team from **Users**.

## Signing in

- Passwords are stored as scrypt hashes. Sessions are random tokens in an httpOnly cookie, and the database keeps only their SHA-256 hash.
- "Remember this device" keeps you signed in for 30 days; otherwise the session ends when the browser closes (or after 12 hours).
- 5 wrong passwords lock the account for 15 minutes.
- Roles: **staff** can add and edit records. **Admins** can also delete records and manage users.
- Anyone can request an account at `/register`. It stays switched off until an admin approves it on the Users page.
- Every page and every server action checks the session, not just the redirect in `src/proxy.ts`.

## App pages

- **Dashboard**: open claims, unpaid fees, claims by loss type
- **Claims**: search, filter, add, edit and delete claims. On each claim: site visits, status, invoice, payments, and the claim's change history
- **Invoices**: fees billed, collected and still owed
- **Directory**: add, edit and delete insurers, clients and surveyors. Deleting is blocked while claims still use the record
- **Audit Trail**: every change, filterable by table, action, person and record ID
- **SQL Showcase**: the schema from `information_schema` and every query in `05_queries.sql`, run live
- **Users** (admins) and **My account** (change password, signed-in devices)

Every table has a **View SQL** link that shows the exact query behind it. All writes use parameterised `?` queries in a transaction.
