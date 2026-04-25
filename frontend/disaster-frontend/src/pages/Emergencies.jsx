import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Emergencies = () => {
  const { user, logout } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [form, setForm] = useState({
    area_name: '',
    disaster_type: '',
    severity: '',
    latitude: '',
    longitude: '',
  });
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  // Load reports on mount
  useEffect(() => {
    fetchReports();
  }, [filterSeverity, filterType]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      let url = '/emergencies';
      const params = [];
      if (filterSeverity) params.push(`severity=${filterSeverity}`);
      if (filterType) params.push(`disaster_type=${filterType}`);
      if (params.length > 0) url += '?' + params.join('&');

      const response = await api.get(url);
      setReports(response.data);
    } catch (err) {
      setError('Failed to load emergency reports.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');

    if (!form.area_name || !form.disaster_type || !form.severity) {
      setSubmitError('Area, disaster type, and severity are required.');
      return;
    }

    try {
      await api.post('/emergencies', form);
      setSubmitSuccess('Emergency report submitted successfully!');
      setForm({ area_name: '', disaster_type: '', severity: '', latitude: '', longitude: '' });
      setShowForm(false);
      fetchReports(); // Refresh the list
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to submit report.');
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Emergency Reports</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm">Welcome, {user?.full_name} ({user?.role})</span>
          <button onClick={logout} className="bg-blue-800 px-3 py-1 rounded text-sm hover:bg-blue-900">Logout</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6">
        {/* Navigation links */}
        <div className="flex gap-4 mb-6 flex-wrap">
          <a href="/dashboard" className="text-blue-600 underline text-sm">Dashboard</a>
          <a href="/resources" className="text-blue-600 underline text-sm">Resources</a>
          <a href="/teams" className="text-blue-600 underline text-sm">Teams</a>
          <a href="/hospitals" className="text-blue-600 underline text-sm">Hospitals</a>
          <a href="/approvals" className="text-blue-600 underline text-sm">Approvals</a>
        </div>

        {/* Filters and New Report Button */}
        <div className="flex flex-wrap gap-3 mb-6 items-end">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Filter by Severity</label>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Filter by Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="">All Types</option>
              <option value="Flood">Flood</option>
              <option value="Earthquake">Earthquake</option>
              <option value="Fire">Fire</option>
              <option value="Cyclone">Cyclone</option>
            </select>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 ml-auto"
          >
            {showForm ? 'Cancel' : '+ New Report'}
          </button>
        </div>

        {/* New Report Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Submit Emergency Report</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Area Name *</label>
                <input
                  type="text"
                  name="area_name"
                  value={form.area_name}
                  onChange={handleFormChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  placeholder="e.g. North Karachi"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Disaster Type *</label>
                <select
                  name="disaster_type"
                  value={form.disaster_type}
                  onChange={handleFormChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select Type</option>
                  <option value="Flood">Flood</option>
                  <option value="Earthquake">Earthquake</option>
                  <option value="Fire">Fire</option>
                  <option value="Cyclone">Cyclone</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Severity *</label>
                <select
                  name="severity"
                  value={form.severity}
                  onChange={handleFormChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select Severity</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  name="latitude"
                  value={form.latitude}
                  onChange={handleFormChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  placeholder="e.g. 24.8607"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  name="longitude"
                  value={form.longitude}
                  onChange={handleFormChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  placeholder="e.g. 67.0011"
                />
              </div>
              <div className="md:col-span-2">
                {submitError && <p className="text-red-600 text-sm mb-2">{submitError}</p>}
                {submitSuccess && <p className="text-green-600 text-sm mb-2">{submitSuccess}</p>}
                <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Reports Table */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Area</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Severity</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Reported</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center py-8 text-gray-500">Loading...</td></tr>
              ) : error ? (
                <tr><td colSpan="6" className="text-center py-8 text-red-500">{error}</td></tr>
              ) : reports.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-8 text-gray-500">No reports found.</td></tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.report_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">{report.report_id}</td>
                    <td className="px-4 py-3">{report.area_name}</td>
                    <td className="px-4 py-3">{report.disaster_type}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(report.severity)}`}>
                        {report.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3">{report.status}</td>
                    <td className="px-4 py-3">{new Date(report.report_time).toLocaleString()}</td>
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