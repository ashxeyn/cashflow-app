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

app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`CashFlow API running on http://0.0.0.0:${PORT}`);
});
