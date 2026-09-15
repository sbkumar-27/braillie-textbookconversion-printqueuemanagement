/**
 * pages/Dashboard.jsx
 * 
 * Home dashboard displaying role-based pipeline metrics, paper inventory warnings,
 * and quick access cards.
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import StageBadge from '../components/StageBadge';
import Alert from '../components/Alert';

export const Dashboard = ({ setCurrentView, setSelectedChapterId, setSelectedTextbookId }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalTextbooks: 0,
    totalChapters: 0,
    inProgressChapters: 0,
    completedChapters: 0,
    queueCount: 0,
    stock: 0,
    isLowStock: false,
    warning: null
  });
  const [recentChapters, setRecentChapters] = useState([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch textbooks & chapters
        const [tbRes, chRes] = await Promise.all([
          api.get('/textbooks'),
          api.get(isAdmin ? '/chapters' : '/assignments')
        ]);

        const textbooks = tbRes.data.textbooks || [];
        let chapters = [];

        if (isAdmin) {
          chapters = chRes.data.chapters || [];
        } else {
          // For volunteer, assignments contain populated chapterId
          chapters = (chRes.data.assignments || []).map((a) => a.chapterId).filter(Boolean);
        }

        let queueCount = 0;
        let inventoryData = { currentStock: 0, isLowStock: false, warning: null };

        // Admin-only stats
        if (isAdmin) {
          try {
            const [qRes, invRes] = await Promise.all([
              api.get('/print-queue?status=QUEUED'),
              api.get('/inventory')
            ]);
            queueCount = qRes.data.count || 0;
            inventoryData = invRes.data;
          } catch (e) {
            console.warn('Could not fetch queue/inventory stats', e);
          }
        }

        const completedCount = chapters.filter((c) => c.status === 'DONE').length;
        const inProgressCount = chapters.filter((c) => c.status !== 'DONE' && c.status !== 'PENDING').length;

        setStats({
          totalTextbooks: textbooks.length,
          totalChapters: chapters.length,
          inProgressChapters: inProgressCount,
          completedChapters: completedCount,
          queueCount,
          stock: inventoryData.inventory?.currentStock || 0,
          isLowStock: inventoryData.isLowStock || false,
          warning: inventoryData.warning
        });

        setRecentChapters(chapters.slice(0, 5));
      } catch (err) {
        console.error('[Dashboard] Error fetching dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAdmin]);

  return (
    <div>
      {/* Welcome Banner */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
          Welcome back, {user?.name}!
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          {isAdmin
            ? 'Library Administration Console — Oversee textbook digitization, transcriber assignments, and tactile embossing queue.'
            : 'Volunteer Transcriber Workbench — Translate and proofread textbooks to provide tactile Braille books for students.'}
        </p>
      </div>

      {/* Low Paper Stock Warning (Admin Only) */}
      {isAdmin && stats.isLowStock && (
        <Alert
          type="warning"
          message={stats.warning || `Low Braille Paper Warning: Only ${stats.stock} sheets remaining!`}
        />
      )}

      {/* Metric Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem'
        }}
      >
        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Catalog Textbooks
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)', marginTop: '0.25rem' }}>
            {loading ? '...' : stats.totalTextbooks}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Registered titles</div>
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            {isAdmin ? 'Active Chapters' : 'My Assigned Chapters'}
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--warning)', marginTop: '0.25rem' }}>
            {loading ? '...' : stats.inProgressChapters}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>In translation or proofreading</div>
        </div>

        {isAdmin && (
          <div className="card" style={{ marginBottom: 0 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Embossing Queue
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#7c3aed', marginTop: '0.25rem' }}>
              {loading ? '...' : stats.queueCount}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Approved jobs pending print</div>
          </div>
        )}

        {isAdmin && (
          <div className="card" style={{ marginBottom: 0 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Paper Inventory
            </div>
            <div
              style={{
                fontSize: '2rem',
                fontWeight: 700,
                color: stats.isLowStock ? 'var(--danger)' : 'var(--success)',
                marginTop: '0.25rem'
              }}
            >
              {loading ? '...' : `${stats.stock} shts`}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {stats.isLowStock ? '⚠️ Low Stock Alert' : 'Healthy stock level'}
            </div>
          </div>
        )}

        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Fully Embossed
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--success)', marginTop: '0.25rem' }}>
            {loading ? '...' : stats.completedChapters}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Chapters completed (DONE)</div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 className="card-title" style={{ marginBottom: '1rem' }}>
          Quick Workflows
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          {isAdmin ? (
            <>
              <button
                className="btn btn-primary"
                onClick={() => setCurrentView('textbooks')}
              >
                📚 Manage Textbooks & Chapters
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setCurrentView('assignments')}
              >
                👥 Assign Chapters to Transcribers
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setCurrentView('print-queue')}
              >
                🖨️ Open Print Queue ({stats.queueCount})
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setCurrentView('inventory')}
              >
                📦 Check Paper Inventory
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-primary"
                onClick={() => setCurrentView('assignments')}
              >
                ✏️ Continue Proofreading My Chapters
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setCurrentView('textbooks')}
              >
                📖 Browse Available Textbooks
              </button>
            </>
          )}
        </div>
      </div>

      {/* Conversion Pipeline Flow Infographic */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          Conversion & Embossing Pipeline
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Every textbook chapter progresses sequentially through verified operational steps:
        </p>

        <div className="pipeline-steps">
          <div className="step-item">
            <div className="step-circle">1</div>
            <div className="step-label">PENDING<br />New Chapter</div>
          </div>
          <div style={{ color: 'var(--border)', fontWeight: 'bold' }}>➔</div>
          <div className="step-item">
            <div className="step-circle">2</div>
            <div className="step-label">EXTRACTION<br />.txt, .pdf, .docx</div>
          </div>
          <div style={{ color: 'var(--border)', fontWeight: 'bold' }}>➔</div>
          <div className="step-item">
            <div className="step-circle">3</div>
            <div className="step-label">TRANSLATION<br />Grade 1 & 2 Braille</div>
          </div>
          <div style={{ color: 'var(--border)', fontWeight: 'bold' }}>➔</div>
          <div className="step-item">
            <div className="step-circle">4</div>
            <div className="step-label">PROOFREADING<br />Human Approval</div>
          </div>
          <div style={{ color: 'var(--border)', fontWeight: 'bold' }}>➔</div>
          <div className="step-item">
            <div className="step-circle">5</div>
            <div className="step-label">EMBOSSING<br />Print Queue</div>
          </div>
          <div style={{ color: 'var(--border)', fontWeight: 'bold' }}>➔</div>
          <div className="step-item">
            <div className="step-circle">6</div>
            <div className="step-label">DONE<br />Paper Deducted</div>
          </div>
        </div>
      </div>

      {/* Recent Chapters Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            {isAdmin ? 'Recent Chapters in Pipeline' : 'Your Assigned Chapters'}
          </h2>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setCurrentView(isAdmin ? 'textbooks' : 'assignments')}
          >
            View All
          </button>
        </div>

        {recentChapters.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
            No chapters found. Start by adding a textbook or assigning a chapter.
          </p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Chapter</th>
                  <th>Status</th>
                  <th>Braille Grade</th>
                  <th>Assigned Transcriber</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentChapters.map((ch) => (
                  <tr key={ch._id}>
                    <td>
                      <strong>Ch {ch.chapterNumber}:</strong> {ch.chapterTitle}
                    </td>
                    <td>
                      <StageBadge stage={ch.status} />
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                        {ch.brailleGrade === 'GRADE_2' ? 'Grade 2 (Subset)' : 'Grade 1'}
                      </span>
                    </td>
                    <td>
                      {ch.assignedVolunteer ? (
                        <span>{ch.assignedVolunteer.name || 'Assigned'}</span>
                      ) : (
                        <span style={{ color: 'var(--text-light)' }}>Unassigned</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          setSelectedChapterId(ch._id);
                          setCurrentView('proofreading');
                        }}
                      >
                        Open Proofreader
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
