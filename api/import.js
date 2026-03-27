require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function importDb() {
  console.log('Connecting to Aiven...');
  const sslConfig = { ca: fs.readFileSync(path.join(__dirname, 'ca.pem')) };
  
  const connection = await mysql.createConnection({
    uri: process.env.DATABASE_URL,
    ssl: sslConfig,
    multipleStatements: true
  });

  console.log('Connected! Reading SQL file...');
  const sql = fs.readFileSync(path.join(__dirname, '..', 'clean_aiven_import.sql'), 'utf-8');
  
  console.log('Executing SQL...');
  await connection.query(sql);
  
  console.log('Import successful!');
  await connection.end();
}

importDb().catch(e => {
  console.error('Import failed:', e);
  process.exit(1);
});
