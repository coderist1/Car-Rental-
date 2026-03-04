import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks';
import '../styles/pages/Profile.css';

function Profile() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    sex: '',
    dateOfBirth: '',
    email: ''
  });
  
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        middleName: user.middleName || '',
        sex: user.sex || '',
        dateOfBirth: user.dateOfBirth || '',
        email: user.email || ''
      });
    }
  }, [user]);

  const getInitials = () => {
    const first = formData.firstName?.charAt(0) || '';
    const last = formData.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.sex) {
      newErrors.sex = 'Please select sex';
    }
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setLoading(true);
    
    try {
      const result = updateProfile({
        ...formData,
        fullName: `${formData.firstName} ${formData.lastName}`.trim()
      });

      if (result.success) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <button className="back-button" onClick={handleBack}>
          <span className="back-icon">←</span>
          <span>Back</span>
        </button>
        <div className="header-title-group">
          <h1 className="profile-title">Edit Profile</h1>
          <p className="profile-subtitle">Account Settings</p>
        </div>
        <div className="header-spacer"></div>
      </div>

      <div className="profile-content">
        <div className="profile-picture-section">
          <div className="profile-picture-container">
            <div className="profile-picture">{getInitials()}</div>
            <label className="picture-upload-label">
              <span className="upload-icon">📷</span>
            </label>
          </div>
          <p className="picture-hint">Click the camera to upload a new photo</p>
        </div>

        <div className="form-panel">
          <div className="form-panel-header">
            <div className="form-panel-header-icon">👤</div>
            <span className="form-panel-title">Personal Information</span>
          </div>

          <div className="form-panel-body">
            <form className="profile-form" onSubmit={handleSubmit}>
              <p className="form-section-label">Name</p>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">First Name <span className="req">*</span></label>
                  <input
                    type="text"
                    name="firstName"
                    className={`form-input ${errors.firstName ? 'error' : ''}`}
                    placeholder="Enter first name"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                  {errors.firstName && <span className="error-message">{errors.firstName}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name <span className="req">*</span></label>
                  <input
                    type="text"
                    name="lastName"
                    className={`form-input ${errors.lastName ? 'error' : ''}`}
                    placeholder="Enter last name"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                  {errors.lastName && <span className="error-message">{errors.lastName}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Middle Name <span className="opt">(Optional)</span></label>
                  <input
                    type="text"
                    name="middleName"
                    className="form-input"
                    placeholder="Enter middle name"
                    value={formData.middleName}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <p className="form-section-label">Details</p>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Sex <span className="req">*</span></label>
                  <select
                    name="sex"
                    className={`form-input form-select ${errors.sex ? 'error' : ''}`}
                    value={formData.sex}
                    onChange={handleChange}
                  >
                    <option value="">Select sex</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                  {errors.sex && <span className="error-message">{errors.sex}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Birth <span className="req">*</span></label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    className={`form-input ${errors.dateOfBirth ? 'error' : ''}`}
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                  />
                  {errors.dateOfBirth && <span className="error-message">{errors.dateOfBirth}</span>}
                </div>
              </div>

              <p className="form-section-label">Contact</p>

              <div className="form-row">
                <div className="form-group full-width">
                  <label className="form-label">Email Address <span className="req">*</span></label>
                  <input
                    type="email"
                    name="email"
                    className={`form-input ${errors.email ? 'error' : ''}`}
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={handleChange}
                  />
                  {errors.email && <span className="error-message">{errors.email}</span>}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={handleBack}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : '✓ Save Changes'}
                </button>
              </div>
            </form>

            {showSuccess && (
              <div className="success-message">
                <span className="success-icon">✓</span>
                <span>Profile updated successfully!</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
