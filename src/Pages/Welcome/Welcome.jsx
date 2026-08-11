import React from 'react'
import HeroSection from '../../Component/WelcomeComp/HeroSection/HeroSection'
import Navbar from '../../Component/WelcomeComp/Navbar/Navbar'
import About from '../../Component/WelcomeComp/About/About'
import Footer from '../../Component/WelcomeComp/Footer/Footer'

function Welcome() {
  return (
    <div className='welcome-container'>
    
        <div className="hero-control">
            <HeroSection/>
        </div>
        <div className="about-control">
            <About/>
        </div>
        <div className="footer-control">
          <Footer/>
        </div>
    </div>
  )
}

export default Welcome
