import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0f',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Rajdhani', sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: 420, padding: '0 24px' }}>
        <div style={{ marginBottom: 40, textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 10, height: 10, background: '#e8460a', borderRadius: '50%' }} />
            <span style={{ fontSize: 20, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#e8e6e0' }}>
              Disaster Response MIS
            </span>
          </div>
          <p style={{ fontSize: 12, color: '#4a4845', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em' }}>
            AUTHORIZED ACCESS ONLY
          </p>
        </div>

        <div style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.07)', borderTop: '3px solid #e8460a', borderRadius: 4, padding: 32 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7a7870', marginBottom: 24 }}>
            Sign in to continue
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label>Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="operator@agency.gov" required />
            </div>
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required />
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Authenticating...' : 'Authenticate'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#4a4845', fontFamily: "'JetBrains Mono', monospace" }}>
            No account?{' '}
            <a href="/register" style={{ color: '#e8460a', textDecoration: 'underline', textUnderlineOffset: 3 }}>Register</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;