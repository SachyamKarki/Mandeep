-- MySQL dump 10.13  Distrib 8.4.11, for macos26.6 (arm64)
--
-- Host: 127.0.0.1    Database: mangaldeep_claims
-- ------------------------------------------------------
-- Server version	8.4.11

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `mangaldeep_claims`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `mangaldeep_claims` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `mangaldeep_claims`;

--
-- Table structure for table `app_user`
--

DROP TABLE IF EXISTS `app_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `app_user` (
  `user_id` int unsigned NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(190) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('admin','staff') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'staff',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `failed_logins` tinyint unsigned NOT NULL DEFAULT '0',
  `locked_until` datetime DEFAULT NULL,
  `password_changed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_login_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uq_user_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `app_user`
--

LOCK TABLES `app_user` WRITE;
/*!40000 ALTER TABLE `app_user` DISABLE KEYS */;
/*!40000 ALTER TABLE `app_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_log`
--

DROP TABLE IF EXISTS `audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_log` (
  `audit_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `table_name` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `record_id` int unsigned NOT NULL,
  `action` enum('INSERT','UPDATE','DELETE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `changed_by` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `changed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `old_data` json DEFAULT NULL,
  `new_data` json DEFAULT NULL,
  PRIMARY KEY (`audit_id`),
  KEY `idx_audit_record` (`table_name`,`record_id`),
  KEY `idx_audit_time` (`changed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_log`
--

LOCK TABLES `audit_log` WRITE;
/*!40000 ALTER TABLE `audit_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `claim`
--

DROP TABLE IF EXISTS `claim`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `claim` (
  `claim_id` int unsigned NOT NULL AUTO_INCREMENT,
  `insurer_id` int unsigned NOT NULL,
  `client_id` int unsigned NOT NULL,
  `surveyor_id` int unsigned NOT NULL,
  `loss_type` enum('Marine','Motor','Industrial') COLLATE utf8mb4_unicode_ci NOT NULL,
  `claimed_amount` decimal(12,2) NOT NULL,
  `status` enum('Open','Surveyed','Closed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Open',
  PRIMARY KEY (`claim_id`),
  KEY `idx_claim_status` (`status`),
  KEY `fk_claim_insurer` (`insurer_id`),
  KEY `fk_claim_client` (`client_id`),
  KEY `fk_claim_surveyor` (`surveyor_id`),
  CONSTRAINT `fk_claim_client` FOREIGN KEY (`client_id`) REFERENCES `client` (`client_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_claim_insurer` FOREIGN KEY (`insurer_id`) REFERENCES `insurer` (`insurer_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_claim_surveyor` FOREIGN KEY (`surveyor_id`) REFERENCES `surveyor` (`surveyor_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_claim_amount` CHECK ((`claimed_amount` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `claim`
--

LOCK TABLES `claim` WRITE;
/*!40000 ALTER TABLE `claim` DISABLE KEYS */;
INSERT INTO `claim` VALUES (1,1,1,1,'Marine',1850000.00,'Closed'),(2,2,2,2,'Motor',425000.00,'Closed'),(3,3,3,3,'Industrial',6200000.00,'Surveyed'),(4,1,4,1,'Marine',2975000.00,'Surveyed'),(5,4,5,4,'Motor',310000.00,'Closed'),(6,5,6,2,'Industrial',4480000.00,'Open'),(7,2,7,3,'Motor',690000.00,'Surveyed'),(8,3,8,4,'Motor',215000.00,'Open'),(9,1,3,1,'Industrial',8750000.00,'Open'),(10,4,1,2,'Marine',1320000.00,'Surveyed'),(11,5,4,3,'Marine',2240000.00,'Closed'),(12,2,6,4,'Industrial',3150000.00,'Open'),(13,3,2,1,'Motor',540000.00,'Surveyed'),(14,4,7,2,'Motor',380000.00,'Open'),(15,5,5,3,'Motor',275000.00,'Open'),(16,6,9,5,'Marine',3650000.00,'Closed'),(17,1,10,6,'Industrial',12400000.00,'Surveyed'),(18,2,11,5,'Motor',465000.00,'Closed'),(19,3,12,6,'Marine',1980000.00,'Surveyed'),(20,4,13,1,'Motor',198000.00,'Closed'),(21,5,14,2,'Industrial',2760000.00,'Surveyed'),(22,6,1,3,'Marine',1540000.00,'Open'),(23,1,9,4,'Marine',2110000.00,'Surveyed'),(24,2,7,3,'Motor',720000.00,'Open'),(25,3,10,5,'Industrial',5350000.00,'Closed'),(26,4,11,6,'Motor',355000.00,'Surveyed'),(27,5,12,1,'Marine',890000.00,'Open'),(28,6,13,2,'Motor',260000.00,'Closed'),(29,1,14,4,'Industrial',3980000.00,'Open'),(30,6,8,5,'Motor',495000.00,'Surveyed');
/*!40000 ALTER TABLE `claim` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `client`
--

DROP TABLE IF EXISTS `client`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `client` (
  `client_id` int unsigned NOT NULL AUTO_INCREMENT,
  `client_name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`client_id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client`
--

LOCK TABLES `client` WRITE;
/*!40000 ALTER TABLE `client` DISABLE KEYS */;
INSERT INTO `client` VALUES (1,'Bagmati Traders Pvt. Ltd.','9801234567'),(2,'Sita Ram Shrestha','9841122334'),(3,'Himal Cement Udyog','9851098765'),(4,'Kathmandu Freight Lines','9803456789'),(5,'Anita Gurung','9846543210'),(6,'Narayani Textiles','9855012345'),(7,'Pokhara Auto Works','9856023456'),(8,'Ramesh Thapa','9818765432'),(9,'Janakpur Agro Exports','9844012233'),(10,'Birat Steel Industries','9852034455'),(11,'Prakash Karki','9813345566'),(12,'Butwal Logistics Pvt. Ltd.','9857067788'),(13,'Mina Tamang','9849901122'),(14,'Dhulikhel Dairy Udyog','9851124466');
/*!40000 ALTER TABLE `client` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `insurer`
--

DROP TABLE IF EXISTS `insurer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `insurer` (
  `insurer_id` int unsigned NOT NULL AUTO_INCREMENT,
  `insurer_name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`insurer_id`),
  UNIQUE KEY `uq_insurer_name` (`insurer_name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `insurer`
--

LOCK TABLES `insurer` WRITE;
/*!40000 ALTER TABLE `insurer` DISABLE KEYS */;
INSERT INTO `insurer` VALUES (1,'Everest Shield Insurance','01-4412345'),(2,'Annapurna General Insurance','01-4223456'),(3,'Kailash Mutual Insurance','01-5534567'),(4,'Lumbini Assurance Ltd.','01-4785678'),(5,'Gandaki Insurance Co.','061-456789'),(6,'Rara Lake Insurance Co.','01-4991234');
/*!40000 ALTER TABLE `insurer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoice`
--

DROP TABLE IF EXISTS `invoice`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoice` (
  `invoice_id` int unsigned NOT NULL AUTO_INCREMENT,
  `claim_id` int unsigned NOT NULL,
  `fee_amount` decimal(10,2) NOT NULL,
  `amount_paid` decimal(10,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`invoice_id`),
  UNIQUE KEY `uq_invoice_claim` (`claim_id`),
  CONSTRAINT `fk_invoice_claim` FOREIGN KEY (`claim_id`) REFERENCES `claim` (`claim_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_invoice_fee` CHECK ((`fee_amount` > 0)),
  CONSTRAINT `chk_invoice_paid` CHECK (((`amount_paid` >= 0) and (`amount_paid` <= `fee_amount`)))
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoice`
--

LOCK TABLES `invoice` WRITE;
/*!40000 ALTER TABLE `invoice` DISABLE KEYS */;
INSERT INTO `invoice` VALUES (1,1,37000.00,37000.00),(2,2,12500.00,12500.00),(3,3,98000.00,40000.00),(4,4,52000.00,0.00),(5,5,9500.00,9500.00),(6,10,26000.00,10000.00),(7,11,41000.00,41000.00),(8,13,14000.00,0.00),(9,16,64000.00,64000.00),(10,17,145000.00,60000.00),(11,18,13500.00,13500.00),(12,19,33000.00,0.00),(13,20,7500.00,7500.00),(14,21,47000.00,20000.00),(15,23,36000.00,0.00),(16,25,82000.00,82000.00),(17,26,11000.00,5000.00),(18,28,8500.00,8500.00),(19,30,15500.00,0.00);
/*!40000 ALTER TABLE `invoice` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `site_visit`
--

DROP TABLE IF EXISTS `site_visit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `site_visit` (
  `visit_id` int unsigned NOT NULL AUTO_INCREMENT,
  `claim_id` int unsigned NOT NULL,
  `visit_date` date NOT NULL,
  `findings` text COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`visit_id`),
  KEY `idx_visit_claim_date` (`claim_id`,`visit_date`),
  CONSTRAINT `fk_visit_claim` FOREIGN KEY (`claim_id`) REFERENCES `claim` (`claim_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `site_visit`
--

LOCK TABLES `site_visit` WRITE;
/*!40000 ALTER TABLE `site_visit` DISABLE KEYS */;
INSERT INTO `site_visit` VALUES (1,1,'2026-06-04','Container seal intact; water ingress found in 40 of 220 cartons.'),(2,1,'2026-06-18','Salvage sale arranged for damaged cartons. Loss assessed at 31%.'),(3,2,'2026-06-09','Front bumper, bonnet and radiator damaged. Workshop estimate checked.'),(4,3,'2026-06-21','Kiln motor burnt out after power surge. Serial numbers recorded.'),(5,3,'2026-07-02','Repair vs replace quotes collected from two vendors.'),(6,3,'2026-07-19','Replacement motor installed. Final measurements taken.'),(7,4,'2026-07-06','Shipment of electronics short-landed by 12 cases at Birgunj ICD.'),(8,4,'2026-07-24','Port records reviewed. Short-landing confirmed by customs log.'),(9,5,'2026-06-28','Rear-end collision. Boot lid and tail lamps replaced.'),(10,6,'2026-09-03','Fire in finishing unit. Stock register and CCTV requested.'),(11,7,'2026-07-30','Bus side panel and two windows damaged in landslide debris.'),(12,7,'2026-08-12','Re-inspection after repair. Paint and glass work satisfactory.'),(13,9,'2026-09-15','Warehouse roof collapse after heavy rain. Structural engineer called.'),(14,10,'2026-08-05','Rice consignment wet-damaged in transit. Samples sent for testing.'),(15,10,'2026-08-20','Lab report: 18% of bags unfit for sale.'),(16,11,'2026-06-12','Truck overturned near Mugling. Cargo partially recovered.'),(17,11,'2026-06-25','Recovered cargo counted and valued.'),(18,13,'2026-08-27','Motorbike theft. FIR copy and key set collected.'),(19,14,'2026-09-22','Pickup engine seized. Oil sump cracked; cause under review.'),(20,16,'2026-06-15','Lentil consignment soaked at Kolkata transhipment. 65 sacks affected.'),(21,16,'2026-06-29','Moisture test on remaining sacks. Further 20 sacks rejected.'),(22,16,'2026-07-10','Salvage buyer quote accepted. Final loss figure agreed.'),(23,17,'2026-07-14','Rolling mill gearbox failure. Production halted for 9 days.'),(24,17,'2026-07-28','Manufacturer engineer confirmed bearing fatigue, not misuse.'),(25,17,'2026-08-18','Business interruption figures checked against sales ledger.'),(26,18,'2026-07-03','Car hit a stray cow on the Arniko Highway. Front grille and headlamp broken.'),(27,18,'2026-07-17','Repair completed. Bills matched to the approved estimate.'),(28,19,'2026-08-08','Pharmaceutical cartons crushed during unloading at Bhairahawa.'),(29,19,'2026-08-26','Batch numbers listed. Cold-chain logger shows no temperature breach.'),(30,20,'2026-06-22','Scooter side-swiped in Lalitpur. Mirror and panel replaced.'),(31,21,'2026-08-14','Boiler pressure valve burst. Pipework and chilling tank damaged.'),(32,21,'2026-09-01','Replacement valve fitted. Spoiled milk volume confirmed from logs.'),(33,22,'2026-09-26','Garment container delayed and found with torn tarpaulin. Count started.'),(34,23,'2026-08-29','Ginger shipment rejected at border for mould. Samples taken.'),(35,23,'2026-09-12','Lab confirmed mould from wet loading. Packing list checked.'),(36,25,'2026-06-17','Electrical fire in billet store. Fire brigade report collected.'),(37,25,'2026-07-01','Damaged stock weighed and photographed.'),(38,25,'2026-07-22','Salvage value agreed with the insured. Report finalised.'),(39,26,'2026-09-04','Jeep rolled into a ditch near Dhulikhel. Chassis inspected.'),(40,27,'2026-09-29','Tea chests water-stained in transit. Initial count recorded.'),(41,28,'2026-07-08','Bike stolen from a parking lot in Thamel. Police report collected.'),(42,28,'2026-07-21','Recovery period ended. Theft loss confirmed.'),(43,30,'2026-09-18','Taxi rear-ended at a junction in Butwal. Bumper and boot damaged.');
/*!40000 ALTER TABLE `site_visit` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `surveyor`
--

DROP TABLE IF EXISTS `surveyor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `surveyor` (
  `surveyor_id` int unsigned NOT NULL AUTO_INCREMENT,
  `surveyor_name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `licence_no` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`surveyor_id`),
  UNIQUE KEY `uq_surveyor_licence` (`licence_no`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `surveyor`
--

LOCK TABLES `surveyor` WRITE;
/*!40000 ALTER TABLE `surveyor` DISABLE KEYS */;
INSERT INTO `surveyor` VALUES (1,'Hari Prasad Adhikari','NIA-SV-1042'),(2,'Sunita Maharjan','NIA-SV-1187'),(3,'Bijay Rai','NIA-SV-1255'),(4,'Kamala Bhattarai','NIA-SV-1309'),(5,'Prabin Shrestha','NIA-SV-1402'),(6,'Sarita Poudel','NIA-SV-1468');
/*!40000 ALTER TABLE `surveyor` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_session`
--

DROP TABLE IF EXISTS `user_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_session` (
  `token_hash` char(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` datetime NOT NULL,
  `user_agent` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`token_hash`),
  KEY `idx_session_user` (`user_id`),
  KEY `idx_session_expiry` (`expires_at`),
  CONSTRAINT `fk_session_user` FOREIGN KEY (`user_id`) REFERENCES `app_user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_session`
--

LOCK TABLES `user_session` WRITE;
/*!40000 ALTER TABLE `user_session` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_session` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `v_claim_overview`
--

DROP TABLE IF EXISTS `v_claim_overview`;
/*!50001 DROP VIEW IF EXISTS `v_claim_overview`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_claim_overview` AS SELECT 
 1 AS `claim_id`,
 1 AS `loss_type`,
 1 AS `claimed_amount`,
 1 AS `status`,
 1 AS `insurer_id`,
 1 AS `insurer_name`,
 1 AS `client_id`,
 1 AS `client_name`,
 1 AS `surveyor_id`,
 1 AS `surveyor_name`,
 1 AS `visit_count`,
 1 AS `last_visit`,
 1 AS `invoice_id`,
 1 AS `fee_amount`,
 1 AS `amount_paid`,
 1 AS `balance_due`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_unpaid_invoices`
--

DROP TABLE IF EXISTS `v_unpaid_invoices`;
/*!50001 DROP VIEW IF EXISTS `v_unpaid_invoices`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_unpaid_invoices` AS SELECT 
 1 AS `invoice_id`,
 1 AS `claim_id`,
 1 AS `insurer_name`,
 1 AS `client_name`,
 1 AS `fee_amount`,
 1 AS `amount_paid`,
 1 AS `balance_due`,
 1 AS `payment_status`*/;
