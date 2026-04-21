import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function Approvals() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    api.get('/approvals').then(res => setRows(res.data)).catch(console.error);
  }, []);

  const statusBadge = (s) => {
    switch (s) {
      case 'Approved': return 'bg-green-600/20 text-green-400';
      case 'Pending':  return 'bg-yellow-600/20 text-yellow-400';
      case 'Rejected': return 'bg-red-600/20 text-red-400';
      default:         return 'bg-slate-600/20 text-slate-400';
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Approvals</h1>
      <div className="overflow-x-auto bg-slate-800 rounded-xl border border-slate-700">
        <table className="w-full text-sm">
          <thead className="bg-slate-700 text-slate-300">
            <tr>
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Entity Type</th>
              <th className="px-4 py-3 text-left">Entity ID</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Comments</th>
              <th className="px-4 py-3 text-left">Requested</th>
              <th className="px-4 py-3 text-left">Reviewed</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(a => (
              <tr key={a.approvalId} className="border-t border-slate-700 hover:bg-slate-750">
                <td className="px-4 py-3 text-slate-400">#{a.approvalId}</td>
                <td className="px-4 py-3 font-medium">{a.entityType}</td>
                <td className="px-4 py-3 text-slate-400">{a.entityId}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge(a.status)}`}>{a.status}</span>
                </td>
                <td className="px-4 py-3 text-slate-400 max-w-xs truncate">{a.comments}</td>
                <td className="px-4 py-3 text-slate-400">{new Date(a.requestedAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-slate-400">
                  {a.reviewedAt ? new Date(a.reviewedAt).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
