/**
 * pages/TextbookDetail.jsx
 * 
 * Detailed view of a textbook with chapters list, document upload dropzone,
 * transcriber assignment, and direct link to proofreading studio.
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import StageBadge from '../components/StageBadge';
import StageHistoryModal from '../components/StageHistoryModal';
import Alert from '../components/Alert';

export const TextbookDetail = ({ textbookId, setCurrentView, setSelectedChapterId }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [textbook, setTextbook] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Chapter Modal
  const [showAddChapterModal, setShowAddChapterModal] = useState(false);
  const [chapterForm, setChapterForm] = useState({
    chapterNumber: 1,
    chapterTitle: '',
    assignedVolunteer: ''
  });
  const [savingChapter, setSavingChapter] = useState(false);

  // File Upload State
  const [uploadingChapterId, setUploadingChapterId] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Stage History Modal State
  const [activeHistoryChapter, setActiveHistoryChapter] = useState(null);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const [tbRes, volRes] = await Promise.all([
        api.get(`/textbooks/${textbookId}`),
        api.get('/auth/users?role=volunteer')
      ]);

      if (tbRes.data.success) {
        setTextbook(tbRes.data.textbook);
        setChapters(tbRes.data.chapters);
        setChapterForm((prev) => ({
          ...prev,
          chapterNumber: tbRes.data.chapters.length + 1
        }));
      }

      if (volRes.data.success) {
        setVolunteers(volRes.data.users);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load textbook details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (textbookId) {
      fetchDetails();
    }
  }, [textbookId]);

  const handleAddChapter = async (e) => {
    e.preventDefault();
    setSavingChapter(true);
    setError(null);

    try {
      const res = await api.post('/chapters', {
        textbookId,
        chapterNumber: parseInt(chapterForm.chapterNumber, 10),
        chapterTitle: chapterForm.chapterTitle,
        assignedVolunteer: chapterForm.assignedVolunteer || null
      });

      if (res.data.success) {
        setSuccess(`Chapter ${chapterForm.chapterNumber} added successfully.`);
        setShowAddChapterModal(false);
        setChapterForm({
          chapterNumber: chapters.length + 2,
          chapterTitle: '',
          assignedVolunteer: ''
        });
        fetchDetails();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add chapter.');
    } finally {
      setSavingChapter(false);
    }
  };

  const handleFileUpload = async (chapterId, file) => {
    if (!file) return;

    // Validate extension
    const allowed = ['.txt', '.pdf', '.docx'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowed.includes(ext)) {
      setError(`Unsupported file format '${ext}'. Please select a .txt, .pdf, or .docx file.`);
      return;
    }

    setUploadingChapterId(chapterId);
    setUploadLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('chapterId', chapterId);

    try {
      const res = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setSuccess(
          `Document "${file.name}" uploaded! Extracted ${res.data.extractedLength} characters. Status moved to TEXT_EXTRACTION.`
        );
        fetchDetails();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Upload and text extraction failed.');
    } finally {
      setUploadingChapterId(null);
      setUploadLoading(false);
    }
  };

  const handleDeleteChapter = async (chId, title) => {
    if (!window.confirm(`Delete chapter "${title}"? This cannot be undone.`)) return;

    try {
      await api.delete(`/chapters/${chId}`);
      setSuccess(`Chapter deleted.`);
      fetchDetails();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete chapter.');
    }
  };

  if (loading) {
    return <p style={{ color: 'var(--text-muted)' }}>Loading textbook details...</p>;
  }

  if (!textbook) {
    return (
      <div className="card">
        <Alert type="danger" message="Textbook not found." />
        <button className="btn btn-secondary" onClick={() => setCurrentView('textbooks')}>
          Back to Textbooks
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Back Button */}
      <button
        className="btn btn-secondary btn-sm"
        style={{ marginBottom: '1rem' }}
        onClick={() => setCurrentView('textbooks')}
      >
        ← Back to Catalog
      </button>

      {error && <Alert type="danger" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

      {/* Textbook Header Card */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="brand-badge" style={{ fontSize: '0.75rem' }}>
                {textbook.subject}
              </span>
              <span
                style={{
                  background: '#f1f5f9',
                  color: 'var(--secondary)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}
              >
                {textbook.gradeClass}
              </span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {textbook.title}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Author: <strong>{textbook.author}</strong> {textbook.publisher ? `• Publisher: ${textbook.publisher}` : ''}
            </p>
          </div>

          {isAdmin && (
            <button className="btn btn-primary" onClick={() => setShowAddChapterModal(true)}>
              + Add Chapter
            </button>
          )}
        </div>

        {textbook.description && (
          <p style={{ marginTop: '1rem', color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            {textbook.description}
          </p>
        )}
      </div>

      {/* Chapters Table Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Textbook Chapters ({chapters.length})</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Upload source documents (.txt, .pdf, .docx), proofread, and track Braille conversion.
            </p>
          </div>
        </div>

        {chapters.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
              No chapters added to this textbook yet.
            </p>
            {isAdmin && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddChapterModal(true)}>
                Add First Chapter
              </button>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>#</th>
                  <th>Chapter Title</th>
                  <th>Status</th>
                  <th>Assigned Transcriber</th>
                  <th>Document Source</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {chapters.map((ch) => (
                  <tr key={ch._id}>
                    <td>
                      <strong>{ch.chapterNumber}</strong>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{ch.chapterTitle}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {ch.sourceText ? `${ch.sourceText.length} chars source` : 'No text extracted yet'}
                        {ch.brailleText ? ` • ${ch.brailleText.length} Braille cells` : ''}
                      </div>
                    </td>
                    <td>
                      <StageBadge stage={ch.status} />
                    </td>
                    <td>
                      {ch.assignedVolunteer ? (
                        <div>
                          <span style={{ fontWeight: 500 }}>{ch.assignedVolunteer.name}</span>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                            {ch.assignedVolunteer.email}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td>
                      {/* Document Upload Button */}
                      <div>
                        <label
                          className={`btn btn-secondary btn-sm ${
                            uploadLoading && uploadingChapterId === ch._id ? 'disabled' : ''
                          }`}
                          style={{ cursor: 'pointer', display: 'inline-flex' }}
                        >
                          {uploadLoading && uploadingChapterId === ch._id
                            ? 'Extracting...'
                            : '📁 Upload (.txt, .pdf, .docx)'}
                          <input
                            type="file"
                            accept=".txt,.pdf,.docx"
                            style={{ display: 'none' }}
                            disabled={uploadLoading && uploadingChapterId === ch._id}
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleFileUpload(ch._id, e.target.files[0]);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        {/* Open Proofreader Button */}
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            setSelectedChapterId(ch._id);
                            setCurrentView('proofreading');
                          }}
                          title="Open Two-Column Proofreading Workbench"
                        >
                          ✏️ Proofread
                        </button>

                        {/* Audit Trail Button */}
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() =>
                            setActiveHistoryChapter({
                              id: ch._id,
                              title: `Ch ${ch.chapterNumber}: ${ch.chapterTitle}`
                            })
                          }
                          title="View Stage Audit History"
                        >
                          📜 History
                        </button>

                        {/* Delete Chapter (Admin only) */}
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteChapter(ch._id, ch.chapterTitle)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--danger)',
                              cursor: 'pointer',
                              padding: '0.2rem'
                            }}
                            title="Delete chapter"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Chapter Modal */}
      {showAddChapterModal && (
        <div className="modal-overlay" onClick={() => setShowAddChapterModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="card-header">
              <h2 className="card-title">Add Chapter to "{textbook.title}"</h2>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowAddChapterModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddChapter}>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Ch Number *</label>
                  <input
                    type="number"
                    className="form-input"
                    min={1}
                    required
                    value={chapterForm.chapterNumber}
                    onChange={(e) =>
                      setChapterForm({ ...chapterForm, chapterNumber: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Chapter Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. Photosynthesis and Plant Cells"
                    value={chapterForm.chapterTitle}
                    onChange={(e) =>
                      setChapterForm({ ...chapterForm, chapterTitle: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Assign Initial Volunteer (Optional)</label>
                <select
                  className="form-select"
                  value={chapterForm.assignedVolunteer}
                  onChange={(e) =>
                    setChapterForm({ ...chapterForm, assignedVolunteer: e.target.value })
                  }
                >
                  <option value="">-- Leave Unassigned for Now --</option>
                  {volunteers.map((vol) => (
                    <option key={vol._id} value={vol._id}>
                      {vol.name} ({vol.email})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddChapterModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingChapter}>
                  {savingChapter ? 'Adding...' : 'Add Chapter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stage History Modal */}
      {activeHistoryChapter && (
        <StageHistoryModal
          chapterId={activeHistoryChapter.id}
          chapterTitle={activeHistoryChapter.title}
          onClose={() => setActiveHistoryChapter(null)}
        />
      )}
    </div>
  );
};

export default TextbookDetail;
