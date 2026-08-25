import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import VyonicLogo from '../../components/VyonicLogo';
import { logout, getDashboardData } from '../../services/auth';
import './dashboard.css';
import Swal from 'sweetalert2';
import {
  FiGrid,
  FiUsers,
  FiUserCheck,
  FiCalendar,
  FiCreditCard,
  FiSettings,
  FiSun,
  FiMoon,
  FiBell,
  FiSearch,
  FiPlus,
  FiArrowUpRight,
  FiMail,
  FiPhone,
  FiClock
} from 'react-icons/fi';

// Helper to get locally registered assessments
const getLocalRegisteredAssessments = () => {
  try {
    const data = JSON.parse(localStorage.getItem('vyonic_local_assessments') || '[]');
    return data.map(item => ({
      ...item,
      location: item.location && item.location.includes('Dubai') ? 'INDIA' : (item.location || 'INDIA')
    }));
  } catch (_) {
    return [];
  }
};

export default function Dashboard() {
  const navigate = useNavigate();

  // Navigation tabs
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [themeMode, setThemeMode] = useState("dark");

  // Filters & State
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [assessments, setAssessments] = useState([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState(null);
  const [loading, setLoading] = useState(false);

  const filters = [
    { id: "all", label: "All" },
    { id: "new", label: "New" },
    { id: "scheduled", label: "Scheduled" },
    { id: "completed", label: "Completed" },
    { id: "cancelled", label: "Cancelled" }
  ];

  const fetchDashboardData = useCallback(async (status) => {
    setLoading(true);
    try {
      const localRecords = getLocalRegisteredAssessments();
      const apiStatus = status === 'scheduled' ? 'confirmed' : status;
      let apiRecords = [];

      try {
        const data = await getDashboardData(apiStatus);
        apiRecords = data.records || data.data || [];
      } catch (err) {
        console.warn("Could not fetch remote bookings, relying on local records:", err.message);
      }

      // Map API records
      const formattedApiRecords = (apiRecords || []).map((item, idx) => {
        const fullName = item.name || (item.first_name ? `${item.first_name} ${item.last_name || ''}`.trim() : item.full_name) || `Client ${idx + 1}`;
        const initials = fullName.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'VA';

        let normStatus = (item.booking_status || item.status || 'scheduled').toLowerCase();
        if (normStatus === 'confirmed') normStatus = 'scheduled';

        return {
          id: item.id || item._id || `api-${idx}`,
          assessment_id: item.assessment_id || item.booking_id || `#VA-${(item.id || String(Math.random())).slice(-8)}`,
          name: fullName,
          initials: initials,
          date: item.date || (item.created_at ? new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '24 Aug 2026'),
          time_slot: item.time_slot || item.slot || '2:45 PM - 3:45 PM',
          booking_status: normStatus,
          location: item.location || item.address || 'INDIA',
          type: item.type || 'Onboarding',
          appointment_type: item.appointment_type || 'Appointment',
          duration: item.duration || '60 minutes',
          assessment_goal: item.goal || item.assessment_goal || 'Restore Balance',
          height: item.height ? (typeof item.height === 'number' ? `${item.height} cm` : item.height) : '165 cm',
          weight: item.weight ? (typeof item.weight === 'number' ? `${item.weight} kg` : item.weight) : '55 kg',
          previous_training_experience: item.experience || item.previous_training_experience || 'None',
          weekly_training_frequency: item.frequency || item.weekly_training_frequency || 'Once a week',
          injury_medical_notes: item.injuries || item.injury_medical_notes || '-',
          email: item.email || '',
          phone: item.phone ? `${item.country_code || ''} ${item.phone}`.trim() : ''
        };
      });

      // Merge newly registered client assessments with API assessments (no duplicates)
      const combined = [...localRecords, ...formattedApiRecords.filter(apiItem => !localRecords.some(localItem => localItem.email && localItem.email === apiItem.email))];

      setAssessments(combined);
      if (combined.length > 0 && !selectedAssessmentId) {
        setSelectedAssessmentId(combined[0].id);
      }
    } catch (error) {
      console.error("Dashboard Service Error:", error.message);
      const localRecords = getLocalRegisteredAssessments();
      setAssessments(localRecords);
      if (localRecords.length > 0 && !selectedAssessmentId) {
        setSelectedAssessmentId(localRecords[0].id);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedAssessmentId]);

  useEffect(() => {
    fetchDashboardData(activeFilter);
  }, [activeFilter, fetchDashboardData]);

  // Filtered assessment list
  const filteredAssessments = useMemo(() => {
    return assessments.filter(item => {
      const matchFilter = activeFilter === 'all' || item.booking_status.toLowerCase() === activeFilter.toLowerCase();
      const matchSearch = !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.assessment_id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [assessments, activeFilter, searchQuery]);

  // Ensure active selection stays valid
  useEffect(() => {
    if (filteredAssessments.length > 0) {
      const exists = filteredAssessments.some(a => a.id === selectedAssessmentId);
      if (!exists) {
        setSelectedAssessmentId(filteredAssessments[0].id);
      }
    }
  }, [filteredAssessments, selectedAssessmentId]);

  const selectedAssessment = useMemo(() => {
    return assessments.find(a => a.id === selectedAssessmentId) || filteredAssessments[0] || assessments[0] || null;
  }, [assessments, selectedAssessmentId, filteredAssessments]);

  const handleLogout = async () => {
    Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to log out?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3b6fd9",
      cancelButtonColor: "#222222",
      confirmButtonText: "Logout",
      cancelButtonText: "Cancel",
      background: "#141414",
      color: "#ffffff"
    }).then(async (result) => {
      if (result.isConfirmed) {
        await logout();

        Swal.fire({
          icon: "info",
          title: "Logged out",
          text: "You have been logged out successfully.",
          showConfirmButton: false,
          timer: 1500,
          background: "#141414",
          color: "#ffffff"
        });

        navigate("/login");
      }
    });
  };

  return (
    <div className="vy-dashboard-app">
      {/* Top Navbar */}
      <header className="vy-navbar">
        <div className="vy-nav-left">
          <div className="vy-logo-wrapper" onClick={() => navigate('/dashboard')}>
            <VyonicLogo width={34} height={34} />
            <span className="vy-brand-title">VYONIC</span>
          </div>

          <nav className="vy-nav-links">
            <button
              className={`vy-nav-item ${activeNav === 'Dashboard' ? 'active' : ''}`}
              onClick={() => setActiveNav('Dashboard')}
            >
              <FiGrid className="nav-icon" />
              <span>Dashboard</span>
            </button>
            <button
              className={`vy-nav-item ${activeNav === 'Client' ? 'active' : ''}`}
              onClick={() => setActiveNav('Client')}
            >
              <FiUsers className="nav-icon" />
              <span>Client</span>
            </button>
            <button
              className={`vy-nav-item ${activeNav === 'Partner' ? 'active' : ''}`}
              onClick={() => setActiveNav('Partner')}
            >
              <FiUserCheck className="nav-icon" />
              <span>Partner</span>
            </button>
            <button
              className={`vy-nav-item ${activeNav === 'Bookings' ? 'active' : ''}`}
              onClick={() => setActiveNav('Bookings')}
            >
              <FiCalendar className="nav-icon" />
              <span>Bookings</span>
            </button>
            <button
              className={`vy-nav-item ${activeNav === 'Billing' ? 'active' : ''}`}
              onClick={() => setActiveNav('Billing')}
            >
              <FiCreditCard className="nav-icon" />
              <span>Billing</span>
            </button>
            <button
              className={`vy-nav-item ${activeNav === 'Setting' ? 'active' : ''}`}
              onClick={() => setActiveNav('Setting')}
            >
              <FiSettings className="nav-icon" />
              <span>Setting</span>
            </button>
          </nav>
        </div>

        <div className="vy-nav-right">
          {/* Light / Dark pill toggle */}
          <div className="vy-theme-toggle">
            <button
              className={`theme-toggle-option ${themeMode === 'light' ? 'active' : ''}`}
              onClick={() => setThemeMode('light')}
            >
              <FiSun className="theme-icon" />
              <span>Light</span>
            </button>
            <button
              className={`theme-toggle-option ${themeMode === 'dark' ? 'active' : ''}`}
              onClick={() => setThemeMode('dark')}
            >
              <FiMoon className="theme-icon" />
              <span>Dark</span>
            </button>
          </div>

          {/* Notification Bell Badge */}
          <div className="vy-notification-btn" title="Notifications">
            <FiBell className="bell-icon" />
            <span className="notif-badge">70</span>
          </div>

          {/* Profile Avatar / Logout */}
          <div
            className="vy-user-avatar"
            onClick={handleLogout}
            title="Click to Logout"
          >
            <VyonicLogo width={22} height={22} />
          </div>
        </div>
      </header>

      {/* Main Dashboard Container */}
      <main className="vy-dashboard-main">
        {/* Header Row: Title & Top Metric Cards */}
        <div className="vy-header-section">
          <div className="vy-title-col">
            <h1 className="vy-dashboard-title">Dashboard</h1>
          </div>

          <div className="vy-metrics-grid">
            <div className="vy-metric-card">
              <div className="vy-metric-val">129</div>
              <div className="vy-metric-lbl">Clients</div>
            </div>
            <div className="vy-metric-card">
              <div className="vy-metric-val">4</div>
              <div className="vy-metric-lbl">Partners</div>
            </div>
            <div className="vy-metric-card">
              <div className="vy-metric-val">22</div>
              <div className="vy-metric-lbl">Assessments</div>
            </div>
            <div className="vy-metric-card">
              <div className="vy-metric-val">9</div>
              <div className="vy-metric-lbl">Journeys</div>
            </div>
          </div>
        </div>

        {/* Section Action Bar: "All assessments" heading + Filter tabs + Search + New Assessment */}
        <div className="vy-action-bar">
          <div className="vy-action-left">
            <h2 className="vy-section-heading">All assessments</h2>
          </div>

          <div className="vy-action-right">
            {/* Filter Pills */}
            <div className="vy-filters-group">
              {filters.map((f) => (
                <button
                  key={f.id}
                  className={`vy-filter-pill ${activeFilter === f.id ? 'active' : ''}`}
                  onClick={() => setActiveFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Search Icon & collapsible input */}
            <div className={`vy-search-container ${showSearchInput ? 'open' : ''}`}>
              {showSearchInput && (
                <input
                  type="text"
                  className="vy-search-input"
                  placeholder="Search assessments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              )}
              <button
                className="vy-icon-btn vy-search-btn"
                onClick={() => setShowSearchInput(!showSearchInput)}
                title="Search"
              >
                <FiSearch />
              </button>
            </div>

            {/* + New Assessment CTA */}
            <button
              className="vy-new-assessment-btn"
              onClick={() => navigate('/onboarding')}
            >
              <FiPlus className="plus-icon" />
              <span>New Assessment</span>
            </button>
          </div>
        </div>

        {/* Two-Column Split View: List on left (1/3), Detail card on right (2/3) */}
        <div className="vy-split-view">
          {/* Left Column: Assessment Cards List */}
          <div className="vy-list-column">
            {loading ? (
              <div className="vy-empty-state">Loading assessments...</div>
            ) : filteredAssessments.length === 0 ? (
              <div className="vy-empty-state">No assessments found for this filter.</div>
            ) : (
              filteredAssessments.map((item) => {
                const isSelected = selectedAssessment && selectedAssessment.id === item.id;
                return (
                  <div
                    key={item.id}
                    className={`vy-assessment-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedAssessmentId(item.id)}
                  >
                    <div className="vy-card-avatar">
                      <span>{item.initials}</span>
                    </div>

                    <div className="vy-card-body">
                      <div className="vy-card-name">{item.name}</div>
                      <div className="vy-card-date">{item.date}</div>
                      <div className="vy-card-time-pill">
                        <FiClock className="time-icon" />
                        <span>{item.time_slot}</span>
                      </div>
                    </div>

                    <div className="vy-card-action">
                      <button className="vy-arrow-btn" tabIndex={-1} aria-label="Open assessment">
                        <FiArrowUpRight />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Detailed View */}
          {selectedAssessment && (
            <div className="vy-detail-column">
              {/* Header Box */}
              <div className="vy-detail-header-card">
                <div className="vy-detail-top-row">
                  <div className="vy-detail-profile-row">
                    <div className="vy-detail-avatar">
                      <span>{selectedAssessment.initials}</span>
                    </div>
                    <div className="vy-detail-title-group">
                      <h2 className="vy-detail-name">{selectedAssessment.name}</h2>
                      <span className="vy-detail-id-tag">{selectedAssessment.assessment_id}</span>
                    </div>
                  </div>

                  <div className="vy-detail-badge-wrap">
                    <span className={`vy-status-badge ${selectedAssessment.booking_status}`}>
                      {selectedAssessment.booking_status}
                    </span>
                  </div>
                </div>

                <div className="vy-detail-meta-grid">
                  <div className="vy-meta-item">
                    <div className="vy-meta-title">{selectedAssessment.location}</div>
                    <div className="vy-meta-sub">{selectedAssessment.type}</div>
                  </div>

                  <div className="vy-meta-item">
                    <div className="vy-meta-sub-date">{selectedAssessment.date}</div>
                    <div className="vy-meta-highlight">{selectedAssessment.time_slot}</div>
                    <div className="vy-meta-sub">{selectedAssessment.appointment_type}</div>
                  </div>

                  <div className="vy-meta-item">
                    <div className="vy-meta-highlight">{selectedAssessment.duration}</div>
                    <div className="vy-meta-sub">Duration</div>
                  </div>
                </div>
              </div>

              {/* Assessment Info Card */}
              <div className="vy-info-card">
                <h3 className="vy-card-section-title">Assessment info</h3>
                <div className="vy-info-table">
                  <div className="vy-info-row">
                    <span className="vy-info-label">Assessment goal</span>
                    <span className="vy-info-value">{selectedAssessment.assessment_goal}</span>
                  </div>
                  <div className="vy-info-row">
                    <span className="vy-info-label">Height</span>
                    <span className="vy-info-value">{selectedAssessment.height}</span>
                  </div>
                  <div className="vy-info-row">
                    <span className="vy-info-label">Weight</span>
                    <span className="vy-info-value">{selectedAssessment.weight}</span>
                  </div>
                  <div className="vy-info-row">
                    <span className="vy-info-label">Previous training experience</span>
                    <span className="vy-info-value">{selectedAssessment.previous_training_experience}</span>
                  </div>
                  <div className="vy-info-row">
                    <span className="vy-info-label">Weekly training frequency</span>
                    <span className="vy-info-value">{selectedAssessment.weekly_training_frequency}</span>
                  </div>
                  <div className="vy-info-row">
                    <span className="vy-info-label">Injury &amp; medical notes</span>
                    <span className="vy-info-value">{selectedAssessment.injury_medical_notes}</span>
                  </div>
                </div>
              </div>

              {/* Contact Info Card */}
              <div className="vy-info-card">
                <h3 className="vy-card-section-title">Contact info</h3>
                <div className="vy-contact-grid">
                  <div className="vy-contact-item">
                    <span className="vy-contact-label">Email</span>
                    <div className="vy-contact-val">
                      <FiMail className="contact-icon" />
                      <span>{selectedAssessment.email}</span>
                    </div>
                  </div>

                  <div className="vy-contact-item">
                    <span className="vy-contact-label">Phone</span>
                    <div className="vy-contact-val">
                      <FiPhone className="contact-icon" />
                      <span>{selectedAssessment.phone}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

