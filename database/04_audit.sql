-- =============================================================
-- Claim Survey Management Database: audit trail
-- One audit_log table, filled by triggers on the six ERD tables and app_user.
-- Every INSERT, UPDATE and DELETE is recorded with the old and new
-- row as JSON, plus who made the change.
--
-- Who: the app runs  SET @app_user = '<name>'  on the same connection
-- before each write. Changes made straight in the mysql client fall
-- back to CURRENT_USER().
--
-- Each trigger is a single statement, so no DELIMITER is needed and
-- this file runs as-is in the mysql client or MySQL Workbench.
--
-- Note: MySQL does not fire triggers for rows removed by ON DELETE
-- CASCADE, so the app deletes a claim's visits and invoice itself
-- (inside one transaction) to keep the log complete.
-- =============================================================

USE mangaldeep_claims;

CREATE TABLE audit_log (
  audit_id    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  table_name  VARCHAR(30)     NOT NULL,
  record_id   INT UNSIGNED    NOT NULL,
  action      ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
  changed_by  VARCHAR(100)    NOT NULL,
  changed_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  old_data    JSON            NULL,
  new_data    JSON            NULL,
  PRIMARY KEY (audit_id),
  KEY idx_audit_record (table_name, record_id),
  KEY idx_audit_time (changed_at)
) ENGINE = InnoDB;

-- ---------- insurer ----------

CREATE TRIGGER trg_insurer_after_insert AFTER INSERT ON insurer
FOR EACH ROW
  INSERT INTO audit_log (table_name, record_id, action, changed_by, new_data)
  VALUES ('insurer', NEW.insurer_id, 'INSERT', COALESCE(@app_user, CURRENT_USER()),
          JSON_OBJECT('insurer_id', NEW.insurer_id, 'insurer_name', NEW.insurer_name, 'phone', NEW.phone));

-- Skips updates that change nothing.
CREATE TRIGGER trg_insurer_after_update AFTER UPDATE ON insurer
FOR EACH ROW
  INSERT INTO audit_log (table_name, record_id, action, changed_by, old_data, new_data)
  SELECT 'insurer', NEW.insurer_id, 'UPDATE', COALESCE(@app_user, CURRENT_USER()),
         JSON_OBJECT('insurer_id', OLD.insurer_id, 'insurer_name', OLD.insurer_name, 'phone', OLD.phone),
         JSON_OBJECT('insurer_id', NEW.insurer_id, 'insurer_name', NEW.insurer_name, 'phone', NEW.phone)
  FROM DUAL
  WHERE JSON_OBJECT('insurer_id', OLD.insurer_id, 'insurer_name', OLD.insurer_name, 'phone', OLD.phone) <> JSON_OBJECT('insurer_id', NEW.insurer_id, 'insurer_name', NEW.insurer_name, 'phone', NEW.phone);

CREATE TRIGGER trg_insurer_after_delete AFTER DELETE ON insurer
FOR EACH ROW
  INSERT INTO audit_log (table_name, record_id, action, changed_by, old_data)
  VALUES ('insurer', OLD.insurer_id, 'DELETE', COALESCE(@app_user, CURRENT_USER()),
          JSON_OBJECT('insurer_id', OLD.insurer_id, 'insurer_name', OLD.insurer_name, 'phone', OLD.phone));

-- ---------- client ----------

CREATE TRIGGER trg_client_after_insert AFTER INSERT ON client
FOR EACH ROW
  INSERT INTO audit_log (table_name, record_id, action, changed_by, new_data)
  VALUES ('client', NEW.client_id, 'INSERT', COALESCE(@app_user, CURRENT_USER()),
          JSON_OBJECT('client_id', NEW.client_id, 'client_name', NEW.client_name, 'phone', NEW.phone));

-- Skips updates that change nothing.
CREATE TRIGGER trg_client_after_update AFTER UPDATE ON client
FOR EACH ROW
  INSERT INTO audit_log (table_name, record_id, action, changed_by, old_data, new_data)
  SELECT 'client', NEW.client_id, 'UPDATE', COALESCE(@app_user, CURRENT_USER()),
         JSON_OBJECT('client_id', OLD.client_id, 'client_name', OLD.client_name, 'phone', OLD.phone),
         JSON_OBJECT('client_id', NEW.client_id, 'client_name', NEW.client_name, 'phone', NEW.phone)
  FROM DUAL
  WHERE JSON_OBJECT('client_id', OLD.client_id, 'client_name', OLD.client_name, 'phone', OLD.phone) <> JSON_OBJECT('client_id', NEW.client_id, 'client_name', NEW.client_name, 'phone', NEW.phone);

