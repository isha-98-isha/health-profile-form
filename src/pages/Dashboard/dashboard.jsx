// src/pages/Dashboard/Dashboard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "./dashboard.css"; // make sure you created the CSS file

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="dashboard">
      <h1>Trainer Dashboard</h1>

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
        onClick={() => navigate("/onboarding")}
      >
        New Assessment
      </button>
    </div>
  );
}
