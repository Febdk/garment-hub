require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(express.json());

// Batasi CORS hanya untuk internal network / local client
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
  }),
);

app.use(express.static(path.join(__dirname, "public")));

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "garment_warehouse",
});

// Auto-Migration untuk kolom tambahan di purchase_orders & pembuatan tabel audit_logs
const ensureColumnsExist = () => {
  const columns = [
    { name: "inspection_internal_by", type: "VARCHAR(100) DEFAULT NULL" },
    { name: "inspection_internal_at", type: "DATETIME DEFAULT NULL" },
    { name: "inspection_external_by", type: "VARCHAR(100) DEFAULT NULL" },
    { name: "inspection_external_at", type: "DATETIME DEFAULT NULL" },
    { name: "revised_ex_fty_date", type: "DATE DEFAULT NULL" },
    { name: "shipment_note", type: "TEXT DEFAULT NULL" },
    { name: "buyer_logo", type: "VARCHAR(255) DEFAULT NULL" },
  ];

  columns.forEach((col) => {
    const alterQuery = `ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`;
    db.query(alterQuery, (err) => {
      if (
        err &&
        err.errno !== 1060 &&
        !err.message.includes("Duplicate column name")
      ) {
        // Silently ignore duplicate column error
      }
    });
  });

  // Pembuatan Tabel Audit Trail Log
  const createAuditTableQuery = `
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) DEFAULT 'System',
      action VARCHAR(100) NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;
  db.query(createAuditTableQuery, (err) => {
    if (err) console.error("Gagal membuat tabel audit_logs:", err);
  });
};

db.connect((err) => {
  if (err) console.error("Gagal konek database:", err);
  else {
    console.log("Berhasil terhubung ke Database MySQL Gudang!");
    ensureColumnsExist();
  }
});

// Helper Sanitizer untuk MySQL2
const clean = (val) => (val === undefined || val === "" ? null : val);
const formatDt = (dt) => {
  if (!dt) return null;
  const str = String(dt);
  return str.includes("T")
    ? str.replace("T", " ").slice(0, 19)
    : str.slice(0, 19);
};

// Helper Validasi Format URL HTTP/HTTPS yang Sah (Mencegah Malicious Injection)
const isValidHttpUrl = (string) => {
  if (!string) return false;
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_) {
    return false;
  }
};

// Helper Pencatatan Log Aktivitas (Audit Trail)
const recordLog = (username, action, details) => {
  const query = `INSERT INTO audit_logs (username, action, details) VALUES (?, ?, ?)`;
  db.query(query, [username || "System", action, details], (err) => {
    if (err) console.error("Gagal mencatat audit log:", err);
  });
};

// Endpoint untuk Mengambil Riwayat Audit Log (Maks 100 record terakhir)
app.get("/api/audit-logs", (req, res) => {
  const query = `SELECT * FROM audit_logs ORDER BY id DESC LIMIT 100`;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Endpoint List Buyer dari Database (Permanen, tidak hilang saat restart)
app.get("/api/buyers", (req, res) => {
  db.query(
    "SELECT buyer_name as name, logo_url as logo FROM buyers",
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    },
  );
});

// Endpoint Update atau Insert Buyer Logo URL ke Database dengan Validasi URL Ketat
app.put("/api/buyers/logo", (req, res) => {
  const { buyer_name, logo_url } = req.body;

  if (!buyer_name || !logo_url) {
    return res
      .status(400)
      .json({ error: "Nama buyer dan URL logo wajib diisi." });
  }

  // Validasi keamanan format URL
  if (!isValidHttpUrl(logo_url)) {
    return res.status(400).json({
      error:
        "Format URL logo tidak valid. Harus menggunakan protokol http:// atau https://",
    });
  }

  const query = `
    INSERT INTO buyers (buyer_name, logo_url) VALUES (?, ?) 
    ON DUPLICATE KEY UPDATE logo_url = ?
  `;
  db.query(
    query,
    [clean(buyer_name), clean(logo_url), clean(logo_url)],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      recordLog("Admin", "UPDATE_LOGO", `Memperbarui logo buyer ${buyer_name}`);
      res.json({ message: "Logo Buyer berhasil diperbarui di Database!" });
    },
  );
});

// 1. API Ambil Semua PO beserta rincian warnanya
app.get("/api/data", (req, res) => {
  const poQuery = `SELECT * FROM purchase_orders ORDER BY id DESC`;
  db.query(poQuery, (err, pos) => {
    if (err) return res.status(500).json({ error: err.message });
    if (pos.length === 0) return res.json([]);

    const colorQuery = `SELECT * FROM po_colors`;
    db.query(colorQuery, (err, colors) => {
      if (err) return res.status(500).json({ error: err.message });

      // Ambil juga mapping logo dari database buyers
      db.query(
        "SELECT buyer_name, logo_url FROM buyers",
        (errBuyer, buyerRows) => {
          const logoMap = {};
          if (!errBuyer) {
            buyerRows.forEach((b) => {
              logoMap[b.buyer_name] = b.logo_url;
            });
          }

          const result = pos.map((po) => {
            po.colors = colors.filter((c) => c.po_id === po.id);
            po.buyer_logo = po.buyer_logo || logoMap[po.buyer] || null;
            return po;
          });

          res.json(result);
        },
      );
    });
  });
});

// API Statistics Summary (KPI)
app.get("/api/stats", (req, res) => {
  const queryPO = `SELECT COUNT(*) as total_po, 
                    SUM(CASE WHEN status = 'Ready to Ship' THEN 1 ELSE 0 END) as ready_to_ship,
                    SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_count,
                    SUM(CASE WHEN status IN ('Inspection Internal', 'Inspection External') 
                              OR DATEDIFF(COALESCE(revised_ex_fty_date, ex_fty_date), CURDATE()) <= 2 
                        THEN 1 ELSE 0 END) as critical_count,
                    SUM(CASE WHEN revised_ex_fty_date IS NOT NULL THEN 1 ELSE 0 END) as revised_shipment_count
                    FROM purchase_orders`;
  const queryColors = `SELECT SUM(total_qty) as total_target_cartons, SUM(carton_qty) as total_actual_cartons FROM po_colors`;

  db.query(queryPO, (err, poStats) => {
    if (err) return res.status(500).json({ error: err.message });
    db.query(queryColors, (err2, colorStats) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({
        total_po: poStats[0].total_po || 0,
        ready_to_ship: poStats[0].ready_to_ship || 0,
        pending_count: poStats[0].pending_count || 0,
        critical_count: poStats[0].critical_count || 0,
        revised_shipment_count: poStats[0].revised_shipment_count || 0,
        total_target_cartons: colorStats[0].total_target_cartons || 0,
        total_actual_cartons: colorStats[0].total_actual_cartons || 0,
      });
    });
  });
});

// 2. API Admin Record: Tambah PO Baru dengan Validasi Input Ketat
app.post("/api/po", (req, res) => {
  const { buyer, po_number, style_code, ex_fty_date, buyer_logo, colors } =
    req.body;

  // Validasi Skema / Kelengkapan Data Utama
  if (!buyer || !po_number || !style_code || !ex_fty_date) {
    return res.status(400).json({
      error:
        "Semua field utama PO (buyer, po_number, style_code, ex_fty_date) wajib diisi.",
    });
  }

  // Validasi Struktur & Tipe Data Breakdown Warna
  if (!Array.isArray(colors) || colors.length === 0) {
    return res.status(400).json({
      error: "Breakdown warna dan kuantitas karton minimal harus ada 1 item.",
    });
  }

  for (const c of colors) {
    if (!c.color_code || isNaN(c.total_qty) || Number(c.total_qty) <= 0) {
      return res.status(400).json({
        error:
          "Kode warna wajib diisi dan total kuantitas karton harus berupa angka lebih dari 0.",
      });
    }
  }

  db.query(
    "SELECT logo_url FROM buyers WHERE buyer_name = ?",
    [buyer],
    (errBuyer, buyerRes) => {
      let resolvedLogo = buyer_logo;
      if (!resolvedLogo && buyerRes && buyerRes.length > 0) {
        resolvedLogo = buyerRes[0].logo_url;
      }

      const poQuery = `INSERT INTO purchase_orders (buyer, po_number, style_code, ex_fty_date, buyer_logo, status) VALUES (?, ?, ?, ?, ?, 'Pending')`;
      db.query(
        poQuery,
        [
          clean(buyer),
          clean(po_number),
          clean(style_code),
          clean(ex_fty_date),
          clean(resolvedLogo),
        ],
        (err, result) => {
          if (err) return res.status(500).json({ error: err.message });

          const poId = result.insertId;

          const colorValues = colors.map((c) => [
            poId,
            c.color_code,
            c.total_qty || 0,
            c.carton_qty || 0,
            c.rack_location || "",
            c.helper_name || "",
          ]);
          const colorQuery = `INSERT INTO po_colors (po_id, color_code, total_qty, carton_qty, rack_location, helper_name) VALUES ?`;

          db.query(colorQuery, [colorValues], (err2) => {
            if (err2) return res.status(500).json({ error: err2.message });
            recordLog(
              "Admin",
              "CREATE_PO",
              `Menambah Master PO #${po_number} (${buyer})`,
            );
            res.json({
              message: "PO & Breakdown Warna Berhasil Disimpan!",
              id: poId,
            });
          });
        },
      );
    },
  );
});

