import { useState } from "react";
import Sidebar from "../../Component/DashboardComponents/StudentComp/SideBar/SideBar";
import Header from "../../Component/DashboardComponents/StudentComp/Header/Header";
import { Outlet } from "react-router-dom";
import "./dashboard.css";

const Dashboard = () => {
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="dashboard-root">
      <Header
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen((open) => !open)}
      />
      <div className="dashboard-body">
        <Sidebar
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        <main className="dashboard-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
