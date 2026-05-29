import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Investments from './pages/Investments';
import SIP from './pages/SIP';
import Goals from './pages/Goals';

const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊' },
  { key: 'investments', label: 'Investments', icon: '💰' },
  { key: 'sip', label: 'SIP / Recurring', icon: '🔄' },
  { key: 'goals', label: 'Goals', icon: '🎯' },
];

function AppInner() {
  const { user, logout, loading } = useAuth();
  const [page, setPage] = useState('dashboard');
  const [mobileNav, setMobileNav] = useState(false);

  if (loading) return <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>Loading...</div>;
  if (!user) return <LoginPage />;

  const renderPage = () => {
    if (page === 'dashboard') return <Dashboard />;
    if (page === 'investments') return <Investments />;
    if (page === 'sip') return <SIP />;
    if (page === 'goals') return <Goals />;
  };

  return (
    <div style={s.layout}>
      {/* Sidebar */}
      <aside style={s.sidebar}>
        <div style={s.sidebarTop}>
          <div style={s.brand}>📈 InvestTracker</div>
          <div style={s.userBadge}>👤 {user.username}</div>
        </div>
        <nav style={s.nav}>
          {NAV.map(n => (
            <button key={n.key} style={{ ...s.navBtn, ...(page === n.key ? s.navBtnActive : {}) }} onClick={() => setPage(n.key)}>
              <span style={{ fontSize: 18 }}>{n.icon}</span>
              <span>{n.label}</span>
            </button>
          ))}
        </nav>
        <button style={s.logoutBtn} onClick={logout}>🚪 Logout</button>
      </aside>

      {/* Mobile top bar */}
      <div style={s.mobileBar}>
        <button style={s.hamburger} onClick={() => setMobileNav(!mobileNav)}>☰</button>
        <span style={{ color: '#f1f5f9', fontWeight: 600 }}>📈 InvestTracker</span>
        <button style={s.hamburger} onClick={logout}>🚪</button>
      </div>

      {/* Mobile drawer */}
      {mobileNav && (
        <div style={s.mobileDrawerBg} onClick={() => setMobileNav(false)}>
          <div style={s.mobileDrawer} onClick={e => e.stopPropagation()}>
            <div style={{ color: '#64748b', fontSize: 13, marginBottom: 12, padding: '0 4px' }}>👤 {user.username}</div>
            {NAV.map(n => (
              <button key={n.key} style={{ ...s.navBtn, ...(page === n.key ? s.navBtnActive : {}) }} onClick={() => { setPage(n.key); setMobileNav(false); }}>
                <span style={{ fontSize: 18 }}>{n.icon}</span>
                <span>{n.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main content */}
      <main style={s.main}>{renderPage()}</main>

      {/* Mobile bottom nav */}
      <div style={s.bottomNav}>
        {NAV.map(n => (
          <button key={n.key} style={{ ...s.bottomNavBtn, ...(page === n.key ? s.bottomNavBtnActive : {}) }} onClick={() => setPage(n.key)}>
            <span style={{ fontSize: 20 }}>{n.icon}</span>
            <span style={{ fontSize: 10 }}>{n.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return <AuthProvider><AppInner /></AuthProvider>;
}

const s = {
  layout: { display: 'flex', minHeight: '100vh', background: '#0f172a' },
  sidebar: { width: 220, background: '#1e293b', borderRight: '1px solid #334155', display: 'flex', flexDirection: 'column', padding: '1.25rem 0.75rem', position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 10, '@media(maxWidth:768px)': { display: 'none' } },
  sidebarTop: { marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #334155' },
  brand: { color: '#f1f5f9', fontWeight: 700, fontSize: 16, marginBottom: 8 },
  userBadge: { color: '#64748b', fontSize: 13 },
  nav: { flex: 1, display: 'flex', flexDirection: 'column', gap: 4 },
  navBtn: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'transparent', border: 'none', borderRadius: 8, color: '#94a3b8', fontSize: 14, cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'all 0.15s' },
  navBtnActive: { background: '#1d4ed8', color: '#fff' },
  logoutBtn: { padding: '10px 12px', background: 'transparent', border: 'none', borderRadius: 8, color: '#64748b', fontSize: 14, cursor: 'pointer', textAlign: 'left' },
  main: { flex: 1, marginLeft: 220, minHeight: '100vh', paddingBottom: 70 },
  mobileBar: { display: 'none', position: 'fixed', top: 0, left: 0, right: 0, height: 52, background: '#1e293b', borderBottom: '1px solid #334155', zIndex: 20, alignItems: 'center', justifyContent: 'space-between', padding: '0 1rem' },
  hamburger: { background: 'none', border: 'none', color: '#94a3b8', fontSize: 20, cursor: 'pointer' },
  mobileDrawerBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50 },
  mobileDrawer: { position: 'absolute', top: 0, left: 0, width: 240, height: '100%', background: '#1e293b', padding: '1.25rem 0.75rem', display: 'flex', flexDirection: 'column', gap: 4 },
  bottomNav: { display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0, height: 60, background: '#1e293b', borderTop: '1px solid #334155', zIndex: 20, alignItems: 'center', justifyContent: 'space-around' },
  bottomNavBtn: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px 12px', borderRadius: 8 },
  bottomNavBtnActive: { color: '#3b82f6' },
};
