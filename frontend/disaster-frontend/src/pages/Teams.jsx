import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ team_id: '', report_id: '' });
  const [msg, setMsg] = useState({ text: '', type: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tRes, aRes] = await Promise.all([api.get('/teams'), api.get('/teams/assignments')]);
      setTeams(tRes.data);
      setAssignments(aRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ text: '', type: '' });
    try {
      await api.post('/approvals/request-deployment', {
        team_id: parseInt(form.team_id),
        report_id: parseInt(form.report_id),
      });
      setMsg({ text: 'Deployment request submitted for approval.', type: 'success' });
      setForm({ team_id: '', report_id: '' });
      setShowForm(false);
    } catch (err) {
      setMsg({ text: err.response?.data?.error || 'Request failed.', type: 'error' });
    }
  };

  const statusBadge = (s) => {
    const map = { Available: 'badge-available', Assigned: 'badge-assigned', Busy: 'badge-busy' };
    return <span className={`badge ${map[s] || 'badge-low'}`}>{s}</span>;
  };

  const available = teams.filter(t => t.availability_status === 'Available').length;
  const active = teams.filter(t => ['Assigned', 'Busy'].includes(t.availability_status)).length;

  return (
    <>
      <Navbar active="teams" />
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Rescue Teams</h1>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Request Deployment'}
          </button>
        </div>

        <div className="stat-grid">
          <div className="stat-card"><div className="label">Total Teams</div><div className="value">{teams.length}</div></div>
          <div className="stat-card"><div className="label">Available</div><div className="value green">{available}</div></div>
          <div className="stat-card"><div className="label">Active / Busy</div><div className="value accent">{active}</div></div>
          <div className="stat-card"><div className="label">Assignments</div><div className="value blue">{assignments.length}</div></div>
        </div>

        {showForm && (
          <div className="card" style={{ borderLeft: '3px solid #e8460a', marginBottom: 20 }}>
            <div className="card-header"><span className="card-title">Request team deployment</span></div>
            <div className="card-body">
              {msg.text && <div className={`alert alert-${msg.type}`} style={{ marginBottom: 16 }}>{msg.text}</div>}
              <form onSubmit={handleSubmit}>
                <div className="form-grid" style={{ marginBottom: 16 }}>
                  <div className="form-group">
                    <label>Team ID *</label>
                    <input type="number" value={form.team_id} onChange={e => setForm({ ...form, team_id: e.target.value })} placeholder="e.g. 1" />
                  </div>
                  <div className="form-group">
                    <label>Report ID *</label>
                    <input type="number" value={form.report_id} onChange={e => setForm({ ...form, report_id: e.target.value })} placeholder="e.g. 2" />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary">Submit Request</button>
              </form>
            </div>
          </div>
        )}

        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <span className="card-title">All teams</span>
            <span className="mono">{teams.length} units</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>#ID</th><th>Team Name</th><th>Type</th><th>Area</th><th>Status</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5"><div className="empty">loading...</div></td></tr>
                ) : teams.length === 0 ? (
                  <tr><td colSpan="5"><div className="empty">no teams found</div></td></tr>
                ) : teams.map(t => (
                  <tr key={t.team_id}>
                    <td className="mono">{String(t.team_id).padStart(3, '0')}</td>
                    <td style={{ fontWeight: 500 }}>{t.team_name}</td>
                    <td className="mono">{t.team_type}</td>
                    <td>{t.area_name}</td>
                    <td>{statusBadge(t.availability_status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Active assignments</span>
            <span className="mono">{assignments.length} total</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Team</th><th>Area</th><th>Severity</th><th>Assigned at</th></tr>
              </thead>
              <tbody>
                {assignments.length === 0 ? (
                  <tr><td colSpan="4"><div className="empty">no assignments</div></td></tr>
                ) : assignments.map((a, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 500 }}>{a.team_name}</td>
                    <td>{a.area_name}</td>
                    <td>{a.report_severity}</td>
                    <td className="mono">{new Date(a.assigned_at).toLocaleString()}</td>
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

export default Teams;