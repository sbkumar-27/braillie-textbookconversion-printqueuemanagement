/**
 * pages/Textbooks.jsx
 * 
 * Library catalog view of all textbooks with conversion progress indicators.
 * Admin can add new textbooks; all users can browse and view chapters.
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import Alert from '../components/Alert';

export const Textbooks = ({ setCurrentView, setSelectedTextbookId }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [textbooks, setTextbooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    subject: '',
    gradeClass: '',
    publisher: '',
    description: ''
  });
  const [saving, setSaving] = useState(false);

  const fetchTextbooks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/textbooks');
      if (res.data.success) {
        setTextbooks(res.data.textbooks);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load textbooks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTextbooks();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await api.post('/textbooks', formData);
      if (res.data.success) {
        setSuccess(`Textbook "${formData.title}" added to catalog.`);
        setShowAddModal(false);
        setFormData({
          title: '',
          author: '',
          subject: '',
          gradeClass: '',
          publisher: '',
          description: ''
        });
        fetchTextbooks();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create textbook.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}" and all its chapters?`)) {
      return;
    }

    try {
      await api.delete(`/textbooks/${id}`);
      setSuccess(`Deleted "${title}".`);
      fetchTextbooks();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete textbook.');
    }
  };

  const filtered = textbooks.filter(
    (b) =>
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.gradeClass.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* Top Header */}
      <div className="card-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Textbook Library Catalog
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Browse school textbooks being converted to tactile Braille format.
          </p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            + Add New Textbook
          </button>
        )}
      </div>

      {error && <Alert type="danger" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

      {/* Search Filter */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <input
          type="text"
          className="form-input"
          placeholder="🔍 Search textbooks by title, subject, grade, or author..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading && <p style={{ color: 'var(--text-muted)' }}>Loading textbooks catalog...</p>}

      {!loading && filtered.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '1rem' }}>
            No textbooks found in the catalog.
          </p>
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              Add First Textbook
            </button>
          )}
        </div>
      )}

      {/* Textbooks Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '1.5rem'
        }}
      >
        {filtered.map((book) => (
          <div key={book._id} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <span
                style={{
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  padding: '0.2rem 0.5rem',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                {book.subject} • {book.gradeClass}
              </span>
              {isAdmin && (
                <button
                  onClick={() => handleDelete(book._id, book.title)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--danger)',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                  title="Delete textbook"
                >
                  🗑️
                </button>
              )}
            </div>

            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              {book.title}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              By {book.author} {book.publisher ? `• ${book.publisher}` : ''}
            </p>

            {book.description && (
              <p
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-main)',
                  marginBottom: '1rem',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {book.description}
              </p>
            )}

            {/* Progress Section */}
            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>
                  {book.completedChapters} of {book.totalChapters} chapters completed
                </span>
                <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                  {book.progressPercent}%
                </span>
              </div>
              <div
                style={{
                  height: '6px',
                  background: '#e2e8f0',
                  borderRadius: '9999px',
                  overflow: 'hidden',
                  marginBottom: '1rem'
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${book.progressPercent}%`,
                    background: book.progressPercent === 100 ? 'var(--success)' : 'var(--primary)',
                    borderRadius: '9999px',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>

              <button
                className="btn btn-secondary btn-sm"
                style={{ width: '100%' }}
                onClick={() => {
                  setSelectedTextbookId(book._id);
                  setCurrentView('textbook-detail');
                }}
              >
                View Chapters & Upload Documents ➔
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Textbook Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="card-header">
              <h2 className="card-title">Add New Textbook</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAddModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="form-group">
                <label className="form-label">Textbook Title *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. General Science for Middle School"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Author *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="e.g. Dr. Jane Doe"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Subject *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g. Science, Mathematics, History"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Class / Grade *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={formData.gradeClass}
                    onChange={(e) => setFormData({ ...formData, gradeClass: e.target.value })}
                    placeholder="e.g. Grade 5, Class 10"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Publisher (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.publisher}
                    onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                    placeholder="e.g. Oxford University Press"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description / Edition Notes</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief summary of syllabus or textbook content"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Creating...' : 'Create Textbook'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Textbooks;
