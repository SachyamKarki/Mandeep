-- =============================================================
-- Claim Survey Management Database: test cases
-- Run after setup. Tests 1-5 should be REJECTED by MySQL with
-- the error shown. Tests 6-8 should return the expected result.
-- =============================================================

USE mangaldeep_claims;

-- Test 1: claim with a negative amount        -> expect error 3819 (chk_claim_amount)
INSERT INTO claim (insurer_id, client_id, surveyor_id, loss_type, claimed_amount)
VALUES (1, 1, 1, 'Motor', -500);

-- Test 2: claim for an insurer that does not exist  -> expect error 1452 (foreign key)
INSERT INTO claim (insurer_id, client_id, surveyor_id, loss_type, claimed_amount)
VALUES (999, 1, 1, 'Motor', 50000);

-- Test 3: paying more than the fee            -> expect error 3819 (chk_invoice_paid)
UPDATE invoice SET amount_paid = fee_amount + 1 WHERE invoice_id = 3;

-- Test 4: second invoice for the same claim   -> expect error 1062 (uq_invoice_claim)
INSERT INTO invoice (claim_id, fee_amount) VALUES (1, 5000);

-- Test 5: deleting an insurer that has claims -> expect error 1451 (ON DELETE RESTRICT)
DELETE FROM insurer WHERE insurer_id = 1;

-- Test 6: deleting a claim removes its visits and invoice (ON DELETE CASCADE)
--         expect: 0 and 0. ROLLBACK undoes the delete so the data stays.
START TRANSACTION;
DELETE FROM claim WHERE claim_id = 1;
SELECT COUNT(*) AS visits_left   FROM site_visit WHERE claim_id = 1;
SELECT COUNT(*) AS invoices_left FROM invoice    WHERE claim_id = 1;
ROLLBACK;

-- Test 7: balance due is calculated, not stored -> expect 58000 for claim 3 (98000 - 40000)
SELECT claim_id, fee_amount, amount_paid, balance_due
FROM v_claim_overview WHERE claim_id = 3;

-- Test 8: row counts (expect 118 rows in total)
SELECT COUNT(*) AS insurers    FROM insurer;
SELECT COUNT(*) AS clients     FROM client;
SELECT COUNT(*) AS surveyors   FROM surveyor;
SELECT COUNT(*) AS claims      FROM claim;
SELECT COUNT(*) AS site_visits FROM site_visit;
SELECT COUNT(*) AS invoices    FROM invoice;
