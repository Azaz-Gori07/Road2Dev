import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './InterviewSession.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5500/api';

const InterviewSession = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const authToken = localStorage.getItem('auth_token');
    if (!authToken) {
      setError('Authentication required to load interview session.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    fetch(`${API_BASE}/interview-sessions/${id}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setSession(data.data);
        } else {
          setError(data.message || 'Interview session not found.');
        }
      })
      .catch(() => {
        setError('Unable to load interview session.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const totalQuestions = useMemo(() => {
    return session?.messages?.filter((message) => message.type === 'question').length || 0;
  }, [session]);

  const answeredQuestions = useMemo(() => {
    return session?.messages?.filter((message) => message.role === 'user').length || 0;
  }, [session]);

  const progress = useMemo(() => {
    if (!totalQuestions) return 0;
    return Math.round((answeredQuestions / totalQuestions) * 100);
  }, [answeredQuestions, totalQuestions]);

  const summaryMessage = useMemo(() => {
    return session?.messages?.find((message) => message.type === 'summary');
  }, [session]);

  const formatDate = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleString();
  };

  const formatTime = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleDeleteConfirmation = async () => {
    if (!session) return;
    setIsDeleting(true);
    const authToken = localStorage.getItem('auth_token');
    if (!authToken) {
      setError('Unable to delete session without authentication.');
      setIsDeleting(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/interview-sessions/${session._id || session.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setError(data?.message || 'Unable to delete interview session.');
        setIsDeleting(false);
        return;
      }
      window.dispatchEvent(new Event('interview-sessions-updated'));
      navigate('/interview/history');
    } catch (deleteError) {
      setError('Unable to delete interview session.');
      setIsDeleting(false);
    }
  };

  const renderMessageContent = (message) => {
    if (message.type === 'question') {
      return message.question?.question || message.text || 'Interview question not available.';
    }

    if (message.type === 'feedback') {
      return (
        <div className="feedback-card">
          <div className="feedback-header">
            <span>Feedback</span>
            <span>{message.analysis?.confidence || ''}</span>
          </div>
          <div className="feedback-grid">
            <div>
              <strong>Accuracy</strong>
              <span>{message.score?.accuracy ?? 'N/A'}%</span>
            </div>
            <div>
              <strong>Technical</strong>
              <span>{message.score?.technical ?? 'N/A'}%</span>
            </div>
            <div>
              <strong>Communication</strong>
              <span>{message.score?.communication ?? 'N/A'}%</span>
            </div>
            <div>
              <strong>Confidence</strong>
              <span>{message.score?.confidence ?? 'N/A'}%</span>
            </div>
          </div>
          {message.analysis?.missingPoints && (
            <div className="feedback-detail">
              <strong>Missing points:</strong>
              <p>{message.analysis.missingPoints}</p>
            </div>
          )}
          {message.improvedAnswer && (
            <div className="feedback-detail">
              <strong>Improved answer:</strong>
              <p>{message.improvedAnswer}</p>
            </div>
          )}
          {Array.isArray(message.tips) && message.tips.length > 0 && (
            <div className="feedback-detail">
              <strong>Tips</strong>
              <ul>
                {message.tips.map((tip, index) => (
                  <li key={`tip-${index}`}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    if (message.type === 'summary' && message.summary) {
      return (
        <div className="summary-card">
          <div className="summary-header">
            <h3>Final Summary</h3>
            <span>{message.summary.readiness || ''}</span>
          </div>
          <div className="score-grid">
            <div>
              <strong>Overall</strong>
              <span>{message.summary.overallScore ?? session.score ?? 0}%</span>
            </div>
            <div>
              <strong>Completed</strong>
              <span>{message.summary.completed ?? answeredQuestions} / {message.summary.totalQuestions ?? totalQuestions}</span>
            </div>
          </div>
          {message.summary.strengths && (
            <div className="feedback-detail">
              <strong>Strengths</strong>
              <ul>
                {message.summary.strengths.map((item, index) => (
                  <li key={`strength-${index}`}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {message.summary.weaknesses && (
            <div className="feedback-detail">
              <strong>Improvements</strong>
              <ul>
                {message.summary.weaknesses.map((item, index) => (
                  <li key={`weakness-${index}`}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    if (message.type === 'note') {
      return message.text || 'System note';
    }

    return message.text || 'No message content available.';
  };

  if (loading) {
    return (
      <div className="page-container session-page">
        <div className="session-loading">Loading interview session…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container session-page">
        <div className="session-error">{error}</div>
        <button className="btn-secondary" onClick={() => navigate('/interview/history')}>
          Back to History
        </button>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="page-container session-page">
        <div className="session-empty">Interview session data is unavailable.</div>
      </div>
    );
  }

  return (
    <div className="page-container session-page">
      <div className="session-header">
        <div>
          <button className="btn-ghost" onClick={() => navigate(-1)}>
            Back
          </button>
          <h1>{session.title || 'Interview Session'}</h1>
          <p className="session-subtitle">Restored from your saved interview history.</p>
        </div>
        <div className="session-actions">
          <button className="btn-secondary" onClick={() => navigate('/interview/history')}>
            Back to History
          </button>
          <button className="btn-danger" onClick={() => setDeleteModalOpen(true)}>
            Delete Session
          </button>
        </div>
      </div>

      <div className="session-summary-grid">
        <div className="summary-card mini">
          <span>Field</span>
          <strong>{session.field || 'N/A'}</strong>
        </div>
        <div className="summary-card mini">
          <span>Stack</span>
          <strong>{session.stack || 'N/A'}</strong>
        </div>
        <div className="summary-card mini">
          <span>Status</span>
          <strong>{session.status || 'draft'}</strong>
        </div>
        <div className="summary-card mini">
          <span>Score</span>
          <strong>{session.score ?? 0}%</strong>
        </div>
      </div>

      <div className="session-progress-card">
        <div className="progress-row">
          <div>
            <h2>Progress</h2>
            <p>{answeredQuestions} of {totalQuestions} questions answered</p>
          </div>
          <strong>{session.status === 'completed' ? '100%' : `${progress}%`}</strong>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${session.status === 'completed' ? 100 : progress}%` }} />
        </div>
      </div>

      <div className="session-chat-shell">
        {Array.isArray(session.messages) && session.messages.length > 0 ? (
          <div className="chat-messages">
            {session.messages.map((message) => {
              const isUser = message.role === 'user';
              const wrapperClass = `chat-message ${isUser ? 'user' : 'ai'}`;

              return (
                <div key={message.id || message._id || Math.random()} className={wrapperClass}>
                  <div className="message-card">
                    <div className="message-heading">
                      <div>
                        <span className="message-role">{message.role?.toUpperCase()}</span>
                        <span className="message-time">{formatTime(message.timestamp)}</span>
                      </div>
                      <span className="message-type">{message.type}</span>
                    </div>
                    <div className={`message-bubble ${isUser ? 'user-bubble' : 'ai-bubble'}`}>
                      {renderMessageContent(message)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="session-empty">No conversation history is available for this session.</div>
        )}
      </div>

      {session.feedback && (
        <div className="session-feedback-panel">
          <h2>Session Feedback</h2>
          <p>{session.feedback}</p>
        </div>
      )}

      {deleteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Delete interview session?</h3>
            <p>This will permanently remove the saved session from your history and sidebar.</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setDeleteModalOpen(false)} disabled={isDeleting}>
                Cancel
              </button>
              <button className="btn-danger" onClick={handleDeleteConfirmation} disabled={isDeleting}>
                {isDeleting ? 'Deleting…' : 'Delete Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewSession;
