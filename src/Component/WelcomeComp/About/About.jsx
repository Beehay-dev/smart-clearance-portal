import React from 'react';
import { FiKey, FiCloud, FiActivity } from 'react-icons/fi';
import { BiPen } from 'react-icons/bi';
import { RiRobot2Line } from 'react-icons/ri';
import { IoLeafOutline } from 'react-icons/io5';
import './about.css';

const About = () => {
  const features = [
    {
      icon: <FiKey />,
      iconBg: 'yellow',
      title: 'Sequential Workflow',
      description: 'Smart clearance portal ensures clearance progresses logically from one department to the next.',
      category: 'EFFICIENCY'
    },
    {
      icon: <FiCloud />,
      iconBg: 'teal',
      title: 'Digital Vault',
      description: 'Securely upload and manage all required documents in high resolution for staff verification.',
      category: 'SECURITY'
    },
    {
      icon: <FiActivity />,
      iconBg: 'blue',
      title: 'Real-time Tracking',
      description: 'Instant notifications and live progress bars keep you updated on your approval status across all offices.',
      category: 'USER EXPERIENCE'
    },
    {
      icon: <BiPen />,
      iconBg: 'teal',
      title: 'Digital Signatures',
      description: 'Legally binding digital signatures from departmental heads eliminate the need for physical stamps.',
      category: 'SECURITY'
    },
    {
      icon: <RiRobot2Line />,
      iconBg: 'blue',
      title: 'AI Clearance Guide',
      description: '24/7 intelligent assistant to answer questions about requirements and resolve common portal issues.',
      category: 'USER EXPERIENCE'
    },
    {
      icon: <IoLeafOutline />,
      iconBg: 'yellow',
      title: '100% Paperless',
      description: 'A sustainable, eco-friendly approach to university administration, saving thousands of sheets annually.',
      category: 'EFFICIENCY'
    }
  ];

  return (
    <section className="about-section">
      <div className="about-container">
        {/* Header */}
        <div className="about-header">
          <div className="badge">
            DIGITAL TRANSFORMATION
          </div>
          <h2 className="about-title">
            Streamlining the Path to Graduation
          </h2>
          <p className="about-description">
            The Smart Clearance Portal replaces archaic paper-based systems with a modern, sequential 
            digital workflow designed for efficiency, transparency, and integrity.
          </p>
        </div>

        {/* Features Grid */}
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              {/* Icon */}
              <div className={`feature-icon icon-${feature.iconBg}`}>
                {feature.icon}
              </div>

              {/* Title */}
              <h3 className="feature-title">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="feature-description">
                {feature.description}
              </p>

              {/* Category Label */}
              <div className="feature-category">
                <span>{feature.category}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default About;