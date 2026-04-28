import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';

const Hospitals = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState('');
  const [form, setForm] = useState({ patient_name: '', dob: '', condition: '', report_id: '' });
  const [msg, setMsg] = useState({ text: '', type: '' });

  useEffect(() => { fetchHospitals(); }, []);

  const fetchHospitals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/hospitals');
      setHospitals(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleAdmit = async (e) => {
    e.preventDefault();
    setMsg({ text: '', type: '' });
    if (!selectedHospital || !form.patient_name) {
      setMsg({ text: 'Hospital and patient name are required.', type: 'error' }); return;
    }
    try {
      await api.post(`/hospitals/${selectedHospital}/patients`, form);
      setMsg({ text: 'Patient admitted successfully.', type: 'success' });
      setForm({ patient_name: '', dob: '', condition: '', report_id: '' });
      setShowForm(false);
      fetchHospitals();
    } catch (err) {
      setMsg({ text: err.response?.data?.error || 'Admission failed.', type: 'error' });
    }
  };

  const totalBeds = hospitals.reduce((s, h) => s + (h.total_beds || 0), 0);
  const availBeds = hospitals.reduce((s, h) => s + (h.available_beds || 0), 0);

  return (
    <>
      <Navbar active="hospitals" />
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Hospital Coordination</h1>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Admit Patient'}
          </button>
        </div>

        <div className="stat-grid">
          <div className="stat-card"><div className="label">Hospitals</div><div className="value">{hospitals.length}</div></div>
          <div className="stat-card"><div className="label">Total Beds</div><div className="value blue">{totalBeds}</div></div>
          <div className="stat-card"><div className="label">Available Beds</div><div className="value green">{availBeds}</div></div>
          <div className="stat-card"><div className="label">Occupied</div><div className="value accent">{totalBeds - availBeds}</div></div>
        </div>

        {showForm && (
          <div className="card" style={{ borderLeft: '3px solid #e8460a', marginBottom: 20 }}>
            <div className="card-header"><span className="card-title">Admit patient</span></div>
            <div className="card-body">
              {msg.text && <div className={`alert alert-${msg.type}`} style={{ marginBottom: 16 }}>{msg.text}</div>}
              <form onSubmit={handleAdmit}>
                <div className="form-grid" style={{ marginBottom: 16 }}>
                  <div className="form-group">
                    <label>Hospital *</label>
                    <select value={selectedHospital} onChange={e => setSelectedHospital(e.target.value)} required>
                      <option value="">Select hospital</option>
                      {hospitals.map(h => <option key={h.hospital_id} value={h.hospital_id}>{h.hospital_name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Patient name *</label>
                    <input type="text" value={form.patient_name} onChange={e => setForm({ ...form, patient_name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Date of birth</label>
                    <input type="date" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Condition</label>
                    <input type="text" value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })} placeholder="e.g. Critical" />
                  </div>
                  <div className="form-group">
                    <label>Report ID</label>
                    <input type="number" value={form.report_id} onChange={e => setForm({ ...form, report_id: e.target.value })} />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary">Admit Patient</button>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div className="empty">loading...</div>
        ) : (
          <div className="hospital-grid">
            {hospitals.map(h => {
              const occupancy = h.total_beds > 0 ? Math.round(((h.total_beds - h.available_beds) / h.total_beds) * 100) : 0;
              const fillClass = occupancy >= 90 ? 'critical' : occupancy >= 70 ? 'warning' : '';
              return (
                <div key={h.hospital_id} className="hospital-card">
                  <h3>{h.hospital_name}</h3>
                  <p className="city">{h.city}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#7a7870', fontFamily: "'JetBrains Mono', monospace" }}>Beds available</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: h.available_beds <= 5 ? '#ef4444' : '#22c55e' }}>
                      {h.available_beds} / {h.total_beds}
                    </span>
                  </div>
                  <div className="capacity-bar">
                    <div className={`capacity-fill ${fillClass}`} style={{ width: `${occupancy}%` }} />
                  </div>
                  <p style={{ fontSize: 11, color: '#4a4845', fontFamily: "'JetBrains Mono', monospace" }}>{occupancy}% occupied</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default Hospitals;