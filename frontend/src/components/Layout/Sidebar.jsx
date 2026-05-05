import React, { useState } from 'react';
import { HiOutlineMicrophone, HiOutlineDocumentText, HiOutlineCog6Tooth, HiOutlineSparkles, HiOutlineBars3, HiOutlineXMark } from 'react-icons/hi2';
import './Layout.css';

const tabs = [
  { id: 'agent', label: 'Voice Agent', icon: HiOutlineMicrophone },
  { id: 'knowledge', label: 'Knowledge Base', icon: HiOutlineDocumentText },
  { id: 'prompt', label: 'System Prompt', icon: HiOutlineCog6Tooth },
];

function Sidebar({ activeTab, onTabChange, connectionState }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleTabChange = (tabId) => {
    onTabChange(tabId);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile top bar */}
      <div className="mobile-topbar">
        <div className="mobile-logo">
          <div className="logo-icon">
            <HiOutlineSparkles />
          </div>
          <span className="mobile-logo-text">Voice AI</span>
        </div>
        <div className="mobile-topbar-right">
          <div className={`status-badge-mini ${connectionState}`}>
            <span className="status-dot"></span>
          </div>
          <button
            className="hamburger-btn"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <HiOutlineXMark /> : <HiOutlineBars3 />}
          </button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar nav */}
      <nav className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">
              <HiOutlineSparkles />
            </div>
            <div className="logo-text">
              <h1>Voice AI</h1>
              <span className="logo-subtitle">Agent</span>
            </div>
          </div>
        </div>

        <div className="sidebar-nav">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              id={`nav-${tab.id}`}
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              <tab.icon className="nav-icon" />
              <span className="nav-label">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className={`status-badge ${connectionState}`}>
            <span className="status-dot"></span>
            <span className="status-text">
              {connectionState === 'connected'
                ? 'Connected'
                : connectionState === 'connecting'
                ? 'Connecting...'
                : 'Disconnected'}
            </span>
          </div>
        </div>
      </nav>
    </>
  );
}

export default Sidebar;
