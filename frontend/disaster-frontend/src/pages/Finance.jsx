import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

const Finance = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({});
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ amount: '', transaction_type: '', event_id: '' });
  const [msg, setMsg] = useState({ text: '', type: '' });

  useEffect(() => { fetchData(); }, [filterType]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = '/finance/transactions';
      if (filterType) url += `?type=${filterType}`;
      const [txRes, sumRes, budgetRes] = await Promise.all([api.get(url), api.get('/finance/summary'), api.get('/finance/budgets')]);
      setTransactions(txRes.data);
      setSummary(sumRes.data);
      setBudgets(budgetRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ text: '', type: '' });
    try {
      await api.post('/approvals/request-financial', {
        amount: parseFloat(form.amount),
        transaction_type: form.transaction_type,
        event_id: form.event_id ? parseInt(form.event_id) : null,
        made_by_user: user?.user_id || null,
        made_by_donor: null,
      });
      setMsg({ text: 'Financial request submitted for approval.', type: 'success' });
      setForm({ amount: '', transaction_type: '', event_id: '' });
      setShowForm(false);
      fetchData();
    } catch (err) {
      setMsg({ text: err.response?.data?.error || 'Request failed.', type: 'error' });
    }
  };

  const typeBadge = (type) => {
    const map = { Donation: 'badge-donation', Expense: 'badge-expense', Procurement: 'badge-procurement' };
    return <span className={`badge ${map[type] || ''}`}>{type}</span>;
  };

  return (
    <>
      <Navbar active="finance" />
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Financial Management</h1>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ New Transaction'}
          </button>
        </div>

        <div className="stat-grid">
          <div className="stat-card">
            <div className="label">Total Donations</div>
            <div className="value green" style={{ fontSize: 18 }}>PKR {parseFloat(summary.total_donations || 0).toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <div className="label">Total Expenses</div>
            <div className="value red" style={{ fontSize: 18 }}>PKR {parseFloat(summary.total_expenses || 0).toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <div className="label">Procurement</div>
            <div className="value blue" style={{ fontSize: 18 }}>PKR {parseFloat(summary.total_procurement || 0).toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <div className="label">Pending Txns</div>
            <div className="value yellow">{summary.pending_transactions || 0}</div>
          </div>
        </div>

        {showForm && (
          <div className="card" style={{ borderLeft: '3px solid #e8460a', marginBottom: 20 }}>
            <div className="card-header"><span className="card-title">Request financial transaction</span></div>
            <div className="card-body">
              {msg.text && <div className={`alert alert-${msg.type}`} style={{ marginBottom: 16 }}>{msg.text}</div>}
              <form onSubmit={handleSubmit}>
                <div className="form-grid" style={{ marginBottom: 16 }}>
                  <div className="form-group">
                    <label>Amount (PKR) *</label>
                    <input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="e.g. 50000" required />
                  </div>
                  <div className="form-group">
                    <label>Type *</label>
                    <select value={form.transaction_type} onChange={e => setForm({ ...form, transaction_type: e.target.value })} required>
                      <option value="">Select</option>
                      <option>Donation</option><option>Expense</option><option>Procurement</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Event ID</label>
                    <input type="number" value={form.event_id} onChange={e => setForm({ ...form, event_id: e.target.value })} placeholder="optional" />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary">Submit for Approval</button>
              </form>
            </div>
          </div>
        )}

        <div className="filter-row">
          <div className="form-group">
            <label>Filter type</label>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="">All</option>
              <option>Donation</option><option>Expense</option><option>Procurement</option>
            </select>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <span className="card-title">Transaction log</span>
            <span className="mono">{transactions.length} records</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>#ID</th><th>Type</th><th>Amount</th><th>Event</th><th>By</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7"><div className="empty">loading...</div></td></tr>
                ) : transactions.length === 0 ? (
                  <tr><td colSpan="7"><div className="empty">no transactions found</div></td></tr>
                ) : transactions.map(tx => (
                  <tr key={tx.transaction_id}>
                    <td className="mono">{String(tx.transaction_id).padStart(4, '0')}</td>
                    <td>{typeBadge(tx.transaction_type)}</td>
                    <td className="mono" style={{ color: tx.transaction_type === 'Donation' ? '#22c55e' : tx.transaction_type === 'Expense' ? '#ef4444' : '#3b82f6' }}>
                      PKR {parseFloat(tx.amount).toLocaleString()}
                    </td>
                    <td>{tx.event_name || '—'}</td>
                    <td>{tx.user_name || tx.donor_name || '—'}</td>
                    <td><span className="mono" style={{ color: '#7a7870' }}>{tx.status}</span></td>
                    <td className="mono">{new Date(tx.transaction_date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Budgets by event</span></div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Event</th><th>Type</th><th>Allocated</th><th>Spent</th><th>Remaining</th></tr>
              </thead>
              <tbody>
                {budgets.length === 0 ? (
                  <tr><td colSpan="5"><div className="empty">no budgets</div></td></tr>
                ) : budgets.map(b => (
                  <tr key={b.budget_id}>
                    <td style={{ fontWeight: 500 }}>{b.event_name}</td>
                    <td className="mono">{b.disaster_type}</td>
                    <td className="mono">PKR {parseFloat(b.total_allocated).toLocaleString()}</td>
                    <td className="mono" style={{ color: '#ef4444' }}>PKR {parseFloat(b.total_spent || 0).toLocaleString()}</td>
                    <td className="mono" style={{ color: '#22c55e' }}>PKR {parseFloat(b.remaining_balance || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default Finance;