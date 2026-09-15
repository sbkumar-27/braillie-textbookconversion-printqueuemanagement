/**
 * pages/Inventory.jsx
 * 
 * Braille paper inventory management.
 * Tracks stock levels, triggers low-stock alerts, provides restock capability,
 * and maintains full ledger of added vs consumed paper transactions.
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import Alert from '../components/Alert';

export const Inventory = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [inventory, setInventory] = useState(null);
  const [isLowStock, setIsLowStock] = useState(false);
  const [warning, setWarning] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Add Stock Modal
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [addQty, setAddQty] = useState(100);
  const [addReason, setAddReason] = useState('New shipment from school supplies');
  const [addingStock, setAddingStock] = useState(false);

  // Settings Modal
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [minLevel, setMinLevel] = useState(100);
  const [paperType, setPaperType] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/inventory');
      if (res.data.success) {
        setInventory(res.data.inventory);
        setIsLowStock(res.data.isLowStock);
        setWarning(res.data.warning);
        setMinLevel(res.data.inventory.minReorderLevel);
        setPaperType(res.data.inventory.paperType);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAddStockSubmit = async (e) => {
    e.preventDefault();
    setAddingStock(true);
    setError(null);

    try {
      const res = await api.post('/inventory/add-stock', {
        quantity: parseInt(addQty, 10),
        reason: addReason
      });

      if (res.data.success) {
        setSuccess(res.data.message);
        setShowAddStockModal(false);
        setAddQty(100);
        fetchInventory();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add paper stock.');
    } finally {
      setAddingStock(false);
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setError(null);

    try {
      const res = await api.put('/inventory/settings', {
        minReorderLevel: parseInt(minLevel, 10),
        paperType
      });

      if (res.data.success) {
        setSuccess('Inventory configuration updated.');
        setShowSettingsModal(false);
        fetchInventory();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return <p style={{ color: 'var(--text-muted)' }}>Loading paper inventory...</p>;
  }

  const transactions = inventory?.transactions ? [...inventory.transactions].reverse() : [];

  return (
    <div>
      <div className="card-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Braille Paper Inventory & Supply Ledger
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Monitor heavyweight paper stock, replenish supplies, and track sheet consumption per embossing job.
          </p>
        </div>

        {isAdmin && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowSettingsModal(true)}>
              ⚙️ Settings
            </button>
            <button className="btn btn-primary" onClick={() => setShowAddStockModal(true)}>
              + Add Paper Stock
            </button>
          </div>
        )}
      </div>

      {isLowStock && <Alert type="warning" message={warning} />}
      {error && <Alert type="danger" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

      {/* Stock Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Current Available Stock
          </div>
          <div
            style={{
              fontSize: '2.5rem',
              fontWeight: 700,
              color: isLowStock ? 'var(--danger)' : 'var(--success)',
              margin: '0.25rem 0'
            }}
          >
            {inventory?.currentStock} sheets
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {inventory?.paperType}
          </p>
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Reorder Threshold
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--primary)', margin: '0.25rem 0' }}>
            {inventory?.minReorderLevel} sheets
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Warning triggers automatically when stock falls to or below this level.
          </p>
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Stock Health Status
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            {isLowStock ? (
              <span
                style={{
                  background: 'var(--warning-bg)',
                  color: 'var(--warning)',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '9999px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  border: '1px solid #fde68a'
                }}
              >
                ⚠️ REORDER REQUIRED
              </span>
            ) : (
              <span
                style={{
                  background: 'var(--success-bg)',
                  color: 'var(--success)',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '9999px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  border: '1px solid #bbf7d0'
                }}
              >
                ✅ STOCK ADEQUATE
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.85rem' }}>
            Total transactions recorded: {transactions.length}
          </p>
        </div>
      </div>

      {/* Transaction History Ledger */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Stock Transaction Ledger</h2>
          <button className="btn btn-secondary btn-sm" onClick={fetchInventory}>
            🔄 Refresh
          </button>
        </div>

        {transactions.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No stock transactions recorded yet.</p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Quantity (Sheets)</th>
                  <th>Description / Reason</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, idx) => (
                  <tr key={idx}>
                    <td>
                      {tx.type === 'ADD' ? (
                        <span
                          style={{
                            background: 'var(--success-bg)',
                            color: 'var(--success)',
                            padding: '0.2rem 0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            fontWeight: 700,
                            fontSize: '0.75rem'
                          }}
                        >
                          + ADDED
                        </span>
                      ) : (
                        <span
                          style={{
                            background: '#fee2e2',
                            color: '#b91c1c',
                            padding: '0.2rem 0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            fontWeight: 700,
                            fontSize: '0.75rem'
                          }}
                        >
                          - CONSUMED
                        </span>
                      )}
                    </td>
                    <td>
                      <strong>
                        {tx.type === 'ADD' ? `+${tx.quantity}` : `-${tx.quantity}`} sheets
                      </strong>
                    </td>
                    <td>{tx.reason || 'General inventory transaction'}</td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(tx.date).toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Stock Modal */}
      {showAddStockModal && (
        <div className="modal-overlay" onClick={() => setShowAddStockModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="card-header">
              <h2 className="card-title">Replenish Braille Paper Stock</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAddStockModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleAddStockSubmit}>
              <div className="form-group">
                <label className="form-label">Number of Sheets to Add *</label>
                <input
                  type="number"
                  className="form-input"
                  min={1}
                  required
                  value={addQty}
                  onChange={(e) => setAddQty(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Restock Reason / PO Reference</label>
                <input
                  type="text"
                  className="form-input"
                  value={addReason}
                  onChange={(e) => setAddReason(e.target.value)}
                  placeholder="e.g. Purchase order #8843 received"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddStockModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={addingStock}>
                  {addingStock ? 'Adding...' : 'Add to Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="card-header">
              <h2 className="card-title">Inventory Settings</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowSettingsModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateSettings}>
              <div className="form-group">
                <label className="form-label">Minimum Reorder Warning Level (Sheets)</label>
                <input
                  type="number"
                  className="form-input"
                  min={0}
                  required
                  value={minLevel}
                  onChange={(e) => setMinLevel(e.target.value)}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Triggers a warning banner when current stock drops below this number.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Paper Type / Description</label>
                <input
                  type="text"
                  className="form-input"
                  value={paperType}
                  onChange={(e) => setPaperType(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowSettingsModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingSettings}>
                  {savingSettings ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
