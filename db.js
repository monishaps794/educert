// db.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "database.sqlite");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Students table
  // Students table
db.run(`
  CREATE TABLE IF NOT EXISTS students (
    usn TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    dob TEXT NOT NULL,
    email TEXT,
    branch TEXT,
    year_of_passing TEXT,
    address TEXT
  )
`);


  // Certificate applications table
  db.run(`
    CREATE TABLE IF NOT EXISTS certificate_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usn TEXT NOT NULL,
      certificate_type TEXT NOT NULL,
      copy_type TEXT NOT NULL,
      email TEXT,
      status TEXT NOT NULL,
      payment_status TEXT NOT NULL,
      document_path TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (usn) REFERENCES students(usn)
    )
  `);

  // Admins table
  db.run(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);

  // 🔐 REGISTER YOUR ADMIN HERE
  // Change 'adminuser' and 'Admin@123' to whatever you want
  db.run(
    `INSERT OR IGNORE INTO admins (username, password) VALUES
      ('adminuser', 'Admin@123')
    `
  );

  // Optional: seed some students for testing
  db.run(
    `INSERT OR IGNORE INTO students (usn, name, dob) VALUES
      ('4NI21CS001', 'Monisha', '2003-05-10'),
      ('4NI21CS002', 'Student Two', '2003-01-15'),
      ('4NI21CS003', 'Student Three', '2002-12-01')
    `
  );
});

module.exports = db;
