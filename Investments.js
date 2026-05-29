import React, { useEffect, useState } from 'react';
import axios from 'axios';

const fmt = (n) => '₹' + Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
const CATS = ['Stocks', 'Mutual Funds', 'FD / Bonds', 'Crypto', 'Real Estate', 'Gold', 'Other'];

const empty = { name: '', category: 'Stocks', invested: '', current_value: '', date: new Date().toISOString().slice(0, 10), notes: '' };

export default function Investments() {
  const [investments, setInvestments] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');

  const load = () => axios.get('/api/investments').then(r => setInvestments(r.data));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(empty); setError(''); setModal(true); };
  const openEdit = (inv) => { setEditing(inv.id); setForm({ name: inv.name, category: inv.category, invested: inv.invested, current_value: inv.current_value, date: inv.date, notes: inv.notes || '' }); setError(''); setModal(true); };
  const closeModal = () => setModal(false);

  const handleSave = async () => {
    if (!form.name || !form.invested || !form.current_value || !form.date) { setError('Please fill all required fields'); return; }
    setLoading(true);
    try {
      const payload = { ...form, invested: parseFloat(form.invested), current_value: parseFloat(form.current_value) };
      if (editing) await axios.put(`/api/investments/${editing}`, payload);
      else await axios.post('/api/investments', payload);
      closeModal(); load();
    } catch (e) { setError(e.response?.data?.error || 'Error saving'); }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this investment?')) return;
    await axios.delete(`/api/investments/${id}`);
    load();
  };

  const handleExport = () => { window.open('/api/export/csv', '_blank'); };

  const filtered = investments.filter(i =>
    (filterCat === 'All' || i.category === filterCat) &&
    (i.name.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase()))
  );

  const totalInvested = filtered.reduce((s, i) => s + i.invested, 0);
  const totalValue = filtered.reduce((s, i) => s + i.current_value, 0);
  const totalReturn = totalValue - totalInvested;

  return (
    <div style={s.page}>
      <div style={s.topBar}>
        <h2 style={s.heading}>Investments</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={s.btnSecondary} onClick={handleExport}>⬇ Export CSV</button>
          <button style={s.btnPrimary} onClick={openAdd}>+ Add Investment</button>
        </div>
      </div>

      <div style={s.filterBar}>
        <input style={s.searchInput} placeholder="Search investments..." value={search} onChange={e => setSearch(e.target.value)} />
        <select style={s.select} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="All">All Categories</option>
          {CATS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div style={s.summaryBar}>
        <span style={s.summaryItem}>Showing <b style={{ color: '#f1f5f9' }}>{filtered.length}</b> positions</span>
        <span style={s.summaryItem}>Invested: <b style={{ color: '#f1f5f9' }}>{fmt(totalInvested)}</b></span>
        <span style={s.summaryItem}>Value: <b style={{ color: '#f1f5f9' }}>{fmt(totalValue)}</b></span>
        <span style={s.summaryItem}>Return: <b style={{ color: totalReturn >= 0 ? '#10b981' : '#ef4444' }}>{totalReturn >= 0 ? '+' : '-'}{fmt(totalReturn)}</b></span>
      </div>

      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr>{['Name', 'Category', 'Invested', 'Current Value', 'Return', 'Return %', 'Date', 'Notes', ''].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#475569' }}>No investments found. Click "Add Investment" to get started.</td></tr>
            )}
            {filtered.map(inv => {
              const ret = inv.current_value - inv.invested;
              const pct = inv.invested > 0 ? (ret / inv.invested * 100) : 0;
              const pos = ret >= 0;
              return (
                <tr key={inv.id} style={s.tr}>
                  <td style={{ ...s.td, fontWeight: 600, color: '#f1f5f9' }}>{inv.name}</td>
                  <td style={s.td}><span style={{ ...s.badge, background: '#1e3a5f', color: '#93c5fd' }}>{inv.category}</span></td>
                  <td style={s.td}>{fmt(inv.invested)}</td>
                  <td style={s.td}>{fmt(inv.current_value)}</td>
                  <td style={{ ...s.td, color: pos ? '#10b981' : '#ef4444', fontWeight: 600 }}>{pos ? '+' : '-'}{fmt(ret)}</td>
                  <td style={s.td}><span style={{ ...s.badge, background: pos ? '#052e16' : '#450a0a', color: pos ? '#4ade80' : '#fca5a5' }}>{pos ? '+' : ''}{pct.toFixed(2)}%</span></td>
                  <td style={{ ...s.td, color: '#64748b' }}>{inv.date}</td>
                  <td style={{ ...s.td, color: '#64748b', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.notes || '—'}</td>
                  <td style={s.td}>
                    <button style={s.iconBtn} onClick={() => openEdit(inv)} title="Edit">✏️</button>
                    <button style={s.iconBtn} onClick={() => handleDelete(inv.id)} title="Delete">🗑️</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal && (
        <div style={s.modalBg} onClick={e => e.target === e.currentTarget && closeModal()}>
          <div style={s.modal}>
            <h3 style={{ color: '#f1f5f9', fontSize: 16, fontWeight: 600, marginBottom: '1.25rem' }}>{editing ? 'Edit Investment' : 'Add Investment'}</h3>
            {[
              { label: 'Name *', key: 'name', type: 'text', ph: 'e.g. Reliance Industries, SBI FD' },
              { label: 'Amount Invested (₹) *', key: 'invested', type: 'number', ph: '50000' },
              { label: 'Current Value (₹) *', key: 'current_value', type: 'number', ph: '58000' },
              { label: 'Date *', key: 'date', type: 'date', ph: '' },
              { label: 'Notes', key: 'notes', type: 'text', ph: 'Optional notes...' },
            ].map(f => (
              <div key={f.key} style={s.field}>
                <label style={s.label}>{f.label}</label>
                <input style={s.input} type={f.type} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.ph} />
              </div>
            ))}
            <div style={s.field}>
              <label style={s.label}>Category</label>
              <select style={s.input} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {error && <div style={s.errBox}>{error}</div>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button style={s.btnSecondary} onClick={closeModal}>Cancel</button>
              <button style={s.btnPrimary} onClick={handleSave} disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page: { padding: '1.5rem' },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: 10 },
  heading: { color: '#f1f5f9', fontSize: 20, fontWeight: 600, margin: 0 },
  filterBar: { display: 'flex', gap: 10, marginBottom: '1rem', flexWrap: 'wrap' },
  searchInput: { flex: 1, minWidth: 180, padding: '8px 12px', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9', fontSize: 14 },
  select: { padding: '8px 12px', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9', fontSize: 14 },
  summaryBar: { display: 'flex', gap: 20, marginBottom: '1rem', flexWrap: 'wrap', padding: '10px 14px', background: '#1e293b', borderRadius: 8, border: '1px solid #334155' },
  summaryItem: { color: '#94a3b8', fontSize: 13 },
  tableWrap: { overflowX: 'auto', background: '#1e293b', borderRadius: 12, border: '1px solid #334155' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: 500, borderBottom: '1px solid #334155', whiteSpace: 'nowrap' },
  td: { padding: '12px 14px', color: '#94a3b8', borderBottom: '1px solid #1e293b' },
  tr: { transition: 'background 0.15s' },
  badge: { padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', fontSize: 14 },
  modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal: { background: '#1e293b', borderRadius: 16, padding: '1.5rem', width: '100%', maxWidth: 420, border: '1px solid #334155', maxHeight: '90vh', overflowY: 'auto' },
  field: { marginBottom: 12 },
  label: { display: 'block', color: '#94a3b8', fontSize: 12, marginBottom: 5 },
  input: { width: '100%', padding: '9px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9', fontSize: 14, boxSizing: 'border-box' },
  errBox: { background: '#450a0a', color: '#fca5a5', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 8 },
  btnPrimary: { padding: '9px 18px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  btnSecondary: { padding: '9px 18px', background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', borderRadius: 8, fontSize: 14, cursor: 'pointer' },
};
