-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Waktu pembuatan: 01 Okt 2026 pada 17.43
-- Versi server: 10.4.32-MariaDB
-- Versi PHP: 8.2.12
--
-- ============================================================================
-- SKEMA DISELARASKAN DENGAN server.js (Garment Hub V6)
--
-- File ini adalah skema INSTALASI BERSIH -> impor ke database KOSONG.
-- Seluruh tabel/kolom di bawah diverifikasi dari query di server.js:
--
--   audit_logs          -> recordLog() (semua aksi), GET /api/logs
--   users               -> POST /api/login, GET|POST|PUT|DELETE /api/users,
--                          seedDefaultAccounts(), FK carton_movements.recorded_by
--   buyers              -> GET /api/buyers, PUT /api/buyers/logo,
--                          logo lookup di POST /api/po + /api/po/bulk
--   purchase_orders     -> GET /api/data, /api/stats, POST /api/po, /api/po/bulk,
--                          PUT /api/po/:id, PUT /api/po/:id/status, DELETE,
--                          POST /api/cartons/in (qty_in), /api/cartons/out (qty_out)
--   po_colors           -> breakdown warna PO + posisi rak (POST /api/color-placement),
--                          target vs fisik karton (dasar /api/stats)
--   carton_movements    -> POST /api/cartons/in|out, GET /api/po/:id/movements
--
-- Penyesuaian penting vs dump lama:
--   1. purchase_orders.qty_in & qty_out DITAMBAHKAN. Tanpa kolom ini
--      POST /api/cartons/in dan /api/cartons/out selalu 500
--      ("Unknown column 'qty_in' in 'field list'").
--   2. purchase_orders.status DEFAULT 'Pending' (dump lama: 'Pending (Belum Dicek)'
--      yang tidak pernah cocok dengan filter /api/stats).
--   3. users.fullname DIHAPUS. server.js hanya menulis/membaca full_name, jadi
--      kolom NOT NULL tanpa default itu membuat POST /api/users & seed gagal
--      di SQL strict mode.
--   4. buyers.name diberi DEFAULT ''. server.js mengisi name saat upsert logo.
--   5. po_colors: total_qty/carton_qty/rack_location/helper_name NOT NULL DEFAULT
--      supaya "carton_qty = carton_qty + ?" tidak pernah menghasilkan NULL.
--   6. FOREIGN KEY carton_movements dipindah ke dalam CREATE TABLE (di dump lama
--      ALTER FK-nya dieksekusi sebelum purchase_orders/users ada -> errno 150).
--   7. warehouse_placements DIHAPUS. Tidak dipakai satu query pun di server.js;
--      posisi rak ada di po_colors, riwayat karton di carton_movements.
--   8. BACKFILL qty_in dari akumulasi carton_qty lama agar KPI karton tidak 0.
-- ============================================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `garment_warehouse`
--

-- --------------------------------------------------------
-- Tabel `users`
-- Dipakai: login, manajemen user, seed default, FK carton_movements.recorded_by
-- --------------------------------------------------------

CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(100) NOT NULL COMMENT 'bcrypt hash (bcryptjs, cost 12)',
  `role` enum('admin','helper') NOT NULL DEFAULT 'helper',
  `full_name` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=4;

INSERT INTO `users` (`id`, `username`, `password`, `role`, `full_name`, `created_at`) VALUES
(1, 'admin', '$2b$12$ASgcXMnchql7cMb2ER9Gge4DPt4rQPCRsuePVfDmOHI4fJjQprBDe', 'admin', 'Administrator Utama', '2026-09-29 15:27:27'),
(2, 'helper', '$2b$12$cwVpAvi3dPewGVnlw8xJP.Jz9uBIZncxZ4wYxbA4XXw51V75fHEPy', 'helper', 'Helper Boy Warehouse', '2026-09-29 15:27:27');

-- --------------------------------------------------------
-- Tabel `buyers`
-- buyer_name unik = kunci lookup logo di POST /api/po & /api/po/bulk
-- --------------------------------------------------------

