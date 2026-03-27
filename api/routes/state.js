const router = require('express').Router();
const db = require('../db');

// GET full app state — auto-creates default row if missing
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM app_state WHERE id = 1');
    if (rows.length === 0) {
      await db.query(
        `INSERT INTO app_state (id, phase, sobra_balance, contingency_total, monthsary_total, credit_debt_remaining, checklist_active)
         VALUES (1, 1, 0.00, 0.00, 0.00, 0.00, 0)`
      );
      const [newRows] = await db.query('SELECT * FROM app_state WHERE id = 1');
      return res.json(newRows[0]);
    }
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH update app state fields
router.patch('/', async (req, res) => {
  try {
    const fields = req.body;
    const keys = Object.keys(fields);
    if (!keys.length) return res.status(400).json({ error: 'No fields provided' });

    const set = keys.map((k) => `${k} = ?`).join(', ');
    const values = keys.map((k) => fields[k]);
    await db.query(`UPDATE app_state SET ${set} WHERE id = 1`, values);
    const [rows] = await db.query('SELECT * FROM app_state WHERE id = 1');
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
