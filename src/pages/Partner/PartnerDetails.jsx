import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FiArrowLeft, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import DashboardNavbar from '../../components/Dashboard/DashboardNavbar';
import { getPartnerProfileDetails, getWorkLocations } from '../../services/auth';
import './partnerDetails.css';

// Default static fallback map for location IDs in UAE
const STATIC_LOCATION_MAP = {
  // Cities
  128: 'Northern Emirates',
  129: 'Northern Emirates',
  130: 'Dubai',
  131: 'Abu Dhabi',
  132: 'Sharjah',
  133: 'Ras Al Khaimah',
  134: 'Ajman',
  135: 'Fujairah',
  136: 'Umm Al Quwain',
  // Areas
  172: 'Araibi',
  173: 'Dhait',
  174: 'Sheikh Khalifa city',
  190: 'Ghurfah',
  187: 'Al riffa',
  198: 'Al Nakheel',
  175: 'Flag park',
  176: 'Zorah',
  177: 'Muweilah',
  178: 'Zahia',
  179: 'Industrial area 15',
  180: 'Industrial area 17',
  181: 'Al Jada',
  182: 'Deerfields mall area',
  183: 'Al Shahamah new',
  184: 'Al Bahyah new',
  185: 'Al Shahamah old'
};

// All role chip options matching screenshot
const ALL_ROLES = [
  'Strength & Conditioning Coach',
  'Physiotherapist',
  'Nutritionist',
  'Recovery & Contrast Therapy (sauna / ice / cryo)',
  'Mindset Coach',
  'Clinic',
  'Meal Plan Provider',
  'Gym',
  'Pilates / Reformer Studio',
  'Breathwork & Meditation Coach',
  'Body Composition & Performance Testing (DEXA / VO2)',
  'Massage & Bodywork Therapist',
  'Something else'
];

// Price options
const PRICE_TIERS = [
  'AED 300-500',
  'AED 500-750',
  'AED 750-1000',
  'AED 1000+',
  'Custom'
];

// Standard What you offer options and mapping aliases (handles snake_case, numeric IDs, variations)
const OFFER_OPTIONS = [
  '1-on-1 training',
  'Group training',
  'Postural/mobility',
  'Prehab/rehab',
  'Weight loss',
  'Muscle building',
  'Pre/post-natal',
  'Endurance',
  'Injury recovery',
  'Nutrition planning',
  'Breathwork',
  'Sports performance'
];

const OFFER_ALIAS_MAP = {
  '1': '1-on-1 training',
  '2': 'Group training',
  '3': 'Postural/mobility',
  '4': 'Prehab/rehab',
  '5': 'Weight loss',
  '6': 'Muscle building',
  '7': 'Pre/post-natal',
  '8': 'Endurance',
  '9': 'Injury recovery',
  '10': 'Nutrition planning',
  '11': 'Breathwork',
  '12': 'Sports performance',
  'one_on_one_training': '1-on-1 training',
  '1_on_1_training': '1-on-1 training',
  '1on1': '1-on-1 training',
  'personal_training': '1-on-1 training',
  'group_training': 'Group training',
  'postural_mobility': 'Postural/mobility',
  'postural': 'Postural/mobility',
  'mobility': 'Postural/mobility',
  'prehab_rehab': 'Prehab/rehab',
  'rehab': 'Prehab/rehab',
  'weight_loss': 'Weight loss',
  'muscle_building': 'Muscle building',
  'hypertrophy': 'Muscle building',
  'pre_post_natal': 'Pre/post-natal',
  'post_natal': 'Pre/post-natal',
  'natal': 'Pre/post-natal',
  'endurance': 'Endurance',
  'injury_recovery': 'Injury recovery',
  'injury': 'Injury recovery',
  'recovery': 'Injury recovery',
  'nutrition_planning': 'Nutrition planning',
  'nutrition': 'Nutrition planning',
  'breathwork': 'Breathwork',
  'sports_performance': 'Sports performance',
  'athletic_performance': 'Sports performance'
};

// Service mode options
const SERVICE_MODES = [
  'Online / Remote',
  'Home Visits'
];

// Availability days
const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

