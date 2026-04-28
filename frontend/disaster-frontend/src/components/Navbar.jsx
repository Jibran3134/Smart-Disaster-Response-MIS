import React from 'react';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ active }) => {
  const { user, logout } = useAuth();

  const links = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/emergencies', label: 'Emergencies' },
    { href: '/resources', label: 'Resources' },
    { href: '/teams', label: 'Teams' },
    { href: '/hospitals', label: 'Hospitals' },
    ...(['Administrator', 'Finance Officer'].includes(user?.role)
      ? [{ href: '/finance', label: 'Finance' }] : []),
    { href: '/approvals', label: 'Approvals' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div className="dot" />
        DR-MIS
      </div>
      <div className="navbar-links">
        {links.map(l => (
          <a key={l.href} href={l.href} className={active === l.label.toLowerCase() ? 'active' : ''}>
            {l.label}
          </a>
        ))}
      </div>
      <div className="navbar-right">
        <span className="user-badge">
          {user?.full_name} · <span>{user?.role}</span>
        </span>
        <button className="btn-logout" onClick={logout}>Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;