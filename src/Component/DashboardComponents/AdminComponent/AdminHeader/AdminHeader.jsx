import React, { useState, useEffect } from "react";
import { FaBell, FaBars, FaTimes, FaUser, FaCog, FaSignOutAlt, FaChevronDown, FaShieldAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../../../../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { toast } from "react-toastify";
import "./adminHeader.css";
import smartLogo from "../../../../assets/smartLogo.jpg";
import profileLogo from "../../../../assets/profileLogo.jpg";

const AdminHeader = ({ mobileMenuOpen = false, onToggleMobileMenu = () => {} }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  // Load admin data from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('userData');
    if (stored) {
      setAdminData(JSON.parse(stored));
    }
  }, []);

  // Live unread notifications count
  useEffect(() => {
    if (!adminData?.uid) return;

    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', adminData.uid),
      where('read', '==', false)
    );
    const unsub = onSnapshot(q, (snap) => {
      setUnreadCount(snap.size);
    });
    return () => unsub();
  }, [adminData?.uid]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userData');
      navigate("/login");
    } catch (error) {
      toast.error(error.message || 'Failed to logout. Please try again.');
    }
  };

  // Format adminType to readable label
  const getRoleLabel = (adminType) => {
    const labels = {
      super_admin:    'Super Admin',
      bursary_admin:  'Bursary Admin',
      hod_admin:      'HOD Admin',
      library_admin:  'Library Admin',
      buth_admin:     'BUTH Admin',
      security_admin: 'Security Admin',
    };
    return labels[adminType] || 'Administrator';
  };

  const getFirstName = (fullName) => fullName ? fullName.split(' ')[0] : 'Admin';

  return (
    <header className="admin-header">
      <div className="admin-header-left">
        <button
          className="admin-mobile-menu-btn"
          onClick={onToggleMobileMenu}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>

        <div className="admin-header-brand">
          <img src={smartLogo} alt="Smart Clearance" className="admin-brand-logo" />
          <div className="admin-brand-text">
            <h2>Smart Clearance Portal</h2>
            <span className="admin-brand-subtitle">
              <FaShieldAlt /> {adminData ? getRoleLabel(adminData.adminType) : 'Admin Dashboard'}
            </span>
          </div>
        </div>
      </div>

      <div className="admin-header-right">
        {/* Notifications */}
        <button
          className="admin-header-icon-btn"
          title="Notifications"
        >
          <FaBell />
          {unreadCount > 0 && (
            <span className="admin-notification-badge">{unreadCount}</span>
          )}
        </button>

        {/* Profile Menu */}
        <div className="admin-profile-menu-container">
          <button
            className="admin-profile-btn"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <img src={profileLogo} alt="Profile" className="admin-profile-avatar-img" />
            <div className="admin-profile-info">
              <span className="admin-profile-name">
                {adminData ? getFirstName(adminData.fullName) : 'Admin'}
              </span>
              <span className="admin-profile-role">
                {adminData ? getRoleLabel(adminData.adminType) : 'Administrator'}
              </span>
            </div>
            <FaChevronDown className="admin-profile-chevron" />
          </button>

          {showProfileMenu && (
            <>
              <div
                className="admin-profile-menu-overlay"
                onClick={() => setShowProfileMenu(false)}
              />
              <div className="admin-profile-dropdown">
                <div className="admin-dropdown-header">
                  <img src={profileLogo} alt="Profile" className="admin-dropdown-avatar-img" />
                  <div className="admin-dropdown-info">
                    <div className="admin-dropdown-name">
                      {adminData?.fullName || 'Admin'}
                    </div>
                    <div className="admin-dropdown-email">
                      {adminData?.email || '—'}
                    </div>
                    <div className="admin-dropdown-role">
                      <FaShieldAlt /> {adminData ? getRoleLabel(adminData.adminType) : 'Administrator'}
                    </div>
                  </div>
                </div>

                <div className="admin-dropdown-divider" />

                <button className="admin-dropdown-item">
                  <FaUser /><span>My Profile</span>
                </button>
                <button className="admin-dropdown-item">
                  <FaCog /><span>Settings</span>
                </button>

                <div className="admin-dropdown-divider" />

                <button className="admin-dropdown-item admin-logout-item" onClick={handleLogout}>
                  <FaSignOutAlt /><span>Logout</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
