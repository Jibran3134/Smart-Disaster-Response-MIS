import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Teams = () => {
  const { user, logout } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [assignForm, setAssignForm] = useState({ team_id: '', report_id: '' });
  const [assignMessage, setAssignMessage] = useState('');

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const response = await api.get('/teams');
      setTeams(response.data);
    } catch (err) {
      setError('Failed to load teams.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setAssignMessage('');
    if (!assignForm.team_id || !assignForm.report_id) {
      setAssignMessage('Both fields are required.');
      return;
    }
    try {
      await api.post('/teams/assign', assignForm);
      setAssignMessage('Team assigned successfully!');
      setAssignForm({ team_id: '', report_id: '' });
      fetchTeams();
    } catch (err) {
      setAssignMessage(err.response?.data?.message || 'Assignment failed.');
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'busy': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-purple-700 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Rescue Team Management</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm">{user?.full_name} ({user?.role})</span>
          <button onClick={logout} className="bg-purple-800 px-3 py-1 rounded text-sm hover:bg-purple-900">Logout</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6">
        <div className="flex gap-4 mb-6 flex-wrap">
          <a href="/dashboard" className="text-blue-600 underline text-sm">Dashboard</a>
          <a href="/emergencies" className="text-blue-600 underline text-sm">Emergencies</a>
        </div>

        {/* Assignment Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Assign Team to Emergency</h2>
            <button onClick={() => setShowAssignForm(!showAssignForm)} className="text-sm text-blue-600 underline">
              {showAssignForm ? 'Hide' : 'Show Form'}
            </button>
          </div>

          {showAssignForm && (
            <form onSubmit={handleAssign} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team ID</label>
                <input
                  type="number"
                  name="team_id"
                  value={assignForm.team_id}
                  onChange={(e) => setAssignForm({ ...assignForm, team_id: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  placeholder="e.g. 2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Report ID</label>
                <input
                  type="number"
                  name="report_id"
                  value={assignForm.report_id}
                  onChange={(e) => setAssignForm({ ...assignForm, report_id: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  placeholder="e.g. 5"
                />
              </div>
              <div className="md:col-span-2">
                {assignMessage && (
                  <p className={`text-sm mb-2 ${assignMessage.includes('failed') || assignMessage.includes('required') ? 'text-red-600' : 'text-green-600'}`}>
                    {assignMessage}
                  </p>
                )}
                <button type="submit" className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700">
                  Assign Team
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Teams Table */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <h2 className="text-lg font-semibold p-4 border-b border-gray-200">All Rescue Teams</h2>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Team Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Location</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center py-8 text-gray-500">Loading...</td></tr>
              ) : error ? (
                <tr><td colSpan="5" className="text-center py-8 text-red-500">{error}</td></tr>
              ) : teams.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-8 text-gray-500">No teams found.</td></tr>
              ) : (
                teams.map((team) => (
                  <tr key={team.team_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">{team.team_id}</td>
                    <td className="px-4 py-3 font-medium">{team.team_name}</td>
                    <td className="px-4 py-3">{team.team_type}</td>
                    <td className="px-4 py-3">{team.current_location || team.area_name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(team.availability_status)}`}>
                        {team.availability_status}
                      </span>
                    </td>
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