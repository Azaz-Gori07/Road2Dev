import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Code, ChevronDown, ChevronUp, Clock, CheckCircle2, XCircle, FileCode } from 'lucide-react';
import './SandboxHistory.css';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import ErrorDisplay from '../components/ui/ErrorDisplay';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5500/api';

export default function SandboxHistory() {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedChallenge, setExpandedChallenge] = useState(null);
  const [expandedCodeAttemptId, setExpandedCodeAttemptId] = useState(null);

  const fetchSandboxHistory = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('Authentication required. Please login.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/learning-lab/sandbox-history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setChallenges(data.data);
      } else {
        setError(data.message || 'Failed to fetch sandbox history.');
      }
    } catch (err) {
      setError('Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSandboxHistory();
  }, []);

  const formatDate = (val) => {
    if (!val) return 'N/A';
    const date = new Date(val);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const toggleChallenge = (title) => {
    setExpandedChallenge(expandedChallenge === title ? null : title);
  };

  const toggleCodeAttempt = (id) => {
    setExpandedCodeAttemptId(expandedCodeAttemptId === id ? null : id);
  };

  return (
    <div className="sandbox-history-container">
      <header className="sh-header">
        <button onClick={() => navigate('/learning-lab')} className="sh-back-btn">
          <ArrowLeft size={16} /> Back to Lab
        </button>
        <h1>Sandbox Practice History</h1>
        <p className="sh-subtitle">Trace your developer coding checkpoints, review compilation reports, and track iterations</p>
      </header>

      {loading ? (
        <LoadingSpinner message="Syncing compiler logs..." />
      ) : error ? (
        <ErrorDisplay message={error} onRetry={fetchSandboxHistory} />
      ) : challenges.length === 0 ? (
        <EmptyState
          icon={Code}
          title="No sandbox coding history yet."
          message="Open the sandbox in AI Mentor Lab and submit your first coding challenge script to trace attempts here."
          actionLabel="Open Practice Workspace"
          onAction={() => navigate('/learning-lab')}
        />
      ) : (
        <div className="sh-list">
          {challenges.map((chal) => {
            const isExpanded = expandedChallenge === chal.challengeTitle;
            return (
              <div className={`sh-challenge-card ${chal.passed ? 'sh-passed-card' : 'sh-failed-card'}`} key={chal.challengeTitle}>
                <div className="sh-card-summary" onClick={() => toggleChallenge(chal.challengeTitle)}>
                  <div className="sh-summary-left">
                    {chal.passed ? (
                      <CheckCircle2 className="sh-status-icon text-green" size={22} />
                    ) : (
                      <XCircle className="sh-status-icon text-red" size={22} />
                    )}
                    <div>
                      <h3>{chal.challengeTitle}</h3>
                      <span className="sh-summary-meta">
                        {chal.attempts.length} Attempt{chal.attempts.length > 1 ? 's' : ''} • Last active: {formatDate(chal.lastAttemptDate)}
                      </span>
                    </div>
                  </div>

                  <div className="sh-summary-right">
                    <div className="sh-score-badge">
                      <span className="sh-badge-label">Grade</span>
                      <strong className="sh-badge-val">{chal.finalScore}%</strong>
                    </div>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="sh-card-details">
                    <h4 className="sh-section-title">Iteration Timeline</h4>
                    <div className="sh-attempts-timeline">
                      {chal.attempts.map((attempt) => {
                        const attemptCodeExpanded = expandedCodeAttemptId === attempt._id;
                        const hasScores = attempt.scores && Object.values(attempt.scores).some(s => s > 0);

                        return (
                          <div className="sh-attempt-row" key={attempt._id}>
                            <div className="sh-attempt-header">
                              <span className="sh-attempt-num">
                                Attempt #{attempt.attemptNumber}
                              </span>
                              <span className="sh-attempt-time">
                                <Clock size={12} style={{ marginRight: '4px' }} />
                                {formatDate(attempt.createdAt)}
                              </span>
                              <span className={`sh-attempt-status ${attempt.passed ? 'status-pass' : 'status-fail'}`}>
                                {attempt.passed ? 'Passed' : 'Failed'}
                              </span>
                            </div>

                            <p className="sh-attempt-feedback">"{attempt.feedback || 'No feedback logged.'}"</p>

                            {hasScores && (
                              <div className="sh-attempt-scores">
                                <div className="sh-score-pill">
                                  <span>Coding:</span>
                                  <strong>{attempt.scores.codingAbility}%</strong>
                                </div>
                                <div className="sh-score-pill">
                                  <span>Logic:</span>
                                  <strong>{attempt.scores.problemSolving}%</strong>
                                </div>
                                <div className="sh-score-pill">
                                  <span>Quality:</span>
                                  <strong>{attempt.scores.codeQuality}%</strong>
                                </div>
                              </div>
                            )}

                            {attempt.stdout && (
                              <div className="sh-attempt-stdout">
                                <strong>Terminal Console Stdout:</strong>
                                <pre>{attempt.stdout}</pre>
                              </div>
                            )}

                            {attempt.error && (
                              <div className="sh-attempt-stdout sh-error-out">
                                <strong>Compiler Error:</strong>
                                <pre>{attempt.error}</pre>
                              </div>
                            )}

                            <div className="sh-code-toggle">
                              <button 
                                onClick={() => toggleCodeAttempt(attempt._id)}
                                className="sh-code-btn"
                              >
                                <FileCode size={14} style={{ marginRight: '6px' }} />
                                {attemptCodeExpanded ? 'Hide Submitted Code' : 'View Submitted Code'}
                              </button>
                            </div>

                            {attemptCodeExpanded && (
                              <div className="sh-code-snippet-box">
                                <div className="sh-snippet-header">
                                  <span>sandbox_eval.js</span>
                                </div>
                                <div className="sh-snippet-body">
                                  <div className="sh-line-numbers">
                                    {(attempt.code || '').split('\n').map((_, index) => (
                                      <div key={index}>{index + 1}</div>
                                    ))}
                                  </div>
                                  <pre className="sh-code-pre">
                                    <code>{attempt.code}</code>
                                  </pre>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
