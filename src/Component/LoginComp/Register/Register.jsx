import React, { useState } from 'react';
import '../styles/Auth.css';
import RoleSelector from '../RoleSelector/RoleSelector';
import { FaGraduationCap } from "react-icons/fa";
import { registerUser } from '../../../firebase/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const DEPARTMENT_ADMINS = [
  { label: 'Bursary',  value: 'bursary',  email: 'bursary@babcock.edu.ng',  adminType: 'bursary_admin'  },
  { label: 'HOD',      value: 'hod',      email: 'hod@babcock.edu.ng',      adminType: 'hod_admin'      },
  { label: 'Library',  value: 'library',  email: 'library@babcock.edu.ng',  adminType: 'library_admin'  },
  { label: 'BUTH',     value: 'buth',     email: 'buth@babcock.edu.ng',     adminType: 'buth_admin'     },
  { label: 'Security', value: 'security', email: 'security@babcock.edu.ng', adminType: 'security_admin' },
];

const Register = () => {
  const navigate = useNavigate();
  const [currentRole, setCurrentRole] = useState('user');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAdminDept, setSelectedAdminDept] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    matricNumber: '',
    department: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    bursaryNumber: '',
    buthPhoneNumber: ''
  });
  const [errors, setErrors] = useState({});

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    const levels = [
      { strength: 0, label: '', color: '' },
      { strength: 1, label: 'Weak', color: '#e74c3c' },
      { strength: 2, label: 'Fair', color: '#f39c12' },
      { strength: 3, label: 'Good', color: '#3498db' },
      { strength: 4, label: 'Strong', color: '#27ae60' },
      { strength: 5, label: 'Very Strong', color: '#27ae60' }
    ];
    return levels[strength];
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  // When admin selects a department, auto-fill the email
  const handleAdminDeptChange = (e) => {
    const val = e.target.value;
    setSelectedAdminDept(val);
    const found = DEPARTMENT_ADMINS.find(d => d.value === val);
    if (found) {
      setFormData(prev => ({ ...prev, email: found.email }));
    } else {
      setFormData(prev => ({ ...prev, email: '' }));
    }
    if (errors.adminDept) setErrors({ ...errors, adminDept: '' });
  };

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';

    if (currentRole === 'admin') {
      if (!selectedAdminDept) newErrors.adminDept = 'Please select your department';
      // Verify email matches expected pattern
      const found = DEPARTMENT_ADMINS.find(d => d.value === selectedAdminDept);
      if (found && formData.email !== found.email) {
        newErrors.email = `Admin email must be ${found.email}`;
      }
    } else {
      if (!emailRegex.test(formData.email)) newErrors.email = 'Please enter a valid email address';
      if (!formData.matricNumber.trim()) newErrors.matricNumber = 'Matric number is required';
      if (!formData.bursaryNumber.trim()) newErrors.bursaryNumber = 'Bursary number is required';
      if (!formData.buthPhoneNumber.trim()) newErrors.buthPhoneNumber = 'BUTH phone number is required';
    }

    if (!formData.department && currentRole === 'user') newErrors.department = 'Please select your department';
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const found = DEPARTMENT_ADMINS.find(d => d.value === selectedAdminDept);

      const result = await registerUser({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        matricNumber: formData.matricNumber,
        department: currentRole === 'admin' ? found?.label || '' : formData.department,
        phoneNumber: formData.phoneNumber,
        bursaryNumber: formData.bursaryNumber,
        buthPhoneNumber: formData.buthPhoneNumber,
        role: currentRole === 'admin' ? 'admin' : 'student',
        adminType: currentRole === 'admin' ? found?.adminType || '' : null,
      });

      if (result.success) {
        alert(`${currentRole === 'admin' ? 'Admin' : 'Student'} account created successfully! Please login.`);
        setFormData({
          fullName: '', email: '', matricNumber: '', department: '',
          phoneNumber: '', password: '', confirmPassword: '',
          bursaryNumber: '', buthPhoneNumber: ''
        });
        setSelectedAdminDept('');
        setErrors({});
        navigate('/login');
      } else {
        alert(`Registration failed: ${result.error}`);
      }
    } catch (error) {
      // console.error('Registration error:', error);

      toast.error(error.message || 'An error occurred during registration. Please try again.');
      alert('An error occurred during registration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-image-section">
        <div className="image-content">
          <div className="logo"><FaGraduationCap /></div>
          <h1>Join Smart Clearance</h1>
          <p>Create your account and experience the future of university clearance.</p>
          <div className="features">
            <div className="feature-item"><i className="fas fa-check-circle"></i><span>Quick Registration</span></div>
            <div className="feature-item"><i className="fas fa-lock"></i><span>Secure & Private</span></div>
            <div className="feature-item"><i className="fas fa-mobile-alt"></i><span>Access Anywhere</span></div>
          </div>
        </div>
      </div>

      <div className="auth-form-section">
        <div className="auth-card">
          <h2 className="main-title">Create Account</h2>
          <p className="subtitle">Fill in your details to get started</p>

          <RoleSelector currentRole={currentRole} onRoleChange={(role) => {
            setCurrentRole(role);
            setSelectedAdminDept('');
            setFormData(prev => ({ ...prev, email: '' }));
          }} />

          <form className="form-view" onSubmit={handleSubmit}>

            {/* Admin Department Selector */}
            {currentRole === 'admin' && (
              <div className="input-group">
                <label>Department</label>
                <select
                  value={selectedAdminDept}
                  onChange={handleAdminDeptChange}
                  className={errors.adminDept ? 'error' : ''}
                  required
                >
                  <option value="">Select your department</option>
                  {DEPARTMENT_ADMINS.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
                {errors.adminDept && <span className="error-message">{errors.adminDept}</span>}
              </div>
            )}

            <div className="input-group">
              <label>Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="John Doe"
                className={errors.fullName ? 'error' : ''}
                required
              />
              {errors.fullName && <span className="error-message">{errors.fullName}</span>}
            </div>

            <div className="input-row">
              <div className="input-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="name@babcock.edu.ng"
                  className={errors.email ? 'error' : ''}
                  readOnly={currentRole === 'admin' && !!selectedAdminDept}
                  required
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
                {currentRole === 'admin' && selectedAdminDept && (
                  <span style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem', display: 'block' }}>
                    ✓ Email auto-assigned for {DEPARTMENT_ADMINS.find(d => d.value === selectedAdminDept)?.label} admin
                  </span>
                )}
              </div>

              {currentRole === 'user' && (
                <div className="input-group">
                  <label>Matric Number</label>
                  <input
                    type="text"
                    name="matricNumber"
                    value={formData.matricNumber}
                    onChange={handleInputChange}
                    placeholder="e.g. 20/1234"
                    className={errors.matricNumber ? 'error' : ''}
                    required
                  />
                  {errors.matricNumber && <span className="error-message">{errors.matricNumber}</span>}
                </div>
              )}
            </div>

            <div className="input-row">
              {currentRole === 'user' && (
                <div className="input-group">
                  <label>Department</label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className={errors.department ? 'error' : ''}
                    required
                  >
                    <option value="">Select Department</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Computer Technology">Computer Technology</option>
                    <option value="Computer Information Systems">Computer Information Systems</option>
                    <option value="Software Engineering">Software Engineering</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Nursing">Nursing</option>
                  </select>
                  {errors.department && <span className="error-message">{errors.department}</span>}
                </div>
              )}

              <div className="input-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="08012345678"
                  className={errors.phoneNumber ? 'error' : ''}
                  required
                />
                {errors.phoneNumber && <span className="error-message">{errors.phoneNumber}</span>}
              </div>

              {currentRole === 'user' && (
                <>
                  <div className="input-group">
                    <label>Bursary Account Number</label>
                    <input
                      type="text"
                      name="bursaryNumber"
                      value={formData.bursaryNumber}
                      onChange={handleInputChange}
                      placeholder="e.g. 142837656"
                      className={errors.bursaryNumber ? 'error' : ''}
                      required
                    />
                    {errors.bursaryNumber && <span className="error-message">{errors.bursaryNumber}</span>}
                  </div>
                  <div className="input-group">
                    <label>BUTH Phone Number</label>
                    <input
                      type="tel"
                      name="buthPhoneNumber"
                      value={formData.buthPhoneNumber}
                      onChange={handleInputChange}
                      placeholder="08012345678"
                      className={errors.buthPhoneNumber ? 'error' : ''}
                      required
                    />
                    {errors.buthPhoneNumber && <span className="error-message">{errors.buthPhoneNumber}</span>}
                  </div>
                </>
              )}
            </div>

            <div className="input-group">
              <label>Create Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                className={errors.password ? 'error' : ''}
                required
              />
              {formData.password && (
                <div className="password-strength">
                  <div className="strength-bar" style={{
                    width: `${(getPasswordStrength(formData.password).strength / 5) * 100}%`,
                    backgroundColor: getPasswordStrength(formData.password).color
                  }} />
                  <span className="strength-label" style={{ color: getPasswordStrength(formData.password).color }}>
                    {getPasswordStrength(formData.password).label}
                  </span>
                </div>
              )}
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            <div className="input-group">
              <label>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="••••••••"
                className={errors.confirmPassword ? 'error' : ''}
                required
              />
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>

            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? <><span className="spinner"></span> Creating Account...</> : 'Create Account'}
            </button>

            <p className="switch-text">
              Already have an account? <a href="/login">Sign in here</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;