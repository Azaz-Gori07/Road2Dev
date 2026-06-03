import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BrainCircuit, TrendingUp, Target, Award, Zap, AlertTriangle, CheckCircle, BookOpen, ExternalLink } from 'lucide-react';
import './IntelligenceDashboard.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5500/api';

function Gauge({ value, label, color = 'var(--secondary)', size = 120 }) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, Math.max(0, value)) / 100) * circ;
  return (
    <div className="id-gauge" style={{ width: size, height: size + 30 }}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--border)" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
        <text x="50" y="48" textAnchor="middle" dominantBaseline="central"
          fill="var(--text-primary)" fontSize="22" fontWeight="800">{value}%</text>
        <text x="50" y="72" textAnchor="middle" dominantBaseline="central"
          fill="var(--text-muted)" fontSize="8">{label}</text>
      </svg>
    </div>
  );
}

function getReadinessColor(val) {
  if (val >= 80) return '#34d399';
  if (val >= 60) return '#fbbf24';
  if (val >= 40) return '#fb923c';
  return '#ef4444';
}

function getConfidenceLabel(evidence) {
  const total = (evidence?.sandbox || 0) + (evidence?.interview || 0) + (evidence?.defense || 0);
  if (total >= 5) return { label: 'High', color: '#34d399' };
  if (total >= 2) return { label: 'Medium', color: '#fbbf24' };
  return { label: 'Low', color: '#fb923c' };
}

