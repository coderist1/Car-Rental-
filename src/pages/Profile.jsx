import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks';
import '../styles/pages/Profile.css';

const ROLE_LABELS = { owner: 'Vehicle Owner', renter: 'Renter', admin: 'Administrator' };
const ROLE_COLORS = {
  owner:  { bg: 'rgba(63,155,132,.12)',  color: '#2d7a67',  dot: '#3F9B84'  },
  renter: { bg: 'rgba(59,130,246,.12)',  color: '#1d4ed8',  dot: '#3b82f6'  },
  admin:  { bg: 'rgba(168,85,247,.12)',  color: '#7e22ce',  dot: '#a855f7'  },
};

function Profile() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const fileRef  = useRef(null);

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', middleName: '',
    sex: '', dateOfBirth: '', email: '', phone: '',
  });
  const [savedData, setSavedData] = useState(null); 
  const [avatar,      setAvatar]      = useState(null);
  const [hasNewPhoto, setHasNewPhoto] = useState(false);
  const [isConfirmingPhoto, setIsConfirmingPhoto] = useState(false);
  const [errors,      setErrors]      = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [isEditing,   setIsEditing]   = useState(false);

  const userRole   = user?.role || 'renter';
  const roleStyle  = ROLE_COLORS[userRole] || ROLE_COLORS.renter;
  const roleLabel  = ROLE_LABELS[userRole] || userRole;

  useEffect(() => {
    if (user) {
      setFormData({
        firstName:   user.firstName   || '',
        lastName:    user.lastName    || '',
        middleName:  user.middleName  || '',
        sex:         user.sex         || '',
        dateOfBirth: user.dateOfBirth || '',
        email:       user.email       || '',
        phone:       user.phone       || '',
      });
      if (user.avatar) setAvatar(user.avatar);
    }
  }, [user]);

  const getInitials = () => {
    const f = formData.firstName?.charAt(0) || '';
    const l = formData.lastName?.charAt(0)  || '';
    return (f + l).toUpperCase() || 'U';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
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

  // Logic to preview removing the current photo
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
        avatar, // This will be null if they clicked "Remove Photo"
      });
      if (result?.success !== false) {
        setShowSuccess(true);
        setHasNewPhoto(false);
        setIsConfirmingPhoto(false);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPhoto = () => {
    setAvatar(user?.avatar || null);
    setHasNewPhoto(false);
    setIsConfirmingPhoto(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const validate = () => {
    const e = {};
    if (!formData.firstName.trim()) e.firstName = 'First name is required';
    if (!formData.lastName.trim())  e.lastName  = 'Last name is required';
    if (!formData.email.trim())     e.email     = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Invalid email format';
    if (!formData.sex)              e.sex         = 'Please select sex';
    if (!formData.dateOfBirth) e.dateOfBirth = 'Date of birth is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
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
    } catch (err) {
      console.error(err);
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
    if (savedData) setFormData(savedData);
    setAvatar(user?.avatar || null);
    setErrors({});
    setIsEditing(false);
  };

  const fullName = [formData.firstName, formData.lastName].filter(Boolean).join(' ') || 'Your Name';
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : null;

  return (
    <div className="profile-page">
      <div className="profile-topbar">
        <button className="prof-back-btn" onClick={() => navigate(-1)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
        <h1 className="profile-topbar-title">My Profile</h1>
        <div style={{ width: 80 }} />
      </div>

      <div className="profile-layout">
        <aside className="profile-sidebar">
          <div className="sidebar-avatar-wrap">
            <div className="sidebar-avatar" onClick={() => fileRef.current?.click()}>
              {avatar
                ? <img src={avatar} alt="avatar" className="sidebar-avatar-img" />
                : <span className="sidebar-avatar-initials">{getInitials()}</span>}
              <div className="sidebar-avatar-overlay">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                <span>Change Photo</span>
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
            
            {/* Success Message */}
            {showSuccess && !isEditing && (
              <div className="sidebar-success-msg">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
                Profile Updated!
              </div>
            )}

            {/* Remove Photo Trigger (Only if photo exists and not currently changing it) */}
            {avatar && !hasNewPhoto && !isEditing && (
              <button className="sidebar-remove-photo-btn" onClick={handleRemovePhotoClick}>
                Remove Photo
              </button>
            )}

            {/* Confirmation Step for New Photo OR Removal */}
            {hasNewPhoto && !isEditing && (
              <div className="photo-confirm-wrapper">
                {!isConfirmingPhoto ? (
                  <div className="photo-confirm-actions">
                    <button className="photo-btn save" onClick={() => setIsConfirmingPhoto(true)}>
                      Apply Change
                    </button>
                    <button className="photo-btn cancel" onClick={handleCancelPhoto}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="photo-confirmation-dialog">
                    <p className="photo-confirm-text">Confirm this change?</p>
                    <div className="photo-confirm-btns">
                      <button className="photo-confirm-yes" onClick={handleSavePhotoOnly} disabled={loading}>
                        {loading ? '...' : 'Yes'}
                      </button>
                      <button className="photo-confirm-no" onClick={() => setIsConfirmingPhoto(false)} disabled={loading}>
                        No
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!hasNewPhoto && !showSuccess && <p className="sidebar-avatar-hint">Click photo to change</p>}
          </div>

          <div className="sidebar-info">
            <p className="sidebar-fullname">{fullName}</p>
            <span className="sidebar-role-badge" style={{ background: roleStyle.bg, color: roleStyle.color }}>
              <span className="sidebar-role-dot" style={{ background: roleStyle.dot }} />
              {roleLabel}
            </span>
            {formData.email && <p className="sidebar-email">{formData.email}</p>}
            {formData.phone && <p className="sidebar-phone">{formData.phone}</p>}
            {memberSince && (
              <p className="sidebar-since">Member since {memberSince}</p>
            )}
          </div>

          <div className="sidebar-links">
            <button className="sidebar-link" onClick={() => navigate('/change-password')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              Change Password
            </button>
            {userRole !== 'admin' && (
              <button className="sidebar-link" onClick={() => navigate('/bookings')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
                My Bookings
              </button>
            )}
          </div>
        </aside>

        <div className="profile-form-panel">
          <div className="form-panel-header">
            {isEditing ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3F9B84" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
                <span>Edit Personal Information</span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3F9B84" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                <span>Personal Information</span>
                <button className="prof-edit-btn" onClick={handleStartEdit}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                  Edit Profile
                </button>
              </>
            )}
          </div>

          {!isEditing && (
            <div className="profile-view">
              <p className="form-section-label">Name</p>
              <div className="prof-view-grid">
                <div className="prof-view-field">
                  <span className="prof-view-label">First Name</span>
                  <span className="prof-view-value">{formData.firstName || <em className="prof-empty">Not set</em>}</span>
                </div>
                <div className="prof-view-field">
                  <span className="prof-view-label">Last Name</span>
                  <span className="prof-view-value">{formData.lastName || <em className="prof-empty">Not set</em>}</span>
                </div>
                <div className="prof-view-field">
                  <span className="prof-view-label">Middle Name</span>
                  <span className="prof-view-value">{formData.middleName || <em className="prof-empty">Not set</em>}</span>
                </div>
              </div>

              <p className="form-section-label">Details</p>
              <div className="prof-view-grid">
                <div className="prof-view-field">
                  <span className="prof-view-label">Sex</span>
                  <span className="prof-view-value" style={{ textTransform: 'capitalize' }}>{formData.sex || <em className="prof-empty">Not set</em>}</span>
                </div>
                <div className="prof-view-field">
                  <span className="prof-view-label">Date of Birth</span>
                  <span className="prof-view-value">
                    {formData.dateOfBirth
                      ? new Date(formData.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                      : <em className="prof-empty">Not set</em>}
                  </span>
                </div>
              </div>

              <p className="form-section-label">Contact</p>
              <div className="prof-view-grid">
                <div className="prof-view-field">
                  <span className="prof-view-label">Email Address</span>
                  <span className="prof-view-value">{formData.email || <em className="prof-empty">Not set</em>}</span>
                </div>
                <div className="prof-view-field">
                  <span className="prof-view-label">Phone Number</span>
                  <span className="prof-view-value">{formData.phone || <em className="prof-empty">Not set</em>}</span>
                </div>
              </div>
            </div>
          )}

          {isEditing && (
            <form className="profile-form" onSubmit={handleSubmit}>
              <p className="form-section-label">Name</p>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">First Name <span className="req">*</span></label>
                  <input type="text" name="firstName" className={`form-input ${errors.firstName ? 'input-error' : ''}`}
                    placeholder="First name" value={formData.firstName} onChange={handleChange} />
                  {errors.firstName && <span className="error-msg">{errors.firstName}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name <span className="req">*</span></label>
                  <input type="text" name="lastName" className={`form-input ${errors.lastName ? 'input-error' : ''}`}
                    placeholder="Last name" value={formData.lastName} onChange={handleChange} />
                  {errors.lastName && <span className="error-msg">{errors.lastName}</span>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Middle Name <span className="opt">(Optional)</span></label>
                  <input type="text" name="middleName" className="form-input"
                    placeholder="Middle name" value={formData.middleName} onChange={handleChange} />
                </div>
              </div>

              <p className="form-section-label">Details</p>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Sex <span className="req">*</span></label>
                  <select name="sex" className={`form-input form-select ${errors.sex ? 'input-error' : ''}`}
                    value={formData.sex} onChange={handleChange}>
                    <option value="">Select sex</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                  {errors.sex && <span className="error-msg">{errors.sex}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Birth <span className="req">*</span></label>
                  <input type="date" name="dateOfBirth" className={`form-input ${errors.dateOfBirth ? 'input-error' : ''}`}
                    value={formData.dateOfBirth} onChange={handleChange} />
                  {errors.dateOfBirth && <span className="error-msg">{errors.dateOfBirth}</span>}
                </div>
              </div>

              <p className="form-section-label">Contact</p>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email Address <span className="req">*</span></label>
                  <input type="email" name="email" className={`form-input ${errors.email ? 'input-error' : ''}`}
                    placeholder="your@email.com" value={formData.email} onChange={handleChange} />
                  {errors.email && <span className="error-msg">{errors.email}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number <span className="opt">(Optional)</span></label>
                  <input type="tel" name="phone" className="form-input"
                    placeholder="+63 900 000 0000" value={formData.phone} onChange={handleChange} />
                </div>
              </div>

              <div className="form-actions">
                <div className="form-action-btns">
                  <button type="button" className="btn btn-secondary" onClick={handleCancelEdit}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
