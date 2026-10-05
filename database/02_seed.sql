-- =============================================================
-- Claim Survey Management Database: dummy data
-- All names, phone numbers and licence numbers are made up.
-- No real Mangaldeep client or claim data is stored here.
-- =============================================================

USE mangaldeep_claims;

INSERT INTO insurer (insurer_name, phone) VALUES
  ('Everest Shield Insurance',     '01-4412345'),
  ('Annapurna General Insurance',  '01-4223456'),
  ('Kailash Mutual Insurance',     '01-5534567'),
  ('Lumbini Assurance Ltd.',       '01-4785678'),
  ('Gandaki Insurance Co.',        '061-456789'),
  ('Rara Lake Insurance Co.',      '01-4991234');

INSERT INTO client (client_name, phone) VALUES
  ('Bagmati Traders Pvt. Ltd.',    '9801234567'),
  ('Sita Ram Shrestha',            '9841122334'),
  ('Himal Cement Udyog',           '9851098765'),
  ('Kathmandu Freight Lines',      '9803456789'),
  ('Anita Gurung',                 '9846543210'),
  ('Narayani Textiles',            '9855012345'),
  ('Pokhara Auto Works',           '9856023456'),
  ('Ramesh Thapa',                 '9818765432'),
  ('Janakpur Agro Exports',        '9844012233'),
  ('Birat Steel Industries',       '9852034455'),
  ('Prakash Karki',                '9813345566'),
  ('Butwal Logistics Pvt. Ltd.',   '9857067788'),
  ('Mina Tamang',                  '9849901122'),
  ('Dhulikhel Dairy Udyog',        '9851124466');

INSERT INTO surveyor (surveyor_name, licence_no) VALUES
  ('Hari Prasad Adhikari',  'NIA-SV-1042'),
  ('Sunita Maharjan',       'NIA-SV-1187'),
  ('Bijay Rai',             'NIA-SV-1255'),
  ('Kamala Bhattarai',      'NIA-SV-1309'),
  ('Prabin Shrestha',       'NIA-SV-1402'),
  ('Sarita Poudel',         'NIA-SV-1468');

INSERT INTO claim (insurer_id, client_id, surveyor_id, loss_type, claimed_amount, status) VALUES
  (1, 1, 1, 'Marine',     1850000.00, 'Closed'),
  (2, 2, 2, 'Motor',       425000.00, 'Closed'),
  (3, 3, 3, 'Industrial', 6200000.00, 'Surveyed'),
  (1, 4, 1, 'Marine',     2975000.00, 'Surveyed'),
  (4, 5, 4, 'Motor',       310000.00, 'Closed'),
  (5, 6, 2, 'Industrial', 4480000.00, 'Open'),
  (2, 7, 3, 'Motor',       690000.00, 'Surveyed'),
  (3, 8, 4, 'Motor',       215000.00, 'Open'),
  (1, 3, 1, 'Industrial', 8750000.00, 'Open'),
  (4, 1, 2, 'Marine',     1320000.00, 'Surveyed'),
  (5, 4, 3, 'Marine',     2240000.00, 'Closed'),
  (2, 6, 4, 'Industrial', 3150000.00, 'Open'),
  (3, 2, 1, 'Motor',       540000.00, 'Surveyed'),
  (4, 7, 2, 'Motor',       380000.00, 'Open'),
  (5, 5, 3, 'Motor',       275000.00, 'Open'),
  (6, 9, 5, 'Marine',     3650000.00, 'Closed'),
  (1, 10, 6, 'Industrial', 12400000.00, 'Surveyed'),
  (2, 11, 5, 'Motor',      465000.00, 'Closed'),
  (3, 12, 6, 'Marine',    1980000.00, 'Surveyed'),
  (4, 13, 1, 'Motor',      198000.00, 'Closed'),
  (5, 14, 2, 'Industrial', 2760000.00, 'Surveyed'),
  (6, 1, 3, 'Marine',     1540000.00, 'Open'),
  (1, 9, 4, 'Marine',     2110000.00, 'Surveyed'),
  (2, 7, 3, 'Motor',       720000.00, 'Open'),      -- same client, insurer and loss type as claim 7: a likely duplicate
  (3, 10, 5, 'Industrial', 5350000.00, 'Closed'),
  (4, 11, 6, 'Motor',      355000.00, 'Surveyed'),
  (5, 12, 1, 'Marine',     890000.00, 'Open'),
  (6, 13, 2, 'Motor',      260000.00, 'Closed'),
  (1, 14, 4, 'Industrial', 3980000.00, 'Open'),
  (6, 8, 5, 'Motor',       495000.00, 'Surveyed');

