import { FaFacebookF, FaLinkedinIn, FaInstagram } from 'react-icons/fa'
import { FaXTwitter } from 'react-icons/fa6'
import { HiLocationMarker, HiPhone, HiMail } from 'react-icons/hi'
import { FaGraduationCap } from "react-icons/fa";

import './footer.css'

function Footer() {
  return (
    <footer className="footer-container">
      
      {/* Main Footer */}
      <div className="footer-content">

        {/* Brand Section */}
        <div className="footer-brand">
          <div className="brand-title">
            <span className="brand-icon">
              <FaGraduationCap/>
            </span>
            <h3>Smart Clearance</h3>
          </div>

          <p>
            The official digital clearance portal for Babcock University.
            Streamlining the transition from student to alumnus through
            secure, sequential digital workflows.
          </p>

          <div className="social-icons">
            <FaFacebookF className='icons' />
            <FaXTwitter className='icons'/>
            <FaLinkedinIn className='icons' />
            <FaInstagram className='icons' />
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="footer-links">
          <h4>Quick Navigation</h4>
          <ul>
            <li>Home</li>
            <li>Student Login</li>
            <li>Staff Portal</li>
            <li>AI Support Chat</li>
          </ul>
        </div>

        {/* University Info */}
        <div className="footer-contact">
          <h4>Babcock University</h4>

          <div className="contact-item">
            <HiLocationMarker />
            <span>Ilisan-Remo, Ogun State, Nigeria.<br />P.M.B. 21244 Ikeja, Lagos.</span>
          </div>

          <div className="contact-item">
            <HiPhone />
            <span>+234 (0) 915 077 8437</span>
          </div>

          <div className="contact-item">
            <HiMail />
            <span>support@babcock.edu.ng</span>
          </div>
        </div>

        {/* System Status */}
        <div className="footer-status">
          <h4>System Status</h4>

          <div className="status-card">
            <div className="status-indicator">
              <span className="dot"></span>
              <strong>All Systems Operational</strong>
            </div>

            <p>
              Version 2.4.0 (2026 Build). For technical issues,
              please contact the University ICT Directorate.
            </p>
          </div>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <p>© 2026 Babcock University. All Rights Reserved.</p>

        <div className="footer-bottom-links">
          <span>Privacy Policy</span>
          <span>Terms of Use</span>
          <span>Accessibility</span>
        </div>
      </div>

    </footer>
  )
}

export default Footer
