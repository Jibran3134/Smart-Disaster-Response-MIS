import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function Teams() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    api.get('/teams').then(res => setRows(res.data)).catch(console.error);
  }, []);

  const statusColor = (s) => {
    switch (s) {
      case 'Deployed':    return 'bg-blue-600/20 text-blue-400';
      case 'Available':   return 'bg-green-600/20 text-green-400';
      case 'Standby':     return 'bg-yellow-600/20 text-yellow-400';
      case 'Unavailable': return 'bg-red-600/20 text-red-400';
      default:            return 'bg-slate-600/20 text-slate-400';
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Teams</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rows.map(t => (
          <div key={t.teamId} className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-lg">{t.teamName}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(t.status)}`}>{t.status}</span>
            </div>
            <p className="text-sm text-slate-400 mb-1">Specialization: {t.specialization}</p>
            <p className="text-sm text-slate-400 mb-1">Members: {t.memberCount}</p>
            {t.deployedAt && (
              <p className="text-xs text-slate-500 mt-2">Deployed: {new Date(t.deployedAt).toLocaleString()}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
