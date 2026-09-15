/**
 * components/StageHistoryModal.jsx
 * 
 * Timeline modal displaying the end-to-end stage change audit trail for a chapter.
 */

import React, { useEffect, useState } from 'react';
import api from '../api/client';
import StageBadge from './StageBadge';

export const StageHistoryModal = ({ chapterId, chapterTitle, onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!chapterId) return;

    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/chapters/${chapterId}/history`);
        if (res.data.success) {
          setHistory(res.data.history);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load audit history.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [chapterId]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="card-header">
          <div>
            <h2 className="card-title">Audit History: {chapterTitle}</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Complete chronological audit trail for this chapter
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            ✕ Close
          </button>
        </div>

        {loading && <p style={{ padding: '1rem', color: 'var(--text-muted)' }}>Loading audit history...</p>}

        {error && <div className="alert alert-danger">{error}</div>}

        {!loading && history.length === 0 && (
          <p style={{ padding: '1rem', color: 'var(--text-muted)' }}>No audit records found for this chapter.</p>
        )}

        {!loading && history.length > 0 && (
          <div className="timeline" style={{ marginTop: '1.5rem' }}>
            {history.map((entry) => (
              <div key={entry._id} className="timeline-item">
                <div className="timeline-dot" />
                <div className="timeline-header">
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                    {entry.previousStage} ➔ {entry.newStage}
                  </span>
                  <span className="timeline-time">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Action by: <strong>{entry.changedBy?.name || 'System / Admin'}</strong> ({entry.changedBy?.role || 'user'})
                  </span>
                  <StageBadge stage={entry.newStage} />
                </div>
                {entry.note && <div className="timeline-note">{entry.note}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StageHistoryModal;
