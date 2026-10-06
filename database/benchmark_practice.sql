-- DATA 210 benchmark practice queries
-- Open this file in MySQL Workbench and run one query at a time.
-- These are read-only SELECT queries; they do not insert, update, or delete data.

USE mangaldeep_claims;

-- 1. Open claims: join claims to their insurer, client, and surveyor.
SELECT
  c.claim_id,
  i.insurer_name,
  cl.client_name,
  s.surveyor_name,
  c.loss_type,
  c.claimed_amount,
  c.status
FROM claim c
JOIN insurer i ON i.insurer_id = c.insurer_id
JOIN client cl ON cl.client_id = c.client_id
JOIN surveyor s ON s.surveyor_id = c.surveyor_id
WHERE c.status <> 'Closed'
ORDER BY c.claim_id;

-- 2. Unpaid fees: use the v_unpaid_invoices view to show balances still owing.
SELECT
  invoice_id,
  claim_id,
  insurer_name,
  fee_amount,
  amount_paid,
  balance_due,
  payment_status
FROM v_unpaid_invoices
ORDER BY balance_due DESC;

-- 3. Claims by loss type: count claims and summarize claimed amounts.
SELECT
  loss_type,
  COUNT(*) AS total_claims,
  SUM(claimed_amount) AS total_claimed,
  ROUND(AVG(claimed_amount), 2) AS average_claim
FROM claim
GROUP BY loss_type
ORDER BY total_claimed DESC;

-- 4. Claims by status: count how many claims are in each status.
SELECT
  status,
  COUNT(*) AS total_claims
FROM claim
GROUP BY status
ORDER BY total_claims DESC;

-- 5. Surveyor workload: LEFT JOIN keeps surveyors with no assigned claims.
SELECT
  s.surveyor_name,
  s.licence_no,
  COUNT(c.claim_id) AS claims_assigned
FROM surveyor s
LEFT JOIN claim c ON c.surveyor_id = s.surveyor_id
GROUP BY s.surveyor_id, s.surveyor_name, s.licence_no
ORDER BY claims_assigned DESC;

-- 6. Fees by insurer: total billed, collected, and outstanding.
-- HAVING filters the grouped results to insurers with a balance due.
SELECT
  i.insurer_name,
  COUNT(inv.invoice_id) AS invoices,
  SUM(inv.fee_amount) AS fees_billed,
  SUM(inv.amount_paid) AS fees_collected,
  SUM(inv.fee_amount - inv.amount_paid) AS outstanding
FROM insurer i
JOIN claim c ON c.insurer_id = i.insurer_id
JOIN invoice inv ON inv.claim_id = c.claim_id
GROUP BY i.insurer_id, i.insurer_name
HAVING SUM(inv.fee_amount - inv.amount_paid) > 0
ORDER BY outstanding DESC;

-- 7. Claims with no site visit: NOT EXISTS finds claims with no matching visit.
SELECT
  c.claim_id,
  cl.client_name,
  c.loss_type,
  c.claimed_amount,
  c.status
FROM claim c
JOIN client cl ON cl.client_id = c.client_id
WHERE NOT EXISTS (
  SELECT 1
  FROM site_visit v
  WHERE v.claim_id = c.claim_id
)
ORDER BY c.claimed_amount DESC;

-- 8. Claims above the average amount: compare each claim with a scalar subquery.
SELECT
  c.claim_id,
  cl.client_name,
  c.loss_type,
  c.claimed_amount
FROM claim c
JOIN client cl ON cl.client_id = c.client_id
WHERE c.claimed_amount > (
  SELECT AVG(claimed_amount)
  FROM claim
)
ORDER BY c.claimed_amount DESC;

-- 9. Latest site visit per claim that has at least one visit.
SELECT
  claim_id,
  COUNT(*) AS visits,
  MAX(visit_date) AS latest_visit
FROM site_visit
GROUP BY claim_id
ORDER BY latest_visit DESC;

