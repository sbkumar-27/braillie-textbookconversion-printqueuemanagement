/**
 * pages/Assignments.jsx
 * 
 * Chapter assignments management.
 * Admin can assign chapters to volunteers (with active conflict prevention).
 * Volunteers view their assigned chapters and jump directly to proofreading.
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import StageBadge from '../components/StageBadge';
import Alert from '../components/Alert';

export const Assignments = ({ setCurrentView, setSelectedChapterId }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Admin Assignment Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [textbooks, setTextbooks] = useState([]);
  const [selectedTextbookId, setSelectedTextbookId] = useState('');
  const [chapters, setChapters] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [form, setForm] = useState({
    chapterId: '',
    volunteerId: '',
    stage: 'PROOFREADING',
    notes: ''
  });
  const [assigning, setAssigning] = useState(false);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/assignments');
      if (res.data.success) {
        setAssignments(res.data.assignments);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load assignments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  // When admin opens assignment modal, load dropdown data
  const handleOpenAssignModal = async () => {
    try {
      const [tbRes, volRes] = await Promise.all([
        api.get('/textbooks'),
        api.get('/auth/users?role=volunteer')
      ]);
      if (tbRes.data.success) setTextbooks(tbRes.data.textbooks);
      if (volRes.data.success) setVolunteers(volRes.data.users);
      setShowAssignModal(true);
    } catch (err) {
      setError('Failed to load textbooks and volunteer lists.');
    }
  };

  // When textbook selected in modal, load its chapters
  const handleTextbookChange = async (tbId) => {
    setSelectedTextbookId(tbId);
    setForm((prev) => ({ ...prev, chapterId: '' }));
    if (!tbId) {
      setChapters([]);
      return;
    }
    try {
      const res = await api.get(`/chapters?textbookId=${tbId}`);
      if (res.data.success) {
        setChapters(res.data.chapters);
      }
    } catch (err) {
      console.error('Failed to load chapters for textbook', err);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setAssigning(true);
    setError(null);

    try {
      const res = await api.post('/assignments', form);
      if (res.data.success) {
        setSuccess('Chapter successfully assigned to volunteer.');
        setShowAssignModal(false);
        setForm({ chapterId: '', volunteerId: '', stage: 'PROOFREADING', notes: '' });
        fetchAssignments();
      }
    } catch (err) {
      // Catches duplicate active volunteer on stage!
      setError(err.response?.data?.message || 'Assignment failed.');
    } finally {
      setAssigning(false);
    }
  };

  const handleCompleteAssignment = async (id) => {
    try {
      const res = await api.put(`/assignments/${id}/complete`);
      if (res.data.success) {
        setSuccess('Assignment marked as completed.');
        fetchAssignments();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete assignment.');
    }
  };

  return (
    <div>
      <div className="card-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {isAdmin ? 'Transcriber Chapter Assignments' : 'My Assigned Chapters'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {isAdmin
              ? 'Delegate textbook chapters to volunteer transcribers. Active assignment conflicts are strictly prevented.'
              : 'Chapters assigned to you for text extraction, translation, and proofreading.'}
          </p>
        </div>

        {isAdmin && (
          <button className="btn btn-primary" onClick={handleOpenAssignModal}>
            + Assign Chapter to Volunteer
          </button>
        )}
      </div>

      {error && <Alert type="danger" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

      <div className="card">
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading assignments...</p>
        ) : assignments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
              {isAdmin
                ? 'No active chapter assignments. Click "+ Assign Chapter to Volunteer" to get started.'
                : 'You currently have no assigned chapters. Check back with the library administrator!'}
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Textbook</th>
                  <th>Chapter</th>
                  <th>Stage</th>
                  {isAdmin && <th>Transcriber</th>}
                  <th>Assigned Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <strong>{item.textbookId?.title || 'Untitled Textbook'}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {item.textbookId?.subject} • {item.textbookId?.gradeClass}
                      </div>
                    </td>
                    <td>
                      {item.chapterId ? (
                        <div>
                          <strong>Ch {item.chapterId.chapterNumber}:</strong> {item.chapterId.chapterTitle}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-light)' }}>Chapter deleted</span>
                      )}
                    </td>
                    <td>
                      <StageBadge stage={item.stage} />
                    </td>
                    {isAdmin && (
                      <td>
                        <strong>{item.volunteerId?.name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                          {item.volunteerId?.email}
                        </div>
                      </td>
                    )}
                    <td>
                      <span style={{ fontSize: '0.85rem' }}>
                        {new Date(item.assignedDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          color: item.status === 'ACTIVE' ? 'var(--primary)' : 'var(--success)'
                        }}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {item.chapterId && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              setSelectedChapterId(item.chapterId._id);
                              setCurrentView('proofreading');
                            }}
                          >
                            Open Proofreader ➔
                          </button>
                        )}
                        {item.status === 'ACTIVE' && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleCompleteAssignment(item._id)}
                            title="Mark as completed"
                          >
                            ✓ Done
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

      {/* Admin Assign Chapter Modal */}
      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="card-header">
              <h2 className="card-title">Assign Chapter to Volunteer</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAssignModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAssignment}>
              {/* Step 1: Pick Textbook */}
              <div className="form-group">
                <label className="form-label">1. Select Textbook *</label>
                <select
                  className="form-select"
                  required
                  value={selectedTextbookId}
                  onChange={(e) => handleTextbookChange(e.target.value)}
                >
                  <option value="">-- Choose Textbook --</option>
                  {textbooks.map((tb) => (
                    <option key={tb._id} value={tb._id}>
                      {tb.title} ({tb.gradeClass})
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Pick Chapter */}
              <div className="form-group">
                <label className="form-label">2. Select Chapter *</label>
                <select
                  className="form-select"
                  required
                  disabled={!selectedTextbookId}
                  value={form.chapterId}
                  onChange={(e) => setForm({ ...form, chapterId: e.target.value })}
                >
                  <option value="">
                    {selectedTextbookId ? '-- Choose Chapter --' : 'Select a textbook first'}
                  </option>
                  {chapters.map((ch) => (
                    <option key={ch._id} value={ch._id}>
                      Ch {ch.chapterNumber}: {ch.chapterTitle} (Currently: {ch.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 3: Pick Volunteer */}
              <div className="form-group">
                <label className="form-label">3. Select Volunteer Transcriber *</label>
                <select
                  className="form-select"
                  required
                  value={form.volunteerId}
                  onChange={(e) => setForm({ ...form, volunteerId: e.target.value })}
                >
                  <option value="">-- Choose Transcriber --</option>
                  {volunteers.map((vol) => (
                    <option key={vol._id} value={vol._id}>
                      {vol.name} ({vol.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 4: Stage */}
              <div className="form-group">
                <label className="form-label">4. Target Stage</label>
                <select
                  className="form-select"
                  value={form.stage}
                  onChange={(e) => setForm({ ...form, stage: e.target.value })}
                >
                  <option value="TEXT_EXTRACTION">TEXT_EXTRACTION (Upload & Extract)</option>
                  <option value="BRAILLE_TRANSLATION">BRAILLE_TRANSLATION (Conversion)</option>
                  <option value="PROOFREADING">PROOFREADING (Verify & Edit)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Notes / Instructions (Optional)</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="e.g. Please check formatting of mathematical equations."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAssignModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={assigning}>
                  {assigning ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assignments;