export default function PartnerDetails() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Mode derived from URL search param or location state
  const searchParams = new URLSearchParams(location.search);
  const modeParam = searchParams.get('mode') || location.state?.mode || 'review';

  // Determine initial status based on mode: review -> pending, manage -> approved, reopen -> rejected
  const initialStatusFromMode = () => {
    if (modeParam === 'manage') return 'approved';
    if (modeParam === 'reopen') return 'rejected';
    return 'pending';
  };

  const [loading, setLoading] = useState(true);
  const [partnerStatus, setPartnerStatus] = useState(initialStatusFromMode());
  const [rejectionNote, setRejectionNote] = useState('');
  const [documents, setDocuments] = useState([]);

  // Form states - initialize clean without hardcoded fake selections
  const [businessName, setBusinessName] = useState(location.state?.partner?.name || '');
  const [contactName, setContactName] = useState('');
  const [selectedRoles, setSelectedRoles] = useState([]);
  
  // Work location
  const [primaryCity, setPrimaryCity] = useState('');
  const [selectedAreas, setSelectedAreas] = useState([]);

  // Personal info
  const [firstName, setFirstName] = useState(location.state?.partner?.firstName !== '—' ? (location.state?.partner?.firstName || '') : '');
  const [lastName, setLastName] = useState(location.state?.partner?.lastName !== '—' ? (location.state?.partner?.lastName || '') : '');
  const [phoneCountryCode, setPhoneCountryCode] = useState('+971');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isWhatsappSame, setIsWhatsappSame] = useState(true);
  const [websiteInstagram, setWebsiteInstagram] = useState('');

  // Service details
  const [selectedPrice, setSelectedPrice] = useState('');
  const [selectedOffers, setSelectedOffers] = useState([]);
  const [selectedServiceModes, setSelectedServiceModes] = useState([]);
  const [selectedDays, setSelectedDays] = useState([]);
  const [shortBio, setShortBio] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [authUuid, setAuthUuid] = useState(id || '2f6b63a5-86ef-4092-a2e2-ebbd398ba2e0');
  const [currentType, setCurrentType] = useState('Clinic');

  // Load API partner data
  useEffect(() => {
    let cancelled = false;

    const populateFieldsFromObject = (dataObj, dynamicLocMap = {}) => {
      if (!dataObj) return;
      const profile = dataObj.profile || dataObj.user_profile || dataObj.partner_profile || dataObj.raw || dataObj;
      const user = dataObj.user || profile.user || {};
      const partnerData = dataObj.partner || dataObj.data || profile;

      // Status
      const rawStatus = (
        dataObj.approval_status ||
        profile.approval_status ||
        partnerData.approval_status ||
        dataObj.status ||
        profile.status ||
        partnerData.status ||
        ''
      ).toLowerCase();

      if (rawStatus.includes('appr') || rawStatus === 'active') {
        setPartnerStatus('approved');
      } else if (rawStatus.includes('reject') || rawStatus.includes('declin')) {
        setPartnerStatus('rejected');
      } else if (rawStatus.includes('pend')) {
        setPartnerStatus('pending');
      }

      // Names
      const fName = profile.first_name || profile.firstName || user.first_name || dataObj.first_name || '';
      const lName = profile.last_name || profile.lastName || user.last_name || dataObj.last_name || '';
      if (fName) setFirstName(fName);
      if (lName) setLastName(lName);

      const bName =
        profile.business_name ||
        partnerData.business_name ||
        dataObj.business_name ||
        profile.name ||
        partnerData.name ||
        dataObj.name ||
        '';
      setBusinessName(bName || (fName ? `${fName} ${lName}`.trim() : 'Partner'));

      const cName =
        profile.contact_name ||
        profile.primary_contact_name ||
        partnerData.contact_name ||
        dataObj.contact_name ||
        (fName ? `${fName} ${lName}`.trim() : '');
      if (cName) setContactName(cName);

      // Email & Phone
      const userEmail = user.email || profile.email || partnerData.email || dataObj.email || '';
      if (userEmail) setEmail(userEmail);

      const userPhone = profile.phone || user.phone || partnerData.phone || dataObj.phone || '';
      if (userPhone) setPhone(userPhone);

      const code = profile.country_code || user.country_code || partnerData.country_code || dataObj.country_code || '';
      if (code) setPhoneCountryCode(code);

      // Roles mapping - handle string arrays, object arrays, or comma-separated strings
      let rawRoles =
        profile.roles ||
        partnerData.roles ||
        dataObj.roles ||
        (profile.role ? [profile.role] : []) ||
        (partnerData.role ? [partnerData.role] : []) ||
        (dataObj.roles_list ? dataObj.roles_list : []);

      if (typeof rawRoles === 'string') {
        rawRoles = rawRoles.split(',').map((s) => s.trim()).filter(Boolean);
      }

      if (Array.isArray(rawRoles) && rawRoles.length > 0) {
        const extractedRoleNames = rawRoles
          .map((r) => (typeof r === 'object' ? r.name || r.title || r.role || r.label : r))
          .filter(Boolean);

        // Normalize against ALL_ROLES
        const matchedRoles = [];
        extractedRoleNames.forEach((apiRole) => {
          const cleanApiRole = String(apiRole).toLowerCase().trim();
          const found = ALL_ROLES.find(
            (standardRole) =>
              standardRole.toLowerCase() === cleanApiRole ||
              standardRole.toLowerCase().includes(cleanApiRole) ||
              cleanApiRole.includes(standardRole.toLowerCase().split(' ')[0])
          );
          if (found && !matchedRoles.includes(found)) {
            matchedRoles.push(found);
          } else if (!matchedRoles.includes(apiRole)) {
            matchedRoles.push(apiRole);
          }
        });

        if (matchedRoles.length > 0) {
          setSelectedRoles(matchedRoles);
        }
      }

      // Location / Areas
      const locMap = { ...STATIC_LOCATION_MAP, ...dynamicLocMap };

      const rawLocExec =
        profile.location_of_execution ||
        partnerData.location_of_execution ||
        dataObj.location_of_execution;

      if (rawLocExec) {
        if (typeof rawLocExec === 'string') {
          if (rawLocExec.includes(' - ')) {
            const [c, rest] = rawLocExec.split(' - ');
            if (c) setPrimaryCity(locMap[Number(c)] || c.trim());
            if (rest) {
              const areas = rest
                .split(',')
                .map((a) => {
                  const num = Number(a.trim());
                  return locMap[num] || a.trim();
                })
                .filter(Boolean);
              if (areas.length > 0) setSelectedAreas(areas);
            }
          } else {
            const num = Number(rawLocExec.trim());
            setPrimaryCity(locMap[num] || rawLocExec);
          }
        } else if (typeof rawLocExec === 'object') {
          if (rawLocExec.city || rawLocExec.name) {
            setPrimaryCity(rawLocExec.city || rawLocExec.name);
          }
        }
      } else if (profile.primary_location || partnerData.primary_location || dataObj.primary_location) {
        const primId = profile.primary_location || partnerData.primary_location || dataObj.primary_location;
        const num = Number(primId);
        if (locMap[num]) setPrimaryCity(locMap[num]);
      } else if (profile.primary_city || profile.city || partnerData.city) {
        const cVal = profile.primary_city || profile.city || partnerData.city;
        const num = Number(cVal);
        setPrimaryCity(locMap[num] || cVal);
      }

      let areaList =
        profile.areas_served ||
        partnerData.areas_served ||
        dataObj.areas_served ||
        profile.service_locations ||
        partnerData.service_locations ||
        profile.locations ||
        partnerData.locations ||
        [];

      if (typeof areaList === 'string') {
        if ((areaList.startsWith('[') && areaList.endsWith(']')) || (areaList.startsWith('{') && areaList.endsWith('}'))) {
          try {
            areaList = JSON.parse(areaList);
          } catch (_) {
            areaList = areaList.split(',').map((s) => s.trim()).filter(Boolean);
          }
        } else {
          areaList = areaList.split(',').map((s) => s.trim()).filter(Boolean);
        }
      }

      if (Array.isArray(areaList) && areaList.length > 0) {
        const areas = areaList
          .map((a) => {
            if (typeof a === 'number' || (!isNaN(Number(a)) && typeof a === 'string' && a.trim() !== '')) {
              const num = Number(a);
              return locMap[num] || `Area ${num}`;
            }
            if (typeof a === 'object') {
              return a.name || a.city || a.area || a.address;
            }
            return a;
          })
          .filter(Boolean);
        if (areas.length > 0) setSelectedAreas(areas);
      } else if (profile.area_served || partnerData.area_served) {
        const singleArea = profile.area_served || partnerData.area_served;
        const num = Number(singleArea);
        setSelectedAreas([locMap[num] || singleArea]);
      }

      // Price per session
      const priceVal =
        profile.price_per_session ||
        partnerData.price_per_session ||
        profile.price_tier ||
        partnerData.price_tier ||
        profile.pricing_tier ||
        partnerData.pricing_tier ||
        profile.pricing_tiers ||
        partnerData.pricing_tiers ||
        dataObj.price_per_session ||
        dataObj.price_tier ||
        dataObj.pricing_tier ||
        dataObj.pricing_tiers;

      if (priceVal !== undefined && priceVal !== null && priceVal !== '') {
        const strPrice = typeof priceVal === 'object' ? (priceVal.name || priceVal.title || priceVal.tier || priceVal.label || String(priceVal)) : String(priceVal).trim();
        
        // Clean price string for matching (e.g. "300-500", "AED 300-500", "1000+", "1000")
        const matched = PRICE_TIERS.find((p) => {
          const cleanP = p.toLowerCase().replace(/[^a-z0-9+]/g, '');
          const cleanVal = strPrice.toLowerCase().replace(/[^a-z0-9+]/g, '');
          return cleanP === cleanVal || cleanP.includes(cleanVal) || cleanVal.includes(cleanP);
        });

        if (matched) {
          setSelectedPrice(matched);
        } else if (strPrice) {
          // If custom price e.g. "AED 400" or custom number
          setSelectedPrice(strPrice.startsWith('AED') ? strPrice : `AED ${strPrice}`);
        }
      }

      // What you offer
      let rawOffers =
        profile.what_you_offer ||
        partnerData.what_you_offer ||
        dataObj.what_you_offer ||
        profile.what_we_offer ||
        partnerData.what_we_offer ||
        dataObj.what_we_offer ||
        profile.offers ||
        partnerData.offers ||
        dataObj.offers ||
        profile.services ||
        partnerData.services ||
        dataObj.services ||
        profile.offerings ||
        partnerData.offerings ||
        dataObj.offerings ||
        [];

      if (typeof rawOffers === 'string') {
        const trimmed = rawOffers.trim();
        if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
          try {
            rawOffers = JSON.parse(trimmed);
          } catch (_) {
            rawOffers = trimmed.split(',').map((s) => s.trim()).filter(Boolean);
          }
        } else {
          rawOffers = trimmed.split(',').map((s) => s.trim()).filter(Boolean);
        }
      }

      if (Array.isArray(rawOffers) && rawOffers.length > 0) {
        const extracted = rawOffers
          .map((o) => (typeof o === 'object' ? o.name || o.title || o.offer || o.label || o.service || o.id : o))
          .filter(Boolean);

        const matchedOffers = [];
        extracted.forEach((apiOffer) => {
          const str = String(apiOffer).trim();
          const cleanSnake = str.toLowerCase().replace(/[\s-]+/g, '_');
          const cleanAlnum = str.toLowerCase().replace(/[^a-z0-9]/g, '');

          // 1. Direct match in OFFER_ALIAS_MAP
          if (OFFER_ALIAS_MAP[str]) {
            if (!matchedOffers.includes(OFFER_ALIAS_MAP[str])) matchedOffers.push(OFFER_ALIAS_MAP[str]);
            return;
          }
          if (OFFER_ALIAS_MAP[cleanSnake]) {
            if (!matchedOffers.includes(OFFER_ALIAS_MAP[cleanSnake])) matchedOffers.push(OFFER_ALIAS_MAP[cleanSnake]);
            return;
          }
          if (OFFER_ALIAS_MAP[cleanAlnum]) {
            if (!matchedOffers.includes(OFFER_ALIAS_MAP[cleanAlnum])) matchedOffers.push(OFFER_ALIAS_MAP[cleanAlnum]);
            return;
          }

          // 2. Match against OFFER_OPTIONS
          const found = OFFER_OPTIONS.find((std) => {
            const cleanStd = std.toLowerCase().replace(/[^a-z0-9]/g, '');
            return cleanStd === cleanAlnum || cleanStd.includes(cleanAlnum) || cleanAlnum.includes(cleanStd);
          });

          if (found && !matchedOffers.includes(found)) {
            matchedOffers.push(found);
          } else if (!matchedOffers.includes(str)) {
            matchedOffers.push(str);
          }
        });

        if (matchedOffers.length > 0) {
          setSelectedOffers(matchedOffers);
        }
      }

      // Service mode (e.g. "online_home_visits", "online, home_visits", ["Online / Remote"])
      let rawModes =
        profile.service_mode ||
        partnerData.service_mode ||
        dataObj.service_mode ||
        profile.service_modes ||
        partnerData.service_modes ||
        dataObj.service_modes ||
        profile.modes ||
        dataObj.modes ||
        [];

      if (typeof rawModes === 'string') {
        if ((rawModes.startsWith('[') && rawModes.endsWith(']')) || (rawModes.startsWith('{') && rawModes.endsWith('}'))) {
          try {
            rawModes = JSON.parse(rawModes);
          } catch (_) {
            rawModes = rawModes.split(',').map((s) => s.trim()).filter(Boolean);
          }
        } else if (rawModes.includes('_') && !rawModes.includes(',')) {
          // E.g. "online_home_visits"
          const parts = [];
          if (rawModes.toLowerCase().includes('online')) parts.push('Online / Remote');
          if (rawModes.toLowerCase().includes('home') || rawModes.toLowerCase().includes('visit')) parts.push('Home Visits');
          rawModes = parts;
        } else {
          rawModes = rawModes.split(',').map((s) => s.trim()).filter(Boolean);
        }
      }

      if (Array.isArray(rawModes) && rawModes.length > 0) {
        const extracted = rawModes
          .map((m) => (typeof m === 'object' ? m.name || m.title || m.mode : m))
          .filter(Boolean);

        const matchedModes = [];
        extracted.forEach((apiMode) => {
          const clean = String(apiMode).toLowerCase().trim();
          if (clean.includes('online') || clean.includes('remote')) {
            if (!matchedModes.includes('Online / Remote')) matchedModes.push('Online / Remote');
          } else if (clean.includes('home') || clean.includes('visit')) {
            if (!matchedModes.includes('Home Visits')) matchedModes.push('Home Visits');
          } else {
            const found = SERVICE_MODES.find(s => s.toLowerCase() === clean);
            if (found && !matchedModes.includes(found)) matchedModes.push(found);
            else if (!matchedModes.includes(apiMode)) matchedModes.push(apiMode);
          }
        });

        if (matchedModes.length > 0) {
          setSelectedServiceModes(matchedModes);
        }
      }

      // Availability days (e.g. ["Monday", "Tuesday", ...])
      let rawDays =
        profile.available_days ||
        partnerData.available_days ||
        dataObj.available_days ||
        profile.availability_days ||
        partnerData.availability_days ||
        dataObj.availability_days ||
        profile.availability ||
        partnerData.availability ||
        dataObj.availability ||
        profile.days ||
        dataObj.days ||
        [];

      if (typeof rawDays === 'string') {
        if ((rawDays.startsWith('[') && rawDays.endsWith(']')) || (rawDays.startsWith('{') && rawDays.endsWith('}'))) {
          try {
            rawDays = JSON.parse(rawDays);
          } catch (_) {
            rawDays = rawDays.split(',').map((s) => s.trim()).filter(Boolean);
          }
        } else {
          rawDays = rawDays.split(',').map((s) => s.trim()).filter(Boolean);
        }
      }

      if (Array.isArray(rawDays) && rawDays.length > 0) {
        const extracted = rawDays
          .map((d) => (typeof d === 'object' ? d.name || d.day || d.title : d))
          .filter(Boolean);

        const matchedDays = [];
        extracted.forEach((apiDay) => {
          const clean = String(apiDay).toLowerCase().trim();
          const found = DAYS_OF_WEEK.find(
            (std) => std.toLowerCase() === clean || std.toLowerCase().startsWith(clean.slice(0, 3))
          );
          if (found && !matchedDays.includes(found)) {
            matchedDays.push(found);
          } else if (!matchedDays.includes(apiDay)) {
            matchedDays.push(apiDay);
          }
        });

        if (matchedDays.length > 0) {
          setSelectedDays(matchedDays);
        }
      }

      // Bio & Notes
      const bioVal =
        profile.bio ||
        profile.short_bio ||
        partnerData.short_bio ||
        dataObj.short_bio ||
        dataObj.bio;
      if (bioVal) setShortBio(bioVal);

      const notesVal =
        profile.internal_notes ||
        dataObj.internal_notes ||
        partnerData.internal_notes ||
        profile.admin_review_notes ||
        dataObj.admin_review_notes ||
        partnerData.admin_review_notes ||
        profile.notes ||
        dataObj.notes;
      if (notesVal) setInternalNotes(notesVal);

      // Documents
      if (Array.isArray(profile.documents)) {
        setDocuments(profile.documents);
      } else if (Array.isArray(dataObj.documents)) {
        setDocuments(dataObj.documents);
      }

      // Auth UUID & Type
      const uUuid =
        dataObj.user_uuid ||
        profile.user_uuid ||
        user.uuid ||
        user.id ||
        dataObj.uuid ||
        id;
      if (uUuid) setAuthUuid(uUuid);

      if (profile.partner_type || partnerData.partner_type) {
        setCurrentType(profile.partner_type || partnerData.partner_type);
      }
    };

    // 2. Fetch fresh details and work locations from API
    const fetchDetails = async () => {
      let dynamicLocMap = {};
      try {
        const locRes = await getWorkLocations();
        const locData = locRes?.data || locRes || [];
        if (Array.isArray(locData)) {
          locData.forEach((l) => {
            if (l.id && l.name) dynamicLocMap[l.id] = l.name;
            if (Array.isArray(l.areas)) {
              l.areas.forEach((a) => {
                if (a.id && a.name) dynamicLocMap[a.id] = a.name;
              });
            }
          });
        }
      } catch (_) {}

      // Re-run population with dynamicLocMap if router state was present
      if (location.state?.partner && !cancelled) {
        populateFieldsFromObject(location.state.partner, dynamicLocMap);
        if (location.state.partner.raw) {
          populateFieldsFromObject(location.state.partner.raw, dynamicLocMap);
        }
      }

      if (!id || id.startsWith('partner-')) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await getPartnerProfileDetails(id);
        const data = res?.data || res || {};

        if (!cancelled) {
          populateFieldsFromObject(data, dynamicLocMap);
        }
      } catch (err) {
        console.warn('[PartnerDetails] API fetch failed:', err?.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchDetails();
    return () => {
      cancelled = true;
    };
  }, [id, location.state]);

  // Toggle roles
  const toggleRole = (role) => {
    setSelectedRoles(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  // Toggle What you offer
  const toggleOffer = (offer) => {
    setSelectedOffers(prev => 
      prev.includes(offer) ? prev.filter(o => o !== offer) : [...prev, offer]
    );
  };

  // Toggle Service Mode
  const toggleServiceMode = (mode) => {
    setSelectedServiceModes(prev => 
      prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode]
    );
  };

  // Toggle Availability Days
  const toggleDay = (day) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  // Remove area tag
  const removeAreaTag = (area) => {
    setSelectedAreas(prev => prev.filter(a => a !== area));
  };

  // Action decision handlers
  const handleApprove = () => {
    setPartnerStatus('approved');
    toast.success('Partner application approved successfully');
  };

  const handleReject = () => {
    setPartnerStatus('rejected');
    toast.info('Partner application marked as rejected');
  };

  const handleResetPending = () => {
    setPartnerStatus('pending');
    toast.info('Partner application reset to pending');
  };

  const handleSaveChanges = () => {
    toast.success('Partner details saved successfully');
  };

  // Badge text and class
  const getBadgeInfo = () => {
    if (partnerStatus === 'approved') return { label: 'APPROVED', className: 'badge-approved' };
    if (partnerStatus === 'rejected') return { label: 'REJECTED', className: 'badge-rejected' };
    return { label: 'PENDING', className: 'badge-pending' };
  };

  const badgeInfo = getBadgeInfo();
  const displayName = businessName || `${firstName} ${lastName}`.trim() || 'Partner Profile';

  const isReviewMode = modeParam === 'review';
  const isManageMode = modeParam === 'manage';
  const isReopenMode = modeParam === 'reopen';

  const disableApprove = isManageMode;
  const disableReject = isReopenMode;
  const disableResetPending = isReviewMode;

  return (
    <div className="vy-partner-details-page">
      <DashboardNavbar activePage="Partner" />

      <main className="vy-details-main">
        {loading ? (
          <div className="vy-details-loading">Loading partner profile details...</div>
        ) : (
          <>
            {/* Top Header */}
            <div className="vy-details-top-header">
              <button className="vy-back-btn" onClick={() => navigate('/partner')}>
                <FiArrowLeft size={14} /> <span>Partners</span>
              </button>
              
              <div className="vy-partner-title-row">
                <span className={`vy-details-badge ${badgeInfo.className}`}>
                  {badgeInfo.label}
                </span>
                <h1 className="vy-partner-name-heading">{displayName}</h1>
              </div>
            </div>

        {/* 1. APPLICATION DECISION CARD */}
        <section className="vy-details-card">
          <div className="vy-card-subheading">REVIEW</div>
          <h2 className="vy-card-title">Application decision</h2>

          <textarea
            className="vy-decision-textarea"
            placeholder="Optional note to the partner (shown on rejection)..."
            value={rejectionNote}
            onChange={(e) => setRejectionNote(e.target.value)}
          />

          <div className="vy-decision-actions">
            <button
              className="btn-approve"
              onClick={handleApprove}
              disabled={disableApprove}
              title={disableApprove ? 'Approve is disabled in manage mode' : ''}
            >
              Approve
            </button>
            <button
              className="btn-reject"
              onClick={handleReject}
              disabled={disableReject}
              title={disableReject ? 'Reject is disabled in reopen mode' : ''}
            >
              Reject
            </button>
            <button
              className="btn-reset-pending"
              onClick={handleResetPending}
              disabled={disableResetPending}
              title={disableResetPending ? 'Reset to pending is disabled in review mode' : ''}
            >
              Reset to pending
            </button>
          </div>
        </section>

        {/* 2. CREDENTIALS / UPLOADED DOCUMENTS */}
        <section className="vy-details-card">
          <div className="vy-card-header-flex">
            <div>
              <div className="vy-card-subheading">CREDENTIALS</div>
              <h2 className="vy-card-title">Uploaded documents</h2>
            </div>
            <button className="btn-upload-doc" onClick={() => toast.info('Upload document dialog')}>
              + Upload Document
            </button>
          </div>

          {documents.length === 0 ? (
            <p className="vy-empty-documents">No documents uploaded.</p>
          ) : (
            <div className="vy-documents-list">
              {documents.map((doc, idx) => (
                <div key={idx} className="vy-document-item">
                  <span>{doc.name || `Document ${idx + 1}`}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 3. PROFILE DETAILS FORM */}
        <section className="vy-details-card">
          <div className="vy-card-subheading">PROFILE</div>
          <h2 className="vy-card-title">Details</h2>

          {/* Business Name & Contact Name */}
          <div className="vy-form-grid-2">
            <div className="vy-form-group">
              <label className="vy-form-label">
                Business / Individual name <span className="required-star">*</span>
              </label>
              <input
                type="text"
                className="vy-form-input"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Business name"
              />
            </div>
            <div className="vy-form-group">
              <label className="vy-form-label">Contact name</label>
              <input
                type="text"
                className="vy-form-input"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Contact name"
              />
            </div>
          </div>

          {/* YOUR ROLE */}
          <div className="vy-chips-section">
            <div className="vy-chips-header-row">
              <span className="vy-chips-section-title">
                YOUR ROLE <span className="required-star">*</span>
              </span>
              <span className="vy-selected-badge">{selectedRoles.length} selected</span>
            </div>
            <div className="vy-chips-grid">
              {ALL_ROLES.map((role) => {
                const isActive = selectedRoles.includes(role);
                return (
                  <button
                    key={role}
                    type="button"
                    className={`vy-chip-btn ${isActive ? 'active' : ''}`}
                    onClick={() => toggleRole(role)}
                  >
                    {role}
                  </button>
                );
              })}
            </div>
          </div>

          {/* WHERE YOU WORK (PRIMARY CITY & AREA SERVED) */}
          <div className="vy-location-cascade-box">
            <div className="vy-chips-header-row">
              <span className="vy-chips-section-title">
                WHERE YOU WORK (PRIMARY CITY &amp; AREA SERVED)
              </span>
              <span className="vy-location-header-tag">Cascading Selection</span>
            </div>

            <div className="vy-form-grid-2">
              <div className="vy-form-group">
                <label className="vy-form-label">PRIMARY CITY</label>
                <select
                  className="vy-form-input"
                  value={primaryCity}
                  onChange={(e) => setPrimaryCity(e.target.value)}
                >
                  <option value="Northern Emirates">Northern Emirates</option>
                  <option value="Dubai">Dubai</option>
                  <option value="Abu Dhabi">Abu Dhabi</option>
                  <option value="Sharjah">Sharjah</option>
                </select>
              </div>

              <div className="vy-form-group">
                <label className="vy-form-label">AREA SERVED</label>
                <select
                  className="vy-form-input"
                  value=""
                  onChange={(e) => {
                    if (e.target.value && !selectedAreas.includes(e.target.value)) {
                      setSelectedAreas([...selectedAreas, e.target.value]);
                    }
                  }}
                >
                  <option value="">{selectedAreas.length} Areas Selected ({selectedAreas.join(', ')})</option>
                  <option value="Flag park">Flag park</option>
                  <option value="Zorah">Zorah</option>
                  <option value="Downtown">Downtown</option>
                  <option value="Marina">Marina</option>
                </select>
              </div>
            </div>

            {/* Selected Area Tags */}
            <div className="vy-selected-tags-row">
              {selectedAreas.map((area) => (
                <div key={area} className="vy-location-tag">
                  <span>{area}</span>
                  <button
                    type="button"
                    className="tag-remove-btn"
                    onClick={() => removeAreaTag(area)}
                  >
                    <FiX size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* First Name & Last Name */}
          <div className="vy-form-grid-2">
            <div className="vy-form-group">
              <label className="vy-form-label">
                First Name <span className="required-star">*</span>
              </label>
              <input
                type="text"
                className="vy-form-input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="vy-form-group">
              <label className="vy-form-label">
                Last Name <span className="required-star">*</span>
              </label>
              <input
                type="text"
                className="vy-form-input"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          {/* Phone & Email */}
          <div className="vy-form-grid-2">
            <div className="vy-form-group">
              <label className="vy-form-label">
                Phone / WhatsApp <span className="required-star">*</span>
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  style={{ width: '90px' }}
                  className="vy-form-input"
                  value={phoneCountryCode}
                  onChange={(e) => setPhoneCountryCode(e.target.value)}
                />
                <input
                  type="text"
                  style={{ flex: 1 }}
                  className="vy-form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
            <div className="vy-form-group">
              <label className="vy-form-label">Email (Cannot be changed)</label>
              <input
                type="email"
                className="vy-form-input"
                value={email || 'seeyou@yopmail.com'}
                disabled
              />
            </div>
          </div>

          {/* How We Reach You Checkbox */}
          <label className="vy-checkbox-row">
            <input
              type="checkbox"
              checked={isWhatsappSame}
              onChange={(e) => setIsWhatsappSame(e.target.checked)}
            />
            <span>WhatsApp is the same number as Phone</span>
          </label>

          {/* Website / Instagram */}
          <div className="vy-form-group" style={{ marginBottom: '28px' }}>
            <label className="vy-form-label">Website / Instagram (optional)</label>
            <input
              type="text"
              className="vy-form-input"
              placeholder="Website / Instagram (optional)"
              value={websiteInstagram}
              onChange={(e) => setWebsiteInstagram(e.target.value)}
            />
          </div>

          {/* PRICE PER SESSION */}
          <div className="vy-chips-section">
            <div className="vy-chips-header-row">
              <span className="vy-chips-section-title">
                PRICE PER SESSION (AED, COST TO VYONIC)
              </span>
            </div>
            <div className="vy-price-chips-row">
              {PRICE_TIERS.map((tier) => (
                <button
                  key={tier}
                  type="button"
                  className={`vy-price-chip ${selectedPrice === tier ? 'active' : ''}`}
                  onClick={() => setSelectedPrice(tier)}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>

          {/* WHAT YOU OFFER */}
          <div className="vy-chips-section">
            <div className="vy-chips-header-row">
              <span className="vy-chips-section-title">WHAT YOU OFFER</span>
              <span className="vy-selected-badge">{selectedOffers.length} selected</span>
            </div>
            <div className="vy-chips-grid">
              {OFFER_OPTIONS.map((offer) => {
                const isActive = selectedOffers.includes(offer);
                return (
                  <button
                    key={offer}
                    type="button"
                    className={`vy-chip-btn ${isActive ? 'active' : ''}`}
                    onClick={() => toggleOffer(offer)}
                  >
                    {offer}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SERVICE MODE */}
          <div className="vy-chips-section">
            <div className="vy-chips-header-row">
              <span className="vy-chips-section-title">SERVICE MODE</span>
              <span className="vy-selected-badge">{selectedServiceModes.length} selected</span>
            </div>
            <div className="vy-chips-grid">
              {SERVICE_MODES.map((mode) => {
                const isActive = selectedServiceModes.includes(mode);
                return (
                  <button
                    key={mode}
                    type="button"
                    className={`vy-chip-btn ${isActive ? 'active' : ''}`}
                    onClick={() => toggleServiceMode(mode)}
                  >
                    {mode}
                  </button>
                );
              })}
            </div>
          </div>

          {/* WHEN YOU'RE AROUND (AVAILABILITY DAYS) */}
          <div className="vy-chips-section">
            <div className="vy-chips-header-row">
              <span className="vy-chips-section-title">
                WHEN YOU'RE AROUND (AVAILABILITY DAYS)
              </span>
            </div>
            <div className="vy-price-chips-row">
              {DAYS_OF_WEEK.map((day) => {
                const isActive = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    className={`vy-price-chip ${isActive ? 'active' : ''}`}
                    onClick={() => toggleDay(day)}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Short Bio */}
          <div className="vy-form-group" style={{ marginBottom: '20px' }}>
            <label className="vy-form-label">Short bio</label>
            <textarea
              className="vy-decision-textarea"
              style={{ minHeight: '80px', marginBottom: 0 }}
              value={shortBio}
              onChange={(e) => setShortBio(e.target.value)}
            />
          </div>

          {/* Internal notes (admin only) */}
          <div className="vy-form-group" style={{ marginBottom: '24px' }}>
            <label className="vy-form-label">Internal notes (admin only)</label>
            <textarea
              className="vy-decision-textarea"
              placeholder="Write notes visible only to admins..."
              style={{ minHeight: '80px', marginBottom: 0 }}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
            />
          </div>

          {/* Form Actions */}
          <div className="vy-form-actions-footer">
            <button
              type="button"
              className="btn-close-form"
              onClick={() => navigate('/partner')}
            >
              Close
            </button>
            <button
              type="button"
              className="btn-save-changes"
              onClick={handleSaveChanges}
            >
              Save changes
            </button>
          </div>
        </section>

        {/* 4. PARTNER LOGIN / PORTAL ACCESS */}
        <section className="vy-details-card">
          <div className="vy-card-subheading">PARTNER LOGIN</div>
          <h2 className="vy-card-title">Portal access</h2>

          <div className="vy-portal-access-box">
            <div className="vy-portal-auth-info">
              <span className="vy-portal-auth-title">Linked to auth account</span>
              <span className="vy-portal-auth-uuid">{authUuid}</span>
            </div>
            <button
              type="button"
              className="btn-unlink"
              onClick={() => toast.info('Unlink clicked')}
            >
              Unlink
            </button>
          </div>

          <p className="vy-current-type-label">Current type: {currentType}</p>
        </section>
          </>
        )}
      </main>
    </div>
  );
}
