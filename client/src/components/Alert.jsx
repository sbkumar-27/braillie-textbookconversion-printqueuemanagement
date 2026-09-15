/**
 * components/Alert.jsx
 * 
 * Accessible alert banner for error, warning, success, and info messages.
 */

import React from 'react';

export const Alert = ({ type = 'info', message, onClose }) => {
  if (!message) return null;

  return (
    <div className={`alert alert-${type}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span>
          {type === 'warning' && '⚠️'}
          {type === 'danger' && '🛑'}
          {type === 'success' && '✅'}
          {type === 'info' && 'ℹ️'}
        </span>
        <span>{message}</span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1rem',
            color: 'inherit',
            fontWeight: 'bold'
          }}
          title="Dismiss"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default Alert;
