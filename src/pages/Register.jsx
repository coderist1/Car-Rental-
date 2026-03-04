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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleSelect = (role) => {
    setFormData(prev => ({ ...prev, role }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const result = register({
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
        if (formData.role === 'owner') {
          navigate('/dashboard');
        } else {
          navigate('/renter');
        }
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <main className="auth-form-container">
        <div className="auth-card">
          <img 
            src="https://as2.ftcdn.net/v2/jpg/02/13/75/05/1000_F_213750591_6bVeg9sH1cD7wEvYhb2OUyHOesJzPtAL.jpg"
            className="auth-logo"
            alt="CarRental Logo"
          />

          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Join CarRental today</p>

          <div className="role-section">
            <label className="role-label">I want to:</label>
            <div className="role-container">
              <button 
                type="button"
                className={`role-button ${formData.role === 'owner' ? 'active' : ''}`}
                onClick={() => handleRoleSelect('owner')}
              >
                <div className="role-icon">🚗</div>
                <div className="role-text">List My Car</div>
                <div className="role-description">Rent out your vehicle and earn</div>
              </button>
              <button 
                type="button"
                className={`role-button ${formData.role === 'renter' ? 'active' : ''}`}
                onClick={() => handleRoleSelect('renter')}
              >
                <div className="role-icon">🙋</div>
                <div className="role-text">Rent a Car</div>
                <div className="role-description">Browse and rent available vehicles</div>
              </button>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="section-label">Personal Information</div>

            <div className="input-row">
              <div className="input-group">
                <label className="input-label">First Name <span className="required">*</span></label>
                <input
                  type="text"
                  name="firstName"
                  className="input"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="input-group">
                <label className="input-label">Last Name <span className="required">*</span></label>
                <input
                  type="text"
                  name="lastName"
                  className="input"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">
                Middle Name <span className="optional">(Optional)</span>
              </label>
              <input
                type="text"
                name="middleName"
                className="input"
                placeholder="Middle Name"
                value={formData.middleName}
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Sex <span className="required">*</span></label>
              <select
                name="sex"
                className="input select-input"
                value={formData.sex}
                onChange={handleChange}
                required
              >
                <option value="" disabled>Select Sex</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="prefer_not">Prefer not to say</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Date of Birth <span className="required">*</span></label>
              <input
                type="date"
                name="dateOfBirth"
                className="input"
                value={formData.dateOfBirth}
                onChange={handleChange}
                required
              />
            </div>

            <div className="section-label">Account Information</div>

            <div className="input-group">
              <label className="input-label">Email <span className="required">*</span></label>
              <input
                type="email"
                name="email"
                className="input"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Password <span className="required">*</span></label>
              <input
                type="password"
                name="password"
                className="input"
                placeholder="Password (min. 6 characters)"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Confirm Password <span className="required">*</span></label>
              <input
                type="password"
                name="confirmPassword"
                className="input"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="auth-footer">
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
