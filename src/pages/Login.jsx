import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks';
import '../styles/pages/Login.css';

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
      const cleanEmail = email.trim();
      const cleanPassword = password.trim();

      const result = await login(cleanEmail, cleanPassword);

      if (result && result.success) {
        const role = result.user?.role;
        if (role === 'owner') {
          navigate('/dashboard');
        } else if (role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/renter');
        }
      } else {
        setError(result?.error || 'Invalid email or password');
      }
    } catch (err) {
      console.error('login error', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <main className="register-split-container">
        
        <div className="register-left-panel login-theme-panel">
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to continue to CarRental</p>

        </div>

        <div className="register-right-panel">
          <div className="login-form-wrapper">
            <h2 className="auth-title" style={{ textAlign: 'left', fontSize: '24px' }}>Sign In</h2>
            <p className="auth-subtitle" style={{ textAlign: 'left', marginBottom: '32px' }}>
              Enter your account details below
            </p>

            {error && <div className="error-message" role="alert">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="input-group">
                <label className="input-label" htmlFor="login-email">Email Address</label>
                <input
                  id="login-email"
                  type="email"
                  className="input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label className="input-label" htmlFor="login-password">Password</label>
                <Link to="/forgot-password" style={{ fontSize: '12px', color: '#3F9B84', textDecoration: 'none', fontWeight: '500' }}>
                  Forgot Password?
                </Link>
              </div>
              <input
                id="login-password"
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            
              <button 
                type="submit" 
                className="btn btn-primary btn-full"
                disabled={loading}
                style={{ marginTop: '10px', height: '50px' }}
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

             <p className="auth-footer" style={{ textAlign: 'center', marginTop: '30px' }}>
               Don't have an account?{' '}
               <Link to="/register" className="link-bold" style={{ color: '#3F9B84' }}>Create Account</Link>
             </p>
          </div>
        </div>
        
      </main>
    </div>
  );
}

export default Login;

