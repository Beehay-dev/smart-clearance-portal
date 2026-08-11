import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { db, auth } from "../../../firebase";
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import {
  FaChartLine,
  FaClipboardCheck,
  FaSignOutAlt,
  FaUser,
  FaCog,
  FaShieldAlt,
  FaMoneyBillWave,
  FaUserTie,
  FaBook,
  FaHeartbeat,
  FaBell,
  FaTimes
} from 'react-icons/fa';
import './deptSidebar.css';

const DEPT_CONFIG = {
  bursary:  { label: 'Bursary',  icon: <FaMoneyBillWave />, color: '#3b82f6', adminType: 'bursary_admin'  },
  hod:      { label: 'HOD',      icon: <FaUserTie />,       color: '#8b5cf6', adminType: 'hod_admin'      },
  library:  { label: 'Library',  icon: <FaBook />,          color: '#10b981', adminType: 'library_admin'  },
  buth:     { label: 'BUTH',     icon: <FaHeartbeat />,     color: '#ef4444', adminType: 'buth_admin'     },
  security: { label: 'Security', icon: <FaShieldAlt />,     color: '#f59e0b', adminType: 'security_admin' },
};

// mobileOpen / onCloseMobile are controlled by the parent layout (DeptDashboard),
// which also wires them to AdminHeader's hamburger button — the two live as
// siblings so the open/close state has to be shared, not owned locally here.
const DeptSidebar = ({ dept, adminType, mobileOpen = false, onCloseMobile = () => {} }) => {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);

  const config = DEPT_CONFIG[dept];

  // Guard against an invalid/unknown dept param instead of silently
  // rendering with undefined label/icon/color.
  useEffect(() => {
    if (!config) {
      toast.error('Unknown department. Redirecting to dashboard.');
      navigate('/admindashboard', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dept]);

  // Load admin data from localStorage
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('userData') || '{}');
      setAdminData(stored);
    } catch {
      // Malformed/corrupted localStorage value — fall back safely
      // rather than crashing the sidebar.
      setAdminData({});
    }
  }, []);

  // Live pending count for this department
  useEffect(() => {
    if (!dept) return;

    const q = query(
      collection(db, 'clearances'),
      where('department', '==', dept),
      where('status', '==', 'pending')
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setPendingCount(snap.size);
      },
      (error) => {
        // onSnapshot errors (e.g. permission-denied from Firestore
        // rules) fail silently by default — surface them instead.
        toast.error('Could not load pending count.');
      }
    );
    return () => unsub();
  }, [dept]);

  // Mobile drawer UX niceties: Escape closes it, and body scroll is
  // locked while it's open so the page behind it doesn't scroll too.
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

  // Close the drawer automatically whenever the department route changes.
  useEffect(() => {
    onCloseMobile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dept]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userData');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to log out. Please try again.');
    }
  };

  const getFirstName = (fullName) => fullName ? fullName.split(' ')[0] : 'Admin';

  // Avoid rendering with a broken config while the redirect above kicks in.
  if (!config) return null;

  return (
    <>
      {/* Backdrop — clicking it closes the drawer. The trigger button that
          opens it lives in AdminHeader (admin-mobile-menu-btn), not here. */}
      {mobileOpen && (
        <div
          className="dept-sidebar-overlay"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside className={`dept-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Department Badge */}
        <div className="dept-sidebar-header">
          <div
            className="dept-badge"
            style={{ backgroundColor: `${config.color}20`, color: config.color }}
          >
            {config.icon}
            <span>{config.label} Admin</span>
          </div>
          <button
            className="dept-sidebar-close"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
          >
            <FaTimes />
          </button>
        </div>

        {/* Navigation */}
        <nav className="dept-sidebar-nav">
          <ul>
            {/* Overview */}
            <li>
              <NavLink
                to={`/admindashboard/${dept}`}
                end
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `dept-sidebar-item ${isActive ? 'active' : ''}`
                }
              >
                <span className="dept-sidebar-icon"><FaChartLine /></span>
                <span className="dept-sidebar-label">Dashboard</span>
              </NavLink>
            </li>

            {/* Pending Reviews */}
            <li>
              <NavLink
                to={`/admindashboard/${dept}/pending`}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `dept-sidebar-item ${isActive ? 'active' : ''}`
                }
              >
                <span className="dept-sidebar-icon"><FaClipboardCheck /></span>
                <span className="dept-sidebar-label">Pending Reviews</span>
                {pendingCount > 0 && (
                  <span className="dept-sidebar-badge">{pendingCount}</span>
                )}
              </NavLink>
            </li>

            {/* Approved */}
            <li>
              <NavLink
                to={`/admindashboard/${dept}/approved`}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `dept-sidebar-item ${isActive ? 'active' : ''}`
                }
              >
                <span className="dept-sidebar-icon"><FaClipboardCheck /></span>
                <span className="dept-sidebar-label">Approved</span>
              </NavLink>
            </li>

            {/* Notifications */}
            <li>
              <NavLink
                to={`/admindashboard/${dept}/notifications`}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `dept-sidebar-item ${isActive ? 'active' : ''}`
                }
              >
                <span className="dept-sidebar-icon"><FaBell /></span>
                <span className="dept-sidebar-label">Notifications</span>
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* Footer */}
        <div className="dept-sidebar-footer">
          <div className="dept-sidebar-user">
            <div className="dept-user-avatar"><FaUser /></div>
            <div className="dept-user-info">
              <div className="dept-user-name">
                {adminData ? getFirstName(adminData.fullName) : 'Admin'}
              </div>
              <div className="dept-user-role">{config.label} Admin</div>
            </div>
          </div>

          <div className="dept-sidebar-actions">
            <button className="dept-action-btn" title="Settings">
              <FaCog />
            </button>
            <button
              className="dept-action-btn dept-logout-btn"
              onClick={() => setShowLogoutConfirm(true)}
              title="Logout"
            >
              <FaSignOutAlt />
            </button>
          </div>
        </div>

        {/* Logout Modal */}
        {showLogoutConfirm && (
          <div className="dept-logout-overlay" onClick={() => setShowLogoutConfirm(false)}>
            <div className="dept-logout-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Confirm Logout</h3>
              <p>Are you sure you want to logout from the {config.label} Admin panel?</p>
              <div className="dept-logout-actions">
                <button className="dept-btn-cancel" onClick={() => setShowLogoutConfirm(false)}>
                  Cancel
                </button>
                <button className="dept-btn-confirm" onClick={handleLogout}>
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

export default DeptSidebar;
