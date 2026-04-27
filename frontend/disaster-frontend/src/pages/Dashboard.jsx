import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend, ResponsiveContainer } from 'recharts';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6'];

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState({ emergencies: 0, activeTeams: 0, donations: 0, pending: 0 });
  const [incidentsByType, setIncidentsByType] = useState([]);
  const [incidentsBySeverity, setIncidentsBySeverity] = useState([]);
  const [resourceData, setResourceData] = useState([]);
  const [financialData, setFinancialData] = useState([]);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [reportsRes, teamsRes, summaryRes, pendingRes, inventoryRes, eventsRes] = await Promise.all([
        api.get('/emergencies/reports'),
        api.get('/teams'),
        api.get('/finance/summary'),
        api.get('/approvals?status=Pending'),
        api.get('/resources/inventory'),
        api.get('/emergencies/events'),
      ]);

      const reports = reportsRes.data || [];
      const teams = teamsRes.data || [];
      const summary = summaryRes.data || {};
      const pending = pendingRes.data || [];
      const inventory = inventoryRes.data || [];

      setCards({
        emergencies: reports.length,
        activeTeams: teams.filter(t => t.availability_status === 'Assigned' || t.availability_status === 'Busy').length,
        donations: parseFloat(summary.total_donations || 0),
        pending: pending.length,
      });

      // Incidents by type
      const typeMap = {};
      reports.forEach(r => { typeMap[r.disaster_type || 'Unknown'] = (typeMap[r.disaster_type || 'Unknown'] || 0) + 1; });
      setIncidentsByType(Object.entries(typeMap).map(([name, count]) => ({ name, count })));

      // Incidents by severity
      const sevMap = {};
      reports.forEach(r => { sevMap[r.severity || 'Unknown'] = (sevMap[r.severity || 'Unknown'] || 0) + 1; });
      setIncidentsBySeverity(Object.entries(sevMap).map(([name, value]) => ({ name, value })));

      // Resource by type
      const resMap = {};
      inventory.forEach(i => { resMap[i.resource_type] = (resMap[i.resource_type] || 0) + i.quantity_available; });
      setResourceData(Object.entries(resMap).map(([type, qty]) => ({ type, qty })));

      // Financial data
      setFinancialData([
        { type: 'Donations', amount: Math.round(parseFloat(summary.total_donations || 0)) },
        { type: 'Expenses', amount: Math.round(parseFloat(summary.total_expenses || 0)) },
        { type: 'Procurement', amount: Math.round(parseFloat(summary.total_procurement || 0)) },
      ]);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Loading dashboard...</p></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Disaster Response MIS — Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm">{user?.full_name} ({user?.role})</span>
          <button onClick={logout} className="bg-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-600">Logout</button>
        </div>
      </nav>

      <div className="bg-white border-b border-gray-200 px-6 py-2 flex gap-6 flex-wrap text-sm">
        <a href="/emergencies" className="text-blue-600 hover:underline">Emergencies</a>
        <a href="/resources" className="text-blue-600 hover:underline">Resources</a>
        <a href="/teams" className="text-blue-600 hover:underline">Teams</a>
        <a href="/hospitals" className="text-blue-600 hover:underline">Hospitals</a>
        {['Administrator', 'Finance Officer'].includes(user?.role) && (
          <a href="/finance" className="text-blue-600 hover:underline">Finance</a>
        )}
        <a href="/approvals" className="text-blue-600 hover:underline">Approvals</a>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Emergencies</p>
            <p className="text-3xl font-bold text-blue-600">{cards.emergencies}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Active Teams</p>
            <p className="text-3xl font-bold text-purple-600">{cards.activeTeams}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Donations</p>
            <p className="text-2xl font-bold text-green-600">PKR {Math.round(cards.donations).toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Pending Approvals</p>
            <p className="text-3xl font-bold text-yellow-600">{cards.pending}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-base font-semibold text-gray-700 mb-4">Incidents by Type</h2>
            {incidentsByType.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">No data</p> : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={incidentsByType}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-base font-semibold text-gray-700 mb-4">Incidents by Severity</h2>
            {incidentsBySeverity.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">No data</p> : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={incidentsBySeverity} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                    label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}>
                    {incidentsBySeverity.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-base font-semibold text-gray-700 mb-4">Resource Availability by Type</h2>
            {resourceData.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">No data</p> : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={resourceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="qty" fill="#10B981" name="Quantity" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-base font-semibold text-gray-700 mb-4">Financial Summary</h2>
            {financialData.every(d => d.amount === 0) ? <p className="text-sm text-gray-400 text-center py-8">No data</p> : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={financialData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${Math.round(v / 1000)}K`} />
                  <Tooltip formatter={(val) => `PKR ${val.toLocaleString()}`} />
                  <Bar dataKey="amount" fill="#F59E0B" name="Amount (PKR)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;