const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "caboose.proxy.rlwy.net",
  user: "root",
  password: "ifmicCVEBUIPHofIZjCRKLkpZUwWlwAK",
  database: "railway",
  port: 48059,   // VERY IMPORTANT
  ssl: {
    rejectUnauthorized: false
  }
});

db.connect(err => {
  if (err) {
    console.error("Database connection failed:", err);
  } else {
    console.log("MySQL Connected");
  }
   db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
      )
    `);

    // Create Inventory Table
    db.query(`
      CREATE TABLE IF NOT EXISTS inventory (
        sku VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        price DECIMAL(10,2) NOT NULL
      )
    `);

    console.log("Tables created or already exist");
  
});

module.exports = db;