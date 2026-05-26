import React from 'react';
import '../styles/components/MobileNavToggle.css';

export default function MobileNavToggle({ open, onToggle, label = 'Menu' }) {
  return (
    <button
      type="button"
      className={`mobile-nav-toggle ${open ? 'is-open' : ''}`}
      onClick={onToggle}
      aria-expanded={open}
      aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
    >
      <span className="mobile-nav-toggle__bars" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span className="mobile-nav-toggle__label">{label}</span>
    </button>
  );
}
