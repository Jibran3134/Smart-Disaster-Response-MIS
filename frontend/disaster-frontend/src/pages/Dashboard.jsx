import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend, ResponsiveContainer } from 'recharts';
import api from '../api/axios';
import Navbar from '../components/Navbar';

const COLORS = ['#e8460a', '#ef4444', '#eab308', '#22c55e', '#3b82f6'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1a1a24', border: '1px solid rgba(232,70,10,0.3)', borderRadius: 3, padding: '8px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#e8e6e0' }}>
      <p style={{ color: '#7a7870', marginBottom: 4 }}>{label}</p>
      <p style={{ color: '#e8460a' }}>{payload[0].value}</p>
    </div>
  );
};

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState({ emergencies: 0, activeTeams: 0, donations: 0, pending: 0 });
  const [byType, setByType] = useState([]);
  const [bySeverity, setBySeverity] = useState([]);
  const [byResource, setByResource] = useState([]);
  const [byFinance, setByFinance] = useState([]);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [reportsRes, teamsRes, summaryRes, pendingRes, inventoryRes] = await Promise.all([
        api.get('/emergencies/reports'),
        api.get('/teams'),
        api.get('/finance/summary'),
        api.get('/approvals?status=Pending'),
        api.get('/resources/inventory'),
      ]);
      const reports = reportsRes.data || [];
      const teams = teamsRes.data || [];
      const summary = summaryRes.data || {};
      const inventory = inventoryRes.data || [];

      setCards({
        emergencies: reports.length,
        activeTeams: teams.filter(t => ['Assigned', 'Busy'].includes(t.availability_status)).length,
        donations: parseFloat(summary.total_donations || 0),
        pending: (pendingRes.data || []).length,
      });

      const typeMap = {};
      reports.forEach(r => { typeMap[r.disaster_type || 'Unknown'] = (typeMap[r.disaster_type || 'Unknown'] || 0) + 1; });
      setByType(Object.entries(typeMap).map(([name, count]) => ({ name, count })));

      const sevMap = {};
      reports.forEach(r => { sevMap[r.severity || 'Unknown'] = (sevMap[r.severity || 'Unknown'] || 0) + 1; });
      setBySeverity(Object.entries(sevMap).map(([name, value]) => ({ name, value })));

      const resMap = {};
      inventory.forEach(i => { resMap[i.resource_type] = (resMap[i.resource_type] || 0) + i.quantity_available; });
      setByResource(Object.entries(resMap).map(([type, qty]) => ({ type, qty })));

      setByFinance([
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

  if (loading) return (
    <>
      <Navbar active="dashboard" />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#4a4845' }}>
        loading operational data...
      </div>
    </>
  );

  const axisStyle = { fill: '#4a4845', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" };
  const gridStyle = { stroke: 'rgba(255,255,255,0.05)' };

  return (
    <>
      <Navbar active="dashboard" />
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Operational Overview</h1>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#4a4845' }}>
            {new Date().toLocaleString()}
          </span>
        </div>

        <div className="stat-grid">
          <div className="stat-card">
            <div className="label">Total Incidents</div>
            <div className="value accent">{cards.emergencies}</div>
          </div>
          <div className="stat-card">
            <div className="label">Active Teams</div>
            <div className="value blue">{cards.activeTeams}</div>
          </div>
          <div className="stat-card">
            <div className="label">Total Donations</div>
            <div className="value green" style={{ fontSize: 18 }}>PKR {Math.round(cards.donations).toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <div className="label">Pending Approvals</div>
            <div className="value yellow">{cards.pending}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div className="card">
            <div className="card-header"><span className="card-title">Incidents by type</span></div>
            <div className="card-body">
              {byType.length === 0 ? <div className="empty">no data</div> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={byType} barSize={28}>
                    <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
                    <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(232,70,10,0.05)' }} />
                    <Bar dataKey="count" fill="#e8460a" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">Incidents by severity</span></div>
            <div className="card-body">
              {bySeverity.length === 0 ? <div className="empty">no data</div> : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={bySeverity} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}
                      label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}
                      labelLine={{ stroke: 'rgba(255,255,255,0.2)' }}>
                      {bySeverity.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="card">
            <div className="card-header"><span className="card-title">Resource availability</span></div>
            <div className="card-body">
              {byResource.length === 0 ? <div className="empty">no data</div> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={byResource} barSize={28}>
                    <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="type" tick={axisStyle} axisLine={false} tickLine={false} />
                    <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(232,70,10,0.05)' }} />
                    <Bar dataKey="qty" fill="#22c55e" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">Financial summary</span></div>
            <div className="card-body">
              {byFinance.every(d => d.amount === 0) ? <div className="empty">no data</div> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={byFinance} barSize={28}>
                    <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="type" tick={axisStyle} axisLine={false} tickLine={false} />
                    <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={v => `${Math.round(v / 1000)}K`} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(232,70,10,0.05)' }} formatter={v => `PKR ${v.toLocaleString()}`} />
                    <Bar dataKey="amount" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;