import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Emergencies from './pages/Emergencies';
import Resources from './pages/Resources';
import Teams from './pages/Teams';
import Hospitals from './pages/Hospitals';
import Finance from './pages/Finance';
import Approvals from './pages/Approvals';
import './index.css';

const navItems = [
  { path: '/dashboard',    label: 'Dashboard' },
  { path: '/emergencies',  label: 'Emergencies' },
  { path: '/resources',    label: 'Resources' },
  { path: '/teams',        label: 'Teams' },
  { path: '/hospitals',    label: 'Hospitals' },
  { path: '/finance',      label: 'Finance' },
  { path: '/approvals',    label: 'Approvals' },
];

function AppLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="p-6 text-xl font-bold text-blue-400 border-b border-slate-700">
          🚨 Disaster MIS
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path}
              className={({ isActive }) =>
                `block px-4 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'
                }`
              }>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700">
          <p className="text-xs text-slate-400 mb-1">{user?.fullName}</p>
          <p className="text-xs text-slate-500 mb-3">{user?.role}</p>
          <button onClick={logout}
            className="w-full px-3 py-1.5 text-xs bg-red-600/20 text-red-400 rounded hover:bg-red-600/40 transition">
            Logout
          </button>
        </div>
      </aside>
      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-8">
        <Routes>
          <Route path="/dashboard"   element={<Dashboard />} />
          <Route path="/emergencies" element={<Emergencies />} />
          <Route path="/resources"   element={<Resources />} />
          <Route path="/teams"       element={<Teams />} />
          <Route path="/hospitals"   element={<Hospitals />} />
          <Route path="/finance"     element={<Finance />} />
          <Route path="/approvals"   element={<Approvals />} />
          <Route path="*"            element={<Navigate to="/dashboard" />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <ProtectedRoute><AppLayout /></ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
