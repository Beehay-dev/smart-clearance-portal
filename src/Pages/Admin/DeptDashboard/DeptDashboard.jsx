import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import DeptSidebar from "./DeptSidebar";
import AdminHeader from '../../../Component/DashboardComponents/AdminComponent/AdminHeader/AdminHeader';
import './deptDashboard.css';

const DeptDashboard = ({ dept, adminType }) => {
  // Verify the logged-in user actually belongs to this department
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');

  if (userData.adminType !== adminType) {
    return <Navigate to="/login" replace />;
  }

  // Lifted here because AdminHeader's hamburger button and DeptSidebar's
  // drawer are siblings, not parent/child — they need a shared source of
  // truth to open/close together.
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="dept-dashboard-root">
      <AdminHeader
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen((open) => !open)}
      />
      <div className="dept-dashboard-body">
        <DeptSidebar
          dept={dept}
          adminType={adminType}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />
        <main className="dept-dashboard-main">
          <Outlet />
          {/* If no nested route, show DeptOverview directly */}
        </main>
      </div>
    </div>
  );
};

export default DeptDashboard;
