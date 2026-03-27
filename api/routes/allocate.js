const router = require('express').Router();
const db = require('../db');

// POST /api/allocate-income
router.post('/', async (req, res) => {
  const conn = await db.getConnection();
  try {
    const {
      income, monthsary, contingency, midMonthDebt,
      lunchCost, creditPayment, sobraAllocation, weekKey, noIncome,
    } = req.body;

    await conn.beginTransaction();

    // Only update balances if there was actual income
    if (!noIncome) {
      await conn.query(`
        UPDATE app_state SET
          monthsary_total       = monthsary_total + ?,
          contingency_total     = contingency_total + ?,
          credit_debt_remaining = credit_debt_remaining + ?,
          credit_paid_this_month = credit_paid_this_month + ?,
          sobra_balance         = sobra_balance + ?
        WHERE id = 1
      `, [monthsary || 0, contingency || 0, creditPayment || 0, creditPayment || 0, sobraAllocation || 0]);
    }

    // Always log the week — even zero income weeks
    await conn.query(
      `INSERT INTO transactions (type, label, amount, meta, week_key) VALUES (?, ?, ?, ?, ?)`,
      [
        noIncome ? 'no_income' : 'income',
        noIncome ? `No income week (${weekKey})` : `Weekly income ₱${income} allocated`,
        income || 0,
        JSON.stringify({ monthsary, contingency, midMonthDebt, lunchCost, creditPayment, sobraAllocation }),
        weekKey || null,
      ]
    );

    await conn.commit();

    const [rows] = await conn.query('SELECT * FROM app_state WHERE id = 1');
    res.json({ success: true, state: rows[0] });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: e.message });
  } finally {
    conn.release();
  }
});

// GET logged week keys for calendar dots
router.get('/logged-weeks', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT week_key, type FROM transactions WHERE week_key IS NOT NULL ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/allocate-income/reset-all — factory reset as requested by user
router.post('/reset-all', async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    // Reset state to original initial values
    await conn.query(`
      UPDATE app_state SET
        phase = 1,
        sobra_balance = 0,
        contingency_total = 0,
        monthsary_total = 0,
        credit_debt_remaining = 0,
        checklist_active = 0,
        fifteenth_start_date = NULL,
        credit_total_debt = 4000.00,
        fifteenth_months_done = 0,
        credit_paid_this_month = 0,
        credit_month_reset = CURDATE()
      WHERE id = 1
    `);
    // Clear dynamic tables (using correct table names)
    await conn.query('DELETE FROM transactions');
    await conn.query('DELETE FROM checklist'); 
    await conn.query('DELETE FROM savings_goals');
    await conn.query('DELETE FROM gemini_messages');

    await conn.commit();
    res.json({ success: true });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: e.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
