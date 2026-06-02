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
  const [activeSkillDetail, setActiveSkillDetail] = useState(null);

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
      const deletedId = session._id || session.id;
      if (localStorage.getItem('road2dev-interview-session-id') === deletedId) {
        localStorage.removeItem('road2dev-interview-session-id');
      }
      const savedRaw = localStorage.getItem('road2dev-interview');
      if (savedRaw) {
        try {
          const savedObj = JSON.parse(savedRaw);
          const savedId = savedObj?.interviewSession?._id || savedObj?.interviewSession?.id;
          if (savedId === deletedId) {
            localStorage.removeItem('road2dev-interview');
          }
        } catch (e) {
          console.warn('Parsing local storage error in details delete:', e);
        }
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
          <div className="feedback-detail" style={{ borderLeft: '3px solid var(--secondary-translucent)', paddingLeft: '12px', background: 'var(--surface-alt)', padding: '10px 12px', borderRadius: '6px', margin: '12px 0' }}>
            <strong style={{ color: 'var(--secondary)', fontSize: '12px' }}>Scoring Evidence & Justification:</strong>
            <p style={{ margin: '4px 0 0', fontStyle: 'italic', fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{message.analysis.scoringJustification}</p>
          </div>
          {(message.analysis?.skillsPerformance?.length > 0 || message.analysis?.coveredSkills?.length > 0 || message.analysis?.strongSkills?.length > 0 || message.analysis?.weakSkills?.length > 0) && (
            <div className="feedback-detail" style={{ border: '1px solid var(--border)', padding: '16px', borderRadius: '12px', background: 'var(--surface)', margin: '12px 0', textAlign: 'left' }}>
              <strong style={{ display: 'block', fontSize: '13px', color: 'var(--secondary)', marginBottom: '10px' }}>🎯 Dynamic Skill Matrix</strong>
              
              {/* Visual Radial Gauge for Coverage Percentage */}
              {typeof message.analysis?.coveragePercentage === 'number' && message.analysis.coveragePercentage > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--background)', border: '1px solid var(--border)', padding: '10px 12px', borderRadius: '8px', marginBottom: '12px' }}>
                  <div style={{ position: 'relative', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg style={{ transform: 'rotate(-90deg)', width: '36px', height: '36px' }}>
                      <circle cx="18" cy="18" r="15" stroke="var(--border)" strokeWidth="4" fill="transparent" />
                      <circle cx="18" cy="18" r="15" stroke="var(--secondary)" strokeWidth="4" fill="transparent" strokeDasharray={94.2} strokeDashoffset={94.2 - (94.2 * message.analysis.coveragePercentage) / 100} style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
                    </svg>
                    <span style={{ position: 'absolute', fontSize: '9px', fontWeight: '800', color: 'var(--text-primary)' }}>{Math.round(message.analysis.coveragePercentage)}%</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>Session Skill Coverage</span>
                    <strong style={{ fontSize: '11.5px', color: 'var(--secondary)' }}>Progressive competency mapping active</strong>
                  </div>
                </div>
              )}

              {message.analysis?.skillsPerformance?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(() => {
                    const mastered = message.analysis.skillsPerformance.filter(s => s.status === 'mastered');
                    const average = message.analysis.skillsPerformance.filter(s => s.status === 'average');
                    const weak = message.analysis.skillsPerformance.filter(s => s.status === 'weak');
                    const unassessed = message.analysis.skillsPerformance.filter(s => s.status === 'not_assessed');
                    
                    return (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {mastered.map(item => (
                          <span key={item.skill} onClick={() => setActiveSkillDetail(item)} style={{ background: 'var(--success-translucent)', color: 'var(--success)', border: '1px solid var(--success-translucent)', padding: '3px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: '500', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s' }} title="Click to view evidence">
                            ✔ {item.skill}
                          </span>
                        ))}
                        {average.map(item => (
                          <span key={item.skill} onClick={() => setActiveSkillDetail(item)} style={{ background: 'var(--info-translucent)', color: 'var(--info)', border: '1px solid var(--info-translucent)', padding: '3px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: '500', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s' }} title="Click to view evidence">
                            ● {item.skill}
                          </span>
                        ))}
                        {weak.map(item => (
                          <span key={item.skill} onClick={() => setActiveSkillDetail(item)} style={{ background: 'var(--error-translucent)', color: 'var(--error)', border: '1px solid var(--error-translucent)', padding: '3px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: '500', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s' }} title="Click to view evidence">
                            ⚠ {item.skill}
                          </span>
                        ))}
                        {unassessed.map(item => (
                          <span key={item.skill} style={{ background: 'var(--surface-alt)', color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '3px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: '500', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            ○ {item.skill}
                          </span>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {message.analysis.coveredSkills?.length > 0 && (
                    <div style={{ fontSize: '12px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Covered: </span>
                      {message.analysis.coveredSkills.map(skill => (
                        <span key={skill} style={{ background: 'var(--surface-alt)', color: 'var(--text-secondary)', border: '1px solid var(--border)', padding: '2px 6px', borderRadius: '4px', marginLeft: '4px', display: 'inline-block' }}>{skill}</span>
                      ))}
                    </div>
                  )}
                  {message.analysis.strongSkills?.length > 0 && (
                    <div style={{ fontSize: '12px' }}>
                      <span style={{ color: 'var(--success)' }}>✔ Strong: </span>
                      {message.analysis.strongSkills.map(skill => (
                        <span key={skill} style={{ background: 'var(--success-translucent)', color: 'var(--success)', border: '1px solid var(--success-translucent)', padding: '2px 6px', borderRadius: '4px', marginLeft: '4px', display: 'inline-block' }}>{skill}</span>
                      ))}
                    </div>
                  )}
                  {message.analysis.weakSkills?.length > 0 && (
                    <div style={{ fontSize: '12px' }}>
                      <span style={{ color: 'var(--error)' }}>⚠ Weak: </span>
                      {message.analysis.weakSkills.map(skill => (
                        <span key={skill} style={{ background: 'var(--error-translucent)', color: 'var(--error)', border: '1px solid var(--error-translucent)', padding: '2px 6px', borderRadius: '4px', marginLeft: '4px', display: 'inline-block' }}>{skill}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
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
      const recColor = message.summary.hiringRecommendation?.recommendation === 'Strong Hire' 
        ? 'var(--success)' 
        : message.summary.hiringRecommendation?.recommendation === 'Hire' 
        ? 'var(--success)' 
        : message.summary.hiringRecommendation?.recommendation === 'Borderline' 
        ? 'var(--warning)' 
        : 'var(--error)';

      return (
        <div className="summary-card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '24px', borderRadius: '16px', maxWidth: '650px', width: '100%', textAlign: 'left', color: 'var(--text-primary)', boxSizing: 'border-box' }}>
          
          {/* Header */}
          <div className="summary-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
            <div>
              <span className="message-role" style={{ fontSize: '11px', color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>Interview Report</span>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', margin: '4px 0 0' }}>Performance Evaluation</h3>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Overall Score</span>
              <strong style={{ fontSize: '24px', color: 'var(--secondary)', fontWeight: '800' }}>{message.summary.overallScore}%</strong>
            </div>
          </div>

          {/* Score Grid Breakdown */}
          <div className="summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '10px', marginBottom: '20px' }}>
            <div style={{ background: 'var(--background)', padding: '12px 10px', borderRadius: '8px', border: '1px solid var(--border)', textAlign: 'center' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', marginBottom: '4px' }}>Technical</span>
              <strong style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>{message.summary.technicalScore ?? message.summary.overallScore}%</strong>
            </div>
            <div style={{ background: 'var(--background)', padding: '12px 10px', borderRadius: '8px', border: '1px solid var(--border)', textAlign: 'center' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', marginBottom: '4px' }}>Comm</span>
              <strong style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>{message.summary.communicationScore ?? message.summary.overallScore}%</strong>
            </div>
            <div style={{ background: 'var(--background)', padding: '12px 10px', borderRadius: '8px', border: '1px solid var(--border)', textAlign: 'center' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', marginBottom: '4px' }}>Problem Solving</span>
              <strong style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>{message.summary.problemSolvingScore ?? message.summary.overallScore}%</strong>
            </div>
            <div style={{ background: 'var(--background)', padding: '12px 10px', borderRadius: '8px', border: '1px solid var(--border)', textAlign: 'center' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', marginBottom: '4px' }}>Confidence</span>
              <strong style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>{message.summary.confidenceScore ?? message.summary.overallScore}%</strong>
            </div>
          </div>

          {/* Overall Domain Coverage progress gauge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--background)', border: '1px solid var(--border)', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
            <div style={{ position: 'relative', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg style={{ transform: 'rotate(-90deg)', width: '56px', height: '56px' }}>
                <circle cx="28" cy="28" r="24" stroke="var(--border)" strokeWidth="5" fill="transparent" />
                <circle cx="28" cy="28" r="24" stroke="var(--secondary)" strokeWidth="5" fill="transparent" strokeDasharray={150.8} strokeDashoffset={150.8 - (150.8 * (message.summary.coveragePercentage || 0)) / 100} style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
              </svg>
              <span style={{ position: 'absolute', fontSize: '11px', fontWeight: '800', color: 'var(--text-primary)' }}>{Math.round(message.summary.coveragePercentage || 0)}%</span>
            </div>
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 3px' }}>Systematic Domain Coverage</h4>
              <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: 0 }}>Eliminating unassessed areas across multi-session evaluations.</p>
            </div>
          </div>

          {/* Interactive Skill Tree Matrix Grid */}
          {message.summary.skillsPerformance?.length > 0 && (
            <div style={{ border: '1px solid var(--border)', padding: '16px', borderRadius: '12px', background: 'var(--surface-alt)', marginBottom: '20px', textAlign: 'left' }}>
              <strong style={{ display: 'block', fontSize: '13px', color: 'var(--secondary)', marginBottom: '10px' }}>🎯 Dynamic Skill Matrix Grid</strong>
              {(() => {
                const mastered = message.summary.skillsPerformance.filter(s => s.status === 'mastered');
                const average = message.summary.skillsPerformance.filter(s => s.status === 'average');
                const weak = message.summary.skillsPerformance.filter(s => s.status === 'weak');
                const unassessed = message.summary.skillsPerformance.filter(s => s.status === 'not_assessed');
                
                return (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {mastered.map(item => (
                      <span key={item.skill} onClick={() => setActiveSkillDetail(item)} style={{ background: 'var(--success-translucent)', color: 'var(--success)', border: '1px solid var(--success-translucent)', padding: '3px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: '500', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s' }} title="Click to view evidence">
                        ✔ {item.skill}
                      </span>
                    ))}
                    {average.map(item => (
                      <span key={item.skill} onClick={() => setActiveSkillDetail(item)} style={{ background: 'var(--info-translucent)', color: 'var(--info)', border: '1px solid var(--info-translucent)', padding: '3px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: '500', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s' }} title="Click to view evidence">
                        ● {item.skill}
                      </span>
                    ))}
                    {weak.map(item => (
                      <span key={item.skill} onClick={() => setActiveSkillDetail(item)} style={{ background: 'var(--error-translucent)', color: 'var(--error)', border: '1px solid var(--error-translucent)', padding: '3px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: '500', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s' }} title="Click to view evidence">
                        ⚠ {item.skill}
                      </span>
                    ))}
                    {unassessed.map(item => (
                      <span key={item.skill} style={{ background: 'var(--surface-alt)', color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '3px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: '500', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        ○ {item.skill}
                      </span>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Hiring Decision Card */}
          <div className="hiring-recommendation-card" style={{ marginBottom: '20px', padding: '16px', background: 'var(--secondary-translucent)', border: '1px solid var(--secondary-translucent)', borderRadius: '12px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--secondary)', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🏆</span> Final Hiring Decision
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div style={{ background: 'var(--background)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>Recommendation</span>
                <strong style={{ fontSize: '14px', color: recColor }}>{message.summary.hiringRecommendation?.recommendation || 'Borderline'}</strong>
              </div>
              <div style={{ background: 'var(--background)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>Evaluation Confidence</span>
                <strong style={{ fontSize: '14px', color: 'var(--secondary)' }}>{message.summary.hiringRecommendation?.confidence || '80%'}</strong>
              </div>
            </div>
            {message.summary.hiringRecommendation?.hiring_rationale && (
              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5', background: 'var(--background)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <strong style={{ fontSize: '11px', color: 'var(--secondary)', display: 'block', marginBottom: '4px' }}>Hiring Rationale</strong>
                {message.summary.hiringRecommendation.hiring_rationale}
              </div>
            )}
          </div>

          {/* Market Readiness Matrix Widget */}
          {message.summary.marketReadinessMatrix && (
            <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--success-translucent)', border: '1px solid var(--success-translucent)', borderRadius: '12px' }}>
              <strong style={{ display: 'block', fontSize: '13px', color: 'var(--success)', marginBottom: '12px' }}>📈 Market Readiness Analysis Matrix</strong>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px' }}>
                {Object.entries(message.summary.marketReadinessMatrix).map(([tier, status]) => {
                  const lightColor = status === 'Ready' 
                    ? 'var(--success)' 
                    : status === 'Polishing' 
                    ? 'var(--info)' 
                    : status === 'Not Ready' 
                    ? 'var(--error)' 
                    : 'var(--text-muted)';
                  return (
                    <div key={tier} style={{ background: 'var(--background)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                        {tier === 'midLevel' ? 'Mid-Level' : tier}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: lightColor }} />
                        <strong style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{status}</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Market Readiness Statement */}
          {message.summary.marketReadiness && (
            <div style={{ marginBottom: '20px', padding: '14px 16px', background: 'var(--success-translucent)', border: '1px solid var(--success-translucent)', borderRadius: '10px' }}>
              <strong style={{ display: 'block', fontSize: '13px', color: 'var(--success)', marginBottom: '4px' }}>📈 Targeted Scope & Capability</strong>
              <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{message.summary.marketReadiness}</p>
            </div>
          )}

          {/* Human-like closing message */}
          {message.summary.closingMessage && (
            <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '12px' }}>
              <strong style={{ display: 'block', fontSize: '13px', color: 'var(--secondary)', marginBottom: '8px' }}>💬 Interviewer Notes</strong>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.5', fontStyle: 'italic' }}>"{message.summary.closingMessage}"</p>
            </div>
          )}

          {/* Strengths & Weaknesses */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div className="summary-section" style={{ textAlign: 'left' }}>
              <strong style={{ fontSize: '13px', color: 'var(--success)', display: 'block', marginBottom: '8px' }}>✔ Key Strengths</strong>
              <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                {message.summary.strengths.map((item) => <li key={item} style={{ marginBottom: '4px' }}>{item}</li>)}
              </ul>
            </div>
            <div className="summary-section" style={{ textAlign: 'left' }}>
              <strong style={{ fontSize: '13px', color: 'var(--error)', display: 'block', marginBottom: '8px' }}>⚠ Core Weaknesses</strong>
              <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                {message.summary.weaknesses.map((item) => <li key={item} style={{ marginBottom: '4px' }}>{item}</li>)}
              </ul>
            </div>
          </div>

          {/* Time-Phased Learning Plan Timeline */}
          {message.summary.timePhasedLearningPlan && (
            <div className="summary-section" style={{ textAlign: 'left', borderTop: '1px solid var(--border)', paddingTop: '16px', marginBottom: '24px' }}>
              <strong style={{ fontSize: '14px', color: 'var(--secondary)', display: 'block', marginBottom: '12px' }}>🗺 Time-Phased Personalized Learning Plan</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', paddingLeft: '20px', borderLeft: '1px solid var(--border)' }}>
                
                {/* Immediate */}
                {message.summary.timePhasedLearningPlan.immediate?.length > 0 && (
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '-25px', top: '2px', width: '9px', height: '9px', borderRadius: '50%', background: 'var(--error)', border: '2px solid var(--background)' }} />
                    <span style={{ fontSize: '10px', color: 'var(--error)', fontWeight: '700', textTransform: 'uppercase' }}>Milestone 1: Immediate Priorities</span>
                    <ul style={{ margin: '4px 0 0', paddingLeft: '16px', fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      {message.summary.timePhasedLearningPlan.immediate.map((item, idx) => <li key={idx}>{item}</li>)}
                    </ul>
                  </div>
                )}

                {/* 30 Days */}
                {message.summary.timePhasedLearningPlan.next30Days?.length > 0 && (
                  <div style={{ position: 'relative', marginTop: '6px' }}>
                    <span style={{ position: 'absolute', left: '-25px', top: '2px', width: '9px', height: '9px', borderRadius: '50%', background: 'var(--info)', border: '2px solid var(--background)' }} />
                    <span style={{ fontSize: '10px', color: 'var(--info)', fontWeight: '700', textTransform: 'uppercase' }}>Milestone 2: Next 30 Days Build Plan</span>
                    <ul style={{ margin: '4px 0 0', paddingLeft: '16px', fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      {message.summary.timePhasedLearningPlan.next30Days.map((item, idx) => <li key={idx}>{item}</li>)}
                    </ul>
                  </div>
                )}

                {/* 90 Days */}
                {message.summary.timePhasedLearningPlan.next90Days?.length > 0 && (
                  <div style={{ position: 'relative', marginTop: '6px' }}>
                    <span style={{ position: 'absolute', left: '-25px', top: '2px', width: '9px', height: '9px', borderRadius: '50%', background: 'var(--secondary)', border: '2px solid var(--background)' }} />
                    <span style={{ fontSize: '10px', color: 'var(--secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Milestone 3: Next 90 Days Advanced Mastery</span>
                    <ul style={{ margin: '4px 0 0', paddingLeft: '16px', fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      {message.summary.timePhasedLearningPlan.next90Days.map((item, idx) => <li key={idx}>{item}</li>)}
                    </ul>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* Post Interview Flow Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            <button className="btn-secondary" onClick={() => navigate('/')} style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
              Return to Dashboard
            </button>
            <button className="btn-primary" onClick={() => navigate('/interview')} style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
              Start New Interview
            </button>
          </div>
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
          {session.status !== 'completed' && session.status !== 'abandoned' && (
            <button className="btn-primary" style={{ marginRight: '10px' }} onClick={() => {
              const syncedLocal = {
                interviewSession: session,
                chatMessages: Array.isArray(session.messages) ? session.messages : [],
                currentQuestionIndex: session.currentQuestionIndex || 0,
                timerSeconds: session.timerState || 0,
                interviewStarted: session.status === 'active' || session.status === 'incomplete' || session.status === 'in_progress',
                interviewCompleted: false,
                savedAt: new Date().toISOString(),
              };
              localStorage.setItem('road2dev-interview', JSON.stringify(syncedLocal));
              localStorage.setItem('road2dev-interview-session-id', session._id || session.id);
              navigate('/interview');
            }}>
              Resume Interview
            </button>
          )}
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

      {activeSkillDetail && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }} onClick={() => setActiveSkillDetail(null)}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '24px', borderRadius: '16px', maxWidth: '480px', width: '90%', textAlign: 'left', color: 'var(--text-primary)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <strong style={{ fontSize: '11px', color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🔍 Skill Diagnostics</strong>
              <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }} onClick={() => setActiveSkillDetail(null)}>✕</button>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 12px', color: 'var(--text-primary)' }}>{activeSkillDetail.skill}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              <div style={{ background: 'var(--background)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>Status</span>
                <strong style={{ fontSize: '13px', color: activeSkillDetail.status === 'mastered' ? 'var(--success)' : activeSkillDetail.status === 'average' ? 'var(--info)' : 'var(--error)', textTransform: 'capitalize' }}>{activeSkillDetail.status}</strong>
              </div>
              <div style={{ background: 'var(--background)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>Evaluation Confidence</span>
                <strong style={{ fontSize: '13px', color: 'var(--secondary)' }}>{activeSkillDetail.confidence}</strong>
              </div>
            </div>
            <div>
              <strong style={{ fontSize: '11px', color: 'var(--secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Hiring Evidence Justification</strong>
              <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5', fontStyle: 'italic', background: 'var(--background)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                "{activeSkillDetail.evidence || 'No direct conversational evidence gathered yet.'}"
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewSession;