CREATE TRIGGER trg_client_after_delete AFTER DELETE ON client
FOR EACH ROW
  INSERT INTO audit_log (table_name, record_id, action, changed_by, old_data)
  VALUES ('client', OLD.client_id, 'DELETE', COALESCE(@app_user, CURRENT_USER()),
          JSON_OBJECT('client_id', OLD.client_id, 'client_name', OLD.client_name, 'phone', OLD.phone));

-- ---------- surveyor ----------

CREATE TRIGGER trg_surveyor_after_insert AFTER INSERT ON surveyor
FOR EACH ROW
  INSERT INTO audit_log (table_name, record_id, action, changed_by, new_data)
  VALUES ('surveyor', NEW.surveyor_id, 'INSERT', COALESCE(@app_user, CURRENT_USER()),
          JSON_OBJECT('surveyor_id', NEW.surveyor_id, 'surveyor_name', NEW.surveyor_name, 'licence_no', NEW.licence_no));

-- Skips updates that change nothing.
CREATE TRIGGER trg_surveyor_after_update AFTER UPDATE ON surveyor
FOR EACH ROW
  INSERT INTO audit_log (table_name, record_id, action, changed_by, old_data, new_data)
  SELECT 'surveyor', NEW.surveyor_id, 'UPDATE', COALESCE(@app_user, CURRENT_USER()),
         JSON_OBJECT('surveyor_id', OLD.surveyor_id, 'surveyor_name', OLD.surveyor_name, 'licence_no', OLD.licence_no),
         JSON_OBJECT('surveyor_id', NEW.surveyor_id, 'surveyor_name', NEW.surveyor_name, 'licence_no', NEW.licence_no)
  FROM DUAL
  WHERE JSON_OBJECT('surveyor_id', OLD.surveyor_id, 'surveyor_name', OLD.surveyor_name, 'licence_no', OLD.licence_no) <> JSON_OBJECT('surveyor_id', NEW.surveyor_id, 'surveyor_name', NEW.surveyor_name, 'licence_no', NEW.licence_no);

CREATE TRIGGER trg_surveyor_after_delete AFTER DELETE ON surveyor
FOR EACH ROW
  INSERT INTO audit_log (table_name, record_id, action, changed_by, old_data)
  VALUES ('surveyor', OLD.surveyor_id, 'DELETE', COALESCE(@app_user, CURRENT_USER()),
          JSON_OBJECT('surveyor_id', OLD.surveyor_id, 'surveyor_name', OLD.surveyor_name, 'licence_no', OLD.licence_no));

-- ---------- claim ----------

CREATE TRIGGER trg_claim_after_insert AFTER INSERT ON claim
FOR EACH ROW
  INSERT INTO audit_log (table_name, record_id, action, changed_by, new_data)
  VALUES ('claim', NEW.claim_id, 'INSERT', COALESCE(@app_user, CURRENT_USER()),
          JSON_OBJECT('claim_id', NEW.claim_id, 'insurer_id', NEW.insurer_id, 'client_id', NEW.client_id, 'surveyor_id', NEW.surveyor_id, 'loss_type', NEW.loss_type, 'claimed_amount', NEW.claimed_amount, 'status', NEW.status));

