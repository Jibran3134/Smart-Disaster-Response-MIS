import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer
} from 'recharts';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6'];

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    incidentsByType: [],
    incidentsBySeverity: [],
    resourceUtilization: [],
    financialSummary: [],
  });
  const [loading, setLoading] = useState(true);
  const [summaryCards, setSummaryCards] = useState({
    totalEmergencies: 0,
    activeTeams: 0,
    totalDonations: 0,
    pendingApprovals: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [emergencies, teams, transactions, approvals, resources] = await Promise.all([
        api.get('/emergencies'),
        api.get('/teams'),
        api.get('/finance'),
        api.get('/approvals'),
        api.get('/resources'),
      ]);

      const emergencyData = emergencies.data || [];
      const teamData = teams.data || [];
      const transactionData = transactions.data || [];
      const approvalData = approvals.data || [];

      // Summary cards
      setSummaryCards({
        totalEmergencies: emergencyData.length,
        activeTeams: teamData.filter(t => t.availability_status === 'Assigned' || t.availability_status === 'Busy').length,
        totalDonations: transactionData
          .filter(t => t.transaction_type === 'Donation')
          .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0),
        pendingApprovals: approvalData.filter(a => a.status === 'Pending').length,
      });

      // Bar chart — incidents by disaster type
      const typeCount = {};
      emergencyData.forEach(e => {
        typeCount[e.disaster_type] = (typeCount[e.disaster_type] || 0) + 1;
      });
      const incidentsByType = Object.entries(typeCount).map(([name, count]) => ({ name, count }));

      // Pie chart — incidents by severity
      const sevCount = {};
      emergencyData.forEach(e => {
        sevCount[e.severity] = (sevCount[e.severity] || 0) + 1;
      });
      const incidentsBySeverity = Object.entries(sevCount).map(([name, value]) => ({ name, value }));

      // Line chart — resource utilization (group resources by type)
      const resCount = {};
      (resources.data || []).forEach(r => {
        resCount[r.resource_type] = (resCount[r.resource_type] || 0) + r.quantity_available;
      });
      const resourceUtilization = Object.entries(resCount).map(([type, qty]) => ({ type, qty }));

      // Bar chart — financial summary by transaction type
      const finCount = {};
      transactionData.forEach(t => {
        finCount[t.transaction_type] = (finCount[t.transaction_type] || 0) + parseFloat(t.amount || 0);
      });
      const financialSummary = Object.entries(finCount).map(([type, amount]) => ({ type, amount: Math.round(amount) }));

      setStats({ incidentsByType, incidentsBySeverity, resourceUtilization, financialSummary });
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Disaster Response MIS — Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm">{user?.full_name} ({user?.role})</span>
          <button onClick={logout} className="bg-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-600">Logout</button>
        </div>
      </nav>

      {/* Navigation */}
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
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Emergencies</p>
            <p className="text-3xl font-bold text-blue-600">{summaryCards.totalEmergencies}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Active Teams</p>
            <p className="text-3xl font-bold text-purple-600">{summaryCards.activeTeams}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Donations</p>
            <p className="text-3xl font-bold text-green-600">
              PKR {Math.round(summaryCards.totalDonations).toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Pending Approvals</p>
            <p className="text-3xl font-bold text-yellow-600">{summaryCards.pendingApprovals}</p>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Bar Chart — Incidents by Type */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-base font-semibold text-gray-700 mb-4">Incidents by Disaster Type</h2>
            {stats.incidentsByType.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.incidentsByType}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Pie Chart — Incidents by Severity */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-base font-semibold text-gray-700 mb-4">Incidents by Severity</h2>
            {stats.incidentsBySeverity.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stats.incidentsBySeverity}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}
                  >
                    {stats.incidentsBySeverity.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bar Chart — Resource by Type */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-base font-semibold text-gray-700 mb-4">Resource Availability by Type</h2>
            {stats.resourceUtilization.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.resourceUtilization}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="qty" fill="#10B981" name="Quantity" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Bar Chart — Financial Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-base font-semibold text-gray-700 mb-4">Financial Summary by Category</h2>
            {stats.financialSummary.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.financialSummary}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
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