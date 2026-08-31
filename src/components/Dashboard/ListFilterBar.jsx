import React from 'react';
import { FiPlus, FiSearch } from 'react-icons/fi';

export default function ListFilterBar({
  filters,
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  showSearchInput,
  onToggleSearch,
  searchPlaceholder,
  actionLabel,
  onAction
}) {
  return (
    <div className="vy-action-bar">
      <div className="vy-action-left"><h2 className="vy-section-heading">{actionLabel.heading}</h2></div>
      <div className="vy-action-right">
        <div className="vy-filters-group">
          {filters.map((filter) => (
            <button
              key={filter.id}
              className={`vy-filter-pill ${activeFilter === filter.id ? 'active' : ''}`}
              onClick={() => onFilterChange(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className={`vy-search-container ${showSearchInput ? 'open' : ''}`}>
          {showSearchInput && (
            <input
              type="text"
              className="vy-search-input"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              autoFocus
            />
          )}
          <button className="vy-icon-btn vy-search-btn" onClick={onToggleSearch} title="Search" aria-label="Search">
            <FiSearch />
          </button>
        </div>
        <button className="vy-new-assessment-btn" onClick={onAction}>
          <FiPlus className="plus-icon" />
          <span>{actionLabel.button}</span>
        </button>
      </div>
    </div>
  );
}
