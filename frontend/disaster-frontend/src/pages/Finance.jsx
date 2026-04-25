import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Finance = () => {
  const { user, logout } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    amount: '',
    transaction_type: '',
    event_id: '',
    status: 'Pending',
  });
  const [formMessage, setFormMessage] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, [filterCategory]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      let url = '/finance';
      if (filterCategory) url += `?transaction_type=${filterCategory}`;
      const response = await api.get(url);
      setTransactions(response.data);
    } catch (err) {
      setError('Failed to load financial records.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormMessage('');
    if (!form.amount || !form.transaction_type) {
      setFormMessage('Amount and transaction type are required.');
      return;
    }
    try {
      await api.post('/finance', form);
      setFormMessage('Transaction recorded successfully!');
      setForm({ amount: '', transaction_type: '', event_id: '', status: 'Pending' });
      setShowForm(false);
      fetchTransactions();
    } catch (err) {
      setFormMessage(err.response?.data?.message || 'Failed to record transaction.');
    }
  };

  const getTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'donation': return 'bg-green-100 text-green-800';
      case 'expense': return 'bg-red-100 text-red-800';
      case 'procurement': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalDonations = transactions
    .filter(t => t.transaction_type?.toLowerCase() === 'donation')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const totalExpenses = transactions
    .filter(t => t.transaction_type?.toLowerCase() === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-yellow-700 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Financial Management</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm">{user?.full_name} ({user?.role})</span>
          <button onClick={logout} className="bg-yellow-800 px-3 py-1 rounded text-sm hover:bg-yellow-900">Logout</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6">
        <div className="flex gap-4 mb-6 flex-wrap">
          <a href="/dashboard" className="text-blue-600 underline text-sm">Dashboard</a>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Donations</p>
            <p className="text-2xl font-bold text-green-600">PKR {totalDonations.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600">PKR {totalExpenses.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Net Balance</p>
            <p className={`text-2xl font-bold ${totalDonations - totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              PKR {(totalDonations - totalExpenses).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Filter + New Entry */}
        <div className="flex flex-wrap gap-3 mb-6 items-end">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Filter by Type</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="">All Types</option>
              <option value="Donation">Donation</option>
              <option value="Expense">Expense</option>
              <option value="Procurement">Procurement</option>
            </select>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-yellow-600 text-white px-4 py-2 rounded text-sm hover:bg-yellow-700 ml-auto"
          >
            {showForm ? 'Cancel' : '+ New Transaction'}
          </button>
        </div>

        {/* Transaction Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Record Transaction</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (PKR) *</label>
                <input
                  type="number"
                  step="0.01"
                  name="amount"
                  value={form.amount}
                  onChange={handleFormChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  placeholder="e.g. 50000"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type *</label>
                <select
                  name="transaction_type"
                  value={form.transaction_type}
                  onChange={handleFormChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select Type</option>
                  <option value="Donation">Donation</option>
                  <option value="Expense">Expense</option>
                  <option value="Procurement">Procurement</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Disaster Event ID</label>
                <input
                  type="number"
                  name="event_id"
                  value={form.event_id}
                  onChange={handleFormChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  placeholder="e.g. 1"
                />
              </div>
              <div className="md:col-span-2">
                {formMessage && (
                  <p className={`text-sm mb-2 ${formMessage.includes('failed') || formMessage.includes('required') ? 'text-red-600' : 'text-green-600'}`}>
                    {formMessage}
                  </p>
                )}
                <button type="submit" className="bg-yellow-600 text-white px-6 py-2 rounded hover:bg-yellow-700">
                  Record
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <h2 className="text-lg font-semibold p-4 border-b border-gray-200">Transaction History</h2>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Event ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center py-8 text-gray-500">Loading...</td></tr>
              ) : error ? (
                <tr><td colSpan="6" className="text-center py-8 text-red-500">{error}</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-8 text-gray-500">No transactions found.</td></tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.transaction_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">{tx.transaction_id}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(tx.transaction_type)}`}>
                        {tx.transaction_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">PKR {parseFloat(tx.amount).toLocaleString()}</td>
                    <td className="px-4 py-3">{tx.event_id || '—'}</td>
                    <td className="px-4 py-3">{tx.status}</td>
                    <td className="px-4 py-3">{new Date(tx.transaction_date).toLocaleDateString()}</td>
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