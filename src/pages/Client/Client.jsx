import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import DashboardNavbar from '../../components/Dashboard/DashboardNavbar';
import MasterListView from '../../components/Dashboard/MasterListView';
import ListFilterBar from '../../components/Dashboard/ListFilterBar';
import DetailView from '../../components/Dashboard/DetailView';
import Pagination from '../../components/Dashboard/Pagination';
import { getClientData, getDashboardStats } from '../../services/auth';
import '../Dashboard/dashboard.css';

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getClients = (response) => response?.data?.clients || response?.data?.users || response?.clients || response?.users || response?.data || [];

const getClientPagination = (response, itemCount, page, limit, totalClientsCount = null) => {
  const pagination = response?.data?.pagination || response?.pagination || {};
  const total =
    pagination.total ||
    pagination.total_count ||
    pagination.count ||
    response?.data?.total ||
    response?.data?.total_count ||
    response?.total ||
    response?.total_count ||
    (typeof totalClientsCount === 'number' && totalClientsCount >= 0 ? totalClientsCount : null);

  if (total !== null && total !== undefined) {
    return Math.max(1, Math.ceil(Number(total) / limit));
  }

  const apiTotal = itemCount === limit ? page * limit + 1 : (page - 1) * limit + itemCount;
  return Math.max(1, Math.ceil(apiTotal / limit));
};

const formatClient = (item, index) => {
  const profile = item?.profile || item?.user_profile || item;
  const userProfile = item?.user_profile || item?.profile || {};
  const assessmentData = item?.assessment || item?.assessment_data || userProfile;
  const goals = Array.isArray(assessmentData.goals)
    ? assessmentData.goals.map((goal) => goal?.title || goal?.name).filter(Boolean).join(', ')
    : assessmentData.assessment_goal || item.assessment_goal || '-';
  const trainingYears = assessmentData.training_years ?? item.training_years;
  const firstName = profile.first_name || profile.firstName || '';
  const lastName = profile.last_name || profile.lastName || '';
  const name = `${firstName} ${lastName}`.trim() || item.name || item.email || `Client ${index + 1}`;
  const id = item.id || item.uuid || item.client_uuid || `client-${index}`;
  return {
    id,
    name,
    initials: name.split(' ').filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'CL',
    date: formatDate(item.created_at || item.registered_at || item.registration_date),
    time_slot: 'Client registration',
    booking_status: String(item.status || item.account_status || 'active').toLowerCase(),
    assessment_id: `#VC-${String(id).replace(/-/g, '').slice(-6).toUpperCase()}`,
    date_of_birth: item.date_of_birth || item.dob || '-',
    gender: item.gender || '-',
    registration_source: item.registration_source || 'VYONIC',
    client_status: item.status || item.account_status || 'Active',
    address: item.address || item.location || '-',
    location: item.location || '-',
    email: item.email || item.user?.email || profile.email || '-',
    phone: (item.phone || item.user?.phone || profile.phone) ? `${item.country_code || item.user?.country_code || profile.country_code || ''} ${item.phone || item.user?.phone || profile.phone}`.trim() : '-',
    duration: item.duration_min ? `${item.duration_min} minutes` : '-',
    assessment_goal: goals,
    height: assessmentData.height_cm != null ? `${assessmentData.height_cm} ${assessmentData.height_unit || 'cm'}` : item.height || '-',
    weight: assessmentData.weight_kg != null ? `${assessmentData.weight_kg} ${assessmentData.weight_unit || 'kg'}` : item.weight || '-',
    previous_training_experience: trainingYears != null ? `${trainingYears} ${trainingYears === 1 ? 'Year' : 'Years'}` : item.previous_training_experience || '-',
    weekly_training_frequency: assessmentData.training_frequency?.title || item.weekly_training_frequency || '-',
    injury_medical_notes: assessmentData.injuries_or_conditions || assessmentData.medical_notes || item.injury_medical_notes || '-',
    attendance: item.attendance || '-',
    assessment_type: item.assessment_type || 'Client registration'
  };
};

export default function Client() {
  const navigate = useNavigate();
  const { refreshKey } = useSocket();
  const [clients, setClients] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalClientsCount, setTotalClientsCount] = useState(null);
  const limit = 10;

  // Load client stats to know total count when API pagination metadata is missing
  useEffect(() => {
    let cancelled = false;
    const loadStats = async () => {
      try {
        const stats = await getDashboardStats();
        if (!cancelled && stats?.clients !== undefined && stats?.clients !== null && !Number.isNaN(Number(stats.clients))) {
          setTotalClientsCount(Number(stats.clients));
        }
      } catch (err) {
        console.error('Client stats error:', err);
      }
    };
    loadStats();
    return () => { cancelled = true; };
  }, [refreshKey]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    let cancelled = false;
    const loadClients = async () => {
      setLoading(true);
      try {
        const response = await getClientData('all', currentPage, limit, searchQuery);
        const apiClients = getClients(response);
        const formatted = (Array.isArray(apiClients) ? apiClients : []).filter(Boolean).map(formatClient);
        if (!cancelled) {
          setClients(formatted);
          const computedTotalPages = getClientPagination(
            response,
            formatted.length,
            currentPage,
            limit,
            searchQuery.trim() ? null : totalClientsCount
          );
          setTotalPages(computedTotalPages);
          setSelectedId((current) => formatted.some((item) => item.id === current) ? current : formatted[0]?.id || null);
        }
      } catch (error) {
        console.error('Client API Error:', error);
        if (!cancelled) {
          setClients([]);
          setSelectedId(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadClients();
    return () => { cancelled = true; };
  }, [searchQuery, currentPage, totalClientsCount, refreshKey]);

  const filteredClients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return clients;
    return clients.filter((item) => [item.name, item.email, item.phone, item.assessment_id].some((value) => String(value || '').toLowerCase().includes(query)));
  }, [clients, searchQuery]);

  const selectedClient = filteredClients.find((item) => item.id === selectedId) || filteredClients[0] || null;

  return (
    <div className="vy-dashboard-app">
      <DashboardNavbar activePage="Client" />
      <main className="vy-dashboard-main">
        <div className="vy-header-section">
            <div className="vy-title-col">
                <h1 className="vy-dashboard-title">Clients</h1>
            </div>
        </div>
        <ListFilterBar filters={[]} activeFilter="all" onFilterChange={() => {}} 
        searchQuery={searchQuery} 
        onSearchChange={setSearchQuery} 
        showSearchInput={showSearchInput} 
        onToggleSearch={() => setShowSearchInput((open) => !open)} 
        searchPlaceholder="Search clients..." 
        actionLabel={{ heading: 'Clients', button: 'Register New Client' }} 
        onAction={() => navigate('/onboarding')} />

        <div className="vy-split-view">
        <div className="vy-list-column">
        <MasterListView items={filteredClients} selectedId={selectedClient?.id} 
        onSelect={setSelectedId} loading={loading} 
        loadingMessage="Loading clients..." 
        emptyMessage="No clients found." 
        showDate={false} 
        showTime={false} 
        showEmail />
          {!loading && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              setCurrentPage={setCurrentPage}
            />
          )}
        </div><DetailView data={selectedClient} variant="client" /></div>
      </main>
    </div>
  );
}
