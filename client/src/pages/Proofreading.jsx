/**
 * pages/Proofreading.jsx
 * 
 * Two-column Proofreading Workbench:
 *  - LEFT: Editable original/extracted source text with stats
 *  - RIGHT: Interactive Unicode Braille preview with Grade 1 / Grade 2 toggle
 * 
 * Mandates human verification before approving chapter for Embossing.
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import StageBadge from '../components/StageBadge';
import StageHistoryModal from '../components/StageHistoryModal';
import Alert from '../components/Alert';

export const Proofreading = ({ chapterId, setCurrentView, setSelectedChapterId }) => {
  const { user } = useAuth();

  const [chaptersList, setChaptersList] = useState([]);
  const [currentChapter, setCurrentChapter] = useState(null);
  const [sourceText, setSourceText] = useState('');
  const [brailleText, setBrailleText] = useState('');
  const [brailleGrade, setBrailleGrade] = useState('GRADE_1');
  const [brailleFontSize, setBrailleFontSize] = useState(1.5); // rem

  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Approval Modal
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approvalNote, setApprovalNote] = useState('');

  // History Modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Fetch list of available chapters for dropdown
  useEffect(() => {
    const fetchChapters = async () => {
      try {
        const res = await api.get('/chapters');
        if (res.data.success) {
          setChaptersList(res.data.chapters);

          // If no specific chapterId passed, pick first available chapter
          if (!chapterId && res.data.chapters.length > 0) {
            setSelectedChapterId(res.data.chapters[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to load chapter list', err);
      }
    };

    fetchChapters();
  }, [chapterId, setSelectedChapterId]);

  // Load specific chapter data
  useEffect(() => {
    if (!chapterId) return;

    const loadChapter = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/chapters/${chapterId}`);
        if (res.data.success) {
          const ch = res.data.chapter;
          setCurrentChapter(ch);
          setSourceText(ch.sourceText || '');
          setBrailleText(ch.brailleText || '');
          setBrailleGrade(ch.brailleGrade || 'GRADE_1');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load chapter details.');
      } finally {
        setLoading(false);
      }
    };

    loadChapter();
  }, [chapterId]);

  // Handler: Re-translate from current source text
  const handleTranslate = async (overrideGrade) => {
    const gradeToUse = overrideGrade || brailleGrade;
    if (!sourceText.trim()) {
      setError('Cannot translate empty source text. Please type or upload text first.');
      return;
    }

    try {
      setTranslating(true);
      setError(null);

      // Save proofreading state and re-translate on server
      const res = await api.put(`/chapters/${chapterId}/proofread`, {
        sourceText,
        brailleGrade: gradeToUse,
        note: `Re-translated source text to Braille using ${gradeToUse}.`
      });

      if (res.data.success) {
        setCurrentChapter(res.data.chapter);
        setBrailleText(res.data.chapter.brailleText);
        setBrailleGrade(res.data.chapter.brailleGrade);
        setSuccess(`Translation updated to ${gradeToUse === 'GRADE_2' ? 'Grade 2 (Subset)' : 'Grade 1'}.`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Translation failed.');
    } finally {
      setTranslating(false);
    }
  };

  // Handler: Save draft without approving
  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      setError(null);

      const res = await api.put(`/chapters/${chapterId}/proofread`, {
        sourceText,
        brailleGrade,
        note: 'Transcriber saved proofreading draft edits.'
      });

      if (res.data.success) {
        setCurrentChapter(res.data.chapter);
        setSuccess('Proofreading draft saved successfully.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save draft.');
    } finally {
      setSaving(false);
    }
  };

  // Handler: Mandatory Human Approval for Embossing
  const handleApprove = async () => {
    try {
      setApproving(true);
      setError(null);

      const res = await api.post(`/chapters/${chapterId}/approve`, {
        note: approvalNote || 'Proofreading verified and approved by transcriber.'
      });

      if (res.data.success) {
        setCurrentChapter(res.data.chapter);
        setShowApproveModal(false);
        setSuccess(
          `🎉 Chapter approved! Enqueued to Print Queue at position #${res.data.printJob?.queuePosition}.`
        );
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve chapter for embossing.');
    } finally {
      setApproving(false);
    }
  };

  // Copy Braille to clipboard
  const handleCopyBraille = () => {
    if (!brailleText) return;
    navigator.clipboard.writeText(brailleText);
    setSuccess('Unicode Braille copied to clipboard!');
  };

  const wordCount = sourceText.trim() ? sourceText.trim().split(/\s+/).length : 0;
  const estimatedPages = Math.max(1, Math.ceil((brailleText.length || 0) / 1000));

  return (
    <div>
      {/* Top Header & Chapter Switcher */}
      <div className="card-header" style={{ flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Proofreading & Braille Translation Studio
            </h1>
            {currentChapter && <StageBadge stage={currentChapter.status} />}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Two-column human verification workbench. Edit source text, select Grade 1 or Grade 2, and approve for embossing.
          </p>
        </div>

        {/* Chapter Selection Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>
            Switch Chapter:
          </label>
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '220px' }}
            value={chapterId || ''}
            onChange={(e) => setSelectedChapterId(e.target.value)}
          >
            {chaptersList.map((ch) => (
              <option key={ch._id} value={ch._id}>
                {ch.textbookId?.title ? `${ch.textbookId.title} - ` : ''}Ch {ch.chapterNumber}: {ch.chapterTitle}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <Alert type="danger" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>Loading chapter workbench...</p>
        </div>
      ) : !currentChapter ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>No chapter selected. Please pick a chapter from above.</p>
        </div>
      ) : (
        <>
          {/* Main Action Bar */}
          <div
            className="card"
            style={{
              padding: '0.85rem 1.25rem',
              marginBottom: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
              background: '#ffffff'
            }}
          >
            {/* Left Controls: Translation & Grade */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Braille Grade:</label>
              <select
                className="form-select"
                style={{ width: 'auto', padding: '0.4rem 0.75rem' }}
                value={brailleGrade}
                onChange={(e) => {
                  const newGrade = e.target.value;
                  setBrailleGrade(newGrade);
                  handleTranslate(newGrade);
                }}
              >
                <option value="GRADE_1">Grade 1 (Full Alphabet, Digits, Punctuation)</option>
                <option value="GRADE_2">Grade 2 (Supported Verified Subset)</option>
              </select>

              <button
                className="btn btn-primary btn-sm"
                onClick={() => handleTranslate()}
                disabled={translating}
              >
                {translating ? 'Translating...' : '🔄 Re-translate'}
              </button>

              <button
                className="btn btn-secondary btn-sm"
                onClick={handleSaveDraft}
                disabled={saving}
              >
                {saving ? 'Saving...' : '💾 Save Draft'}
              </button>
            </div>

            {/* Right Controls: History & Approval */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowHistoryModal(true)}
              >
                📜 Stage History
              </button>

              {/* Mandatory Human Approval Button */}
              {currentChapter.status !== 'EMBOSSING' && currentChapter.status !== 'DONE' ? (
                <button
                  className="btn btn-success btn-sm"
                  onClick={() => setShowApproveModal(true)}
                  disabled={!brailleText}
                  title={
                    !brailleText
                      ? 'Generate Braille translation before approving'
                      : 'Approve chapter and send to Embossing Print Queue'
                  }
                >
                  ✅ Approve for Embossing
                </button>
              ) : (
                <span
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: currentChapter.status === 'DONE' ? 'var(--success)' : '#7c3aed'
                  }}
                >
                  {currentChapter.status === 'DONE'
                    ? '🎉 Embossing Completed'
                    : '🖨️ In Print Queue'}
                </span>
              )}
            </div>
          </div>

          {/* TWO-COLUMN PROOFREADING WORKBENCH */}
          <div className="proofreader-grid">
            {/* LEFT COLUMN: Source Text Editor */}
            <div className="editor-column">
              <div className="editor-toolbar">
                <div>
                  <strong style={{ fontSize: '0.9rem' }}>📄 Original / Extracted Text</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                    (Editable)
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {wordCount} words • {sourceText.length} characters
                </div>
              </div>

              <textarea
                className="editor-pane"
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder="Paste or upload text here. Once edited, click 'Re-translate' to update Braille..."
              />
            </div>

            {/* RIGHT COLUMN: Real Unicode Braille Display */}
            <div className="editor-column">
              <div className="editor-toolbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <strong style={{ fontSize: '0.9rem' }}>⠿ Unicode Braille Output</strong>
                  <span
                    style={{
                      background: 'var(--stage-translation-bg)',
                      color: 'var(--stage-translation)',
                      padding: '0.1rem 0.4rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.7rem',
                      fontWeight: 600
                    }}
                  >
                    {brailleGrade === 'GRADE_2' ? 'Grade 2' : 'Grade 1'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {/* Font Size Adjuster for Tactile Dot Readability */}
                  <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.1rem 0.4rem', fontSize: '0.75rem' }}
                      onClick={() => setBrailleFontSize((prev) => Math.max(1, prev - 0.2))}
                      title="Decrease font size"
                    >
                      A-
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.1rem 0.4rem', fontSize: '0.75rem' }}
                      onClick={() => setBrailleFontSize((prev) => Math.min(2.5, prev + 0.2))}
                      title="Increase font size"
                    >
                      A+
                    </button>
                  </div>

                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={handleCopyBraille}
                    disabled={!brailleText}
                    title="Copy Unicode Braille to clipboard"
                  >
                    📋 Copy
                  </button>
                </div>
              </div>

              <div className="braille-pane" style={{ fontSize: `${brailleFontSize}rem` }}>
                {brailleText ? (
                  brailleText
                ) : (
                  <span style={{ color: 'var(--text-light)', fontSize: '1rem', fontStyle: 'italic' }}>
                    No Braille generated yet. Click "Re-translate" above to convert source text to Unicode Braille cells.
                  </span>
                )}
              </div>

              {/* Bottom stats for Braille page calculations */}
              <div
                style={{
                  padding: '0.5rem 1rem',
                  background: '#f8fafc',
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)'
                }}
              >
                <span>Cells: <strong>{brailleText.length}</strong></span>
                <span>Estimated Braille Sheets: <strong>~{estimatedPages} sheets</strong></span>
              </div>
            </div>
          </div>

          {/* Educational Callout on Grade 2 Scope */}
          <div
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              background: '#f1f5f9',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              color: 'var(--text-muted)'
            }}
          >
            ℹ️ <strong>Scope Note:</strong> Grade 1 converts full alphabet, capitalized words, numbers with number sign (⠼), and punctuation. Grade 2 employs a verified common subset (wordsigns: <em>the, and, for, of, with, but, have, that, not, you, can, people</em>; groupsigns: <em>ch, sh, th, wh, er, ou, ow, ing, ed, ar</em>).
          </div>
        </>
      )}

      {/* Mandatory Human Approval Modal */}
      {showApproveModal && (
        <div className="modal-overlay" onClick={() => setShowApproveModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="card-header">
              <h2 className="card-title">Approve Chapter for Embossing</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowApproveModal(false)}>
                ✕
              </button>
            </div>

            <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', marginBottom: '1rem', lineHeight: 1.6 }}>
              You are completing the proofreading stage for{' '}
              <strong>
                Ch {currentChapter.chapterNumber}: {currentChapter.chapterTitle}
              </strong>
              .
              <br />
              Approving moves the chapter to <strong>EMBOSSING</strong> and automatically registers it in the library's Embossing Print Queue.
            </p>

            <div className="form-group">
              <label className="form-label">Verification Note (Optional)</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                placeholder="e.g. Verified spelling, math digits, and contractions against source textbook."
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowApproveModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={handleApprove}
                disabled={approving}
              >
                {approving ? 'Enqueuing...' : 'Confirm & Send to Print Queue 🖨️'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stage History Modal */}
      {showHistoryModal && currentChapter && (
        <StageHistoryModal
          chapterId={currentChapter._id}
          chapterTitle={`Ch ${currentChapter.chapterNumber}: ${currentChapter.chapterTitle}`}
          onClose={() => setShowHistoryModal(false)}
        />
      )}
    </div>
  );
};

export default Proofreading;
