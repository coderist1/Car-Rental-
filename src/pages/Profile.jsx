import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks';
import '../styles/pages/Profile.css';

const ROLE_LABELS = { 
  owner: 'Vehicle Owner', 
  renter: 'Renter', 
  admin: 'Administrator' 
};

const ROLE_COLORS = {
  owner:  { bg: 'rgba(63,155,132,.12)',  color: '#2d7a67',  dot: '#3F9B84'  },
  renter: { bg: 'rgba(59,130,246,.12)',  color: '#1d4ed8',  dot: '#3b82f6'  },
  admin:  { bg: 'rgba(168,85,247,.12)',  color: '#7e22ce',  dot: '#a855f7'  },
};

function Profile() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [formData, setFormData] = useState({
    firstName: '', 
    lastName: '', 
    middleName: '',
    sex: '', 
    dateOfBirth: '', 
    email: '', 
    phone: '',
  });

  const [savedData, setSavedData] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [hasNewPhoto, setHasNewPhoto] = useState(false);
  const [isConfirmingPhoto, setIsConfirmingPhoto] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const userRole = user?.role || 'renter';
  const roleStyle = ROLE_COLORS[userRole] || ROLE_COLORS.renter;
  const roleLabel = ROLE_LABELS[userRole] || userRole;

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        middleName: user.middleName || '',
        sex: user.sex || '',
        dateOfBirth: user.dateOfBirth || '',
        email: user.email || '',
        phone: user.phone || '',
      });
      if (user.avatar) {
        setAvatar(user.avatar);
      }
    }
  }, [user]);

  const getInitials = () => {
    const f = formData.firstName?.charAt(0) || '';
    const l = formData.lastName?.charAt(0) || '';
    return (f + l).toUpperCase() || 'U';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setAvatar(reader.result);
      if (!isEditing) {
        setHasNewPhoto(true);
        setIsConfirmingPhoto(false);
        setErrors({});
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhotoClick = () => {
    setAvatar(null);
    setHasNewPhoto(true);
    setIsConfirmingPhoto(false);
  };

  const handleSavePhotoOnly = async () => {
    setLoading(true);
    try {
      const result = await updateProfile({
        ...user,
        avatar,
      });
      if (result?.success !== false) {
        setShowSuccess(true);
        setHasNewPhoto(false);
        setIsConfirmingPhoto(false);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPhoto = () => {
    setAvatar(user?.avatar || null);
    setHasNewPhoto(false);
    setIsConfirmingPhoto(false);
    if (fileRef.current) {
      fileRef.current.value = '';
    }
  };

  const validate = () => {
    const errorObj = {};
    
    if (!formData.firstName.trim()) {
      errorObj.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      errorObj.lastName = 'Last name is required';
    }
    if (!formData.email.trim()) {
      errorObj.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errorObj.email = 'Invalid email format';
    }
    if (!formData.sex) {
      errorObj.sex = 'Please select sex';
    }
    if (!formData.dateOfBirth) {
      errorObj.dateOfBirth = 'Date of birth is required';
    }
    
    setErrors(errorObj);
    return Object.keys(errorObj).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await updateProfile({
        ...formData,
        fullName: `${formData.firstName} ${formData.lastName}`.trim(),
        avatar,
      });
      if (result?.success !== false) {
        setShowSuccess(true);
        setIsEditing(false);
        setHasNewPhoto(false);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = () => {
    setSavedData({ ...formData });
    setErrors({});
    setIsEditing(true);
    setHasNewPhoto(false);
  };

  const handleCancelEdit = () => {
    if (savedData) {
      setFormData(savedData);
    }
    setAvatar(user?.avatar || null);
    setErrors({});
    setIsEditing(false);
  };

  const fullName = [formData.firstName, formData.lastName]
    .filter(Boolean)
    .join(' ') || 'Your Name';

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
      })
    : null;

  return (
    <div className="profile-page">
      <div className="profile-topbar">
        <button
          className="prof-back-btn"
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Go back to previous page"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </button>
        <h1 className="profile-topbar-title">My Profile</h1>
        <div style={{ width: 80 }} />
      </div>

      <div className="profile-layout">
        <aside className="profile-sidebar" aria-label="User profile information">
          <div className="sidebar-avatar-wrap">
            <div
              className="sidebar-avatar"
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileRef.current?.click();
                }
              }}
              role="button"
              tabIndex="0"
              aria-label="Click to change profile photo"
            >
              {avatar ? (
                <img
                  src={avatar}
                  alt="User profile photo"
                  className="sidebar-avatar-img"
                />
              ) : (
                <span className="sidebar-avatar-initials">{getInitials()}</span>
              )}
              <div className="sidebar-avatar-overlay" aria-hidden="true">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"
                  />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                <span>Change Photo</span>
              </div>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
              aria-label="Upload new profile photo"
            />

            {showSuccess && !isEditing && (
              <div className="sidebar-success-msg" role="status" aria-live="polite">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Profile Updated!
              </div>
            )}

            {avatar && !hasNewPhoto && !isEditing && (
              <button
                className="sidebar-remove-photo-btn"
                type="button"
                onClick={handleRemovePhotoClick}
                aria-label="Remove current profile photo"
              >
                Remove Photo
              </button>
            )}

            {hasNewPhoto && !isEditing && (
              <div className="photo-confirm-wrapper">
                {!isConfirmingPhoto ? (
                  <div className="photo-confirm-actions">
                    <button
                      type="button"
                      className="photo-btn save"
                      onClick={() => setIsConfirmingPhoto(true)}
                      aria-label="Review photo changes"
                    >
                      Apply Change
                    </button>
                    <button
                      type="button"
                      className="photo-btn cancel"
                      onClick={handleCancelPhoto}
                      aria-label="Cancel photo changes"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="photo-confirmation-dialog" role="dialog" aria-labelledby="photo-confirm-title">
                    <p className="photo-confirm-text" id="photo-confirm-title">
                      Confirm this change?
                    </p>
                    <div className="photo-confirm-btns">
                      <button
                        type="button"
                        className="photo-confirm-yes"
                        onClick={handleSavePhotoOnly}
                        disabled={loading}
                        aria-label="Confirm photo change"
                      >
                        {loading ? '...' : 'Yes'}
                      </button>
                      <button
                        type="button"
                        className="photo-confirm-no"
                        onClick={() => setIsConfirmingPhoto(false)}
                        disabled={loading}
                        aria-label="Cancel photo change confirmation"
                      >
                        No
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!hasNewPhoto && !showSuccess && (
              <p className="sidebar-avatar-hint">Click photo to change</p>
            )}
          </div>

          <div className="sidebar-info">
            <p className="sidebar-fullname">{fullName}</p>
            <span
              className="sidebar-role-badge"
              style={{ background: roleStyle.bg, color: roleStyle.color }}
            >
              <span
                className="sidebar-role-dot"
                style={{ background: roleStyle.dot }}
                aria-hidden="true"
              />
              {roleLabel}
            </span>
            {formData.email && (
              <p className="sidebar-email">
                <strong>Email:</strong> {formData.email}
              </p>
            )}
            {formData.phone && (
              <p className="sidebar-phone">
                <strong>Phone:</strong> {formData.phone}
              </p>
            )}
            {memberSince && (
              <p className="sidebar-since">Member since {memberSince}</p>
            )}
          </div>

          <nav className="sidebar-links" aria-label="User navigation menu">
            <button
              className="sidebar-link"
              type="button"
              onClick={() => navigate('/change-password')}
              aria-label="Navigate to change password page"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 11V7a5 5 0 0110 0v4"
                />
              </svg>
              Change Password
            </button>
            {userRole !== 'admin' && (
              <button
                className="sidebar-link"
                type="button"
                onClick={() => navigate('/bookings')}
                aria-label="Navigate to my bookings page"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                My Bookings
              </button>
            )}
          </nav>
        </aside>

        <main className="profile-form-panel">
          <header className="form-panel-header">
            {isEditing ? (
              <>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#3F9B84"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                <span>Edit Personal Information</span>
              </>
            ) : (
              <>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#3F9B84"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <h2>Personal Information</h2>
                <button
                  className="prof-edit-btn"
                  type="button"
                  onClick={handleStartEdit}
                  aria-label="Edit personal information"
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Edit Profile
                </button>
              </>
            )}
          </header>

          {!isEditing && (
            <section className="profile-view" aria-label="Profile information display">
              <h3 className="form-section-label">Name</h3>
              <div className="prof-view-grid">
                <div className="prof-view-field">
                  <span className="prof-view-label">First Name</span>
                  <span className="prof-view-value">
                    {formData.firstName || <em className="prof-empty">Not set</em>}
                  </span>
                </div>
                <div className="prof-view-field">
                  <span className="prof-view-label">Last Name</span>
                  <span className="prof-view-value">
                    {formData.lastName || <em className="prof-empty">Not set</em>}
                  </span>
                </div>
                <div className="prof-view-field">
                  <span className="prof-view-label">Middle Name</span>
                  <span className="prof-view-value">
                    {formData.middleName || <em className="prof-empty">Not set</em>}
                  </span>
                </div>
              </div>

              <h3 className="form-section-label">Details</h3>
              <div className="prof-view-grid">
                <div className="prof-view-field">
                  <span className="prof-view-label">Sex</span>
                  <span
                    className="prof-view-value"
                    style={{ textTransform: 'capitalize' }}
                  >
                    {formData.sex || <em className="prof-empty">Not set</em>}
                  </span>
                </div>
                <div className="prof-view-field">
                  <span className="prof-view-label">Date of Birth</span>
                  <span className="prof-view-value">
                    {formData.dateOfBirth
                      ? new Date(formData.dateOfBirth).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : <em className="prof-empty">Not set</em>}
                  </span>
                </div>
              </div>

              <h3 className="form-section-label">Contact</h3>
              <div className="prof-view-grid">
                <div className="prof-view-field">
                  <span className="prof-view-label">Email Address</span>
                  <span className="prof-view-value">
                    {formData.email || <em className="prof-empty">Not set</em>}
                  </span>
                </div>
                <div className="prof-view-field">
                  <span className="prof-view-label">Phone Number</span>
                  <span className="prof-view-value">
                    {formData.phone || <em className="prof-empty">Not set</em>}
                  </span>
                </div>
              </div>
            </section>
          )}

          {isEditing && (
            <form className="profile-form" onSubmit={handleSubmit} noValidate>
              <fieldset>
                <legend className="form-section-label">Name</legend>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName" className="form-label">
                      First Name <span className="req">*</span>
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      name="firstName"
                      className={`form-input ${errors.firstName ? 'input-error' : ''}`}
                      placeholder="First name"
                      value={formData.firstName}
                      onChange={handleChange}
                      aria-invalid={!!errors.firstName}
                      aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                    />
                    {errors.firstName && (
                      <span id="firstName-error" className="error-msg">
                        {errors.firstName}
                      </span>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName" className="form-label">
                      Last Name <span className="req">*</span>
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      name="lastName"
                      className={`form-input ${errors.lastName ? 'input-error' : ''}`}
                      placeholder="Last name"
                      value={formData.lastName}
                      onChange={handleChange}
                      aria-invalid={!!errors.lastName}
                      aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                    />
                    {errors.lastName && (
                      <span id="lastName-error" className="error-msg">
                        {errors.lastName}
                      </span>
                    )}
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="middleName" className="form-label">
                      Middle Name <span className="opt">(Optional)</span>
                    </label>
                    <input
                      id="middleName"
                      type="text"
                      name="middleName"
                      className="form-input"
                      placeholder="Middle name"
                      value={formData.middleName}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </fieldset>

              <fieldset>
                <legend className="form-section-label">Details</legend>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="sex" className="form-label">
                      Sex <span className="req">*</span>
                    </label>
                    <select
                      id="sex"
                      name="sex"
                      className={`form-input form-select ${errors.sex ? 'input-error' : ''}`}
                      value={formData.sex}
                      onChange={handleChange}
                      aria-invalid={!!errors.sex}
                      aria-describedby={errors.sex ? 'sex-error' : undefined}
                    >
                      <option value="">Select sex</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                    {errors.sex && (
                      <span id="sex-error" className="error-msg">
                        {errors.sex}
                      </span>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="dateOfBirth" className="form-label">
                      Date of Birth <span className="req">*</span>
                    </label>
                    <input
                      id="dateOfBirth"
                      type="date"
                      name="dateOfBirth"
                      className={`form-input ${errors.dateOfBirth ? 'input-error' : ''}`}
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      aria-invalid={!!errors.dateOfBirth}
                      aria-describedby={errors.dateOfBirth ? 'dateOfBirth-error' : undefined}
                    />
                    {errors.dateOfBirth && (
                      <span id="dateOfBirth-error" className="error-msg">
                        {errors.dateOfBirth}
                      </span>
                    )}
                  </div>
                </div>
              </fieldset>

              <fieldset>
                <legend className="form-section-label">Contact</legend>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="email" className="form-label">
                      Email Address <span className="req">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      className={`form-input ${errors.email ? 'input-error' : ''}`}
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? 'email-error' : undefined}
                    />
                    {errors.email && (
                      <span id="email-error" className="error-msg">
                        {errors.email}
                      </span>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone" className="form-label">
                      Phone Number <span className="opt">(Optional)</span>
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      name="phone"
                      className="form-input"
                      placeholder="+63 900 000 0000"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </fieldset>

              <div className="form-actions">
                <div className="form-action-btns">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCancelEdit}
                    aria-label="Cancel editing profile"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    aria-label="Save profile changes"
                  >
                    {loading ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}

export default Profile;
