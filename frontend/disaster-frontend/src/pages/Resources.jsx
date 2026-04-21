import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function Resources() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    api.get('/resources').then(res => setRows(res.data)).catch(console.error);
  }, []);

  const statusColor = (s) => {
    switch (s) {
      case 'Available':   return 'bg-green-600/20 text-green-400';
      case 'Deployed':    return 'bg-blue-600/20 text-blue-400';
      case 'Depleted':    return 'bg-red-600/20 text-red-400';
      case 'Maintenance': return 'bg-yellow-600/20 text-yellow-400';
      default:            return 'bg-slate-600/20 text-slate-400';
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Resources</h1>
      <div className="overflow-x-auto bg-slate-800 rounded-xl border border-slate-700">
        <table className="w-full text-sm">
          <thead className="bg-slate-700 text-slate-300">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Qty</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Location</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.resourceId} className="border-t border-slate-700 hover:bg-slate-750">
                <td className="px-4 py-3 font-medium">{r.name}</td>
                <td className="px-4 py-3">{r.category}</td>
                <td className="px-4 py-3">{r.quantity} {r.unit}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(r.status)}`}>{r.status}</span>
                </td>
                <td className="px-4 py-3 text-slate-400">{r.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
