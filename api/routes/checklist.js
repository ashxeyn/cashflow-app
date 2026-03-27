const router = require('express').Router();
const db = require('../db');

// GET current checklist
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM checklist ORDER BY id ASC');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST replace checklist (called when logging income)
router.post('/reset', async (req, res) => {
  try {
    const { items } = req.body;
    await db.query('DELETE FROM checklist');
    if (items && items.length) {
      const values = items.map((i) => [i.id, i.label, i.amount, 0]);
      await db.query('INSERT INTO checklist (item_id, label, amount, checked) VALUES ?', [values]);
    }
    const [rows] = await db.query('SELECT * FROM checklist ORDER BY id ASC');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH toggle a checklist item
router.patch('/:itemId/toggle', async (req, res) => {
  try {
    const { itemId } = req.params;
    await db.query(
      'UPDATE checklist SET checked = NOT checked WHERE item_id = ?',
      [itemId]
    );
    const [rows] = await db.query('SELECT * FROM checklist ORDER BY id ASC');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