-- Skips updates that change nothing.
CREATE TRIGGER trg_claim_after_update AFTER UPDATE ON claim
FOR EACH ROW
  INSERT INTO audit_log (table_name, record_id, action, changed_by, old_data, new_data)
  SELECT 'claim', NEW.claim_id, 'UPDATE', COALESCE(@app_user, CURRENT_USER()),
         JSON_OBJECT('claim_id', OLD.claim_id, 'insurer_id', OLD.insurer_id, 'client_id', OLD.client_id, 'surveyor_id', OLD.surveyor_id, 'loss_type', OLD.loss_type, 'claimed_amount', OLD.claimed_amount, 'status', OLD.status),
         JSON_OBJECT('claim_id', NEW.claim_id, 'insurer_id', NEW.insurer_id, 'client_id', NEW.client_id, 'surveyor_id', NEW.surveyor_id, 'loss_type', NEW.loss_type, 'claimed_amount', NEW.claimed_amount, 'status', NEW.status)
  FROM DUAL
  WHERE JSON_OBJECT('claim_id', OLD.claim_id, 'insurer_id', OLD.insurer_id, 'client_id', OLD.client_id, 'surveyor_id', OLD.surveyor_id, 'loss_type', OLD.loss_type, 'claimed_amount', OLD.claimed_amount, 'status', OLD.status) <> JSON_OBJECT('claim_id', NEW.claim_id, 'insurer_id', NEW.insurer_id, 'client_id', NEW.client_id, 'surveyor_id', NEW.surveyor_id, 'loss_type', NEW.loss_type, 'claimed_amount', NEW.claimed_amount, 'status', NEW.status);

CREATE TRIGGER trg_claim_after_delete AFTER DELETE ON claim
FOR EACH ROW
  INSERT INTO audit_log (table_name, record_id, action, changed_by, old_data)
  VALUES ('claim', OLD.claim_id, 'DELETE', COALESCE(@app_user, CURRENT_USER()),
          JSON_OBJECT('claim_id', OLD.claim_id, 'insurer_id', OLD.insurer_id, 'client_id', OLD.client_id, 'surveyor_id', OLD.surveyor_id, 'loss_type', OLD.loss_type, 'claimed_amount', OLD.claimed_amount, 'status', OLD.status));

-- ---------- site_visit ----------

CREATE TRIGGER trg_site_visit_after_insert AFTER INSERT ON site_visit
FOR EACH ROW
  INSERT INTO audit_log (table_name, record_id, action, changed_by, new_data)
  VALUES ('site_visit', NEW.visit_id, 'INSERT', COALESCE(@app_user, CURRENT_USER()),
          JSON_OBJECT('visit_id', NEW.visit_id, 'claim_id', NEW.claim_id, 'visit_date', NEW.visit_date, 'findings', NEW.findings));

-- Skips updates that change nothing.
CREATE TRIGGER trg_site_visit_after_update AFTER UPDATE ON site_visit
FOR EACH ROW
  INSERT INTO audit_log (table_name, record_id, action, changed_by, old_data, new_data)
  SELECT 'site_visit', NEW.visit_id, 'UPDATE', COALESCE(@app_user, CURRENT_USER()),
         JSON_OBJECT('visit_id', OLD.visit_id, 'claim_id', OLD.claim_id, 'visit_date', OLD.visit_date, 'findings', OLD.findings),
         JSON_OBJECT('visit_id', NEW.visit_id, 'claim_id', NEW.claim_id, 'visit_date', NEW.visit_date, 'findings', NEW.findings)
  FROM DUAL
  WHERE JSON_OBJECT('visit_id', OLD.visit_id, 'claim_id', OLD.claim_id, 'visit_date', OLD.visit_date, 'findings', OLD.findings) <> JSON_OBJECT('visit_id', NEW.visit_id, 'claim_id', NEW.claim_id, 'visit_date', NEW.visit_date, 'findings', NEW.findings);

CREATE TRIGGER trg_site_visit_after_delete AFTER DELETE ON site_visit
FOR EACH ROW
  INSERT INTO audit_log (table_name, record_id, action, changed_by, old_data)
  VALUES ('site_visit', OLD.visit_id, 'DELETE', COALESCE(@app_user, CURRENT_USER()),
          JSON_OBJECT('visit_id', OLD.visit_id, 'claim_id', OLD.claim_id, 'visit_date', OLD.visit_date, 'findings', OLD.findings));

-- ---------- invoice ----------

CREATE TRIGGER trg_invoice_after_insert AFTER INSERT ON invoice
FOR EACH ROW
  INSERT INTO audit_log (table_name, record_id, action, changed_by, new_data)
  VALUES ('invoice', NEW.invoice_id, 'INSERT', COALESCE(@app_user, CURRENT_USER()),
          JSON_OBJECT('invoice_id', NEW.invoice_id, 'claim_id', NEW.claim_id, 'fee_amount', NEW.fee_amount, 'amount_paid', NEW.amount_paid));

