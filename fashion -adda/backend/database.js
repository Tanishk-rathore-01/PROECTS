const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const DBSOURCE = "fashion-adda.db";

let db;

try {
  db = new sqlite3.Database(DBSOURCE, (err) => {
      if (err) {
        // Cannot open database
        console.error("Error opening database:", err.message);
        throw err;
      } else {
          console.log('Connected to the SQLite database.');
          try {
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name text, 
                email text UNIQUE, 
                password text, 
                CONSTRAINT email_unique UNIQUE (email)
                )`,
            (err) => {
                if (err) {
                    // Table already created
                    console.error("Error creating table:", err.message);
                } else {
                    // Table just created, check if default users exist before inserting
                    const salt = bcrypt.genSaltSync(10);
                    const insert = 'INSERT INTO users (name, email, password) VALUES (?,?,?)';

                    // Check for admin user
                    db.get("SELECT email FROM users WHERE email = ?", ["admin@example.com"], (err, row) => {
                        if (err) {
                            console.error("Error checking for admin user:", err.message);
                            return;
                        }
                        if (!row) {
                            db.run(insert, ["admin", "admin@example.com", bcrypt.hashSync("admin123456", salt)]);
                        }
                    });

                    // Check for regular user
                    db.get("SELECT email FROM users WHERE email = ?", ["user@example.com"], (err, row) => {
                        if (err) {
                            console.error("Error checking for user:", err.message);
                            return;
                        }
                        if (!row) {
                            db.run(insert, ["user", "user@example.com", bcrypt.hashSync("user123456", salt)]);
                        }
                    });
                }
            });
          } catch (e) {
            console.error("Error creating table:", e.message);
          }
      }
  });
} catch (e) {
  console.error("Error connecting to database:", e.message);
  throw e;
}

module.exports = db;
