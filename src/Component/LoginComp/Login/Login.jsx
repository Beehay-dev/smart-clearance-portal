import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Styles/Auth.css';
import RoleSelector from '../RoleSelector/RoleSelector';
import { FaGraduationCap } from "react-icons/fa";
import { loginUser } from '../../../firebase/auth';
import { toast } from 'react-toastify';

const DEPARTMENT_ADMINS = [
  { label: 'Super Admin', value: 'super_admin', adminType: 'super_admin' },
  { label: 'Bursary',     value: 'bursary',     adminType: 'bursary_admin'  },
  { label: 'HOD',         value: 'hod',         adminType: 'hod_admin'      },
  { label: 'Library',     value: 'library',     adminType: 'library_admin'  },
  { label: 'BUTH',        value: 'buth',        adminType: 'buth_admin'     },
  { label: 'Security',    value: 'security',    adminType: 'security_admin' },
];

const ADMIN_ROUTES = {
  super_admin:    "/admindashboard/overview",
  bursary_admin:  '/admindashboard/bursary',
  hod_admin:      '/admindashboard/hod',
  library_admin:  '/admindashboard/library',
  buth_admin:     '/admindashboard/buth',
  security_admin: '/admindashboard/security',
};

const Login = () => {
  const navigate = useNavigate();
  const [currentRole, setCurrentRole] = useState('user');
  const [selectedAdminDept, setSelectedAdminDept] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) newErrors.email = 'Please enter a valid email address';
    if (!formData.password) newErrors.password = 'Password is required';
    if (currentRole === 'admin' && !selectedAdminDept) newErrors.adminDept = 'Please select your department';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const result = await loginUser(formData.email, formData.password);

      if (result.success) {
        const userRole = result.data.role;
        const userAdminType = result.data.adminType;

        // Role mismatch check
        if (currentRole === 'admin' && userRole !== 'admin') {
          alert('This account is not registered as an admin.');
          setIsLoading(false);
          return;
        }
        if (currentRole === 'user' && userRole !== 'student') {
          alert('This account is not registered as a student.');
          setIsLoading(false);
          return;
        }

        // For admin — verify selected department matches their adminType
        if (currentRole === 'admin') {
          const selected = DEPARTMENT_ADMINS.find(d => d.value === selectedAdminDept);
          if (selected && userAdminType !== selected.adminType) {
            alert(`You are not registered as a ${selected.label} admin.`);
            setIsLoading(false);
            return;
          }
        }

        // Save to localStorage
        localStorage.setItem('userRole', userRole);
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userData', JSON.stringify(result.data));

        setFormData({ email: '', password: '' });
        setErrors({});

        // Route based on adminType or student
        if (userRole === 'admin') {
          const route = ADMIN_ROUTES[userAdminType] || '/admindashboard/overview';
          navigate(route);
        } else {
          navigate('/dashboard');
        }
      } else {
        alert(`Login failed: ${result.error}`);
      }
    } catch (error) {
      // console.error('Login error:', error);
      toast.error(error.message || 'An error occurred during login. Please try again.');

      alert('An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-image-section">
        <div className="image-content">
          <div className="logo"><FaGraduationCap /></div>
          <h1>Smart Clearance</h1>
          <p>Streamline your final year journey at Babcock University. Complete your entire clearance process digitally, securely, and 100% paperless.</p>
          <div className="features">
            <div className="feature-item"><i className="fas fa-clock"></i><span>Real-time Tracking</span></div>
            <div className="feature-item"><i className="fas fa-shield-alt"></i><span>Secure Digital Vault</span></div>
            <div className="feature-item"><i className="fas fa-robot"></i><span>AI-Guided Support</span></div>
          </div>
        </div>
      </div>

      <div className="auth-form-section">
        <div className="auth-card">
          <h2 className="main-title">Welcome Back</h2>
          <p className="subtitle">Sign in to continue your clearance process</p>

          <RoleSelector currentRole={currentRole} onRoleChange={(role) => {
            setCurrentRole(role);
            setSelectedAdminDept('');
          }} />

          <form className="form-view" onSubmit={handleSubmit}>

            {/* Admin Department Dropdown */}
            {currentRole === 'admin' && (
              <div className="input-group">
                <label>Select Department</label>
                <select
                  value={selectedAdminDept}
                  onChange={(e) => {
                    setSelectedAdminDept(e.target.value);
                    if (errors.adminDept) setErrors({ ...errors, adminDept: '' });
                  }}
                  className={errors.adminDept ? 'error' : ''}
                  required
                >
                  <option value="">-- Select your department --</option>
                  {DEPARTMENT_ADMINS.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
                {errors.adminDept && <span className="error-message">{errors.adminDept}</span>}
              </div>
            )}

            <div className="input-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="e.g. student@babcock.edu.ng"
                className={errors.email ? 'error' : ''}
                required
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                className={errors.password ? 'error' : ''}
                required
              />
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            <a href="/forgot-password" className="forgot-link">Forgot Password?</a>

            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? <><span className="spinner"></span> Signing In...</> : 'Sign In'}
            </button>

            <p className="switch-text">
              Don't have an account? <a href="/register">Sign up here</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;