import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks';
import '../styles/pages/Auth.css';

function AdminRegister() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    adminKey: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { registerAdmin } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const result = registerAdmin(
        {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password
        },
        formData.adminKey
      );

      if (result.success) {
        navigate('/admin');
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

          <h2 className="auth-title">Create Admin Account</h2>
          <p className="auth-subtitle">Register as administrator</p>

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
              <label className="input-label">Admin Key <span className="required">*</span></label>
              <input
                type="password"
                name="adminKey"
                className="input"
                placeholder="Admin Key"
                value={formData.adminKey}
                onChange={handleChange}
                required
              />
              <small className="admin-key-hint">Hint: ADMIN2026</small>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Admin Account'}
            </button>
          </form>

          <p className="auth-footer">
            Regular registration?{' '}
            <Link to="/register" className="link-bold">Register as User</Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default AdminRegister;
