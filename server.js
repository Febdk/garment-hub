require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();
app.use(express.json());

// ── Security Headers (#6) ───────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

// ── Rate Limiter untuk Login (#6 — Proteksi Brute Force) ────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error:
      "Terlalu banyak percobaan login dari IP ini. Silakan coba lagi setelah 15 menit.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── JWT Secret ──────────────────────────────────────────────────────
const JWT_SECRET =
  process.env.JWT_SECRET || "CHANGE_ME_use_a_strong_random_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";

// ── CORS (#5) ───────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "https://garment-hub.netlify.app",
    ];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        allowedOrigins.includes("*")
      ) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} tidak diizinkan oleh CORS`));
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.static(path.join(__dirname, "public")));

// ── Database Connection Pool (#4) ───────────────────────────────────
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "garment_warehouse",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  ssl:
    process.env.DB_SSL === "true"
      ? { minVersion: "TLSv1.2", rejectUnauthorized: true }
      : undefined,
});

const db = pool.promise();

// ── Initial Connection Test ─────────────────────────────────────────
(async () => {
  try {
    await db.query("SELECT 1");
    console.log("✅ Berhasil terhubung ke Database MySQL Gudang (Pool)!");
    await seedDefaultAccounts();
  } catch (err) {
    console.error("❌ Gagal konek database MySQL:", err.message);
  }
})();

// ── Seed Default Accounts ───────────────────────────────────────────
async function seedDefaultAccounts() {
  try {
    const [existing] = await db.query("SELECT id FROM users LIMIT 1");
    if (existing.length === 0) {
      const adminPass = process.env.ADMIN_INITIAL_PASSWORD || "Admin@Gcwh2026!";
      const helperPass =
        process.env.HELPER_INITIAL_PASSWORD || "Helper@Gcwh2026!";

      const adminHash = await bcrypt.hash(adminPass, 12);
      const helperHash = await bcrypt.hash(helperPass, 12);

      await db.query(
        `INSERT IGNORE INTO users (id, username, password, role, full_name, fullname) VALUES
         (1, 'admin', ?, 'Admin', 'Administrator Utama', 'Admin'),
         (2, 'helper', ?, 'Helper', 'Helper Boy Warehouse', 'Helper')`,
        [adminHash, helperHash],
      );
      console.log("📌 Akun default berhasil dibuat.");
    }
  } catch (err) {
    if (err.code !== "ER_NO_SUCH_TABLE") {
      console.error("Gagal seed akun default:", err.message);
    }
  }
}

// ── JWT Middleware (#1) ─────────────────────────────────────────────
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ error: "Akses ditolak. Token tidak ditemukan." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res
      .status(403)
      .json({ error: "Token tidak valid atau sudah kadaluarsa." });
  }
}

// Role-based authorization middleware (Case-insensitive)
function authorizeRole(...roles) {
  return (req, res, next) => {
    const userRole =
      req.user && req.user.role ? req.user.role.toLowerCase() : "";
    const allowedRoles = roles.map((r) => r.toLowerCase());

    if (!req.user || !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: `Akses ditolak. Hanya role ${roles.join(" / ")} yang diizinkan.`,
      });
    }
    next();
  };
}

// ── Helper Functions ────────────────────────────────────────────────
const clean = (val) => (val === undefined || val === "" ? null : val);
const formatDt = (dt) => {
  if (!dt) return null;
  const str = String(dt);
  return str.includes("T")
    ? str.replace("T", " ").slice(0, 19)
    : str.slice(0, 19);
};

const recordLog = async (username, action, details) => {
  try {
    await db.query(
      `INSERT INTO audit_logs (username, action, details) VALUES (?, ?, ?)`,
      [username || "System", action, details],
    );
  } catch (err) {
    console.error("Gagal merekam audit log:", err.message);
  }
};

// ══════════════════════════════════════════════════════════════════════
// API ENDPOINTS
// ══════════════════════════════════════════════════════════════════════

app.post("/api/login", loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username dan password wajib diisi!" });
    }

    const [results] = await db.query(
      `SELECT id, username, password, role, full_name FROM users WHERE username = ?`,
      [clean(username)],
    );

    if (results.length === 0) {
      return res
        .status(401)
        .json({ error: "Username atau password tidak ditemukan!" });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ error: "Username atau password tidak ditemukan!" });
    }

    const tokenPayload = {
      id: user.id,
      username: user.username,
      role: user.role,
      full_name: user.full_name,
    };
    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    await recordLog(
      user.username,
      "LOGIN",
      `User ${user.username} (${user.role}) berhasil masuk.`,
    );

    res.json({
      message: "Login Berhasil!",
      token,
      user: tokenPayload,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Buyer Endpoints (Disesuaikan dengan kolom buyer_name & logo_url) ──
app.get("/api/buyers", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT buyer_name AS name, logo_url AS logo FROM buyers ORDER BY buyer_name ASC",
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put(
  "/api/buyers/logo",
  authenticateToken,
  authorizeRole("Admin", "admin"),
  async (req, res) => {
    try {
      const { buyer_name, logo_url } = req.body;
      const [existing] = await db.query(
        "SELECT id FROM buyers WHERE buyer_name = ?",
        [buyer_name],
      );
      if (existing.length > 0) {
        await db.query("UPDATE buyers SET logo_url = ? WHERE buyer_name = ?", [
          logo_url,
          buyer_name,
        ]);
      } else {
        await db.query(
          "INSERT INTO buyers (buyer_name, logo_url, name) VALUES (?, ?, ?)",
          [buyer_name, logo_url, buyer_name],
        );
      }

      await recordLog(
        req.user.username,
        "UPDATE_LOGO",
        `Memperbarui logo untuk buyer ${buyer_name}`,
      );
      res.json({
        message: "Logo Buyer berhasil diperbarui!",
        buyer: { name: buyer_name, logo: logo_url },
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// ── Ambil Semua PO ──────────────────────────────────────────────────
app.get("/api/data", authenticateToken, async (req, res) => {
  try {
    const [pos] = await db.query(
      "SELECT * FROM purchase_orders ORDER BY id DESC",
    );
    if (pos.length === 0) return res.json([]);

    const [colors] = await db.query("SELECT * FROM po_colors");

    const [buyerRows] = await db.query(
      "SELECT buyer_name AS name, logo_url AS logo FROM buyers",
    );
    const buyerMap = {};
    buyerRows.forEach((b) => {
      buyerMap[b.name] = b.logo;
    });

    const result = pos.map((po) => {
      po.colors = colors.filter((c) => c.po_id === po.id);
      po.buyer_logo = po.buyer_logo || buyerMap[po.buyer] || null;
      return po;
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Stats / KPI ─────────────────────────────────────────────────────
app.get("/api/stats", authenticateToken, async (req, res) => {
  try {
    const queryPO = `SELECT COUNT(*) as total_po,
                     SUM(CASE WHEN status = 'Ready to Ship' THEN 1 ELSE 0 END) as ready_to_ship,
                     SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_count,
                     SUM(CASE WHEN status IN ('Inspection Internal', 'Inspection External')
                               OR DATEDIFF(COALESCE(revised_ex_fty_date, ex_fty_date), CURDATE()) <= 2
                         THEN 1 ELSE 0 END) as critical_count,
                     SUM(CASE WHEN revised_ex_fty_date IS NOT NULL THEN 1 ELSE 0 END) as revised_shipment_count
                     FROM purchase_orders`;
    const queryColors = `SELECT SUM(total_qty) as total_target_cartons, SUM(carton_qty) as total_actual_cartons FROM po_colors`;

    const [poStats] = await db.query(queryPO);
    const [colorStats] = await db.query(queryColors);

    res.json({
      total_po: poStats[0].total_po || 0,
      ready_to_ship: poStats[0].ready_to_ship || 0,
      pending_count: poStats[0].pending_count || 0,
      critical_count: poStats[0].critical_count || 0,
      revised_shipment_count: poStats[0].revised_shipment_count || 0,
      total_target_cartons: colorStats[0].total_target_cartons || 0,
      total_actual_cartons: colorStats[0].total_actual_cartons || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Tambah PO Baru (Admin Only) ─────────────────────────────────────
app.post(
  "/api/po",
  authenticateToken,
  authorizeRole("Admin", "admin"),
  async (req, res) => {
    try {
      const { buyer, po_number, style_code, ex_fty_date, buyer_logo, colors } =
        req.body;

      let logoUrl = buyer_logo;
      if (!logoUrl) {
        const [buyerRow] = await db.query(
          "SELECT logo_url FROM buyers WHERE buyer_name = ?",
          [buyer],
        );
        logoUrl = buyerRow.length > 0 ? buyerRow[0].logo_url : null;
      }

      const [result] = await db.query(
        `INSERT INTO purchase_orders (buyer, po_number, style_code, ex_fty_date, buyer_logo, status) VALUES (?, ?, ?, ?, ?, 'Pending')`,
        [
          clean(buyer),
          clean(po_number),
          clean(style_code),
          clean(ex_fty_date),
          clean(logoUrl),
        ],
      );

      const poId = result.insertId;

      if (colors && colors.length > 0) {
        const colorValues = colors.map((c) => [
          poId,
          c.color_code,
          c.total_qty || 0,
          c.carton_qty || 0,
          c.rack_location || "",
          c.helper_name || "",
        ]);
        await db.query(
          `INSERT INTO po_colors (po_id, color_code, total_qty, carton_qty, rack_location, helper_name) VALUES ?`,
          [colorValues],
        );
        await recordLog(
          req.user.username,
          "CREATE_PO",
          `Membuat PO #${po_number} (Buyer: ${buyer}, Style: ${style_code})`,
        );
        res.json({
          message: "PO & Breakdown Warna Berhasil Disimpan!",
          id: poId,
        });
      } else {
        await recordLog(
          req.user.username,
          "CREATE_PO",
          `Membuat PO #${po_number} tanpa warna`,
        );
        res.json({ message: "PO Berhasil Disimpan tanpa warna!", id: poId });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// ── Edit PO (Admin Only — dengan Database Transaction) ──────────────
app.put(
  "/api/po/:id",
  authenticateToken,
  authorizeRole("Admin", "admin"),
  async (req, res) => {
    const conn = await pool.promise().getConnection();
    try {
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

      await conn.beginTransaction();

      await conn.query(
        `UPDATE purchase_orders SET
        buyer = ?, po_number = ?, style_code = ?, ex_fty_date = ?, status = ?, buyer_logo = ?,
        inspection_internal_by = ?, inspection_internal_at = ?,
        inspection_external_by = ?, inspection_external_at = ?,
        revised_ex_fty_date = ?, shipment_note = ?
        WHERE id = ?`,
        [
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
        ],
      );

      if (colors && Array.isArray(colors)) {
        await conn.query(`DELETE FROM po_colors WHERE po_id = ?`, [poId]);

        if (colors.length > 0) {
          const colorValues = colors.map((c) => [
            poId,
            c.color_code,
            c.total_qty || 0,
            c.carton_qty || 0,
            c.rack_location || "",
            c.helper_name || "",
          ]);
          await conn.query(
            `INSERT INTO po_colors (po_id, color_code, total_qty, carton_qty, rack_location, helper_name) VALUES ?`,
            [colorValues],
          );
        }
      }

      await conn.commit();

      await recordLog(
        req.user.username,
        "UPDATE_PO",
        `Memperbarui PO #${po_number} ID #${poId}`,
      );
      res.json({ message: "Data PO Berhasil Diperbarui!" });
    } catch (err) {
      await conn.rollback();
      res.status(500).json({ error: err.message });
    } finally {
      conn.release();
    }
  },
);

// ── Update Status & Inspection ──────────────────────────────────────
app.put("/api/po/:id/status", authenticateToken, async (req, res) => {
  try {
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

    await db.query(query, params);

    await recordLog(
      req.user.username,
      "UPDATE_STATUS",
      `Update status PO ID #${req.params.id} -> ${status}`,
    );
    res.json({
      message: "Status Milestone & Detail Inspeksi Berhasil Diupdate!",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Helper Placement ────────────────────────────────────────────────
app.post("/api/color-placement", authenticateToken, async (req, res) => {
  try {
    const { color_id, carton_qty, rack_location, helper_name } = req.body;
    await db.query(
      `UPDATE po_colors SET carton_qty = ?, rack_location = ?, helper_name = ? WHERE id = ?`,
      [clean(carton_qty), clean(rack_location), clean(helper_name), color_id],
    );

    await recordLog(
      req.user.username,
      "RACK_PLACEMENT",
      `Update rak warna ID #${color_id} -> ${rack_location} (${carton_qty} Karton)`,
    );
    res.json({ message: "Posisi Rak Warna Berhasil Diupdate!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Hapus PO (Admin Only) ───────────────────────────────────────────
app.delete(
  "/api/po/:id",
  authenticateToken,
  authorizeRole("Admin", "admin"),
  async (req, res) => {
    try {
      await db.query(`DELETE FROM purchase_orders WHERE id = ?`, [
        req.params.id,
      ]);
      await recordLog(
        req.user.username,
        "DELETE_PO",
        `Menghapus PO ID #${req.params.id}`,
      );
      res.json({ message: "PO Berhasil Dihapus!" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// ── Audit Trail Logs (Admin Only) ───────────────────────────────────
app.get(
  "/api/logs",
  authenticateToken,
  authorizeRole("Admin", "admin"),
  async (req, res) => {
    try {
      const [logs] = await db.query(
        "SELECT * FROM audit_logs ORDER BY id DESC LIMIT 100",
      );
      res.json(logs);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// ── User Management (Admin Only) ─────────────────────────────────
app.get(
  "/api/users",
  authenticateToken,
  authorizeRole("Admin", "admin"),
  async (req, res) => {
    try {
      const [users] = await db.query(
        "SELECT id, username, role, full_name, created_at FROM users ORDER BY id DESC",
      );
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

app.post(
  "/api/users",
  authenticateToken,
  authorizeRole("Admin", "admin"),
  async (req, res) => {
    try {
      const { username, password, role, full_name } = req.body;
      const rawPassword = password || "Temp@12345";
      const hashedPassword = await bcrypt.hash(rawPassword, 12);

      const [result] = await db.query(
        `INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)`,
        [
          clean(username),
          hashedPassword,
          clean(role) || "helper",
          clean(full_name),
        ],
      );

      await recordLog(
        req.user.username,
        "CREATE_USER",
        `Membuat akun user baru ${username} (${role})`,
      );
      res.json({ message: "Akun User Berhasil Dibuat!", id: result.insertId });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

app.put(
  "/api/users/:id",
  authenticateToken,
  authorizeRole("Admin", "admin"),
  async (req, res) => {
    try {
      const userId = req.params.id;
      const { username, password, role, full_name } = req.body;

      let query = `UPDATE users SET username = ?, role = ?, full_name = ?`;
      let params = [clean(username), clean(role), clean(full_name)];

      if (password && password.trim() !== "") {
        const hashedPassword = await bcrypt.hash(password.trim(), 12);
        query += `, password = ?`;
        params.push(hashedPassword);
      }

      query += ` WHERE id = ?`;
      params.push(userId);

      await db.query(query, params);
      await recordLog(
        req.user.username,
        "UPDATE_USER",
        `Memperbarui data akun ID #${userId}`,
      );
      res.json({ message: "Data akun berhasil diperbarui!" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

app.delete(
  "/api/users/:id",
  authenticateToken,
  authorizeRole("Admin", "admin"),
  async (req, res) => {
    try {
      await db.query(`DELETE FROM users WHERE id = ?`, [req.params.id]);
      await recordLog(
        req.user.username,
        "DELETE_USER",
        `Menghapus akun ID #${req.params.id}`,
      );
      res.json({ message: "Akun berhasil dihapus!" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// ── Verify Token Endpoint ───────────────────────────────────────────
app.get("/api/verify-token", authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// =========================================================================
// API TRACKING KARTON (GARMENT HUB V6)
// =========================================================================

// 1. Catat Karton Masuk (Update PO Global + Update po_colors Spesifik)
app.post("/api/cartons/in", authenticateToken, async (req, res) => {
  const { po_id, color_id, quantity, notes } = req.body;
  const recorded_by = req.user.id;

  if (!po_id || !quantity) {
    return res.status(400).json({ error: "po_id dan quantity wajib diisi" });
  }

  try {
    // 1. Update total qty_in di tabel purchase_orders
    await db.query(
      "UPDATE purchase_orders SET qty_in = qty_in + ? WHERE id = ?",
      [quantity, po_id],
    );

    // 2. Update carton_qty di tabel po_colors secara spesifik jika color_id dikirim
    if (color_id) {
      await db.query(
        "UPDATE po_colors SET carton_qty = carton_qty + ? WHERE id = ?",
        [quantity, color_id],
      );
    }

    // 3. Rekam jejak di carton_movements
    await db.query(
      "INSERT INTO carton_movements (po_id, type, quantity, reason, notes, recorded_by) VALUES (?, ?, ?, ?, ?, ?)",
      [po_id, "IN", quantity, "Karton Masuk", notes || "", recorded_by || null],
    );

    await recordLog(
      req.user.username,
      "CARTON_IN",
      `Mencatat ${quantity} karton masuk untuk PO ID #${po_id}${color_id ? ` (Color ID #${color_id})` : ""}`,
    );

    res.json({ success: true, message: "Karton masuk berhasil dicatat" });
  } catch (err) {
    console.error("Error carton in:", err);
    res.status(500).json({ error: "Gagal mencatat karton masuk" });
  }
});

// 2. Catat Karton Keluar (Update PO Global + Update po_colors Spesifik)
app.post("/api/cartons/out", authenticateToken, async (req, res) => {
  const { po_id, color_id, quantity, reason, notes } = req.body;
  const recorded_by = req.user.id;

  if (!po_id || !quantity) {
    return res.status(400).json({ error: "po_id dan quantity wajib diisi" });
  }

  try {
    // 1. Update total qty_out di tabel purchase_orders
    await db.query(
      "UPDATE purchase_orders SET qty_out = qty_out + ? WHERE id = ?",
      [quantity, po_id],
    );

    // 2. Kurangi carton_qty di tabel po_colors secara spesifik jika color_id dikirim
    if (color_id) {
      await db.query(
        "UPDATE po_colors SET carton_qty = GREATEST(0, carton_qty - ?) WHERE id = ?",
        [quantity, color_id],
      );
    }

    // 3. Rekam jejak di carton_movements
    await db.query(
      "INSERT INTO carton_movements (po_id, type, quantity, reason, notes, recorded_by) VALUES (?, ?, ?, ?, ?, ?)",
      [
        po_id,
        "OUT",
        quantity,
        reason || "Karton Keluar",
        notes || "",
        recorded_by || null,
      ],
    );

    await recordLog(
      req.user.username,
      "CARTON_OUT",
      `Mencatat ${quantity} karton keluar untuk PO ID #${po_id}${color_id ? ` (Color ID #${color_id})` : ""}`,
    );

    res.json({ success: true, message: "Karton keluar berhasil dicatat" });
  } catch (err) {
    console.error("Error carton out:", err);
    res.status(500).json({ error: "Gagal mencatat karton keluar" });
  }
});

// 3. Ambil Riwayat Pergerakan Karton (Timeline)
app.get("/api/po/:id/movements", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT c.*, u.username as recorded_by_name 
             FROM carton_movements c 
             LEFT JOIN users u ON c.recorded_by = u.id 
             WHERE c.po_id = ? 
             ORDER BY c.recorded_at DESC`,
      [id],
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching movements:", err);
    res.status(500).json({ error: "Gagal mengambil riwayat karton" });
  }
});

// ── SPA Fallback ────────────────────────────────────────────────────
app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ── Start Server ────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan aman di http://localhost:${PORT}`);
});
