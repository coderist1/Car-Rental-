import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks';
import '../styles/pages/Auth.css';

function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    sex: '',
    dateOfBirth: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'owner'
  });
  

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleRoleSelect = (role) => {
    setFormData(prev => ({ ...prev, role }));
  };


  const getPasswordStrength = () => {
    const password = formData.password;
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

  const strength = getPasswordStrength();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const result = await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        middleName: formData.middleName,
        sex: formData.sex,
        dateOfBirth: formData.dateOfBirth,
        email: formData.email,
        password: formData.password,
        role: formData.role
      });

      if (result.success) {
        navigate(formData.role === 'owner' ? '/dashboard' : '/renter');
      } else {
        setError(result.error || 'Registration failed');
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <main className="register-split-container">
        
        {/* LEFT PANEL - Branding & Role Selection */}
        <div className="register-left-panel">
          <div className="auth-logo-box">
            <svg 
              width="55" 
              height="55" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              className="auth-logo-svg"
              aria-hidden="true"
            >
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
              <circle cx="7" cy="17" r="2" />
              <path d="M9 17h6" />
              <circle cx="17" cy="17" r="2" />
            </svg>
          </div>

          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join CarRental today</p>

          <fieldset className="role-section" style={{ marginTop: '20px' }}>
            <legend className="role-label">I want to:</legend>
            <div className="role-container register-role-stack">
              <button 
                type="button"
                className={`role-button ${formData.role === 'owner' ? 'active' : ''}`}
                onClick={() => handleRoleSelect('owner')}
                aria-pressed={formData.role === 'owner'}
                aria-label="Select vehicle owner role"
              >
                <div className="role-icon" aria-hidden="true">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M5 17h-2v-6l2 -5h9l4 5h1a2 2 0 0 1 2 2v4h-2" /><path d="M9 17l6 0" /></svg>
                </div>
                <div className="role-text">List My Car</div>
                <div className="role-description">Rent out your vehicle and earn</div>
              </button>
              <button 
                type="button"
                className={`role-button ${formData.role === 'renter' ? 'active' : ''}`}
                onClick={() => handleRoleSelect('renter')}
                aria-pressed={formData.role === 'renter'}
                aria-label="Select renter role"
              >
                <div className="role-icon" aria-hidden="true">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                </div>
                <div className="role-text">Rent a Car</div>
                <div className="role-description">Browse and rent available vehicles</div>
              </button>
            </div>
          </fieldset>
        </div>

        {/* RIGHT PANEL - The Form */}
        <div className="register-right-panel">
          {error && <div className="error-message" role="alert" aria-live="polite">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <h2 className="section-label">Personal Information</h2>

            <div className="register-form-grid">
              <div className="input-group">
                <label className="input-label" htmlFor="firstName">
                  First Name <span className="required">*</span>
                </label>
                <input
                  id="firstName"
                  type="text"
                  name="firstName"
                  className="input"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  aria-required="true"
                />
              </div>
              <div className="input-group">
                <label className="input-label" htmlFor="lastName">
                  Last Name <span className="required">*</span>
                </label>
                <input
                  id="lastName"
                  type="text"
                  name="lastName"
                  className="input"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  aria-required="true"
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="middleName">
                  Middle Name <span className="optional">(Optional)</span>
                </label>
                <input
                  id="middleName"
                  type="text"
                  name="middleName"
                  className="input"
                  placeholder="Optional"
                  value={formData.middleName}
                  onChange={handleChange}
                />
              </div>
              <div className="input-group">
                <label className="input-label" htmlFor="sex">
                  Sex <span className="required">*</span>
                </label>
                <select
                  id="sex"
                  name="sex"
                  className="input select-input"
                  value={formData.sex}
                  onChange={handleChange}
                  required
                  aria-required="true"
                >
                  <option value="" disabled>Select Sex</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="prefer_not">Prefer not to say</option>
                </select>
              </div>

              <div className="input-group span-full">
                <label className="input-label" htmlFor="dob">
                  Date of Birth <span className="required">*</span>
                </label>
                <input
                  id="dob"
                  type="date"
                  name="dateOfBirth"
                  className="input"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  required
                  aria-required="true"
                />
              </div>
            </div>

            <h2 className="section-label" style={{ marginTop: '10px' }}>Account Information</h2>

            <div className="register-form-grid">
              <div className="input-group span-full">
                <label className="input-label" htmlFor="email">
                  Email <span className="required">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  className="input"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  aria-required="true"
                />
              </div>


              {/* Password Group */}
              <div className="input-group span-full">
                <p 
                  style={{ 
                    fontSize: '11px',
                    textAlign: 'left', 
                    color: '#64748b', 
                    marginTop: '7px', 
                    marginBottom: '1px', 
                    lineHeight: '1.0' 
                  }}
                  id="password-hint"
                >
                  Password must be at least 8 characters, including uppercase, lowercase, numbers, and symbols.
                </p>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="reg-password">
                  Password <span className="required">*</span>
                </label>

                <div style={{ position: 'relative' }}>
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    className="input"
                    placeholder="Min. 8 characters"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    aria-required="true"
                    aria-describedby="password-hint"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ 
                      position: 'absolute', 
                      right: '12px', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      border: 'none', 
                      background: 'none', 
                      cursor: 'pointer', 
                      color: '#64748b',
                      padding: '4px'
                    }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    )}
                  </button>
                </div>
                
                {formData.password && (
                  <div className="password-strength" aria-live="polite" aria-label="Password strength indicator">
                    <div className="strength-meter" style={{ height: '5px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                      <div 
                        className={`strength-bar level-${strength.level}`}
                        style={{ 
                          width: `${strength.level * 20}%`, 
                          height: '100%', 
                          transition: 'width 0.3s ease',
                          background: strength.level < 3 ? '#ef4444' : strength.level < 5 ? '#f59e0b' : '#3F9B84'
                        }}
                        role="progressbar"
                        aria-valuenow={strength.level}
                        aria-valuemin="0"
                        aria-valuemax="5"
                        aria-label={`Password strength: ${strength.text}`}
                      />
                    </div>
                    <p style={{ fontSize: '11px', marginTop: '4px', color: '#64748b' }}>Strength: {strength.text}</p>
                  </div>
                )}
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="confirmPassword">
                  Confirm Password <span className="required">*</span>
                </label>
                
                <div style={{ position: 'relative' }}>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    className="input"
                    placeholder="Repeat password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    aria-required="true"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ 
                      position: 'absolute', 
                      right: '12px', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      border: 'none', 
                      background: 'none', 
                      cursor: 'pointer', 
                      color: '#64748b',
                      padding: '4px'
                    }}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    aria-pressed={showConfirmPassword}
                  >
                    {showConfirmPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    )}
                  </button>
                </div>

              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-full"
              style={{ marginTop: '16px' }}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="auth-footer" style={{ marginTop: '24px' }}>
            Already have an account?{' '}
            <Link to="/login" className="link-bold">Sign In</Link>
          </p>

          <p className="auth-footer">
            <Link to="/admin-register" className="link-admin">Register as Admin</Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default Register;
