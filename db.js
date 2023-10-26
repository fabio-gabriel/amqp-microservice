const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const dbPath = path.join(__dirname, "subscriptions.db"); // Specify the absolute path to your database

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err);
  } else {
    console.log("Connected to the database");
  }
});

// Create the Client and Subscription tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS client (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      subscription_id INTEGER
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS subscription (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      status_id INTEGER DEFAULT 1, -- 0 for canceled, 1 for active
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES client(id)
    )
  `);

  db.run(`
  CREATE TABLE IF NOT EXISTS activity_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subscription_id INTEGER,
    status_id INTEGER,
    type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subscription_id) REFERENCES subscription(id)
  )
`);

  db.run(`
  CREATE TRIGGER IF NOT EXISTS subscription_update_trigger
  AFTER UPDATE ON subscription
  BEGIN
    INSERT INTO activity_history (subscription_id, status_id, type, created_at, updated_at)
    SELECT
      OLD.id,
      OLD.status_id,
      CASE
        WHEN OLD.status_id = 1 AND NEW.status_id = 0 THEN 'canceled'
        WHEN OLD.status_id = 0 AND NEW.status_id = 1 THEN 'renewed'
        ELSE NULL
      END,
      OLD.created_at,
      datetime('now')
    WHERE NEW.status_id != OLD.status_id;
  END;
`);

  console.log("Tables created");
});

module.exports = db;