export default function IntelligenceDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('auth_token');
    if (!token) { setError('Authentication required.'); setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE}/learning-lab/unified-dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.message || 'Failed to load dashboard.');
    } catch { setError('Failed to connect to server.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const readiness = data?.readiness;
  const swot = data?.swot;
  const recommendations = data?.recommendations || [];
  const coach = data?.careerCoach;

  return (
    <div className="id-container">
      <header className="id-header">
        <button onClick={() => navigate('/learning-lab')} className="id-back-btn"><ArrowLeft size={16} /> Back to Lab</button>
        <div className="id-header-title">
          <BrainCircuit size={28} className="id-header-icon" />
          <div>
            <h1>Intelligence Dashboard</h1>
            <p className="id-subtitle">Unified readiness, strengths, weaknesses, and recommendations</p>
          </div>
        </div>
      </header>

      {loading && <div className="id-loading">Loading unified intelligence...</div>}
      {error && <div className="id-error">{error}</div>}

      {!loading && !error && !data && (
        <div className="id-empty">
          <BrainCircuit size={48} />
          <h2>No intelligence data available</h2>
          <p>Complete learning sessions, interviews, or sandbox challenges to generate insights.</p>
          <button onClick={() => navigate('/learning-lab')} className="id-primary-btn">Go to Learning Lab</button>
        </div>
      )}

      {!loading && !error && data && (
        <>
          <section className="id-section">
            <h2 className="id-section-title"><Target size={18} /> Readiness Scores</h2>
            {readiness ? (
              <>
                <div className="id-gauges">
                  <Gauge value={readiness.hiringReadinessIndex} label="Hiring Readiness" color={getReadinessColor(readiness.hiringReadinessIndex)} />
                  <Gauge value={readiness.interviewReadinessIndex} label="Interview Readiness" color={getReadinessColor(readiness.interviewReadinessIndex)} />
                  <Gauge value={readiness.projectReadinessIndex} label="Project Readiness" color={getReadinessColor(readiness.projectReadinessIndex)} />
                  <Gauge value={readiness.consistencyScore} label="Consistency" color={getReadinessColor(readiness.consistencyScore)} />
                  <Gauge value={readiness.overallMastery} label="Overall Mastery" color={getReadinessColor(readiness.overallMastery)} />
                </div>
                <div className="id-readiness-detail">
                  <div className="id-detail-row">
                    <span>Dimension Averages</span>
                    <div className="id-detail-tags">
                      {readiness.dimensionAverages && Object.entries(readiness.dimensionAverages).map(([key, val]) => (
                        <span key={key} className="id-tag id-tag-dim">{key.replace(/([A-Z])/g, ' $1').trim()}: {val}%</span>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="id-empty-sm">Complete activities to calculate readiness scores.</div>
            )}
          </section>

          {coach && (coach.marketReadiness || coach.jobReadiness) && (
            <section className="id-section">
              <h2 className="id-section-title"><Award size={18} /> Career Coach Snapshot</h2>
              <div className="id-coach-card">
                <div className="id-coach-row">
                  <span className="id-coach-label">Market Readiness</span>
                  <span className="id-coach-value">{coach.marketReadiness || 'N/A'}</span>
                </div>
                <div className="id-coach-row">
                  <span className="id-coach-label">Job Readiness</span>
                  <span className="id-coach-value">{coach.jobReadiness || 'N/A'}</span>
                </div>
                {coach.recommendedRoles?.length > 0 && (
                  <div className="id-coach-row">
                    <span className="id-coach-label">Target Roles</span>
                    <div className="id-coach-tags">{coach.recommendedRoles.map((r, i) => (
                      <span key={i} className="id-tag id-tag-role">{r}</span>
                    ))}</div>
                  </div>
                )}
                {coach.salaryGuidance && (
                  <div className="id-coach-row">
                    <span className="id-coach-label">Salary Guidance</span>
                    <span className="id-coach-value id-salary">{coach.salaryGuidance}</span>
                  </div>
                )}
                <button onClick={() => navigate('/learning-lab', { state: { coachSessionId: data.coachSessionId } })} className="id-coach-btn">
                  View Full Roadmap <ExternalLink size={14} />
                </button>
              </div>
            </section>
          )}

          {swot && (swot.weakTopics?.length > 0 || swot.strongTopics?.length > 0) && (
            <div className="id-swot-grid">
              <section className="id-section">
                <h2 className="id-section-title"><Zap size={18} /> Strengths <span className="id-count-badge">{swot.strongTopics?.length || 0}</span></h2>
                {swot.strongTopics?.length > 0 ? (
                  <div className="id-topic-list">
                    {swot.strongTopics.map((t, i) => (
                      <div key={i} className="id-topic-card id-topic-strong">
                        <div className="id-topic-top">
                          <span className="id-topic-name">{t.topic}</span>
                          <span className="id-topic-mastery" style={{ color: '#34d399' }}>{t.mastery}%</span>
                        </div>
                        <div className="id-topic-bar-bg"><div className="id-topic-bar-fill" style={{ width: `${t.mastery}%`, background: '#34d399' }} /></div>
                        <div className="id-topic-evidence">
                          <span>Evidence: {t.evidenceCount ? `${(t.evidenceCount.sandbox || 0) + (t.evidenceCount.interview || 0) + (t.evidenceCount.defense || 0)} sources` : 'None'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <div className="id-empty-sm">No strong topics identified yet.</div>}
              </section>

              <section className="id-section">
                <h2 className="id-section-title"><AlertTriangle size={18} /> Needs Improvement <span className="id-count-badge id-count-warn">{swot.weakTopics?.length || 0}</span></h2>
                {swot.weakTopics?.length > 0 ? (
                  <div className="id-topic-list">
                    {swot.weakTopics.map((t, i) => (
                      <div key={i} className="id-topic-card id-topic-weak">
                        <div className="id-topic-top">
                          <span className="id-topic-name">{t.topic}</span>
                          <span className="id-topic-mastery" style={{ color: '#ef4444' }}>{t.mastery}%</span>
                        </div>
                        <div className="id-topic-bar-bg"><div className="id-topic-bar-fill" style={{ width: `${t.mastery}%`, background: '#ef4444' }} /></div>
                        <div className="id-topic-evidence">
                          <span>Weakest: {t.weakestDimension?.replace(/([A-Z])/g, ' $1').trim() || 'N/A'} ({t.weakestScore}/100)</span>
                          {t.evidenceCount && <span> | Sources: {(t.evidenceCount.sandbox || 0) + (t.evidenceCount.interview || 0) + (t.evidenceCount.defense || 0)}</span>}
                        </div>
                        <button
                          onClick={() => navigate('/learning-lab?remediate=true', { state: { focusTopic: t.topic } })}
                          className="id-fix-btn"
                        >
                          Fix This Gap
                        </button>
                      </div>
                    ))}
                  </div>
                ) : <div className="id-empty-sm">All clear! No weak topics detected.</div>}
              </section>
            </div>
          )}

          {swot?.failedChallenges?.length > 0 && (
            <section className="id-section">
              <h2 className="id-section-title"><AlertTriangle size={18} /> Failed Challenges <span className="id-count-badge id-count-warn">{swot.failedChallenges.length}</span></h2>
              <div className="id-challenge-list">
                {swot.failedChallenges.map((fc, i) => (
                  <div key={i} className="id-challenge-item">
                    <span>{fc.title}</span>
                    <span className="id-challenge-count">{fc.failedAttempts} failed attempts</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {recommendations.length > 0 && (
            <section className="id-section">
              <h2 className="id-section-title"><BookOpen size={18} /> Recommendations</h2>
              <div className="id-rec-list">
                {recommendations.map((rec, i) => (
                  <div key={i} className={`id-rec-card ${rec.priority === 'critical' ? 'id-rec-critical' : rec.priority === 'high' ? 'id-rec-high' : ''}`}>
                    <div className="id-rec-top">
                      <span className="id-rec-title">{rec.title}</span>
                      <span className={`id-rec-priority id-priority-${rec.priority}`}>{rec.priority}</span>
                    </div>
                    <p className="id-rec-reason">{rec.reason}</p>
                    <div className="id-rec-meta">
                      {rec.type && <span className="id-tag id-tag-type">{rec.type}</span>}
                      {rec.topic && <span className="id-tag id-tag-topic">{rec.topic}</span>}
                      {rec.dimension && <span className="id-tag id-tag-dim">{rec.dimension.replace(/([A-Z])/g, ' $1').trim()}</span>}
                    </div>
                    {rec.pathway?.length > 0 && (
                      <div className="id-rec-pathway">
                        Pathway: {rec.pathway.join(' → ')}
                      </div>
                    )}
                    <button
                      onClick={() => navigate(`/learning-lab?remediate=true`, { state: { focusTopic: rec.topic } })}
                      className="id-rec-btn"
                    >
                      Start Learning Path
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