SET character_set_client = @saved_cs_client;

--
-- Dumping routines for database 'mangaldeep_claims'
--

--
-- Current Database: `mangaldeep_claims`
--

USE `mangaldeep_claims`;

--
-- Final view structure for view `v_claim_overview`
--

/*!50001 DROP VIEW IF EXISTS `v_claim_overview`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`practice`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_claim_overview` AS select `c`.`claim_id` AS `claim_id`,`c`.`loss_type` AS `loss_type`,`c`.`claimed_amount` AS `claimed_amount`,`c`.`status` AS `status`,`i`.`insurer_id` AS `insurer_id`,`i`.`insurer_name` AS `insurer_name`,`cl`.`client_id` AS `client_id`,`cl`.`client_name` AS `client_name`,`s`.`surveyor_id` AS `surveyor_id`,`s`.`surveyor_name` AS `surveyor_name`,count(`v`.`visit_id`) AS `visit_count`,max(`v`.`visit_date`) AS `last_visit`,`inv`.`invoice_id` AS `invoice_id`,`inv`.`fee_amount` AS `fee_amount`,`inv`.`amount_paid` AS `amount_paid`,(`inv`.`fee_amount` - `inv`.`amount_paid`) AS `balance_due` from (((((`claim` `c` join `insurer` `i` on((`i`.`insurer_id` = `c`.`insurer_id`))) join `client` `cl` on((`cl`.`client_id` = `c`.`client_id`))) join `surveyor` `s` on((`s`.`surveyor_id` = `c`.`surveyor_id`))) left join `site_visit` `v` on((`v`.`claim_id` = `c`.`claim_id`))) left join `invoice` `inv` on((`inv`.`claim_id` = `c`.`claim_id`))) group by `c`.`claim_id`,`c`.`loss_type`,`c`.`claimed_amount`,`c`.`status`,`i`.`insurer_id`,`i`.`insurer_name`,`cl`.`client_id`,`cl`.`client_name`,`s`.`surveyor_id`,`s`.`surveyor_name`,`inv`.`invoice_id`,`inv`.`fee_amount`,`inv`.`amount_paid` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_unpaid_invoices`
--

/*!50001 DROP VIEW IF EXISTS `v_unpaid_invoices`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`practice`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_unpaid_invoices` AS select `inv`.`invoice_id` AS `invoice_id`,`inv`.`claim_id` AS `claim_id`,`i`.`insurer_name` AS `insurer_name`,`cl`.`client_name` AS `client_name`,`inv`.`fee_amount` AS `fee_amount`,`inv`.`amount_paid` AS `amount_paid`,(`inv`.`fee_amount` - `inv`.`amount_paid`) AS `balance_due`,(case when (`inv`.`amount_paid` = 0) then 'Unpaid' else 'Part paid' end) AS `payment_status` from (((`invoice` `inv` join `claim` `c` on((`c`.`claim_id` = `inv`.`claim_id`))) join `insurer` `i` on((`i`.`insurer_id` = `c`.`insurer_id`))) join `client` `cl` on((`cl`.`client_id` = `c`.`client_id`))) where (`inv`.`amount_paid` < `inv`.`fee_amount`) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-05 16:27:49
