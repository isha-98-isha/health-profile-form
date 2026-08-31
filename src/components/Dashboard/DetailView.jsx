import React from 'react';
import { FiMail, FiPhone } from 'react-icons/fi';

const infoRows = [
  ['Assessment goal', 'assessment_goal'],
  ['Height', 'height'],
  ['Weight', 'weight'],
  ['Previous training experience', 'previous_training_experience'],
  ['Weekly training frequency', 'weekly_training_frequency'],
  ['Injury & medical notes', 'injury_medical_notes']
];

export default function DetailView({
  data,
  variant = 'assessment',
  onOpenAssessment = () => {},
  onCancelAssessment = () => {},
  onRescheduleAssessment = () => {},
  onStartAssessment = () => {},
  onOpenClientDetails = () => {}
}) {
  if (!data) return null;

  const rows = variant === 'client'
    ? [
        ['Assessment goal', 'assessment_goal'],
        ['Height', 'height'],
        ['Weight', 'weight'],
        ['Previous training experience', 'previous_training_experience'],
        ['Weekly training frequency', 'weekly_training_frequency'],
        ['Injury & medical notes', 'injury_medical_notes']
      ]
    : infoRows;

  return (
    <div className="vy-detail-column">
      <div className="vy-detail-header-card">
        <div className="vy-detail-top-row">
          <div className="vy-detail-profile-row">
            <div className="vy-detail-avatar"><span>{data.initials}</span></div>
            <div className="vy-detail-title-group">
              <h2 className="vy-detail-name">{data.name}</h2>
              <span className="vy-detail-id-tag">{data.assessment_id}</span>
            </div>
          </div>
          <div className="vy-detail-badge-wrap">
            <span className={`vy-status-badge ${variant === 'client' ? 'client' : data.booking_status}`}>
              {variant === 'client' ? 'Client' : data.booking_status}
            </span>
          </div>
        </div>
        {variant !== 'client' && <div className="vy-detail-meta-grid">
          <div className="vy-meta-item">
            <div className="vy-meta-title">{data.address || data.location || '-'}</div>
            <div className="vy-meta-sub">{data.assessment_type || data.email || 'Client'}</div>
          </div>
          <div className="vy-meta-item">
            <div className="vy-meta-sub-date">{data.date}</div>
            <div className="vy-meta-highlight">{data.time_slot}</div>
            <div className="vy-meta-sub">{data.attendance || data.phone || '-'}</div>
          </div>
          <div className="vy-meta-item">
            <div className="vy-meta-highlight">{data.duration}</div>
            <div className="vy-meta-sub">{variant === 'client' ? 'Registered' : 'Duration'}</div>
          </div>
        </div>}
      </div>

      <div className="vy-info-card">
        <h3 className="vy-card-section-title">{variant === 'client' ? 'Client info' : 'Assessment info'}</h3>
        <div className="vy-info-table">
          {rows.map(([label, key]) => (
            <div className="vy-info-row" key={key}>
              <span className="vy-info-label">{label}</span>
              <span className="vy-info-value">{data[key] || '-'}</span>
            </div>
          ))}
          {variant !== 'client' && data.booking_status === 'cancelled' && data.cancel_reason && (
            <div className="vy-info-row">
              <span className="vy-info-label">Cancellation reason</span>
              <span className="vy-info-value">{data.cancel_reason}</span>
            </div>
          )}
        </div>
      </div>

      <div className="vy-info-card">
        <h3 className="vy-card-section-title">Contact info</h3>
        <div className="vy-contact-grid">
          <div className="vy-contact-item"><span className="vy-contact-label">Email</span><div className="vy-contact-val"><FiMail className="contact-icon" /><span>{data.email}</span></div></div>
          <div className="vy-contact-item"><span className="vy-contact-label">Phone</span><div className="vy-contact-val"><FiPhone className="contact-icon" /><span>{data.phone}</span></div></div>
        </div>
      </div>

      {variant === 'client' && (
        <div className="vy-action-buttons-row">
          <button className="vy-btn-primary" onClick={() => onOpenClientDetails(data)}>
            Open client details
          </button>
        </div>
      )}

      {variant === 'assessment' && data.booking_status === 'completed' && (
        <div className="vy-action-buttons-row">
          <button className="vy-btn-primary" onClick={() => onOpenAssessment(data)}>
            Open assessment
          </button>
        </div>
      )}

      {variant === 'assessment' && data.booking_status === 'scheduled' && (
        <div className="vy-action-buttons-row">
          <button className="vy-btn-danger-outline" onClick={() => onCancelAssessment(data)}>
            Cancel assessment
          </button>
          <button className="vy-btn-secondary" onClick={() => onRescheduleAssessment(data)}>
            Reschedule
          </button>
          <button className="vy-btn-primary" onClick={() => onStartAssessment(data)}>
            Start assessment
          </button>
        </div>
      )}
    </div>
  );
}
