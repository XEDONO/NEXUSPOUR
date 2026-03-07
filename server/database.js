const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.resolve(__dirname, 'database.db'), { fileMustExist: false });

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS fridges (
      id TEXT PRIMARY KEY,
      location TEXT NOT NULL,
      expectedMin REAL NOT NULL,
      expectedMax REAL NOT NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS temp_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      fridge_id TEXT NOT NULL,
      reading TEXT,
      pass INTEGER,
      FOREIGN KEY (fridge_id) REFERENCES fridges (id) ON DELETE CASCADE
    );
  `);

  // Drop the old table to apply new schema
  db.exec(`DROP TABLE IF EXISTS checklists;`);

  // Recreate the checklists table with a new 'type' column for categorization
  db.exec(`
    CREATE TABLE IF NOT EXISTS checklists (
        id TEXT PRIMARY KEY,
        text TEXT NOT NULL,
        frequency TEXT NOT NULL, /* daily, weekly, monthly */
        section TEXT NOT NULL,   /* e.g., 'Bar', 'Kitchen' */
        type TEXT DEFAULT 'general' NOT NULL, /* opening, closing, general */
        completions TEXT
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS checklist_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date_range TEXT,
        type TEXT,
        total INTEGER,
        completed INTEGER,
        saved_at TEXT
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item TEXT NOT NULL,
        stock INTEGER
    );
  `);

    db.exec(`
    CREATE TABLE IF NOT EXISTS inventory_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        log_data TEXT NOT NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS allergens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dish TEXT NOT NULL,
        allergens TEXT NOT NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS sections (
      name TEXT PRIMARY KEY
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS archives (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      data TEXT,
      date TEXT
    );
  `);

  console.log('Database initialized with new checklist schema.');
}

initializeDatabase();

module.exports = db;
