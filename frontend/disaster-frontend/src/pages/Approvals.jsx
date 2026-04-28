import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

const Approvals = () => {
  const { user } = useAuth();
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const canApprove = ['Administrator', 'Emergency Operator', 'Finance Officer'].includes(user?.role);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pendRes, histRes] = await Promise.all([api.get('/approvals?status=Pending'), api.get('/approvals/history')]);
      setPending(pendRes.data);
      setHistory(histRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/approvals/${id}/approve`);
      setMsg({ text: 'Request approved and executed.', type: 'success' });
      fetchData();
    } catch (err) {
      setMsg({ text: err.response?.data?.details || err.response?.data?.error || 'Approval failed.', type: 'error' });
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/approvals/${id}/reject`);
      setMsg({ text: 'Request rejected.', type: 'info' });
      fetchData();
    } catch (err) {
      setMsg({ text: err.response?.data?.error || 'Rejection failed.', type: 'error' });
    }
  };

  const statusBadge = (s) => {
    const map = { Pending: 'badge-pending', Approved: 'badge-approved', Rejected: 'badge-rejected' };
    return <span className={`badge ${map[s] || ''}`}>{s}</span>;
  };

  return (
    <>
      <Navbar active="approvals" />
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Approval Workflow</h1>
          <span className="mono" style={{ color: '#7a7870' }}>{pending.length} pending</span>
        </div>

        {msg.text && <div className={`alert alert-${msg.type}`} style={{ marginBottom: 20 }}>{msg.text}</div>}

        <div className="stat-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card"><div className="label">Pending</div><div className="value yellow">{pending.length}</div></div>
          <div className="stat-card"><div className="label">Total History</div><div className="value">{history.length}</div></div>
          <div className="stat-card"><div className="label">Approved</div><div className="value green">{history.filter(h => h.status === 'Approved').length}</div></div>
          <div className="stat-card"><div className="label">Rejected</div><div className="value red">{history.filter(h => h.status === 'Rejected').length}</div></div>
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <span className="card-title">Pending requests</span>
            <span className="mono">{pending.length} awaiting action</span>
          </div>
          {loading ? (
            <div className="empty" style={{ padding: '32px 0' }}>loading...</div>
          ) : pending.length === 0 ? (
            <div className="empty" style={{ padding: '32px 0' }}>no pending requests</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#ID</th><th>Type</th><th>Requested by</th><th>Timestamp</th>
                    {canApprove && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {pending.map(r => (
                    <tr key={r.request_id}>
                      <td className="mono">{String(r.request_id).padStart(4, '0')}</td>
                      <td style={{ fontWeight: 500 }}>{r.request_type}</td>
                      <td>{r.requested_by_name}</td>
                      <td className="mono">{new Date(r.request_time).toLocaleString()}</td>
                      {canApprove && (
                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-success btn-sm" onClick={() => handleApprove(r.request_id)}>Approve</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleReject(r.request_id)}>Reject</button>
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

        <div className="card">
          <div className="card-header">
            <span className="card-title">Approval history</span>
            <span className="mono">{history.length} records</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>#ID</th><th>Type</th><th>Requested by</th><th>Reviewed by</th><th>Status</th><th>Timestamp</th></tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr><td colSpan="6"><div className="empty">no history</div></td></tr>
                ) : history.map(r => (
                  <tr key={r.request_id}>
                    <td className="mono">{String(r.request_id).padStart(4, '0')}</td>
                    <td style={{ fontWeight: 500 }}>{r.request_type}</td>
                    <td>{r.requested_by_name}</td>
                    <td>{r.reviewed_by_name || '—'}</td>
                    <td>{statusBadge(r.status)}</td>
                    <td className="mono">{new Date(r.request_time).toLocaleString()}</td>
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

export default Approvals;