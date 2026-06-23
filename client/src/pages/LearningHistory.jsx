import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Archive, Play, AlertTriangle, BookOpen, Award, CheckCircle, Flame } from 'lucide-react';
import './LearningHistory.css';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import ErrorDisplay from '../components/ui/ErrorDisplay';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5500/api';

export default function LearningHistory() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const fetchSessions = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('Authentication required. Please login.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/learning-lab/sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSessions(data.data);
      } else {
        setError(data.message || 'Failed to fetch learning sessions.');
      }
    } catch (err) {
      setError('Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleArchive = async (id) => {
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`${API_BASE}/learning-lab/session/${id}/archive`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchSessions();
        window.dispatchEvent(new Event('learning-lab-sessions-updated'));
      }
    } catch (err) {
      alert('Failed to archive session.');
    }
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`${API_BASE}/learning-lab/session/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setConfirmDeleteId(null);
        fetchSessions();
        window.dispatchEvent(new Event('learning-lab-sessions-updated'));
      }
    } catch (err) {
      alert('Failed to delete session.');
    }
  };

  const formatDate = (val) => {
    if (!val) return 'N/A';
    const date = new Date(val);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="learning-history-container">
      <header className="lh-header">
        <button onClick={() => navigate('/learning-lab')} className="lh-back-btn">
          <ArrowLeft size={16} /> Back to Lab
        </button>
        <h1>Learning Lab Session History</h1>
        <p className="lh-subtitle">Review, archive, and manage your personalized mentoring workspaces</p>
      </header>

      {loading ? (
        <LoadingSpinner message="Syncing workspace logs..." />
      ) : error ? (
        <ErrorDisplay message={error} onRetry={fetchSessions} />
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No learning history yet."
          message="Start your first learning mission to begin building your learning history."
          actionLabel="Launch Learning Lab"
          onAction={() => navigate('/learning-lab')}
        />
      ) : (
        <div className="lh-grid">
          {sessions.map((session) => {
            const isCompleted = session.status === 'completed' || session.masteryPercentage >= 100;
            const challenges = session.learningEngine?.sandboxEvidence || [];
            const challengesPassed = challenges.filter(c => c.passed).length;
            const totalChallenges = challenges.length;
            const interviewScore = session.learningEngine?.evaluationScores?.interviewReadiness || 0;

            return (
              <div className={`lh-card ${isCompleted ? 'lh-completed' : ''}`} key={session._id}>
                <div className="lh-card-header">
                  <span className={`lh-badge ${isCompleted ? 'badge-completed' : 'badge-active'}`}>
                    {isCompleted ? 'Completed' : 'Active'}
                  </span>
                  <span className="lh-mode">{session.mode || 'Intermediate'}</span>
                </div>

                <h3 className="lh-topic">
                  {session.topic.startsWith('Project Defense:') ? session.topic.replace('Project Defense: ', '') : session.topic}
                </h3>
                <p className="lh-type">{session.sessionType || 'Concept Learning'}</p>

                <div className="lh-timeline-info">
                  <div className="lh-time-row">
                    <span>Started:</span>
                    <strong>{formatDate(session.createdAt)}</strong>
                  </div>
                  <div className="lh-time-row">
                    <span>Last Active:</span>
                    <strong>{formatDate(session.updatedAt)}</strong>
                  </div>
                </div>

                <div className="lh-stats-grid">
                  <div className="lh-stat-box">
                    <span className="lh-stat-label">Mastery</span>
                    <strong className="lh-stat-val text-green">{session.masteryPercentage || 0}%</strong>
                  </div>
                  <div className="lh-stat-box">
                    <span className="lh-stat-label">Challenges</span>
                    <strong className="lh-stat-val text-purple">
                      {totalChallenges > 0 ? `${challengesPassed}/${totalChallenges}` : '0/0'}
                    </strong>
                  </div>
                  <div className="lh-stat-box">
                    <span className="lh-stat-label">Interview Impact</span>
                    <strong className="lh-stat-val text-cyan">
                      {interviewScore > 0 ? `+${interviewScore}%` : 'N/A'}
                    </strong>
                  </div>
                </div>

                <div className="lh-card-actions">
                  <button
                    onClick={() => navigate('/learning-lab', { state: { resumeSessionId: session._id } })}
                    className="lh-action-btn open-btn"
                    title="Open Session"
                  >
                    <Play size={14} /> Open
                  </button>
                  {!isCompleted && (
                    <button
                      onClick={() => handleArchive(session._id)}
                      className="lh-action-btn archive-btn"
                      title="Archive Session"
                    >
                      <Archive size={14} /> Archive
                    </button>
                  )}
                  <button
                    onClick={() => setConfirmDeleteId(session._id)}
                    className="lh-action-btn delete-btn"
                    title="Delete Session"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmDeleteId && (
        <div className="lh-modal-overlay">
          <div className="lh-modal">
            <AlertTriangle size={36} className="lh-modal-warn-icon" />
            <h3>This action cannot be undone.</h3>
            <p>Are you sure you want to permanently delete this learning session and scrub all related messages, sandbox challenges, and analytics contributions?</p>
            <div className="lh-modal-buttons">
              <button onClick={() => setConfirmDeleteId(null)} className="lh-modal-cancel">
                Cancel
              </button>
              <button onClick={() => handleDelete(confirmDeleteId)} className="lh-modal-delete">
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
