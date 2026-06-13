import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BrainCircuit, Shield, AlertTriangle, CheckCircle, Clock, Activity, BookOpen, BarChart3, Zap, ExternalLink, Search, Mic } from 'lucide-react';
import './MentorMemoryViewer.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5500/api';

function getConfidence(evidence) {
  const total = (evidence?.sandbox || 0) + (evidence?.interview || 0) + (evidence?.defense || 0);
  if (total >= 5) return { label: 'High', color: '#34d399', icon: '🟢' };
  if (total >= 2) return { label: 'Medium', color: '#fbbf24', icon: '🟡' };
  return { label: 'Low', color: '#fb923c', icon: '🟠' };
}

function getStrengthLabel(mastery) {
  if (mastery >= 75) return { label: 'Strong', color: '#34d399' };
  if (mastery >= 50) return { label: 'Developing', color: '#fbbf24' };
  if (mastery > 0) return { label: 'Weak', color: '#ef4444' };
  return { label: 'Untracked', color: '#71717a' };
}

function formatDate(val) {
  if (!val) return 'N/A';
  const d = new Date(val);
  const now = new Date();
  const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff}d ago`;
  if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function MentorMemoryViewer() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [expandedTopic, setExpandedTopic] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('auth_token');
    if (!token) { setError('Authentication required.'); setLoading(false); return; }
    try {
      const [dashRes] = await Promise.all([
        fetch(`${API_BASE}/learning-lab/unified-dashboard`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const dashData = await dashRes.json();
      if (dashData.success) setData(dashData.data);
      else setError(dashData.message || 'Failed to load.');
    } catch { setError('Failed to connect.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const swot = data?.swot;
  const allTopics = [
    ...(swot?.strongTopics || []).map(t => ({ ...t, _strength: 'strong' })),
    ...(swot?.weakTopics || []).map(t => ({ ...t, _strength: 'weak' })),
  ];

  // Deduplicate by topic name (strong takes priority for display)
  const topicMap = new Map();
  for (const t of allTopics) {
    if (!topicMap.has(t.topic) || t._strength === 'strong') {
      topicMap.set(t.topic, t);
    }
  }
  const allMerged = [...topicMap.values()].sort((a, b) => b.mastery - a.mastery);

  const filtered = allMerged.filter(t => {
    if (filter === 'strong' && t.mastery < 75) return false;
    if (filter === 'weak' && (t.mastery >= 75 || t.mastery === 0)) return false;
    if (filter === 'developing' && (t.mastery >= 75 || t.mastery < 50 || t.mastery === 0)) return false;
    if (searchQuery && !t.topic.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const toggleExpand = (topic) => {
    setExpandedTopic(expandedTopic === topic ? null : topic);
    setSelectedTopic(topic);
  };

  if (loading) return (
    <div className="mmv-container">
      <div className="mmv-loading"><BrainCircuit size={32} /> Loading mentor memory...</div>
    </div>
  );

  if (error) return (
    <div className="mmv-container">
      <div className="mmv-loading mmv-error-state">{error}</div>
    </div>
  );

  const readiness = data?.readiness;

  return (
    <div className="mmv-container">
      <header className="mmv-header">
        <button onClick={() => navigate('/learning-lab')} className="mmv-back-btn"><ArrowLeft size={16} /> Back to Lab</button>
        <div className="mmv-header-title">
          <BrainCircuit size={28} className="mmv-header-icon" />
          <div>
            <h1>Mentor Memory</h1>
            <p className="mmv-subtitle">Cross-system knowledge graph: what you know, how well, and where the evidence comes from</p>
          </div>
        </div>
      </header>

      {/* Status Bar */}
      <div className="mmv-status-bar">
        <div className="mmv-status-item">
          <CheckCircle size={16} color="#34d399" />
          <span><strong>{swot?.strongTopics?.length || 0}</strong> Strong Topics</span>
        </div>
        <div className="mmv-status-item">
          <AlertTriangle size={16} color="#ef4444" />
          <span><strong>{swot?.weakTopics?.length || 0}</strong> Needs Improvement</span>
        </div>
        <div className="mmv-status-item">
          <Activity size={16} color="var(--secondary)" />
          <span><strong>{allMerged.length}</strong> Total Tracked</span>
        </div>
        {readiness && (
          <div className="mmv-status-item">
            <BarChart3 size={16} color="var(--secondary)" />
            <span>Mastery: <strong>{readiness.overallMastery}%</strong></span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="mmv-controls">
        <div className="mmv-search">
          <Search size={16} className="mmv-search-icon" />
          <input
            type="text" placeholder="Search topics..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)} className="mmv-search-input"
          />
        </div>
        <div className="mmv-filters">
          {['all', 'strong', 'developing', 'weak'].map(f => (
            <button key={f} className={`mmv-filter-btn ${filter === f ? 'mmv-filter-active' : ''}`}
              onClick={() => setFilter(f)}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
          ))}
        </div>
      </div>

      {allMerged.length === 0 && (
        <div className="mmv-empty">
          <BrainCircuit size={48} />
          <h2>No topics tracked yet</h2>
          <p>Complete interviews, learning sessions, sandbox challenges, or project defenses to build your mentor memory.</p>
          <button onClick={() => navigate('/learning-lab')} className="mmv-primary-btn">Go to Learning Lab</button>
        </div>
      )}

      {filtered.length === 0 && allMerged.length > 0 && (
        <div className="mmv-empty">
          <Search size={48} />
          <h2>No matching topics</h2>
          <p>Try a different filter or search term.</p>
        </div>
      )}

      <div className="mmv-grid">
        {filtered.map((topic) => {
          const totalEvidence = (topic.evidenceCount?.sandbox || 0) + (topic.evidenceCount?.interview || 0) + (topic.evidenceCount?.defense || 0);
          const confidence = getConfidence(topic.evidenceCount);
          const strength = getStrengthLabel(topic.mastery);
          const isExpanded = expandedTopic === topic.topic;
          const lastSource = topic.sources?.length > 0 ? topic.sources.sort((a, b) => new Date(b.date) - new Date(a.date))[0] : null;

          return (
            <div key={topic.topic} className={`mmv-card ${strength.label.toLowerCase()}`}
              onClick={() => toggleExpand(topic.topic)}>
              <div className="mmv-card-main">
                <div className="mmv-card-left">
                  <span className={`mmv-strength-dot ${strength.label.toLowerCase()}`} />
                  <div className="mmv-card-info">
                    <h3 className="mmv-topic-name">{topic.topic}</h3>
                    <div className="mmv-topic-meta">
                      <span className="mmv-strength-label" style={{ color: strength.color }}>{strength.label}</span>
                      <span className="mmv-meta-sep">•</span>
                      <span className="mmv-confidence" style={{ color: confidence.color }}>
                        {confidence.icon} Confidence: {confidence.label}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mmv-card-right">
                  <div className="mmv-mastery-circle" style={{ background: `conic-gradient(${strength.color} ${topic.mastery}%, var(--border) ${topic.mastery}%)` }}>
                    <span className="mmv-mastery-text">{topic.mastery}%</span>
                  </div>
                </div>
              </div>

              {/* Evidence bar */}
              <div className="mmv-evidence-bar-bg">
                <div className="mmv-evidence-bar-fill" style={{ width: `${topic.mastery}%`, background: strength.color }} />
              </div>

              {/* Evidence summary row */}
              <div className="mmv-evidence-row">
                <div className="mmv-evidence-source">
                  <BookOpen size={12} /> Sandbox: <strong>{topic.evidenceCount?.sandbox || 0}</strong>
                </div>
                <div className="mmv-evidence-source">
                  <Mic size={12} /> Interview: <strong>{topic.evidenceCount?.interview || 0}</strong>
                </div>
                <div className="mmv-evidence-source">
                  <Shield size={12} /> Defense: <strong>{topic.evidenceCount?.defense || 0}</strong>
                </div>
                {lastSource && (
                  <div className="mmv-evidence-source mmv-evidence-last">
                    <Clock size={12} /> {formatDate(lastSource.date)}
                  </div>
                )}
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="mmv-expanded">
                  <div className="mmv-expanded-divider" />
                  <div className="mmv-expanded-grid">
                    <div className="mmv-expanded-col">
                      <h4>Topic Details</h4>
                      <div className="mmv-detail-row"><span>Mastery</span><strong>{topic.mastery}%</strong></div>
                      {topic.weakestDimension && (
                        <div className="mmv-detail-row"><span>Weakest Dimension</span><strong>{topic.weakestDimension.replace(/([A-Z])/g, ' $1').trim()}: {topic.weakestScore}/100</strong></div>
                      )}
                      <div className="mmv-detail-row"><span>Total Evidence Sources</span><strong>{totalEvidence}</strong></div>
                      <div className="mmv-detail-row"><span>Recency Score</span><strong>{topic.recencyAdjustedScore || 'N/A'}</strong></div>
                    </div>
                    <div className="mmv-expanded-col">
                      <h4>Dimension Breakdown</h4>
                      {['conceptUnderstanding', 'codingAbility', 'problemSolving', 'projectUsage', 'interviewReadiness'].map(dim => {
                        const score = topic.sources?.[0]?.[dim] || 0;
                        return (
                          <div key={dim} className="mmv-dim-row">
                            <span className="mmv-dim-label">{dim.replace(/([A-Z])/g, ' $1').trim()}</span>
                            <div className="mmv-dim-bar-bg">
                              <div className="mmv-dim-bar-fill" style={{ width: `${Math.min(100, score)}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mmv-expanded-col">
                      <h4>Evidence History</h4>
                      <div className="mmv-source-list">
                        {(topic.sources || []).slice(0, 10).map((s, i) => (
                          <div key={i} className="mmv-source-item">
                            <span className={`mmv-source-type ${s.source === 'interview_completed' ? 'mmv-src-interview' : s.source === 'project_defense_completed' ? 'mmv-src-defense' : s.source === 'sandbox_passed' ? 'mmv-src-sandbox' : ''}`}>
                              {s.source === 'interview_completed' ? 'Interview' : s.source === 'project_defense_completed' ? 'Defense' : s.source === 'sandbox_passed' ? 'Sandbox' : s.refType}
                            </span>
                            <span className="mmv-source-date">{formatDate(s.date)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mmv-expanded-actions">
                    {topic.mastery < 75 && (
                      <button onClick={(e) => { e.stopPropagation(); navigate(`/learning-lab?topic=${encodeURIComponent(topic.topic)}&remediate=true`); }} className="mmv-action-btn mmv-action-fix">
                        <Zap size={14} /> Improve {topic.topic}
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); navigate('/learning-lab'); }} className="mmv-action-btn mmv-action-lab">
                      <ExternalLink size={14} /> Open in Lab
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
