import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Resources = () => {
  const { user, logout } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ report_id: '', warehouse_id: '', resource_id: '', quantity: '' });
  const [formMessage, setFormMessage] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, lowRes] = await Promise.all([
        api.get('/resources/inventory'),
        api.get('/resources/inventory/low-stock')
      ]);
      setInventory(invRes.data);
      setLowStock(lowRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormMessage('');
    if (!form.report_id || !form.warehouse_id || !form.resource_id || !form.quantity) {
      setFormMessage('All fields are required.');
      return;
    }
    try {
      await api.post('/approvals/request-allocation', {
        report_id: parseInt(form.report_id),
        warehouse_id: parseInt(form.warehouse_id),
        resource_id: parseInt(form.resource_id),
        quantity: parseInt(form.quantity),
      });
      setFormMessage('Allocation request submitted for approval!');
      setForm({ report_id: '', warehouse_id: '', resource_id: '', quantity: '' });
      setShowForm(false);
    } catch (err) {
      setFormMessage(err.response?.data?.error || 'Request failed.');
    }
  };

  const getStockStatus = (qty, threshold) => {
    if (qty <= 0) return { label: 'Out of Stock', cls: 'bg-red-100 text-red-800' };
    if (qty <= threshold) return { label: 'Low Stock', cls: 'bg-yellow-100 text-yellow-800' };
    return { label: 'In Stock', cls: 'bg-green-100 text-green-800' };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-green-700 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Resource Management</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm">{user?.full_name} ({user?.role})</span>
          <button onClick={logout} className="bg-green-800 px-3 py-1 rounded text-sm">Logout</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6">
        <div className="flex gap-4 mb-6 text-sm flex-wrap">
          <a href="/dashboard" className="text-blue-600 underline">Dashboard</a>
          <a href="/emergencies" className="text-blue-600 underline">Emergencies</a>
          <a href="/teams" className="text-blue-600 underline">Teams</a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Items</p>
            <p className="text-2xl font-bold text-gray-800">{inventory.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Low Stock Alerts</p>
            <p className="text-2xl font-bold text-yellow-600">{lowStock.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Out of Stock</p>
            <p className="text-2xl font-bold text-red-600">{inventory.filter(i => i.quantity_available <= 0).length}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Request Resource Allocation</h2>
            <button onClick={() => setShowForm(!showForm)} className="text-sm text-blue-600 underline">
              {showForm ? 'Hide' : 'Show Form'}
            </button>
          </div>
          {showForm && (
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Report ID *</label>
                <input type="number" value={form.report_id}
                  onChange={(e) => setForm({ ...form, report_id: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="e.g. 1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse ID *</label>
                <input type="number" value={form.warehouse_id}
                  onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="e.g. 1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resource ID *</label>
                <input type="number" value={form.resource_id}
                  onChange={(e) => setForm({ ...form, resource_id: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="e.g. 2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                <input type="number" value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="e.g. 50" />
              </div>
              <div className="md:col-span-2">
                {formMessage && <p className={`text-sm mb-2 ${formMessage.includes('submitted') ? 'text-green-600' : 'text-red-600'}`}>{formMessage}</p>}
                <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">Submit Request</button>
              </div>
            </form>
          )}
        </div>

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <h2 className="text-lg font-semibold p-4 border-b border-gray-200">Inventory</h2>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Resource</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Warehouse</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Available</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Threshold</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center py-8 text-gray-500">Loading...</td></tr>
              ) : inventory.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-8 text-gray-500">No inventory data.</td></tr>
              ) : (
                inventory.map((item, idx) => {
                  const status = getStockStatus(item.quantity_available, item.threshold_level);
                  return (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{item.resource_name}</td>
                      <td className="px-4 py-3">{item.resource_type}</td>
                      <td className="px-4 py-3">{item.warehouse_name}</td>
                      <td className="px-4 py-3">{item.quantity_available}</td>
                      <td className="px-4 py-3">{item.threshold_level}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.cls}`}>{status.label}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Resources;