-- 10. Site visits per calendar month, keeping different years separate.
SELECT
  YEAR(visit_date) AS visit_year,
  MONTH(visit_date) AS visit_month,
  COUNT(*) AS visits
FROM site_visit
GROUP BY YEAR(visit_date), MONTH(visit_date)
ORDER BY visit_year, visit_month;

-- 11. Claims for one surveyor: change the name to practise a different filter.
SELECT
  c.claim_id,
  cl.client_name,
  c.loss_type,
  c.claimed_amount,
  c.status
FROM claim c
JOIN surveyor s ON s.surveyor_id = c.surveyor_id
JOIN client cl ON cl.client_id = c.client_id
WHERE s.surveyor_name = 'Bijay Rai'
ORDER BY c.claim_id;

-- 12. Possible duplicate claims: same client, insurer, and loss type.
SELECT
  cl.client_name,
  i.insurer_name,
  c.loss_type,
  COUNT(*) AS times_entered
FROM claim c
JOIN client cl ON cl.client_id = c.client_id
JOIN insurer i ON i.insurer_id = c.insurer_id
GROUP BY cl.client_name, i.insurer_name, c.loss_type
HAVING COUNT(*) > 1
ORDER BY times_entered DESC;

-- 13. Changes per person and action, from the trigger-maintained audit trail.
SELECT
  changed_by,
  action,
  COUNT(*) AS changes
FROM audit_log
GROUP BY changed_by, action
ORDER BY changed_by, action;

-- ============================================================
-- Additional read-only examples from the app's Documentation page
-- Parameter markers from app code are replaced with sample claim/insurer IDs.
-- These remain SELECT queries; write operations are intentionally not included.
-- ============================================================

-- 14. Dashboard figures: scalar subqueries return one row of summary values.
SELECT
  (SELECT COUNT(*) FROM claim WHERE status <> 'Closed') AS open_claims,
  (SELECT COUNT(*) FROM claim) AS total_claims,
  (SELECT COALESCE(SUM(claimed_amount), 0)
   FROM claim WHERE status <> 'Closed') AS open_value,
  (SELECT COALESCE(SUM(fee_amount), 0) FROM invoice) AS fees_billed,
  (SELECT COALESCE(SUM(fee_amount - amount_paid), 0)
   FROM invoice) AS fees_outstanding;

-- 15. Open claims with visit information, using the claim overview view.
SELECT
  claim_id,
  client_name,
  insurer_name,
  loss_type,
  claimed_amount,
  status,
  visit_count,
  last_visit
FROM v_claim_overview
WHERE status <> 'Closed'
ORDER BY claim_id DESC;

-- 16. All invoices with client, insurer, and balance information.
SELECT
  claim_id,
  invoice_id,
  client_name,
  insurer_name,
  fee_amount,
  amount_paid,
  balance_due,
  status
FROM v_claim_overview
WHERE invoice_id IS NOT NULL
ORDER BY balance_due DESC, claim_id DESC;

-- 17. List insurers and claim counts; LEFT JOIN retains insurers with no claims.
SELECT
  i.insurer_id,
  i.insurer_name,
  i.phone,
  COUNT(c.claim_id) AS claims
FROM insurer i
LEFT JOIN claim c ON c.insurer_id = i.insurer_id
GROUP BY i.insurer_id, i.insurer_name, i.phone
ORDER BY i.insurer_name;

-- 18. List clients and claim counts; LEFT JOIN retains clients with no claims.
SELECT
  cl.client_id,
  cl.client_name,
  cl.phone,
  COUNT(c.claim_id) AS claims
FROM client cl
LEFT JOIN claim c ON c.client_id = cl.client_id
GROUP BY cl.client_id, cl.client_name, cl.phone
ORDER BY cl.client_name;

-- 19. All site visits with the claim, client, and assigned surveyor details.
SELECT
  v.visit_id,
  v.claim_id,
  v.visit_date,
  v.findings,
  cl.client_name,
  s.surveyor_name,
  c.loss_type,
  c.status
