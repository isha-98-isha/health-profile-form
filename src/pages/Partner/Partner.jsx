import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiSearch, FiMapPin, FiArrowRight } from 'react-icons/fi';
import { useSocket } from '../../context/SocketContext';
import DashboardNavbar from '../../components/Dashboard/DashboardNavbar';
import Pagination from '../../components/Dashboard/Pagination';
import { getPartnerData } from '../../services/auth';
import './partner.css';

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Normalizes an API partner object to UI fields
const formatPartner = (item, defaultStatus = 'pending', index = 0) => {
  const profile = item?.profile || item?.user_profile || item?.partner_profile || {};
  const user = item?.user || {};

  let firstName = item.first_name || profile.first_name || profile.firstName || user.first_name || '';
  let lastName = item.last_name || profile.last_name || profile.lastName || user.last_name || '';

  if (!firstName && item.primary_contact_name) {
    const parts = String(item.primary_contact_name).trim().split(' ');
    firstName = parts[0] || '';
    lastName = parts.slice(1).join(' ') || '';
  }

  const businessName = item.business_name || item.name || profile.business_name || item.company_name || '';
  const name = businessName || `${firstName} ${lastName}`.trim() || user.email || `Partner ${index + 1}`;

  let roles = [];
  if (Array.isArray(item.roles)) {
    roles = item.roles.map((r) => (typeof r === 'object' ? r.name || r.title || r.role : r)).filter(Boolean);
  } else if (Array.isArray(profile.roles)) {
    roles = profile.roles.map((r) => (typeof r === 'object' ? r.name || r.title || r.role : r)).filter(Boolean);
  } else if (item.partner_type) {
    roles = [item.partner_type];
  } else if (item.role || profile.role) {
    roles = [item.role || profile.role];
  }

  let location = '—';
  if (item.location_of_execution) {
    location = item.location_of_execution;
  } else if (Array.isArray(item.service_locations) && item.service_locations.length > 0) {
    location = item.service_locations.map((loc) => loc.name || loc.city || String(loc)).join(', ');
  } else if (Array.isArray(item.locations) && item.locations.length > 0) {
    location = item.locations.map((loc) => loc.name || loc.city || String(loc)).join(', ');
  } else if (item.location || profile.location) {
    location = item.location || profile.location;
  } else if (item.city || item.address) {
    location = item.city ? `${item.city}${item.state ? ', ' + item.state : ''}` : item.address;
  }

  // Always read approval_status first — it is the authoritative status field
  const rawStatus = (
    item.approval_status ||
    item.status ||
    profile.approval_status ||
    profile.status ||
    item.account_status ||
    defaultStatus
  ).toLowerCase().trim();

  let status = 'pending';
  if (rawStatus === 'approved' || rawStatus.includes('appr') || rawStatus === 'active') {
    status = 'approved';
  } else if (rawStatus === 'rejected' || rawStatus.includes('reject') || rawStatus.includes('declin')) {
    status = 'rejected';
  }

  return {
    id: item.id || item._id || item.user_uuid || item.uuid || `partner-${index}`,
    name,
    firstName: firstName || '—',
    lastName: lastName || '—',
    roles: roles.length > 0 ? roles : ['Trainer'],
    location: location || '—',
    submitted: formatDate(item.updated_at),
    status
  };
};

// Safely extract an array from whatever shape the API container has
const extractArray = (container) => {
  if (!container) return [];
  if (Array.isArray(container)) return container;
  if (Array.isArray(container.data)) return container.data;
  if (Array.isArray(container.partners)) return container.partners;
  if (Array.isArray(container.users)) return container.users;
  if (Array.isArray(container.list)) return container.list;
  return [];
};

const extractTotal = (container, fallback) => {
  if (!container) return fallback;
  if (typeof container.total === 'number') return container.total;
  if (typeof container.total_count === 'number') return container.total_count;
  if (typeof container.count === 'number') return container.count;
  return fallback;
};

const filterPartnersByQuery = (list, searchQuery) => {
  if (!searchQuery.trim()) return list;
  const query = searchQuery.toLowerCase().trim();
  return list.filter((p) =>
    (p.name       || '').toLowerCase().includes(query) ||
    (p.firstName  || '').toLowerCase().includes(query) ||
    (p.lastName   || '').toLowerCase().includes(query) ||
    (p.location   || '').toLowerCase().includes(query) ||
    (p.roles      || []).some((r) => r.toLowerCase().includes(query))
  );
};

