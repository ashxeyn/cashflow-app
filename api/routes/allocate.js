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

module.exports = router;