// 3. API Edit Complete PO
app.put("/api/po/:id", (req, res) => {
  const poId = req.params.id;
  const {
    buyer,
    po_number,
    style_code,
    ex_fty_date,
    status,
    buyer_logo,
    inspection_internal_by,
    inspection_internal_at,
    inspection_external_by,
    inspection_external_at,
    revised_ex_fty_date,
    shipment_note,
    colors,
  } = req.body;

  if (!buyer || !po_number || !style_code || !ex_fty_date) {
    return res
      .status(400)
      .json({ error: "Field utama PO tidak boleh kosong." });
  }

  const updatePoQuery = `UPDATE purchase_orders SET 
    buyer = ?, po_number = ?, style_code = ?, ex_fty_date = ?, status = ?, buyer_logo = ?,
    inspection_internal_by = ?, inspection_internal_at = ?,
    inspection_external_by = ?, inspection_external_at = ?,
    revised_ex_fty_date = ?, shipment_note = ?
    WHERE id = ?`;

  const queryParams = [
    clean(buyer),
    clean(po_number),
    clean(style_code),
    clean(ex_fty_date),
    clean(status) || "Pending",
    clean(buyer_logo),
    clean(inspection_internal_by),
    formatDt(inspection_internal_at),
    clean(inspection_external_by),
    formatDt(inspection_external_at),
    clean(revised_ex_fty_date),
    clean(shipment_note),
    poId,
  ];

  db.query(updatePoQuery, queryParams, (err) => {
    if (err) return res.status(500).json({ error: err.message });

    if (colors && Array.isArray(colors)) {
      db.query(`DELETE FROM po_colors WHERE po_id = ?`, [poId], (errDelete) => {
        if (errDelete)
          return res.status(500).json({ error: errDelete.message });

        if (colors.length > 0) {
          const colorValues = colors.map((c) => [
            poId,
            c.color_code,
            c.total_qty || 0,
            c.carton_qty || 0,
            c.rack_location || "",
            c.helper_name || "",
          ]);
          db.query(
            `INSERT INTO po_colors (po_id, color_code, total_qty, carton_qty, rack_location, helper_name) VALUES ?`,
            [colorValues],
            (errInsert) => {
              if (errInsert)
                return res.status(500).json({ error: errInsert.message });
              recordLog(
                "Admin",
                "UPDATE_PO",
                `Memperbarui data PO ID #${poId} (${po_number})`,
              );
              res.json({ message: "Data PO Berhasil Diperbarui!" });
            },
          );
        } else {
          recordLog(
            "Admin",
            "UPDATE_PO",
            `Memperbarui data PO ID #${poId} (${po_number})`,
          );
          res.json({ message: "Data PO Berhasil Diperbarui!" });
        }
      });
    } else {
      recordLog(
        "Admin",
        "UPDATE_PO",
        `Memperbarui data PO ID #${poId} (${po_number})`,
      );
      res.json({ message: "Data PO Berhasil Diperbarui!" });
    }
  });
});

