import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { db, auth } from "../../../../firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { toast } from "react-toastify";
import { 
  FaChartLine, 
  FaMoneyBillWave, 
  FaUserTie, 
  FaBook, 
  FaHeartbeat, 
  FaShieldAlt,
  FaSignOutAlt,
  FaUser,
  FaCog,
  FaUsers,
  FaClipboardCheck,
  FaFileAlt,
  FaChartBar
} from "react-icons/fa";
import "./adminSidebar.css";

// mobileOpen / onCloseMobile are controlled by the parent layout
// (AdminDashboard), which also wires them to AdminHeader's hamburger
// button — same pattern as DeptSidebar / DeptDashboard.
const AdminSidebar = ({ mobileOpen = false, onCloseMobile = () => {} }) => {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState("Clearance Reviews");
  const [adminData, setAdminData] = useState(null);
  const [badges, setBadges] = useState({
    students: 0,
    bursary: 0,
    hod: 0,
    library: 0,
    buth: 0,
    security: 0,
  });


  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const fetchAdminData = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'users', user.uid));
        if (docSnap.exists()) {
          setAdminData(docSnap.data());
        } else {
          setAdminData({ fullName: user.displayName || 'Admin', role: 'Super Admin' });
        }
      } catch (error) {
        toast.error( error.message || 'Failed to load admin data. Please refresh the page.');
      }
    };

    fetchAdminData();
  }, []);

  // Live badge counts from Firestore
  useEffect(() => {
    // Total students
    const q = query(collection(db, 'users'), where('role', '==', 'student'));
    const unsubUsers = onSnapshot(q, (snap) => {
    setBadges(prev => ({ ...prev, students: snap.size }));
});

    // Pending clearances per department
    const departments = ['bursary', 'hod', 'library', 'buth', 'security'];
    const unsubscribers = departments.map(dept => {
      const q = query(
        collection(db, 'clearances'),
        where('department', '==', dept),
        where('status', '==', 'pending')
      );
      return onSnapshot(q, (snap) => {
        setBadges(prev => ({ ...prev, [dept]: snap.size }));
      });
    });

    return () => {
      unsubUsers();
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      toast.error(error.message || 'Failed to logout. Please try again.');
    }
  };

  const toggleSubmenu = (label) => {
    setExpandedMenu(expandedMenu === label ? null : label);
  };

  const getFirstName = (fullName) => {
    return fullName ? fullName.split(' ')[0] : 'Admin';
  };

  const navItems = [
    { label: "Dashboard", path: "overview", icon: <FaChartLine /> },
    { label: "All Students", path: "students", icon: <FaUsers />, badge: badges.students },
    { 
      label: "Clearance Reviews", 
      icon: <FaClipboardCheck />,
      submenu: [
        { label: "Bursary", path: "bursary-review", icon: <FaMoneyBillWave />, badge: badges.bursary },
        { label: "HOD", path: "hod-review", icon: <FaUserTie />, badge: badges.hod },
        { label: "Library", path: "library-review", icon: <FaBook />, badge: badges.library },
        { label: "BUTH", path: "buth-review", icon: <FaHeartbeat />, badge: badges.buth },
        { label: "Security", path: "security-review", icon: <FaShieldAlt />, badge: badges.security },
      ]
    },
    { label: "Reports & Analytics", path: "reports", icon: <FaChartBar /> },
    { label: "Document Archive", path: "documents", icon: <FaFileAlt /> },
  ];

  return (
    <>
      {/* Backdrop — the trigger that OPENS this drawer lives in AdminHeader
          (admin-mobile-menu-btn), not here. */}
      {mobileOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside className={`admin-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Super Admin Badge */}
        <div className="admin-sidebar-header">
          <div className="super-admin-badge">
            <FaShieldAlt />
            <span>Super Admin</span>
          </div>
        </div>

        <nav className="admin-sidebar-nav-container">
          <ul className="admin-sidebar-nav">
            {navItems.map((item, index) => (
              <li key={index}>
                {item.submenu ? (
                  <>
                    <button
                      className={`admin-sidebar-item admin-submenu-toggle ${expandedMenu === item.label ? 'expanded' : ''}`}
                      onClick={() => toggleSubmenu(item.label)}
                    >
                      <span className="admin-sidebar-icon">{item.icon}</span>
                      <span className="admin-sidebar-label">{item.label}</span>
                      <span className="admin-submenu-arrow">▼</span>
                    </button>

                    {expandedMenu === item.label && (
                      <ul className="admin-submenu">
                        {item.submenu.map((subitem, subindex) => (
                          <li key={subindex}>
                            <NavLink
                              to={subitem.path}
                              onClick={onCloseMobile}
                              className={({ isActive }) =>
                                `admin-sidebar-item admin-submenu-item ${isActive ? "active" : ""}`
                              }
                            >
                              <span className="admin-sidebar-icon">{subitem.icon}</span>
                              <span className="admin-sidebar-label">{subitem.label}</span>
                              {subitem.badge > 0 && (
                                <span className="admin-sidebar-badge">{subitem.badge}</span>
                              )}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <NavLink
                    to={item.path}
                    onClick={onCloseMobile}
                    className={({ isActive }) =>
                      `admin-sidebar-item ${isActive ? "active" : ""}`
                    }
                  >
                    <span className="admin-sidebar-icon">{item.icon}</span>
                    <span className="admin-sidebar-label">{item.label}</span>
                    {item.badge > 0 && (
                      <span className="admin-sidebar-badge">{item.badge}</span>
                    )}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-user">
            <div className="admin-user-avatar">
              <FaUser />
            </div>
            <div className="admin-user-info">
              <div className="admin-user-name">
                {adminData ? getFirstName(adminData.fullName) : 'Admin'}
              </div>
              <div className="admin-user-role">Super Admin</div>
            </div>
          </div>

          <div className="admin-sidebar-actions">
            <button className="admin-sidebar-action-btn" title="Settings">
              <FaCog />
            </button>
            <button
              className="admin-sidebar-action-btn admin-logout-btn"
              onClick={() => setShowLogoutConfirm(true)}
              title="Logout"
            >
              <FaSignOutAlt />
            </button>
          </div>
        </div>

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className="admin-logout-modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
            <div className="admin-logout-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Confirm Logout</h3>
              <p>Are you sure you want to logout from the Super Admin panel?</p>
              <div className="admin-logout-modal-actions">
                <button className="admin-btn-cancel" onClick={() => setShowLogoutConfirm(false)}>
                  Cancel
                </button>
                <button className="admin-btn-confirm" onClick={handleLogout}>
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

export default AdminSidebar;
