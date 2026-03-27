const router = require('express').Router();
const db = require('../db');

const FIELD_MAP = {
  contingency: 'contingency_total',
  savings:     'sobra_balance',
  monthsary:   'monthsary_total',
};

// POST /api/spend
router.post('/', async (req, res) => {
  const { fund, amount, note } = req.body;
  const field = FIELD_MAP[fund];
  if (!field) return res.status(400).json({ error: 'Invalid fund' });
  if (!amount || isNaN(amount) || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query(`SELECT ${field} FROM app_state WHERE id = 1`);
    const current = parseFloat(rows[0][field]) || 0;
    if (amount > current) {
      await conn.rollback();
      return res.status(400).json({ error: `Insufficient funds. Available: ₱${current.toFixed(2)}` });
    }

    await conn.query(
      `UPDATE app_state SET ${field} = ${field} - ? WHERE id = 1`,
      [amount]
    );

    await conn.query(
      `INSERT INTO transactions (type, label, amount, meta) VALUES ('spend', ?, ?, ?)`,
      [
        note || `Spent from ${fund}`,
        amount,
        JSON.stringify({ fund, note }),
      ]
    );

    await conn.commit();
    const [updated] = await conn.query('SELECT * FROM app_state WHERE id = 1');
    res.json({ success: true, state: updated[0] });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: e.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
