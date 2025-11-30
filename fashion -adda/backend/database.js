const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const DB_FILE = path.join(__dirname, 'fashion-adda.db');

const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    console.error('Failed to open DB:', err.message);
    throw err;
  }
  console.log('Connected to SQLite DB at', DB_FILE);
});

const init = () => {
  const createUsers = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT
    );
  `;

  const createCart = `
    CREATE TABLE IF NOT EXISTS cart (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      product_id INTEGER,
      quantity INTEGER DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
  `;

  db.run(createUsers, (err) => {
    if (err) {
      console.error('Error creating users table:', err.message);
      return;
    }

    // Insert demo users only if not present
    const salt = bcrypt.genSaltSync(10);
    const insert = 'INSERT OR IGNORE INTO users (id, name, email, password) VALUES (?, ?, ?, ?)';

    db.run(insert, [1, 'admin', 'admin@example.com', bcrypt.hashSync('admin123456', salt)]);
    db.run(insert, [2, 'user', 'user@example.com', bcrypt.hashSync('user123456', salt)]);
  });

  db.run(createCart, (err) => {
    if (err) {
      console.error('Error creating cart table:', err.message);
    }
  });
};

init();

module.exports = db;