// 4. API Update Status & Detail Inspection / Shipment
app.put("/api/po/:id/status", (req, res) => {
  const {
    status,
    inspector_name,
    inspection_datetime,
    revised_ex_fty_date,
    shipment_note,
  } = req.body;

  let query = `UPDATE purchase_orders SET status = ?`;
  let params = [clean(status)];

  const nowDtStr = new Date().toISOString().slice(0, 19).replace("T", " ");
  const dtFormatted = inspection_datetime
    ? inspection_datetime.replace("T", " ").slice(0, 19)
    : nowDtStr;

  if (status === "Inspection Internal") {
    query += `, inspection_internal_by = ?, inspection_internal_at = ?`;
    params.push(
      clean(inspector_name) || "Tim Inspection Internal",
      dtFormatted,
    );
  } else if (status === "Inspection External") {
    query += `, inspection_external_by = ?, inspection_external_at = ?`;
    params.push(clean(inspector_name) || "Tim Auditor External", dtFormatted);
  }

  if (revised_ex_fty_date) {
    query += `, revised_ex_fty_date = ?, shipment_note = ?`;
    params.push(
      clean(revised_ex_fty_date),
      clean(shipment_note) || "Shipment Dadakan",
    );
  }

  query += ` WHERE id = ?`;
  params.push(req.params.id);

  db.query(query, params, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    recordLog(
      "System/QC",
      "UPDATE_STATUS",
      `Mengubah status PO ID #${req.params.id} menjadi ${status}`,
    );
    res.json({
      message: "Status Milestone & Detail Inspeksi Berhasil Diupdate!",
    });
  });
});

