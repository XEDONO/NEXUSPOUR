const mysql = require('mysql2/promise');

// Use environment variables for production, fallback to local for development
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nexus_pour',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool;

async function initializeDatabase() {
  try {
    pool = mysql.createPool(dbConfig);

    // Test connection
    const connection = await pool.getConnection();
    console.log('Connected to MySQL database!');

    // Create Tables if they don't exist
    // Note: MySQL syntax is slightly different (e.g., AUTO_INCREMENT instead of AUTOINCREMENT)

    await connection.query(`
      CREATE TABLE IF NOT EXISTS fridges (
        id VARCHAR(255) PRIMARY KEY,
        location VARCHAR(255) NOT NULL,
        expectedMin REAL NOT NULL,
        expectedMax REAL NOT NULL
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS temp_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        date VARCHAR(255) NOT NULL,
        fridge_id VARCHAR(255) NOT NULL,
        reading VARCHAR(255),
        pass TINYINT(1),
        FOREIGN KEY (fridge_id) REFERENCES fridges(id) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS checklists (
          id VARCHAR(255) PRIMARY KEY,
          text TEXT NOT NULL,
          frequency VARCHAR(50) NOT NULL,
          section VARCHAR(255) NOT NULL,
          type VARCHAR(50) DEFAULT 'general' NOT NULL,
          completions LONGTEXT
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS checklist_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          date_range VARCHAR(255),
          type VARCHAR(255),
          total INT,
          completed INT,
          saved_at VARCHAR(255)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS inventory (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        qty INT NOT NULL DEFAULT 0,
        unit VARCHAR(50),
        location VARCHAR(255),
        category VARCHAR(255),
        par INT NOT NULL DEFAULT 0,
        lastUpdated VARCHAR(255),
        lastOrderedAt VARCHAR(255),
        restockCount INT NOT NULL DEFAULT 0
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS restock_lists (
        id VARCHAR(255) PRIMARY KEY,
        createdAt VARCHAR(255) NOT NULL
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS restock_list_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        restock_list_id VARCHAR(255) NOT NULL,
        inventory_item_id VARCHAR(255),
        item_name VARCHAR(255) NOT NULL,
        urgency VARCHAR(50) NOT NULL DEFAULT 'medium',
        notes TEXT,
        FOREIGN KEY (restock_list_id) REFERENCES restock_lists(id) ON DELETE CASCADE,
        FOREIGN KEY (inventory_item_id) REFERENCES inventory(id) ON DELETE SET NULL
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS allergens (
          id INT AUTO_INCREMENT PRIMARY KEY,
          dish VARCHAR(255) NOT NULL,
          allergens TEXT NOT NULL
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS sections (
        name VARCHAR(255) PRIMARY KEY
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS archives (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255),
        data LONGTEXT,
        date VARCHAR(255)
      )
    `);

    connection.release();
    console.log('Database schema verified.');
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}

initializeDatabase();

// Export a function to execute queries
module.exports = {
  query: (sql, params) => pool.query(sql, params),
  execute: (sql, params) => pool.execute(sql, params)
};
