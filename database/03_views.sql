-- =============================================================
-- Claim Survey Management Database: views
-- Saved queries the app reads from, so names are typed only once.
-- =============================================================

USE mangaldeep_claims;

-- One row per claim with every related name and money figure.
CREATE OR REPLACE VIEW v_claim_overview AS
SELECT
  c.claim_id,
  c.loss_type,
  c.claimed_amount,
  c.status,
  i.insurer_id,
  i.insurer_name,
  cl.client_id,
  cl.client_name,
  s.surveyor_id,
  s.surveyor_name,
  COUNT(v.visit_id)                         AS visit_count,
  MAX(v.visit_date)                         AS last_visit,
  inv.invoice_id,
  inv.fee_amount,
  inv.amount_paid,
  inv.fee_amount - inv.amount_paid          AS balance_due
FROM claim c
JOIN insurer  i   ON i.insurer_id   = c.insurer_id
JOIN client   cl  ON cl.client_id   = c.client_id
JOIN surveyor s   ON s.surveyor_id  = c.surveyor_id
LEFT JOIN site_visit v   ON v.claim_id   = c.claim_id
LEFT JOIN invoice    inv ON inv.claim_id = c.claim_id
GROUP BY
  c.claim_id, c.loss_type, c.claimed_amount, c.status,
  i.insurer_id, i.insurer_name, cl.client_id, cl.client_name,
  s.surveyor_id, s.surveyor_name,
  inv.invoice_id, inv.fee_amount, inv.amount_paid;

-- Every invoice that still has money owing.
CREATE OR REPLACE VIEW v_unpaid_invoices AS
SELECT
  inv.invoice_id,
  inv.claim_id,
  i.insurer_name,
  cl.client_name,
  inv.fee_amount,
  inv.amount_paid,
  inv.fee_amount - inv.amount_paid AS balance_due,
  CASE
    WHEN inv.amount_paid = 0 THEN 'Unpaid'
    ELSE 'Part paid'
  END AS payment_status
FROM invoice inv
JOIN claim   c  ON c.claim_id   = inv.claim_id
JOIN insurer i  ON i.insurer_id = c.insurer_id
JOIN client  cl ON cl.client_id = c.client_id
WHERE inv.amount_paid < inv.fee_amount;
