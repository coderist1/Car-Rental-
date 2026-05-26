import React from 'react';
import '../styles/components/EmptyState.css';

export default function EmptyState({ icon, title, description, action, className = '' }) {
  return (
    <div className={`empty-state-card ${className}`.trim()}>
      {icon ? <div className="empty-state-card__icon" aria-hidden="true">{icon}</div> : null}
      {title ? <h3 className="empty-state-card__title">{title}</h3> : null}
      {description ? <p className="empty-state-card__description">{description}</p> : null}
      {action ? <div className="empty-state-card__action">{action}</div> : null}
    </div>
  );
}
