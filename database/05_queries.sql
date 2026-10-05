-- =============================================================
-- Claim Survey Management Database: report queries
-- The app's "SQL Showcase" page runs each query below live.
-- Each query starts with a "-- @title:" line and an "-- @about:" line.
-- =============================================================

USE mangaldeep_claims;

-- @title: Open claims
-- @about: Every claim that is not closed yet, with insurer, client and surveyor names. Uses JOINs across four tables.
SELECT
  c.claim_id,
  i.insurer_name,
  cl.client_name,
  s.surveyor_name,
  c.loss_type,
  c.claimed_amount,
  c.status
FROM claim c
JOIN insurer  i  ON i.insurer_id  = c.insurer_id
JOIN client   cl ON cl.client_id  = c.client_id
JOIN surveyor s  ON s.surveyor_id = c.surveyor_id
WHERE c.status <> 'Closed'
ORDER BY c.claim_id;

-- @title: Unpaid fees
-- @about: Invoices with money still owing, read from the v_unpaid_invoices view.
SELECT invoice_id, claim_id, insurer_name, fee_amount, amount_paid, balance_due, payment_status
FROM v_unpaid_invoices
ORDER BY balance_due DESC;

-- @title: Claims by loss type
-- @about: Number of claims and money claimed for marine, motor and industrial losses. Uses GROUP BY with COUNT, SUM and AVG.
SELECT
  loss_type,
  COUNT(*)                      AS total_claims,
  SUM(claimed_amount)           AS total_claimed,
  ROUND(AVG(claimed_amount), 2) AS average_claim
FROM claim
GROUP BY loss_type
ORDER BY total_claimed DESC;

-- @title: Claims by status
-- @about: How many claims are open, surveyed and closed. Uses GROUP BY with COUNT.
SELECT status, COUNT(*) AS total_claims
FROM claim
GROUP BY status;

-- @title: Surveyor workload
-- @about: How many claims each surveyor has. LEFT JOIN keeps surveyors who have no claims yet.
SELECT
  s.surveyor_name,
  s.licence_no,
  COUNT(c.claim_id) AS claims_assigned
FROM surveyor s
LEFT JOIN claim c ON c.surveyor_id = s.surveyor_id
GROUP BY s.surveyor_id, s.surveyor_name, s.licence_no
ORDER BY claims_assigned DESC;

-- @title: Fees by insurer
-- @about: Fees billed, collected and still owed per insurer. Uses GROUP BY with SUM, and HAVING to keep insurers that still owe money.
SELECT
  i.insurer_name,
  COUNT(inv.invoice_id)                  AS invoices,
  SUM(inv.fee_amount)                    AS fees_billed,
  SUM(inv.amount_paid)                   AS fees_collected,
  SUM(inv.fee_amount - inv.amount_paid)  AS outstanding
FROM insurer i
JOIN claim   c   ON c.insurer_id = i.insurer_id
JOIN invoice inv ON inv.claim_id = c.claim_id
GROUP BY i.insurer_id, i.insurer_name
HAVING SUM(inv.fee_amount - inv.amount_paid) > 0
ORDER BY outstanding DESC;

-- @title: Claims with no site visit yet
-- @about: Claims a surveyor still needs to visit. Uses a NOT IN subquery.
SELECT c.claim_id, cl.client_name, c.loss_type, c.claimed_amount, c.status
FROM claim c
JOIN client cl ON cl.client_id = c.client_id
WHERE c.claim_id NOT IN (SELECT claim_id FROM site_visit)
ORDER BY c.claimed_amount DESC;

-- @title: Claims above the average amount
-- @about: Large claims, found by comparing each claim to the average from a subquery.
SELECT c.claim_id, cl.client_name, c.loss_type, c.claimed_amount
FROM claim c
JOIN client cl ON cl.client_id = c.client_id
WHERE c.claimed_amount > (SELECT AVG(claimed_amount) FROM claim)
ORDER BY c.claimed_amount DESC;

-- @title: Latest site visit per claim
-- @about: The most recent visit date and the number of visits for each claim. Uses GROUP BY with MAX and COUNT.
SELECT
  claim_id,
  COUNT(*)        AS visits,
  MAX(visit_date) AS latest_visit
FROM site_visit
GROUP BY claim_id
ORDER BY latest_visit DESC;

-- @title: Site visits per month
-- @about: How many site visits happened each month. Uses MONTH() with GROUP BY.
SELECT
  MONTH(visit_date) AS visit_month,
  COUNT(*)          AS visits
FROM site_visit
GROUP BY MONTH(visit_date)
ORDER BY visit_month;

-- @title: Claims for one surveyor
-- @about: Every claim handled by one surveyor (Bijay Rai). Uses a JOIN with a WHERE filter.
SELECT c.claim_id, cl.client_name, c.loss_type, c.claimed_amount, c.status
FROM claim c
JOIN surveyor s  ON s.surveyor_id = c.surveyor_id
JOIN client   cl ON cl.client_id  = c.client_id
WHERE s.surveyor_name = 'Bijay Rai'
ORDER BY c.claim_id;

-- @title: Possible duplicate claims
-- @about: The same client, insurer and loss type entered more than once, which the old Excel sheet let happen. Uses GROUP BY with HAVING COUNT(*) > 1.
SELECT
  cl.client_name,
  i.insurer_name,
  c.loss_type,
  COUNT(*) AS times_entered
FROM claim c
JOIN client  cl ON cl.client_id = c.client_id
JOIN insurer i  ON i.insurer_id = c.insurer_id
GROUP BY cl.client_name, i.insurer_name, c.loss_type
HAVING COUNT(*) > 1;

-- @title: Changes per person (audit trail)
-- @about: How many records each person added, edited or deleted, from the audit_log table that the triggers fill. Uses GROUP BY on two columns.
SELECT changed_by, action, COUNT(*) AS changes
FROM audit_log
GROUP BY changed_by, action
ORDER BY changed_by, action;
