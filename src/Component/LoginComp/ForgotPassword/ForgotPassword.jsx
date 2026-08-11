import React, { useState } from 'react';
import '../Styles/Auth.css';
import { auth } from '../../../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
      setEmail('');
    } catch (error) {
      switch (error.code) {
        case 'auth/user-not-found':
          setError('No account found with this email address');
          break;
        case 'auth/invalid-email':
          setError('Please enter a valid email address');
          break;
        case 'auth/too-many-requests':
          setError('Too many attempts. Please try again later');
          break;
        default:
          setError('Something went wrong. Please try again');
      }
    } finally {
      setIsLoading(false);
    }
};

  return (
    <div className="auth-container">
      <div className="auth-form-section">
        <div className="auth-card">
          <div className="logo-container">
            <i className="fas fa-graduation-cap"></i>
          </div>
          <h2 className="main-title">Reset Password</h2>
          <p className="forgot-subtitle">
            Enter your email and we'll send instructions to reset your password.
          </p>

          {success ? (
            <div className="success-message">
              <i className="fas fa-check-circle"></i>
              <p>Password reset link sent! Check your email.</p>
              <a href="/login" className="btn-primary" style={{ marginTop: '20px', display: 'inline-block', textDecoration: 'none' }}>
                Back to Sign In
              </a>
            </div>
          ) : (
            <form className="form-view" onSubmit={handleSubmit}>
              <div className="input-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="123@email.com"
                  className={error ? 'error' : ''}
                  required
                />
                {error && <span className="error-message">{error}</span>}
              </div>
              
              <button type="submit" className="btn-primary" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>
              
              <a href="/login" className="btn-ghost" style={{ display: 'block', textDecoration: 'none', textAlign: 'center' }}>
                ← Back to Sign In
              </a>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;