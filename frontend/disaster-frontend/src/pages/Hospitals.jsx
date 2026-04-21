import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function Hospitals() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    api.get('/hospitals').then(res => setRows(res.data)).catch(console.error);
  }, []);

  const statusColor = (s) => {
    switch (s) {
      case 'Operational': return 'bg-green-600/20 text-green-400';
      case 'Limited':     return 'bg-yellow-600/20 text-yellow-400';
      case 'Full':        return 'bg-red-600/20 text-red-400';
      case 'Closed':      return 'bg-slate-600/20 text-slate-400';
      default:            return 'bg-slate-600/20 text-slate-400';
    }
  };

  const occupancyBar = (available, total) => {
    if (total === 0) return 0;
    return Math.round(((total - available) / total) * 100);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Hospitals</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rows.map(h => {
          const pct = occupancyBar(h.availableBeds, h.totalBeds);
          return (
            <div key={h.hospitalId} className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{h.name}</h3>
                  <p className="text-sm text-slate-400">{h.city}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(h.status)}`}>
                  {h.status}
                </span>
              </div>
              <div className="flex justify-between text-sm text-slate-400 mb-2">
                <span>Beds: {h.availableBeds} / {h.totalBeds} available</span>
                <span>{pct}% occupied</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${pct}%` }}
                ></div>
              </div>
              {h.phone && <p className="text-xs text-slate-500 mt-3">📞 {h.phone}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
