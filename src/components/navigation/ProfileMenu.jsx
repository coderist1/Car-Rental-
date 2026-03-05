import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks';
import '../../styles/pages/ProfileMenu.css';

<<<<<<< HEAD
const ROLE_LABELS = { owner: 'Vehicle Owner', renter: 'Renter', admin: 'Administrator' };
=======
const ROLE_LABELS = { 
  owner: 'Vehicle Owner', 
  renter: 'Renter', 
  admin: 'Administrator' 
};

>>>>>>> origin/angela_app
const ROLE_COLORS = {
  owner:  { bg: 'rgba(63,155,132,.12)',  color: '#2d7a67',  dot: '#3F9B84'  },
  renter: { bg: 'rgba(59,130,246,.12)',  color: '#1d4ed8',  dot: '#3b82f6'  },
  admin:  { bg: 'rgba(168,85,247,.12)',  color: '#7e22ce',  dot: '#a855f7'  },
};

<<<<<<< HEAD
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
=======
// SVG icons
const PersonIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"/>
  </svg>
);

const LockIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
);

const BookingsIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
  </svg>
);

const EmailIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
  </svg>
);

const LogoutIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
  </svg>
);

const ChevronRight = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
>>>>>>> origin/angela_app
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
  </svg>
);

function ProfileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const menuRef   = useRef(null);
  const buttonRef = useRef(null);

<<<<<<< HEAD
  const username    = user?.fullName || user?.firstName || 'Guest';
  const userEmail   = user?.email || '';
  const userRole    = user?.role || 'renter';
  const userInitial = (username.charAt(0) || 'U').toUpperCase();
  const roleStyle   = ROLE_COLORS[userRole] || ROLE_COLORS.renter;
  const roleLabel   = ROLE_LABELS[userRole] || userRole;
  const isAdmin     = userRole === 'admin';
=======
  const username = user?.fullName || user?.firstName || 'Guest';
  const userEmail = user?.email || '';
  const userRole = user?.role || 'renter';
  const userInitial = (username.charAt(0) || 'U').toUpperCase();
  const userAvatar = user?.avatar;
  const roleStyle = ROLE_COLORS[userRole] || ROLE_COLORS.renter;
  const roleLabel = ROLE_LABELS[userRole] || userRole;
  const isAdmin = userRole === 'admin';
>>>>>>> origin/angela_app

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
<<<<<<< HEAD
        menuRef.current   && !menuRef.current.contains(e.target) &&
        buttonRef.current && !buttonRef.current.contains(e.target)
      ) setIsOpen(false);
    };
=======
        menuRef.current && !menuRef.current.contains(e.target) &&
        buttonRef.current && !buttonRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    
>>>>>>> origin/angela_app
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

<<<<<<< HEAD
  const go = (path) => { setIsOpen(false); navigate(path); };
=======
  const handleNavigate = (path) => {
    setIsOpen(false);
    navigate(path);
  };
