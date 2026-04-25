import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Hospitals = () => {
  const { user, logout } = useAuth();
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    setLoading(true);
    try {
      const response = await api.get('/hospitals');
      setHospitals(response.data);
    } catch (err) {
      setError('Failed to load hospital data.');
    } finally {
      setLoading(false);
    }
  };

  const getCapacityColor = (available, total) => {
    if (total === 0) return 'bg-gray-100 text-gray-800';
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
          <button onClick={logout} className="bg-teal-800 px-3 py-1 rounded text-sm hover:bg-teal-900">Logout</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6">
        <div className="flex gap-4 mb-6 flex-wrap">
          <a href="/dashboard" className="text-blue-600 underline text-sm">Dashboard</a>
          <a href="/emergencies" className="text-blue-600 underline text-sm">Emergencies</a>
        </div>

        {/* Hospital Cards */}
        {loading ? (
          <p className="text-center py-8 text-gray-500">Loading...</p>
        ) : error ? (
          <p className="text-center py-8 text-red-500">{error}</p>
        ) : hospitals.length === 0 ? (
          <p className="text-center py-8 text-gray-500">No hospitals found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hospitals.map((hospital) => {
              const capColor = getCapacityColor(hospital.available_beds, hospital.total_beds);
              const occupancy = hospital.total_beds > 0
                ? Math.round(((hospital.total_beds - hospital.available_beds) / hospital.total_beds) * 100)
                : 0;

              return (
                <div key={hospital.hospital_id} className="bg-white rounded-lg shadow p-5">
                  <h3 className="font-bold text-gray-800 text-base mb-1">{hospital.hospital_name}</h3>
                  <p className="text-sm text-gray-500 mb-3">{hospital.city}, {hospital.address}</p>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Available Beds</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${capColor}`}>
                      {hospital.available_beds} / {hospital.total_beds}
                    </span>
                  </div>
                  {/* Capacity bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-teal-500 h-2 rounded-full"
                      style={{ width: `${occupancy}%` }}
                    />
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