FROM site_visit v
JOIN claim c ON c.claim_id = v.claim_id
JOIN client cl ON cl.client_id = c.client_id
JOIN surveyor s ON s.surveyor_id = c.surveyor_id
ORDER BY v.visit_date DESC, v.visit_id DESC;

-- 20. One claim's details from the claim overview view; change 1 to another claim ID.
SELECT *
FROM v_claim_overview
WHERE claim_id = 1;

-- 21. Visits for one claim; change 1 to another claim ID.
SELECT
  visit_id,
  claim_id,
  visit_date,
  findings
FROM site_visit
WHERE claim_id = 1
ORDER BY visit_date DESC, visit_id DESC;

-- 22. Claims linked to one insurer; change 1 to another insurer ID.
SELECT
  claim_id,
  client_name,
  insurer_name,
  surveyor_name,
  loss_type,
  claimed_amount,
  status
FROM v_claim_overview
WHERE insurer_id = 1
ORDER BY claim_id DESC;

-- 23. Recent audit entries. Audit rows can contain before/after business data.
SELECT
  audit_id,
  table_name,
  record_id,
  action,
  changed_by,
  changed_at,
  old_data,
  new_data
FROM audit_log
ORDER BY audit_id DESC
LIMIT 200;

-- 24. Table columns and foreign-key references for the six business tables.
SELECT
  c.TABLE_NAME,
  c.COLUMN_NAME,
  c.COLUMN_TYPE,
  c.IS_NULLABLE,
  c.COLUMN_KEY,
  k.REFERENCED_TABLE_NAME
FROM information_schema.COLUMNS c
LEFT JOIN information_schema.KEY_COLUMN_USAGE k
  ON k.TABLE_SCHEMA = c.TABLE_SCHEMA
  AND k.TABLE_NAME = c.TABLE_NAME
  AND k.COLUMN_NAME = c.COLUMN_NAME
  AND k.REFERENCED_TABLE_NAME IS NOT NULL
WHERE c.TABLE_SCHEMA = DATABASE()
  AND c.TABLE_NAME IN ('insurer', 'client', 'surveyor', 'claim', 'site_visit', 'invoice')
ORDER BY FIELD(
  c.TABLE_NAME,
  'insurer', 'client', 'surveyor', 'claim', 'site_visit', 'invoice'
), c.ORDINAL_POSITION;

-- ============================================================
-- Remaining SQL examples shown on the app's Documentation page
-- ============================================================

-- 25. The Claims screen's unfiltered list query, using the overview view.
SELECT *
FROM v_claim_overview
ORDER BY claim_id DESC;

-- 26. The Directory screen's surveyor list with claim counts.
SELECT
  s.surveyor_id,
  s.surveyor_name,
  s.licence_no,
  COUNT(c.claim_id) AS claims
FROM surveyor s
LEFT JOIN claim c ON c.surveyor_id = s.surveyor_id
GROUP BY s.surveyor_id, s.surveyor_name, s.licence_no
ORDER BY s.surveyor_name;

-- 27. Change history for one claim and its visits/invoice; change 1 as needed.
SELECT
  audit_id,
  table_name,
  record_id,
  action,
  changed_by,
  changed_at,
  old_data,
  new_data
FROM audit_log
WHERE (table_name = 'claim' AND record_id = 1)
   OR (table_name IN ('site_visit', 'invoice')
       AND COALESCE(
         new_data ->> '$.claim_id',
         old_data ->> '$.claim_id'
       ) = '1')
ORDER BY audit_id DESC;

-- 28. Admin-only user-management screen query.
-- This shows account details, but never password hashes or session tokens.
SELECT
  u.user_id,
  u.full_name,
  u.email,
  u.role,
  u.is_active,
  COALESCE(u.locked_until > NOW(), 0) AS locked,
  u.last_login_at,
  u.created_at,
  COUNT(s.token_hash) AS sessions
FROM app_user u
LEFT JOIN user_session s
  ON s.user_id = u.user_id
  AND s.expires_at > NOW()
GROUP BY u.user_id
ORDER BY u.role = 'admin' DESC, u.is_active DESC, u.full_name;

