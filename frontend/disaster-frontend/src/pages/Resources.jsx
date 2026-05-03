import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';

const Resources = () => {
  const [inventory, setInventory] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [resources, setResources] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ report_id: '', warehouse_id: '', resource_id: '', quantity: '' });
  const [msg, setMsg] = useState({ text: '', type: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, lowRes, whRes, rRes, repRes] = await Promise.all([
        api.get('/resources/inventory'),
        api.get('/resources/inventory/low-stock'),
        api.get('/resources/warehouses'),
        api.get('/resources/'),
        api.get('/emergencies/reports'),
      ]);
      setInventory(invRes.data);
      setLowStock(lowRes.data);
      setWarehouses(whRes.data);
      setResources(rRes.data);
      setReports(repRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ text: '', type: '' });
    try {
      await api.post('/approvals/request-allocation', {
        report_id: parseInt(form.report_id),
        warehouse_id: parseInt(form.warehouse_id),
        resource_id: parseInt(form.resource_id),
        quantity: parseInt(form.quantity),
      });
      setMsg({ text: 'Allocation request submitted for approval.', type: 'success' });
      setForm({ report_id: '', warehouse_id: '', resource_id: '', quantity: '' });
      setShowForm(false);
    } catch (err) {
      setMsg({ text: err.response?.data?.error || 'Request failed.', type: 'error' });
    }
  };

  const stockBadge = (qty, threshold) => {
    if (qty <= 0) return <span className="badge badge-outstock">Out of stock</span>;
    if (qty <= threshold) return <span className="badge badge-lowstock">Low stock</span>;
    return <span className="badge badge-instock">In stock</span>;
  };

  return (
    <>
      <Navbar active="resources" />
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Resource Management</h1>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Request Allocation'}
          </button>
        </div>

        <div className="stat-grid">
          <div className="stat-card"><div className="label">Total Items</div><div className="value">{inventory.length}</div></div>
          <div className="stat-card"><div className="label">Low Stock Alerts</div><div className="value yellow">{lowStock.length}</div></div>
          <div className="stat-card"><div className="label">Out of Stock</div><div className="value red">{inventory.filter(i => i.quantity_available <= 0).length}</div></div>
        </div>

        {showForm && (
          <div className="card" style={{ borderLeft: '3px solid #e8460a', marginBottom: 20 }}>
            <div className="card-header"><span className="card-title">Request allocation</span></div>
            <div className="card-body">
              {msg.text && <div className={`alert alert-${msg.type}`} style={{ marginBottom: 16 }}>{msg.text}</div>}
              <form onSubmit={handleSubmit}>
                <div className="form-grid" style={{ marginBottom: 16 }}>
                  <div className="form-group">
                    <label>Emergency Report *</label>
                    <select value={form.report_id} onChange={e => setForm({ ...form, report_id: e.target.value })} required>
                      <option value="">Select report</option>
                      {reports.map(r => (
                        <option key={r.report_id} value={r.report_id}>
                          #{r.report_id} — {r.area_name} ({r.severity})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Warehouse *</label>
                    <select value={form.warehouse_id} onChange={e => setForm({ ...form, warehouse_id: e.target.value })} required>
                      <option value="">Select warehouse</option>
                      {warehouses.map(w => (
                        <option key={w.warehouse_id} value={w.warehouse_id}>
                          #{w.warehouse_id} — {w.warehouse_name} ({w.city})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Resource *</label>
                    <select value={form.resource_id} onChange={e => setForm({ ...form, resource_id: e.target.value })} required>
                      <option value="">Select resource</option>
                      {resources.map(r => (
                        <option key={r.resource_id} value={r.resource_id}>
                          #{r.resource_id} — {r.resource_name} ({r.resource_type})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Quantity *</label>
                    <input type="number" min="1" value={form.quantity}
                      onChange={e => setForm({ ...form, quantity: e.target.value })}
                      placeholder="e.g. 50" required />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary">Submit Request</button>
              </form>
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <span className="card-title">Inventory</span>
            <span className="mono">{inventory.length} items</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Resource</th><th>Type</th><th>Warehouse</th><th>Available</th><th>Threshold</th><th>Status</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6"><div className="empty">loading...</div></td></tr>
                ) : inventory.length === 0 ? (
                  <tr><td colSpan="6"><div className="empty">no inventory data</div></td></tr>
                ) : inventory.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 500 }}>{item.resource_name}</td>
                    <td className="mono">{item.resource_type}</td>
                    <td>{item.warehouse_name}</td>
                    <td className="mono" style={{ color: item.quantity_available <= item.threshold_level ? '#eab308' : '#22c55e' }}>
                      {item.quantity_available}
                    </td>
                    <td className="mono">{item.threshold_level}</td>
                    <td>{stockBadge(item.quantity_available, item.threshold_level)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default Resources;