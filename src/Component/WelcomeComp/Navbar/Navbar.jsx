import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaGraduationCap, FaBars, FaTimes } from "react-icons/fa";
import './navBar.css';
import smartLogo from "../../../assets/smartLogo.jpg"

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  return (
    <header>
      <nav>
        <div className="logo">
           
           <span className='logo1'>
            <FaGraduationCap/>
           </span>
           <div className="logo-text">
              <h2>Smart Clearance</h2>
              {/* <h2>Babcock University</h2> */}
            </div>
        </div>

        <button
          className="nav-mobile-toggle"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <FaTimes /> : <FaBars />}
        </button>

        <div className={`nav-collapsible ${mobileOpen ? 'open' : ''}`}>
          <div className="nav-list">
            <ul>
              <li><Link to="/about" onClick={closeMobile}>Home</Link></li>
              <li><Link to="/about" onClick={closeMobile}>About</Link></li>
              <li><Link to="/contact" onClick={closeMobile}>Contact</Link></li>
              <li><Link to="/quick-links" onClick={closeMobile}>Quick Links</Link></li>
            </ul>
          </div>

          <div className="nav-buttons">
            <Link to="/login" className="login-btn" onClick={closeMobile}>Login</Link>
            <Link to="/register" className="signup-btn" onClick={closeMobile}>Start Clearance</Link>
          </div>
        </div>

      </nav>
    </header>
    
  )
}

export default Navbar;
