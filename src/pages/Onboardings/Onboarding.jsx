import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './Onboarding.css';
import VyonicLogo from '../../components/VyonicLogo';
import CountryCodeSelect from '../../components/CountryCodeSelect/CountryCodeSelect';
import { registerClient } from '../../services/auth';

const Onboarding = () => {
  const navigate = useNavigate();
  // We start at 1.1 (Register Client)
  const [activePage, setActivePage] = useState(1.1);
  const [isRegistering, setIsRegistering] = useState(false);

  // Page 1.1 Registration State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    countryCode: '+971',
    phone: '',
    email: '',
    dob: '',
    gender: '',
  });

  const [errors, setErrors] = useState({});

  // Page 2 State (Goals)
  const [selectedGoals, setSelectedGoals] = useState([]);

  // Page 3 State (Measurements)
  const [weightUnit, setWeightUnit] = useState('kg');
  const [weightValue, setWeightValue] = useState(66);
  const [heightUnit, setHeightUnit] = useState('cm');
  const [heightValue, setHeightValue] = useState(166);
  const [activeMeasurement, setActiveMeasurement] = useState('weight');

  // Page 4 State (Training Experience)
  const [yearsExp, setYearsExp] = useState(21);
  const [frequency, setFrequency] = useState('Once a week');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [injuries, setInjuries] = useState('');


  // Scroll Wheel and Ruler Refs
  const wheelRef = useRef(null);
  const isDraggingWheelRef = useRef(false);
  const wheelDragStartRef = useRef({ x: 0, scrollLeft: 0 });
  const hasWheelDraggedRef = useRef(false);
  const suppressWheelClickRef = useRef(false);
  const wheelScrollTimeoutRef = useRef(null);

  // Page 3 Ruler Refs & Constants
  const rulerRef = useRef(null);
  const isDraggingRulerRef = useRef(false);
  const rulerDragStartRef = useRef({ x: 0, scrollLeft: 0 });
  const hasRulerDraggedRef = useRef(false);
  const suppressRulerClickRef = useRef(false);
  const rulerScrollTimeoutRef = useRef(null);

  // Goal options with clean titles and subtitles
  const goalOptions = [
    {
      id: 'longevity',
      title: 'Longevity',
      subtitle: 'Drop your biological age. Slowly.',
      icon: '⌛',
    },
    {
      id: 'strength',
      title: 'Build strength',
      subtitle: 'Lift heavier, look leaner, age slower.',
      icon: '💪',
    },
    {
      id: 'recomposition',
      title: 'Body re-composition',
      subtitle: 'Composition-led, not scale-',
      icon: '🔥',
    },
    {
      id: 'endurance',
      title: 'Elevate endurance',
      subtitle: 'VO2 max, stamina, cardiac output.',
      icon: '🏃‍♂️',
    },
    {
      id: 'balance',
      title: 'Restore balance',
      subtitle: 'Fix sleep, HRV, mobility, pain.',
      icon: '🧘',
    },
    {
      id: 'sport',
      title: 'Sport-specific',
      subtitle: 'Tennis, golf, running, combat...',
      icon: '⚽',
    },
  ];

  const toggleGoal = (title) => {
    if (selectedGoals.includes(title)) {
      setSelectedGoals(selectedGoals.filter((item) => item !== title));
    } else if (selectedGoals.length < 3) {
      setSelectedGoals([...selectedGoals, title]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let sanitizedValue = value;
    if (name === 'firstName' || name === 'lastName') {
      sanitizedValue = value.replace(/[0-9]/g, '');
    } else if (name === 'phone') {
      sanitizedValue = value.replace(/\D/g, '');
    }
    setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const getTodayDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDobFocus = () => {
    if (!formData.dob) {
      setFormData((prev) => ({ ...prev, dob: '2001-01-01' }));
      if (errors.dob) {
        setErrors((prev) => ({ ...prev, dob: '' }));
      }
    }
  };

  const handleDobClick = (e) => {
    if (!formData.dob) {
      setFormData((prev) => ({ ...prev, dob: '2001-01-01' }));
      if (errors.dob) {
        setErrors((prev) => ({ ...prev, dob: '' }));
      }
    }
    if (e.target.showPicker) {
      try {
        e.target.showPicker();
      } catch (err) { }
    }
  };

  const handleCalendarIconClick = (e) => {
    const input = e.currentTarget.parentElement?.querySelector('input');
    if (!formData.dob) {
      setFormData((prev) => ({ ...prev, dob: '2001-01-01' }));
      if (errors.dob) {
        setErrors((prev) => ({ ...prev, dob: '' }));
      }
    }
    if (input) {
      input.focus();
      if (input.showPicker) {
        try {
          input.showPicker();
        } catch (err) { }
      }
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (formData.phone.length < 7) {
      newErrors.phone = 'Enter a valid phone number';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }

    if (!formData.dob.trim()) {
      newErrors.dob = 'Date of birth is required';
    } else if (formData.dob > getTodayDateString()) {
      newErrors.dob = 'Date of birth cannot be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegisterNext = async () => {
    if (validate()) {
      setIsRegistering(true);
      try {
        await registerClient(formData);
        // Move to the next page only if the API call succeeds
        setActivePage(2);
      } catch (error) {
        console.error("Health registration error:", error.message);
        toast.error(error.message || 'Unable to connect to the registration service');
      } finally {
        setIsRegistering(false);
      }
    }
  };

  // Helper to persist completed assessment
  const saveAssessmentRecord = () => {
    try {
      const existing = JSON.parse(localStorage.getItem('vyonic_local_assessments') || '[]');
      const newId = `VA-${Math.floor(10000000 + Math.random() * 90000000).toString(16)}`;
      const now = new Date();
      const formattedDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      
      const newRecord = {
        id: `local-${Date.now()}`,
        assessment_id: `#${newId}`,
        name: `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || 'New Client',
        initials: `${(formData.firstName?.[0] || 'N')}${(formData.lastName?.[0] || 'C')}`.toUpperCase(),
        date: formattedDate,
        time_slot: "2:45 PM - 3:45 PM",
        booking_status: "new",
        location: "INDIA",
        type: "Onboarding",
        appointment_type: "Appointment",
        duration: "60 minutes",
        assessment_goal: selectedGoals.length > 0 ? selectedGoals.join(', ') : 'Restore Balance',
        height: `${heightValue} ${heightUnit}`,
        weight: `${weightValue} ${weightUnit}`,
        previous_training_experience: `${yearsExp} Years`,
        weekly_training_frequency: frequency,
        injury_medical_notes: injuries.trim() || '-',
        email: formData.email || 'client@vyonic.com',
        phone: `${formData.countryCode || '+971'} ${formData.phone || ''}`.trim()
      };

      const updated = [newRecord, ...existing];
      localStorage.setItem('vyonic_local_assessments', JSON.stringify(updated));
    } catch (err) {
      console.error('Error saving local assessment record:', err);
    }
  };


  // Full Weight Ruler Array (30kg to 160kg)
  const fullWeightTicks = Array.from({ length: 131 }, (_, i) => 30 + i);
  // Full Height Ruler Array (100cm to 220cm)
  const fullHeightTicks = Array.from({ length: 121 }, (_, i) => 100 + i);
  // Wheel years array (0 to 100)
  const yearsArray = Array.from({ length: 100 }, (_, i) => i);

  const displayedWeight = weightUnit === 'kg' ? weightValue.toFixed(1) : (weightValue * 2.20462).toFixed(1);
  const displayedHeight = heightUnit === 'cm' ? heightValue : (heightValue / 30.48).toFixed(1);

  const frequencyOptions = [
    'Once a week',
    '2-3 times a week',
    '4-5 times a week',
    '5+ sessions',
  ];

  const STEP_SIZE = 88; // 72px item width + 16px gap

  const handlePointerDown = (e) => {
    if (!wheelRef.current) return;
    isDraggingWheelRef.current = true;
    hasWheelDraggedRef.current = false;
    suppressWheelClickRef.current = false;
    wheelDragStartRef.current = {
      x: e.clientX,
      scrollLeft: wheelRef.current.scrollLeft,
    };
    wheelRef.current.style.cursor = 'grabbing';
  };

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!isDraggingWheelRef.current || !wheelRef.current) return;
      const deltaX = e.clientX - wheelDragStartRef.current.x;
      if (Math.abs(deltaX) > 4) {
        hasWheelDraggedRef.current = true;
        suppressWheelClickRef.current = true;
      }
      if (hasWheelDraggedRef.current) {
        wheelRef.current.scrollLeft = wheelDragStartRef.current.scrollLeft - deltaX;
      }
    };

    const handlePointerUp = () => {
      if (!isDraggingWheelRef.current) return;
      isDraggingWheelRef.current = false;
      if (wheelRef.current) {
        wheelRef.current.style.cursor = 'grab';
      }

      if (wheelRef.current && hasWheelDraggedRef.current) {
        const nextYears = Math.max(
          0,
          Math.min(yearsArray.length - 1, Math.round(wheelRef.current.scrollLeft / STEP_SIZE))
        );
        setYearsExp(nextYears);
        wheelRef.current.scrollTo({
          left: nextYears * STEP_SIZE,
          behavior: 'smooth',
        });
      }

      setTimeout(() => {
        hasWheelDraggedRef.current = false;
        suppressWheelClickRef.current = false;
      }, 50);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [yearsArray.length]);

  const handleWheelScroll = () => {
    if (isDraggingWheelRef.current || !wheelRef.current) return;
    clearTimeout(wheelScrollTimeoutRef.current);
    wheelScrollTimeoutRef.current = setTimeout(() => {
      if (!wheelRef.current) return;
      const index = Math.round(wheelRef.current.scrollLeft / STEP_SIZE);
      if (yearsArray[index] !== undefined && yearsArray[index] !== yearsExp) {
        setYearsExp(yearsArray[index]);
      }
    }, 80);
  };

  const handleWheelEvent = (e) => {
    e.preventDefault();
    if (!wheelRef.current) return;
    const direction = e.deltaY > 0 || e.deltaX > 0 ? 1 : -1;
    const newYears = Math.min(Math.max(yearsExp + direction, 0), yearsArray.length - 1);
    setYearsExp(newYears);
    wheelRef.current.scrollTo({
      left: newYears * STEP_SIZE,
      behavior: 'smooth',
    });
  };

  const handleItemClick = (yr) => {
    if (suppressWheelClickRef.current) return;
    setYearsExp(yr);
    if (wheelRef.current) {
      wheelRef.current.scrollTo({
        left: yr * STEP_SIZE,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    if (activePage === 4 && wheelRef.current && !isDraggingWheelRef.current) {
      wheelRef.current.scrollTo({
        left: yearsExp * STEP_SIZE,
        behavior: 'auto',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage]);

  // Ruler constants
  const RULER_STEP = 30; // 20px tick item width + 10px gap
  const WEIGHT_MIN = 30;
  const WEIGHT_MAX = 160;
  const HEIGHT_MIN = 100;
  const HEIGHT_MAX = 220;

  const handleRulerPointerDown = (e) => {
    if (!rulerRef.current) return;
    isDraggingRulerRef.current = true;
    hasRulerDraggedRef.current = false;
    suppressRulerClickRef.current = false;
    rulerDragStartRef.current = {
      x: e.clientX,
      scrollLeft: rulerRef.current.scrollLeft,
    };
    rulerRef.current.style.cursor = 'grabbing';
  };

  useEffect(() => {
    const handleRulerPointerMove = (e) => {
      if (!isDraggingRulerRef.current || !rulerRef.current) return;
      const deltaX = e.clientX - rulerDragStartRef.current.x;
      if (Math.abs(deltaX) > 4) {
        hasRulerDraggedRef.current = true;
        suppressRulerClickRef.current = true;
      }
      if (hasRulerDraggedRef.current) {
        const newScrollLeft = rulerDragStartRef.current.scrollLeft - deltaX;
        rulerRef.current.scrollLeft = newScrollLeft;

        const minVal = activeMeasurement === 'weight' ? WEIGHT_MIN : HEIGHT_MIN;
        const maxVal = activeMeasurement === 'weight' ? WEIGHT_MAX : HEIGHT_MAX;
        const idx = Math.round(newScrollLeft / RULER_STEP);
        const currentCalculatedVal = Math.max(minVal, Math.min(maxVal, minVal + idx));
        if (activeMeasurement === 'weight') {
          setWeightValue(currentCalculatedVal);
        } else {
          setHeightValue(currentCalculatedVal);
        }
      }
    };

    const handleRulerPointerUp = () => {
      if (!isDraggingRulerRef.current) return;
      isDraggingRulerRef.current = false;
      if (rulerRef.current) {
        rulerRef.current.style.cursor = 'grab';
      }

      if (rulerRef.current && hasRulerDraggedRef.current) {
        const minVal = activeMeasurement === 'weight' ? WEIGHT_MIN : HEIGHT_MIN;
        const maxVal = activeMeasurement === 'weight' ? WEIGHT_MAX : HEIGHT_MAX;
        const idx = Math.round(rulerRef.current.scrollLeft / RULER_STEP);
        const finalVal = Math.max(minVal, Math.min(maxVal, minVal + idx));
        if (activeMeasurement === 'weight') {
          setWeightValue(finalVal);
        } else {
          setHeightValue(finalVal);
        }
        rulerRef.current.scrollTo({
          left: (finalVal - minVal) * RULER_STEP,
          behavior: 'smooth',
        });
      }

      setTimeout(() => {
        hasRulerDraggedRef.current = false;
        suppressRulerClickRef.current = false;
      }, 60);
    };

    window.addEventListener('pointermove', handleRulerPointerMove);
    window.addEventListener('pointerup', handleRulerPointerUp);
    return () => {
      window.removeEventListener('pointermove', handleRulerPointerMove);
      window.removeEventListener('pointerup', handleRulerPointerUp);
    };
  }, [activeMeasurement]);

  // Touch swipe & momentum scroll handler
  const handleRulerScroll = () => {
    if (isDraggingRulerRef.current || !rulerRef.current) return;
    const minVal = activeMeasurement === 'weight' ? WEIGHT_MIN : HEIGHT_MIN;
    const maxVal = activeMeasurement === 'weight' ? WEIGHT_MAX : HEIGHT_MAX;
    const idx = Math.round(rulerRef.current.scrollLeft / RULER_STEP);
    const currentCalculatedVal = Math.max(minVal, Math.min(maxVal, minVal + idx));

    if (activeMeasurement === 'weight') {
      if (currentCalculatedVal !== weightValue) setWeightValue(currentCalculatedVal);
    } else {
      if (currentCalculatedVal !== heightValue) setHeightValue(currentCalculatedVal);
    }

    clearTimeout(rulerScrollTimeoutRef.current);
    rulerScrollTimeoutRef.current = setTimeout(() => {
      if (!rulerRef.current || isDraggingRulerRef.current) return;
      const finalIdx = Math.round(rulerRef.current.scrollLeft / RULER_STEP);
      const finalVal = Math.max(minVal, Math.min(maxVal, minVal + finalIdx));
      rulerRef.current.scrollTo({
        left: (finalVal - minVal) * RULER_STEP,
        behavior: 'smooth',
      });
    }, 100);
  };

  // Mouse wheel listener with preventDefault to prevent parent scroll
  useEffect(() => {
    const el = rulerRef.current;
    if (!el || activePage !== 3) return;

    const handleWheel = (e) => {
      e.preventDefault();
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(delta) < 1) return;
      const direction = delta > 0 ? 1 : -1;
      const minVal = activeMeasurement === 'weight' ? WEIGHT_MIN : HEIGHT_MIN;
      const maxVal = activeMeasurement === 'weight' ? WEIGHT_MAX : HEIGHT_MAX;
      const currentVal = activeMeasurement === 'weight' ? weightValue : heightValue;
      const nextVal = Math.min(Math.max(currentVal + direction, minVal), maxVal);
      if (nextVal !== currentVal) {
        if (activeMeasurement === 'weight') {
          setWeightValue(nextVal);
        } else {
          setHeightValue(nextVal);
        }
        el.scrollTo({
          left: (nextVal - minVal) * RULER_STEP,
          behavior: 'smooth',
        });
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, [activePage, activeMeasurement, weightValue, heightValue]);

  // Click on tick / number directly
  const handleRulerTickClick = (val) => {
    if (suppressRulerClickRef.current) return;
    const minVal = activeMeasurement === 'weight' ? WEIGHT_MIN : HEIGHT_MIN;
    if (activeMeasurement === 'weight') {
      setWeightValue(val);
    } else {
      setHeightValue(val);
    }
    if (rulerRef.current) {
      rulerRef.current.scrollTo({
        left: (val - minVal) * RULER_STEP,
        behavior: 'smooth',
      });
    }
  };

  // Sync scroll position when navigating to Page 3 or toggling measurement type
  useEffect(() => {
    if (activePage === 3 && rulerRef.current && !isDraggingRulerRef.current) {
      const minVal = activeMeasurement === 'weight' ? WEIGHT_MIN : HEIGHT_MIN;
      const val = activeMeasurement === 'weight' ? weightValue : heightValue;
      rulerRef.current.scrollTo({
        left: (val - minVal) * RULER_STEP,
        behavior: 'auto',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage, activeMeasurement]);

  // Stepper Header component
  const renderStepper = (currentStep) => {
    const steps = [1, 2, 3, 4];
    return (
      <div className="stepper-bar-wrapper">
        <div className="stepper-bar">
          {steps.map((stepNum, idx) => {
            const isComplete = stepNum < currentStep;
            const isActive = stepNum === currentStep;
            const isLast = idx === steps.length - 1;

            return (
              <React.Fragment key={stepNum}>
                <div className="stepper-item">
                  <div
                    className={`stepper-circle ${isComplete ? 'completed' : isActive ? 'active' : 'inactive'
                      }`}
                  >
                    {isComplete ? '✓' : stepNum}
                  </div>
                  <span
                    className={`stepper-label ${isComplete || isActive ? 'active-label' : ''
                      }`}
                  >
                    Step {stepNum}
                  </span>
                </div>
                {!isLast && (
                  <div
                    className={`stepper-connector ${isComplete ? 'connector-active' : ''
                      }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="app-viewport">
      <div className="modal-overlay" aria-hidden="true" />
      <div className="modal-container-wrapper">
        {/* PAGE 1.1: Registration Page */}
        {activePage === 1.1 && (
          <div className="modal-surface">
            {/* Header */}
            <div className="modal-header">
              <VyonicLogo className="modal-logo" width={75} height={75} />
              <h2 className="modal-title">Register Client &amp; Start Assessment</h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => navigate('/dashboard')}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Form */}
            <form className="modal-body registration-form" onSubmit={(e) => e.preventDefault()}>
              {/* Row 1: First Name & Last Name */}
              <div className="form-row-2col">
                <div className="form-field-wrapper">
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First Name *"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={`vy-input ${errors.firstName ? 'input-error' : ''}`}
                  />
                  {errors.firstName && <span className="error-hint">{errors.firstName}</span>}
                </div>
                <div className="form-field-wrapper">
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last Name *"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={`vy-input ${errors.lastName ? 'input-error' : ''}`}
                  />
                  {errors.lastName && <span className="error-hint">{errors.lastName}</span>}
                </div>
              </div>

              {/* Row 2: Phone with Country Code */}
              <div className="form-field-wrapper phone-field-wrapper">
                <div className={`phone-input-container ${errors.phone ? 'input-error' : ''}`}>
                  <CountryCodeSelect
                    value={formData.countryCode}
                    defaultIso="AE"
                    onChange={(dialCode) => {
                      setFormData((prev) => ({ ...prev, countryCode: dialCode }));
                    }}
                  />
                  <div className="phone-divider" />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="(000) 000-0000*"
                    value={formData.phone}
                    onChange={handleChange}
                    className="phone-native-input"
                  />
                </div>
                {errors.phone && <span className="error-hint">{errors.phone}</span>}
              </div>

              {/* Row 3: Email */}
              <div className="form-field-wrapper">
                <input
                  type="email"
                  name="email"
                  placeholder="Email *"
                  value={formData.email}
                  onChange={handleChange}
                  className={`vy-input ${errors.email ? 'input-error' : ''}`}
                />
                {errors.email && <span className="error-hint">{errors.email}</span>}
              </div>

              {/* Row 4: DOB & Gender */}
              <div className="form-row-2col">
                <div className="form-field-wrapper">
                  <div className={`date-input-wrapper ${errors.dob ? 'input-error' : ''}`}>
                    <input
                      type={formData.dob ? 'date' : 'text'}
                      placeholder="Date of Birth *"
                      name="dob"
                      value={formData.dob}
                      max={getTodayDateString()}
                      onChange={handleChange}
                      onFocus={handleDobFocus}
                      onClick={handleDobClick}
                      className="vy-input date-input"
                    />
                    <svg
                      className="calendar-icon"
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      onClick={handleCalendarIconClick}
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  {errors.dob && <span className="error-hint">{errors.dob}</span>}
                </div>

                <div className="form-field-wrapper">
                  <div className="select-input-wrapper">
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="vy-input select-input"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    <span className="select-chevron">▾</span>
                  </div>
                </div>
              </div>

              {/* Footer CTA */}
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-primary-gradient"
                  onClick={handleRegisterNext}
                  disabled={isRegistering}
                >
                  {isRegistering ? 'Registering...' : 'Register Client & With Basic Details Start Assessment'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* PAGE 2: Your Why (Goals) */}
        {activePage === 2 && (
          <div className="modal-surface">
            {/* Header */}
            <div className="modal-header">
              <VyonicLogo className="modal-logo" width={64} height={58} />
              <h2 className="modal-title">Set Up Profile &amp; Start Assessment</h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setActivePage(1.1)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Stepper */}
            {renderStepper(1)}

            {/* Body */}
            <div className="modal-body">
              <h3 className="section-title">Your Why</h3>

              <div className="goals-grid">
                {goalOptions.map((goal) => {
                  const isSelected = selectedGoals.includes(goal.title);
                  return (
                    <div
                      key={goal.id}
                      className={`client-goal-card ${isSelected ? 'client-goal-card--selected' : ''}`}
                      onClick={() => toggleGoal(goal.title)}
                    >
                      <div className="goal-card-top">
                        <span className="goal-icon-emoji">{goal.icon}</span>
                        <div className={`goal-check-badge ${isSelected ? 'badge-checked' : ''}`}>
                          {isSelected && '✓'}
                        </div>
                      </div>
                      <div className="goal-card-text">
                        <h4 className="goal-card-title">{goal.title}</h4>
                        <p className="goal-card-subtitle">{goal.subtitle}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="choose-helper-text">Choose up to three.</p>
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button
                type="button"
                className="btn-primary-gradient"
                onClick={() => setActivePage(3)}
                disabled={selectedGoals.length === 0}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* PAGE 3: Profile Measurements (Step 2) */}
        {activePage === 3 && (
          <div className="modal-surface">
            {/* Header */}
            <div className="modal-header">
              <VyonicLogo className="modal-logo" width={64} height={58} />
              <h2 className="modal-title">Set Up Profile &amp; Start Assessment</h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setActivePage(2)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Stepper */}
            {renderStepper(2)}

            {/* Body */}
            <div className="modal-body">
              {/* Switcher Pill (Weight / Height) */}
              <div className="pill-toggle-container">
                <button
                  type="button"
                  className={`pill-toggle-btn ${activeMeasurement === 'weight' ? 'pill-active' : ''}`}
                  onClick={() => setActiveMeasurement('weight')}
                >
                  Weight
                </button>
                <button
                  type="button"
                  className={`pill-toggle-btn ${activeMeasurement === 'height' ? 'pill-active' : ''}`}
                  onClick={() => setActiveMeasurement('height')}
                >
                  Height
                </button>
              </div>

              {/* Sub Unit Toggle (kg/lbs or cm/ft) */}
              <div className="sub-unit-toggle">
                {activeMeasurement === 'weight' ? (
                  <>
                    <button
                      type="button"
                      className={`unit-sub-btn ${weightUnit === 'kg' ? 'unit-active' : ''}`}
                      onClick={() => setWeightUnit('kg')}
                    >
                      kg
                    </button>
                    <button
                      type="button"
                      className={`unit-sub-btn ${weightUnit === 'lbs' ? 'unit-active' : ''}`}
                      onClick={() => setWeightUnit('lbs')}
                    >
                      lbs
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className={`unit-sub-btn ${heightUnit === 'cm' ? 'unit-active' : ''}`}
                      onClick={() => setHeightUnit('cm')}
                    >
                      cm
                    </button>
                    <button
                      type="button"
                      className={`unit-sub-btn ${heightUnit === 'ft' ? 'unit-active' : ''}`}
                      onClick={() => setHeightUnit('ft')}
                    >
                      ft
                    </button>
                  </>
                )}
              </div>

              {/* Large Metric Display */}
              <div className="large-measurement-display">
                <span className="measurement-num">
                  {activeMeasurement === 'weight' ? displayedWeight : displayedHeight}
                </span>
                <span className="measurement-unit">
                  {activeMeasurement === 'weight' ? weightUnit : heightUnit}
                </span>
              </div>

              {/* Ruler Widget */}
              <div className="measurement-ruler-box">
                <div className="ruler-center-indicator" />
                <div
                  className="ruler-viewport"
                  ref={rulerRef}
                  onPointerDown={handleRulerPointerDown}
                  onScroll={handleRulerScroll}
                >
                  <div className="ruler-ticks-track">
                    {(activeMeasurement === 'weight' ? fullWeightTicks : fullHeightTicks).map((val) => {
                      const currentValue = activeMeasurement === 'weight' ? weightValue : heightValue;
                      const isSelected = val === currentValue;
                      const displayTick =
                        activeMeasurement === 'weight' && weightUnit === 'lbs'
                          ? (val * 2.20462).toFixed(1)
                          : activeMeasurement === 'height' && heightUnit === 'ft'
                            ? (val / 30.48).toFixed(1)
                            : val;

                      return (
                        <div
                          key={val}
                          className={`ruler-tick-item ${val % 5 === 0 ? 'major-tick' : 'minor-tick'} ${isSelected ? 'selected-tick' : ''
                            }`}
                          onClick={() => handleRulerTickClick(val)}
                        >
                          <div className="tick-line-bar" />
                          {val % 5 === 0 && (
                            <span className="tick-number-label">{displayTick}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer-dual">
              <button
                type="button"
                className="btn-secondary-back"
                onClick={() => setActivePage(2)}
              >
                Back
              </button>
              <button
                type="button"
                className="btn-primary-gradient flex-1"
                onClick={() => setActivePage(4)}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* PAGE 4: Previous Experience (Step 3) */}
        {activePage === 4 && (
          <div className="modal-surface">
            {/* Header */}
            <div className="modal-header">
              <VyonicLogo className="modal-logo" width={64} height={58} />
              <h2 className="modal-title">Set Up Profile &amp; Start Assessment</h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setActivePage(3)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Stepper */}
            {renderStepper(3)}

            {/* Body */}
            <div className="modal-body">
              <div className="form-field-group">
                <label className="field-title-label">Previous training experience</label>
                <div className="experience-wheel-wrapper" onWheel={handleWheelEvent}>
                  {/* Center glowing active pill */}
                  <div className="experience-center-pill" />

                  {/* Horizontal wheel track */}
                  <div
                    className="experience-scroll-track"
                    ref={wheelRef}
                    onScroll={handleWheelScroll}
                    onPointerDown={handlePointerDown}
                  >
                    <div className="experience-spacer" />
                    {yearsArray.map((yr) => {
                      const isSelected = yr === yearsExp;
                      const distance = Math.abs(yr - yearsExp);
                      let distanceClass = 'distance-far';
                      if (isSelected) distanceClass = 'selected-wheel-item';
                      else if (distance === 1) distanceClass = 'distance-1';
                      else if (distance === 2) distanceClass = 'distance-2';

                      return (
                        <div
                          key={yr}
                          className={`wheel-item ${distanceClass}`}
                          onClick={() => handleItemClick(yr)}
                        >
                          <span className="wheel-number">{yr}</span>
                        </div>
                      );
                    })}
                    <div className="experience-spacer" />
                  </div>
                </div>
              </div>

              {/* Frequency Dropdown */}
              <div className="form-field-group">
                <label className="field-title-label">Training frequency</label>
                <div className="relative">
                  <div
                    className="vy-input custom-dropdown-trigger"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <span>{frequency}</span>
                    <span className={`dropdown-chevron ${isDropdownOpen ? 'open' : ''}`}>▾</span>
                  </div>
                  {isDropdownOpen && (
                    <div className="dropdown-options-popover">
                      {frequencyOptions.map((opt) => (
                        <div
                          key={opt}
                          className={`dropdown-option-row ${opt === frequency ? 'active' : ''}`}
                          onClick={() => {
                            setFrequency(opt);
                            setIsDropdownOpen(false);
                          }}
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Injuries Textarea */}
              <div className="form-field-group">
                <label className="field-title-label">Injuries or conditions</label>
                <div className="textarea-container">
                  <textarea
                    className="vy-textarea"
                    placeholder="e.g. lower-back, knee, asthma"
                    value={injuries}
                    onChange={(e) => setInjuries(e.target.value.slice(0, 300))}
                    rows={3}
                  />
                  <span className="char-count">{injuries.length}/300</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer-dual">
              <button
                type="button"
                className="btn-secondary-back"
                onClick={() => setActivePage(3)}
              >
                Back
              </button>
              <button
                type="button"
                className="btn-primary-gradient flex-1"
                onClick={() => {
                  saveAssessmentRecord();
                  setActivePage(7);
                }}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* PAGE 7: Assessment Scheduled (Step 4 Complete) */}
        {activePage === 7 && (
          <div className="modal-surface">
            {/* Header */}
            <div className="modal-header">
              <VyonicLogo className="modal-logo" width={64} height={58} />
              <h2 className="modal-title">Set Up Profile &amp; Start Assessment</h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => navigate('/dashboard')}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Stepper */}
            {renderStepper(4)}

            {/* Body */}
            <div className="modal-body text-center py-6">
              <div className="success-badge-circle">✓</div>
              <h3 className="section-title mt-4">Assessment Scheduled!</h3>
              <p className="success-copy-text">
                Your baseline profile and health consents have been verified. Welcome to VYONIC!
              </p>
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button
                type="button"
                className="btn-primary-gradient"
                onClick={() => {
                  toast.success('Assessment Slot Created and Booked Successfully');
                  navigate('/dashboard');
                }}
              >
                Save Details & Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