// 5. API Helper Boy: Update Posisi Rak & Qty Fisik per Warna
app.post("/api/color-placement", (req, res) => {
  const { color_id, carton_qty, rack_location, helper_name } = req.body;

  if (!color_id || isNaN(carton_qty) || Number(carton_qty) < 0) {
    return res
      .status(400)
      .json({ error: "ID warna dan kuantitas fisik karton tidak valid." });
  }

  const query = `UPDATE po_colors SET carton_qty = ?, rack_location = ?, helper_name = ? WHERE id = ?`;

  db.query(
    query,
    [clean(carton_qty), clean(rack_location), clean(helper_name), color_id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      recordLog(
        helper_name || "Helper",
        "UPDATE_PLACEMENT",
        `Update rak ${rack_location || "-"} & fisik ${carton_qty} ktn (Warna ID #${color_id})`,
      );
      res.json({ message: "Posisi Rak Warna Berhasil Diupdate!" });
    },
  );
});

// 6. API Admin Record: Hapus PO
app.delete("/api/po/:id", (req, res) => {
  const poId = req.params.id;
  db.query(
    `SELECT po_number FROM purchase_orders WHERE id = ?`,
    [poId],
    (errSel, selRes) => {
      const poNum = selRes && selRes.length > 0 ? selRes[0].po_number : poId;
      db.query(`DELETE FROM purchase_orders WHERE id = ?`, [poId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        recordLog("Admin", "DELETE_PO", `Menghapus PO #${poNum}`);
        res.json({ message: "PO Berhasil Dihapus!" });
      });
    },
  );
});

// ================= AUTHENTICATION & USER MANAGEMENT =================

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username dan password wajib diisi." });
  }

  const query = `SELECT id, username, role, fullname FROM users WHERE username = ? AND password = ?`;
  db.query(query, [clean(username), clean(password)], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) {
      recordLog(
        username,
        "LOGIN_FAILED",
        "Gagal masuk sistem (kredensial salah)",
      );
      return res.status(401).json({ error: "Username atau password salah!" });
    }
    recordLog(
      results[0].username,
      "LOGIN_SUCCESS",
      `Berhasil masuk ke sistem sebagai ${results[0].role}`,
    );
    res.json({ message: "Login berhasil!", user: results[0] });
  });
});

app.get("/api/users", (req, res) => {
  db.query(
    "SELECT id, username, role, fullname, created_at FROM users ORDER BY id DESC",
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    },
  );
});

app.post("/api/users", (req, res) => {
  const { username, password, role, fullname } = req.body;
  if (!username || !password || !fullname) {
    return res.status(400).json({ error: "Semua field akun wajib diisi." });
  }

  const query = `INSERT INTO users (username, password, role, fullname) VALUES (?, ?, ?, ?)`;
  db.query(
    query,
    [
      clean(username),
      clean(password),
      clean(role) || "helper",
      clean(fullname),
    ],
    (err) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).json({ error: "Username sudah digunakan!" });
        }
        return res.status(500).json({ error: err.message });
      }
      recordLog(
        "Admin",
        "CREATE_USER",
        `Membuat akun baru untuk ${username} (${role})`,
      );
      res.json({ message: "Akun berhasil dibuat!" });
    },
  );
});

app.put("/api/users/:id", (req, res) => {
  const userId = req.params.id;
  const { password, fullname, role } = req.body;

  let query = `UPDATE users SET fullname = ?, role = ?`;
  let params = [clean(fullname), clean(role)];

  if (password && password.trim() !== "") {
    query += `, password = ?`;
    params.push(password.trim());
  }

  query += ` WHERE id = ?`;
  params.push(userId);

  db.query(query, params, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    recordLog("Admin", "UPDATE_USER", `Memperbarui data akun ID #${userId}`);
    res.json({ message: "Data akun berhasil diperbarui!" });
  });
});

app.delete("/api/users/:id", (req, res) => {
  db.query(`DELETE FROM users WHERE id = ?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    recordLog("Admin", "DELETE_USER", `Menghapus akun ID #${req.params.id}`);
    res.json({ message: "Akun berhasil dihapus!" });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan aman di http://localhost:${PORT}`);
});