-- Skips updates that change nothing.
CREATE TRIGGER trg_invoice_after_update AFTER UPDATE ON invoice
FOR EACH ROW
  INSERT INTO audit_log (table_name, record_id, action, changed_by, old_data, new_data)
  SELECT 'invoice', NEW.invoice_id, 'UPDATE', COALESCE(@app_user, CURRENT_USER()),
         JSON_OBJECT('invoice_id', OLD.invoice_id, 'claim_id', OLD.claim_id, 'fee_amount', OLD.fee_amount, 'amount_paid', OLD.amount_paid),
         JSON_OBJECT('invoice_id', NEW.invoice_id, 'claim_id', NEW.claim_id, 'fee_amount', NEW.fee_amount, 'amount_paid', NEW.amount_paid)
  FROM DUAL
  WHERE JSON_OBJECT('invoice_id', OLD.invoice_id, 'claim_id', OLD.claim_id, 'fee_amount', OLD.fee_amount, 'amount_paid', OLD.amount_paid) <> JSON_OBJECT('invoice_id', NEW.invoice_id, 'claim_id', NEW.claim_id, 'fee_amount', NEW.fee_amount, 'amount_paid', NEW.amount_paid);

CREATE TRIGGER trg_invoice_after_delete AFTER DELETE ON invoice
FOR EACH ROW
  INSERT INTO audit_log (table_name, record_id, action, changed_by, old_data)
  VALUES ('invoice', OLD.invoice_id, 'DELETE', COALESCE(@app_user, CURRENT_USER()),
          JSON_OBJECT('invoice_id', OLD.invoice_id, 'claim_id', OLD.claim_id, 'fee_amount', OLD.fee_amount, 'amount_paid', OLD.amount_paid));

-- ---------- app_user ----------
-- password_hash, failed_logins, locked_until and last_login_at are left out on purpose:
-- the hash must never be copied, and sign-ins alone should not flood the log.
-- A password change still shows up through password_changed_at.

CREATE TRIGGER trg_app_user_after_insert AFTER INSERT ON app_user
FOR EACH ROW
  INSERT INTO audit_log (table_name, record_id, action, changed_by, new_data)
  VALUES ('app_user', NEW.user_id, 'INSERT', COALESCE(@app_user, CURRENT_USER()),
          JSON_OBJECT('user_id', NEW.user_id, 'full_name', NEW.full_name, 'email', NEW.email, 'role', NEW.role, 'is_active', NEW.is_active, 'password_changed_at', NEW.password_changed_at));

CREATE TRIGGER trg_app_user_after_update AFTER UPDATE ON app_user
FOR EACH ROW
  INSERT INTO audit_log (table_name, record_id, action, changed_by, old_data, new_data)
  SELECT 'app_user', NEW.user_id, 'UPDATE', COALESCE(@app_user, CURRENT_USER()),
         JSON_OBJECT('user_id', OLD.user_id, 'full_name', OLD.full_name, 'email', OLD.email, 'role', OLD.role, 'is_active', OLD.is_active, 'password_changed_at', OLD.password_changed_at),
         JSON_OBJECT('user_id', NEW.user_id, 'full_name', NEW.full_name, 'email', NEW.email, 'role', NEW.role, 'is_active', NEW.is_active, 'password_changed_at', NEW.password_changed_at)
  FROM DUAL
  WHERE JSON_OBJECT('user_id', OLD.user_id, 'full_name', OLD.full_name, 'email', OLD.email, 'role', OLD.role, 'is_active', OLD.is_active, 'password_changed_at', OLD.password_changed_at) <> JSON_OBJECT('user_id', NEW.user_id, 'full_name', NEW.full_name, 'email', NEW.email, 'role', NEW.role, 'is_active', NEW.is_active, 'password_changed_at', NEW.password_changed_at);

CREATE TRIGGER trg_app_user_after_delete AFTER DELETE ON app_user
FOR EACH ROW
  INSERT INTO audit_log (table_name, record_id, action, changed_by, old_data)
  VALUES ('app_user', OLD.user_id, 'DELETE', COALESCE(@app_user, CURRENT_USER()),
          JSON_OBJECT('user_id', OLD.user_id, 'full_name', OLD.full_name, 'email', OLD.email, 'role', OLD.role, 'is_active', OLD.is_active, 'password_changed_at', OLD.password_changed_at));
