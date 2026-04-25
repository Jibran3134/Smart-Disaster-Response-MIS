import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Resources = () => {
  const { user, logout } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAllocForm, setShowAllocForm] = useState(false);
  const [allocForm, setAllocForm] = useState({ resource_id: '', event_id: '', requested_qty: '' });
  const [allocMessage, setAllocMessage] = useState('');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await api.get('/resources');
      setInventory(response.data);
    } catch (err) {
      setError('Failed to load resources.');
    } finally {
      setLoading(false);
    }
  };

  const handleAllocFormChange = (e) => {
    setAllocForm({ ...allocForm, [e.target.name]: e.target.value });
  };

  const handleAllocationSubmit = async (e) => {
    e.preventDefault();
    setAllocMessage('');
    if (!allocForm.resource_id || !allocForm.event_id || !allocForm.requested_qty) {
      setAllocMessage('All fields are required.');
      return;
    }
    try {
      await api.post('/resources/allocate', allocForm);
      setAllocMessage('Allocation request submitted!');
      setAllocForm({ resource_id: '', event_id: '', requested_qty: '' });
      fetchInventory();
    } catch (err) {
      setAllocMessage(err.response?.data?.message || 'Allocation failed.');
    }
  };

  const getStockStatus = (qty, threshold) => {
    if (qty <= 0) return { label: 'Out of Stock', class: 'bg-red-100 text-red-800' };
    if (qty <= threshold) return { label: 'Low Stock', class: 'bg-yellow-100 text-yellow-800' };
    return { label: 'In Stock', class: 'bg-green-100 text-green-800' };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-green-700 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Resource Management</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm">{user?.full_name} ({user?.role})</span>
          <button onClick={logout} className="bg-green-800 px-3 py-1 rounded text-sm hover:bg-green-900">Logout</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6">
        <div className="flex gap-4 mb-6 flex-wrap">
          <a href="/dashboard" className="text-blue-600 underline text-sm">Dashboard</a>
          <a href="/emergencies" className="text-blue-600 underline text-sm">Emergencies</a>
          <a href="/teams" className="text-blue-600 underline text-sm">Teams</a>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Items</p>
            <p className="text-2xl font-bold text-gray-800">{inventory.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Low Stock Alerts</p>
            <p className="text-2xl font-bold text-yellow-600">
              {inventory.filter(i => i.quantity_available <= i.threshold_level && i.quantity_available > 0).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Out of Stock</p>
            <p className="text-2xl font-bold text-red-600">
              {inventory.filter(i => i.quantity_available <= 0).length}
            </p>
          </div>
        </div>

        {/* Allocation Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Resource Allocation Request</h2>
            <button
              onClick={() => setShowAllocForm(!showAllocForm)}
              className="text-sm text-blue-600 underline"
            >
              {showAllocForm ? 'Hide' : 'Show Form'}
            </button>
          </div>

          {showAllocForm && (
            <form onSubmit={handleAllocationSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resource ID</label>
                <input
                  type="number"
                  name="resource_id"
                  value={allocForm.resource_id}
                  onChange={handleAllocFormChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  placeholder="e.g. 1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event ID</label>
                <input
                  type="number"
                  name="event_id"
                  value={allocForm.event_id}
                  onChange={handleAllocFormChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  placeholder="e.g. 3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Requested Qty</label>
                <input
                  type="number"
                  name="requested_qty"
                  value={allocForm.requested_qty}
                  onChange={handleAllocFormChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  placeholder="e.g. 50"
                />
              </div>
              <div className="md:col-span-3">
                {allocMessage && (
                  <p className={`text-sm mb-2 ${allocMessage.includes('failed') || allocMessage.includes('required') ? 'text-red-600' : 'text-green-600'}`}>
                    {allocMessage}
                  </p>
                )}
                <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
                  Submit Request
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <h2 className="text-lg font-semibold p-4 border-b border-gray-200">Inventory</h2>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Resource</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Available Qty</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Threshold</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center py-8 text-gray-500">Loading...</td></tr>
              ) : error ? (
                <tr><td colSpan="5" className="text-center py-8 text-red-500">{error}</td></tr>
              ) : inventory.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-8 text-gray-500">No inventory data.</td></tr>
              ) : (
                inventory.map((item) => {
                  const status = getStockStatus(item.quantity_available, item.threshold_level);
                  return (
                    <tr key={`${item.warehouse_id}-${item.resource_id}`} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{item.resource_name}</td>
                      <td className="px-4 py-3">{item.resource_type}</td>
                      <td className="px-4 py-3">{item.quantity_available}</td>
                      <td className="px-4 py-3">{item.threshold_level}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.class}`}>
                          {status.label}
                        </span>
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