CREATE TABLE `buyers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `buyer_name` varchar(100) NOT NULL,
  `logo_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `name` varchar(255) NOT NULL DEFAULT '' COMMENT 'Legacy: diisi server.js (upsert logo) dengan buyer_name',
  PRIMARY KEY (`id`),
  UNIQUE KEY `buyer_name` (`buyer_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=12;

INSERT INTO `buyers` (`id`, `buyer_name`, `logo_url`, `created_at`, `name`) VALUES
(1, 'Polo Ralph Lauren', 'https://eformku.id//uploads/logo-bren/1790426380_id1DA_YLZo_1790425674300.webp', '2026-09-26 15:01:43', ''),
(2, 'Hugo Boss', 'https://eformku.id//uploads/logo-bren/1790426372_idmTj_6cnl_1790425661332.webp', '2026-09-26 15:01:43', ''),
(3, 'Rhone Apparel', 'https://eformku.id//uploads/logo-bren/1790426389_Rhone Logo.webp', '2026-09-26 15:01:43', ''),
(4, 'Lululemon', 'https://eformku.id//uploads/logo-bren/1790426358_Lululemon_Symbol_1.webp', '2026-09-26 15:01:43', ''),
(5, 'PVH Tommy NA', 'https://eformku.id//uploads/logo-bren/1790426408_idO3bjm9Ep_1790425982939.webp', '2026-09-26 15:01:43', ''),
(6, 'PVH Tommy Europe', 'https://eformku.id//uploads/logo-bren/1790426367_PVH_Corp-_id2S3SxIve_0.webp', '2026-09-26 15:01:43', ''),
(7, 'Brooks Brothers', 'https://eformku.id//uploads/logo-bren/1790426402_idTFjUo1zD_1790425809383.webp', '2026-09-26 15:01:43', ''),
(8, 'Dillard\'s', 'https://eformku.id//uploads/logo-bren/1790426770_idUNmgk3mT_1790426721958.webp', '2026-09-26 15:01:43', ''),
(9, 'LL Bean', 'https://eformku.id//uploads/logo-bren/1790426397_idq9ghjewC_logos.webp', '2026-09-26 15:01:43', ''),
(10, 'Poncho', 'https://eformku.id//uploads/logo-bren/1790426921_idbt8ujyZi_1790426866959.webp', '2026-09-26 15:01:43', ''),
(11, 'Tomy Bahama', 'https://eformku.id//uploads/logo-bren/1790426413_idxtRYatD0_1790426009517.webp', '2026-09-26 15:15:17', '');

-- --------------------------------------------------------
-- Tabel `purchase_orders`
-- --------------------------------------------------------

CREATE TABLE `purchase_orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `buyer` varchar(100) NOT NULL,
  `po_number` varchar(100) NOT NULL,
  `style_code` varchar(100) NOT NULL,
  `color_code` varchar(100) DEFAULT NULL COMMENT 'Legacy, tidak ditulis server.js; breakdown warna ada di po_colors',
  `total_qty` int(11) NOT NULL DEFAULT 0 COMMENT 'Legacy target karton; dipakai UI sebagai fallback bila po_colors kosong',
  `ex_fty_date` date NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Pending' COMMENT 'Pending | Inspection Internal | Inspection External | Ready to Ship | Shipped / Exported',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `inspection_internal_by` varchar(100) DEFAULT NULL,
  `inspection_internal_at` datetime DEFAULT NULL,
  `inspection_external_by` varchar(100) DEFAULT NULL,
  `inspection_external_at` datetime DEFAULT NULL,
  `revised_ex_fty_date` date DEFAULT NULL,
  `shipment_note` text DEFAULT NULL,
  `buyer_logo` varchar(255) DEFAULT NULL,
  `qty_in` int(11) NOT NULL DEFAULT 0 COMMENT 'Akumulasi karton masuk - POST /api/cartons/in',
  `qty_out` int(11) NOT NULL DEFAULT 0 COMMENT 'Akumulasi karton keluar - POST /api/cartons/out',
  PRIMARY KEY (`id`),
  KEY `idx_po_number` (`po_number`),
  KEY `idx_buyer` (`buyer`),
  KEY `idx_status` (`status`),
  KEY `idx_ex_fty` (`ex_fty_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=18;

INSERT INTO `purchase_orders` (`id`, `buyer`, `po_number`, `style_code`, `color_code`, `total_qty`, `ex_fty_date`, `status`, `created_at`, `inspection_internal_by`, `inspection_internal_at`, `inspection_external_by`, `inspection_external_at`, `revised_ex_fty_date`, `shipment_note`, `buyer_logo`) VALUES
(6, 'Polo Ralph Lauren', '4702177521', '710966474', '', 0, '2026-10-04', 'Pending', '2026-09-26 12:13:55', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(7, 'Polo Ralph Lauren', '4702177522', '710974534', '', 0, '2026-10-01', 'Inspection External', '2026-09-26 12:15:27', NULL, NULL, 'QIMA', '2026-09-29 10:36:00', '2026-10-04', NULL, 'http://eformku.id//uploads/logo-bren/1790426380_id1DA_YLZo_1790425674300.webp'),
(17, 'Dillard\'s', '232', '211', '', 0, '2026-10-01', 'Pending', '2026-09-29 17:20:08', NULL, NULL, NULL, NULL, NULL, NULL, 'https://eformku.id//uploads/logo-bren/1790426770_idUNmgk3mT_1790426721958.webp');

-- --------------------------------------------------------
-- Tabel `po_colors`
-- Breakdown warna per PO; carton_qty = stok fisik yang di-+/- endpoint karton
-- --------------------------------------------------------

CREATE TABLE `po_colors` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `po_id` int(11) NOT NULL,
  `color_code` varchar(50) NOT NULL,
  `total_qty` int(11) NOT NULL DEFAULT 0 COMMENT 'Target karton untuk warna ini',
  `carton_qty` int(11) NOT NULL DEFAULT 0 COMMENT 'Fisik karton di rak; di-+/- oleh /api/cartons/in & /api/cartons/out',
  `rack_location` varchar(50) NOT NULL DEFAULT '',
  `helper_name` varchar(100) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `idx_po_id` (`po_id`),
  CONSTRAINT `po_colors_ibfk_1` FOREIGN KEY (`po_id`) REFERENCES `purchase_orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=30;

INSERT INTO `po_colors` (`id`, `po_id`, `color_code`, `total_qty`, `carton_qty`, `rack_location`, `helper_name`) VALUES
(6, 6, '018', 51, 51, 'r4', 'ed'),
(7, 6, '019', 51, 4, 'R5', 'cf'),
(17, 7, '004', 43, 9, 'f7', 'AS'),
(18, 7, '007', 38, 38, 'F7', 'GH'),
(19, 7, '010', 65, 65, 'F7', 'AG'),
(29, 17, '21', 21, 0, '', '');

-- --------------------------------------------------------
-- Tabel `carton_movements`
-- Riwayat karton masuk/keluar; sumber timeline GET /api/po/:id/movements
-- --------------------------------------------------------

CREATE TABLE `carton_movements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `po_id` int(11) NOT NULL,
  `type` enum('IN','OUT') NOT NULL,
  `quantity` int(11) NOT NULL,
  `reason` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `recorded_by` int(11) DEFAULT NULL COMMENT 'users.id; NULL jika user dihapus',
  `recorded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_po_id` (`po_id`),
  KEY `idx_recorded_by` (`recorded_by`),
  CONSTRAINT `carton_movements_ibfk_1` FOREIGN KEY (`po_id`) REFERENCES `purchase_orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `carton_movements_ibfk_2` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=1;

-- --------------------------------------------------------
-- Tabel `audit_logs`
-- Diisi recordLog() dari hampir semua endpoint; dibaca GET /api/logs (100 terakhir)
-- --------------------------------------------------------

CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL DEFAULT 'System',
  `action` varchar(100) NOT NULL,
  `details` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=47;

INSERT INTO `audit_logs` (`id`, `username`, `action`, `details`, `created_at`) VALUES
(1, 'Admin', 'DELETE_PO', 'Menghapus PO #2098765', '2026-09-27 00:40:29'),
(2, 'admin', 'LOGIN_SUCCESS', 'Berhasil masuk ke sistem sebagai admin', '2026-09-27 02:05:11'),
(3, 'admin', 'LOGIN_SUCCESS', 'Berhasil masuk ke sistem sebagai admin', '2026-09-27 17:07:05'),
(4, 'helper', 'LOGIN_SUCCESS', 'Berhasil masuk ke sistem sebagai helper', '2026-09-27 17:07:29'),
(5, 'admin', 'LOGIN_SUCCESS', 'Berhasil masuk ke sistem sebagai admin', '2026-09-27 17:07:50'),
(6, 'System/QC', 'UPDATE_STATUS', 'Mengubah status PO ID #7 menjadi Inspection External', '2026-09-27 17:37:11'),
(7, 'admin', 'LOGIN_SUCCESS', 'Berhasil masuk ke sistem sebagai admin', '2026-09-27 17:41:42'),
(8, 'admin', 'LOGIN', 'User admin (admin) berhasil masuk.', '2026-09-29 22:27:50'),
(9, 'helper', 'LOGIN', 'User helper (helper) berhasil masuk.', '2026-09-29 22:34:03'),
(10, 'admin', 'LOGIN', 'User admin (admin) berhasil masuk.', '2026-09-29 22:34:58'),
(11, 'admin', 'LOGIN', 'User admin (admin) berhasil masuk.', '2026-09-29 22:36:16'),
(12, 'admin', 'LOGIN', 'User admin (admin) berhasil masuk.', '2026-09-29 22:41:13'),
(13, 'admin', 'LOGIN', 'User admin (admin) berhasil masuk.', '2026-09-29 22:47:23'),
(14, 'admin', 'LOGIN', 'User admin (admin) berhasil masuk.', '2026-09-29 22:48:13'),
(15, 'admin', 'LOGIN', 'User admin (admin) berhasil masuk.', '2026-09-29 22:50:51'),
(16, 'admin', 'LOGIN', 'User admin (admin) berhasil masuk.', '2026-09-29 22:51:14'),
(17, 'admin', 'LOGIN', 'User admin (admin) berhasil masuk.', '2026-09-29 22:53:07'),
(18, 'admin', 'LOGIN', 'User admin (admin) berhasil masuk.', '2026-09-29 22:53:25'),
(19, 'admin', 'LOGIN', 'User admin (admin) berhasil masuk.', '2026-09-29 23:16:32'),
(20, 'admin', 'LOGIN', 'User admin (admin) berhasil masuk.', '2026-09-29 23:16:49'),
(21, 'admin', 'LOGIN', 'User admin (admin) berhasil masuk.', '2026-09-29 23:19:32'),
(22, 'admin', 'LOGIN', 'User admin (admin) berhasil masuk.', '2026-09-29 23:19:55'),
(23, 'admin', 'LOGIN', 'User admin (admin) berhasil masuk.', '2026-09-29 23:23:27'),
(24, 'admin', 'CREATE_PO', 'Membuat PO #2121 (Buyer: Hugo Boss, Style: ja)', '2026-09-29 23:23:46'),
(25, 'admin', 'CREATE_PO', 'Membuat PO #w121 (Buyer: Rhone Apparel, Style: 2121)', '2026-09-29 23:24:23'),
(26, 'admin', 'CREATE_PO', 'Membuat PO #2121 (Buyer: PVH Tommy NA, Style: 212)', '2026-09-29 23:24:45'),
(27, 'admin', 'CREATE_PO', 'Membuat PO #213 (Buyer: Hugo Boss, Style: 123)', '2026-09-29 23:32:46'),
(28, 'admin', 'CREATE_PO', 'Membuat PO #sq (Buyer: Hugo Boss, Style: wq)', '2026-09-29 23:39:51'),
(29, 'admin', 'LOGIN', 'User admin (admin) berhasil masuk.', '2026-09-29 23:41:17'),
(30, 'admin', 'LOGIN', 'User admin (admin) berhasil masuk.', '2026-09-29 23:48:05'),
(31, 'admin', 'CREATE_PO', 'Membuat PO #7867271 (Buyer: Hugo Boss, Style: 90212)', '2026-09-29 23:48:37'),
(32, 'admin', 'LOGIN', 'User admin (admin) berhasil masuk.', '2026-09-29 23:58:08'),
(33, 'helper', 'LOGIN', 'User helper (helper) berhasil masuk.', '2026-09-30 00:01:37'),
(34, 'helper', 'RACK_PLACEMENT', 'Update rak warna ID #28 -> 76 (21 Karton)', '2026-09-30 00:02:04'),
(35, 'admin', 'LOGIN', 'User admin (admin) berhasil masuk.', '2026-09-30 00:15:45'),
(36, 'admin', 'DELETE_PO', 'Menghapus PO ID #16', '2026-09-30 00:15:50'),
(37, 'admin', 'DELETE_PO', 'Menghapus PO ID #15', '2026-09-30 00:15:52'),
(38, 'admin', 'DELETE_PO', 'Menghapus PO ID #14', '2026-09-30 00:15:54'),
(39, 'admin', 'DELETE_PO', 'Menghapus PO ID #13', '2026-09-30 00:15:57'),
(40, 'admin', 'DELETE_PO', 'Menghapus PO ID #12', '2026-09-30 00:15:59'),
(41, 'admin', 'DELETE_PO', 'Menghapus PO ID #11', '2026-09-30 00:16:01'),
(42, 'admin', 'CREATE_PO', 'Membuat PO #232 (Buyer: Dillard\'s, Style: 211)', '2026-09-30 00:20:08'),
(43, 'admin', 'LOGIN', 'User admin (admin) berhasil masuk.', '2026-09-30 00:26:04'),
(44, 'admin', 'CREATE_USER', 'Membuat akun user baru adminall (admin)', '2026-09-30 00:34:52'),
(45, 'admin', 'LOGIN', 'User admin (admin) berhasil masuk.', '2026-09-30 00:35:53'),
(46, 'admin', 'DELETE_USER', 'Menghapus akun ID #3', '2026-09-30 00:36:02');

-- --------------------------------------------------------
-- BACKFILL qty_in
-- Data lama dibuat sebelum kolom qty_in ada. Supaya total karton masuk di UI
-- tidak 0 padahal po_colors sudah berisi stok fisik, akumulasi carton_qty
-- lama disalin ke purchase_orders.qty_in. Hanya untuk baris yang masih 0,
-- jadi PO yang sudah punya mutasi karton tidak tersentuh.
-- --------------------------------------------------------

UPDATE `purchase_orders` po
JOIN (
  SELECT `po_id`, SUM(`carton_qty`) AS total
  FROM `po_colors`
  WHERE `po_id` IS NOT NULL
  GROUP BY `po_id`
) c ON c.`po_id` = po.`id`
SET po.`qty_in` = c.`total`
WHERE po.`qty_in` = 0;

COMMIT;

-- ============================================================================
-- MIGRASI UNTUK DATABASE YANG SUDAH TERISI (jangan import file ini ke sana!)
-- File ini untuk install baru. Bila DB sudah ada isinya, jalankan perintah di
-- bawah ini manual (blok ini sengaja dikomentari). Urutannya penting.
-- ============================================================================
--
-- -- 1. Kolom wajib untuk endpoint tracking karton (penyebab 500 di /api/cartons/*)
-- ALTER TABLE `purchase_orders`
--   ADD COLUMN `qty_in` int(11) NOT NULL DEFAULT 0 AFTER `buyer_logo`,
--   ADD COLUMN `qty_out` int(11) NOT NULL DEFAULT 0 AFTER `qty_in`;
--
-- -- 2. Status & kolom legacy
-- ALTER TABLE `purchase_orders`
--   MODIFY `status` varchar(50) NOT NULL DEFAULT 'Pending',
--   MODIFY `total_qty` int(11) NOT NULL DEFAULT 0;
--
-- -- 3. Bersihkan NULL pada po_colors SEBELUM dipaksa NOT NULL
-- UPDATE `po_colors` SET `carton_qty` = 0 WHERE `carton_qty` IS NULL;
-- UPDATE `po_colors` SET `total_qty`  = 0 WHERE `total_qty` IS NULL;
-- UPDATE `po_colors` SET `rack_location` = '' WHERE `rack_location` IS NULL;
-- UPDATE `po_colors` SET `helper_name` = '' WHERE `helper_name` IS NULL;
-- ALTER TABLE `po_colors`
--   MODIFY `total_qty` int(11) NOT NULL DEFAULT 0,
--   MODIFY `carton_qty` int(11) NOT NULL DEFAULT 0,
--   MODIFY `rack_location` varchar(50) NOT NULL DEFAULT '',
--   MODIFY `helper_name` varchar(100) NOT NULL DEFAULT '';
--
-- -- 4. buyers.name (diisi server.js saat upsert logo)
-- ALTER TABLE `buyers` MODIFY `name` varchar(255) NOT NULL DEFAULT '';
--
-- -- 5. users.fullname tidak dipakai server.js (permanen: DROP COLUMN)
-- ALTER TABLE `users` DROP COLUMN `fullname`;
--
-- -- 6. Tabel mati
-- DROP TABLE IF EXISTS `warehouse_placements`;
--
-- -- 7. Tabel carton_movements (bila belum ada) + FK-nya
-- CREATE TABLE IF NOT EXISTS `carton_movements` (
--   `id` int(11) NOT NULL AUTO_INCREMENT,
--   `po_id` int(11) NOT NULL,
--   `type` enum('IN','OUT') NOT NULL,
--   `quantity` int(11) NOT NULL,
--   `reason` varchar(100) DEFAULT NULL,
--   `notes` text DEFAULT NULL,
--   `recorded_by` int(11) DEFAULT NULL,
--   `recorded_at` timestamp NOT NULL DEFAULT current_timestamp(),
--   PRIMARY KEY (`id`),
--   KEY `idx_po_id` (`po_id`),
--   KEY `idx_recorded_by` (`recorded_by`),
--   CONSTRAINT `carton_movements_ibfk_1` FOREIGN KEY (`po_id`) REFERENCES `purchase_orders` (`id`) ON DELETE CASCADE,
--   CONSTRAINT `carton_movements_ibfk_2` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
--
-- -- 8. Backfill qty_in dari stok fisik lama (aman diulang)
-- UPDATE `purchase_orders` po
-- JOIN (SELECT `po_id`, SUM(`carton_qty`) AS total FROM `po_colors` WHERE `po_id` IS NOT NULL GROUP BY `po_id`) c
--   ON c.`po_id` = po.`id`
-- SET po.`qty_in` = c.`total`
-- WHERE po.`qty_in` = 0;
--
-- ============================================================================

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
