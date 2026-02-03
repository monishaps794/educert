const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const nodemailer = require("nodemailer");
const db = require("./db");

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================= DB MIGRATION (RUNS SAFELY) =================
db.serialize(() => {
  db.run(`ALTER TABLE students ADD COLUMN email TEXT`, () => {});
  db.run(`ALTER TABLE students ADD COLUMN branch TEXT`, () => {});
  db.run(`ALTER TABLE students ADD COLUMN year_of_passing TEXT`, () => {});
  db.run(`ALTER TABLE students ADD COLUMN address TEXT`, () => {});
});
// =============================================================

// ================= EMAIL CONFIG =================
const EMAIL_USER = "monishaps794@gmail.com";
const EMAIL_PASS = "irxxpiyyhhmaejkc";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  tls: { rejectUnauthorized: false },
});
// =================================================

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Serve static frontend
app.use(express.static(path.join(__dirname, "public")));

// Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + "-" + file.originalname),
});
const upload = multer({ storage });

// Certificate types
const CERTIFICATE_TYPES = [
  "Duplicate Marks Card",
  "Transcript",
  "Course Completion Certificate",
  "Grade Correction",
  "No Backlog Certificate",
  "Backlog Summary Certificate",
  "Grade to Percentage Conversion Certificate",
  "Other",
];

// Ping
app.get("/api/ping", (req, res) => res.json({ message: "OK from backend" }));
app.get("/api/certificates", (req, res) => res.json(CERTIFICATE_TYPES));

// ================= ADMIN LOGIN =================
app.post("/api/auth/admin-login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: "Username and password required" });

  db.get(
    "SELECT id, username FROM admins WHERE username = ? AND password = ?",
    [username, password],
    (err, row) => {
      if (err) return res.status(500).json({ message: "Internal server error" });
      if (!row) return res.status(401).json({ message: "Invalid admin credentials" });
      res.json({ id: row.id, username: row.username });
    }
  );
});

// ================= ADMIN REGISTER =================
app.post("/api/admin/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: "Username and password required" });

  db.run(
    `INSERT INTO admins (username, password) VALUES (?, ?)`,
    [username, password],
    function (err) {
      if (err) {
        if (err.message.includes("UNIQUE"))
          return res.status(409).json({ message: "Admin already exists" });
        return res.status(500).json({ message: "Failed to register admin" });
      }
      res.status(201).json({ message: "Admin registered", adminId: this.lastID });
    }
  );
});

// ================= STUDENT LOGIN =================
app.post("/api/auth/student-login", (req, res) => {
  const { usn, dob } = req.body;
  if (!usn || !dob)
    return res.status(400).json({ message: "USN and DOB required" });

  db.get(
    "SELECT usn, name FROM students WHERE usn = ? AND dob = ?",
    [usn, dob],
    (err, row) => {
      if (err) return res.status(500).json({ message: "Internal server error" });
      if (!row) return res.status(401).json({ message: "Invalid USN or DOB" });
      res.json(row);
    }
  );
});

// ================= SAVE STUDENT DETAILS =================
app.post("/api/student/details", (req, res) => {
  const { usn, name, email, branch, yearOfPassing, address } = req.body;
  if (!usn || !name)
    return res.status(400).json({ message: "USN and Name are required" });

  db.run(
    `UPDATE students
     SET name = ?, email = ?, branch = ?, year_of_passing = ?, address = ?
     WHERE usn = ?`,
    [name, email, branch, yearOfPassing, address, usn],
    err => {
      if (err) return res.status(500).json({ message: "Failed to save details" });
      res.json({ message: "Student details saved successfully" });
    }
  );
});

// ================= CREATE APPLICATION =================
app.post("/api/applications", (req, res) => {
  const { usn, certificateType, copyType, email } = req.body;
  if (!usn || !certificateType || !copyType)
    return res.status(400).json({ message: "Missing fields" });

  db.run(
    `INSERT INTO certificate_applications
     (usn, certificate_type, copy_type, email, status, payment_status, created_at)
     VALUES (?, ?, ?, ?, 'PENDING', 'SUCCESS', ?)`,
    [usn, certificateType, copyType, email || null, new Date().toISOString()],
    function (err) {
      if (err) return res.status(500).json({ message: "Failed to create application" });
      res.status(201).json({ id: this.lastID });
    }
  );
});

// ================= ADMIN: GET APPLICATIONS WITH ADDRESS =================
app.get("/api/admin/applications", (req, res) => {
  db.all(
    `
    SELECT ca.id, ca.usn, ca.certificate_type AS certificateType,
           ca.copy_type AS copyType, ca.email, ca.status,
           ca.payment_status AS paymentStatus,
           ca.document_path AS documentPath,
           ca.created_at AS createdAt,
           s.address
    FROM certificate_applications ca
    LEFT JOIN students s ON ca.usn = s.usn
    ORDER BY ca.created_at DESC
    `,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Failed to fetch applications" });
      res.json(rows);
    }
  );
});

// ================= ADMIN COMPLETE APPLICATION =================
app.post("/api/admin/applications/:id/complete", upload.single("document"), async (req, res) => {
  try {
    const { email, copyType } = req.body;
    const file = req.file;
    const appId = req.params.id;

    if (copyType === "Hardcopy") {
      await transporter.sendMail({
        from: `"College Certificate Portal" <${EMAIL_USER}>`,
        to: email,
        subject: "Certificate Posted Successfully",
        text: "Your certificate has been posted to your registered address.",
      });

      db.run(
        `UPDATE certificate_applications SET status='COMPLETED' WHERE id=?`,
        [appId],
        () => res.json({ message: "Hardcopy confirmation sent" })
      );
      return;
    }

    await transporter.sendMail({
      from: `"College Certificate Portal" <${EMAIL_USER}>`,
      to: email,
      subject: "Your Certificate",
      text: "Please find your certificate attached.",
      attachments: [{ path: path.join(uploadDir, file.filename) }],
    });

    db.run(
      `UPDATE certificate_applications
       SET email=?, status='COMPLETED', document_path=?
       WHERE id=?`,
      [email, file.filename, appId],
      () => res.json({ message: "Certificate emailed successfully" })
    );
  } catch (err) {
    res.status(500).json({ message: "Failed to complete application" });
  }
});

// Serve uploads
app.use("/uploads", express.static(uploadDir));

// ================= SERVER START LINKS =================
app.listen(PORT, () => {
  console.log("=======================================");
  console.log(`Server running on http://localhost:${PORT}`);
  console.log("");
  console.log("▶ Student Portal:");
  console.log(`http://localhost:${PORT}/student.html`);
  console.log("");
  console.log("▶ Admin Dashboard:");
  console.log(`http://localhost:${PORT}/admin.html`);
  console.log("");
  console.log("▶ Status Tracking:");
  console.log(`http://localhost:${PORT}/status.html`);
  console.log("=======================================");
});
