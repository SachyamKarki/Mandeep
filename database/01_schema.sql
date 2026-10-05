-- =============================================================
-- Claim Survey Management Database: schema
-- Mangaldeep Consulting Pvt. Ltd. · DATA 210
-- Six tables, matching the ER diagram exactly.
-- =============================================================

DROP DATABASE IF EXISTS mangaldeep_claims;
CREATE DATABASE mangaldeep_claims
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE mangaldeep_claims;

-- -------------------------------------------------------------
-- Parent tables (the "1" side)
-- -------------------------------------------------------------

CREATE TABLE insurer (
  insurer_id    INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  insurer_name  VARCHAR(120)  NOT NULL,
  phone         VARCHAR(20)   NOT NULL,
  PRIMARY KEY (insurer_id),
  UNIQUE KEY uq_insurer_name (insurer_name)
) ENGINE = InnoDB;

CREATE TABLE client (
  client_id    INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  client_name  VARCHAR(120)  NOT NULL,
  phone        VARCHAR(20)   NOT NULL,
  PRIMARY KEY (client_id)
) ENGINE = InnoDB;

CREATE TABLE surveyor (
  surveyor_id    INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  surveyor_name  VARCHAR(120)  NOT NULL,
  licence_no     VARCHAR(30)   NOT NULL,
  PRIMARY KEY (surveyor_id),
  UNIQUE KEY uq_surveyor_licence (licence_no)
) ENGINE = InnoDB;

-- -------------------------------------------------------------
-- CLAIM: one row per claim, linked to insurer, client, surveyor
-- -------------------------------------------------------------

CREATE TABLE claim (
  claim_id        INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  insurer_id      INT UNSIGNED   NOT NULL,
  client_id       INT UNSIGNED   NOT NULL,
  surveyor_id     INT UNSIGNED   NOT NULL,
  loss_type       ENUM('Marine', 'Motor', 'Industrial') NOT NULL,
  claimed_amount  DECIMAL(12, 2) NOT NULL,
  status          ENUM('Open', 'Surveyed', 'Closed') NOT NULL DEFAULT 'Open',
  PRIMARY KEY (claim_id),
  KEY idx_claim_status (status),
  CONSTRAINT chk_claim_amount CHECK (claimed_amount > 0),
  CONSTRAINT fk_claim_insurer  FOREIGN KEY (insurer_id)
    REFERENCES insurer (insurer_id)   ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_claim_client   FOREIGN KEY (client_id)
    REFERENCES client (client_id)     ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_claim_surveyor FOREIGN KEY (surveyor_id)
    REFERENCES surveyor (surveyor_id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE = InnoDB;

-- -------------------------------------------------------------
-- Child tables of CLAIM
-- -------------------------------------------------------------

-- 1 claim -> many site visits
CREATE TABLE site_visit (
  visit_id    INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  claim_id    INT UNSIGNED  NOT NULL,
  visit_date  DATE          NOT NULL,
  findings    TEXT          NOT NULL,
  PRIMARY KEY (visit_id),
  KEY idx_visit_claim_date (claim_id, visit_date),
  CONSTRAINT fk_visit_claim FOREIGN KEY (claim_id)
    REFERENCES claim (claim_id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE = InnoDB;

-- 1 claim -> 1 invoice (UNIQUE on claim_id enforces the 1 to 1)
CREATE TABLE invoice (
  invoice_id   INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  claim_id     INT UNSIGNED   NOT NULL,
  fee_amount   DECIMAL(10, 2) NOT NULL,
  amount_paid  DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (invoice_id),
  UNIQUE KEY uq_invoice_claim (claim_id),
  CONSTRAINT chk_invoice_fee  CHECK (fee_amount > 0),
  CONSTRAINT chk_invoice_paid CHECK (amount_paid >= 0 AND amount_paid <= fee_amount),
  CONSTRAINT fk_invoice_claim FOREIGN KEY (claim_id)
    REFERENCES claim (claim_id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE = InnoDB;

-- -------------------------------------------------------------
-- Login tables (support the app; not part of the ER diagram)
-- -------------------------------------------------------------

-- Staff who can sign in. Passwords are stored only as scrypt hashes.
CREATE TABLE app_user (
  user_id              INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  full_name            VARCHAR(100)  NOT NULL,
  email                VARCHAR(190)  NOT NULL,
  password_hash        VARCHAR(255)  NOT NULL,
  role                 ENUM('admin', 'staff') NOT NULL DEFAULT 'staff',
  is_active            BOOLEAN       NOT NULL DEFAULT TRUE,
  failed_logins        TINYINT UNSIGNED NOT NULL DEFAULT 0,
  locked_until         DATETIME      NULL,
  password_changed_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at        DATETIME      NULL,
  created_at           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_user_email (email)
) ENGINE = InnoDB;

-- One row per signed-in browser. Only a SHA-256 hash of the cookie token is kept,
-- so a leaked table cannot be used to sign in.
CREATE TABLE user_session (
  token_hash  CHAR(64)      NOT NULL,
  user_id     INT UNSIGNED  NOT NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at  DATETIME      NOT NULL,
  user_agent  VARCHAR(255)  NULL,
  PRIMARY KEY (token_hash),
  KEY idx_session_user (user_id),
  KEY idx_session_expiry (expires_at),
  CONSTRAINT fk_session_user FOREIGN KEY (user_id)
    REFERENCES app_user (user_id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE = InnoDB;
