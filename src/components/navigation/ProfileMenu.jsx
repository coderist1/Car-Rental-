import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks';
import '../../styles/components/ProfileMenu.css';

function ProfileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  const username = user?.fullName || user?.firstName || 'Guest';
  const userEmail = user?.email || 'user@example.com';
  const userInitial = (username.charAt(0) || 'U').toUpperCase();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleAction = (action) => {
    setIsOpen(false);
    switch (action) {
      case 'profile':
        navigate('/profile');
        break;
      case 'change-password':
        navigate('/change-password');
        break;
      case 'bookings':
        navigate('/bookings');
        break;
      case 'email-log':
        navigate('/email-log');
        break;
      case 'logout':
        if (window.confirm('Are you sure you want to logout?')) {
          logout();
          navigate('/login');
        }
        break;
      default:
        break;
    }
  };

  return (
    <div className="profile-menu-container">
      <button 
        ref={buttonRef}
        className="profile-icon-button" 
        onClick={handleToggle}
        aria-label="Profile menu"
      >
        {userInitial}
      </button>

      {isOpen && (
        <div ref={menuRef} className="dropdown-menu">
          <div className="dropdown-header">
            <div className="user-avatar">{userInitial}</div>
            <div className="user-details">
              <div className="user-name">{username}</div>
              <div className="user-email">{userEmail}</div>
            </div>
          </div>

          <div className="dropdown-divider" />

          <div className="dropdown-items">
            {!isAdmin && (
              <>
                <button className="dropdown-item" onClick={() => handleAction('profile')}>
                  <span className="item-icon">👤</span>
                  <span>Edit Profile</span>
                </button>
                <button className="dropdown-item" onClick={() => handleAction('change-password')}>
                  <span className="item-icon">🔒</span>
                  <span>Change Password</span>
                </button>
                <button className="dropdown-item" onClick={() => handleAction('bookings')}>
                  <span className="item-icon">📋</span>
                  <span>Bookings</span>
                </button>
              </>
            )}
            {isAdmin && (
              <button className="dropdown-item" onClick={() => handleAction('email-log')}>
                <span className="item-icon">📧</span>
                <span>Email Log</span>
              </button>
            )}
          </div>

          <div className="dropdown-divider" />

          <button className="dropdown-item logout-item" onClick={() => handleAction('logout')}>
            <span className="item-icon">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default ProfileMenu;
