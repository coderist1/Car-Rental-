import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/pages/SplashPage.css';

/**
 * SplashPage Component
 * The very first page users see before the LandingPage.
 * Showcases the hero car image with animated entrance and Get Started CTA.
 */
const SplashPage = () => {
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 120);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="splash-wrapper">

      {/* ── Background: car hero image with overlay ── */}
      <div className="splash-bg">
        {/*
          INSTRUCTIONS: Place your car image at /public/car-hero.jpg
          OR replace the background-image URL in SplashPage.css .splash-bg
          with any image path you prefer.
        */}
      </div>

      {/* Dark gradient overlays for readability */}
      <div className="splash-overlay-left" />
      <div className="splash-overlay-top" />
      <div className="splash-overlay-bottom" />

      {/* Grain texture */}
      <div className="splash-grain" />

      {/* ── Top nav bar ── */}
      <nav className={`splash-nav ${loaded ? 'splash-nav--in' : ''}`}>
        <div className="splash-logo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
            <circle cx="7" cy="17" r="2" />
            <path d="M9 17h6" />
            <circle cx="17" cy="17" r="2" />
          </svg>
          <span>Car<strong>Rental</strong></span>
        </div>
        <div className="splash-nav-links">
          <button className="splash-nav-link" onClick={() => navigate('/login')}>Sign In</button>
        </div>
      </nav>

      {/* ── Hero content (right-aligned like the reference image) ── */}
      <main className="splash-content">

        {/* Badge */}
        <div className={`splash-badge ${loaded ? 'splash-badge--in' : ''}`}>
          <span className="splash-badge-dot" />
          1,000+ vehicles available now
        </div>

        {/* Headline */}
        <h1 className={`splash-headline ${loaded ? 'splash-headline--in' : ''}`}>
          <span className="splash-headline-top">DRIVE YOUR WAY</span>
          <span className="splash-headline-bottom">ANY DAY.</span>
        </h1>

        {/* Subtext */}
        <p className={`splash-subtext ${loaded ? 'splash-subtext--in' : ''}`}>
          Premium rentals for every journey — hourly, daily, or long-term.
        </p>

        {/* CTA Button */}
        <div className={`splash-cta-row ${loaded ? 'splash-cta-row--in' : ''}`}>
          <button
            className="splash-btn-primary"
            onClick={() => navigate('/LandingPage')}
          >
            Get Started
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>

          <button
            className="splash-btn-ghost"
            onClick={() => navigate('/register')}
          >
            Create Account
          </button>
        </div>

        {/* Stats row */}
        <div className={`splash-stats ${loaded ? 'splash-stats--in' : ''}`}>
          {[
            { val: '1,200+', label: 'Vehicles' },
            { val: '48',     label: 'Locations' },
            { val: '4.9★',   label: 'Rating' },
          ].map((s, i) => (
            <div className="splash-stat" key={i} style={{ animationDelay: `${0.6 + i * 0.1}s` }}>
              <span className="splash-stat-val">{s.val}</span>
              <span className="splash-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default SplashPage;