export default function Partner() {
  const navigate = useNavigate();
  const { refreshKey } = useSocket();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRoles, setExpandedRoles] = useState({});

  const [pendingList, setPendingList] = useState([]);
  const [approvedList, setApprovedList] = useState([]);
  const [rejectedList, setRejectedList] = useState([]);

  const [pendingTotal, setPendingTotal] = useState(0);
  const [approvedTotal, setApprovedTotal] = useState(0);
  const [rejectedTotal, setRejectedTotal] = useState(0);

  // Single API call — no parallel calls
  useEffect(() => {
    let cancelled = false;

    const fetchPartners = async () => {
      setLoading(true);
      try {
        const response = await getPartnerData('all', currentPage, pageSize, searchQuery);
        const dataObj = response?.data ?? response ?? {};

        // -----------------------------------------------
        // CASE 1: Grouped response — pending_data / approve_data / reject_data
        // -----------------------------------------------
        const pendingContainer  = dataObj.pending_data  ?? dataObj.pending  ?? null;
        const approvedContainer = dataObj.approve_data  ?? dataObj.approved ?? null;  // API uses 'approve_data'
        const rejectedContainer = dataObj.reject_data   ?? dataObj.rejected ?? null;  // API uses 'reject_data'

        if (pendingContainer !== null || approvedContainer !== null || rejectedContainer !== null) {
          const rawPending  = extractArray(pendingContainer);
          const rawApproved = extractArray(approvedContainer);
          const rawRejected = extractArray(rejectedContainer);

          // Map each group with its explicit default status so approval_status on the item still wins
          const pList = rawPending.map((item, idx)  => formatPartner(item, 'pending',  idx));
          const aList = rawApproved.map((item, idx) => formatPartner(item, 'approved', idx));
          const rList = rawRejected.map((item, idx) => formatPartner(item, 'rejected', idx));

          if (!cancelled) {
            setPendingList(pList);
            setApprovedList(aList);
            setRejectedList(rList);
            setPendingTotal(extractTotal(pendingContainer,   pList.length));
            setApprovedTotal(extractTotal(approvedContainer, aList.length));
            setRejectedTotal(extractTotal(rejectedContainer, rList.length));
          }
          return;
        }

        // -----------------------------------------------
        // CASE 2: Flat array — sort by approval_status on each item
        // -----------------------------------------------
        const flatItems =
          dataObj.partners ??
          dataObj.users    ??
          (Array.isArray(dataObj.data) ? dataObj.data : null) ??
          (Array.isArray(dataObj)      ? dataObj      : []);


        const formatted = flatItems.map((item, idx) => formatPartner(item, item.approval_status || item.status || 'pending', idx));

        const p = formatted.filter((x) => x.status === 'pending');
        const a = formatted.filter((x) => x.status === 'approved');
        const r = formatted.filter((x) => x.status === 'rejected');


        if (!cancelled) {
          setPendingList(p);
          setApprovedList(a);
          setRejectedList(r);
          setPendingTotal(p.length);
          setApprovedTotal(a.length);
          setRejectedTotal(r.length);
        }
      } catch (err) {
        console.error('[Partner] Fetch error:', err?.message || err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchPartners();
    return () => { cancelled = true; };
  }, [currentPage, pageSize, searchQuery, refreshKey]);

  const toggleExpandRoles = (id) =>
    setExpandedRoles((prev) => ({ ...prev, [id]: !prev[id] }));

  const visiblePending  = useMemo(() => filterPartnersByQuery(pendingList, searchQuery),  [pendingList, searchQuery]);
  const visibleApproved = useMemo(() => filterPartnersByQuery(approvedList, searchQuery), [approvedList, searchQuery]);
  const visibleRejected = useMemo(() => filterPartnersByQuery(rejectedList, searchQuery), [rejectedList, searchQuery]);

  const totalEntries = pendingTotal + approvedTotal + rejectedTotal;
  const totalPages   = Math.max(1, Math.ceil(totalEntries / pageSize));
  const startEntry   = totalEntries === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endEntry     = Math.min(currentPage * pageSize, totalEntries);

  const handleAction = (partner, actionType) => {
    console.log(`[Partner] Action "${actionType}" for id=${partner.id}`);
  };

  const renderRoles = (partner) => {
    const roles = Array.isArray(partner.roles) ? partner.roles : [];
    if (!roles.length) return <span>—</span>;
    const isExpanded = expandedRoles[partner.id];
    if (isExpanded) {
      return (
        <div className="roles-list-wrapper">
          <div className="role-badges-group">
            {roles.map((role, idx) => <span key={idx} className="role-badge-pill">{role}</span>)}
          </div>
          <button type="button" className="role-toggle-btn" onClick={() => toggleExpandRoles(partner.id)}>
            Show less
          </button>
        </div>
      );
    }
    const remaining = roles.length - 1;
    return (
      <div className="roles-list-wrapper">
        <span className="role-primary-text">{roles[0]}</span>
        {remaining > 0 && (
          <button type="button" className="role-toggle-btn" onClick={() => toggleExpandRoles(partner.id)}>
            Read more (+{remaining})
          </button>
        )}
      </div>
    );
  };

  const renderTableSection = (title, count, badgeClass, list, emptyMessage, actionType) => (
    <section className="vy-partner-section">
      <div className="vy-section-title-wrap">
        <h2 className="vy-section-title">{title}</h2>
        <span className={`vy-count-badge ${badgeClass}`}>{count}</span>
      </div>
      <div className="vy-table-wrapper">
        <table className="vy-partner-table">
          <thead>
            <tr>
              <th>NAME</th><th>FIRST NAME</th><th>LAST NAME</th>
              <th>ROLES</th><th>LOCATION</th><th>SUBMITTED</th><th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {loading && list.length === 0 ? (
              <tr><td colSpan="7" className="empty-table-row">Loading partners...</td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan="7" className="empty-table-row">{emptyMessage}</td></tr>
            ) : list.map((item) => (
              <tr key={item.id}>
                <td className="td-name">{item.name || '—'}</td>
                <td className="td-first-name">{item.firstName || '—'}</td>
                <td className="td-last-name">{item.lastName || '—'}</td>
                <td className="td-roles">{renderRoles(item)}</td>
                <td className="td-location">
                  <div className="location-cell-content">
                    {item.location && item.location !== '—' && <FiMapPin className="location-pin-icon" />}
                    <span>{item.location || '—'}</span>
                  </div>
                </td>
                <td className="td-submitted">{item.submitted || '—'}</td>
                <td className="td-action">
                  {actionType === 'review' && (
                    <button className="action-btn-link" onClick={() => handleAction(item, 'review')}>
                      <span>Review</span><span className="action-sub-arrow">→</span>
                    </button>
                  )}
                  {actionType === 'manage' && (
                    <button className="action-btn-link" onClick={() => handleAction(item, 'manage')}>
                      <span>Manage</span><span className="action-sub-arrow">→</span>
                    </button>
                  )}
                  {actionType === 'reopen' && (
                    <button className="action-btn-inline" onClick={() => handleAction(item, 'reopen')}>
                      <span>Reopen</span><FiArrowRight size={12} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  return (
    <div className="vy-partner-page">
      <DashboardNavbar activePage="Partner" />
      <main className="vy-partner-main">
        <div className="vy-partner-header">
          <div>
            <div className="vy-partner-breadcrumb">DIRECTORY • ADMIN ONLY</div>
            <h1 className="vy-partner-title">Partners</h1>
          </div>
          <button className="vy-new-partner-btn" onClick={() => navigate('/onboarding')}>
            <FiPlus size={16} /><span>New partner</span>
          </button>
        </div>

        <div className="vy-partner-controls">
          <div className="vy-show-row-selector">
            <span>Show Row :</span>
            <select className="vy-row-dropdown" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div className="vy-partner-search-box">
            <FiSearch className="vy-search-icon" />
            <input
              type="text"
              placeholder="Search name, location..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>

        {renderTableSection('Pending review', pendingTotal,  'vy-badge-pending',  visiblePending,  'No pending applications.', 'review')}
        {renderTableSection('Approved',       approvedTotal, 'vy-badge-approved', visibleApproved, 'No approved partners.',    'manage')}
        {renderTableSection('Rejected',       rejectedTotal, 'vy-badge-rejected', visibleRejected, 'No rejected partners.',    'reopen')}

        <div className="vy-partner-footer">
          <Pagination currentPage={currentPage} totalPages={totalPages} setCurrentPage={setCurrentPage} />
          <div className="vy-entries-info">Showing {startEntry} to {endEntry} of {totalEntries} entries</div>
        </div>
      </main>
    </div>
  );
}
