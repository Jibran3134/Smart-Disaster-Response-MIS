import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const Register = () => {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role_name: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      setSuccess('Account created. Redirecting...');
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
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
            NEW ACCOUNT REGISTRATION
          </p>
        </div>

        <div style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.07)', borderTop: '3px solid #e8460a', borderRadius: 4, padding: 32 }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label>Full name</label>
              <input type="text" value={form.full_name}
                onChange={e => setForm({ ...form, full_name: e.target.value })}
                placeholder="John Doe" required />
            </div>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label>Email address</label>
              <input type="email" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="you@agency.gov" required />
            </div>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label>Password</label>
              <input type="password" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••" required />
            </div>
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label>Role</label>
              <select value={form.role_name}
                onChange={e => setForm({ ...form, role_name: e.target.value })} required>
                <option value="">Select role</option>
                <option value="Administrator">Administrator</option>
                <option value="Emergency Operator">Emergency Operator</option>
                <option value="Field Officer">Field Officer</option>
                <option value="Warehouse Manager">Warehouse Manager</option>
                <option value="Finance Officer">Finance Officer</option>
              </select>
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
            {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>{success}</div>}

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#4a4845', fontFamily: "'JetBrains Mono', monospace" }}>
            Have an account?{' '}
            <a href="/login" style={{ color: '#e8460a', textDecoration: 'underline', textUnderlineOffset: 3 }}>Sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;