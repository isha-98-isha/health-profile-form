import React, { useState, useRef, useEffect } from 'react';
import './Onboarding.css';
import Button from '../../components/Buttons/Button';
import heroImage from '../../assets/hero.png';

const Onboarding = () => {
  const [activePage, setActivePage] = useState(1);

  // Page 2 State
  const [selectedGoals, setSelectedGoals] = useState(['Longevity', 'Build strength', 'Body re-composition']);

  // Page 3 State
  const [gender, setGender] = useState('Female');
  const [dob, setDob] = useState('2003-11-05');
  const [weightUnit, setWeightUnit] = useState('kg');
  const [weightValue, setWeightValue] = useState(66);
  const [heightUnit, setHeightUnit] = useState('cm');
  const [heightValue, setHeightValue] = useState(166);

  // Page 4 State
  const [yearsExp, setYearsExp] = useState(12);
  const [frequency, setFrequency] = useState('5+ sessions');
  const [injuries, setInjuries] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Page 5 State (Health Consents)
  const [selectedConsents, setSelectedConsents] = useState(['data_use', 'pro_visibility', 'legal_followup']);

  // Assessment Modal Popup State
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);

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

  // Page 2 Goal Options
  const goalOptions = [
    { id: 'longevity', title: 'Longevity', subtitle: 'Drop your biological age. Slowly.', icon: '🏃' },
    { id: 'strength', title: 'Build strength', subtitle: 'Lift heaviest, look leaner, age slower.', icon: '💪' },
    { id: 'recomposition', title: 'Body re-composition', subtitle: 'Composition-led, not scale-led.', icon: '🔥' },
    { id: 'endurance', title: 'Elevate endurance', subtitle: 'VO2 max, stamina, cardiac output.', icon: '🏃‍♂️' },
    { id: 'balance', title: 'Restore balance', subtitle: 'Fix sleep, HRV, mobility, pain.', icon: '🧘' },
    { id: 'sport', title: 'Sport-specific', subtitle: 'Tennis, golf, running, soccer...', icon: '⚽' },
  ];

  // Page 5 Consents Options
  const consentOptions = [
    {
      id: 'data_use',
      title: 'Data use',
      subtitle: 'VYONIC may use my anonymised biomarker data to improve the platform. My named data is never sold.',
    },
    {
      id: 'pro_visibility',
      title: 'Professional visibility',
      subtitle: 'My coach sees my lab assessment & session logs. I can revoke in profile.',
    },
    {
      id: 'legal_followup',
      title: 'Follow-up with guide to check with legal',
      subtitle: 'Follow-up with guide to check with legal.',
    },
  ];

  const calculateAge = (dobString) => {
    if (!dobString) return 23;
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age > 0 ? age : 23;
  };

  const toggleGoal = (title) => {
    if (selectedGoals.includes(title)) {
      setSelectedGoals(selectedGoals.filter((item) => item !== title));
    } else if (selectedGoals.length < 3) {
      setSelectedGoals([...selectedGoals, title]);
    }
  };

  const toggleConsent = (id) => {
    if (selectedConsents.includes(id)) {
      setSelectedConsents(selectedConsents.filter((item) => item !== id));
    } else {
      setSelectedConsents([...selectedConsents, id]);
    }
  };

  const isAllConsentsSelected = selectedConsents.length === 3;

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
    const index = Math.round(scrollTop / itemHeight);
    if (yearsArray[index] !== undefined && yearsArray[index] !== yearsExp) {
      setYearsExp(yearsArray[index]);
    }
  };

  const handleWheelEvent = (e) => {
    e.preventDefault();
    if (!wheelRef.current) return;
    const direction = e.deltaY > 0 ? 1 : -1;
    const newYears = Math.min(Math.max(yearsExp + direction, 0), 99);
    setYearsExp(newYears);
    wheelRef.current.scrollTo({
      top: newYears * 52,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    if (activePage === 4 && wheelRef.current) {
      wheelRef.current.scrollTo({
        top: yearsExp * 52,
        behavior: 'smooth',
      });
    }
  }, [activePage, yearsExp]);

  //Live Time Update
  const [time, setTime] = useState("");
  // Full Weight Ruler Array (30kg to 160kg)
  const fullWeightTicks = Array.from({ length: 131 }, (_, i) => 30 + i);

  // Full Height Ruler Array (100cm to 220cm)
  const fullHeightTicks = Array.from({ length: 121 }, (_, i) => 100 + i);
    
  
   useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      setTime(formatted);
    };

    updateTime(); // run once immediately
    const interval = setInterval(updateTime, 1000); // update every second
       return () => clearInterval(interval); // cleanup
  }, []);

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
        <div className="status-bar">
            <span className="time">{time}</span>
            <div className="status-icons">
            <span className="icon-signal">📶</span>
            <span className="icon-wifi">📡</span>
            <span className="icon-battery">🔋</span>
          </div>
        </div>

        {/* PAGE 1: Welcome Screen */}
        {activePage === 1 && (
          <div className="onboarding-container">
            <div className="hero-section">
              <img src={heroImage} alt="Athlete Squatting" className="hero-img" />
              <div className="hero-fade"></div>
            </div>

            <div className="glass-card">
              <h2 className="card-title">
                John, this is where you become who you&apos;re meant to be
              </h2>

              <div className="steps-container">
                <h3 className="section-label">What we&apos;ll do together</h3>
                <div className="steps-list">
                  {page1Steps.map((step) => (
                    <div key={step.id} className="step-row">
                      <div className="step-badge">{step.id}</div>
                      <div className="step-text">
                        <div className="step-name">{step.title}</div>
                        <div className="step-desc">{step.subtitle}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="cta-container">
                <Button onClick={() => setActivePage(2)}>Begin</Button>
              </div>
            </div>
          </div>
        )}

        {/* PAGE 2: Your Why (Step 1 of 5) */}
        {activePage === 2 && (
          <div className="page-step-container">
            <div className="stepper-bar">
              {[1, 2, 3, 4, 5].map((stepNum) => (
                <div
                  key={stepNum}
                  className={`stepper-item ${stepNum === 1 ? 'active' : ''}`}
                >
                  <div className="stepper-circle">
                    {stepNum === 1 && <div className="inner-dot"></div>}
                  </div>
                  <span className="stepper-label">Step {stepNum}</span>
                </div>
              ))}
              <div className="stepper-line-bg">
                <div className="stepper-line-fill" style={{ width: '0%' }}></div>
              </div>
            </div>

            <h1 className="page-heading">Your why</h1>

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
          <div className="page-step-container">
            <div className="stepper-bar">
              {[1, 2, 3, 4, 5].map((stepNum) => (
                <div
                  key={stepNum}
                  className={`stepper-item ${stepNum === 2 ? 'active' : stepNum < 2 ? 'completed' : ''}`}
                >
                  <div className="stepper-circle">
                    {stepNum === 2 && <div className="inner-dot"></div>}
                    {stepNum < 2 && <span className="check-icon">✓</span>}
                  </div>
                  <span className="stepper-label">Step {stepNum}</span>
                </div>
              ))}
              <div className="stepper-line-bg">
                <div className="stepper-line-fill" style={{ width: '25%' }}></div>
              </div>
            </div>

            <h1 className="page-heading">Your profile</h1>

            <div className="profile-row-top">
              <div className="gender-selector">
                <button
                  className={`gender-btn ${gender === 'Male' ? 'active' : ''}`}
                  onClick={() => setGender('Male')}
                >
                  Male
                </button>
                <button
                  className={`gender-btn ${gender === 'Female' ? 'active' : ''}`}
                  onClick={() => setGender('Female')}
                >
                  Female
                </button>
              </div>

              <div className="dob-picker-box">
                <span className="calendar-icon">📅</span>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="dob-input"
                />
                <span className="age-badge">{calculateAge(dob)} years old</span>
              </div>
            </div>

            <div className="profile-row-sliders">
              {/* Weight Card */}
              <div className="slider-card">
                <div className="slider-header">
                  <span className="slider-label">Weight</span>
                  <div className="unit-toggle">
                    <button
                      className={`unit-btn ${weightUnit === 'kg' ? 'active' : ''}`}
                      onClick={() => setWeightUnit('kg')}
                    >
                      kg
                    </button>
                    <button
                      className={`unit-btn ${weightUnit === 'lbs' ? 'active' : ''}`}
                      onClick={() => setWeightUnit('lbs')}
                    >
                      lbs
                    </button>
                  </div>
                </div>

                <div className="value-display">
                  <span className="large-num">{weightValue}</span>
                  <span className="unit-text">{weightUnit}</span>
                </div>

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

            <div className="page2-cta-wrapper">
              <Button onClick={() => setActivePage(4)}>Continue</Button>
            </div>
          </div>
        )}

        {/* PAGE 4: Previous Training Experience (Step 2 - Part B) */}
        {activePage === 4 && (
          <div className="page-step-container">
            <div className="stepper-bar">
              {[1, 2, 3, 4, 5].map((stepNum) => (
                <div
                  key={stepNum}
                  className={`stepper-item ${stepNum === 2 ? 'active' : stepNum < 2 ? 'completed' : ''}`}
                >
                  <div className="stepper-circle">
                    {stepNum === 2 && <div className="inner-dot"></div>}
                    {stepNum < 2 && <span className="check-icon">✓</span>}
                  </div>
                  <span className="stepper-label">Step {stepNum}</span>
                </div>
              ))}
              <div className="stepper-line-bg">
                <div className="stepper-line-fill" style={{ width: '25%' }}></div>
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
                          wheelRef.current.scrollTo({
                            top: yr * 52,
                            behavior: 'smooth',
                          });
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

            <div className="page2-cta-wrapper">
              <Button onClick={() => setActivePage(5)}>Continue</Button>
            </div>
          </div>
        )}

        {/* PAGE 5: Health Consents (Step 3 of 5) */}
        {activePage === 5 && (
          <div className="page-step-container">
            <div className="stepper-bar">
              {[1, 2, 3, 4, 5].map((stepNum) => (
                <div
                  key={stepNum}
                  className={`stepper-item ${stepNum === 3 ? 'active' : stepNum < 3 ? 'completed' : ''}`}
                >
                  <div className="stepper-circle">
                    {stepNum === 3 && <div className="inner-dot"></div>}
                    {stepNum < 3 && <span className="check-icon">✓</span>}
                  </div>
                  <span className="stepper-label">Step {stepNum}</span>
                </div>
              ))}
              <div className="stepper-line-bg">
                <div className="stepper-line-fill" style={{ width: '50%' }}></div>
              </div>
            </div>

            <h1 className="page-heading">Health consents</h1>

            <div className="consents-list">
              {consentOptions.map((consent) => {
                const isChecked = selectedConsents.includes(consent.id);
                return (
                  <div
                    key={consent.id}
                    className={`consent-card ${isChecked ? 'selected' : ''}`}
                    onClick={() => toggleConsent(consent.id)}
                  >
                    <div className="consent-text-block">
                      <h3 className="consent-title">{consent.title}</h3>
                      <p className="consent-subtitle">{consent.subtitle}</p>
                    </div>
                    <div className={`consent-check-badge ${isChecked ? 'checked' : ''}`}>
                      {isChecked && '✓'}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="page2-cta-wrapper">
              <Button
                disabled={!isAllConsentsSelected}
                onClick={() => {
                  if (isAllConsentsSelected) {
                    setActivePage(6);
                  }
                }}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* PAGE 6: Confirm Your Details (Step 4 of 5 - Exactly like Figma Screenshot!) */}
        {activePage === 6 && (
          <div className="page-step-container">
            <div className="stepper-bar">
              {[1, 2, 3, 4, 5].map((stepNum) => (
                <div
                  key={stepNum}
                  className={`stepper-item ${stepNum === 4 ? 'active' : stepNum < 4 ? 'completed' : ''}`}
                >
                  <div className="stepper-circle">
                    {stepNum === 4 && <div className="inner-dot"></div>}
                    {stepNum < 4 && <span className="check-icon">✓</span>}
                  </div>
                  <span className="stepper-label">Step {stepNum}</span>
                </div>
              ))}
              <div className="stepper-line-bg">
                <div className="stepper-line-fill" style={{ width: '75%' }}></div>
              </div>
            </div>

            <h1 className="page-heading">Confirm your details</h1>

            <div className="figma-confirm-grid">
              {/* Goal — label + edit icon outside, chips below */}
              <div className="confirm-section">
                <div className="confirm-label-row">
                  <label className="section-meta-label">Goal</label>
                  <span className="edit-icon-btn" onClick={() => setActivePage(2)}>✏️</span>
                </div>
                <div className="chips-row">
                  {selectedGoals.map((g) => (
                    <div key={g} className="figma-chip">
                      {g}
                    </div>
                  ))}
                </div>
              </div>

              {/* Gender, DOB, Weight — label + edit icon OUTSIDE, value box BELOW */}
              <div className="confirm-three-col">
                <div className="confirm-field-wrapper">
                  <div className="confirm-label-row">
                    <span className="section-meta-label">Gender</span>
                    <span className="edit-icon-btn" onClick={() => setActivePage(3)}>✏️</span>
                  </div>
                  <div className="confirm-value-box">
                    <span className="box-val-bold">{gender}</span>
                  </div>
                </div>

                <div className="confirm-field-wrapper">
                  <div className="confirm-label-row">
                    <span className="section-meta-label">Date of birth</span>
                    <span className="edit-icon-btn" onClick={() => setActivePage(3)}>✏️</span>
                  </div>
                  <div className="confirm-value-box">
                    <span className="box-val-bold">  {new Date(dob).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })}</span>
                  </div>
                </div>

                <div className="confirm-field-wrapper">
                  <div className="confirm-label-row">
                    <span className="section-meta-label">Weight</span>
                    <span className="edit-icon-btn" onClick={() => setActivePage(3)}>✏️</span>
                  </div>
                  <div className="confirm-value-box">
                    <span className="box-val-bold">{weightValue} <span className="box-unit">{weightUnit}</span></span>
                  </div>
                </div>
              </div>

              {/* Height, Training exp, Training frequency — label + edit icon OUTSIDE */}
              <div className="confirm-three-col">
                <div className="confirm-field-wrapper">
                  <div className="confirm-label-row">
                    <span className="section-meta-label">Height</span>
                    <span className="edit-icon-btn" onClick={() => setActivePage(3)}>✏️</span>
                  </div>
                  <div className="confirm-value-box">
                    <span className="box-val-bold">{heightValue} <span className="box-unit">{heightUnit}</span></span>
                  </div>
                </div>

                <div className="confirm-field-wrapper">
                  <div className="confirm-label-row">
                    <span className="section-meta-label">Training experience</span>
                    <span className="edit-icon-btn" onClick={() => setActivePage(4)}>✏️</span>
                  </div>
                  <div className="confirm-value-box">
                    <span className="box-val-bold">{yearsExp} <span className="box-unit">years</span></span>
                  </div>
                </div>

                <div className="confirm-field-wrapper">
                  <div className="confirm-label-row">
                    <span className="section-meta-label">Training frequency</span>
                    <span className="edit-icon-btn" onClick={() => setActivePage(4)}>✏️</span>
                  </div>
                  <div className="confirm-value-box">
                    <span className="box-val-bold">{frequency}</span>
                  </div>
                </div>
              </div>

              {/* Injuries or conditions — label + edit icon outside, value box below */}
              <div className="confirm-section">
                <div className="confirm-label-row">
                  <span className="section-meta-label">Injuries or conditions</span>
                  <span className="edit-icon-btn" onClick={() => setActivePage(4)}>✏️</span>
                </div>
                <div className="confirm-value-box full-width">
                  <span className="box-val-muted">{injuries || 'None'}</span>
                </div>
              </div>

              {/* Health consents — label + edit icon outside, chips below */}
              <div className="confirm-section">
                <div className="confirm-label-row">
                  <label className="section-meta-label">Health consents</label>
                  <span className="edit-icon-btn" onClick={() => setActivePage(5)}>✏️</span>
                </div>
                <div className="chips-row">
                  <div className="figma-chip">Data use</div>
                  <div className="figma-chip">Professional visibility</div>
                  <div className="figma-chip">Follow up</div>
                </div>
              </div>
            </div>

            <div className="page2-cta-wrapper">
              <Button onClick={() => setShowAssessmentModal(true)}>Confirm & Continue</Button>
            </div>
          </div>
        )}

        {/* VYONIC ASSESSMENT MODAL POPUP */}
        {showAssessmentModal && (
          <div className="assessment-modal-overlay">
            <div className="assessment-modal-card">
              <h2 className="modal-title">The VYONIC assessment</h2>
              
              <div className="modal-bullet-list">
                <div className="modal-bullet-item">
                  <div className="modal-badge-circle">1</div>
                  <p className="modal-inline-text">
                    <strong>We understand you</strong> - where you are. Who you will become
                  </p>
                </div>

                <div className="modal-bullet-item">
                  <div className="modal-badge-circle">2</div>
                  <p className="modal-inline-text">
                    <strong>We assess you</strong> - a precise read of your body, your habits, your capacity
                  </p>
                </div>

                <div className="modal-bullet-item">
                  <div className="modal-badge-circle">3</div>
                  <p className="modal-inline-text">
                    <strong>We build your program</strong> - training, recovery, mindset: one connected system.
                  </p>
                </div>
              </div>

              <div className="modal-cta-wrapper">
                <Button
                  onClick={() => {
                    setShowAssessmentModal(false);
                    setActivePage(7);
                  }}
                >
                  Begin
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* PAGE 7: Assessment Completed / Final Step */}
        {activePage === 7 && (
          <div className="page-step-container">
            <div className="stepper-bar">
              {[1, 2, 3, 4, 5].map((stepNum) => (
                <div
                  key={stepNum}
                  className={`stepper-item ${stepNum === 5 ? 'active' : 'completed'}`}
                >
                  <div className="stepper-circle">
                    {stepNum === 5 && <div className="inner-dot"></div>}
                    {stepNum < 5 && <span className="check-icon">✓</span>}
                  </div>
                  <span className="stepper-label">Step {stepNum}</span>
                </div>
              ))}
              <div className="stepper-line-bg">
                <div className="stepper-line-fill" style={{ width: '100%' }}></div>
              </div>
            </div>

            <h1 className="page-heading">Assessment Scheduled!</h1>
            <p style={{ color: '#8e9bb0', fontSize: '18px', marginBottom: '32px' }}>
              Your baseline profile and health consents have been verified. Welcome to VYONIC!
            </p>

            <div className="page2-cta-wrapper">
              <Button onClick={() => setActivePage(1)}>Back to Start</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
