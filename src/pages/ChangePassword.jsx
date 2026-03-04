import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks';
import '../styles/pages/ChangePassword.css';

function ChangePassword() {
  const { changePassword } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const getPasswordStrength = () => {
    const password = formData.newPassword;
    if (!password) return { level: 0, text: '' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const levels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    return { level: strength, text: levels[strength] };
  };

  const checkRequirements = () => {
    const password = formData.newPassword;
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /[0-9]/.test(password),
      match: password && password === formData.confirmPassword
    };
  };

  const requirements = checkRequirements();
  const strength = getPasswordStrength();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.currentPassword) {
      setError('Please enter your current password');
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const result = changePassword(formData.currentPassword, formData.newPassword);
      
      if (result.success) {
        setSuccess(true);
        setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => navigate(-1), 2000);
      } else {
        setError(result.error || 'Failed to change password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="change-password-container">
      <header className="change-password-header">
        <button className="back-button" onClick={handleBack}>
          ← Back
        </button>
        <h1 className="page-title">Change Password</h1>
      </header>

      <section className="password-section">
        <div className="password-card">
          <p className="password-intro">Update your password to keep your account secure</p>

          {error && <div className="error-alert">{error}</div>}
          {success && <div className="success-alert">Password changed successfully! Redirecting...</div>}

          <form onSubmit={handleSubmit} className="password-form">
            <div className="form-group">
              <label>Current Password <span className="required">*</span></label>
              <div className="password-input-wrapper">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  name="currentPassword"
                  className="form-input"
                  placeholder="Enter your current password"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  required
                />
                <button 
                  type="button" 
                  className="toggle-password-btn"
                  onClick={() => togglePasswordVisibility('current')}
                >
                  {showPasswords.current ? '🙈' : '👁️'}
                </button>
              </div>
              <p className="form-hint">Enter your current password to verify</p>
            </div>

            <div className="form-divider"></div>

            <div className="form-group">
              <label>New Password <span className="required">*</span></label>
              <div className="password-input-wrapper">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  name="newPassword"
                  className="form-input"
                  placeholder="Enter a new password"
                  value={formData.newPassword}
                  onChange={handleChange}
                  required
                />
                <button 
                  type="button" 
                  className="toggle-password-btn"
                  onClick={() => togglePasswordVisibility('new')}
                >
                  {showPasswords.new ? '🙈' : '👁️'}
                </button>
              </div>
              <p className="form-hint">At least 8 characters, with uppercase, lowercase, and numbers</p>
              
              {formData.newPassword && (
                <div className="password-strength">
                  <div className="strength-meter">
                    <div 
                      className={`strength-bar level-${strength.level}`}
                      style={{ width: `${strength.level * 20}%` }}
                    ></div>
                  </div>
                  <p className={`strength-text level-${strength.level}`}>{strength.text}</p>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Confirm Password <span className="required">*</span></label>
              <div className="password-input-wrapper">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  name="confirmPassword"
                  className="form-input"
                  placeholder="Re-enter your new password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <button 
                  type="button" 
                  className="toggle-password-btn"
                  onClick={() => togglePasswordVisibility('confirm')}
                >
                  {showPasswords.confirm ? '🙈' : '👁️'}
                </button>
              </div>
              {formData.confirmPassword && (
                <p className={`form-hint ${requirements.match ? 'success' : 'error'}`}>
                  {requirements.match ? '✓ Passwords match' : '✗ Passwords do not match'}
                </p>
              )}
            </div>

            <div className="password-requirements">
              <h4>Password Requirements:</h4>
              <ul>
                <li className={requirements.length ? 'met' : ''}>
                  {requirements.length ? '✓' : '○'} At least 8 characters
                </li>
                <li className={requirements.uppercase ? 'met' : ''}>
                  {requirements.uppercase ? '✓' : '○'} Contains uppercase letters (A-Z)
                </li>
                <li className={requirements.lowercase ? 'met' : ''}>
                  {requirements.lowercase ? '✓' : '○'} Contains lowercase letters (a-z)
                </li>
                <li className={requirements.numbers ? 'met' : ''}>
                  {requirements.numbers ? '✓' : '○'} Contains numbers (0-9)
                </li>
                <li className={requirements.match ? 'met' : ''}>
                  {requirements.match ? '✓' : '○'} Passwords match
                </li>
              </ul>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={handleBack}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

export default ChangePassword;
