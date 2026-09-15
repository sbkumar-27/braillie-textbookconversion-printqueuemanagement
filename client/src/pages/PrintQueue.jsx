/**
 * pages/PrintQueue.jsx
 * 
 * Embossing / Print Queue management console for school librarians.
 * Allows tracking queued jobs, viewing Braille page estimates,
 * and marking jobs completed (which deducts paper from inventory and moves chapter to DONE).
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import Alert from '../components/Alert';

export const PrintQueue = ({ setSelectedChapterId, setCurrentView }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Completion Modal State
  const [selectedJob, setSelectedJob] = useState(null);
  const [sheetsConsumed, setSheetsConsumed] = useState(1);
  const [completing, setCompleting] = useState(false);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await api.get('/print-queue');
      if (res.data.success) {
        setQueue(res.data.queue);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load print queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const openCompleteModal = (job) => {
    setSelectedJob(job);
    setSheetsConsumed(job.brailleSummary?.estimatedPages || 1);
  };

  const handleConfirmComplete = async () => {
    if (!selectedJob) return;

    try {
      setCompleting(true);
      setError(null);

      const res = await api.put(`/print-queue/${selectedJob._id}`, {
        status: 'COMPLETED',
        sheetsConsumed: parseInt(sheetsConsumed, 10)
      });

      if (res.data.success) {
        setSuccess(
          `Job marked COMPLETED! Deducted ${sheetsConsumed} sheets from inventory. Chapter marked as DONE.`
        );
        setSelectedJob(null);
        fetchQueue();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete job.');
    } finally {
      setCompleting(false);
    }
  };

  const queuedJobs = queue.filter((j) => j.status === 'QUEUED');
  const completedJobs = queue.filter((j) => j.status === 'COMPLETED');

  return (
    <div>
      <div className="card-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Braille Embossing & Print Queue
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Manage tactile Braille printing for verified chapters. Chapters enter here only after transcriber proofreading approval.
          </p>
        </div>
      </div>

      {error && <Alert type="danger" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

      {/* Active Queue Section */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Pending Embossing Jobs ({queuedJobs.length})</h2>
          <button className="btn btn-secondary btn-sm" onClick={fetchQueue}>
            🔄 Refresh Queue
          </button>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading queue...</p>
        ) : queuedJobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem' }}>
            <p style={{ color: 'var(--text-muted)' }}>
              No chapters currently pending embossing. Proofread and approve chapters in the Proofreader Studio to queue them.
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '70px' }}>Queue #</th>
                  <th>Chapter & Textbook</th>
                  <th>Braille Length</th>
                  <th>Est. Sheets</th>
                  <th>Approved By</th>
                  <th>Enqueued At</th>
                  {isAdmin && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {queuedJobs.map((job) => (
                  <tr key={job._id}>
                    <td>
                      <span
                        style={{
                          background: '#ede9fe',
                          color: '#6d28d9',
                          fontWeight: 700,
                          padding: '0.2rem 0.5rem',
                          borderRadius: 'var(--radius-sm)'
                        }}
                      >
                        #{job.queuePosition}
                      </span>
                    </td>
                    <td>
                      <strong>
                        {job.textbookId?.title}: Ch {job.chapterId?.chapterNumber}
                      </strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {job.chapterId?.chapterTitle}
                      </div>
                    </td>
                    <td>
                      <span>{job.brailleSummary?.charCount || 0} Braille cells</span>
                    </td>
                    <td>
                      <strong>{job.brailleSummary?.estimatedPages || 1} sheets</strong>
                    </td>
                    <td>
                      <span>{job.requestedBy?.name || 'Transcriber'}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem' }}>
                        {new Date(job.createdAt).toLocaleString()}
                      </span>
                    </td>
                    {isAdmin && (
                      <td>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => openCompleteModal(job)}
                        >
                          🖨️ Mark Embossed
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Completed Jobs History */}
      <div className="card">
        <h2 className="card-title" style={{ marginBottom: '1rem' }}>
          Completed Embossing Archive ({completedJobs.length})
        </h2>

        {completedJobs.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
            No embossing jobs completed yet.
          </p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Chapter & Textbook</th>
                  <th>Paper Consumed</th>
                  <th>Embossed By</th>
                  <th>Completion Date</th>
                  <th>Final Status</th>
                </tr>
              </thead>
              <tbody>
                {completedJobs.map((job) => (
                  <tr key={job._id}>
                    <td>
                      <strong>
                        {job.textbookId?.title}: Ch {job.chapterId?.chapterNumber}
                      </strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {job.chapterId?.chapterTitle}
                      </div>
                    </td>
                    <td>
                      <strong>{job.sheetsConsumed || 1} sheets</strong>
                    </td>
                    <td>
                      <span>{job.completedBy?.name || 'Administrator'}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem' }}>
                        {job.completedDate ? new Date(job.completedDate).toLocaleString() : '-'}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          background: 'var(--stage-done-bg)',
                          color: 'var(--stage-done)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '9999px',
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }}
                      >
                        ✓ COMPLETED (DONE)
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mark Completed Modal */}
      {selectedJob && (
        <div className="modal-overlay" onClick={() => setSelectedJob(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="card-header">
              <h2 className="card-title">Confirm Embossing Completion</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedJob(null)}>
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '1rem', lineHeight: 1.6 }}>
              You are marking the print job for{' '}
              <strong>
                {selectedJob.textbookId?.title} — Ch {selectedJob.chapterId?.chapterNumber}:{' '}
                {selectedJob.chapterId?.chapterTitle}
              </strong>{' '}
              as completed.
              <br />
              This will set the chapter status to <strong>DONE</strong> and deduct paper sheets from inventory.
            </p>

            <div className="form-group">
              <label className="form-label">Heavyweight Braille Paper Sheets Consumed *</label>
              <input
                type="number"
                className="form-input"
                min={1}
                required
                value={sheetsConsumed}
                onChange={(e) => setSheetsConsumed(e.target.value)}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Based on ~1,000 cells per page. You can adjust this to the exact sheet count used.
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedJob(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={handleConfirmComplete}
                disabled={completing}
              >
                {completing ? 'Updating...' : 'Confirm Embossing & Deduct Paper'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrintQueue;
