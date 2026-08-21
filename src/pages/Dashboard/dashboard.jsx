import React from 'react';
import { useNavigate } from 'react-router-dom';
import VyonicLogo from '../../components/VyonicLogo';
import './dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <VyonicLogo width={64} height={58} />
        <span className="dashboard-brand-title">VYONIC TRAINER</span>
      </div>

      <div className="dashboard-welcome">
        <h1>Trainer Dashboard</h1>
        <p>Manage trainee registrations, assessments, and performance tracking.</p>
      </div>

      {/* Dashboard content grid */}
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

      {/* Primary action button */}
      <button
        className="new-assessment-btn"
        onClick={() => navigate('/onboarding')}
      >
        New Assessment
      </button>
    </div>
  );
}
