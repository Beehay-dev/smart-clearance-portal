import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FaChartLine,
  FaMoneyBillWave,
  FaUserTie,
  FaBook,
  FaHeartbeat,
  FaShieldAlt,
  FaBell,
  FaSignOutAlt,
  FaCog,
  FaComments,
} from "react-icons/fa";
import "./sideBar.css";
import { useAuth } from "../../../../contexts/AuthContext";
import { logoutUser } from "../../../../firebase/auth";

const navItems = [
  { label: "Overview", path: "overview", icon: <FaChartLine /> },
  { label: "Bursary", path: "bursary", icon: <FaMoneyBillWave /> },
  { label: "HOD", path: "hod", icon: <FaUserTie /> },
  { label: "Library", path: "library", icon: <FaBook /> },
  { label: "BUTH", path: "buth", icon: <FaHeartbeat /> },
  { label: "Security", path: "security", icon: <FaShieldAlt /> },
  { label: "Notifications", path: "notifications", icon: <FaBell />, badge: 5 },
  { label: "Chatbot", path: "chatbot", icon: <FaComments /> },
];

// mobileOpen / onCloseMobile are controlled by the parent student layout
// (whichever component wraps this Sidebar + its header), matching the same
// pattern used for DeptSidebar/AdminSidebar on the admin side.
const Sidebar = ({ mobileOpen = false, onCloseMobile = () => {} }) => {
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    const result = await logoutUser();
    if (result.success) {
      localStorage.clear();
      navigate("/login");
    }
  };

  // Mobile drawer UX: Escape closes it, body scroll locks while open.
  useEffect(() => {
    if (!mobileOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCloseMobile();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobileOpen]);

  return (
    <>
      {/* Backdrop — the trigger that OPENS this drawer belongs in the
          student header component, not here (same pattern as admin side). */}
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <nav className="sidebar-nav-container">
          <ul className="sidebar-nav">
            {navItems.map((item, index) => (
              <li key={index}>
                <NavLink
                  to={item.path}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `sidebar-item ${isActive ? "active" : ""}`
                  }
                >
                  <span className="sidebar-icon">{item.icon}</span>
                  <span className="sidebar-label">{item.label}</span>
                  {item.badge && <span className="sidebar-badge">{item.badge}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">
              {userData?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="user-info">
              <div className="user-name">{userData?.fullName || 'Student'}</div>
              <div className="user-matric">{userData?.matricNumber || ''}</div>
            </div>
          </div>

          <div className="sidebar-actions">
            <button className="sidebar-action-btn" title="Settings">
              <FaCog />
            </button>
            <button
              className="sidebar-action-btn logout-btn"
              onClick={() => setShowLogoutConfirm(true)}
              title="Logout"
            >
              <FaSignOutAlt />
            </button>
          </div>
        </div>

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className="logout-modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
            <div className="logout-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Confirm Logout</h3>
              <p>Are you sure you want to logout?</p>
              <div className="logout-modal-actions">
                <button
                  className="btn-cancel"
                  onClick={() => setShowLogoutConfirm(false)}
                >
                  Cancel
                </button>
                <button className="btn-confirm" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
