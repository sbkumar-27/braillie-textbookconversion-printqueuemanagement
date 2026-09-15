/**
 * App.jsx
 * 
 * Main application component.
 * Orchestrates authentication state, role permissions, and view routing.
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Textbooks from './pages/Textbooks';
import TextbookDetail from './pages/TextbookDetail';
import Proofreading from './pages/Proofreading';
import Assignments from './pages/Assignments';
import PrintQueue from './pages/PrintQueue';
import Inventory from './pages/Inventory';

const MainApp = () => {
  const { user, loading } = useAuth();

  // Navigation & Selected Entity State
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedTextbookId, setSelectedTextbookId] = useState(null);
  const [selectedChapterId, setSelectedChapterId] = useState(null);

  // Auth toggle
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          height: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        <div style={{ fontSize: '3rem' }}>⠿</div>
        <p style={{ color: 'var(--text-muted)' }}>Initializing Braillie System...</p>
      </div>
    );
  }

  // If unauthenticated, show Login or Register
  if (!user) {
    return authMode === 'login' ? (
      <Login onSwitchToRegister={() => setAuthMode('register')} />
    ) : (
      <Register onSwitchToLogin={() => setAuthMode('login')} />
    );
  }

  const isAdmin = user.role === 'admin';

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <Navbar currentView={currentView} setCurrentView={setCurrentView} />

      {/* Main Content Area */}
      <main className="main-content">
        {currentView === 'dashboard' && (
          <Dashboard
            setCurrentView={setCurrentView}
            setSelectedChapterId={setSelectedChapterId}
            setSelectedTextbookId={setSelectedTextbookId}
          />
        )}

        {currentView === 'textbooks' && (
          <Textbooks
            setCurrentView={setCurrentView}
            setSelectedTextbookId={setSelectedTextbookId}
          />
        )}

        {currentView === 'textbook-detail' && (
          <TextbookDetail
            textbookId={selectedTextbookId}
            setCurrentView={setCurrentView}
            setSelectedChapterId={setSelectedChapterId}
          />
        )}

        {currentView === 'proofreading' && (
          <Proofreading
            chapterId={selectedChapterId}
            setCurrentView={setCurrentView}
            setSelectedChapterId={setSelectedChapterId}
          />
        )}

        {currentView === 'assignments' && (
          <Assignments
            setCurrentView={setCurrentView}
            setSelectedChapterId={setSelectedChapterId}
          />
        )}

        {currentView === 'print-queue' && isAdmin && (
          <PrintQueue
            setCurrentView={setCurrentView}
            setSelectedChapterId={setSelectedChapterId}
          />
        )}

        {currentView === 'inventory' && isAdmin && <Inventory />}
      </main>

      {/* Footer */}
      <footer
        style={{
          textAlign: 'center',
          padding: '1.5rem',
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
          borderTop: '1px solid var(--border)',
          background: '#fff'
        }}
      >
        <p>
          Braillie — Braille Textbook Conversion & Print Queue Manager • Academic College Project
        </p>
        <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
          Node.js • Express • MongoDB Atlas • React • Vite • Unicode Braille Engine
        </p>
      </footer>
    </div>
  );
};

export const App = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;
