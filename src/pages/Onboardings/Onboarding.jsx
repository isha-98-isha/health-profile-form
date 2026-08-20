import React, { useState, useRef, useEffect } from 'react';
import './Onboarding.css';
import Button from '../../components/Buttons/Button';

const Onboarding = () => {
  const [activePage, setActivePage] = useState(1);

  // Page 2 State
  const [selectedGoals, setSelectedGoals] = useState(['Longevity', 'Build strength', 'Body re-composition']);

  // Page 3 State
  const [weightUnit, setWeightUnit] = useState('kg');
  const [weightValue, setWeightValue] = useState(66);
  const [heightUnit, setHeightUnit] = useState('cm');
  const [heightValue, setHeightValue] = useState(166);
  const [activeMeasurement, setActiveMeasurement] = useState('weight');

  // Page 4 State
  const [yearsExp, setYearsExp] = useState(21);
  const [frequency, setFrequency] = useState('Once a week');
  const [injuries, setInjuries] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Scroll Wheel Ref for Page 4
  const wheelRef = useRef(null);
  const weightRulerRef = useRef(null);
  const heightRulerRef = useRef(null);

  // Page 1 Steps Data
  const page1Steps = [
    {
      id: 1,
      title: 'Set goals',
      subtitle: 'Strength • Longevity • Recovery • Sport',
    },
    {
      id: 2,
      title: 'Share the basics',
      subtitle: 'Age • Height • Weight • Training history',
    },
    {
      id: 3,
      title: 'Acknowledge consents',
      subtitle: 'Medical fitness • Data use • Coach visibility',
    },
    {
      id: 4,
      title: 'Book your assessment',
      subtitle: '90-minute assessment at Vyonik lab',
    },
  ];

  //page1.1
   const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    countryCode: "+91",
    phone: "",
    email: "",
    dob: "",
    gender: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
  let newErrors = {};

  // First & Last Name
  if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
  if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";

  // Phone number: required + 10 digits
  if (!formData.phone.trim()) {
    newErrors.phone = "Phone number is required";
  } else if (!/^\d{10}$/.test(formData.phone)) {
    newErrors.phone = "Enter a valid 10-digit number";
  }

  // Email: required + must contain @
  if (!formData.email.trim()) {
    newErrors.email = "Email is required";
  } else if (!formData.email.includes("@")) {
    newErrors.email = "Email must contain '@'";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    newErrors.email = "Enter a valid email address";
  }

  // DOB: required + not greater than today
  if (!formData.dob.trim()) {
    newErrors.dob = "Date of birth is required";
  } else {
    const today = new Date();
    const dobDate = new Date(formData.dob);
    if (dobDate > today) {
      newErrors.dob = "Check Date of Birth";
    }
  }

  // Gender
  if (!formData.gender.trim()) newErrors.gender = "Gender is required";

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

  const handleNext = () => {
    if (validate()) {
      setActivePage(2);
    }
  };
  // Page 2 Goal Options
  const goalOptions = [
    { id: 'longevity', title: 'Longevity', subtitle: 'Drop your biological age. Slowly.', icon: '⌛' },
    { id: 'strength', title: 'Build strength', subtitle: 'Lift heaviest, look leaner, age slower.', icon: '💪' },
    { id: 'recomposition', title: 'Body re-composition', subtitle: 'Composition-led, not scale-led.', icon: '🔥' },
    { id: 'endurance', title: 'Elevate endurance', subtitle: 'VO2 max, stamina, cardiac output.', icon: '🏃‍♂️' },
    { id: 'balance', title: 'Restore balance', subtitle: 'Fix sleep, HRV, mobility, pain.', icon: '🧘' },
    { id: 'sport', title: 'Sport-specific', subtitle: 'Tennis, golf, running, soccer...', icon: '⚽' },
  ];

 

  const displayedWeight = weightUnit === 'kg' ? weightValue.toFixed(1) : (weightValue * 2.20462).toFixed(1);
  const displayedHeight = heightUnit === 'cm' ? heightValue : (heightValue / 30.48).toFixed(1);

  const toggleGoal = (title) => {
    if (selectedGoals.includes(title)) {
      setSelectedGoals(selectedGoals.filter((item) => item !== title));
    } else if (selectedGoals.length < 3) {
      setSelectedGoals([...selectedGoals, title]);
    }
  };



  const frequencyOptions = [
    'Once a Week',
    '2-3 times a week',
    '4-5 times a week',
    '5+ sessions',
  ];

  // Wheel years array (0 to 100)
  const yearsArray = Array.from({ length: 100 }, (_, i) => i);

const handleWheelScroll = () => {
  if (!wheelRef.current) return;
  const scrollTop = wheelRef.current.scrollTop; 
  const itemHeight = 52;
  const spacerHeight = 84; // matches your CSS
  const index = Math.round(
    (scrollTop + wheelRef.current.clientHeight / 2 - spacerHeight - itemHeight / 2) / itemHeight
  );
  if (yearsArray[index] !== undefined && yearsArray[index] !== yearsExp) {
    setYearsExp(yearsArray[index]);
  }
};

const handleWheelEvent = (e) => {
  e.preventDefault();
  if (!wheelRef.current) return;
  const direction = e.deltaY > 0 ? 1 : -1; 
  const newYears = Math.min(Math.max(yearsExp + direction, 0), yearsArray.length - 1);
  setYearsExp(newYears);
  const selectedItem = wheelRef.current.querySelectorAll('.wheel-item')[newYears];
  if (selectedItem) {
    selectedItem.scrollIntoView({
      behavior: 'smooth',
      block: 'center', 
      inline: 'nearest'
    });
  }
};


  useEffect(() => {
    if (activePage === 4 && wheelRef.current) {
      const selectedItem = wheelRef.current.querySelectorAll('.wheel-item')[yearsExp];
      if (selectedItem) {
        selectedItem.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [activePage, yearsExp]);

  // Full Weight Ruler Array (30kg to 160kg)
  const fullWeightTicks = Array.from({ length: 131 }, (_, i) => 30 + i);

  // Full Height Ruler Array (100cm to 220cm)
  const fullHeightTicks = Array.from({ length: 121 }, (_, i) => 100 + i);
    
  
  useEffect(() => {
    if (activePage === 3) {
      if (weightRulerRef.current) {
        const activeTick = weightRulerRef.current.querySelector('.selected-tick');
        if (activeTick) {
          activeTick.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      }
      if (heightRulerRef.current) {
        const activeTick = heightRulerRef.current.querySelector('.selected-tick');
        if (activeTick) {
          activeTick.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      }
    }
  }, [activePage, weightValue, heightValue]);

  return (
    <div className="app-viewport">
      <div className="app-frame">
        {/* Universal Status Bar */}
        {/* PAGE 1: Welcome Screen */}
        {activePage === 1 && (
          <div className="page-step-container page-one-modal">
            <div className="page-two-header">
              <svg className="vyonic-mark" viewBox="0 0 48 52" aria-hidden="true">
                <path d="M2 4 24 16 46 4 28 29v19l-4 4-4-4V29L2 4Z" />
                <path d="M10 7 24 14 38 7 24 25 10 7Z" fill="#777" />
              </svg>
              <h1 className="page-two-title">Set Up Profile &amp; Start Assessment</h1>
            </div>

            <h1 className="page-heading">Welcome, John This is where you become who you&apos;re meant to be.</h1>

            <div className="page-one-steps">
              <h2>What we&apos;ll do together</h2>
              {page1Steps.map((step) => (
                <div key={step.id} className="page-one-step">
                  <span>{step.id}</span>
                  <div><strong>{step.title}</strong><small>{step.subtitle}</small></div>
                </div>
              ))}
            </div>

            <div className="page-three-footer page-one-footer">
              <Button onClick={() => setActivePage(1.1)}>Begin</Button>
            </div>
          </div>
        )}
        
 {activePage === 1.1 && (
  <div className="page-step-container page-one-modal">
    <div className="page-two-header">
      <svg className="vyonic-mark" viewBox="0 0 48 52" aria-hidden="true">
        <path d="M2 4 24 16 46 4 28 29v19l-4 4-4-4V29L2 4Z" />
        <path d="M10 7 24 14 38 7 24 25 10 7Z" fill="#777" />
      </svg>
      <h1 className="page-two-title">Add Details to Start Assessment</h1>
    </div>

    <form className="page-one-form">
      <div className="form-group">
        <input
          name="firstName"
          placeholder="First Name *"
          value={formData.firstName}
          onChange={handleChange}
        />
        {errors.firstName && <span className="error-text">{errors.firstName}</span>}
      </div>

      <div className="form-group">
        <input
          name="lastName"
          placeholder="Last Name *"
          value={formData.lastName}
          onChange={handleChange}
        />
        {errors.lastName && <span className="error-text">{errors.lastName}</span>}
      </div>

      {/* Country code + phone */}
      <div className="form-row-horizontal">
        <div className="form-group flex-fixed">
          <select name="countryCode" value={formData.countryCode} onChange={handleChange}>
            <option value="+91">IN +91</option>
            <option value="+971">AE +971</option>
            <option value="+1">US +1</option>
            <option value="+44">UK +44</option>
            <option value="+61">AU +61</option>
          </select>
        </div>
        <div className="form-group flex-grow">
          <input
            name="phone"
            placeholder="(000) 000-0000 *"
            value={formData.phone}
            onChange={handleChange}
          />
          {errors.phone && <span className="error-text">{errors.phone}</span>}
        </div>
      </div>

      <div className="form-group">
        <input
          type="email"
          name="email"
          placeholder="Email *"
          value={formData.email}
          onChange={handleChange}
        />
        {errors.email && <span className="error-text">{errors.email}</span>}
      </div>

      {/* DOB + gender */}
      <div className="form-row-horizontal">
        <div className="form-group flex-grow">
          <input
            name="dob"
            placeholder="dd - mm - yyyy"
            value={formData.dob}
            onChange={handleChange}
          />
          {errors.dob && <span className="error-text">{errors.dob}</span>}
        </div>
        <div className="form-group flex-grow">
          <select name="gender" value={formData.gender} onChange={handleChange}>
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          {errors.gender && <span className="error-text">{errors.gender}</span>}
        </div>
      </div>
    </form>

    <div className="page-three-footer page-one-footer">
      <button type="button" className="btn-gradient" onClick={handleNext}>
        Next
      </button>
    </div>
  </div>
)}


        {/* PAGE 2: Your Why (Step 1 of 5) */}
        {activePage === 2 && (
          <div className="page-step-container page-two-modal">
            <div className="page-two-header">
              <svg className="vyonic-mark" viewBox="0 0 48 52" aria-hidden="true">
                <path d="M2 4 24 16 46 4 28 29v19l-4 4-4-4V29L2 4Z" />
                <path d="M10 7 24 14 38 7 24 25 10 7Z" fill="#777" />
              </svg>
              <h1 className="page-two-title">Set Up Profile &amp; Start Assessment</h1>
              <button className="page-two-close" onClick={() => setActivePage(1.1)} aria-label="Close">×</button>
            </div>
            <div className="stepper-bar">
              {[1, 2, 3, 4].map((stepNum) => (
                <div
                  key={stepNum}
                  className={`stepper-item ${stepNum === 1 ? 'active' : ''}`}
                >
                  <div className="stepper-circle">
                    {stepNum}
                  </div>
                  <span className="stepper-label">Step {stepNum}</span>
                </div>
              ))}
              <div className="stepper-line-bg">
                <div className="stepper-line-fill" style={{ width: '0%' }}></div>
              </div>
            </div>

            <h1 className="page-heading">Your Why</h1>

            <div className="goals-grid">
              {goalOptions.map((goal) => {
                const isSelected = selectedGoals.includes(goal.title);
                return (
                  <div
                    key={goal.id}
                    className={`goal-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleGoal(goal.title)}
                  >
                    <div className="goal-card-header">
                      <span className="goal-icon">{goal.icon}</span>
                      <div className={`check-badge ${isSelected ? 'active' : ''}`}>
                        {isSelected && '✓'}
                      </div>
                    </div>
                    <div className="goal-card-body">
                      <h3 className="goal-title">{goal.title}</h3>
                      <p className="goal-subtitle">{goal.subtitle}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="choose-instruction">Choose up to three.</p>

            <div className="page2-cta-wrapper">
              <Button onClick={() => setActivePage(3)}>Continue</Button>
            </div>
          </div>
        )}

        {/* PAGE 3: Your Profile (Step 2 of 5 - Part A) */}
        {activePage === 3 && (
          <div className="page-step-container page-three-modal">
            <div className="page-two-header">
              <svg className="vyonic-mark" viewBox="0 0 48 52" aria-hidden="true">
                <path d="M2 4 24 16 46 4 28 29v19l-4 4-4-4V29L2 4Z" />
                <path d="M10 7 24 14 38 7 24 25 10 7Z" fill="#777" />
              </svg>
            </div>
            <div className="stepper-bar">
              {[1, 2, 3, 4].map((stepNum) => (
                <div
                  key={stepNum}
                  className={`stepper-item ${stepNum === 2 ? 'active' : stepNum < 2 ? 'completed' : ''}`}
                >
                  <div className="stepper-circle">
                    {stepNum < 2 ? '✓' : stepNum}
                  </div>
                  <span className="stepper-label">Step {stepNum}</span>
                </div>
              ))}
              <div className="stepper-line-bg">
                <div className="stepper-line-fill" style={{ width: '33.333%' }}></div>
              </div>
            </div>

            <div className="measurement-switcher">
              <button className={activeMeasurement === 'weight' ? 'active' : ''} onClick={() => setActiveMeasurement('weight')}>Weight</button>
              <button className={activeMeasurement === 'height' ? 'active' : ''} onClick={() => setActiveMeasurement('height')}>Height</button>
            </div>

            <div className="measurement-unit-toggle">
              {activeMeasurement === 'weight' ? (
                <>
                  <button className={weightUnit === 'kg' ? 'active' : ''} onClick={() => setWeightUnit('kg')}>kg</button>
                  <button className={weightUnit === 'lbs' ? 'active' : ''} onClick={() => setWeightUnit('lbs')}>lbs</button>
                </>
              ) : (
                <>
                  <button className={heightUnit === 'cm' ? 'active' : ''} onClick={() => setHeightUnit('cm')}>cm</button>
                  <button className={heightUnit === 'ft' ? 'active' : ''} onClick={() => setHeightUnit('ft')}>ft</button>
                </>
              )}
            </div>

            <div className="measurement-value">
              <span>{activeMeasurement === 'weight' ? displayedWeight : displayedHeight}</span>
              <small>{activeMeasurement === 'weight' ? weightUnit : heightUnit}</small>
            </div>

            <div className="measurement-ruler">
              <div className="ruler-center-marker"></div>
              <div className="pure-ruler-widget">
                <div className="ruler-scroll-viewport" ref={activeMeasurement === 'weight' ? weightRulerRef : heightRulerRef}>
                  <div className="ruler-ticks-bar">
                    {(activeMeasurement === 'weight' ? fullWeightTicks : fullHeightTicks).map((val) => {
                      const currentValue = activeMeasurement === 'weight' ? weightValue : heightValue;
                      const isSelected = val === currentValue;
                      const displayTick = activeMeasurement === 'weight' && weightUnit === 'lbs'
                        ? (val * 2.20462).toFixed(1)
                        : activeMeasurement === 'height' && heightUnit === 'ft'
                          ? (val / 30.48).toFixed(1)
                          : val;
                      return (
                        <div
                          key={val}
                          className={`ruler-single-tick ${val % 5 === 0 ? 'major' : 'minor'} ${isSelected ? 'selected-tick' : ''}`}
                          onClick={() => activeMeasurement === 'weight' ? setWeightValue(val) : setHeightValue(val)}
                        >
                          <div className="tick-line"></div>
                          {val % 5 === 0 && <span className="tick-label-num">{displayTick}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="page-three-footer">
              <button className="page-three-back" onClick={() => setActivePage(2)}>Back</button>
              <Button onClick={() => setActivePage(4)}>Continue</Button>
            </div>
          </div>
        )}

        {/* PAGE 3 LEGACY CONTENT RETIRED */}
        {false && activePage === 3 && (
          <div className="page-step-container">
            <div className="profile-row-sliders">
              <div className="slider-card">
                <div className="pure-ruler-widget">
                  <div className="ruler-scroll-viewport" ref={weightRulerRef}>
                    <div className="ruler-ticks-bar">
                      {fullWeightTicks.map((val) => {
                        const isSelected = val === weightValue;
                        return (
                          <div
                            key={val}
                            className={`ruler-single-tick ${val % 5 === 0 ? 'major' : 'minor'} ${isSelected ? 'selected-tick' : ''}`}
                            onClick={() => setWeightValue(val)}
                          >
                            {isSelected && (
                              <div className="vector-pointer-container">
                                <svg className="vector-pointer-svg" viewBox="0 0 16 14">
                                  <polygon points="8,14 0,0 16,0" fill="#2C5FF6" />
                                </svg>
                              </div>
                            )}
                            <div className="tick-line"></div>
                            {val % 5 === 0 && <span className="tick-label-num">{val}</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Height Card */}
              <div className="slider-card">
                <div className="slider-header">
                  <span className="slider-label">Height</span>
                  <div className="unit-toggle">
                    <button
                      className={`unit-btn ${heightUnit === 'cm' ? 'active' : ''}`}
                      onClick={() => setHeightUnit('cm')}
                    >
                      cm
                    </button>
                    <button
                      className={`unit-btn ${heightUnit === 'ft' ? 'active' : ''}`}
                      onClick={() => setHeightUnit('ft')}
                    >
                      ft
                    </button>
                  </div>
                </div>

                <div className="value-display">
                  <span className="large-num">{heightValue}</span>
                  <span className="unit-text">{heightUnit}</span>
                </div>

                <div className="pure-ruler-widget">
                  <div className="ruler-scroll-viewport" ref={heightRulerRef}>
                    <div className="ruler-ticks-bar">
                      {fullHeightTicks.map((val) => {
                        const isSelected = val === heightValue;
                        return (
                          <div
                            key={val}
                            className={`ruler-single-tick ${val % 5 === 0 ? 'major' : 'minor'} ${isSelected ? 'selected-tick' : ''}`}
                            onClick={() => setHeightValue(val)}
                          >
                            {isSelected && (
                              <div className="vector-pointer-container">
                                <svg className="vector-pointer-svg" viewBox="0 0 16 14">
                                  <polygon points="8,14 0,0 16,0" fill="#2C5FF6" />
                                </svg>
                              </div>
                            )}
                            <div className="tick-line"></div>
                            {val % 5 === 0 && <span className="tick-label-num">{val}</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* PAGE 4: Previous Training Experience (Step 2 - Part B) */}
        {activePage === 4 && (
          <div className="page-step-container page-four-modal">
            <div className="page-two-header">
              <svg className="vyonic-mark" viewBox="0 0 48 52" aria-hidden="true">
                <path d="M2 4 24 16 46 4 28 29v19l-4 4-4-4V29L2 4Z" />
                <path d="M10 7 24 14 38 7 24 25 10 7Z" fill="#777" />
              </svg>
            </div>
            <div className="stepper-bar">
              {[1, 2, 3, 4].map((stepNum) => (
                <div
                  key={stepNum}
                  className={`stepper-item ${stepNum === 3 ? 'active' : stepNum < 3 ? 'completed' : ''}`}
                >
                  <div className="stepper-circle">
                    {stepNum < 3 ? '✓' : stepNum}
                  </div>
                  <span className="stepper-label">Step {stepNum}</span>
                </div>
              ))}
              <div className="stepper-line-bg">
                <div className="stepper-line-fill" style={{ width: '66.667%' }}></div>
              </div>
            </div>

            <h1 className="page-heading">Previous training experience</h1>

            <div className="wheel-picker-container" onWheel={handleWheelEvent}>
              <div
                className="wheel-scroll-viewport"
                ref={wheelRef}
                onScroll={handleWheelScroll}
              >
                <div className="wheel-spacer"></div>
                {yearsArray.map((yr) => {
                  const isSelected = yr === yearsExp;
                  return (
                    <div
                      key={yr}
                      className={`wheel-item ${isSelected ? 'selected-wheel' : ''}`}
                      onClick={() => {
                        setYearsExp(yr);
                        if (wheelRef.current) {
                          const selectedItem = wheelRef.current.querySelectorAll('.wheel-item')[yr];
                          if (selectedItem) {
                            selectedItem.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                          }
                        }
                      }}
                    >
                      <span className="wheel-number">{yr}</span>
                      {isSelected && <span className="wheel-unit">Years</span>}
                    </div>
                  );
                })}
                <div className="wheel-spacer"></div>
              </div>
            </div>

            <div className="field-group">
              <label className="field-label">Training frequency</label>
              <div
                className="custom-dropdown-select"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span>{frequency}</span>
                <span className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}>▼</span>
              </div>
              {isDropdownOpen && (
                <div className="dropdown-options-menu">
                  {frequencyOptions.map((opt) => (
                    <div
                      key={opt}
                      className={`dropdown-option-item ${opt === frequency ? 'active' : ''}`}
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

            <div className="field-group">
              <label className="field-label">Injuries or conditions</label>
              <div className="textarea-wrapper">
                <textarea
                  className="injuries-input"
                  placeholder="e.g. lower-back, knee, asthma"
                  value={injuries}
                  onChange={(e) => setInjuries(e.target.value.slice(0, 300))}
                  rows={4}
                />
                <span className="char-counter">{injuries.length}/300</span>
              </div>
            </div>

            <div className="page-three-footer">
              <button className="page-three-back" onClick={() => setActivePage(3)}>Back</button>
              <Button onClick={() => setActivePage(7)}>Continue</Button>
            </div>
          </div>
        )}

        {/* PAGE 7: Assessment Completed / Final Step */}
        {activePage === 7 && (
          <div className="page-step-container page-seven-modal">
            <div className="page-two-header">
              <svg className="vyonic-mark" viewBox="0 0 48 52" aria-hidden="true">
                <path d="M2 4 24 16 46 4 28 29v19l-4 4-4-4V29L2 4Z" />
                <path d="M10 7 24 14 38 7 24 25 10 7Z" fill="#777" />
              </svg>
            </div>
            <div className="stepper-bar">
              {[1, 2, 3, 4].map((stepNum) => (
                <div
                  key={stepNum}
                  className={`stepper-item ${stepNum === 4 ? 'active' : 'completed'}`}
                >
                  <div className="stepper-circle">
                    {stepNum < 4 ? '✓' : stepNum}
                  </div>
                  <span className="stepper-label">Step {stepNum}</span>
                </div>
              ))}
              <div className="stepper-line-bg">
                <div className="stepper-line-fill" style={{ width: '100%' }}></div>
              </div>
            </div>

            <h1 className="page-heading">Assessment Scheduled!</h1>
            <p className="page-seven-copy">
              Your baseline profile and health consents have been verified. Welcome to VYONIC!
            </p>

            <div className="page-three-footer page-seven-footer">
              <Button onClick={() => window.location.href = '/dashboard'}>Back to Start</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
