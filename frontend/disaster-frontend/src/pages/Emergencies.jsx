import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Emergencies = () => {
  const { user, logout } = useAuth();
  const [reports, setReports] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ event_id: '', area_name: '', latitude: '', longitude: '', severity: '' });
  const [formMessage, setFormMessage] = useState('');

  useEffect(() => { fetchData(); }, [filterSeverity]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = '/emergencies/reports';
      if (filterSeverity) url += `?severity=${filterSeverity}`;
      const [reportsRes, eventsRes] = await Promise.all([
        api.get(url),
        api.get('/emergencies/events')
      ]);
      setReports(reportsRes.data);
      setEvents(eventsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormMessage('');
    if (!form.event_id || !form.area_name || !form.latitude || !form.longitude || !form.severity) {
      setFormMessage('All fields are required.');
      return;
    }
    try {
      await api.post('/emergencies/reports', form);
      setFormMessage('Report submitted successfully!');
      setForm({ event_id: '', area_name: '', latitude: '', longitude: '', severity: '' });
      setShowForm(false);
      fetchData();
    } catch (err) {
      setFormMessage(err.response?.data?.error || 'Failed to submit report.');
    }
  };

  const getSeverityColor = (s) => {
    switch (s) {
      case 'Critical': return 'bg-red-100 text-red-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Emergency Reports</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm">{user?.full_name} ({user?.role})</span>
          <button onClick={logout} className="bg-blue-800 px-3 py-1 rounded text-sm hover:bg-blue-900">Logout</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6">
        <div className="flex gap-4 mb-6 flex-wrap text-sm">
          <a href="/dashboard" className="text-blue-600 underline">Dashboard</a>
          <a href="/resources" className="text-blue-600 underline">Resources</a>
          <a href="/teams" className="text-blue-600 underline">Teams</a>
          <a href="/hospitals" className="text-blue-600 underline">Hospitals</a>
          <a href="/approvals" className="text-blue-600 underline">Approvals</a>
        </div>

        <div className="flex flex-wrap gap-3 mb-6 items-end">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Filter by Severity</label>
            <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm">
              <option value="">All</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 ml-auto">
            {showForm ? 'Cancel' : '+ New Report'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Submit Emergency Report</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Disaster Event *</label>
                <select name="event_id" value={form.event_id}
                  onChange={(e) => setForm({ ...form, event_id: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm" required>
                  <option value="">Select Event</option>
                  {events.map(ev => (
                    <option key={ev.event_id} value={ev.event_id}>{ev.event_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Area Name *</label>
                <input type="text" value={form.area_name}
                  onChange={(e) => setForm({ ...form, area_name: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  placeholder="e.g. North Karachi" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Severity *</label>
                <select value={form.severity}
                  onChange={(e) => setForm({ ...form, severity: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm" required>
                  <option value="">Select</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Latitude *</label>
                <input type="number" step="any" value={form.latitude}
                  onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  placeholder="e.g. 24.8607" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Longitude *</label>
                <input type="number" step="any" value={form.longitude}
                  onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  placeholder="e.g. 67.0011" required />
              </div>
              <div className="md:col-span-2">
                {formMessage && <p className={`text-sm mb-2 ${formMessage.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{formMessage}</p>}
                <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">Submit</button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Area</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Event</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Severity</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Reporter</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Time</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="text-center py-8 text-gray-500">Loading...</td></tr>
              ) : reports.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-8 text-gray-500">No reports found.</td></tr>
              ) : (
                reports.map((r) => (
                  <tr key={r.report_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">{r.report_id}</td>
                    <td className="px-4 py-3">{r.area_name}</td>
                    <td className="px-4 py-3">{r.event_name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(r.severity)}`}>{r.severity}</span>
                    </td>
                    <td className="px-4 py-3">{r.status}</td>
                    <td className="px-4 py-3">{r.reporter_name}</td>
                    <td className="px-4 py-3">{new Date(r.report_time).toLocaleString()}</td>
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

export default Emergencies;