import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Teams = () => {
  const { user, logout } = useAuth();
  const [teams, setTeams] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ team_id: '', report_id: '' });
  const [formMessage, setFormMessage] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [teamsRes, assignRes] = await Promise.all([
        api.get('/teams'),
        api.get('/teams/assignments')
      ]);
      setTeams(teamsRes.data);
      setAssignments(assignRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setFormMessage('');
    if (!form.team_id || !form.report_id) {
      setFormMessage('Both fields are required.');
      return;
    }
    try {
      await api.post('/approvals/request-deployment', {
        team_id: parseInt(form.team_id),
        report_id: parseInt(form.report_id),
      });
      setFormMessage('Deployment request submitted for approval!');
      setForm({ team_id: '', report_id: '' });
      setShowForm(false);
    } catch (err) {
      setFormMessage(err.response?.data?.error || 'Request failed.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-800';
      case 'Assigned': return 'bg-blue-100 text-blue-800';
      case 'Busy': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-purple-700 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Rescue Team Management</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm">{user?.full_name} ({user?.role})</span>
          <button onClick={logout} className="bg-purple-800 px-3 py-1 rounded text-sm">Logout</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6">
        <div className="flex gap-4 mb-6 text-sm">
          <a href="/dashboard" className="text-blue-600 underline">Dashboard</a>
          <a href="/emergencies" className="text-blue-600 underline">Emergencies</a>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Request Team Deployment</h2>
            <button onClick={() => setShowForm(!showForm)} className="text-sm text-blue-600 underline">
              {showForm ? 'Hide' : 'Show Form'}
            </button>
          </div>
          {showForm && (
            <form onSubmit={handleAssign} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team ID *</label>
                <input type="number" value={form.team_id}
                  onChange={(e) => setForm({ ...form, team_id: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="e.g. 1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Report ID *</label>
                <input type="number" value={form.report_id}
                  onChange={(e) => setForm({ ...form, report_id: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="e.g. 2" />
              </div>
              <div className="md:col-span-2">
                {formMessage && <p className={`text-sm mb-2 ${formMessage.includes('submitted') ? 'text-green-600' : 'text-red-600'}`}>{formMessage}</p>}
                <button type="submit" className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700">Submit Request</button>
              </div>
            </form>
          )}
        </div>

        <div className="bg-white rounded-lg shadow overflow-x-auto mb-6">
          <h2 className="text-lg font-semibold p-4 border-b border-gray-200">All Rescue Teams</h2>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Team Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Area</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center py-8 text-gray-500">Loading...</td></tr>
              ) : teams.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-8 text-gray-500">No teams found.</td></tr>
              ) : (
                teams.map((t) => (
                  <tr key={t.team_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">{t.team_id}</td>
                    <td className="px-4 py-3 font-medium">{t.team_name}</td>
                    <td className="px-4 py-3">{t.team_type}</td>
                    <td className="px-4 py-3">{t.area_name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(t.availability_status)}`}>{t.availability_status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <h2 className="text-lg font-semibold p-4 border-b border-gray-200">Active Assignments</h2>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Team</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Area</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Severity</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Assigned At</th>
              </tr>
            </thead>
            <tbody>
              {assignments.length === 0 ? (
                <tr><td colSpan="4" className="text-center py-8 text-gray-500">No assignments.</td></tr>
              ) : (
                assignments.map((a, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{a.team_name}</td>
                    <td className="px-4 py-3">{a.area_name}</td>
                    <td className="px-4 py-3">{a.report_severity}</td>
                    <td className="px-4 py-3">{new Date(a.assigned_at).toLocaleString()}</td>
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

export default Teams;