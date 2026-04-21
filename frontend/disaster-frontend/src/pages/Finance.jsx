import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function Finance() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    api.get('/finance').then(res => setRows(res.data)).catch(console.error);
  }, []);

  const typeColor = (t) => {
    switch (t) {
      case 'Allocation':    return 'text-blue-400';
      case 'Expenditure':   return 'text-red-400';
      case 'Donation':      return 'text-green-400';
      case 'Reimbursement': return 'text-purple-400';
      default:              return 'text-slate-400';
    }
  };

  const statusBadge = (s) => {
    switch (s) {
      case 'Approved':  return 'bg-green-600/20 text-green-400';
      case 'Completed': return 'bg-blue-600/20 text-blue-400';
      case 'Pending':   return 'bg-yellow-600/20 text-yellow-400';
      case 'Rejected':  return 'bg-red-600/20 text-red-400';
      default:          return 'bg-slate-600/20 text-slate-400';
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Financial Transactions</h1>
      <div className="overflow-x-auto bg-slate-800 rounded-xl border border-slate-700">
        <table className="w-full text-sm">
          <thead className="bg-slate-700 text-slate-300">
            <tr>
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(ft => (
              <tr key={ft.transactionId} className="border-t border-slate-700 hover:bg-slate-750">
                <td className="px-4 py-3 text-slate-400">#{ft.transactionId}</td>
                <td className={`px-4 py-3 font-medium ${typeColor(ft.type)}`}>{ft.type}</td>
                <td className="px-4 py-3 text-right font-mono">${ft.amount?.toLocaleString()}</td>
                <td className="px-4 py-3 text-slate-400 max-w-xs truncate">{ft.description}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge(ft.status)}`}>{ft.status}</span>
                </td>
                <td className="px-4 py-3 text-slate-400">{new Date(ft.transactionDate).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
