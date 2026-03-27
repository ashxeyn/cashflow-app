const router = require('express').Router();
const db = require('../db');
const { v4: uuidv4 } = require('crypto').randomUUID ? { v4: () => require('crypto').randomUUID() } : require('crypto');

// GET all savings goals
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM savings_goals ORDER BY created_at ASC');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST add a new savings goal
router.post('/', async (req, res) => {
  try {
    const { label, goal_amount } = req.body;
    const id = require('crypto').randomUUID();
    await db.query(
      'INSERT INTO savings_goals (id, label, goal_amount, funded_amount) VALUES (?, ?, ?, 0)',
      [id, label, goal_amount]
    );
    const [rows] = await db.query('SELECT * FROM savings_goals WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH fund a savings goal
router.patch('/:id/fund', async (req, res) => {
  try {
    const { amount } = req.body;
    await db.query(
      'UPDATE savings_goals SET funded_amount = LEAST(goal_amount, funded_amount + ?) WHERE id = ?',
      [amount, req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM savings_goals WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH withdraw from a savings goal — money is SPENT (not returned to savings)
router.patch('/:id/withdraw', async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { amount } = req.body;
    const [rows] = await conn.query('SELECT * FROM savings_goals WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Goal not found' });
    const funded = parseFloat(rows[0].funded_amount) || 0;
    if (amount > funded) return res.status(400).json({ error: `Only ₱${funded.toFixed(2)} saved in this goal` });

    await conn.beginTransaction();
    // Just reduce the funded amount — money is spent, not returned to savings
    await conn.query(
      'UPDATE savings_goals SET funded_amount = funded_amount - ? WHERE id = ?',
      [amount, req.params.id]
    );
    await conn.query(
      `INSERT INTO transactions (type, label, amount, meta) VALUES ('spend', ?, ?, ?)`,
      [`Spent from goal: ${rows[0].label}`, amount, JSON.stringify({ goalId: req.params.id })]
    );
    await conn.commit();

    const [updated] = await conn.query('SELECT * FROM savings_goals WHERE id = ?', [req.params.id]);
    res.json({ goal: updated[0] });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: e.message });
  } finally {
    conn.release();
  }
});

// PATCH return money from goal back to savings balance (changed mind)
router.patch('/:id/return', async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { amount } = req.body;
    const [rows] = await conn.query('SELECT * FROM savings_goals WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Goal not found' });
    const funded = parseFloat(rows[0].funded_amount) || 0;
    if (amount > funded) return res.status(400).json({ error: `Only ₱${funded.toFixed(2)} saved in this goal` });

    await conn.beginTransaction();
    await conn.query('UPDATE savings_goals SET funded_amount = funded_amount - ? WHERE id = ?', [amount, req.params.id]);
    await conn.query('UPDATE app_state SET sobra_balance = sobra_balance + ? WHERE id = 1', [amount]);
    await conn.commit();

    const [updated] = await conn.query('SELECT * FROM savings_goals WHERE id = ?', [req.params.id]);
    const [state]   = await conn.query('SELECT sobra_balance FROM app_state WHERE id = 1');
    res.json({ goal: updated[0], sobraBalance: parseFloat(state[0].sobra_balance) });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: e.message });
  } finally {
    conn.release();
  }
});

// PATCH edit label and/or goal amount
router.patch('/:id', async (req, res) => {
  try {
    const { label, goal_amount } = req.body;
    await db.query(
      'UPDATE savings_goals SET label = ?, goal_amount = ? WHERE id = ?',
      [label, goal_amount, req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM savings_goals WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE a savings goal
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM savings_goals WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
