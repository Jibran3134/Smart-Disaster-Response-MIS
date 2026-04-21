import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/finance/dashboard').then(res => setStats(res.data)).catch(console.error);
  }, []);

  const cards = stats ? [
    { label: 'Active Emergencies', value: stats.activeEmergencies,  color: 'bg-red-600' },
    { label: 'Deployed Teams',     value: stats.deployedTeams,      color: 'bg-orange-500' },
    { label: 'Available Beds',     value: stats.totalAvailableBeds,  color: 'bg-green-600' },
    { label: 'Pending Approvals',  value: stats.pendingApprovals,   color: 'bg-yellow-500' },
    { label: 'Funds Allocated',    value: `$${(stats.totalFundsAllocated || 0).toLocaleString()}`, color: 'bg-blue-600' },
    { label: 'Funds Spent',        value: `$${(stats.totalFundsSpent || 0).toLocaleString()}`,     color: 'bg-purple-600' },
  ] : [];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      {!stats ? (
        <p className="text-slate-400">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map(c => (
            <div key={c.label} className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <p className="text-sm text-slate-400 mb-2">{c.label}</p>
              <p className="text-3xl font-bold">{c.value}</p>
              <div className={`mt-3 h-1 w-16 rounded ${c.color}`}></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
