import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import VyonicLogo from '../../components/VyonicLogo';
import { logout, getDashboardData, getDashboardStats } from '../../services/auth';
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
  FiPhone
} from 'react-icons/fi';

// HELPERS
const formatDate = (date) => {
  if (!date) return '-';

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};


const formatTime = (time) => {
  if (!time) return '-';

  if (typeof time !== 'string') {
    return '-';
  }

  if (time.includes('T')) {
    const date = new Date(time);

    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      });
    }
  }

  const parts = time.split(':');

  if (parts.length < 2) {
    return time;
  }

  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];

  if (Number.isNaN(hours)) {
    return time;
  }

  const suffix = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;

  if (hours === 0) {
    hours = 12;
  }

  return `${hours}:${minutes} ${suffix}`;
};

// FORMAT API BOOKING
const formatAssessment = (item, index) => {
  const profile = item?.profile || {};
  const user = item?.user || {};
  const userProfile = item?.user_profile || {};
  const location = item?.location || {};
  const slot = item?.slot || {};

  // NAME
  const firstName = profile.first_name || '';
  const lastName = profile.last_name || '';

  const fullName =
    `${firstName} ${lastName}`.trim() ||
    user.email ||
    item.client_uuid ||
    `Client ${index + 1}`;

  // INITIALS
  const initials =
    fullName
      .split(' ')
      .filter(Boolean)
      .map((name) => name[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'CL';

  // STATUS
  let bookingStatus = (
    item.booking_status || 'new'
  ).toLowerCase();

  /*API*/
  if (bookingStatus === 'confirmed') {
    bookingStatus = 'scheduled';
  }

  // DATE
  const assessmentDate =
    item.date ||
    slot.date ||
    item.created_at;

  // TIME
  const startTime = formatTime(
    item.start_time || slot.start_time
  );

  const endTime = formatTime(
    item.end_time || slot.end_time
  );

  let timeSlot = '-';

  if (startTime !== '-' && endTime !== '-') {
    timeSlot = `${startTime} - ${endTime}`;
  } else if (startTime !== '-') {
    timeSlot = startTime;
  }

  // GOALS
  const goals = Array.isArray(userProfile.goals)
    ? userProfile.goals
      .map((goal) => goal?.title)
      .filter(Boolean)
      .join(', ')
    : '-';

  // TRAINING FREQUENCY
  const trainingFrequency =
    userProfile.training_frequency?.title ||
    '-';

  // HEIGHT
  const height =
    userProfile.height_cm !== null &&
      userProfile.height_cm !== undefined
      ? `${userProfile.height_cm} ${userProfile.height_unit || 'cm'
      }`
      : '-';

  // WEIGHT
  const weight =
    userProfile.weight_kg !== null &&
      userProfile.weight_kg !== undefined
      ? `${userProfile.weight_kg} ${userProfile.weight_unit || 'kg'
      }`
      : '-';

  // TRAINING EXPERIENCE
  const trainingYears =
    userProfile.training_years !== null &&
      userProfile.training_years !== undefined
      ? `${userProfile.training_years} ${userProfile.training_years === 1
        ? 'Year'
        : 'Years'
      }`
      : '-';

  // INJURY / MEDICAL NOTES
  const injuryMedicalNotes =
    userProfile.injuries_or_conditions ||
    userProfile.medical_notes ||
    '-';

  // PHONE
  const phone = user.phone
    ? `${user.country_code || ''} ${user.phone}`.trim()
    : '-';

  // ASSESSMENT ID
  const rawId = String(item.id || '');

  const assessmentId = rawId
    ? `#VA-${rawId
      .replace(/-/g, '')
      .slice(-6)
      .toUpperCase()}`
    : `#VA-${index + 1}`;

  return {
    id: item.id || `${item.client_uuid}-${index}`,

    client_uuid:
      item.client_uuid || '-',

    slot_id:
      item.slot_id || '-',

    assessment_id:
      assessmentId,

    name:
      fullName,

    initials,

    date:
      formatDate(assessmentDate),

    time_slot:
      timeSlot,

    booking_status:
      bookingStatus,

    assessment_type:
      item.assessment_type || '-',

    appointment_type:
      'Appointment',

    duration:
      slot.duration_min !== undefined &&
        slot.duration_min !== null
        ? `${slot.duration_min} minutes`
        : '-',

    attendance:
      item.attendance || '-',

    location:
      location.name || '-',

    location_area:
      location.area || '-',

    emirate:
      location.emirate || '-',

    venue_type:
      location.venue_type || '-',

    address:
      location.address || '-',

    assessment_goal:
      goals,

    height,

    weight,

    previous_training_experience:
      trainingYears,

    weekly_training_frequency:
      trainingFrequency,

    injury_medical_notes:
      injuryMedicalNotes,

    email:
      user.email || '-',

    phone,

    is_assessment:
      item.is_assessment,

    cancel_reason:
      item.cancel_reason || null,

    // Keep original API values too
    original_booking_status:
      String(item.booking_status || '').toLowerCase(),

    created_at:
      item.created_at || null
  };
};

// EXTRACT BOOKINGS FROM API RESPONSE
const getBookingsFromResponse = (response) => {
  return response?.data?.bookings || [];
};

// DASHBOARD
export default function Dashboard() {
  const navigate = useNavigate();

  const [activeNav, setActiveNav] =
    useState('Dashboard');

  const [themeMode, setThemeMode] =
    useState('dark');

  const [activeFilter, setActiveFilter] =
    useState('all');

  const [searchQuery, setSearchQuery] =
    useState('');

  const [showSearchInput, setShowSearchInput] =
    useState(false);

  const [assessments, setAssessments] =
    useState([]);

  const [selectedAssessmentId, setSelectedAssessmentId] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [dashboardStats, setDashboardStats] =
    useState({ clients: '-', partners: '-', assessments: '-', journeys: '-' });

  const LIMIT = 10;

  const [currentPage, setCurrentPage] =
    useState(1);

  const [totalPages, setTotalPages] =
    useState(1);

  const [navOpen, setNavOpen] = useState(false);

  // FILTERS
  const filters = [
    {
      id: 'all',
      label: 'All'
    },
    {
      id: 'new',
      label: 'New'
    },
    {
      id: 'scheduled',
      label: 'Scheduled'
    },
    {
      id: 'completed',
      label: 'Completed'
    },
    {
      id: 'cancelled',
      label: 'Cancelled'
    }
  ];

  // LOAD DASHBOARD STATS
  useEffect(() => {
    let cancelled = false;
    const loadStats = async () => {
      try {
        const stats = await getDashboardStats();
        if (!cancelled) {
          setDashboardStats({
            clients:     stats.clients     ?? '-',
            partners:    stats.partners    ?? '-',
            assessments: stats.assessments ?? '-',
            journeys:    stats.journeys    ?? '-',
          });
        }
      } catch (err) {
        console.error('Dashboard stats error:', err);
      }
    };
    loadStats();
    return () => { cancelled = true; };
  }, []);

  // RESET PAGE ON FILTER CHANGE
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter]);

  // LOAD API DATA
  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);

      try {
        let allBookings = [];
        let apiTotal = 0;

        // Map UI filter → API booking_status value
        const apiStatus =
          activeFilter === 'scheduled' ? 'confirmed' : activeFilter;

        const response =
          await getDashboardData(apiStatus, currentPage, LIMIT);

        allBookings = getBookingsFromResponse(response);

        const pagination =
          response?.data?.pagination ||
          response?.pagination ||
          {};

        const knownTotal =
          pagination.total ||
          pagination.total_count ||
          pagination.count ||
          response?.data?.total ||
          response?.data?.total_count ||
          response?.total ||
          response?.total_count ||
          null;

        apiTotal =
          knownTotal !== null
            ? knownTotal
            : allBookings.length === LIMIT
              ? (currentPage * LIMIT) + 1  // unknown — pretend there's a next page
              : (currentPage - 1) * LIMIT + allBookings.length;

        // REMOVE DUPLICATES
        const uniqueBookings = Array.from(
          new Map(
            allBookings
              .filter(Boolean)
              .map((item, index) => [
                item.id ||
                `${item.client_uuid}-${item.slot_id}-${index}`,
                item
              ])
          ).values()
        );

        // ONLY ASSESSMENTS
        const assessmentBookings =
          uniqueBookings.filter((item) => {
            if (
              item.is_assessment !== undefined &&
              item.is_assessment !== null
            ) {
              return item.is_assessment === true;
            }
            return true;
          });

        // FORMAT + SORT
        const formattedAssessments =
          assessmentBookings
            .map((item, index) => ({
              original: item,
              formatted: formatAssessment(item, index)
            }))
            .sort((a, b) => {
              const dateA = new Date(
                a.original.date ||
                a.original.slot?.date ||
                a.original.created_at ||
                0
              );
              const dateB = new Date(
                b.original.date ||
                b.original.slot?.date ||
                b.original.created_at ||
                0
              );
              return dateB - dateA;
            })
            .map((item) => item.formatted);

        const computedPages = Math.max(1, Math.ceil(apiTotal / LIMIT));

        if (!cancelled) {
          setAssessments(formattedAssessments);
          setTotalPages(computedPages);

          // SELECT FIRST RECORD
          setSelectedAssessmentId(
            (currentId) => {
              const currentStillExists =
                formattedAssessments.some(
                  (item) => item.id === currentId
                );
              if (currentStillExists) return currentId;
              if (formattedAssessments.length > 0)
                return formattedAssessments[0].id;
              return null;
            }
          );
        }

      } catch (error) {
        console.error(
          'Dashboard API Error:',
          error
        );

        if (!cancelled) {
          setAssessments([]);
          setSelectedAssessmentId(null);
          setTotalPages(1);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };

  }, [activeFilter, currentPage]);

  // SEARCH
  const filteredAssessments = useMemo(() => {

    const search =
      searchQuery
        .trim()
        .toLowerCase();

    if (!search) {
      return assessments;
    }

    return assessments.filter(
      (item) =>
        String(item.name || '')
          .toLowerCase()
          .includes(search) ||

        String(item.email || '')
          .toLowerCase()
          .includes(search) ||

        String(item.phone || '')
          .toLowerCase()
          .includes(search) ||

        String(item.assessment_id || '')
          .toLowerCase()
          .includes(search) ||

        String(item.client_uuid || '')
          .toLowerCase()
          .includes(search) ||

        String(item.assessment_type || '')
          .toLowerCase()
          .includes(search)
    );

  }, [
    assessments,
    searchQuery
  ]);

  // KEEP SELECTED ASSESSMENT VALID
  useEffect(() => {

    if (
      filteredAssessments.length === 0
    ) {
      setSelectedAssessmentId(null);
      return;
    }

    const selectedStillExists =
      filteredAssessments.some(
        (item) =>
          item.id === selectedAssessmentId
      );

    if (!selectedStillExists) {
      setSelectedAssessmentId(
        filteredAssessments[0].id
      );
    }

  }, [
    filteredAssessments,
    selectedAssessmentId
  ]);

  // SELECTED ASSESSMENT
  const selectedAssessment =
    useMemo(() => {

      return (
        assessments.find(
          (item) =>
            item.id === selectedAssessmentId
        ) ||
        filteredAssessments[0] ||
        null
      );

    }, [
      assessments,
      selectedAssessmentId,
      filteredAssessments
    ]);

  // LOGOUT
  const handleLogout = async () => {

    const result =
      await Swal.fire({
        title: 'Are you sure?',
        text: 'Do you really want to log out?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3b6fd9',
        cancelButtonColor: '#222222',
        confirmButtonText: 'Logout',
        cancelButtonText: 'Cancel',
        background: '#141414',
        color: '#ffffff'
      });


    if (result.isConfirmed) {

      await logout();

      await Swal.fire({
        icon: 'info',
        title: 'Logged out',
        text: 'You have been logged out successfully.',
        showConfirmButton: false,
        timer: 1500,
        background: '#141414',
        color: '#ffffff'
      });

      navigate('/login');
    }
  };

  // JSX
  return (
    <div className="vy-dashboard-app">

      {/* NAVBAR */}

      <header className="vy-navbar">

        <div className="vy-nav-left">

          <div
            className="vy-logo-wrapper"
            onClick={() =>
              navigate('/dashboard')
            }
          >
            <VyonicLogo
              width={50}
              height={50}
            />
            <span className="vy-brand-title">
              VYONIC
            </span>
          </div>

          <nav className={`vy-nav-links${navOpen ? ' open' : ''}`}>

            <button
              className={`vy-nav-item ${activeNav === 'Dashboard'
                  ? 'active'
                  : ''
                }`}
              onClick={() =>
                setActiveNav('Dashboard')
              }
            >
              <FiGrid className="nav-icon" />
              <span>Dashboard</span>
            </button>
            <button
              className={`vy-nav-item ${activeNav === 'Client'
                  ? 'active'
                  : ''
                }`}
              onClick={() =>
                setActiveNav('Client')
              }
            >
              <FiUsers className="nav-icon" />
              <span>Client</span>
            </button>
            <button
              className={`vy-nav-item ${activeNav === 'Partner'
                  ? 'active'
                  : ''
                }`}
              onClick={() =>
                setActiveNav('Partner')
              }
            >
              <FiUserCheck className="nav-icon" />
              <span>Partner</span>
            </button>
            <button
              className={`vy-nav-item ${activeNav === 'Bookings'
                  ? 'active'
                  : ''
                }`}
              onClick={() =>
                setActiveNav('Bookings')
              }
            >
              <FiCalendar className="nav-icon" />
              <span>Bookings</span>
            </button>
            <button
              className={`vy-nav-item ${activeNav === 'Billing'
                  ? 'active'
                  : ''
                }`}
              onClick={() =>
                setActiveNav('Billing')
              }
            >
              <FiCreditCard className="nav-icon" />
              <span>Billing</span>
            </button>
            <button
              className={`vy-nav-item ${activeNav === 'Setting'
                  ? 'active'
                  : ''
                }`}
              onClick={() =>
                setActiveNav('Setting')
              }
            >
              <FiSettings className="nav-icon" />
              <span>Setting</span>
            </button>
          </nav>
        </div>

        <button
          className="vy-nav-toggle"
          aria-label="Toggle navigation"
          onClick={() => setNavOpen((o) => !o)}
        >
          ☰
        </button>

        <div className="vy-nav-right">

          <div className="vy-theme-toggle">

            <button
              className={`theme-toggle-option ${themeMode === 'light'
                  ? 'active'
                  : ''
                }`}
              onClick={() =>
                setThemeMode('light')
              }
            >
              <FiSun className="theme-icon" />
              <span>Light</span>
            </button>
            <button
              className={`theme-toggle-option ${themeMode === 'dark'
                  ? 'active'
                  : ''
                }`}
              onClick={() =>
                setThemeMode('dark')
              }
            >
              <FiMoon className="theme-icon" />
              <span>Dark</span>
            </button>
          </div>

          <div
            className="vy-notification-btn"
            title="Notifications"
          >
            <FiBell className="bell-icon" />

            <span className="notif-badge">
              70
            </span>
          </div>

          <div
            className="vy-user-avatar"
            onClick={handleLogout}
            title="Click to Logout"
          >
            <VyonicLogo
              width={22}
              height={22}
            />
          </div>
        </div>
      </header>


      {/* MAIN */}
      <main className="vy-dashboard-main">

        {/* HEADER */}
        <div className="vy-header-section">

          <div className="vy-title-col">

            <h1 className="vy-dashboard-title">
              Dashboard
            </h1>
          </div>

          <div className="vy-metrics-grid">

            <div className="vy-metric-card">
              <div className="vy-metric-val">
                {dashboardStats.clients}
              </div>
              <div className="vy-metric-lbl">
                Clients
              </div>
            </div>

            <div className="vy-metric-card">
              <div className="vy-metric-val">
                {dashboardStats.partners}
              </div>
              <div className="vy-metric-lbl">
                Partners
              </div>
            </div>

            <div className="vy-metric-card">
              <div className="vy-metric-val">
                {dashboardStats.assessments}
              </div>
              <div className="vy-metric-lbl">
                Assessments
              </div>
            </div>

            <div className="vy-metric-card">
              <div className="vy-metric-val">
                {dashboardStats.journeys}
              </div>
              <div className="vy-metric-lbl">
                Journeys
              </div>
            </div>
          </div>
        </div>

        {/* ACTION BAR */}
        <div className="vy-action-bar">
          <div className="vy-action-left">
            <h2 className="vy-section-heading">
              All assessments
            </h2>
          </div>

          <div className="vy-action-right">
            {/* FILTERS */}
            <div className="vy-filters-group">
              {filters.map((filter) => (

                <button
                  key={filter.id}
                  className={`vy-filter-pill ${activeFilter === filter.id
                      ? 'active'
                      : ''
                    }`}
                  onClick={() =>
                    setActiveFilter(
                      filter.id
                    )
                  }
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* SEARCH */}
            <div
              className={`vy-search-container ${showSearchInput
                  ? 'open'
                  : ''
                }`}
            >
              {showSearchInput && (

                <input
                  type="text"
                  className="vy-search-input"
                  placeholder="Search assessments..."
                  value={searchQuery}
                  onChange={(e) =>
                    setSearchQuery(
                      e.target.value
                    )
                  }
                  autoFocus
                />
              )}

              <button
                className="vy-icon-btn vy-search-btn"
                onClick={() =>
                  setShowSearchInput(
                    !showSearchInput
                  )
                }
                title="Search"
              >
                <FiSearch />
              </button>

            </div>

            {/* NEW ASSESSMENT */}
            <button
              className="vy-new-assessment-btn"
              onClick={() =>
                navigate('/onboarding')
              }
            >
              <FiPlus className="plus-icon" />

              <span>
                New Assessment
              </span>
            </button>
          </div>
        </div>


        {/* ASSESSMENT CONTENT */}
        <div className="vy-split-view">

          {/* LEFT LIST */}
          <div className="vy-list-column">

            {loading ? (

              <div className="vy-empty-state">
                Loading assessments...
              </div>

            ) : filteredAssessments.length === 0 ? (

              <div className="vy-empty-state">
                No assessments found.
              </div>

            ) : (

              filteredAssessments.map(
                (item) => {

                  const isSelected =
                    selectedAssessment &&
                    selectedAssessment.id ===
                    item.id;

                  return (

                    <div
                      key={item.id}
                      className={`vy-assessment-card ${isSelected
                          ? 'selected'
                          : ''
                        }`}
                      onClick={() =>
                        setSelectedAssessmentId(
                          item.id
                        )
                      }
                    >
                      <div className="vy-card-avatar">
                        <span>
                          {item.initials}
                        </span>
                      </div>

                      <div className="vy-card-body">

                        <div className="vy-card-name">
                          {item.name}
                        </div>

                        <div className="vy-card-date">
                          {item.date}
                        </div>

                        <div className="vy-card-time-pill">

                          <span>
                            {item.time_slot}
                          </span>
                        </div>
                      </div>

                      <div className="vy-card-action">
                        <button
                          className="vy-arrow-btn"
                          tabIndex={-1}
                          aria-label="Open assessment"
                        >
                          <FiArrowUpRight />
                        </button>

                      </div>
                    </div>
                  );
                }
              )
            )}

            {/* PAGINATION — always visible */}
            {!loading && (
              <div className="vy-pagination">
                {/* First */}
                <button
                  className="vy-page-btn"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  aria-label="First page"
                >
                  «
                </button>

                {/* Prev */}
                <button
                  className="vy-page-btn"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                >
                  ‹
                </button>

                {/* Page numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) =>
                    p === 1 ||
                    p === totalPages ||
                    Math.abs(p - currentPage) <= 1
                  )
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) {
                      acc.push('...');
                    }
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) =>
                    p === '...' ? (
                      <span key={`ellipsis-${idx}`} className="vy-page-ellipsis">…</span>
                    ) : (
                      <button
                        key={p}
                        className={`vy-page-btn ${currentPage === p ? 'active' : ''
                          }`}
                        onClick={() => setCurrentPage(p)}
                        aria-label={`Page ${p}`}
                        aria-current={currentPage === p ? 'page' : undefined}
                      >
                        {p}
                      </button>
                    )
                  )}

                {/* Next */}
                <button
                  className="vy-page-btn"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                >
                  ›
                </button>

                {/* Last */}
                <button
                  className="vy-page-btn"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  aria-label="Last page"
                >
                  »
                </button>
              </div>
            )}

          </div>

          {/* RIGHT DETAIL */}
          {selectedAssessment && (

            <div className="vy-detail-column">

              {/* DETAIL HEADER */}

              <div className="vy-detail-header-card">

                <div className="vy-detail-top-row">
                  <div className="vy-detail-profile-row">
                    <div className="vy-detail-avatar">
                      <span>
                        {selectedAssessment.initials}
                      </span>
                    </div>
                    <div className="vy-detail-title-group">
                      <h2 className="vy-detail-name">
                        {selectedAssessment.name}
                      </h2>

                      <span className="vy-detail-id-tag">
                        {selectedAssessment.assessment_id}
                      </span>
                    </div>
                  </div>

                  <div className="vy-detail-badge-wrap">
                    <span
                      className={`vy-status-badge ${selectedAssessment.booking_status
                        }`}
                    >
                      {selectedAssessment.booking_status}
                    </span>
                  </div>
                </div>

                <div className="vy-detail-meta-grid">
                  {/* LOCATION */}
                  <div className="vy-meta-item">

                    <div className="vy-meta-title">
                      {selectedAssessment.address}, {selectedAssessment.location_area}, {selectedAssessment.location}
                    </div>

                    <div className="vy-meta-sub">
                      {selectedAssessment.assessment_type}
                    </div>
                  </div>

                  {/* DATE / TIME */}
                  <div className="vy-meta-item">

                    <div className="vy-meta-sub-date">
                      {selectedAssessment.date}
                    </div>

                    <div className="vy-meta-highlight">
                      {selectedAssessment.time_slot}
                    </div>

                    <div className="vy-meta-sub">
                      {selectedAssessment.attendance}
                    </div>
                  </div>

                  {/* DURATION */}
                  <div className="vy-meta-item">
                    <div className="vy-meta-highlight">
                      {selectedAssessment.duration}
                    </div>
                    <div className="vy-meta-sub">
                      Duration
                    </div>
                  </div>
                </div>

              </div>

              {/* ASSESSMENT INFO */}
              <div className="vy-info-card">

                <h3 className="vy-card-section-title">
                  Assessment info
                </h3>
                <div className="vy-info-table">

                  <div className="vy-info-row">
                    <span className="vy-info-label">
                      Assessment goal
                    </span>
                    <span className="vy-info-value">
                      {selectedAssessment.assessment_goal}
                    </span>
                  </div>

                  <div className="vy-info-row">
                    <span className="vy-info-label">
                      Height
                    </span>
                    <span className="vy-info-value">
                      {selectedAssessment.height}
                    </span>
                  </div>


                  <div className="vy-info-row">
                    <span className="vy-info-label">
                      Weight
                    </span>
                    <span className="vy-info-value">
                      {selectedAssessment.weight}
                    </span>
                  </div>


                  <div className="vy-info-row">
                    <span className="vy-info-label">
                      Previous training experience
                    </span>
                    <span className="vy-info-value">
                      {
                        selectedAssessment
                          .previous_training_experience
                      }
                    </span>
                  </div>


                  <div className="vy-info-row">
                    <span className="vy-info-label">
                      Weekly training frequency
                    </span>
                    <span className="vy-info-value">
                      {
                        selectedAssessment
                          .weekly_training_frequency
                      }
                    </span>
                  </div>


                  <div className="vy-info-row">
                    <span className="vy-info-label">
                      Injury &amp; medical notes
                    </span>
                    <span className="vy-info-value">
                      {
                        selectedAssessment
                          .injury_medical_notes
                      }
                    </span>
                  </div>

                  {/* CANCELLATION REASON — only for cancelled */}
                  {selectedAssessment.booking_status === 'cancelled' &&
                    selectedAssessment.cancel_reason && (
                      <div className="vy-info-row">
                        <span className="vy-info-label">
                          Cancellation reason
                        </span>
                        <span className="vy-info-value">
                          {selectedAssessment.cancel_reason}
                        </span>
                      </div>
                    )}

                </div>

              </div>

              {/* CONTACT INFO */}
              <div className="vy-info-card">

                <h3 className="vy-card-section-title">
                  Contact info
                </h3>
                <div className="vy-contact-grid">

                  <div className="vy-contact-item">
                    <span className="vy-contact-label">
                      Email
                    </span>

                    <div className="vy-contact-val">
                      <FiMail className="contact-icon" />
                      <span>
                        {selectedAssessment.email}
                      </span>
                    </div>
                  </div>

                  <div className="vy-contact-item">
                    <span className="vy-contact-label">
                      Phone
                    </span>
                    <div className="vy-contact-val">
                      <FiPhone className="contact-icon" />
                      <span>
                        {selectedAssessment.phone}
                      </span>
                    </div>
                  </div>

                </div>

              </div>

              {/* STATUS-BASED ACTION BUTTONS */}
              {selectedAssessment.booking_status === 'completed' && (
                <div className="vy-action-buttons-row">
                  <button
                    className="vy-btn-primary"
                    onClick={() => {
                      /* TODO: open assessment handler */
                    }}
                  >
                    Open assessment
                  </button>
                </div>
              )}

              {selectedAssessment.booking_status === 'scheduled' && (
                <div className="vy-action-buttons-row">
                  <button
                    className="vy-btn-danger-outline"
                    onClick={() => {
                      /* TODO: cancel assessment handler */
                    }}
                  >
                    Cancel assessment
                  </button>
                  <button
                    className="vy-btn-secondary"
                    onClick={() => {
                      /* TODO: reschedule handler */
                    }}
                  >
                    Reschedule
                  </button>
                  <button
                    className="vy-btn-primary"
                    onClick={() => {
                      /* TODO: start assessment handler */
                    }}
                  >
                    Start assessment
                  </button>
                </div>
              )}

              {/* Cancelled: no action buttons */}

            </div>

          )}

        </div>

      </main>

    </div>
  );
}