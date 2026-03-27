const mysql = require('mysql2/promise');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const sslConfig = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL
  ? { ca: fs.readFileSync(path.join(__dirname, 'ca.pem')) }
  : null;

const dbConfig = process.env.DATABASE_URL
  ? { uri: process.env.DATABASE_URL, ssl: sslConfig }
  : {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    };

const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
