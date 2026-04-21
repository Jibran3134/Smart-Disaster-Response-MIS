import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function Emergencies() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    api.get('/emergencies').then(res => setRows(res.data)).catch(console.error);
  }, []);

  const severityColor = (s) => {
    switch (s) {
      case 'Critical': return 'text-red-400';
      case 'High':     return 'text-orange-400';
      case 'Medium':   return 'text-yellow-400';
      default:         return 'text-green-400';
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Emergencies</h1>
      <div className="overflow-x-auto bg-slate-800 rounded-xl border border-slate-700">
        <table className="w-full text-sm">
          <thead className="bg-slate-700 text-slate-300">
            <tr>
              <th className="px-4 py-3 text-left">Title</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Severity</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Location</th>
              <th className="px-4 py-3 text-left">Reported</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(e => (
              <tr key={e.emergencyId} className="border-t border-slate-700 hover:bg-slate-750">
                <td className="px-4 py-3 font-medium">{e.title}</td>
                <td className="px-4 py-3">{e.type}</td>
                <td className={`px-4 py-3 font-semibold ${severityColor(e.severity)}`}>{e.severity}</td>
                <td className="px-4 py-3">{e.status}</td>
                <td className="px-4 py-3 text-slate-400">{e.location}</td>
                <td className="px-4 py-3 text-slate-400">{new Date(e.reportedAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
