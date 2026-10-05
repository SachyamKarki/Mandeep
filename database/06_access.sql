-- =============================================================
-- Claim Survey Management Database: access control
-- MySQL roles that mirror the app's roles and the ER diagram.
-- Run once as root AFTER 01-04 (table grants need the tables to exist).
-- Grants are kept by MySQL when npm run db:setup rebuilds the tables.
--
--   mcs_read   building block: read the six ERD tables and the two report views
--   mcs_staff  mcs_read + add and edit claims, visits, invoices,
--              insurers, clients, surveyors; read the audit trail
--   mcs_admin  mcs_staff + delete records and manage login accounts
--
-- Nobody but the schema owner can change audit_log: the triggers
-- write to it with the owner's rights, so the trail cannot be edited
-- or deleted from the app or from Workbench.
--
-- Accounts (passwords are set when the accounts are created, not here):
--   mcs_owner  builds the schema (npm run db:setup); owns views and triggers
--   mcs_app    the Next.js app; gets mcs_admin, the app itself
--              decides what staff vs admin users may do
--   wb_admin   the one administrator, working in MySQL Workbench
--   wb_staff   staff working in MySQL Workbench (no deletes)
--
-- One administrator, everyone else staff: app_user.admin_slot (01_schema.sql)
-- has a UNIQUE key, so MySQL rejects a second admin account.
-- =============================================================

CREATE ROLE IF NOT EXISTS mcs_read, mcs_staff, mcs_admin;

-- ---------- mcs_read: business data only (no logins, no password hashes) ----------
GRANT SELECT ON mangaldeep_claims.insurer           TO mcs_read;
GRANT SELECT ON mangaldeep_claims.client            TO mcs_read;
GRANT SELECT ON mangaldeep_claims.surveyor          TO mcs_read;
GRANT SELECT ON mangaldeep_claims.claim             TO mcs_read;
GRANT SELECT ON mangaldeep_claims.site_visit        TO mcs_read;
GRANT SELECT ON mangaldeep_claims.invoice           TO mcs_read;
GRANT SELECT ON mangaldeep_claims.v_claim_overview  TO mcs_read;
GRANT SELECT ON mangaldeep_claims.v_unpaid_invoices TO mcs_read;

-- ---------- mcs_staff: add and edit, never delete ----------
GRANT mcs_read TO mcs_staff;
GRANT INSERT, UPDATE ON mangaldeep_claims.insurer    TO mcs_staff;
GRANT INSERT, UPDATE ON mangaldeep_claims.client     TO mcs_staff;
GRANT INSERT, UPDATE ON mangaldeep_claims.surveyor   TO mcs_staff;
GRANT INSERT, UPDATE ON mangaldeep_claims.claim      TO mcs_staff;
GRANT INSERT, UPDATE ON mangaldeep_claims.site_visit TO mcs_staff;
GRANT INSERT, UPDATE ON mangaldeep_claims.invoice    TO mcs_staff;
GRANT SELECT         ON mangaldeep_claims.audit_log  TO mcs_staff;

-- ---------- mcs_admin: delete records, manage logins ----------
GRANT mcs_staff TO mcs_admin;
GRANT DELETE ON mangaldeep_claims.insurer    TO mcs_admin;
GRANT DELETE ON mangaldeep_claims.client     TO mcs_admin;
GRANT DELETE ON mangaldeep_claims.surveyor   TO mcs_admin;
GRANT DELETE ON mangaldeep_claims.claim      TO mcs_admin;
GRANT DELETE ON mangaldeep_claims.site_visit TO mcs_admin;
GRANT DELETE ON mangaldeep_claims.invoice    TO mcs_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON mangaldeep_claims.app_user     TO mcs_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON mangaldeep_claims.user_session TO mcs_admin;
GRANT SHOW VIEW ON mangaldeep_claims.* TO mcs_admin;

-- ---------- accounts ----------
-- Create each account first, for example:
--   CREATE USER 'wb_staff'@'localhost' IDENTIFIED BY '<password>';
-- then give it its role:
--   GRANT ALL PRIVILEGES ON mangaldeep_claims.* TO 'mcs_owner'@'localhost';
--   GRANT mcs_admin TO 'mcs_app'@'localhost';   SET DEFAULT ROLE mcs_admin TO 'mcs_app'@'localhost';
--   GRANT mcs_admin TO 'wb_admin'@'localhost';  SET DEFAULT ROLE mcs_admin TO 'wb_admin'@'localhost';
--   GRANT mcs_staff TO 'wb_staff'@'localhost';  SET DEFAULT ROLE mcs_staff TO 'wb_staff'@'localhost';
