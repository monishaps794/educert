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

// ================= DB MIGRATION (SAFE) =================
db.serialize(() => {
  db.run(`ALTER TABLE students ADD COLUMN email TEXT`, () => {});
  db.run(`ALTER TABLE students ADD COLUMN branch TEXT`, () => {});
  db.run(`ALTER TABLE students ADD COLUMN year_of_passing TEXT`, () => {});
  db.run(`ALTER TABLE students ADD COLUMN address TEXT`, () => {});

  db.run(`ALTER TABLE certificate_applications ADD COLUMN copies INTEGER`, () => {});
  db.run(`ALTER TABLE certificate_applications ADD COLUMN other_reason TEXT`, () => {});
  db.run(`ALTER TABLE certificate_applications ADD COLUMN other_description TEXT`, () => {});
});

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

// ================= FILE UPLOAD =================
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

app.use(express.static(path.join(__dirname, "public")));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + "-" + file.originalname),
});
const upload = multer({ storage });

// ================= CERTIFICATES =================
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

app.get("/api/ping", (req, res) => res.json({ message: "OK" }));
app.get("/api/certificates", (req, res) => res.json(CERTIFICATE_TYPES));

// ================= ADMIN LOGIN =================
app.post("/api/auth/admin-login", (req, res) => {
  const { username, password } = req.body;

  db.get(
    "SELECT id, username FROM admins WHERE username=? AND password=?",
    [username, password],
    (err, row) => {
      if (err) return res.status(500).json({ message: "Server error" });
      if (!row) return res.status(401).json({ message: "Invalid admin credentials" });
      res.json(row);
    }
  );
});
// ================= OTP LOGIN =================
const otpStore = {}; // { email: { otp, expires } }

