-- ========================================================
-- GARMENT CARTON & WAREHOUSE HUB (GCWH) DATABASE SCHEMA
-- Siap Import via phpMyAdmin di aaPanel / VPS MySQL
-- ========================================================

CREATE DATABASE IF NOT EXISTS `garment_warehouse` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `garment_warehouse`;

-- --------------------------------------------------------
-- 1. Tabel Master Purchase Orders (purchase_orders)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `purchase_orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `buyer` VARCHAR(100) NOT NULL,
  `po_number` VARCHAR(50) NOT NULL,
  `style_code` VARCHAR(50) NOT NULL,
  `ex_fty_date` DATE DEFAULT NULL,
  `status` VARCHAR(50) DEFAULT 'Pending',
  `inspection_internal_by` VARCHAR(100) DEFAULT NULL,
  `inspection_internal_at` DATETIME DEFAULT NULL,
  `inspection_external_by` VARCHAR(100) DEFAULT NULL,
  `inspection_external_at` DATETIME DEFAULT NULL,
  `revised_ex_fty_date` DATE DEFAULT NULL,
  `shipment_note` TEXT DEFAULT NULL,
  `buyer_logo` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- 2. Tabel Rincian Warna & Penempatan Rak (po_colors)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `po_colors` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `po_id` INT NOT NULL,
  `color_code` VARCHAR(50) NOT NULL,
  `total_qty` INT DEFAULT 0,
  `carton_qty` INT DEFAULT 0,
  `rack_location` VARCHAR(50) DEFAULT '',
  `helper_name` VARCHAR(100) DEFAULT '',
  CONSTRAINT `fk_po_colors_po_id` FOREIGN KEY (`po_id`) REFERENCES `purchase_orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- 3. Tabel Manajemen Pengguna / Akun (users)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` VARCHAR(20) DEFAULT 'Helper',
  `full_name` VARCHAR(100) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- NOTE: Akun default sekarang di-seed otomatis oleh server.js dengan password yang sudah di-hash via bcrypt.
-- Jangan sisipkan password plain-text di file SQL ini untuk alasan keamanan.

-- --------------------------------------------------------
-- 4. Tabel Log Riwayat Audit (audit_logs)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(100) DEFAULT 'System',
  `action` VARCHAR(100) NOT NULL,
  `details` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- 5. Tabel Master Buyer & Logo (#6 — migrasi dari memori ke DB)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `buyers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `logo` VARCHAR(500) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed data buyer bawaan
INSERT IGNORE INTO `buyers` (`name`, `logo`) VALUES
('Polo Ralph Lauren', 'http://eformku.id//uploads/logo-bren/1790426380_id1DA_YLZo_1790425674300.webp'),
('Hugo Boss', 'http://eformku.id//uploads/logo-bren/1790426372_idmTj_6cnl_1790425661332.webp'),
('Rhone Apparel', 'https://eformku.id//uploads/logo-bren/1790426389_Rhone Logo.webp'),
('Lululemon', 'https://eformku.id//uploads/logo-bren/1790426358_Lululemon_Symbol_1.webp'),
('PVH Tommy NA', 'https://eformku.id//uploads/logo-bren/1790426408_idO3bjm9Ep_1790425982939.webp'),
('PVH Tommy Europe', 'https://eformku.id//uploads/logo-bren/1790426367_PVH_Corp-_id2S3SxIve_0.webp'),
('Brooks Brothers', 'https://eformku.id//uploads/logo-bren/1790426402_idTFjUo1zD_1790425809383.webp'),
('Dillard''s', 'https://eformku.id//uploads/logo-bren/1790426770_idUNmgk3mT_1790426721958.webp'),
('LL Bean', 'https://eformku.id//uploads/logo-bren/1790426397_idq9ghjewC_logos.webp'),
('Poncho', 'https://eformku.id//uploads/logo-bren/1790426921_idbt8ujyZi_1790426866959.webp'),
('Tomy Bahama', 'https://eformku.id//uploads/logo-bren/1790426413_idxtRYatD0_1790426009517.webp');
