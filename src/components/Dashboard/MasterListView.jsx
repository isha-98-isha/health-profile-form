import React from 'react';
import { FiArrowUpRight } from 'react-icons/fi';

export default function MasterListView({
  items,
  selectedId,
  onSelect,
  loading,
  emptyMessage = 'No records found.',
  loadingMessage = 'Loading...',
  showDate = true,
  showTime = true,
  showEmail = false
}) {
  if (loading) {
    return <div className="vy-empty-state">{loadingMessage}</div>;
  }

  if (items.length === 0) {
    return <div className="vy-empty-state">{emptyMessage}</div>;
  }

  return items.map((item) => (
    <div
      key={item.id}
      className={`vy-assessment-card ${selectedId === item.id ? 'selected' : ''}`}
      onClick={() => onSelect(item.id)}
    >
      <div className="vy-card-avatar"><span>{item.initials}</span></div>
      <div className="vy-card-body">
        <div className="vy-card-name">{item.name}</div>
        {showDate && <div className="vy-card-date">{item.date}</div>}
        {showEmail && <div className="vy-card-date">{item.email}</div>}
        {showTime && <div className="vy-card-time-pill"><span>{item.time_slot}</span></div>}
      </div>
      <div className="vy-card-action">
        <button className="vy-arrow-btn" tabIndex={-1} aria-label={`Open ${item.name}`}>
          <FiArrowUpRight />
        </button>
      </div>
    </div>
  ));
}
