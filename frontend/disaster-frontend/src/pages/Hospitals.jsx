import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Hospitals = () => {
  const { user, logout } = useAuth();
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState('');
  const [form, setForm] = useState({ patient_name: '', dob: '', condition: '', report_id: '' });
  const [formMessage, setFormMessage] = useState('');

  useEffect(() => { fetchHospitals(); }, []);

  const fetchHospitals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/hospitals');
      setHospitals(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdmit = async (e) => {
    e.preventDefault();
    setFormMessage('');
    if (!selectedHospital || !form.patient_name) {
      setFormMessage('Hospital and patient name are required.');
      return;
    }
    try {
      await api.post(`/hospitals/${selectedHospital}/patients`, form);
      setFormMessage('Patient admitted successfully!');
      setForm({ patient_name: '', dob: '', condition: '', report_id: '' });
      setShowForm(false);
      fetchHospitals();
    } catch (err) {
      setFormMessage(err.response?.data?.error || 'Admission failed.');
    }
  };

  const getCapacityColor = (available, total) => {
    if (!total) return 'bg-gray-100 text-gray-800';
    const pct = (available / total) * 100;
    if (pct <= 10) return 'bg-red-100 text-red-800';
    if (pct <= 30) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-teal-700 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Hospital Coordination</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm">{user?.full_name} ({user?.role})</span>
          <button onClick={logout} className="bg-teal-800 px-3 py-1 rounded text-sm">Logout</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6">
        <div className="flex gap-4 mb-6 text-sm">
          <a href="/dashboard" className="text-blue-600 underline">Dashboard</a>
          <a href="/emergencies" className="text-blue-600 underline">Emergencies</a>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Admit Patient</h2>
            <button onClick={() => setShowForm(!showForm)} className="text-sm text-blue-600 underline">
              {showForm ? 'Hide' : 'Show Form'}
            </button>
          </div>
          {showForm && (
            <form onSubmit={handleAdmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hospital *</label>
                <select value={selectedHospital} onChange={(e) => setSelectedHospital(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm" required>
                  <option value="">Select Hospital</option>
                  {hospitals.map(h => (
                    <option key={h.hospital_id} value={h.hospital_id}>{h.hospital_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name *</label>
                <input type="text" value={form.patient_name}
                  onChange={(e) => setForm({ ...form, patient_name: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input type="date" value={form.dob}
                  onChange={(e) => setForm({ ...form, dob: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                <input type="text" value={form.condition}
                  onChange={(e) => setForm({ ...form, condition: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="e.g. Critical" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Report ID</label>
                <input type="number" value={form.report_id}
                  onChange={(e) => setForm({ ...form, report_id: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
              </div>
              <div className="md:col-span-2">
                {formMessage && <p className={`text-sm mb-2 ${formMessage.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{formMessage}</p>}
                <button type="submit" className="bg-teal-600 text-white px-6 py-2 rounded hover:bg-teal-700">Admit Patient</button>
              </div>
            </form>
          )}
        </div>

        {loading ? (
          <p className="text-center py-8 text-gray-500">Loading...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hospitals.map((h) => {
              const occupancy = h.total_beds > 0
                ? Math.round(((h.total_beds - h.available_beds) / h.total_beds) * 100)
                : 0;
              return (
                <div key={h.hospital_id} className="bg-white rounded-lg shadow p-5">
                  <h3 className="font-bold text-gray-800 mb-1">{h.hospital_name}</h3>
                  <p className="text-sm text-gray-500 mb-3">{h.city}</p>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Available Beds</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCapacityColor(h.available_beds, h.total_beds)}`}>
                      {h.available_beds} / {h.total_beds}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-teal-500 h-2 rounded-full" style={{ width: `${occupancy}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{occupancy}% occupied</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Hospitals;