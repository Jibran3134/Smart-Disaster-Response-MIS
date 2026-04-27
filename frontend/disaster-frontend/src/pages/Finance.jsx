import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Finance = () => {
  const { user, logout } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({});
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ amount: '', transaction_type: '', event_id: '', made_by_user: '' });
  const [formMessage, setFormMessage] = useState('');

  useEffect(() => { fetchData(); }, [filterType]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = '/finance/transactions';
      if (filterType) url += `?type=${filterType}`;
      const [txRes, sumRes, budgetRes] = await Promise.all([
        api.get(url),
        api.get('/finance/summary'),
        api.get('/finance/budgets'),
      ]);
      setTransactions(txRes.data);
      setSummary(sumRes.data);
      setBudgets(budgetRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormMessage('');
    if (!form.amount || !form.transaction_type) {
      setFormMessage('Amount and type are required.');
      return;
    }
    try {
      await api.post('/approvals/request-financial', {
        amount: parseFloat(form.amount),
        transaction_type: form.transaction_type,
        event_id: form.event_id ? parseInt(form.event_id) : null,
        made_by_user: user?.user_id || null,
        made_by_donor: null,
      });
      setFormMessage('Financial request submitted for approval!');
      setForm({ amount: '', transaction_type: '', event_id: '', made_by_user: '' });
      setShowForm(false);
      fetchData();
    } catch (err) {
      setFormMessage(err.response?.data?.error || 'Request failed.');
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Donation': return 'bg-green-100 text-green-800';
      case 'Expense': return 'bg-red-100 text-red-800';
      case 'Procurement': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-yellow-700 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Financial Management</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm">{user?.full_name} ({user?.role})</span>
          <button onClick={logout} className="bg-yellow-800 px-3 py-1 rounded text-sm">Logout</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6">
        <div className="flex gap-4 mb-6 text-sm">
          <a href="/dashboard" className="text-blue-600 underline">Dashboard</a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Donations</p>
            <p className="text-2xl font-bold text-green-600">PKR {parseFloat(summary.total_donations || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600">PKR {parseFloat(summary.total_expenses || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Procurement</p>
            <p className="text-2xl font-bold text-blue-600">PKR {parseFloat(summary.total_procurement || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{summary.pending_transactions || 0}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6 items-end">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Filter by Type</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm">
              <option value="">All</option>
              <option value="Donation">Donation</option>
              <option value="Expense">Expense</option>
              <option value="Procurement">Procurement</option>
            </select>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-yellow-600 text-white px-4 py-2 rounded text-sm hover:bg-yellow-700 ml-auto">
            {showForm ? 'Cancel' : '+ New Transaction'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Request Financial Transaction</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (PKR) *</label>
                <input type="number" step="0.01" value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <select value={form.transaction_type}
                  onChange={(e) => setForm({ ...form, transaction_type: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm" required>
                  <option value="">Select</option>
                  <option value="Donation">Donation</option>
                  <option value="Expense">Expense</option>
                  <option value="Procurement">Procurement</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event ID</label>
                <input type="number" value={form.event_id}
                  onChange={(e) => setForm({ ...form, event_id: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
              </div>
              <div className="md:col-span-2">
                {formMessage && <p className={`text-sm mb-2 ${formMessage.includes('submitted') ? 'text-green-600' : 'text-red-600'}`}>{formMessage}</p>}
                <button type="submit" className="bg-yellow-600 text-white px-6 py-2 rounded hover:bg-yellow-700">Submit</button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-x-auto mb-6">
          <h2 className="text-lg font-semibold p-4 border-b border-gray-200">Transactions</h2>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Event</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">By</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="text-center py-8 text-gray-500">Loading...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-8 text-gray-500">No transactions found.</td></tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.transaction_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">{tx.transaction_id}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(tx.transaction_type)}`}>{tx.transaction_type}</span>
                    </td>
                    <td className="px-4 py-3 font-medium">PKR {parseFloat(tx.amount).toLocaleString()}</td>
                    <td className="px-4 py-3">{tx.event_name || '—'}</td>
                    <td className="px-4 py-3">{tx.user_name || tx.donor_name || '—'}</td>
                    <td className="px-4 py-3">{tx.status}</td>
                    <td className="px-4 py-3">{new Date(tx.transaction_date).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <h2 className="text-lg font-semibold p-4 border-b border-gray-200">Budgets by Event</h2>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Event</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Allocated</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Spent</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Remaining</th>
              </tr>
            </thead>
            <tbody>
              {budgets.length === 0 ? (
                <tr><td colSpan="4" className="text-center py-8 text-gray-500">No budgets found.</td></tr>
              ) : (
                budgets.map((b) => (
                  <tr key={b.budget_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{b.event_name}</td>
                    <td className="px-4 py-3">PKR {parseFloat(b.total_allocated).toLocaleString()}</td>
                    <td className="px-4 py-3">PKR {parseFloat(b.total_spent || 0).toLocaleString()}</td>
                    <td className="px-4 py-3">PKR {parseFloat(b.remaining_balance || 0).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Finance;