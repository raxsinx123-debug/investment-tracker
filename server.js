const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'inv_tracker_secret_2024';

app.use(cors());
app.use(express.json());

// Serve React build
const buildPath = path.join(__dirname, '../frontend/build');
app.use(express.static(buildPath));

// Auth middleware
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Snapshot helper
function saveSnapshot(userId) {
  const invs = db.prepare('SELECT invested, current_value FROM investments WHERE user_id = ?').all(userId);
  const totalInvested = invs.reduce((s, i) => s + i.invested, 0);
  const totalValue = invs.reduce((s, i) => s + i.current_value, 0);
  const today = new Date().toISOString().slice(0, 10);
  const existing = db.prepare('SELECT id FROM portfolio_snapshots WHERE user_id = ? AND snapshot_date = ?').get(userId, today);
  if (existing) {
    db.prepare('UPDATE portfolio_snapshots SET total_invested = ?, total_value = ? WHERE id = ?').run(totalInvested, totalValue, existing.id);
  } else {
    db.prepare('INSERT INTO portfolio_snapshots (user_id, total_invested, total_value, snapshot_date) VALUES (?, ?, ?, ?)').run(userId, totalInvested, totalValue, today);
  }
}

// ─── AUTH ───────────────────────────────────────────────────────────────────

app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  try {
    const hash = bcrypt.hashSync(password, 10);
    const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
    const result = stmt.run(username, hash);
    const token = jwt.sign({ id: result.lastInsertRowid, username }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, username });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(400).json({ error: 'Username already taken' });
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, username: user.username });
});

// ─── INVESTMENTS ────────────────────────────────────────────────────────────

app.get('/api/investments', auth, (req, res) => {
  const invs = db.prepare('SELECT * FROM investments WHERE user_id = ? ORDER BY date DESC').all(req.user.id);
  res.json(invs);
});

app.post('/api/investments', auth, (req, res) => {
  const { name, category, invested, current_value, date, notes } = req.body;
  if (!name || invested == null || current_value == null || !date) return res.status(400).json({ error: 'Missing fields' });
  const result = db.prepare('INSERT INTO investments (user_id, name, category, invested, current_value, date, notes) VALUES (?, ?, ?, ?, ?, ?, ?)').run(req.user.id, name, category || 'Other', invested, current_value, date, notes || '');
  saveSnapshot(req.user.id);
  res.json(db.prepare('SELECT * FROM investments WHERE id = ?').get(result.lastInsertRowid));
});

app.put('/api/investments/:id', auth, (req, res) => {
  const { name, category, invested, current_value, date, notes } = req.body;
  const inv = db.prepare('SELECT * FROM investments WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!inv) return res.status(404).json({ error: 'Not found' });
  db.prepare('UPDATE investments SET name=?, category=?, invested=?, current_value=?, date=?, notes=?, updated_at=CURRENT_TIMESTAMP WHERE id=?').run(name, category, invested, current_value, date, notes || '', req.params.id);
  saveSnapshot(req.user.id);
  res.json(db.prepare('SELECT * FROM investments WHERE id = ?').get(req.params.id));
});

app.delete('/api/investments/:id', auth, (req, res) => {
  const inv = db.prepare('SELECT * FROM investments WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!inv) return res.status(404).json({ error: 'Not found' });
  db.prepare('DELETE FROM investments WHERE id = ?').run(req.params.id);
  saveSnapshot(req.user.id);
  res.json({ success: true });
});

// ─── SNAPSHOTS ──────────────────────────────────────────────────────────────

app.get('/api/snapshots', auth, (req, res) => {
  const snaps = db.prepare('SELECT * FROM portfolio_snapshots WHERE user_id = ? ORDER BY snapshot_date ASC').all(req.user.id);
  res.json(snaps);
});

// ─── SIP ────────────────────────────────────────────────────────────────────

app.get('/api/sip', auth, (req, res) => {
  res.json(db.prepare('SELECT * FROM sip_entries WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id));
});

app.post('/api/sip', auth, (req, res) => {
  const { fund_name, monthly_amount, start_date, instalments_paid } = req.body;
  if (!fund_name || !monthly_amount || !start_date) return res.status(400).json({ error: 'Missing fields' });
  const result = db.prepare('INSERT INTO sip_entries (user_id, fund_name, monthly_amount, start_date, instalments_paid) VALUES (?, ?, ?, ?, ?)').run(req.user.id, fund_name, monthly_amount, start_date, instalments_paid || 0);
  res.json(db.prepare('SELECT * FROM sip_entries WHERE id = ?').get(result.lastInsertRowid));
});

app.put('/api/sip/:id', auth, (req, res) => {
  const { fund_name, monthly_amount, start_date, instalments_paid } = req.body;
  const entry = db.prepare('SELECT * FROM sip_entries WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!entry) return res.status(404).json({ error: 'Not found' });
  db.prepare('UPDATE sip_entries SET fund_name=?, monthly_amount=?, start_date=?, instalments_paid=?, updated_at=CURRENT_TIMESTAMP WHERE id=?').run(fund_name, monthly_amount, start_date, instalments_paid, req.params.id);
  res.json(db.prepare('SELECT * FROM sip_entries WHERE id = ?').get(req.params.id));
});

app.delete('/api/sip/:id', auth, (req, res) => {
  db.prepare('DELETE FROM sip_entries WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ success: true });
});

// ─── GOALS ──────────────────────────────────────────────────────────────────

app.get('/api/goals', auth, (req, res) => {
  res.json(db.prepare('SELECT * FROM goals WHERE user_id = ? ORDER BY target_date ASC').all(req.user.id));
});

app.post('/api/goals', auth, (req, res) => {
  const { title, target_amount, target_date } = req.body;
  if (!title || !target_amount || !target_date) return res.status(400).json({ error: 'Missing fields' });
  const result = db.prepare('INSERT INTO goals (user_id, title, target_amount, target_date) VALUES (?, ?, ?, ?)').run(req.user.id, title, target_amount, target_date);
  res.json(db.prepare('SELECT * FROM goals WHERE id = ?').get(result.lastInsertRowid));
});

app.delete('/api/goals/:id', auth, (req, res) => {
  db.prepare('DELETE FROM goals WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ success: true });
});

// ─── EXPORT ─────────────────────────────────────────────────────────────────

app.get('/api/export/csv', auth, (req, res) => {
  const invs = db.prepare('SELECT * FROM investments WHERE user_id = ? ORDER BY date DESC').all(req.user.id);
  const headers = 'Name,Category,Invested,Current Value,Return,Return %,Date,Notes\n';
  const rows = invs.map(i => {
    const ret = i.current_value - i.invested;
    const pct = i.invested > 0 ? ((ret / i.invested) * 100).toFixed(2) : '0';
    return `"${i.name}","${i.category}",${i.invested},${i.current_value},${ret.toFixed(2)},${pct}%,"${i.date}","${i.notes}"`;
  }).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="investments.csv"');
  res.send(headers + rows);
});

// Catch-all: serve React app for any non-API route
app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
