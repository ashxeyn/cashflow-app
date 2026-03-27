const router = require('express').Router();
const db = require('../db');

// GET monthly credit progress + total debt
router.get('/monthly', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT credit_paid_this_month, credit_month_reset, credit_total_debt, credit_debt_remaining FROM app_state WHERE id = 1'
    );
    const row = rows[0];
    const now = new Date();

    // Auto-reset monthly counter if new month
    const lastReset = row.credit_month_reset ? new Date(row.credit_month_reset) : null;
    const isNewMonth = !lastReset ||
      lastReset.getMonth() !== now.getMonth() ||
      lastReset.getFullYear() !== now.getFullYear();

    if (isNewMonth) {
      await db.query(
        'UPDATE app_state SET credit_paid_this_month = 0, credit_month_reset = ? WHERE id = 1',
        [now.toISOString().split('T')[0]]
      );
      row.credit_paid_this_month = 0;
    }

    const day = now.getDate();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const weeksLeft = Math.max(1, Math.ceil((lastDay - day) / 7));
    const monthlyMin = 500;
    const paidThisMonth = parseFloat(row.credit_paid_this_month) || 0;
    const stillNeeded = Math.max(0, monthlyMin - paidThisMonth);
    const suggestedWeekly = Math.ceil(stillNeeded / weeksLeft);
    const creditTotalDebt = parseFloat(row.credit_total_debt) || 4000;
    const creditPaidTotal = parseFloat(row.credit_debt_remaining) || 0;

    res.json({
      paidThisMonth,
      stillNeeded,
      suggestedWeekly,
      weeksLeft,
      monthlyMin,
      creditTotalDebt,
      creditPaidTotal,
      creditRemaining: Math.max(0, creditTotalDebt - creditPaidTotal),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH update total credit debt amount (also resets paid amount for new debt)
router.patch('/total', async (req, res) => {
  try {
    const { total, resetPaid } = req.body;
    if (!total || isNaN(total) || total <= 0)
      return res.status(400).json({ error: 'Invalid total' });

    if (resetPaid) {
      // New debt — reset both total and paid amount
      await db.query(
        'UPDATE app_state SET credit_total_debt = ?, credit_debt_remaining = 0, credit_paid_this_month = 0 WHERE id = 1',
        [total]
      );
    } else {
      // Just updating the total (e.g. correcting a typo)
      await db.query('UPDATE app_state SET credit_total_debt = ? WHERE id = 1', [total]);
    }
    res.json({ success: true, creditTotalDebt: total });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
