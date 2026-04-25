import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Emergencies from './pages/Emergencies';
import Resources from './pages/Resources';
import Teams from './pages/Teams';
import Hospitals from './pages/Hospitals';
import Finance from './pages/Finance';
import Approvals from './pages/Approvals';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Protected routes — all logged-in users */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['Administrator', 'Emergency Operator', 'Field Officer', 'Warehouse Manager', 'Finance Officer']}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/emergencies"
            element={
              <ProtectedRoute allowedRoles={['Administrator', 'Emergency Operator', 'Field Officer']}>
                <Emergencies />
              </ProtectedRoute>
            }
          />

          <Route
            path="/resources"
            element={
              <ProtectedRoute allowedRoles={['Administrator', 'Warehouse Manager', 'Field Officer']}>
                <Resources />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teams"
            element={
              <ProtectedRoute allowedRoles={['Administrator', 'Emergency Operator', 'Field Officer']}>
                <Teams />
              </ProtectedRoute>
            }
          />

          <Route
            path="/hospitals"
            element={
              <ProtectedRoute allowedRoles={['Administrator', 'Emergency Operator']}>
                <Hospitals />
              </ProtectedRoute>
            }
          />

          {/* Finance — restricted to Finance Officer and Administrator only */}
          <Route
            path="/finance"
            element={
              <ProtectedRoute allowedRoles={['Administrator', 'Finance Officer']}>
                <Finance />
              </ProtectedRoute>
            }
          />

          <Route
            path="/approvals"
            element={
              <ProtectedRoute allowedRoles={['Administrator', 'Emergency Operator', 'Field Officer', 'Warehouse Manager', 'Finance Officer']}>
                <Approvals />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;