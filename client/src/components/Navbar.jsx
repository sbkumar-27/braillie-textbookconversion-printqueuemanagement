/**
 * components/Navbar.jsx
 * 
 * Ultra-stylish, modern floating navigation bar with glassmorphism,
 * segmented pill tabs, role indicators, and user avatar.
 */

import React from 'react';
import { useAuth } from '../context/AuthContext';

export const Navbar = ({ currentView, setCurrentView }) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  // Get user initials for stylish avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="navbar-wrapper">
      <div className="navbar-container">
        {/* Brand Logo & Title */}
        <div
          className="navbar-brand"
          onClick={() => setCurrentView('dashboard')}
          title="Return to Dashboard"
        >
          <div className="brand-icon-box">
            <span className="braille-glyph">⠿</span>
          </div>
          <div className="brand-text-block">
            <span className="brand-title">Braillie</span>
            <span className="brand-subtitle">Tactile Print & Conversion</span>
          </div>
        </div>

        {/* Central Segmented Pill Navigation */}
        <nav className="navbar-nav-pills">
          <button
            className={`nav-pill-btn ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentView('dashboard')}
          >
            <span className="pill-icon">📊</span>
            <span>Dashboard</span>
          </button>

          <button
            className={`nav-pill-btn ${
              currentView === 'textbooks' || currentView === 'textbook-detail' ? 'active' : ''
            }`}
            onClick={() => setCurrentView('textbooks')}
          >
            <span className="pill-icon">📚</span>
            <span>Textbooks</span>
          </button>

          <button
            className={`nav-pill-btn ${currentView === 'assignments' ? 'active' : ''}`}
            onClick={() => setCurrentView('assignments')}
          >
            <span className="pill-icon">👥</span>
            <span>{isAdmin ? 'Assignments' : 'My Tasks'}</span>
          </button>

          {/* Admin Exclusive Links */}
          {isAdmin && (
            <>
              <button
                className={`nav-pill-btn ${currentView === 'print-queue' ? 'active' : ''}`}
                onClick={() => setCurrentView('print-queue')}
              >
                <span className="pill-icon">🖨️</span>
                <span>Print Queue</span>
              </button>

              <button
                className={`nav-pill-btn ${currentView === 'inventory' ? 'active' : ''}`}
                onClick={() => setCurrentView('inventory')}
              >
                <span className="pill-icon">📦</span>
                <span>Paper Stock</span>
              </button>
            </>
          )}

          {/* Volunteer Quick Proofread Access */}
          {!isAdmin && (
            <button
              className={`nav-pill-btn ${currentView === 'proofreading' ? 'active' : ''}`}
              onClick={() => setCurrentView('assignments')}
            >
              <span className="pill-icon">✏️</span>
              <span>Proofreader</span>
            </button>
          )}
        </nav>

        {/* User Profile, Role Badge & Sign Out */}
        <div className="navbar-user-section">
          {/* Role Status Tag */}
          <div className={`user-role-badge role-badge-${user.role}`}>
            <span className="pulse-dot"></span>
            <span>{user.role === 'admin' ? 'Librarian' : 'Transcriber'}</span>
          </div>

          {/* User Avatar & Name */}
          <div className="user-profile-widget" title={`${user.name} (${user.email})`}>
            <div className={`user-avatar-circle avatar-${user.role}`}>
              {getInitials(user.name)}
            </div>
            <div className="user-name-display">
              <span className="user-full-name">{user.name}</span>
            </div>
          </div>

          {/* Sign Out Button */}
          <button
            className="navbar-logout-btn"
            onClick={logout}
            title="Sign out of Braillie"
          >
            <span className="logout-icon">⎋</span>
            <span className="logout-text">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
