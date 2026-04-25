import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Approvals = () => {
  const { user, logout } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  const canApprove = ['Administrator', 'Emergency Operator'].includes(user?.role);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await api.get('/approvals');
      setRequests(response.data);
    } catch (err) {
      setError('Failed to load approval requests.');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (requestId, action) => {
    setActionMessage('');
    try {
      await api.put(`/approvals/${requestId}`, { status: action });
      setActionMessage(`Request ${action.toLowerCase()} successfully.`);
      fetchRequests();
    } catch (err) {
      setActionMessage(err.response?.data?.message || `Failed to ${action.toLowerCase()} request.`);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const pendingRequests = requests.filter(r => r.status?.toLowerCase() === 'pending');
  const historyRequests = requests.filter(r => r.status?.toLowerCase() !== 'pending');

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-red-700 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Approval Workflow</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm">{user?.full_name} ({user?.role})</span>
          <button onClick={logout} className="bg-red-800 px-3 py-1 rounded text-sm hover:bg-red-900">Logout</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6">
        <div className="flex gap-4 mb-6 flex-wrap">
          <a href="/dashboard" className="text-blue-600 underline text-sm">Dashboard</a>
          <a href="/emergencies" className="text-blue-600 underline text-sm">Emergencies</a>
        </div>

        {actionMessage && (
          <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded text-sm">
            {actionMessage}
          </div>
        )}

        {/* Pending Requests */}
        <div className="bg-white rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold p-4 border-b border-gray-200">
            Pending Requests ({pendingRequests.length})
          </h2>
          {loading ? (
            <p className="text-center py-8 text-gray-500">Loading...</p>
          ) : error ? (
            <p className="text-center py-8 text-red-500">{error}</p>
          ) : pendingRequests.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No pending requests.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Requested By</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Remarks</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Time</th>
                    {canApprove && <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {pendingRequests.map((req) => (
                    <tr key={req.request_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3">{req.request_id}</td>
                      <td className="px-4 py-3">{req.request_type}</td>
                      <td className="px-4 py-3">{req.requested_by}</td>
                      <td className="px-4 py-3 max-w-xs truncate">{req.remarks || '—'}</td>
                      <td className="px-4 py-3">{new Date(req.request_time).toLocaleString()}</td>
                      {canApprove && (
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAction(req.request_id, 'Approved')}
                              className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleAction(req.request_id, 'Rejected')}
                              className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700"
                            >
                              Reject
                            </button>
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

        {/* Approval History */}
        <div className="bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold p-4 border-b border-gray-200">Approval History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Approved By</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Time</th>
                </tr>
              </thead>
              <tbody>
                {historyRequests.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-8 text-gray-500">No history yet.</td></tr>
                ) : (
                  historyRequests.map((req) => (
                    <tr key={req.request_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3">{req.request_id}</td>
                      <td className="px-4 py-3">{req.request_type}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(req.status)}`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">{req.approved_by || '—'}</td>
                      <td className="px-4 py-3">{new Date(req.request_time).toLocaleString()}</td>
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