app.post("/api/auth/send-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email required" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  otpStore[email] = {
    otp,
    expires: Date.now() + 5 * 60 * 1000, // 5 mins
  };

  try {
    await transporter.sendMail({
      from: `"College Certificate Portal" <${EMAIL_USER}>`,
      to: email,
      subject: "Your OTP for Login",
      text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
    });

    res.json({ message: "OTP sent" });
  } catch (err) {
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

app.post("/api/auth/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  const record = otpStore[email];
  if (!record) return res.status(400).json({ message: "OTP not found" });

  if (record.expires < Date.now())
    return res.status(400).json({ message: "OTP expired" });

  if (record.otp !== otp)
    return res.status(400).json({ message: "Invalid OTP" });

  delete otpStore[email];
  res.json({ message: "OTP verified" });
});


// ================= STUDENT LOGIN =================
app.post("/api/auth/student-login", (req, res) => {
  const { usn, dob } = req.body;

  db.get(
    "SELECT usn, name FROM students WHERE usn=? AND dob=?",
    [usn, dob],
    (err, row) => {
      if (err) return res.status(500).json({ message: "Server error" });
      if (!row) return res.status(401).json({ message: "Invalid USN or DOB" });
      res.json(row);
    }
  );
});

// ================= SAVE STUDENT DETAILS =================
app.post("/api/student/details", (req, res) => {
  const { usn, name, email, branch, yearOfPassing, address } = req.body;

  db.run(
    `UPDATE students
     SET name=?, email=?, branch=?, year_of_passing=?, address=?
     WHERE usn=?`,
    [name, email, branch, yearOfPassing, address, usn],
    (err) => {
      if (err) return res.status(500).json({ message: "Failed to save details" });
      res.json({ message: "Student details saved" });
    }
  );
});

// ================= CREATE APPLICATION =================
app.post("/api/applications", async (req, res) => {
  const {
    usn,
    certificateType,
    copyType,
    email,
    copies,
    otherReason,
    otherDescription,
  } = req.body;

  if (!usn || !certificateType || !copyType || !email) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const createdAt = new Date().toISOString();

  db.run(
    `INSERT INTO certificate_applications
     (usn, certificate_type, copy_type, email, copies, other_reason, other_description,
      status, payment_status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', 'SUCCESS', ?)`,
    [
      usn,
      certificateType,
      copyType,
      email,
      copies || 1,
      otherReason || null,
      otherDescription || null,
      createdAt,
    ],
    async function (err) {
      if (err) {
        console.error("CREATE APP ERROR:", err);
        return res.status(500).json({ message: "Failed to create application" });
      }

      try {
        await transporter.sendMail({
          from: `"College Certificate Portal" <${EMAIL_USER}>`,
          to: email,
          subject: "Application Submitted Successfully",
          text: `Your application has been submitted.\nApplication ID: ${this.lastID}`,
        });
      } catch (e) {
        console.error("Email error:", e);
      }

      res.status(201).json({ id: this.lastID });
    }
  );
});

// ================= STATUS TRACKING =================
app.get("/api/applications/:id/status", (req, res) => {
  const appId = req.params.id;

  db.get(
    `
    SELECT ca.*, s.name, s.address
    FROM certificate_applications ca
    LEFT JOIN students s ON ca.usn = s.usn
    WHERE ca.id = ?
    `,
    [appId],
    (err, row) => {
      if (err) return res.status(500).json({ message: "Server error" });
      if (!row) return res.status(404).json({ message: "Application not found" });
      res.json(row);
    }
  );
});

// ================= ADMIN LIST =================
app.get("/api/admin/applications", (req, res) => {
  db.all(
    `
    SELECT
      ca.id,
      ca.usn,
      ca.certificate_type AS certificateType,
      ca.copy_type AS copyType,
      ca.copies,
      ca.other_reason AS otherReason,
      ca.other_description AS otherDescription,
      ca.email,
      ca.status,
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
      if (err) {
        console.error("ADMIN LIST ERROR:", err);
        return res.status(500).json({ message: "Server error" });
      }
      res.json(rows);
    }
  );
});


// ================= ADMIN COMPLETE =================
app.post(
  "/api/admin/applications/:id/complete",
  upload.single("document"),
  async (req, res) => {
    const appId = req.params.id;
    const { copyType } = req.body;
    const file = req.file;

    db.get(
      "SELECT email FROM certificate_applications WHERE id=?",
      [appId],
      async (err, row) => {
        if (!row) return res.status(500).json({ message: "Email not found" });

        try {
          if (copyType !== "Hardcopy" && !file) {
            return res.status(400).json({ message: "Document required" });
          }

          await transporter.sendMail({
            from: EMAIL_USER,
            to: row.email,
            subject: "Certificate Update",
            text: "Your certificate has been processed.",
          });

          db.run(
            `UPDATE certificate_applications
             SET status='COMPLETED', document_path=?
             WHERE id=?`,
            [file ? file.filename : null, appId],
            () => res.json({ message: "Completed" })
          );
        } catch {
          res.status(500).json({ message: "Completion failed" });
        }
      }
    );
  }
);

// ================= ADMIN REJECT =================
app.post("/api/admin/applications/:id/reject", async (req, res) => {
  const { reason } = req.body;
  const appId = req.params.id;

  if (!reason) return res.status(400).json({ message: "Reason required" });

  db.get(
    "SELECT email FROM certificate_applications WHERE id=?",
    [appId],
    async (err, row) => {
      if (!row) return res.status(500).json({ message: "Email not found" });

      await transporter.sendMail({
        from: EMAIL_USER,
        to: row.email,
        subject: "Application Rejected",
        text: `Reason:\n${reason}`,
      });

      db.run(
        `UPDATE certificate_applications SET status='REJECTED' WHERE id=?`,
        [appId],
        () => res.json({ message: "Rejected" })
      );
    }
  );
});

app.use("/uploads", express.static(uploadDir));

// ================= START =================
app.listen(PORT, () => {
  console.log("=======================================");
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Student: http://localhost:${PORT}/student.html`);
  console.log(`Admin:   http://localhost:${PORT}/admin.html`);
  console.log(`Status:  http://localhost:${PORT}/status.html`);
  console.log("=======================================");
});
