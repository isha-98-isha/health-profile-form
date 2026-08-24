import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VyonicLogo from '../../components/VyonicLogo';
import { logout } from '../../services/auth'; // Adjust the import path based on your folder structure
import './dashboard.css';
import Swal from 'sweetalert2';

export default function Dashboard() {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
  Swal.fire({
    title: "Are you sure?",
    text: "Do you really want to log out?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#351d1d", // your brown accent
    cancelButtonColor: "#6c757d",  // softer grey for cancel
    confirmButtonText: "Logout",
    cancelButtonText: "Cancel"
  }).then(async (result) => {
    if (result.isConfirmed) {
      setIsLoggingOut(true);
      await logout(); // your axios logout utility
      setIsLoggingOut(false);

      Swal.fire({
        icon: "info",
        title: "Logged out",
        text: "You have been logged out successfully.",
        showConfirmButton: false,
        timer: 1500
      });

      navigate("/login");
    }
  });
};

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <VyonicLogo width={64} height={58} />
          <span className="dashboard-brand-title">VYONIC TRAINER</span>
        </div>

        {/* Integrated UI logout action */}
        <button
          className="logout-btn"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </button>
      </div>

      <div className="dashboard-welcome">
        <h1>Trainer Dashboard</h1>
        <p>Manage trainee registrations, assessments, and performance tracking.</p>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-card">
          <h2>Recent Assessments</h2>
          <p>View the latest assessments completed by trainees.</p>
        </div>

        <div className="dashboard-card">
          <h2>Performance Overview</h2>
          <p>Track progress and performance metrics across sessions.</p>
        </div>

        <div className="dashboard-card">
          <h2>Upcoming Sessions</h2>
          <p>See scheduled training sessions and manage your calendar.</p>
        </div>
      </div>

      <button
        className="new-assessment-btn"
        onClick={() => navigate('/onboarding')}
      >
        New Assessment
      </button>
    </div>
  );
}
