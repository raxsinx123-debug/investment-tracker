import React, { useEffect, useState } from 'react';
import axios from 'axios';

const fmt = (n) => '₹' + Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
const empty = { title: '', target_amount: '', target_date: '' };

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');

  const load = () => Promise.all([axios.get('/api/goals'), axios.get('/api/investments')]).then(([g, i]) => { setGoals(g.data); setInvestments(i.data); });
  useEffect(() => { load(); }, []);

  const totalValue = investments.reduce((s, i) => s + i.current_value, 0);

  const handleSave = async () => {
    if (!form.title || !form.target_amount || !form.target_date) { setError('Fill all fields'); return; }
    try {
      await axios.post('/api/goals', { ...form, target_amount: parseFloat(form.target_amount) });
      setModal(false); setForm(empty); load();
    } catch { setError('Error saving goal'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this goal?')) return;
    await axios.delete(`/api/goals/${id}`);
    load();
  };

  const daysLeft = (dateStr) => {
    const diff = new Date(dateStr) - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <div style={s.page}>
      <div style={s.topBar}>
        <h2 style={s.heading}>Financial Goals</h2>
        <button style={s.btnPrimary} onClick={() => { setForm(empty); setError(''); setModal(true); }}>+ Add Goal</button>
      </div>

      <div style={{ marginBottom: '1.5rem', background: '#1e293b', borderRadius: 12, padding: '1rem 1.25rem', border: '1px solid #334155' }}>
        <div style={{ color: '#64748b', fontSize: 12, marginBottom: 4 }}>Current Portfolio Value (used for progress)</div>
        <div style={{ color: '#3b82f6', fontSize: 24, fontWeight: 700 }}>{fmt(totalValue)}</div>
      </div>

      {goals.length === 0 && <div style={{ color: '#475569', textAlign: 'center', padding: '3rem', background: '#1e293b', borderRadius: 12, border: '1px solid #334155' }}>No goals set. Add one to track your progress.</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {goals.map(g => {
          const pct = Math.min(100, (totalValue / g.target_amount) * 100);
          const remaining = g.target_amount - totalValue;
          const days = daysLeft(g.target_date);
          const achieved = pct >= 100;
          return (
            <div key={g.id} style={{ ...s.goalCard, border: achieved ? '1px solid #065f46' : '1px solid #334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 16 }}>{g.title} {achieved && '🎉'}</div>
                  <div style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>Target: {fmt(g.target_amount)} · Deadline: {g.target_date}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ background: days < 90 ? '#450a0a' : '#052e16', color: days < 90 ? '#fca5a5' : '#4ade80', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{days} days left</span>
                  <button style={s.iconBtn} onClick={() => handleDelete(g.id)}>🗑️</button>
                </div>
              </div>
              <div style={{ background: '#0f172a', borderRadius: 8, height: 12, overflow: 'hidden', marginBottom: 8 }}>
                <div style={{ width: pct + '%', background: achieved ? '#10b981' : '#3b82f6', height: '100%', borderRadius: 8, transition: 'width 0.6s ease' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: achieved ? '#10b981' : '#3b82f6', fontSize: 13, fontWeight: 600 }}>{pct.toFixed(1)}% complete</span>
                <span style={{ color: '#94a3b8', fontSize: 13 }}>{remaining > 0 ? `${fmt(remaining)} still needed` : `Surplus: ${fmt(Math.abs(remaining))}`}</span>
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <div style={s.modalBg} onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div style={s.modal}>
            <h3 style={{ color: '#f1f5f9', fontSize: 16, fontWeight: 600, marginBottom: '1.25rem' }}>Set a Financial Goal</h3>
            {[
              { label: 'Goal Title *', key: 'title', type: 'text', ph: 'e.g. Reach ₹50 Lakhs by 2026' },
              { label: 'Target Amount (₹) *', key: 'target_amount', type: 'number', ph: '5000000' },
              { label: 'Target Date *', key: 'target_date', type: 'date', ph: '' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <label style={s.label}>{f.label}</label>
                <input style={s.input} type={f.type} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.ph} />
              </div>
            ))}
            {error && <div style={{ background: '#450a0a', color: '#fca5a5', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 8 }}>{error}</div>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button style={s.btnSecondary} onClick={() => setModal(false)}>Cancel</button>
              <button style={s.btnPrimary} onClick={handleSave}>Save Goal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page: { padding: '1.5rem' },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' },
  heading: { color: '#f1f5f9', fontSize: 20, fontWeight: 600, margin: 0 },
  goalCard: { background: '#1e293b', borderRadius: 12, padding: '1.25rem' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', fontSize: 14 },
  modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal: { background: '#1e293b', borderRadius: 16, padding: '1.5rem', width: '100%', maxWidth: 400, border: '1px solid #334155' },
  label: { display: 'block', color: '#94a3b8', fontSize: 12, marginBottom: 5 },
  input: { width: '100%', padding: '9px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9', fontSize: 14, boxSizing: 'border-box' },
  btnPrimary: { padding: '9px 18px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  btnSecondary: { padding: '9px 18px', background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', borderRadius: 8, fontSize: 14, cursor: 'pointer' },
};
