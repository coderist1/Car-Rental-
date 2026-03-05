import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks';
import '../../styles/pages/ProfileMenu.css';

const ROLE_LABELS = { owner: 'Vehicle Owner', renter: 'Renter', admin: 'Administrator' };
const ROLE_COLORS = {
  owner:  { bg: 'rgba(63,155,132,.12)',  color: '#2d7a67',  dot: '#3F9B84'  },
  renter: { bg: 'rgba(59,130,246,.12)',  color: '#1d4ed8',  dot: '#3b82f6'  },
  admin:  { bg: 'rgba(168,85,247,.12)',  color: '#7e22ce',  dot: '#a855f7'  },
};

/* SVG icons — no emoji dependency */
const PersonIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"/>
  </svg>
);
const LockIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
);
const BookingsIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
  </svg>
);
const EmailIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
  </svg>
);
const LogoutIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
  </svg>
);
const ChevronRight = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
  </svg>
);

function ProfileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const menuRef   = useRef(null);
  const buttonRef = useRef(null);

  const username    = user?.fullName || user?.firstName || 'Guest';
  const userEmail   = user?.email || '';
  const userRole    = user?.role || 'renter';
  const userInitial = (username.charAt(0) || 'U').toUpperCase();
  const roleStyle   = ROLE_COLORS[userRole] || ROLE_COLORS.renter;
  const roleLabel   = ROLE_LABELS[userRole] || userRole;
  const isAdmin     = userRole === 'admin';

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        menuRef.current   && !menuRef.current.contains(e.target) &&
        buttonRef.current && !buttonRef.current.contains(e.target)
      ) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const go = (path) => { setIsOpen(false); navigate(path); };

  const handleLogout = () => {
    setIsOpen(false);
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="profile-menu-container">
      {/* Avatar button */}
      <button
        ref={buttonRef}
        className="profile-icon-button"
        onClick={() => setIsOpen(o => !o)}
        aria-label="Profile menu"
        aria-expanded={isOpen}
      >
        {userInitial}
      </button>

      {isOpen && (
        <div ref={menuRef} className="pm-dropdown">

          {/* ── Header: avatar + name + role ── */}
          <div className="pm-header">
            <div className="pm-avatar-lg">{userInitial}</div>
            <div className="pm-header-info">
              <p className="pm-name">{username}</p>
              <p className="pm-email">{userEmail}</p>
              <span className="pm-role-badge" style={{ background: roleStyle.bg, color: roleStyle.color }}>
                <span className="pm-role-dot" style={{ background: roleStyle.dot }} />
                {roleLabel}
              </span>
            </div>
          </div>

          {/* ── View Profile button ── */}
          {!isAdmin && (
            <button className="pm-profile-btn" onClick={() => go('/profile')}>
              <PersonIcon />
              <span>View Profile</span>
              <span className="pm-profile-btn-arrow"><ChevronRight /></span>
            </button>
          )}

          <div className="pm-divider" />

          {/* ── Menu items ── */}
          <div className="pm-items">
            {!isAdmin && (
              <>
                <button className="pm-item" onClick={() => go('/change-password')}>
                  <span className="pm-item-icon"><LockIcon /></span>
                  <span>Change Password</span>
                </button>
                <button className="pm-item" onClick={() => go('/bookings')}>
                  <span className="pm-item-icon"><BookingsIcon /></span>
                  <span>My Bookings</span>
                </button>
              </>
            )}
            {isAdmin && (
              <button className="pm-item" onClick={() => go('/email-log')}>
                <span className="pm-item-icon"><EmailIcon /></span>
                <span>Email Log</span>
              </button>
            )}
          </div>

          <div className="pm-divider" />

          {/* ── Logout ── */}
          <button className="pm-item pm-logout" onClick={handleLogout}>
            <span className="pm-item-icon"><LogoutIcon /></span>
            <span>Logout</span>
          </button>

        </div>
      )}
    </div>
  );
}

export default ProfileMenu;