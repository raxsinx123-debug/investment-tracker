import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler);

const fmt = (n) => '₹' + Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
const fmtSign = (n) => (n >= 0 ? '+' : '-') + fmt(n);

const CAT_COLORS = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ec4899','#f97316','#6b7280'];

export default function Dashboard() {
  const [investments, setInvestments] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [goals, setGoals] = useState([]);
  const [sips, setSips] = useState([]);

  useEffect(() => {
    Promise.all([
      axios.get('/api/investments'),
      axios.get('/api/snapshots'),
      axios.get('/api/goals'),
      axios.get('/api/sip'),
    ]).then(([inv, snaps, goals, sip]) => {
      setInvestments(inv.data);
      setSnapshots(snaps.data);
      setGoals(goals.data);
      setSips(sip.data);
    });
  }, []);

  const totalInvested = investments.reduce((s, i) => s + i.invested, 0);
  const totalValue = investments.reduce((s, i) => s + i.current_value, 0);
  const totalReturn = totalValue - totalInvested;
  const returnPct = totalInvested > 0 ? ((totalReturn / totalInvested) * 100) : 0;
  const sipInvested = sips.reduce((s, i) => s + (i.monthly_amount * i.instalments_paid), 0);

  const best = investments.length ? investments.reduce((a, b) => ((b.current_value - b.invested) / b.invested) > ((a.current_value - a.invested) / a.invested) ? b : a) : null;
  const worst = investments.length ? investments.reduce((a, b) => ((b.current_value - b.invested) / b.invested) < ((a.current_value - a.invested) / a.invested) ? b : a) : null;

  const catMap = {};
  investments.forEach(i => { catMap[i.category] = (catMap[i.category] || 0) + i.invested; });

  const donutData = {
    labels: Object.keys(catMap),
    datasets: [{ data: Object.values(catMap), backgroundColor: CAT_COLORS, borderWidth: 0 }],
  };

  const barData = {
    labels: investments.map(i => i.name.length > 12 ? i.name.slice(0, 12) + '…' : i.name),
    datasets: [{
      label: 'Return %',
      data: investments.map(i => i.invested > 0 ? parseFloat(((i.current_value - i.invested) / i.invested * 100).toFixed(2)) : 0),
      backgroundColor: investments.map(i => (i.current_value >= i.invested ? '#10b981' : '#ef4444')),
      borderRadius: 4,
    }],
  };

  const lineData = {
    labels: snapshots.map(s => s.snapshot_date),
    datasets: [
      { label: 'Portfolio Value', data: snapshots.map(s => s.total_value), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', fill: true, tension: 0.4 },
      { label: 'Total Invested', data: snapshots.map(s => s.total_invested), borderColor: '#94a3b8', borderDash: [5, 5], fill: false, tension: 0.4 },
    ],
  };

  const chartOpts = (yFmt) => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { ticks: { color: '#94a3b8', font: { size: 11 } }, grid: { display: false } }, y: { ticks: { color: '#94a3b8', font: { size: 11 }, callback: yFmt }, grid: { color: 'rgba(148,163,184,0.1)' } } },
  });

  return (
    <div style={s.page}>
      <h2 style={s.heading}>Dashboard</h2>

      {/* Summary Cards */}
      <div style={s.grid4}>
        {[
          { label: 'Total Invested', value: fmt(totalInvested), color: '#f1f5f9' },
          { label: 'Portfolio Value', value: fmt(totalValue), color: '#f1f5f9' },
          { label: 'Total Return', value: fmtSign(totalReturn), color: totalReturn >= 0 ? '#10b981' : '#ef4444' },
          { label: 'Return %', value: (returnPct >= 0 ? '+' : '') + returnPct.toFixed(2) + '%', color: returnPct >= 0 ? '#10b981' : '#ef4444' },
        ].map((m, i) => (
          <div key={i} style={s.card}>
            <div style={s.cardLabel}>{m.label}</div>
            <div style={{ ...s.cardValue, color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={s.grid4}>
        <div style={s.card}><div style={s.cardLabel}>SIP Invested</div><div style={s.cardValue}>{fmt(sipInvested)}</div></div>
        <div style={s.card}><div style={s.cardLabel}>Total + SIP</div><div style={s.cardValue}>{fmt(totalInvested + sipInvested)}</div></div>
        <div style={s.card}><div style={s.cardLabel}>Best Performer</div><div style={{ ...s.cardValue, color: '#10b981', fontSize: 14 }}>{best ? best.name : '—'}</div></div>
        <div style={s.card}><div style={s.cardLabel}>Worst Performer</div><div style={{ ...s.cardValue, color: '#ef4444', fontSize: 14 }}>{worst ? worst.name : '—'}</div></div>
      </div>

      {/* Goals */}
      {goals.length > 0 && (
        <div style={s.section}>
          <h3 style={s.sectionTitle}>Financial Goals</h3>
          {goals.map(g => {
            const pct = Math.min(100, (totalValue / g.target_amount) * 100);
            const remaining = g.target_amount - totalValue;
            return (
              <div key={g.id} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 500 }}>{g.title}</span>
                  <span style={{ color: '#94a3b8', fontSize: 13 }}>{fmt(totalValue)} / {fmt(g.target_amount)} · {g.target_date}</span>
                </div>
                <div style={{ background: '#0f172a', borderRadius: 8, height: 10, overflow: 'hidden' }}>
                  <div style={{ width: pct + '%', background: pct >= 100 ? '#10b981' : '#3b82f6', height: '100%', borderRadius: 8, transition: 'width 0.5s' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span style={{ color: '#10b981', fontSize: 12 }}>{pct.toFixed(1)}% complete</span>
                  <span style={{ color: '#94a3b8', fontSize: 12 }}>{remaining > 0 ? fmt(remaining) + ' to go' : 'Goal reached! 🎉'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Charts */}
      <div style={s.grid2}>
        <div style={s.section}>
          <h3 style={s.sectionTitle}>Allocation by Category</h3>
          <div style={{ height: 220 }}>
            {Object.keys(catMap).length > 0
              ? <Doughnut data={donutData} options={{ responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 }, boxWidth: 12 } } } }} />
              : <div style={s.empty}>No data yet</div>}
          </div>
        </div>
        <div style={s.section}>
          <h3 style={s.sectionTitle}>Return % per Investment</h3>
          <div style={{ height: 220 }}>
            {investments.length > 0
              ? <Bar data={barData} options={chartOpts(v => v + '%')} />
              : <div style={s.empty}>No data yet</div>}
          </div>
        </div>
      </div>

      <div style={s.section}>
        <h3 style={s.sectionTitle}>Portfolio Value Over Time</h3>
        <div style={{ height: 240 }}>
          {snapshots.length > 1
            ? <Line data={lineData} options={{ ...chartOpts(v => '₹' + (v / 1000).toFixed(0) + 'k'), plugins: { legend: { display: true, labels: { color: '#94a3b8', font: { size: 11 } } } } }} />
            : <div style={s.empty}>Add more investments over time to see your growth chart</div>}
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { padding: '1.5rem' },
  heading: { color: '#f1f5f9', fontSize: 20, fontWeight: 600, marginBottom: '1.25rem' },
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 12 },
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, marginBottom: 12 },
  card: { background: '#1e293b', borderRadius: 12, padding: '1rem', border: '1px solid #334155' },
  cardLabel: { color: '#64748b', fontSize: 12, marginBottom: 6 },
  cardValue: { color: '#f1f5f9', fontSize: 22, fontWeight: 600 },
  section: { background: '#1e293b', borderRadius: 12, padding: '1.25rem', border: '1px solid #334155', marginBottom: 12 },
  sectionTitle: { color: '#94a3b8', fontSize: 13, fontWeight: 500, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' },
  empty: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#475569', fontSize: 14 },
};
