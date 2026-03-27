const db = require('./db');

async function reset() {
  console.log('Resetting Database via verified db.js pool...');
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    // Disable FK checks to truncate tables
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    
    await connection.query('TRUNCATE TABLE transactions');
    await connection.query('TRUNCATE TABLE checklist');
    await connection.query('TRUNCATE TABLE savings_goals');
    await connection.query('TRUNCATE TABLE gemini_messages');
    
    // Reset state to initial startup values
    await connection.query(`
      UPDATE app_state SET 
        sobra_balance = 0, 
        contingency_total = 0, 
        monthsary_total = 0, 
        credit_debt_remaining = 0, 
        checklist_active = 0,
        phase = 1,
        fifteenth_start_date = NULL,
        credit_paid_this_month = 0,
        fifteenth_months_done = 0
      WHERE id = 1
    `);
    
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    await connection.commit();
    
    console.log('Database reset to fresh state successfully!');
  } catch (e) {
    await connection.rollback();
    console.error('Reset failed:', e);
  } finally {
    connection.release();
    process.exit(0);
  }
}

reset();
