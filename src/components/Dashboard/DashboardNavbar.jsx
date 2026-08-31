import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiCreditCard, FiGrid, FiMoon, FiSettings, FiSun, FiUserCheck, FiUsers, FiCalendar } from 'react-icons/fi';
import Swal from 'sweetalert2';
import VyonicLogo from '../VyonicLogo';
import { logout } from '../../services/auth';

export default function DashboardNavbar({ activePage = 'Dashboard' }) {
  const navigate = useNavigate();
  const [themeMode, setThemeMode] = useState('dark');
  const [navOpen, setNavOpen] = useState(false);
  const navItems = [
    ['Dashboard', FiGrid, '/dashboard'], ['Client', FiUsers, '/client'], ['Partner', FiUserCheck],
    ['Bookings', FiCalendar], ['Billing', FiCreditCard], ['Setting', FiSettings]
  ];

  const handleLogout = async () => {
    const result = await Swal.fire({ title: 'Are you sure?', text: 'Do you really want to log out?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#3b6fd9', cancelButtonColor: '#222222', confirmButtonText: 'Logout', cancelButtonText: 'Cancel', background: '#141414', color: '#ffffff' });
    if (result.isConfirmed) {
      await logout();
      navigate('/login');
    }
  };

  return (
    <header className="vy-navbar">
      <div className="vy-nav-left">
        <div className="vy-logo-wrapper" onClick={() => navigate('/dashboard')}>
          <VyonicLogo width={50} height={50} />
          <span className="vy-brand-title">VYONIC</span>
        </div>
        <nav className={`vy-nav-links${navOpen ? ' open' : ''}`}>
          {navItems.map(([label, Icon, path]) => (
            <button key={label} className={`vy-nav-item ${activePage === label ? 'active' : ''}`} onClick={() => path && navigate(path)}>
              <Icon className="nav-icon" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>
      <button className="vy-nav-toggle" aria-label="Toggle navigation" onClick={() => setNavOpen((open) => !open)}>☰</button>
      <div className="vy-nav-right">
        <div className="vy-theme-toggle">
          <button className={`theme-toggle-option ${themeMode === 'light' ? 'active' : ''}`} onClick={() => setThemeMode('light')}><FiSun className="theme-icon" /><span>Light</span></button>
          <button className={`theme-toggle-option ${themeMode === 'dark' ? 'active' : ''}`} onClick={() => setThemeMode('dark')}><FiMoon className="theme-icon" /><span>Dark</span></button>
        </div>
        <div className="vy-notification-btn" title="Notifications"><FiBell className="bell-icon" /><span className="notif-badge">70</span></div>
        <div className="vy-user-avatar" onClick={handleLogout} title="Click to Logout"><VyonicLogo width={22} height={22} /></div>
      </div>
    </header>
  );
}
