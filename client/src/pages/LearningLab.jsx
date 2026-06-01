import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Terminal, 
  Play, 
  CheckCircle, 
  RotateCcw, 
  FolderGit2, 
  Briefcase, 
  Send, 
  ArrowRight,
  Plus, 
  BookOpen, 
  Code2,
  Copy,
  Check,
  Brain,
  ChevronRight,
  ArrowLeft,
  Calendar,
  DollarSign,
  TrendingUp,
  UserCheck,
  AlertTriangle
} from 'lucide-react';
import './LearningLab.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5500/api';

function LearningLab() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // State
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [activeTab, setActiveTab] = useState('playground'); // playground, project, coach, memory
  const [selectedMode, setSelectedMode] = useState('Intermediate');
  const [personality, setPersonality] = useState('The Coding Coach');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Journey-First Onboarding states
  const [showHistoryResume, setShowHistoryResume] = useState(false);
  const [guidedModalType, setGuidedModalType] = useState(null); // 'learn' | 'weakness' | null
  
  // Playground state
  const [playgroundCode, setPlaygroundCode] = useState('');
  const [consoleOutput, setConsoleOutput] = useState('');
  const [consoleError, setConsoleError] = useState('');
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);
  const [runningCode, setRunningCode] = useState(false);
  
  // Project Ingestion state
  const [projectName, setProjectName] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [isIngestingProject, setIsIngestingProject] = useState(false);
  const [defenseAnswer, setDefenseAnswer] = useState('');
  const [isSubmittingDefense, setIsSubmittingDefense] = useState(false);
  const [ingestError, setIngestError] = useState('');
  const [top25QuestionsExpanded, setTop25QuestionsExpanded] = useState(false);

  // Career Coach / Recruiter state
  const [coachData, setCoachData] = useState(null);
  const [loadingCoach, setLoadingCoach] = useState(false);
  const [memoryGaps, setMemoryGaps] = useState([]);
  
  // Copied states for code copy button animation
  const [copiedIndex, setCopiedIndex] = useState(null);

  const messagesEndRef = useRef(null);

  const getHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    };
  };

  // Fetch all learning sessions
  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/learning-lab/sessions`, {
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setSessions(data.data);
        return data.data;
      }
    } catch (e) {
      console.error('Error fetching sessions:', e);
    }
    return [];
  }, []);

  // Fetch specific session details
  const fetchSessionDetails = useCallback(async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/learning-lab/session/${id}`, {
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setActiveSession(data.data);
        setMessages(data.data.messages || []);
        setSelectedMode(data.data.mode || 'Intermediate');
        setPersonality(data.data.personality || 'The Coding Coach');
        
        // Find if last message has a playground challenge to load into playgroundCode
        const lastMsg = data.data.messages?.slice().reverse().find(m => m.playgroundChallenge && m.playgroundChallenge.initialCode);
        if (lastMsg) {
          setPlaygroundCode(lastMsg.playgroundChallenge.initialCode);
        } else {
          setPlaygroundCode('// Select a topic to start coding or request a challenge in the chat!');
        }

        // Set playground tab active if project defense is not active
        if (data.data.topic.startsWith('Project Defense:')) {
          setActiveTab('project');
        } else {
          setActiveTab('playground');
        }

        // AUTO-TAB SWITCHING: If AI issued a coding challenge, switch active right toolbox tab to 'playground' instantly!
        if (data.data.messages?.length > 0) {
          const lastAssistantMsg = data.data.messages.slice().reverse().find(m => m.role === 'assistant');
          if (lastAssistantMsg?.playgroundChallenge?.title) {
            setActiveTab('playground');
          }
        }
      }
    } catch (e) {
      console.error('Error fetching session details:', id, e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize or fetch sessions on mount
  useEffect(() => {
    const init = async () => {
      const allSessions = await fetchSessions();
      
      // Check query params for preloadedTopic (Knowledge Gap learn button flow)
      const params = new URLSearchParams(location.search);
      const preloadTopic = params.get('topic');
      const remediate = params.get('remediate');
      
      if (preloadTopic) {
        setLoading(true);
        try {
          const res = await fetch(`${API_BASE}/learning-lab/session`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ 
              topic: preloadTopic, 
              mode: 'Intermediate',
              sessionType: remediate ? 'Interview Remediation' : 'Concept Learning',
              personality: 'The Coding Coach'
            })
          });
          const data = await res.json();
          if (data.success) {
            await fetchSessions();
            fetchSessionDetails(data.data._id);
          }
        } catch (e) {
          console.error('Preload creation failed:', e);
        } finally {
          setLoading(false);
        }
      }
    };
    init();
  }, [location.search, fetchSessions, fetchSessionDetails]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load Career Coach data & active weaknesses gaps list
  const loadCareerCoach = async () => {
    setLoadingCoach(true);
    try {
      const res = await fetch(`${API_BASE}/learning-lab/career-coach`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ topic: activeSession?.topic || 'Full Stack Development' })
      });
      const data = await res.json();
      if (data.success) {
        setCoachData(data.data);
        setMemoryGaps(data.data.weakSkills || ['useEffect Hook', 'Closures', 'Promises', 'DOM Manipulation']);
      }
    } catch (e) {
      console.error('Failed to load career coach:', e);
    } finally {
      setLoadingCoach(false);
    }
  };

  useEffect(() => {
    if ((activeTab === 'coach' || activeTab === 'memory') && activeSession) {
      loadCareerCoach();
    }
  }, [activeTab, activeSession]);

  // Toggle personality profile
  const handlePersonalityChange = async (newPersonality) => {
    if (!activeSession) return;
    setPersonality(newPersonality);
    try {
      const res = await fetch(`${API_BASE}/learning-lab/session/${activeSession._id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ personality: newPersonality })
      });
      const data = await res.json();
      if (data.success) {
        setActiveSession(data.data);
        
        // Auto-retrigger explanation in new tone
        const resChat = await fetch(`${API_BASE}/learning-lab/session/${activeSession._id}/chat`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ text: `System personality switched to ${newPersonality}. Please re-explain our current topic in your new style!` })
        });
        const dataChat = await resChat.json();
        if (dataChat.success) {
          setActiveSession(dataChat.data);
          setMessages(dataChat.data.messages || []);
        }
      }
    } catch (e) {
      console.error('Personality swap failed:', e);
    }
  };

  // Toggle mission checklist goal item
  const handleToggleChecklistGoal = async (goalIndex) => {
    if (!activeSession) return;
    const list = [...activeSession.missionChecklist];
    list[goalIndex].completed = !list[goalIndex].completed;
    
    try {
      const res = await fetch(`${API_BASE}/learning-lab/session/${activeSession._id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ missionChecklist: list })
      });
      const data = await res.json();
      if (data.success) {
        setActiveSession(data.data);
      }
    } catch (err) {}
  };

  // Handle send message
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || !activeSession) return;

    const userText = inputText;
    setInputText('');

    // Optimistically add user message to UI
    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      role: 'user',
      text: userText,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await fetch(`${API_BASE}/learning-lab/session/${activeSession._id}/chat`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ text: userText })
      });
      const data = await res.json();
      if (data.success) {
        setActiveSession(data.data);
        setMessages(data.data.messages || []);
        
        // AUTO-TAB SWITCHING: Check if new message has a challenge and load it
        const lastMsg = data.data.messages?.slice().reverse().find(m => m.playgroundChallenge && m.playgroundChallenge.initialCode);
        if (lastMsg) {
          setPlaygroundCode(lastMsg.playgroundChallenge.initialCode);
          setActiveTab('playground');
        }
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  // Run Sandbox Code
  const handleRunCode = async () => {
    if (!playgroundCode.trim()) return;
    setRunningCode(true);
    setConsoleOutput('Executing inside secure sandbox context...');
    setConsoleError('');

    try {
      const res = await fetch(`${API_BASE}/learning-lab/playground/run`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ code: playgroundCode })
      });
      const data = await res.json();
      if (data.success) {
        if (data.data.error) {
          setConsoleError(data.data.error);
          setConsoleOutput(data.data.stdout || '');
        } else {
          setConsoleOutput(data.data.stdout || 'Success: No output logs.');
        }
      }
    } catch (e) {
      setConsoleError('Compiler sandboxing service temporarily unavailable.');
    } finally {
      setRunningCode(false);
    }
  };

  // Submit Sandbox Code
  const handleSubmitCode = async () => {
    if (!playgroundCode.trim() || !activeSession) return;
    setIsSubmittingCode(true);
    setConsoleOutput('Analyzing logic efficiency & criteria assertions...');
    setConsoleError('');

    // Find active challenge title
    const challengeMsg = messages.slice().reverse().find(m => m.playgroundChallenge?.title);
    const challengeTitle = challengeMsg ? challengeMsg.playgroundChallenge.title : activeSession.topic;

    try {
      const res = await fetch(`${API_BASE}/learning-lab/session/${activeSession._id}/playground/submit`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ code: playgroundCode, challengeTitle })
      });
      const data = await res.json();
      if (data.success) {
        const evaluation = data.data;
        if (evaluation.passed) {
          setConsoleOutput(`[SUCCESS] Challenge Completed Successfully!\nFeedback: ${evaluation.feedback}\nConsole Logs: ${evaluation.stdout}`);
        } else {
          setConsoleError(`[FAILED] Assertions Failed.\nFeedback: ${evaluation.feedback}`);
          setConsoleOutput(evaluation.stdout || '');
        }
        
        // Refresh session to update mastery scores
        fetchSessionDetails(activeSession._id);
      }
    } catch (e) {
      setConsoleError('Review evaluation engine failed.');
    } finally {
      setIsSubmittingCode(false);
    }
  };

  // Reset Playground
  const handleResetPlayground = () => {
    const challengeMsg = messages.slice().reverse().find(m => m.playgroundChallenge && m.playgroundChallenge.initialCode);
    if (challengeMsg) {
      setPlaygroundCode(challengeMsg.playgroundChallenge.initialCode);
    } else {
      setPlaygroundCode('// Sandbox editor reset');
    }
    setConsoleOutput('Console output reset.');
    setConsoleError('');
  };

  // Handle Project Ingestion
  const handleIngestProject = async (e) => {
    e.preventDefault();
    if (!githubUrl.trim() && !projectName.trim()) {
      setIngestError('Project Name and GitHub URL are required.');
      return;
    }
    
    setIsIngestingProject(true);
    setIngestError('');
    try {
      const res = await fetch(`${API_BASE}/learning-lab/project/ingest`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          projectName,
          githubUrl
        })
      });
      const data = await res.json();
      if (data.success) {
        setProjectName('');
        setGithubUrl('');
        await fetchSessions();
        fetchSessionDetails(data.data._id);
      } else {
        setIngestError(data.message || 'Ingestion analysis failed.');
      }
    } catch (err) {
      setIngestError('Repository clone & compress service timeout.');
    } finally {
      setIsIngestingProject(false);
    }
  };

  // Submit Answer to Project Defense Question
  const handleSubmitDefenseAnswer = async (e) => {
    e.preventDefault();
    if (!defenseAnswer.trim() || !activeSession) return;

    setIsSubmittingDefense(true);
    const answer = defenseAnswer;
    setDefenseAnswer('');

    try {
      const res = await fetch(`${API_BASE}/learning-lab/session/${activeSession._id}/project/defense`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ answer })
      });
      const data = await res.json();
      if (data.success) {
        setActiveSession(data.data);
        setMessages(data.data.messages || []);
      }
    } catch (err) {
      console.error('Defense submission failed:', err);
    } finally {
      setIsSubmittingDefense(false);
    }
  };

  // Copy Code block handler
  const handleCopyCode = (code, index) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Create new session topic trigger
  const handleCreateGuidedSession = async (topic, sessionType) => {
    setGuidedModalType(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/learning-lab/session`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ 
          topic, 
          mode: 'Intermediate',
          sessionType: sessionType || 'Concept Learning',
          personality: 'The Coding Coach'
        })
      });
      const data = await res.json();
      if (data.success) {
        await fetchSessions();
        fetchSessionDetails(data.data._id);
      }
    } catch (e) {
      console.error('Failed to create session:', e);
    } finally {
      setLoading(false);
    }
  };

  // Exit active workspace session to Goals Portal
  const handleExitToGoalsPortal = () => {
    setActiveSession(null);
    setMessages([]);
    setShowHistoryResume(false);
  };

  // Helper to custom parse and render AI explanations, structuring headings & code blocks w/ Copy & Line Numbers
  const parseMentorText = (text) => {
    if (!text) return null;

    // Split by fenced code blocks to extract syntax
    const parts = text.split(/(```javascript|```js|```)/g);
    let isCode = false;
    let codeIndex = 0;

    return parts.map((part, idx) => {
      if (part === '```javascript' || part === '```js') {
        isCode = true;
        return null;
      }
      if (part === '```') {
        isCode = false;
        return null;
      }

      if (isCode) {
        const cleanCode = part.trim();
        const lines = cleanCode.split('\n');
        codeIndex++;
        const currentIdx = idx;

        return (
          <div key={idx} className="vs-code-block">
            <div className="vs-code-header">
              <span>javascript (focused snippet)</span>
              <button 
                className="copy-btn" 
                onClick={() => handleCopyCode(cleanCode, currentIdx)}
              >
                {copiedIndex === currentIdx ? (
                  <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Check size={12} /> Copied!
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Copy size={12} /> Copy
                  </span>
                )}
              </button>
            </div>
            <div style={{ display: 'flex', background: '#09090b', overflowX: 'auto' }}>
              <div style={{ padding: '12px 8px', borderRight: '1px solid #1c1c1f', color: '#52525b', textAlign: 'right', userSelect: 'none', fontSize: '12.5px', fontFamily: 'monospace', minWidth: '32px' }}>
                {lines.map((_, i) => <div key={i}>{i + 1}</div>)}
              </div>
              <div className="vs-code-content" style={{ padding: '12px 16px', margin: 0, fontFamily: 'monospace' }}>
                {cleanCode}
              </div>
            </div>
          </div>
        );
      }

      // Format custom headers/blocks
      const formattedLines = part.split('\n').map((line, lIdx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('### ') || trimmed.startsWith('## ')) {
          return <h4 key={lIdx} style={{ color: '#a78bfa', marginTop: '14px', marginBottom: '8px', fontSize: '14px', fontWeight: '800' }}>{trimmed.replace(/###|##/g, '').trim()}</h4>;
        }
        if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
          return <li key={lIdx} style={{ color: '#d1d1d6', fontSize: '13px', marginLeft: '12px', marginBottom: '4px' }}>{trimmed.replace(/^[-*]\s*/, '')}</li>;
        }
        
        // Parse tables if present
        if (trimmed.startsWith('|') && trimmed.endsWith('|') && !trimmed.includes('---')) {
          const cells = trimmed.split('|').map(c => c.trim()).filter(c => c !== '');
          return (
            <div key={lIdx} style={{ display: 'grid', gridTemplateColumns: `repeat(${cells.length}, 1fr)`, gap: '8px', background: '#18181b', border: '1px solid #27272a', padding: '8px 12px', borderRadius: '4px', margin: '4px 0', fontSize: '12.5px', color: '#e4e4e7' }}>
              {cells.map((cell, cIdx) => <strong key={cIdx} style={{ fontWeight: cell.includes('**') ? '800' : 'normal' }}>{cell.replace(/\*\//g, '')}</strong>)}
            </div>
          );
        }

        return <p key={lIdx} style={{ margin: '0 0 10px 0', color: '#d1d1d6', fontSize: '13.5px', lineHeight: '1.6' }}>{trimmed}</p>;
      });

      return <div key={idx}>{formattedLines}</div>;
    });
  };

  const projectContext = activeSession?.projectContext;
  const isProjectSession = activeSession?.topic.startsWith('Project Defense:');

  // Calculates completion checklist delta
  const calculateChecklistPercent = () => {
    if (!activeSession?.missionChecklist?.length) return 0;
    const completed = activeSession.missionChecklist.filter(item => item.completed).length;
    return Math.round((completed / activeSession.missionChecklist.length) * 100);
  };

  // Pre-load gaps lists on page load
  useEffect(() => {
    fetchSessions();
    loadCareerCoach();
  }, [fetchSessions]);

  return (
    <section className="learning-lab-container">
      {/* 
        JOURNEY-FIRST PORTAL (BEFORE GOAL SELECTION)
        If no active session is selected, we render the full screen onboarding Goals Portal.
        Hides all split panels, sidebars, playgrounds, recruiter roadmaps, and tools.
      */}
      {!activeSession ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: '#09090b', overflowY: 'auto' }}>
          
          {!showHistoryResume ? (
            /* Curated Goals Portal View */
            <div className="onboarding-hero" style={{ padding: '60px 40px', maxWidth: '960px', margin: '0 auto', width: '100%' }}>
              <div className="hero-glow-badge" style={{ animation: 'pulse 2s infinite' }}>⭐ guided development labs</div>
              
              <h1 style={{ fontSize: '38px', fontWeight: '900', letterSpacing: '-0.5px' }}>Road2Dev AI Mentor Lab</h1>
              <p className="tagline" style={{ fontSize: '16px', marginBottom: '40px' }}>Erase Gaps. Compile Scripts. Defend Codebases. Get Hired.</p>
              
              {/* Journey Answers grids */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '50px', width: '100%', textAlign: 'left' }}>
                <div style={{ background: '#121214', border: '1px solid #1c1c1f', padding: '20px', borderRadius: '12px' }}>
                  <strong style={{ display: 'block', fontSize: '13px', color: '#a78bfa', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    1. What is this page?
                  </strong>
                  <p style={{ fontSize: '12.5px', color: '#a1a1aa', margin: 0, lineHeight: '1.6' }}>
                    A dedicated improvement studio. While **Interview Prep** assesses your skills, **AI Mentor Lab** removes weaknesses using senior developer coaching.
                  </p>
                </div>
                
                <div style={{ background: '#121214', border: '1px solid #1c1c1f', padding: '20px', borderRadius: '12px' }}>
                  <strong style={{ display: 'block', fontSize: '13px', color: '#34d399', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    2. What can I do here?
                  </strong>
                  <p style={{ fontSize: '12.5px', color: '#a1a1aa', margin: 0, lineHeight: '1.6' }}>
                    Learn computer concepts deeply, write code in safe sandbox compilers, defend architecture decisions of your projects, and build roadmaps.
                  </p>
                </div>

                <div style={{ background: '#121214', border: '1px solid #1c1c1f', padding: '20px', borderRadius: '12px' }}>
                  <strong style={{ display: 'block', fontSize: '13px', color: '#60a5fa', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    3. Where should I start?
                  </strong>
                  <p style={{ fontSize: '12.5px', color: '#a1a1aa', margin: 0, lineHeight: '1.6' }}>
                    Select one of the curated technical goals below. The platform will dynamically assemble and reveal the workspace suited for that mission.
                  </p>
                </div>
              </div>

              <div style={{ fontSize: '14px', color: '#fff', fontWeight: '800', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Select Your Goal to Assemble Workspace
              </div>

              {/* Curated Goals selection cards */}
              <div className="onboarding-grid" style={{ maxWidth: '840px', gap: '20px' }}>
                <div className="onboarding-card" onClick={() => setGuidedModalType('learn')}>
                  <div>
                    <h3 style={{ color: '#c084fc' }}><BookOpen size={16} /> Learn a Topic</h3>
                    <p>Unlock analogies and step-by-step masteries for closures, hooks, event loops, or custom modules.</p>
                  </div>
                  <span className="onboarding-action">Concept learning <ChevronRight size={12} /></span>
                </div>

                <div className="onboarding-card" onClick={() => handleCreateGuidedSession('Vanilla JS Compilation Sandbox', 'Sandbox Practice')}>
                  <div>
                    <h3 style={{ color: '#34d399' }}><Code2 size={16} /> Safe Sandbox Practice</h3>
                    <p>Compile algorithms, write test script counters, and inspect logs in a sandboxed execution prompt.</p>
                  </div>
                  <span className="onboarding-action">Sandbox Practice <ChevronRight size={12} /></span>
                </div>

                <div className="onboarding-card" onClick={() => handleCreateGuidedSession('Ingest Repository Blueprint', 'Project Defense')}>
                  <div>
                    <h3 style={{ color: '#60a5fa' }}><FolderGit2 size={16} /> Ingest & Defend Project</h3>
                    <p>Pasted repositories URL contents scan structure and state files to launch a project defense interview.</p>
                  </div>
                  <span className="onboarding-action">Project Ingester <ChevronRight size={12} /></span>
                </div>

                <div className="onboarding-card" onClick={() => setGuidedModalType('weakness')}>
                  <div>
                    <h3 style={{ color: '#f87171' }}><AlertTriangle size={16} /> Fix Interview Weaknesses</h3>
                    <p>Pulls weak competency skills identified in previous assessments to begin targeted missions.</p>
                  </div>
                  <span className="onboarding-action">Remediation Mission <ChevronRight size={12} /></span>
                </div>
              </div>

              {/* History resumer block */}
              <div style={{ marginTop: '40px', borderTop: '1px solid #1c1c1f', paddingTop: '20px', width: '100%' }}>
                <button 
                  onClick={() => {
                    fetchSessions();
                    setShowHistoryResume(true);
                  }}
                  style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  Or, resume an active Labs workspace <span style={{ color: '#a78bfa', textDecoration: 'underline' }}>[View History Sessions]</span>
                </button>
              </div>

            </div>
          ) : (
            /* History Workspaces resume list inside onboarding portal */
            <div className="onboarding-hero" style={{ padding: '60px 40px', maxWidth: '640px', margin: '0 auto', width: '100%', alignItems: 'flex-start', textAlign: 'left' }}>
              <button 
                onClick={() => setShowHistoryResume(false)}
                style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 'bold', marginBottom: '24px' }}
              >
                <ArrowLeft size={16} /> Back to Curated Goals
              </button>
              
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#fff', margin: '0 0 8px' }}>Resume Previous Labs Workspaces</h2>
              <p style={{ fontSize: '13px', color: '#71717a', margin: '0 0 20px' }}>Select an ongoing mentoring space to load logs, sandbox scripts, and architecture blueprints.</p>
              
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {sessions.length === 0 ? (
                  <div style={{ color: '#71717a', fontSize: '13px' }}>No active labs sessions found. Launch a curated goal to start!</div>
                ) : (
                  sessions.map(s => {
                    const isProj = s.topic.startsWith('Project Defense:');
                    return (
                      <div 
                        key={s._id} 
                        onClick={() => fetchSessionDetails(s._id)}
                        style={{ 
                          background: '#121214', 
                          border: '1px solid #1c1c1f', 
                          padding: '14px 16px', 
                          borderRadius: '8px', 
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'all 0.2s'
                        }}
                        className="onboarding-card-history"
                      >
                        <div>
                          <strong style={{ display: 'block', fontSize: '13.5px', color: '#fff' }}>
                            {isProj ? '🛡️ ' + s.topic.replace('Project Defense: ', '') : '📖 ' + s.topic}
                          </strong>
                          <span style={{ fontSize: '11px', color: '#71717a' }}>Focus: {s.sessionType} • Mode: {s.mode}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '13px', color: s.masteryPercentage >= 75 ? '#34d399' : s.masteryPercentage >= 40 ? '#60a5fa' : '#f87171', fontWeight: 'bold' }}>
                            {s.masteryPercentage}% Mastery
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

        </div>
      ) : (
        
        /* 
          DYNAMIC SPLIT WORKSPACE LAYOUT (ASSEMBLES AFTER MISSION SELECTION)
          Reveals sidebar, chat pane, editor textareas contextually around the active goal.
        */
        <>
          {/* Labs Sessions Sidebar */}
          {sidebarOpen && (
            <div style={{ width: '250px', background: '#09090b', borderRight: '1px solid #1c1c1f', display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid #1c1c1f', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#71717a', letterSpacing: '0.5px' }}>🚀 LABS WORKSPACES</span>
                <button onClick={handleExitToGoalsPortal} style={{ background: '#1c1c1f', border: '1px solid #27272a', color: '#fff', borderRadius: '4px', padding: '4px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '700' }}>
                  <ArrowLeft size={11} /> Portal
                </button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                {sessions.map(s => {
                  const isSelected = activeSession?._id === s._id;
                  const isProj = s.topic.startsWith('Project Defense:');
                  return (
                    <div 
                      key={s._id} 
                      onClick={() => fetchSessionDetails(s._id)}
                      style={{ 
                        padding: '10px 12px', 
                        borderRadius: '8px', 
                        background: isSelected ? 'rgba(139, 92, 246, 0.08)' : 'transparent',
                        border: isSelected ? '1px solid rgba(139, 92, 246, 0.25)' : '1px solid transparent',
                        cursor: 'pointer',
                        marginBottom: '6px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <strong style={{ display: 'block', fontSize: '12.5px', color: isSelected ? '#a78bfa' : '#e4e4e7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {isProj ? '🛡️ ' + s.topic.replace('Project Defense: ', '') : '📖 ' + s.topic}
                      </strong>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '10px', color: '#71717a' }}>
                        <span>{s.mode}</span>
                        <span style={{ color: s.masteryPercentage >= 75 ? '#34d399' : s.masteryPercentage >= 40 ? '#60a5fa' : '#f87171', fontWeight: 'bold' }}>
                          {s.masteryPercentage}% Mastery
                        </span>
                      </div>
                      
                      {/* Mastery Progress Bar */}
                      <div style={{ width: '100%', height: '3px', background: '#1c1c1f', borderRadius: '1px', marginTop: '6px' }}>
                        <div style={{ width: `${s.masteryPercentage}%`, height: '100%', background: s.masteryPercentage >= 75 ? '#34d399' : s.masteryPercentage >= 40 ? '#60a5fa' : '#f87171', borderRadius: '1px', transition: 'width 0.3s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Chat pane split column */}
          <div className="chat-pane" style={{ width: sidebarOpen ? '38%' : '43%', animation: 'fadeIn 0.4s ease' }}>
            <div className="chat-header">
              <h1 style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button 
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: '14px' }}
                  >
                    ☰
                  </button>
                  <Sparkles size={14} style={{ color: '#a78bfa' }} /> 
                  <span style={{ fontSize: '13px' }}>{isProjectSession ? 'AI Project Critic' : 'Senior AI Mentor'}</span>
                </div>
                
                {/* Session Type Header Badge */}
                <span className={`session-badge ${
                  activeSession.sessionType === 'Concept Learning' ? 'concept' :
                  activeSession.sessionType === 'Sandbox Practice' ? 'sandbox' :
                  activeSession.sessionType === 'Project Defense' ? 'project' :
                  activeSession.sessionType === 'Interview Remediation' ? 'remediation' : 'career'
                }`}>
                  {activeSession.sessionType}
                </span>
              </h1>
              
              {/* Personality Selector Dropdown */}
              <div className="chat-header-actions">
                <select 
                  className="personality-select"
                  value={personality}
                  onChange={(e) => handlePersonalityChange(e.target.value)}
                >
                  <option value="The Coding Coach">Coding Coach</option>
                  <option value="The Tech Lead">Tech Lead</option>
                  <option value="The Professor">Professor</option>
                </select>
              </div>
            </div>

            {/* Mission Progress Checklist bar */}
            {activeSession.missionChecklist?.length > 0 && (
              <div className="mission-tracker-bar">
                <div style={{ fontSize: '10px', fontWeight: '800', color: '#a78bfa', whiteSpace: 'nowrap' }}>
                  🎯 MISSION DELTA ({calculateChecklistPercent()}%)
                </div>
                <div className="mission-checklist">
                  {activeSession.missionChecklist.map((item, idx) => (
                    <label 
                      key={idx} 
                      className={`mission-check-item ${item.completed ? 'completed' : ''}`}
                      style={{ cursor: 'pointer' }}
                    >
                      <input 
                        type="checkbox" 
                        checked={item.completed} 
                        onChange={() => handleToggleChecklistGoal(idx)}
                        style={{ accentColor: '#8b5cf6', marginRight: '3px' }}
                      />
                      {item.task}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="chat-messages">
              {loading ? (
                <div style={{ color: '#71717a', textAlign: 'center', marginTop: '40px', fontSize: '13px' }}>Syncing mentor nodes...</div>
              ) : (
                messages.map((m, idx) => (
                  <div key={m.id || idx} className={`message-bubble ${m.role}`}>
                    {m.role === 'assistant' ? parseMentorText(m.text) : <p style={{ margin: 0 }}>{m.text}</p>}
                    
                    {/* Renders dynamic evaluation status inside message if completed */}
                    {m.playgroundChallenge?.evaluation?.feedback && (
                      <div style={{ background: '#09090b', border: '1px solid #1c1c1f', padding: '10px', borderRadius: '6px', marginTop: '10px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 'bold', color: m.playgroundChallenge.evaluation.passed ? '#34d399' : '#f87171', display: 'block' }}>
                          {m.playgroundChallenge.evaluation.passed ? '✓ ASSERTIONS PASSED' : '✗ TEST COMPILER FAILURE'}
                        </span>
                        <p style={{ fontSize: '12px', color: '#a1a1aa', margin: '4px 0 0' }}>{m.playgroundChallenge.evaluation.feedback}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* AI Suggested Next Action Card (Preventing Dead-ends) */}
            {activeSession.suggestedNextStep?.title && (
              <div className="suggested-next-step-box" style={{ margin: '0 20px 10px' }}>
                <span className="next-step-badge">★ AI Suggested Action</span>
                <strong style={{ display: 'block', fontSize: '12.5px', color: '#fff', marginBottom: '3px' }}>{activeSession.suggestedNextStep.title}</strong>
                <p style={{ fontSize: '11.5px', color: '#a1a1aa', margin: '0 0 8px' }}>{activeSession.suggestedNextStep.actionText}</p>
                <button 
                  onClick={() => {
                    const target = activeSession.suggestedNextStep.targetTab || 'playground';
                    setActiveTab(target);
                  }} 
                  className="next-step-action"
                >
                  Launch Workspace <ArrowRight size={11} />
                </button>
              </div>
            )}

            <div className="chat-input-container">
              <form onSubmit={handleSendMessage} className="chat-input-wrapper">
                <input 
                  type="text" 
                  className="chat-input"
                  placeholder={isProjectSession ? "Answer the Critic's question..." : "Ask your Mentor about hooks, loops, performance..."}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                />
                <button type="submit" className="send-btn">
                  <Send size={14} />
                </button>
              </form>
            </div>
          </div>

          {/* Right tabbed workspace panel */}
          <div className="workspace-pane" style={{ width: sidebarOpen ? '62%' : '57%', animation: 'fadeIn 0.4s ease' }}>
            <div className="workspace-tabs">
              <button 
                className={`tab-btn ${activeTab === 'playground' ? 'active' : ''}`}
                onClick={() => setActiveTab('playground')}
              >
                <Code2 size={13} /> Sandbox Playground
              </button>
              <button 
                className={`tab-btn ${activeTab === 'project' ? 'active' : ''}`}
                onClick={() => setActiveTab('project')}
              >
                <FolderGit2 size={13} /> Project Defense Critic
              </button>
              <button 
                className={`tab-btn ${activeTab === 'coach' ? 'active' : ''}`}
                onClick={() => setActiveTab('coach')}
              >
                <Briefcase size={13} /> Recruiter roadmaps
              </button>
              <button 
                className={`tab-btn ${activeTab === 'memory' ? 'active' : ''}`}
                onClick={() => setActiveTab('memory')}
              >
                <Brain size={13} style={{ color: '#c084fc' }} /> Mentor Memory
              </button>
            </div>

            <div className="tab-content">
              {/* TAB 1: CODE PLAYGROUND */}
              {activeTab === 'playground' && (
                <div>
                  {/* Challenge description Issued by AI */}
                  {(() => {
                    const challengeMsg = messages.slice().reverse().find(m => m.playgroundChallenge && m.playgroundChallenge.title);
                    if (challengeMsg) {
                      const chal = challengeMsg.playgroundChallenge;
                      return (
                        <div className="playground-challenge-card">
                          <h4 className="challenge-title">🎯 ACTIVE CHALLENGE: {chal.title}</h4>
                          <div style={{ fontSize: '13px', color: '#d1d1d6', lineHeight: '1.5' }}>
                            {chal.instructions}
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div className="playground-challenge-card" style={{ background: 'rgba(139, 92, 246, 0.04)', borderColor: 'rgba(139, 92, 246, 0.12)' }}>
                        <h4 className="challenge-title" style={{ color: '#c084fc' }}>📝 Safe Sandboxed Editor</h4>
                        <p style={{ fontSize: '12.5px', color: '#a1a1aa', margin: 0 }}>You can freely write JavaScript scripts and compile them safely to test loops, variables, API mappings, and algorithm solutions.</p>
                      </div>
                    );
                  })()}

                  <div className="editor-wrapper">
                    <div className="editor-header">
                      <span>workspace_sandbox.js</span>
                      <span>ES6 JS Engine</span>
                    </div>
                    <textarea 
                      className="code-textarea"
                      value={playgroundCode}
                      onChange={e => setPlaygroundCode(e.target.value)}
                      placeholder="// Write JS here..."
                      spellCheck="false"
                    />
                    <div className="editor-footer">
                      <button onClick={handleResetPlayground} className="playground-btn reset" title="Reset boilerplate">
                        <RotateCcw size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Reset
                      </button>
                      <button onClick={handleRunCode} disabled={runningCode} className="playground-btn run" title="Compile and run console checks">
                        <Play size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> {runningCode ? 'Compiling...' : 'Run Code'}
                      </button>
                      {activeSession && (
                        <button onClick={handleSubmitCode} disabled={isSubmittingCode} className="playground-btn submit" title="Submit to Mentor for evaluation">
                          <CheckCircle size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> {isSubmittingCode ? 'Evaluating...' : 'Submit Challenge'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Console output stdout */}
                  {(consoleOutput || consoleError) && (
                    <div className="console-output">
                      <h4><Terminal size={11} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Output Stdout Terminal</h4>
                      {consoleError && (
                        <div style={{ color: '#f87171', whiteSpace: 'pre-wrap', marginBottom: '8px', fontWeight: 'bold' }}>
                          {consoleError}
                        </div>
                      )}
                      {consoleOutput && <div className="console-stdout">{consoleOutput}</div>}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: PROJECT DEFENSE MODE */}
              {activeTab === 'project' && (
                <div>
                  {projectContext ? (
                    <div>
                      <div style={{ padding: '16px', background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.15)', borderRadius: '12px', marginBottom: '20px' }}>
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#fff' }}>
                          🛡️ Ingested Project Defense: {projectContext.projectName}
                        </h3>
                        <p style={{ fontSize: '12.5px', color: '#a1a1aa', margin: 0 }}>This mode challenges your architectural choices contextually, checking for true authorship vs copied code. Answers are reviewed by a strict AI Lead Critic.</p>
                      </div>

                      {/* Architecture Blueprint Report */}
                      <div style={{ background: '#18181b', border: '1px solid #27272a', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
                        <strong style={{ fontSize: '13px', color: '#a78bfa', display: 'block', marginBottom: '12px' }}>📊 System Architecture Scanned Blueprint</strong>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '14px' }}>
                          <div style={{ background: '#09090b', padding: '10px', borderRadius: '6px', border: '1px solid #1c1c1f' }}>
                            <span style={{ fontSize: '10px', color: '#71717a', display: 'block' }}>State Engine</span>
                            <strong style={{ fontSize: '12.5px', color: '#fff' }}>{projectContext.architectureReport.stateManagement || 'None'}</strong>
                          </div>
                          <div style={{ background: '#09090b', padding: '10px', borderRadius: '6px', border: '1px solid #1c1c1f' }}>
                            <span style={{ fontSize: '10px', color: '#71717a', display: 'block' }}>Auth Provider</span>
                            <strong style={{ fontSize: '12.5px', color: '#fff' }}>{projectContext.architectureReport.auth || 'None'}</strong>
                          </div>
                          <div style={{ background: '#09090b', padding: '10px', borderRadius: '6px', border: '1px solid #1c1c1f' }}>
                            <span style={{ fontSize: '10px', color: '#71717a', display: 'block' }}>Database System</span>
                            <strong style={{ fontSize: '12.5px', color: '#fff' }}>{projectContext.architectureReport.database || 'None'}</strong>
                          </div>
                        </div>
                        <div style={{ fontSize: '12.5px', color: '#d1d1d6', background: '#09090b', padding: '12px', borderRadius: '6px', border: '1px solid #1c1c1f', lineHeight: '1.5' }}>
                          <strong>Summary Scope:</strong> {projectContext.architectureReport.summary}
                        </div>
                      </div>

                      {/* Active Q&A Defense Form */}
                      {activeSession.status === 'active' && (
                        <div style={{ background: '#18181b', border: '1px solid #27272a', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
                          <div style={{ display: 'flex', justifycontent: 'space-between', marginBottom: '10px' }}>
                            <strong style={{ fontSize: '13px', color: '#f4f4f5' }}>📝 Active Critic Defense Probing</strong>
                            <span style={{ fontSize: '11px', color: '#a78bfa', fontWeight: 'bold' }}>Question {projectContext.defenseProgress.currentQuestionIndex + 1} / 5</span>
                          </div>
                          <form onSubmit={handleSubmitDefenseAnswer}>
                            <textarea 
                              value={defenseAnswer}
                              onChange={e => setDefenseAnswer(e.target.value)}
                              className="ingestion-input"
                              style={{ minHeight: '90px', resize: 'vertical', fontSize: '13px' }}
                              placeholder="Provide a detailed technical defense of your file logic, frameworks decisions, or security choices..."
                              required
                            />
                            <button type="submit" disabled={isSubmittingDefense} className="send-btn" style={{ width: '100%', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                              {isSubmittingDefense ? 'Critic Evaluating...' : 'Submit Defense Explanation'} <ArrowRight size={14} />
                            </button>
                          </form>
                        </div>
                      )}

                      {/* Completed Readiness Scorecard */}
                      {activeSession.status === 'completed' && projectContext.learningReport && (
                        <div style={{ background: 'rgba(52, 211, 153, 0.03)', border: '1px solid rgba(52, 211, 153, 0.15)', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
                          <strong style={{ fontSize: '14px', color: '#34d399', display: 'block', marginBottom: '14px' }}>🏁 Project Defense Verdict & Portfolio Scores</strong>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                            <div style={{ background: '#09090b', border: '1px solid #1c1c1f', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                              <span style={{ fontSize: '10px', color: '#71717a', display: 'block' }}>Production Readiness Grade</span>
                              <strong style={{ fontSize: '20px', color: '#34d399' }}>{projectContext.learningReport.productionReadinessScore || 70}%</strong>
                            </div>
                            <div style={{ background: '#09090b', border: '1px solid #1c1c1f', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                              <span style={{ fontSize: '10px', color: '#71717a', display: 'block' }}>Portfolio Worthiness Score</span>
                              <strong style={{ fontSize: '20px', color: '#60a5fa' }}>{projectContext.learningReport.portfolioReadinessScore || 75}%</strong>
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12.5px', color: '#d1d1d6' }}>
                            <div>
                              <strong style={{ color: '#34d399', fontSize: '12px', display: 'block' }}>✓ Verified Strengths:</strong>
                              <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                                {projectContext.learningReport.strengths?.map((s, i) => <li key={i}>{s}</li>)}
                              </ul>
                            </div>
                            <div style={{ marginTop: '6px' }}>
                              <strong style={{ color: '#f87171', fontSize: '12px', display: 'block' }}>⚠ Critical Knowledge Gaps:</strong>
                              <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                                {projectContext.learningReport.weakAreas?.map((w, i) => <li key={i}>{w}</li>)}
                              </ul>
                            </div>
                            <div style={{ marginTop: '6px' }}>
                              <strong style={{ color: '#a78bfa', fontSize: '12px', display: 'block' }}>🛠 Refactoring & Suggested Code Enhancements:</strong>
                              <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                                {projectContext.learningReport.refactoringIdeas?.map((r, i) => <li key={i}>{r}</li>)}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Top 25 Project Specific Questions list */}
                      {projectContext.topQuestions && (
                        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '16px' }}>
                          <button 
                            onClick={() => setTop25QuestionsExpanded(!top25QuestionsExpanded)}
                            style={{ width: '100%', background: 'transparent', border: 'none', color: '#e4e4e7', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px', padding: 0 }}
                          >
                            <span>📝 Top 25 Custom Project Questions to Practice</span>
                            <span>{top25QuestionsExpanded ? '▼' : '▶'}</span>
                          </button>
                          {top25QuestionsExpanded && (
                            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                              {projectContext.topQuestions.map((q, idx) => (
                                <div key={idx} style={{ background: '#09090b', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', border: '1px solid #1c1c1f', color: '#d1d1d6' }}>
                                  <strong>Q{idx + 1}:</strong> {q}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="ingestion-form">
                      <h3>🔌 Ingest GitHub Repository / Code Folder</h3>
                      <p style={{ fontSize: '12.5px', color: '#a1a1aa', margin: '0 0 16px' }}>
                        Provide a public GitHub Repository URL to let our AI scan the file mappings, package configurations, state architecture, and state auth files to trigger the project defense simulation.
                      </p>
                      {ingestError && (
                        <div style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', padding: '10px', borderRadius: '6px', marginBottom: '12px', fontSize: '12px' }}>
                          {ingestError}
                        </div>
                      )}
                      <form onSubmit={handleIngestProject}>
                        <input 
                          type="text" 
                          className="ingestion-input"
                          placeholder="e.g. My E-commerce Webapp"
                          value={projectName}
                          onChange={e => setProjectName(e.target.value)}
                          required
                        />
                        <input 
                          type="text" 
                          className="ingestion-input"
                          placeholder="e.g. https://github.com/Azaz-Gori07/Road2Dev"
                          value={githubUrl}
                          onChange={e => setGithubUrl(e.target.value)}
                          required
                        />
                        <button type="submit" disabled={isIngestingProject} className="send-btn" style={{ width: '100%', padding: '10px' }}>
                          {isIngestingProject ? 'Scanning Architecture & Parsing Files...' : 'Ingest & Compile Report'}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: CAREER COACH */}
              {activeTab === 'coach' && (
                <div>
                  {loadingCoach ? (
                    <div style={{ color: '#71717a', textAlign: 'center', marginTop: '40px', fontSize: '13px' }}>Compiling Market Readiness roadmap profiles...</div>
                  ) : coachData ? (
                    <div>
                      <div style={{ padding: '16px', background: 'rgba(52, 211, 153, 0.05)', border: '1px solid rgba(52, 211, 153, 0.15)', borderRadius: '12px', marginBottom: '20px' }}>
                        <h3 style={{ margin: '0 0 6px 0', fontSize: '15px', color: '#fff' }}>
                          💼 Recruiter Job-Readiness Blueprint
                        </h3>
                        <p style={{ fontSize: '12.5px', color: '#a1a1aa', margin: 0 }}>This scorecard aggregates completed learning sessions and verified capabilities to guide your milestones.</p>
                      </div>

                      <div className="coach-summary-grid">
                        <div className="report-card">
                          <span>Market Readiness Tier</span>
                          <strong style={{ color: '#a78bfa' }}>{coachData.marketReadiness}</strong>
                        </div>
                        <div className="report-card">
                          <span>Percentile Rating</span>
                          <strong style={{ color: '#34d399' }}>{coachData.jobReadiness}</strong>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                        <div className="report-card">
                          <span>Matching Career Roles</span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                            {coachData.recommendedRoles?.map((r, i) => (
                              <span key={i} style={{ background: '#09090b', padding: '4px 8px', borderRadius: '4px', color: '#fff', fontSize: '11.5px', border: '1px solid #1c1c1f', display: 'inline-block' }}>{r}</span>
                            ))}
                          </div>
                        </div>
                        <div className="report-card">
                          <span>Estimated Compensation Guidance</span>
                          <strong style={{ display: 'block', marginTop: '6px', fontSize: '16px', color: '#34d399' }}>{coachData.salaryGuidance || '$60,000 - $80,000 / Year'}</strong>
                        </div>
                      </div>

                      {/* 90-Day Timeline Roadmaps */}
                      <div style={{ background: '#18181b', border: '1px solid #27272a', padding: '20px', borderRadius: '12px' }}>
                        <strong style={{ fontSize: '13px', color: '#e4e4e7', display: 'block' }}>📈 90-Day Milestone Priority Roadmap</strong>
                        <div className="timeline">
                          {coachData.learningRoadmap?.map((phase, idx) => {
                            let dotClass = 'immediate';
                            if (idx === 1) dotClass = 'confidence';
                            if (idx === 2) dotClass = 'advanced';
                            
                            return (
                              <div key={idx} className={`timeline-item ${dotClass}`}>
                                <div className="timeline-dot" />
                                <div className="timeline-title">{phase.phase}</div>
                                <div className="timeline-topics">
                                  {phase.topics?.map((topic, tIdx) => (
                                    <span key={tIdx} className="timeline-badge">{topic}</span>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: '#71717a', textAlign: 'center', marginTop: '40px', fontSize: '13px' }}>Select an active session to generate Career Coach Roadmap analytics.</div>
                  )}
                </div>
              )}

              {/* TAB 4: MENTOR LEARNING MEMORY DASHBOARD */}
              {activeTab === 'memory' && (
                <div>
                  <div style={{ padding: '16px', background: 'rgba(192, 132, 252, 0.05)', border: '1px solid rgba(192, 132, 252, 0.15)', borderRadius: '12px', marginBottom: '20px' }}>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '15px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Brain size={16} style={{ color: '#c084fc' }} /> Persistent Learning Memory Profile
                    </h3>
                    <p style={{ fontSize: '12.5px', color: '#a1a1aa', margin: 0 }}>This is the AI Mentor's long-term memory records of your strengths, active weaknesses gaps, and growths. Future chats automatically align to this memory.</p>
                  </div>

                  {/* Mastered Strengths Grid */}
                  <div style={{ background: '#18181b', border: '1px solid #27272a', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
                    <strong style={{ fontSize: '13px', color: '#34d399', display: 'block', marginBottom: '12px' }}>✓ Mastered Strengths Portfolio (Rating &ge; 75%)</strong>
                    {sessions.filter(s => s.masteryPercentage >= 75).length === 0 ? (
                      <div style={{ fontSize: '12px', color: '#71717a' }}>No topics fully mastered yet. Defend projects or pass sandboxed coding challenges to raise mastery!</div>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {sessions.filter(s => s.masteryPercentage >= 75).map(s => (
                          <span key={s._id} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                            🏆 {s.topic} ({s.masteryPercentage}% Mastered)
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Active Knowledge Gaps */}
                  <div style={{ background: '#18181b', border: '1px solid #27272a', padding: '20px', borderRadius: '12px' }}>
                    <strong style={{ fontSize: '13px', color: '#f87171', display: 'block', marginBottom: '12px' }}>⚠ Active Knowledge Gaps (Awaiting Fixes)</strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {memoryGaps.map((gap, i) => (
                        <div 
                          key={i} 
                          onClick={() => handleCreateGuidedSession(gap, 'Interview Remediation')}
                          style={{ 
                            background: 'rgba(239, 68, 68, 0.05)', 
                            color: '#f87171', 
                            border: '1px solid rgba(239, 68, 68, 0.15)', 
                            padding: '6px 12px', 
                            borderRadius: '8px', 
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s'
                          }}
                          title="Click to launch direct remediation mission"
                        >
                          <span>⚡ {gap}</span>
                          <span style={{ fontSize: '9px', background: 'rgba(239, 68, 68, 0.1)', padding: '2px 4px', borderRadius: '3px' }}>Fix Topic</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* GUIDED SELECTION PICKER MODALS */}
      {guidedModalType === 'learn' && (
        <div className="guided-modal-overlay" onClick={() => setGuidedModalType(null)}>
          <div className="guided-modal" onClick={e => e.stopPropagation()}>
            <strong style={{ fontSize: '13px', color: '#a78bfa', display: 'block', marginBottom: '6px' }}>📖 SELECT A CONCEPT TOPIC</strong>
            <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 16px' }}>Pick a fundamental, intermediate, or advanced module to spawn your AI learning space.</p>
            <div className="guided-options-grid">
              {['JavaScript Closures', 'React useEffect Hook', 'Node.js Event Loop', 'MongoDB Aggregations', 'Docker Containers', 'AWS S3 & EC2'].map(topic => (
                <button 
                  key={topic} 
                  className="guided-opt-btn"
                  onClick={() => handleCreateGuidedSession(topic, 'Concept Learning')}
                >
                  {topic}
                </button>
              ))}
            </div>
            <div style={{ marginTop: '16px', borderTop: '1px solid #1c1c1f', paddingTop: '12px' }}>
              <input 
                type="text" 
                className="ingestion-input"
                style={{ marginBottom: '8px', fontSize: '12px' }}
                placeholder="Or type a custom topic..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    handleCreateGuidedSession(e.target.value.trim(), 'Concept Learning');
                  }
                }}
              />
              <span style={{ fontSize: '10px', color: '#71717a' }}>Press Enter to start custom topic.</span>
            </div>
          </div>
        </div>
      )}

      {guidedModalType === 'weakness' && (
        <div className="guided-modal-overlay" onClick={() => setGuidedModalType(null)}>
          <div className="guided-modal" onClick={e => e.stopPropagation()}>
            <strong style={{ fontSize: '13px', color: '#f87171', display: 'block', marginBottom: '6px' }}>⚡ SELECT A WEAKNESS MISSION</strong>
            <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 16px' }}>Spawn a direct targeted remediation mission to eliminate unassessed gap competency.</p>
            <div className="guided-options-grid" style={{ gridTemplateColumns: '1fr' }}>
              {memoryGaps.length === 0 ? (
                <div style={{ fontSize: '12px', color: '#71717a', padding: '10px' }}>No weak skills mapped from history. Spawning standard closures mission!</div>
              ) : (
                memoryGaps.map(gap => (
                  <button 
                    key={gap} 
                    className="guided-opt-btn"
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    onClick={() => handleCreateGuidedSession(gap, 'Interview Remediation')}
                  >
                    <span>⚡ Today's Mission: Master {gap}</span>
                    <ArrowRight size={12} />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default LearningLab;
