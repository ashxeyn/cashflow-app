const router = require('express').Router();
const db = require('../db');

// GET all messages
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM gemini_messages ORDER BY created_at ASC');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST a new message
router.post('/', async (req, res) => {
  try {
    const { role, text } = req.body;
    const [result] = await db.query(
      'INSERT INTO gemini_messages (role, text) VALUES (?, ?)',
      [role, text]
    );
    const [rows] = await db.query('SELECT * FROM gemini_messages WHERE id = ?', [result.insertId]);
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE all messages (clear chat)
router.delete('/', async (req, res) => {
  try {
    await db.query('DELETE FROM gemini_messages');
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