>>>>>>> origin/angela_app

  const handleLogout = () => {
    setIsOpen(false);
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="profile-menu-container">
<<<<<<< HEAD
      {/* Avatar button */}
      <button
        ref={buttonRef}
        className="profile-icon-button"
        onClick={() => setIsOpen(o => !o)}
        aria-label="Profile menu"
        aria-expanded={isOpen}
=======
      {/* Avatar button (Trigger) */}
      <button
        ref={buttonRef}
        className={`profile-icon-button ${userAvatar ? 'has-img' : ''}`}
        type="button"
        onClick={() => setIsOpen(o => !o)}
        aria-label="Open profile menu"
        aria-expanded={isOpen}
        aria-haspopup="menu"
>>>>>>> origin/angela_app
      >
        {userAvatar ? (
          <img src={userAvatar} alt={`${username} profile photo`} className="pm-btn-img" />
        ) : (
          <span aria-hidden="true">{userInitial}</span>
        )}
      </button>

      {isOpen && (
<<<<<<< HEAD
        <div ref={menuRef} className="pm-dropdown">

          {/* ── Header: avatar + name + role ── */}
          <div className="pm-header">
            <div className="pm-avatar-lg">{userInitial}</div>
=======
        <div ref={menuRef} className="pm-dropdown" role="menu">

          {/* ── Header: avatar + name + role ── */}
          <div className="pm-header">
            <div className={`pm-avatar-lg ${userAvatar ? 'has-img' : ''}`}>
              {userAvatar ? (
                <img src={userAvatar} alt={`${username} profile photo`} className="pm-header-img" />
              ) : (
                <span aria-hidden="true">{userInitial}</span>
              )}
            </div>
>>>>>>> origin/angela_app
            <div className="pm-header-info">
              <p className="pm-name">{username}</p>
              <p className="pm-email">{userEmail}</p>
              <span className="pm-role-badge" style={{ background: roleStyle.bg, color: roleStyle.color }}>
<<<<<<< HEAD
                <span className="pm-role-dot" style={{ background: roleStyle.dot }} />
=======
                <span className="pm-role-dot" style={{ background: roleStyle.dot }} aria-hidden="true" />
>>>>>>> origin/angela_app
                {roleLabel}
              </span>
            </div>
          </div>

          {/* ── View Profile button ── */}
          {!isAdmin && (
<<<<<<< HEAD
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
=======
            <button 
              className="pm-profile-btn" 
              type="button"
              role="menuitem"
              onClick={() => handleNavigate('/profile')}
              aria-label="View full profile"
            >
              <PersonIcon />
              <span>View Profile</span>
              <span className="pm-profile-btn-arrow" aria-hidden="true"><ChevronRight /></span>
            </button>
          )}

          <div className="pm-divider" role="separator" aria-hidden="true" />

          {/* ── Menu items ── */}
          <div className="pm-items" role="none">
            {!isAdmin && (
              <>
                <button 
                  className="pm-item" 
                  type="button"
                  role="menuitem"
                  onClick={() => handleNavigate('/change-password')}
                  aria-label="Change account password"
                >
                  <span className="pm-item-icon" aria-hidden="true"><LockIcon /></span>
                  <span>Change Password</span>
                </button>
                <button 
                  className="pm-item" 
                  type="button"
                  role="menuitem"
                  onClick={() => handleNavigate('/bookings')}
                  aria-label="View my bookings"
                >
                  <span className="pm-item-icon" aria-hidden="true"><BookingsIcon /></span>
>>>>>>> origin/angela_app
                  <span>My Bookings</span>
                </button>
              </>
            )}
            {isAdmin && (
<<<<<<< HEAD
              <button className="pm-item" onClick={() => go('/email-log')}>
                <span className="pm-item-icon"><EmailIcon /></span>
=======
              <button 
                className="pm-item" 
                type="button"
                role="menuitem"
                onClick={() => handleNavigate('/email-log')}
                aria-label="View email log"
              >
                <span className="pm-item-icon" aria-hidden="true"><EmailIcon /></span>
>>>>>>> origin/angela_app
                <span>Email Log</span>
              </button>
            )}
          </div>

<<<<<<< HEAD
          <div className="pm-divider" />

          {/* ── Logout ── */}
          <button className="pm-item pm-logout" onClick={handleLogout}>
            <span className="pm-item-icon"><LogoutIcon /></span>
=======
          <div className="pm-divider" role="separator" aria-hidden="true" />

          {/* ── Logout ── */}
          <button 
            className="pm-item pm-logout" 
            type="button"
            role="menuitem"
            onClick={handleLogout}
            aria-label="Logout from account"
          >
            <span className="pm-item-icon" aria-hidden="true"><LogoutIcon /></span>
>>>>>>> origin/angela_app
            <span>Logout</span>
          </button>

        </div>
      )}
    </div>
  );
}

export default ProfileMenu;