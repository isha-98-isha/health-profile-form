import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiSearch, FiMapPin, FiArrowRight } from 'react-icons/fi';
import { useSocket } from '../../context/SocketContext';
import DashboardNavbar from '../../components/Dashboard/DashboardNavbar';
import Pagination from '../../components/Dashboard/Pagination';
import { getPartnerData, getWorkLocations } from '../../services/auth';
import './partner.css';

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatLocationObject = (location) => {
  if (!location || typeof location !== 'object') return '';
  const city = location.emirate || location.city || location.name || '';
  const area = location.area || location.sub_location || location.area_name || '';
  return [city, area].filter((value) => value && String(value).toLowerCase() !== 'null').join(' - ');
};

// Normalizes an API partner object to UI fields
const formatPartner = (item, defaultStatus = 'pending', index = 0, dynamicLocMap = {}) => {
  const profile = item?.profile || item?.user_profile || item?.partner_profile || {};
  const user = item?.user || {};

  const locMap = dynamicLocMap;

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

  // Robust location parser that unpacks strings, JSON strings, arrays, or objects
  const parseLocationToString = (val) => {
    if (!val && val !== 0) return '';
    if (typeof val === 'number' || (!isNaN(Number(val)) && typeof val === 'string' && val.trim() !== '')) {
      const num = Number(val);
      if (locMap[num]) return locMap[num];
    }
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (!trimmed || trimmed === 'null' || trimmed === 'undefined' || trimmed === '[]' || trimmed === '{}') return '';
      // If it looks like JSON stringified array or object, parse it
      if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
        try {
          const parsed = JSON.parse(trimmed);
          return parseLocationToString(parsed);
        } catch (_) {
          return trimmed;
        }
      }
      return trimmed;
    }
    if (Array.isArray(val)) {
      const formatted = val.map((v) => {
        if (typeof v === 'number' || (!isNaN(Number(v)) && typeof v === 'string' && v.trim() !== '')) {
          return locMap[Number(v)] || '';
        }
        return parseLocationToString(v);
      }).filter(Boolean);
      return formatted.join(', ');
    }
    if (typeof val === 'object') {
      const locationLabel = formatLocationObject(val);
      if (locationLabel) return locationLabel;
      const parts = [
        val.name,
        val.city,
        val.area,
        val.state,
        val.address,
        val.location,
        val.location_of_execution
      ].filter(Boolean);
      if (parts.length > 0) {
        return parts.join(' - ');
      }
    }
    return '';
  };

  let location = '—';
  const locationCandidates = [
    item.location_of_execution,
    profile.location_of_execution,
    user.location_of_execution,
    item.location,
    profile.location,
    user.location,
    item.service_locations,
    profile.service_locations,
    item.locations,
    profile.locations,
    item.city ? `${item.city}${item.state ? ', ' + item.state : ''}` : null,
    profile.city ? `${profile.city}${profile.state ? ', ' + profile.state : ''}` : null,
    item.address,
    profile.address
  ];

  for (const candidate of locationCandidates) {
    const parsed = parseLocationToString(candidate);
    if (parsed) {
      location = parsed;
      break;
    }
  }

  // If location is still empty, construct from primary_location and areas_served (like "Northern Emirates - Araibi")
  if (location === '—') {
    const primLocId = item.primary_location || profile.primary_location || user.primary_location;
    const areasServedIds = item.areas_served || profile.areas_served || user.areas_served;

    const cityName = primLocId ? (locMap[Number(primLocId)] || parseLocationToString(primLocId)) : '';
    let areaNames = '';
    if (Array.isArray(areasServedIds) && areasServedIds.length > 0) {
      areaNames = areasServedIds.map((id) => locMap[Number(id)] || (typeof id === 'string' && isNaN(Number(id)) ? id : '')).filter(Boolean).join(', ');
    }

    if (cityName && areaNames) {
      location = `${cityName} - ${areaNames}`;
    } else if (cityName) {
      location = cityName;
    } else if (areaNames) {
      location = areaNames;
    }
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

  const uuid = item.user_uuid || item.uuid || item.id || item._id || profile.user_uuid || user.uuid || user.id;

  return {
    id: uuid || `partner-${index}`,
    uuid: uuid || `partner-${index}`,
    name,
    firstName: firstName || '—',
    lastName: lastName || '—',
    roles: roles.length > 0 ? roles : ['Trainer'],
    location: location || '—',
    submitted: formatDate(item.updated_at || item.submitted_at || item.created_date || item.createdAt),
    status,
    raw: item
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
  return list.filter((partner) =>
    (partner.name || '').toLowerCase().includes(query) ||
    (partner.firstName || '').toLowerCase().includes(query) ||
    (partner.lastName || '').toLowerCase().includes(query) ||
    (partner.location || '').toLowerCase().includes(query) ||
    (partner.roles || []).some((role) => role.toLowerCase().includes(query))
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
        const [locationsResponse, response] = await Promise.all([
          getWorkLocations(),
          getPartnerData('all', currentPage, pageSize, searchQuery)
        ]);
        const dynamicLocMap = {};
        const locationData = locationsResponse?.data || locationsResponse || [];
        if (Array.isArray(locationData)) {
          locationData.forEach((location) => {
            if (location?.id != null && location?.main_location) dynamicLocMap[location.id] = location.main_location;
            if (Array.isArray(location?.sub_locations)) {
              location.sub_locations.forEach((area) => {
                if (area?.id != null && area?.sub_location) dynamicLocMap[area.id] = area.sub_location;
              });
            }
          });
        }
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
          const pList = rawPending.map((item, idx)  => formatPartner(item, 'pending',  idx, dynamicLocMap));
          const aList = rawApproved.map((item, idx) => formatPartner(item, 'approved', idx, dynamicLocMap));
          const rList = rawRejected.map((item, idx) => formatPartner(item, 'rejected', idx, dynamicLocMap));

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

        const formatted = flatItems.map((item, idx) => formatPartner(item, item.approval_status || item.status || 'pending', idx, dynamicLocMap));

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

  const visiblePending = useMemo(
    () => filterPartnersByQuery(pendingList, searchQuery),
    [pendingList, searchQuery]
  );
  const visibleApproved = useMemo(
    () => filterPartnersByQuery(approvedList, searchQuery),
    [approvedList, searchQuery]
  );
  const visibleRejected = useMemo(
    () => filterPartnersByQuery(rejectedList, searchQuery),
    [rejectedList, searchQuery]
  );

  const totalEntries = pendingTotal + approvedTotal + rejectedTotal;
  const totalPages   = Math.max(1, Math.ceil(totalEntries / pageSize));
  const startEntry   = totalEntries === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endEntry     = Math.min(currentPage * pageSize, totalEntries);

  const handleAction = (partner, actionType) => {
    navigate(`/partner/details/${partner.id}?mode=${actionType}`, {
      state: { partner, mode: actionType }
    });
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
