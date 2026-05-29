import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) await login(username, password);
      else await register(username, password);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    }
    setLoading(false);
  };

  return (
    <div style={styles.bg}>
      <div style={styles.card}>
        <div style={styles.logo}>📈</div>
        <h1 style={styles.title}>Investment Tracker</h1>
        <p style={styles.sub}>Your personal finance command center</p>

        <div style={styles.tabs}>
          <button style={{...styles.tab, ...(isLogin ? styles.tabActive : {})}} onClick={() => setIsLogin(true)}>Login</button>
          <button style={{...styles.tab, ...(!isLogin ? styles.tabActive : {})}} onClick={() => setIsLogin(false)}>Register</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Username</label>
            <input style={styles.input} value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username" required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input style={styles.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" required />
          </div>
          {error && <div style={styles.error}>{error}</div>}
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Create Account')}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  bg: { minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' },
  card: { background: '#1e293b', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 400, border: '1px solid #334155' },
  logo: { fontSize: 40, textAlign: 'center', marginBottom: 8 },
  title: { color: '#f1f5f9', textAlign: 'center', fontSize: 22, fontWeight: 600, margin: 0 },
  sub: { color: '#94a3b8', textAlign: 'center', fontSize: 14, margin: '4px 0 1.5rem' },
  tabs: { display: 'flex', background: '#0f172a', borderRadius: 8, padding: 4, marginBottom: '1.5rem' },
  tab: { flex: 1, padding: '8px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, background: 'transparent', color: '#94a3b8' },
  tabActive: { background: '#3b82f6', color: '#fff' },
  field: { marginBottom: '1rem' },
  label: { display: 'block', color: '#94a3b8', fontSize: 13, marginBottom: 6 },
  input: { width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9', fontSize: 14, boxSizing: 'border-box' },
  error: { background: '#450a0a', color: '#fca5a5', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: '1rem' },
  btn: { width: '100%', padding: '12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 4 },
};