INSERT INTO site_visit (claim_id, visit_date, findings) VALUES
  (1,  '2026-06-04', 'Container seal intact; water ingress found in 40 of 220 cartons.'),
  (1,  '2026-06-18', 'Salvage sale arranged for damaged cartons. Loss assessed at 31%.'),
  (2,  '2026-06-09', 'Front bumper, bonnet and radiator damaged. Workshop estimate checked.'),
  (3,  '2026-06-21', 'Kiln motor burnt out after power surge. Serial numbers recorded.'),
  (3,  '2026-07-02', 'Repair vs replace quotes collected from two vendors.'),
  (3,  '2026-07-19', 'Replacement motor installed. Final measurements taken.'),
  (4,  '2026-07-06', 'Shipment of electronics short-landed by 12 cases at Birgunj ICD.'),
  (4,  '2026-07-24', 'Port records reviewed. Short-landing confirmed by customs log.'),
  (5,  '2026-06-28', 'Rear-end collision. Boot lid and tail lamps replaced.'),
  (6,  '2026-09-03', 'Fire in finishing unit. Stock register and CCTV requested.'),
  (7,  '2026-07-30', 'Bus side panel and two windows damaged in landslide debris.'),
  (7,  '2026-08-12', 'Re-inspection after repair. Paint and glass work satisfactory.'),
  (9,  '2026-09-15', 'Warehouse roof collapse after heavy rain. Structural engineer called.'),
  (10, '2026-08-05', 'Rice consignment wet-damaged in transit. Samples sent for testing.'),
  (10, '2026-08-20', 'Lab report: 18% of bags unfit for sale.'),
  (11, '2026-06-12', 'Truck overturned near Mugling. Cargo partially recovered.'),
  (11, '2026-06-25', 'Recovered cargo counted and valued.'),
  (13, '2026-08-27', 'Motorbike theft. FIR copy and key set collected.'),
  (14, '2026-09-22', 'Pickup engine seized. Oil sump cracked; cause under review.'),
  (16, '2026-06-15', 'Lentil consignment soaked at Kolkata transhipment. 65 sacks affected.'),
  (16, '2026-06-29', 'Moisture test on remaining sacks. Further 20 sacks rejected.'),
  (16, '2026-07-10', 'Salvage buyer quote accepted. Final loss figure agreed.'),
  (17, '2026-07-14', 'Rolling mill gearbox failure. Production halted for 9 days.'),
  (17, '2026-07-28', 'Manufacturer engineer confirmed bearing fatigue, not misuse.'),
  (17, '2026-08-18', 'Business interruption figures checked against sales ledger.'),
  (18, '2026-07-03', 'Car hit a stray cow on the Arniko Highway. Front grille and headlamp broken.'),
  (18, '2026-07-17', 'Repair completed. Bills matched to the approved estimate.'),
  (19, '2026-08-08', 'Pharmaceutical cartons crushed during unloading at Bhairahawa.'),
  (19, '2026-08-26', 'Batch numbers listed. Cold-chain logger shows no temperature breach.'),
  (20, '2026-06-22', 'Scooter side-swiped in Lalitpur. Mirror and panel replaced.'),
  (21, '2026-08-14', 'Boiler pressure valve burst. Pipework and chilling tank damaged.'),
  (21, '2026-09-01', 'Replacement valve fitted. Spoiled milk volume confirmed from logs.'),
  (22, '2026-09-26', 'Garment container delayed and found with torn tarpaulin. Count started.'),
  (23, '2026-08-29', 'Ginger shipment rejected at border for mould. Samples taken.'),
  (23, '2026-09-12', 'Lab confirmed mould from wet loading. Packing list checked.'),
  (25, '2026-06-17', 'Electrical fire in billet store. Fire brigade report collected.'),
  (25, '2026-07-01', 'Damaged stock weighed and photographed.'),
  (25, '2026-07-22', 'Salvage value agreed with the insured. Report finalised.'),
  (26, '2026-09-04', 'Jeep rolled into a ditch near Dhulikhel. Chassis inspected.'),
  (27, '2026-09-29', 'Tea chests water-stained in transit. Initial count recorded.'),
  (28, '2026-07-08', 'Bike stolen from a parking lot in Thamel. Police report collected.'),
  (28, '2026-07-21', 'Recovery period ended. Theft loss confirmed.'),
  (30, '2026-09-18', 'Taxi rear-ended at a junction in Butwal. Bumper and boot damaged.');

-- Closed claims are fully paid; surveyed claims are part paid or unpaid.
INSERT INTO invoice (claim_id, fee_amount, amount_paid) VALUES
  (1,  37000.00, 37000.00),
  (2,  12500.00, 12500.00),
  (3,  98000.00, 40000.00),
  (4,  52000.00,     0.00),
  (5,   9500.00,  9500.00),
  (10, 26000.00, 10000.00),
  (11, 41000.00, 41000.00),
  (13, 14000.00,     0.00),
  (16, 64000.00, 64000.00),
  (17, 145000.00, 60000.00),
  (18, 13500.00, 13500.00),
  (19, 33000.00,     0.00),
  (20,  7500.00,  7500.00),
  (21, 47000.00, 20000.00),
  (23, 36000.00,     0.00),
  (25, 82000.00, 82000.00),
  (26, 11000.00,  5000.00),
  (28,  8500.00,  8500.00),
  (30, 15500.00,     0.00);
