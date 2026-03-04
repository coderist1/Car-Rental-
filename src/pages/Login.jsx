import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks';
import '../styles/pages/Auth.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = login(email, password);
      
      if (result.success) {
        const role = result.user.role;
        if (role === 'owner') {
          navigate('/dashboard');
        } else if (role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/renter');
        }
      } else {
        setError(result.error || 'Invalid email or password');
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

          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-subtitle">Sign in to your account</p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label className="input-label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="auth-footer">
            Don't have an account?{' '}
            <Link to="/register" className="link-bold">Register</Link>
          </p>

          <p className="auth-footer">
            <Link to="/admin-register" className="link-admin">Register as Admin</Link>
          </p>

          <div className="demo-accounts">
            <p className="demo-title">Demo Accounts:</p>
            <p className="demo-account">Owner: owner@test.com / password</p>
            <p className="demo-account">Renter: renter@test.com / password</p>
            <p className="demo-account">Admin: admin@test.com / admin123</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Login;
