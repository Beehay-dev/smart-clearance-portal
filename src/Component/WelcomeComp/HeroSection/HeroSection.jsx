import React from 'react'
import Navbar from '../Navbar/Navbar'
import { FaGraduationCap } from "react-icons/fa";
import Heroimage from '../../../assets/Heroimage.jpg'
import './heroSection.css'
import { BrowserRouter, Link } from 'react-router-dom';

function HeroSection() {
  return (
    <div className="hero-container">
      <Navbar />

      

      <div className="hero-bg">
        <img src={Heroimage} alt="Graduating students" />

        <div className="hero-overlay"></div>

        <div className="hero-content">
          <span className="hero-badge">
            <FaGraduationCap/> Official Graduation Clearance Portal
          </span>

          <h1>
            Digital Clearance for the <br />
            <span>Next Generation</span>
          </h1>

          <p>
            Streamline your final year journey at Babcock University.
            From departmental sign-offs to document verification,
            complete your entire clearance process digitally, securely,
            and 100% paperless.
          </p>
          

          <div className="hero-actions">

            <Link to= "/register" className="primary-btn">
              Start My Clearance →
            </Link>
            <button className="secondary-btn">
              How it Works
            </button>
          </div>

          <hr className='line' />

          <div className="hero-features">
            <span><span style={{color: '#F59E0B'}}>✔</span> Real-time Tracking</span>
            <span><span style={{color: '#F59E0B'}}>✔</span> Secure Digital Vault</span>
            <span><span style={{color: '#F59E0B'}}>✔</span> AI-Guided Support</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HeroSection
