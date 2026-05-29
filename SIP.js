import React, { useEffect, useState } from 'react';
import axios from 'axios';

const fmt = (n) => '₹' + Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
const empty = { fund_name: '', monthly_amount: '', start_date: new Date().toISOString().slice(0, 10), instalments_paid: '' };

export default function SIP() {
  const [sips, setSips] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');

  const load = () => axios.get('/api/sip').then(r => setSips(r.data));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(empty); setError(''); setModal(true); };
  const openEdit = (s) => { setEditing(s.id); setForm({ fund_name: s.fund_name, monthly_amount: s.monthly_amount, start_date: s.start_date, instalments_paid: s.instalments_paid }); setError(''); setModal(true); };

  const handleSave = async () => {
    if (!form.fund_name || !form.monthly_amount || !form.start_date) { setError('Fill all required fields'); return; }
    try {
      const payload = { ...form, monthly_amount: parseFloat(form.monthly_amount), instalments_paid: parseInt(form.instalments_paid) || 0 };
      if (editing) await axios.put(`/api/sip/${editing}`, payload);
      else await axios.post('/api/sip', payload);
      setModal(false); load();
    } catch (e) { setError('Error saving'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this SIP?')) return;
    await axios.delete(`/api/sip/${id}`);
    load();
  };

  const totalSIPInvested = sips.reduce((s, i) => s + (i.monthly_amount * i.instalments_paid), 0);
  const totalMonthly = sips.reduce((s, i) => s + i.monthly_amount, 0);

  return (
    <div style={s.page}>
      <div style={s.topBar}>
        <h2 style={s.heading}>SIP / Recurring Investments</h2>
        <button style={s.btnPrimary} onClick={openAdd}>+ Add SIP</button>
      </div>

      <div style={s.grid}>
        <div style={s.card}><div style={s.cl}>Total SIP Invested</div><div style={s.cv}>{fmt(totalSIPInvested)}</div></div>
        <div style={s.card}><div style={s.cl}>Monthly Outflow</div><div style={s.cv}>{fmt(totalMonthly)}</div></div>
        <div style={s.card}><div style={s.cl}>Active SIPs</div><div style={s.cv}>{sips.length}</div></div>
      </div>

      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead><tr>
            {['Fund / Investment', 'Monthly (₹)', 'Start Date', 'Instalments Paid', 'Total Invested', ''].map(h => <th key={h} style={s.th}>{h}</th>)}
          </tr></thead>
          <tbody>
            {sips.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#475569' }}>No SIPs added yet.</td></tr>}
            {sips.map(sip => (
              <tr key={sip.id}>
                <td style={{ ...s.td, color: '#f1f5f9', fontWeight: 600 }}>{sip.fund_name}</td>
                <td style={s.td}>{fmt(sip.monthly_amount)}</td>
                <td style={{ ...s.td, color: '#64748b' }}>{sip.start_date}</td>
                <td style={s.td}>
                  <span style={{ background: '#1e3a5f', color: '#93c5fd', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{sip.instalments_paid}</span>
                </td>
                <td style={{ ...s.td, color: '#10b981', fontWeight: 600 }}>{fmt(sip.monthly_amount * sip.instalments_paid)}</td>
                <td style={s.td}>
                  <button style={s.iconBtn} onClick={() => openEdit(sip)}>✏️</button>
                  <button style={s.iconBtn} onClick={() => handleDelete(sip.id)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div style={s.modalBg} onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div style={s.modal}>
            <h3 style={{ color: '#f1f5f9', fontSize: 16, fontWeight: 600, marginBottom: '1.25rem' }}>{editing ? 'Edit SIP' : 'Add SIP'}</h3>
            {[
              { label: 'Fund / Investment Name *', key: 'fund_name', type: 'text', ph: 'e.g. Parag Parikh Flexi Cap' },
              { label: 'Monthly Amount (₹) *', key: 'monthly_amount', type: 'number', ph: '5000' },
              { label: 'Start Date *', key: 'start_date', type: 'date', ph: '' },
              { label: 'Instalments Paid', key: 'instalments_paid', type: 'number', ph: '12' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <label style={s.label}>{f.label}</label>
                <input style={s.input} type={f.type} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.ph} />
              </div>
            ))}
            {error && <div style={s.errBox}>{error}</div>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button style={s.btnSecondary} onClick={() => setModal(false)}>Cancel</button>
              <button style={s.btnPrimary} onClick={handleSave}>Save</button>
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
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: 12, marginBottom: '1.25rem' },
  card: { background: '#1e293b', borderRadius: 12, padding: '1rem', border: '1px solid #334155' },
  cl: { color: '#64748b', fontSize: 12, marginBottom: 6 },
  cv: { color: '#f1f5f9', fontSize: 22, fontWeight: 600 },
  tableWrap: { background: '#1e293b', borderRadius: 12, border: '1px solid #334155', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: 500, borderBottom: '1px solid #334155' },
  td: { padding: '12px 14px', color: '#94a3b8', borderBottom: '1px solid #0f172a' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', fontSize: 14 },
  modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal: { background: '#1e293b', borderRadius: 16, padding: '1.5rem', width: '100%', maxWidth: 400, border: '1px solid #334155' },
  label: { display: 'block', color: '#94a3b8', fontSize: 12, marginBottom: 5 },
  input: { width: '100%', padding: '9px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9', fontSize: 14, boxSizing: 'border-box' },
  errBox: { background: '#450a0a', color: '#fca5a5', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 8 },
  btnPrimary: { padding: '9px 18px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  btnSecondary: { padding: '9px 18px', background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', borderRadius: 8, fontSize: 14, cursor: 'pointer' },
};
