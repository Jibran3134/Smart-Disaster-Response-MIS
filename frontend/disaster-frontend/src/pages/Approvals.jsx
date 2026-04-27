import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Approvals = () => {
  const { user, logout } = useAuth();
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const canApprove = ['Administrator', 'Emergency Operator', 'Finance Officer'].includes(user?.role);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allRes, histRes] = await Promise.all([
        api.get('/approvals?status=Pending'),
        api.get('/approvals/history'),
      ]);
      setPending(allRes.data);
      setHistory(histRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/approvals/${id}/approve`);
      setMessage('Request approved and executed successfully.');
      fetchData();
    } catch (err) {
      setMessage(err.response?.data?.details || err.response?.data?.error || 'Approval failed.');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/approvals/${id}/reject`);
      setMessage('Request rejected.');
      fetchData();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Rejection failed.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-red-700 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Approval Workflow</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm">{user?.full_name} ({user?.role})</span>
          <button onClick={logout} className="bg-red-800 px-3 py-1 rounded text-sm">Logout</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6">
        <div className="flex gap-4 mb-6 text-sm">
          <a href="/dashboard" className="text-blue-600 underline">Dashboard</a>
          <a href="/emergencies" className="text-blue-600 underline">Emergencies</a>
        </div>

        {message && (
          <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded text-sm">
            {message}
          </div>
        )}

        <div className="bg-white rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold p-4 border-b border-gray-200">Pending Requests ({pending.length})</h2>
          {loading ? (
            <p className="text-center py-8 text-gray-500">Loading...</p>
          ) : pending.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No pending requests.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Requested By</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Time</th>
                    {canApprove && <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {pending.map((r) => (
                    <tr key={r.request_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3">{r.request_id}</td>
                      <td className="px-4 py-3">{r.request_type}</td>
                      <td className="px-4 py-3">{r.requested_by_name}</td>
                      <td className="px-4 py-3">{new Date(r.request_time).toLocaleString()}</td>
                      {canApprove && (
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => handleApprove(r.request_id)}
                              className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700">Approve</button>
                            <button onClick={() => handleReject(r.request_id)}
                              className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700">Reject</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold p-4 border-b border-gray-200">Approval History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Requested By</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Reviewed By</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Time</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-8 text-gray-500">No history yet.</td></tr>
                ) : (
                  history.map((r) => (
                    <tr key={r.request_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3">{r.request_id}</td>
                      <td className="px-4 py-3">{r.request_type}</td>
                      <td className="px-4 py-3">{r.requested_by_name}</td>
                      <td className="px-4 py-3">{r.reviewed_by_name || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(r.status)}`}>{r.status}</span>
                      </td>
                      <td className="px-4 py-3">{new Date(r.request_time).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Approvals;