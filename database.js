// ============================================================
// database.js — SQLite database (sqlite3 version)
// ============================================================

const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

// --- Make sure the /data folder exists ---
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// --- Open database ---
const db = new sqlite3.Database(
  path.join(dataDir, "travel.db")
);

// ============================================================
// Create table if it doesn't exist
// ============================================================

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_loc TEXT NOT NULL,
      to_loc TEXT NOT NULL,
      travel_date TEXT NOT NULL,
      note TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
});

// ============================================================
// Insert a new post
// ============================================================

function createPost({ from, to, date, note }) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO posts (from_loc, to_loc, travel_date, note)
      VALUES (?, ?, ?, ?)
    `;

    db.run(sql, [from, to, date, note || ""], function (err) {
      if (err) return reject(err);

      const id = this.lastID;

      db.get(
        `SELECT * FROM posts WHERE id = ?`,
        [id],
        (err, row) => {
          if (err) return reject(err);
          resolve(row);
        }
      );
    });
  });
}

// ============================================================
// Search posts
// ============================================================

function searchPosts({ from, to, date } = {}) {
  return new Promise((resolve, reject) => {

    let sql = `SELECT * FROM posts WHERE 1=1`;
    const params = [];

    if (from && from.trim() !== "") {
      sql += ` AND LOWER(from_loc) LIKE LOWER(?)`;
      params.push(`%${from.trim()}%`);
    }

    if (to && to.trim() !== "") {
      sql += ` AND LOWER(to_loc) LIKE LOWER(?)`;
      params.push(`%${to.trim()}%`);
    }

    if (date && date.trim() !== "") {
      sql += ` AND travel_date = ?`;
      params.push(date.trim());
    }

    sql += ` ORDER BY travel_date ASC, created_at DESC`;

    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

module.exports = {
  createPost,
  searchPosts
};