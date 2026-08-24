import React, { useState, useRef, useEffect, useMemo } from 'react';
import { allCountries } from 'country-telephone-data';
import './CountryCodeSelect.css';

// Clean country names and prepare structured list
const formatCountryList = () => {
  const seen = new Set();
  const list = [];

  for (const c of allCountries) {
    const iso2 = (c.iso2 || '').toUpperCase();
    const dialCode = `+${c.dialCode}`;
    const cleanName = (c.name || '').replace(/\s*\([^)]*\)/g, '').trim();
    const key = `${iso2}_${dialCode}`;

    if (!seen.has(key)) {
      seen.add(key);
      list.push({
        iso2,
        dialCode,
        name: cleanName,
        rawName: c.name,
      });
    }
  }

  return list;
};

const ALL_FORMATTED_COUNTRIES = formatCountryList();

// Default popular ISOs if user hasn't searched
const POPULAR_ISOS = ['AE', 'US', 'GB', 'IN', 'CA', 'AU', 'AR', 'AT', 'BE', 'BR', 'DE', 'FR', 'IT', 'ES', 'MX', 'SG', 'SA'];

const CountryCodeSelect = ({
  value = '+971',
  defaultIso = 'AE',
  onChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Find currently selected country
  const selectedCountry = useMemo(() => {
    // Try matching both dialCode and defaultIso first
    const exactMatch = ALL_FORMATTED_COUNTRIES.find(
      (c) => c.dialCode === value && (defaultIso ? c.iso2 === defaultIso.toUpperCase() : true)
    );
    if (exactMatch) return exactMatch;

    // Fallback to match by dialCode
    const dialMatch = ALL_FORMATTED_COUNTRIES.find((c) => c.dialCode === value);
    if (dialMatch) return dialMatch;

    // Default to AE (+971)
    return ALL_FORMATTED_COUNTRIES.find((c) => c.iso2 === 'AE') || {
      iso2: 'AE',
      dialCode: '+971',
      name: 'United Arab Emirates',
    };
  }, [value, defaultIso]);

  // Filtered countries based on search
  const filteredCountries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase().replace(/^\+/, '');
    if (!q) {
      // Sort with popular countries first, then the rest alphabetically
      const popular = [];
      const others = [];

      for (const iso of POPULAR_ISOS) {
        const found = ALL_FORMATTED_COUNTRIES.find((c) => c.iso2 === iso);
        if (found && !popular.some((p) => p.iso2 === found.iso2 && p.dialCode === found.dialCode)) {
          popular.push(found);
        }
      }

      for (const c of ALL_FORMATTED_COUNTRIES) {
        if (!popular.some((p) => p.iso2 === c.iso2 && p.dialCode === c.dialCode)) {
          others.push(c);
        }
      }

      return { popular, others, isSearching: false };
    }

    const matches = ALL_FORMATTED_COUNTRIES.filter((c) => {
      const matchName = c.name.toLowerCase().includes(q);
      const matchIso = c.iso2.toLowerCase().includes(q);
      const matchDial = c.dialCode.replace(/^\+/, '').includes(q);
      return matchName || matchIso || matchDial;
    });

    return { results: matches, isSearching: true };
  }, [searchQuery]);

  // Handle outside clicks
  useEffect(() => {
    const handlePointerDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('pointerdown', handlePointerDown);
    }
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isOpen]);

  // Auto focus search input on open
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 50);
    }
  }, [isOpen]);

  const handleSelectCountry = (country) => {
    if (onChange) {
      onChange(country.dialCode, country);
    }
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCountries.isSearching && filteredCountries.results?.length > 0) {
        handleSelectCountry(filteredCountries.results[0]);
      } else if (!filteredCountries.isSearching && filteredCountries.popular?.length > 0) {
        handleSelectCountry(filteredCountries.popular[0]);
      }
    }
  };

  return (
    <div className="country-code-select-container" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        className={`country-code-trigger-btn ${isOpen ? 'active' : ''}`}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="selected-country-iso">{selectedCountry.iso2}</span>
        <span className="selected-country-dial">{selectedCountry.dialCode}</span>
        <span className={`country-chevron-icon ${isOpen ? 'open' : ''}`}>▾</span>
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="country-code-dropdown-popover" role="listbox" onKeyDown={handleKeyDown}>
          {/* Search Box */}
          <div className="country-search-box-wrapper">
            <input
              ref={searchInputRef}
              type="text"
              className="country-search-input"
              placeholder="Search country or code"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* List Section */}
          <div className="country-list-scroll-area">
            {!filteredCountries.isSearching ? (
              <>
                <div className="country-list-section-title">POPULAR</div>
                {filteredCountries.popular.map((country) => {
                  const isSelected =
                    country.iso2 === selectedCountry.iso2 &&
                    country.dialCode === selectedCountry.dialCode;
                  return (
                    <div
                      key={`${country.iso2}_${country.dialCode}`}
                      className={`country-list-item-row ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelectCountry(country)}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <span className="country-row-iso">{country.iso2}</span>
                      <span className="country-row-dial">{country.dialCode}</span>
                      <span className="country-row-name">{country.name}</span>
                    </div>
                  );
                })}

                {filteredCountries.others.length > 0 && (
                  <>
                    <div className="country-list-section-title">ALL COUNTRIES</div>
                    {filteredCountries.others.map((country) => {
                      const isSelected =
                        country.iso2 === selectedCountry.iso2 &&
                        country.dialCode === selectedCountry.dialCode;
                      return (
                        <div
                          key={`${country.iso2}_${country.dialCode}`}
                          className={`country-list-item-row ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleSelectCountry(country)}
                          role="option"
                          aria-selected={isSelected}
                        >
                          <span className="country-row-iso">{country.iso2}</span>
                          <span className="country-row-dial">{country.dialCode}</span>
                          <span className="country-row-name">{country.name}</span>
                        </div>
                      );
                    })}
                  </>
                )}
              </>
            ) : (
              <>
                {filteredCountries.results.length === 0 ? (
                  <div className="country-no-results">No countries found</div>
                ) : (
                  filteredCountries.results.map((country) => {
                    const isSelected =
                      country.iso2 === selectedCountry.iso2 &&
                      country.dialCode === selectedCountry.dialCode;
                    return (
                      <div
                        key={`${country.iso2}_${country.dialCode}`}
                        className={`country-list-item-row ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleSelectCountry(country)}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <span className="country-row-iso">{country.iso2}</span>
                        <span className="country-row-dial">{country.dialCode}</span>
                        <span className="country-row-name">{country.name}</span>
                      </div>
                    );
                  })
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CountryCodeSelect;
