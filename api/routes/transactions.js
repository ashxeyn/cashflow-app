const router = require('express').Router();
const db = require('../db');

// GET transaction history with optional date filters
// Query params: ?from=YYYY-MM-DD&to=YYYY-MM-DD&type=income|spend|no_income
router.get('/', async (req, res) => {
  try {
    let sql = 'SELECT * FROM transactions WHERE 1=1';
    const params = [];

    if (req.query.from) {
      sql += ' AND DATE(created_at) >= ?';
      params.push(req.query.from);
    }
    if (req.query.to) {
      sql += ' AND DATE(created_at) <= ?';
      params.push(req.query.to);
    }
    if (req.query.type) {
      sql += ' AND type = ?';
      params.push(req.query.type);
    }

    sql += ' ORDER BY created_at DESC LIMIT 200';

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST log a transaction
router.post('/', async (req, res) => {
  try {
    const { type, label, amount, meta } = req.body;
    const [result] = await db.query(
      'INSERT INTO transactions (type, label, amount, meta) VALUES (?, ?, ?, ?)',
      [type, label, amount, meta ? JSON.stringify(meta) : null]
    );
    res.json({ id: result.insertId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
