import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaBell, FaBars, FaTimes, FaCog, FaSignOutAlt, FaUser, FaChevronDown } from 'react-icons/fa';
import './header.css';
import smartLogo from "../../../../assets/smartLogo.jpg";
import profileLogo from "../../../../assets/profileLogo.jpg";
import { useAuth } from '../../../../contexts/AuthContext';
import { logoutUser } from '../../../../firebase/auth';

const Header = ({ mobileMenuOpen = false, onToggleMobileMenu = () => {} }) => {
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const handleLogout = async () => {
    const result = await logoutUser();
    if (result.success) {
      localStorage.clear();
      navigate('/login');
    }
  };

  return (
    <header className="dashboard-header">
      {/* Left Section */}
      <div className="header-left">
        <button
          className="mobile-menu-btn"
          onClick={onToggleMobileMenu}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
        
        <div className="header-brand">
          <img src={smartLogo} alt="Smart Clearance Logo" className="brand-logo" />
          <div className="brand-text">
            <h2>Smart Clearance Portal</h2>
            <span className="brand-subtitle">Student Dashboard</span>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="header-right">
        {/* Notification Bell */}
        <Link to="/dashboard/notifications" className="header-icon-btn">
          <FaBell />
          <span className="notification-badge">5</span>
        </Link>

        {/* Profile Section */}
        <div className="profile-menu-container">
          <button className="profile-btn" onClick={toggleProfileMenu}>
            <img src={profileLogo} alt="Profile" className="profile-avatar-img" />
            <div className="profile-info">
              <span className="profile-name">{userData?.fullName || 'Loading...'}</span>
              <span className="profile-role">{userData?.matricNumber || ''}</span>
            </div>
            <FaChevronDown className="profile-chevron" />
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <>
              <div className="profile-menu-overlay" onClick={toggleProfileMenu}></div>
              <div className="profile-dropdown">
                <div className="dropdown-header">
                  <img src={profileLogo} alt="Profile" className="dropdown-avatar-img" />
                  <div className="dropdown-info">
                    <div className="dropdown-name">{userData?.fullName || 'Student'}</div>
                    <div className="dropdown-email">{userData?.email || ''}</div>
                    <div className="dropdown-matric">{userData?.matricNumber || ''}</div>
                  </div>
                </div>
                
                <div className="dropdown-divider"></div>
                
                <button className="dropdown-item" onClick={() => navigate('/dashboard/overview')}>
                  <FaUser /> My Profile
                </button>
                
                <button className="dropdown-item" onClick={() => navigate('/dashboard/overview')}>
                  <FaCog /> Settings
                </button>
                
                <div className="dropdown-divider"></div>
                
                <button className="dropdown-item logout-item" onClick={handleLogout}>
                  <FaSignOutAlt /> Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
