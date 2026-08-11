import React from "react";
import Header from "../Header/Header";
import AIChatBox from "../AIChatBox/AIChatBox"; 
import { Outlet } from "react-router-dom"; // assumes React Router v6+

import "./layout.css"; // If you’ve styled it separately

const Layout = () => {
  return (
    <div className="student-dashboard-root">
      <Header />
      <div className="layout-content">
        <Sidebar />
        <main className="main-outlet">
          <Outlet />
        </main>
        <AIChatBox /> {/* Optional, can be conditionally rendered */}
      </div>
    </div>
  );
};

export default Layout;
