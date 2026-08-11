import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminHeader from '../../Component/DashboardComponents/AdminComponent/AdminHeader/AdminHeader';
import AdminSidebar from '../../Component/DashboardComponents/AdminComponent/AdminSidebar/AdminSidebar';
import './adminDashboard.css';

const AdminDashboard = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="admin-dashboard-root">
      <AdminHeader
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen((open) => !open)}
      />
      <div className="admin-dashboard-body">
        <AdminSidebar
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        <main className="admin-dashboard-main">
          <Outlet /> {/* Admin pages render here */}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
