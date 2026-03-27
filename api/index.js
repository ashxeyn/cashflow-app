require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/state',        require('./routes/state'));
app.use('/api/checklist',    require('./routes/checklist'));
app.use('/api/savings',      require('./routes/savings'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/allocate-income', require('./routes/allocate'));
app.use('/api/credit',       require('./routes/credit'));
app.use('/api/spend',        require('./routes/spend'));
app.use('/api/gemini',       require('./routes/gemini'));

// Temporary route for factory reset (safe as it's on your private backend)
app.get('/api/hard-reset-db', async (req, res) => {
  try {
    const db = require('./db');
    const conn = await db.getConnection();
    await conn.beginTransaction();
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    await conn.query('TRUNCATE TABLE transactions');
    await conn.query('TRUNCATE TABLE checklist');
    await conn.query('TRUNCATE TABLE savings_goals');
    await conn.query('TRUNCATE TABLE gemini_messages');
    await conn.query(`
      UPDATE app_state SET sobra_balance=0, contingency_total=0, monthsary_total=0, 
      credit_debt_remaining=0, checklist_active=0, phase=1, fifteenth_start_date=NULL, 
      credit_paid_this_month=0, fifteenth_months_done=0, credit_month_reset=CURDATE()
      WHERE id=1
    `);
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    await conn.commit();
    conn.release();
    res.send('<h1>✅ Database Reset Successful!</h1><p>You can now go back to your app and refresh.</p>');
  } catch (err) {
    res.status(500).send('<h1>❌ Reset Failed</h1><p>' + err.message + '</p>');
  }
});

app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`CashFlow API running on http://0.0.0.0:${PORT}`);
});
