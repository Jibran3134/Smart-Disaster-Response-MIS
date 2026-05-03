import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';

const Emergencies = () => {
  const [reports, setReports] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ event_id: '', area_name: '', latitude: '', longitude: '', severity: '' });
  const [msg, setMsg] = useState({ text: '', type: '' });

  useEffect(() => { fetchData(); }, [filterSeverity]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = '/emergencies/reports';
      if (filterSeverity) url += `?severity=${filterSeverity}`;
      const [rRes, eRes] = await Promise.all([api.get(url), api.get('/emergencies/events')]);
      setReports(rRes.data);
      setEvents(eRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ text: '', type: '' });
    if (!form.event_id || !form.area_name || !form.latitude || !form.longitude || !form.severity) {
      setMsg({ text: 'All fields are required.', type: 'error' }); return;
    }
    try {
      await api.post('/emergencies/reports', form);
      setMsg({ text: 'Report submitted successfully.', type: 'success' });
      setForm({ event_id: '', area_name: '', latitude: '', longitude: '', severity: '' });
      setShowForm(false);
      fetchData();
    } catch (err) {
      setMsg({ text: err.response?.data?.error || 'Submission failed.', type: 'error' });
    }
  };

  const sevBadge = (s) => {
    const map = { Critical: 'badge-critical', High: 'badge-high', Medium: 'badge-medium', Low: 'badge-low' };
    return <span className={`badge ${map[s] || 'badge-low'}`}>{s}</span>;
  };

  return (
    <>
      <Navbar active="emergencies" />
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Emergency Reports</h1>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ New Report'}
          </button>
        </div>

        {showForm && (
          <div className="card" style={{ borderLeft: '3px solid #e8460a' }}>
            <div className="card-header"><span className="card-title">Submit new report</span></div>
            <div className="card-body">
              {msg.text && <div className={`alert alert-${msg.type}`} style={{ marginBottom: 16 }}>{msg.text}</div>}
              <form onSubmit={handleSubmit}>
                <div className="form-grid" style={{ marginBottom: 16 }}>
                  <div className="form-group">
                    <label>Disaster event *</label>
                    <select value={form.event_id} onChange={e => setForm({ ...form, event_id: e.target.value })} required>
                      <option value="">Select event</option>
                      {events.map(ev => <option key={ev.event_id} value={ev.event_id}>{ev.event_name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Area name *</label>
                    <input type="text" value={form.area_name} onChange={e => setForm({ ...form, area_name: e.target.value })} placeholder="e.g. North Karachi" required />
                  </div>
                  <div className="form-group">
                    <label>Severity *</label>
                    <select value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })} required>
                      <option value="">Select</option>
                      <option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Latitude *</label>
                    <input type="number" step="any" value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} placeholder="24.8607" required />
                  </div>
                  <div className="form-group">
                    <label>Longitude *</label>
                    <input type="number" step="any" value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} placeholder="67.0011" required />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary">Submit Report</button>
              </form>
            </div>
          </div>
        )}

        <div className="filter-row">
          <div className="form-group">
            <label>Filter severity</label>
            <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}>
              <option value="">All</option>
              <option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
            </select>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Reports log</span>
            <span className="mono">{reports.length} records</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#ID</th><th>Area</th><th>Event</th><th>Severity</th>
                  <th>Status</th><th>Reporter</th><th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7"><div className="empty">loading...</div></td></tr>
                ) : reports.length === 0 ? (
                  <tr><td colSpan="7"><div className="empty">no reports found</div></td></tr>
                ) : reports.map(r => (
                  <tr key={r.report_id}>
                    <td className="mono">{String(r.report_id).padStart(4, '0')}</td>
                    <td style={{ fontWeight: 500 }}>{r.area_name}</td>
                    <td>{r.event_name}</td>
                    <td>{sevBadge(r.severity)}</td>
                    <td><span className="mono" style={{ color: '#7a7870' }}>{r.status}</span></td>
                    <td>{r.reporter_name}</td>
                    <td className="mono">{new Date(r.report_time).toLocaleString()}</td>
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

export default Emergencies;