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
  AlertTriangle,
  Shield
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import useZenuxAuth from '../hooks/useZenuxAuth';
import './LearningLab.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5500/api';

/* â”€â”€ CIRCLE PROGRESS â”€â”€ */
function CircleProgress({ percent }) {
  const r = 38, circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width="96" height="96" viewBox="0 0 96 96">
      <circle cx="48" cy="48" r={r} fill="none" stroke="var(--border)" strokeWidth="10"/>
      <circle cx="48" cy="48" r={r} fill="none"
        stroke="url(#cg)" strokeWidth="10"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 48 48)"
      />
      <defs>
        <linearGradient id="cg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--accent-cyan)"/>
          <stop offset="100%" stopColor="var(--secondary)"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

/* â”€â”€ ROBOT SVG â”€â”€ */
function RobotSVG() {
  return (
    <svg viewBox="0 0 320 260" fill="none" xmlns="http://www.w3.org/2000/svg" className="r2d-robot-svg">
      {/* outer glow ring */}
      <ellipse cx="160" cy="220" rx="120" ry="22" fill="url(#glow-ring)" opacity="0.7"/>
      {/* glow ring gradient */}
      <defs>
        <radialGradient id="glow-ring" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--secondary)" stopOpacity="0.8"/>
          <stop offset="100%" stopColor="var(--secondary)" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="body-grad" cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor="var(--secondary-shadow)"/>
          <stop offset="100%" stopColor="var(--background)"/>
        </radialGradient>
        <radialGradient id="head-grad" cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor="var(--secondary)"/>
          <stop offset="100%" stopColor="var(--surface-alt)"/>
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="softshadow">
          <feDropShadow dx="0" dy="8" stdDeviation="16" floodColor="var(--secondary)" floodOpacity="0.5"/>
        </filter>
      </defs>

      {/* body */}
      <rect x="90" y="140" width="140" height="90" rx="20" fill="url(#body-grad)" filter="url(#softshadow)"/>
      <rect x="90" y="140" width="140" height="90" rx="20" stroke="var(--secondary-shadow)" strokeWidth="1.5"/>

      {/* chest screen */}
      <rect x="115" y="158" width="90" height="52" rx="8" fill="var(--background)"/>
      <rect x="115" y="158" width="90" height="52" rx="8" stroke="var(--border)" strokeWidth="1"/>
      {/* screen code lines */}
      <line x1="124" y1="172" x2="180" y2="172" stroke="var(--accent-cyan)" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
      <line x1="124" y1="181" x2="195" y2="181" stroke="var(--secondary)" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
      <line x1="124" y1="190" x2="165" y2="190" stroke="var(--accent-cyan)" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
      <line x1="124" y1="199" x2="188" y2="199" stroke="var(--secondary-hover)" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>

      {/* arms */}
      <rect x="50" y="148" width="36" height="16" rx="8" fill="var(--surface-alt)" stroke="var(--border)" strokeWidth="1.5"/>
      <circle cx="50" cy="156" r="8" fill="var(--surface-alt)" stroke="var(--border)" strokeWidth="1.5"/>
      <rect x="234" y="148" width="36" height="16" rx="8" fill="var(--surface-alt)" stroke="var(--border)" strokeWidth="1.5"/>
      <circle cx="270" cy="156" r="8" fill="var(--surface-alt)" stroke="var(--border)" strokeWidth="1.5"/>

      {/* legs */}
      <rect x="118" y="226" width="28" height="22" rx="8" fill="var(--surface-alt)" stroke="var(--border)" strokeWidth="1.5"/>
      <rect x="174" y="226" width="28" height="22" rx="8" fill="var(--surface-alt)" stroke="var(--border)" strokeWidth="1.5"/>

      {/* head */}
      <rect x="95" y="58" width="130" height="90" rx="22" fill="url(#head-grad)" filter="url(#softshadow)"/>
      <rect x="95" y="58" width="130" height="90" rx="22" stroke="var(--secondary-shadow)" strokeWidth="1.5"/>

      {/* antenna */}
      <line x1="160" y1="58" x2="160" y2="36" stroke="var(--border)" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="160" cy="30" r="7" fill="var(--secondary)" filter="url(#glow)"/>
      <circle cx="160" cy="30" r="4" fill="var(--secondary-hover)"/>

      {/* eyes */}
      <rect x="117" y="86" width="34" height="22" rx="8" fill="var(--background)"/>
      <circle cx="134" cy="97" r="8" fill="var(--accent-cyan)" filter="url(#glow)">
        <animate attributeName="opacity" values="1;0.6;1" dur="3s" repeatCount="indefinite"/>
      </circle>
      <circle cx="134" cy="97" r="4" fill="#fff" opacity="0.9"/>
      <rect x="169" y="86" width="34" height="22" rx="8" fill="var(--background)"/>
      <circle cx="186" cy="97" r="8" fill="var(--accent-cyan)" filter="url(#glow)">
        <animate attributeName="opacity" values="1;0.6;1" dur="3s" repeatCount="indefinite"/>
      </circle>
      <circle cx="186" cy="97" r="4" fill="#fff" opacity="0.9"/>

      {/* mouth / smile */}
      <path d="M140 124 Q160 136 180 124" stroke="var(--accent-cyan)" strokeWidth="2.5" strokeLinecap="round" fill="none" filter="url(#glow)"/>

      {/* ear bolts */}
      <circle cx="95"  cy="103" r="6" fill="var(--surface-alt)" stroke="var(--border)" strokeWidth="1.5"/>
      <circle cx="225" cy="103" r="6" fill="var(--surface-alt)" stroke="var(--border)" strokeWidth="1.5"/>

      {/* floating sparkles */}
      <circle cx="60"  cy="70" r="3" fill="var(--secondary-hover)" opacity="0.6">
        <animate attributeName="cy" values="70;60;70" dur="2.5s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.6;1;0.6" dur="2.5s" repeatCount="indefinite"/>
      </circle>
      <circle cx="268" cy="90" r="2" fill="var(--accent-cyan)" opacity="0.6">
        <animate attributeName="cy" values="90;80;90" dur="3s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite"/>
      </circle>
      <circle cx="80" cy="130" r="2" fill="var(--secondary)" opacity="0.5">
        <animate attributeName="cy" values="130;120;130" dur="3.5s" repeatCount="indefinite"/>
      </circle>

      {/* code badge top-right */}
      <rect x="230" y="42" width="52" height="26" rx="8" fill="var(--background)" stroke="var(--border)" strokeWidth="1"/>
      <text x="256" y="59" textAnchor="middle" fill="var(--accent-cyan)" fontSize="12" fontFamily="monospace">&lt;/&gt;</text>

      {/* small disc bottom-left */}
      <rect x="30" y="190" width="30" height="18" rx="5" fill="var(--background)" stroke="var(--border)" strokeWidth="1"/>
      <rect x="35" y="196" width="20" height="2" rx="1" fill="var(--secondary-hover)" opacity="0.7"/>
      <rect x="35" y="201" width="14" height="2" rx="1" fill="var(--secondary)" opacity="0.7"/>
    </svg>
  );
}

if (typeof window !== 'undefined' && !window.__mentorMetrics) {
  window.__mentorMetrics = {
    sessionCreates: 0,
    coachRequests: 0,
    chatRequests: 0,
    codeEvaluations: 0,
    projectIngests: 0,
    projectDefenses: 0
  };
}

function LearningLab() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const customAuth = useAuth();
  const zenuxAuth = useZenuxAuth();
  const authUser = customAuth.user || zenuxAuth.user;
  
  // State
  const [sessions, setSessions] = useState([]);
  const [interviewSessions, setInterviewSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [activeTab, setActiveTab] = useState('playground'); // playground, project, coach, memory
  const [selectedMode, setSelectedMode] = useState('Intermediate');
  const [personality, setPersonality] = useState('The Coding Coach');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen] = useState(true);
  const [mobilePane, setMobilePane] = useState('chat');
  
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

  useEffect(() => {
    if (activeSession?._id) {
      setMobilePane('chat');
    }
  }, [activeSession?._id]);

  // Request Tracking & Abort Refs
  const sessionCreationInFlight = useRef(false);
  const careerCoachInFlight = useRef(false);
  const chatInFlight = useRef(false);
  const codeEvalInFlight = useRef(false);
  const ingestInFlight = useRef(false);
  const defenseInFlight = useRef(false);
  const activeRequests = useRef(new Map());

  // Component Unmount Cleanup Hook
  useEffect(() => {
    return () => {
      activeRequests.current.forEach(controller => controller.abort());
      activeRequests.current.clear();
    };
  }, []);

  const makeTraceableRequest = async (name, endpoint, options = {}, triggerSource) => {
    // Abort only the same request type to prevent overlap
    if (activeRequests.current.has(name)) {
      try {
        activeRequests.current.get(name).abort();
      } catch (err) {}
      activeRequests.current.delete(name);
    }

    const controller = new AbortController();
    activeRequests.current.set(name, controller);

    console.log(
      '[AI REQUEST]',
      endpoint,
      new Date().toISOString(),
      triggerSource
    );

    try {
      const res = await fetch(endpoint, {
        ...options,
        signal: controller.signal
      });
      return res;
    } finally {
      if (activeRequests.current.get(name) === controller) {
        activeRequests.current.delete(name);
      }
    }
  };

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

  const fetchInterviewSessions = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/interview-sessions`, {
        headers: getHeaders()
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.data)) {
        setInterviewSessions(data.data);
        return data.data;
      }
    } catch (e) {
      console.error('Error fetching interview sessions:', e);
    }
    setInterviewSessions([]);
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
        if (sessionCreationInFlight.current) return;
        sessionCreationInFlight.current = true;
        setLoading(true);
        try {
          if (window.__mentorMetrics) {
            window.__mentorMetrics.sessionCreates += 1;
          }
          const res = await makeTraceableRequest(
            'session',
            `${API_BASE}/learning-lab/session`,
            {
              method: 'POST',
              headers: getHeaders(),
              body: JSON.stringify({ 
                topic: preloadTopic, 
                mode: 'Intermediate',
                sessionType: remediate ? 'Interview Remediation' : 'Concept Learning',
                personality: 'The Coding Coach'
              })
            },
            'mount_preload_topic'
          );
          const data = await res.json();
          if (data.success) {
            // Immediately clean URL parameters to prevent repeated mount loops and creation loops on exit
            navigate('/learning-lab', { replace: true });
            await fetchSessions();
            fetchSessionDetails(data.data._id);
          }
        } catch (e) {
          if (e.name !== 'AbortError') {
            console.error('Preload creation failed:', e);
          }
        } finally {
          sessionCreationInFlight.current = false;
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
  const loadCareerCoach = async (triggerSource = 'direct_load') => {
    if (careerCoachInFlight.current) return;
    careerCoachInFlight.current = true;
    setLoadingCoach(true);
    try {
      if (window.__mentorMetrics) {
        window.__mentorMetrics.coachRequests += 1;
      }
      const res = await makeTraceableRequest(
        'coach',
        `${API_BASE}/learning-lab/career-coach`,
        {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ topic: activeSession?.topic || 'Full Stack Development' })
        },
        triggerSource
      );
      const data = await res.json();
      if (data.success) {
        setCoachData(data.data);
        setMemoryGaps(Array.isArray(data.data.weakSkills) ? data.data.weakSkills : []);
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.error('Failed to load career coach:', e);
      }
    } finally {
      careerCoachInFlight.current = false;
      setLoadingCoach(false);
    }
  };

  useEffect(() => {
    if ((activeTab === 'coach' || activeTab === 'memory') && activeSession) {
      loadCareerCoach('tab_coach_or_memory');
    }
  }, [activeTab, activeSession]);

  // Toggle personality profile
  const handlePersonalityChange = async (newPersonality) => {
    if (!activeSession || chatInFlight.current) return;
    chatInFlight.current = true;
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
        
        if (window.__mentorMetrics) {
          window.__mentorMetrics.chatRequests += 1;
        }

        // Auto-retrigger explanation in new tone
        const resChat = await makeTraceableRequest(
          'chat',
          `${API_BASE}/learning-lab/session/${activeSession._id}/chat`,
          {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ text: `System personality switched to ${newPersonality}. Please re-explain our current topic in your new style!` })
          },
          'personality_change_reexplain'
        );
        const dataChat = await resChat.json();
        if (dataChat.success) {
          setActiveSession(dataChat.data);
          setMessages(dataChat.data.messages || []);
        }
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.error('Personality swap failed:', e);
      }
    } finally {
      chatInFlight.current = false;
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
    if (!inputText.trim() || !activeSession || chatInFlight.current) return;
    chatInFlight.current = true;

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
      if (window.__mentorMetrics) {
        window.__mentorMetrics.chatRequests += 1;
      }
      const res = await makeTraceableRequest(
        'chat',
        `${API_BASE}/learning-lab/session/${activeSession._id}/chat`,
        {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ text: userText })
        },
        'user_chat_message'
      );
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
      if (err.name !== 'AbortError') {
        console.error('Failed to send message:', err);
      }
    } finally {
      chatInFlight.current = false;
    }
  };

  // Run Sandbox Code
  const handleRunCode = async () => {
    if (!playgroundCode.trim() || runningCode) return;
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
    if (!playgroundCode.trim() || !activeSession || codeEvalInFlight.current) return;
    codeEvalInFlight.current = true;
    setIsSubmittingCode(true);
    setConsoleOutput('Analyzing logic efficiency & criteria assertions...');
    setConsoleError('');

    // Find active challenge title
    const challengeMsg = messages.slice().reverse().find(m => m.playgroundChallenge?.title);
    const challengeTitle = challengeMsg ? challengeMsg.playgroundChallenge.title : activeSession.topic;

    try {
      if (window.__mentorMetrics) {
        window.__mentorMetrics.codeEvaluations += 1;
      }
      const res = await makeTraceableRequest(
        'submit_code',
        `${API_BASE}/learning-lab/session/${activeSession._id}/playground/submit`,
        {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ code: playgroundCode, challengeTitle })
        },
        'sandbox_code_submit'
      );
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
      if (e.name !== 'AbortError') {
        setConsoleError('Review evaluation engine failed.');
      }
    } finally {
      setIsSubmittingCode(false);
      codeEvalInFlight.current = false;
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
    if (isIngestingProject || ingestInFlight.current) return;
    ingestInFlight.current = true;
    setIsIngestingProject(true);
    setIngestError('');
    try {
      if (window.__mentorMetrics) {
        window.__mentorMetrics.projectIngests += 1;
      }
      const res = await makeTraceableRequest(
        'ingest_project',
        `${API_BASE}/learning-lab/project/ingest`,
        {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            projectName,
            githubUrl
          })
        },
        'project_ingest'
      );
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
      if (err.name !== 'AbortError') {
        setIngestError('Repository clone & compress service timeout.');
      }
    } finally {
      setIsIngestingProject(false);
      ingestInFlight.current = false;
    }
  };

  // Submit Answer to Project Defense Question
  const handleSubmitDefenseAnswer = async (e) => {
    e.preventDefault();
    if (!defenseAnswer.trim() || !activeSession || isSubmittingDefense || defenseInFlight.current) return;
    defenseInFlight.current = true;
    setIsSubmittingDefense(true);

    const answer = defenseAnswer;
    setDefenseAnswer('');

    try {
      if (window.__mentorMetrics) {
        window.__mentorMetrics.projectDefenses += 1;
      }
      const res = await makeTraceableRequest(
        'project_defense',
        `${API_BASE}/learning-lab/session/${activeSession._id}/project/defense`,
        {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ answer })
        },
        'project_defense_submit'
      );
      const data = await res.json();
      if (data.success) {
        setActiveSession(data.data);
        setMessages(data.data.messages || []);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Defense submission failed:', err);
      }
    } finally {
      setIsSubmittingDefense(false);
      defenseInFlight.current = false;
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
    if (sessionCreationInFlight.current) return;
    sessionCreationInFlight.current = true;
    setGuidedModalType(null);
    setLoading(true);
    try {
      if (window.__mentorMetrics) {
        window.__mentorMetrics.sessionCreates += 1;
      }
      const res = await makeTraceableRequest(
        'session',
        `${API_BASE}/learning-lab/session`,
        {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ 
            topic, 
            mode: 'Intermediate',
            sessionType: sessionType || 'Concept Learning',
            personality: 'The Coding Coach'
          })
        },
        'guided_onboarding_modal'
      );
      const data = await res.json();
      if (data.success) {
        // Immediately clean URL parameters to prevent repeated mount loops
        navigate('/learning-lab', { replace: true });
        await fetchSessions();
        fetchSessionDetails(data.data._id);
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.error('Failed to create session:', e);
      }
    } finally {
      sessionCreationInFlight.current = false;
      setLoading(false);
    }
  };

  // Exit active workspace session to Goals Portal
  const handleExitToGoalsPortal = () => {
    setActiveSession(null);
    setMessages([]);
    setShowHistoryResume(false);
    // Sanitize any remaining preload query parameters in the URL
    navigate('/learning-lab', { replace: true });
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
    fetchInterviewSessions();
  }, [fetchSessions, fetchInterviewSessions]);

  const overallMastery = sessions.length > 0 
    ? Math.round(sessions.reduce((acc, s) => acc + (s.masteryPercentage || 0), 0) / sessions.length) 
    : 0;

  const completedInterviewCount = interviewSessions.filter(s => s.status === 'completed').length;
  const learningPathItems = sessions.slice(0, 4).map((session) => ({
    id: session._id,
    title: session.topic,
    status: session.status === 'completed' ? 'Completed' : 'Active',
    mastery: Number(session.masteryPercentage) || 0
  }));
  const focusTopic = memoryGaps[0] || sessions.find(s => (s.masteryPercentage || 0) < 50)?.topic || null;
  const focusSession = focusTopic ? sessions.find(s => s.topic === focusTopic) : null;
  const focusChecklist = focusSession?.missionChecklist || [];
  const focusCompletedTasks = focusChecklist.filter(item => item.completed).length;
  const focusTotalTasks = focusChecklist.length;
  const focusPercent = focusTotalTasks ? Math.round((focusCompletedTasks / focusTotalTasks) * 100) : 0;
  const recommendationTopic = coachData?.learningRoadmap
    ?.flatMap(phase => Array.isArray(phase.topics) ? phase.topics : [])
    ?.find(Boolean) || null;
  const recentActivities = [
    ...sessions.map(session => ({
      id: `learning-${session._id}`,
      type: 'learning',
      text: `${session.status === 'completed' ? 'Completed' : 'Updated'}: ${session.topic}`,
      time: session.updatedAt || session.createdAt,
      color: session.status === 'completed' ? 'var(--success)' : 'var(--secondary)'
    })),
    ...interviewSessions.map(session => ({
      id: `interview-${session._id || session.id}`,
      type: 'interview',
      text: `${session.status === 'completed' ? 'Completed' : 'Started'} interview: ${session.title || session.field || 'Interview Session'}`,
      time: session.updatedAt || session.createdAt,
      color: session.status === 'completed' ? 'var(--success)' : 'var(--info)'
    }))
  ]
    .filter(activity => activity.time)
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 3);

  const formatActivityTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <section className="learning-lab-container">
      {/* 
        JOURNEY-FIRST PORTAL (BEFORE GOAL SELECTION)
        If no active session is selected, we render the full screen onboarding Goals Portal.
        Hides all split panels, sidebars, playgrounds, recruiter roadmaps, and tools.
      */}
      {!activeSession ? (
        <div className="r2d-root">
          
          {/* â•â• TOP BAR â•â• */}
          <header className="r2d-topbar">
            <div className="r2d-topbar-title-wrap">
              <Sparkles size={18} className="r2d-topbar-logo" aria-hidden />
              <span className="r2d-topbar-title">AI Mentor Lab</span>
            </div>
            <div className="r2d-search-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="r2d-search-icon" aria-hidden>
                <circle cx="11" cy="11" r="7" stroke="var(--text-muted)" strokeWidth="2"/>
                <path d="M16.5 16.5L21 21" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input
                type="search"
                className="r2d-search-input"
                placeholder="Search sessions, topics..."
                aria-label="Search learning lab"
              />
            </div>
            <div className="r2d-topbar-actions">
              <div className="r2d-streak" title="5 day streak">
                <span className="r2d-streak-emoji" aria-hidden>🔥</span>
                <span className="r2d-streak-label">5 Day Streak</span>
              </div>
              <div className="r2d-topbar-tools">
                <button type="button" className="r2d-bell-btn" aria-label="Notifications">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M6 10a6 6 0 0 1 12 0v4l2 2H4l2-2v-4z" stroke="var(--text-muted)" strokeWidth="2" strokeLinejoin="round"/>
                    <path d="M10 18a2 2 0 0 0 4 0" stroke="var(--text-muted)" strokeWidth="2"/>
                    <circle cx="18" cy="6" r="3" fill="var(--error)"/>
                  </svg>
                </button>
                <button
                  type="button"
                  className="r2d-topbar-avatar"
                  onClick={() => navigate('/profile')}
                  aria-label="Open profile"
                >
                  <svg viewBox="0 0 36 36" className="r2d-avatar-svg">
                    <circle cx="18" cy="18" r="18" fill="url(#r2d-av-gradient)"/>
                    <defs>
                      <linearGradient id="r2d-av-gradient" x1="0" y1="0" x2="36" y2="36">
                        <stop stopColor="var(--secondary)"/>
                        <stop offset="1" stopColor="var(--primary)"/>
                      </linearGradient>
                    </defs>
                    <circle cx="18" cy="14" r="6" fill="#fff" opacity="0.9"/>
                    <ellipse cx="18" cy="28" rx="10" ry="7" fill="#fff" opacity="0.9"/>
                  </svg>
                </button>
              </div>
            </div>
          </header>

          {!showHistoryResume ? (
            /* Curated Goals Portal View */
            <div className="r2d-body">
              
              {/* â”€â”€ LEFT / CENTER â”€â”€ */}
              <main className="r2d-main">
                
                {/* HERO */}
                <section className="r2d-hero">
                  <div className="r2d-hero-text">
                    <p className="r2d-welcome">Welcome back, {authUser?.name || 'Developer'}! ðŸ‘‹</p>
                    <h1 className="r2d-headline">
                      Your AI Mentor is<br/>
                      <span className="r2d-highlight">here to level you up.</span>
                    </h1>
                    <p className="r2d-subtext">Learn. Practice. Build. Get Hired.</p>
                  </div>
                  <div className="r2d-hero-robot">
                    <RobotSVG />
                  </div>
                </section>

                {/* SLEEK MATTE SCORECARD PANEL */}
                <section className="r2d-scorecard-panel">
                  <div className="r2d-scorecard-cell">
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>Mastered Skills</span>
                    <strong style={{ fontSize: '18px', color: '#34d399' }}>{sessions.filter(s => s.masteryPercentage >= 75).length} Mapped</strong>
                  </div>
                  <div className="r2d-scorecard-cell">
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>Interviews Done</span>
                    <strong style={{ fontSize: '18px', color: '#60a5fa' }}>
                      {completedInterviewCount} Completed
                    </strong>
                  </div>

                  <div className="r2d-scorecard-cell">
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>Code Defenses</span>
                    <strong style={{ fontSize: '18px', color: '#a78bfa' }}>{sessions.filter(s => s.topic.startsWith('Project Defense:')).length} Scanned</strong>
                  </div>
                  <div className="r2d-scorecard-cell r2d-scorecard-cell--last">
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>Current Focus</span>
                    <strong style={{ fontSize: '13px', color: 'var(--secondary-hover)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '4px' }}>{focusTopic || 'No focus yet'}</strong>
                  </div>
                </section>

                {/* 5-STAGE SEQUENTIAL JOURNEY ROADMAP */}
                <h2 className="r2d-section-heading">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--secondary)" className="r2d-sparkle">
                    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
                  </svg>
                  Developer Readiness Journey
                </h2>

                <div className="stages-timeline-roadmap">
                  {/* Stage 1: Technical Interview */}
                  <div className="stage-row stage-row--blue">
                    <div className="stage-num stage-num--blue">01</div>
                    <div className="stage-row-body">
                      <strong style={{ color: '#fff', fontSize: '14px', display: 'block' }}>Technical Interview Assessment</strong>
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Verify your core technical capabilities and identify structural knowledge gaps.</span>
                    </div>
                    <button type="button" className="r2d-resume-btn stage-row-cta" onClick={() => navigate('/interview-prep')}>
                      Start Assessment
                    </button>
                  </div>

                  {/* Stage 2: Guided Concept Learning */}
                  <div className="stage-row stage-row--purple">
                    <div className="stage-num stage-num--purple">02</div>
                    <div className="stage-row-body">
                      <strong style={{ color: '#fff', fontSize: '14px', display: 'block' }}>Guided Concept Learning</strong>
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Deep dive into Closures, Promises, or custom logic with our analogy-first AI Coach.</span>
                    </div>
                    <button type="button" className="r2d-resume-btn stage-row-cta stage-row-cta--purple" onClick={() => setGuidedModalType('learn')}>
                      Start Learning
                    </button>
                  </div>

                  {/* Stage 3: Sandbox Practice */}
                  <div className="stage-row stage-row--green">
                    <div className="stage-num stage-num--green">03</div>
                    <div className="stage-row-body">
                      <strong style={{ color: '#fff', fontSize: '14px', display: 'block' }}>Sandbox Practice Workspace</strong>
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Write code, debug syntax, and pass validation challenges in our secure ES6 compiler.</span>
                    </div>
                    <button type="button" className="r2d-resume-btn stage-row-cta stage-row-cta--green" onClick={() => handleCreateGuidedSession('Vanilla JS Sandbox Compiler', 'Sandbox Practice')}>
                      Open Sandbox
                    </button>
                  </div>

                  {/* Stage 4: Project Defense */}
                  <div className="stage-row stage-row--rose">
                    <div className="stage-num stage-num--rose">04</div>
                    <div className="stage-row-body">
                      <strong style={{ color: '#fff', fontSize: '14px', display: 'block' }}>Automated Project Defense</strong>
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Ingest GitHub repo, scan files architecture blueprint, study top 25 questions, and defend choices before AI Critic.</span>
                    </div>
                    <button type="button" className="r2d-resume-btn stage-row-cta stage-row-cta--rose" onClick={() => handleCreateGuidedSession('Ingest Repository Blueprint', 'Project Defense')}>
                      Defend Project
                    </button>
                  </div>

                  {/* Stage 5: Career Operating System (Crowning OS) */}
                  <div className="stage-row stage-row--career">
                    <div className="stage-num stage-num--cyan">05</div>
                    <div className="stage-row-body">
                      <div className="stage-row-title-row">
                        <strong style={{ color: '#fff', fontSize: '14px' }}>Career Operating System</strong>
                        <span className="stage-final-badge">FINAL STAGE</span>
                      </div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Monitor live job readiness percentages, study priority roadmap timelines, and launch targeted remediations.</span>
                    </div>
                    <button type="button" className="r2d-resume-btn stage-row-cta stage-row-cta--cyan" onClick={() => handleCreateGuidedSession('Career Roadmaps & Interview Guidance', 'Career Coach')}>
                      Open Career OS
                    </button>
                  </div>
                </div>

                {/* MY LEARNING SESSIONS HUB */}
                <div className="r2d-continue-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M4 19V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12" stroke="var(--secondary)" strokeWidth="2"/>
                    <path d="M4 19h16" stroke="var(--secondary)" strokeWidth="2"/>
                  </svg>
                  <span>My Active Learning Workspaces</span>
                </div>
                
                {sessions.length === 0 ? (
                  <div className="r2d-empty-state">
                    No learning workspaces yet. Start a session to create user-owned progress.
                  </div>
                ) : (
                  <div className="r2d-continue-row">
                    {sessions.slice(0, 2).map((s, index) => {
                      const isProj = s.topic.startsWith('Project Defense:');
                      const isCoach = s.sessionType === 'Career Coach';
                      return (
                        <div className="r2d-continue-card" key={s._id}>
                          <div className={`r2d-continue-file-icon ${isProj ? 'r2d-file-teal' : ''}`}>
                            {isProj ? (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <rect x="3" y="3" width="18" height="18" rx="3" stroke="var(--accent-cyan)" strokeWidth="2"/>
                                <path d="M8 12h8M8 8h8M8 16h4" stroke="var(--accent-cyan)" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                            ) : (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="var(--secondary)" strokeWidth="2" strokeLinejoin="round"/>
                                <path d="M14 2v6h6" stroke="var(--secondary)" strokeWidth="2"/>
                              </svg>
                            )}
                          </div>
                          <div className="r2d-continue-info">
                            <div className="r2d-continue-name">{isProj ? 'ðŸ›¡ï¸ ' + s.topic.replace('Project Defense: ', '') : isCoach ? 'ðŸ’¼ Career Operating System' : 'ðŸ“– ' + s.topic}</div>
                            <div className="r2d-continue-sub">Focus: {s.sessionType} â€¢ {s.masteryPercentage}% Mastery</div>
                          </div>
                          <button 
                            className={index === 0 ? "r2d-resume-btn" : "r2d-continue-btn-green"} 
                            onClick={() => fetchSessionDetails(s._id)}
                          >
                            {index === 0 ? 'Resume Session' : 'Continue'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* History Session Link */}
                <div style={{ marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '16px', width: '100%', textAlign: 'left' }}>
                  <button 
                    onClick={() => {
                      fetchSessions();
                      setShowHistoryResume(true);
                    }}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    Or, resume an active Labs workspace <span style={{ color: 'var(--secondary)', textDecoration: 'underline' }}>[View History Sessions]</span>
                  </button>
                </div>

              </main>

              {/* â”€â”€ RIGHT SIDEBAR â”€â”€ */}
              <aside className="r2d-right">
                
                {/* DYNAMIC VISUAL LEARNING PATHS (ROADMAPS) */}
                <div className="r2d-panel" style={{ textAlign: 'left' }}>
                  <div className="r2d-panel-heading">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round">
                      <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                      <polyline points="2 17 12 22 22 17"/>
                      <polyline points="2 12 12 17 22 12"/>
                    </svg>
                    Learning Path Map
                  </div>
                  
                  <div style={{ marginTop: '12px', borderLeft: '2px solid var(--border)', paddingLeft: '12px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {learningPathItems.length === 0 ? (
                      <div className="r2d-empty-state">
                        No learning path yet. Complete or update learning sessions to build this map.
                      </div>
                    ) : (
                      learningPathItems.map(item => (
                        <div style={{ position: 'relative' }} key={item.id}>
                          <span style={{ color: item.status === 'Completed' ? '#34d399' : '#f59e0b', fontSize: '12px', fontWeight: 'bold' }}>
                            {item.title}
                          </span>
                          <p style={{ color: 'var(--text-muted)', fontSize: '11px', margin: '2px 0 0' }}>
                            {item.status} - {item.mastery}% Mastery
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* TODAY'S FOCUS */}
                <div className="r2d-panel">
                  <div className="r2d-panel-heading">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="var(--warning)" strokeWidth="2"/>
                      <circle cx="12" cy="12" r="4"  stroke="var(--warning)" strokeWidth="2"/>
                      <line x1="12" y1="2"  x2="12" y2="5"  stroke="var(--warning)" strokeWidth="2"/>
                      <line x1="12" y1="19" x2="12" y2="22" stroke="var(--warning)" strokeWidth="2"/>
                      <line x1="2"  y1="12" x2="5"  y2="12" stroke="var(--warning)" strokeWidth="2"/>
                      <line x1="19" y1="12" x2="22" y2="12" stroke="var(--warning)" strokeWidth="2"/>
                    </svg>
                    Today's Focus
                  </div>
                  {focusTopic ? (
                    <>
                      <div className="r2d-focus-title">Master {focusTopic}</div>
                      <div className="r2d-focus-sub">
                        {focusTotalTasks ? `${focusCompletedTasks} / ${focusTotalTasks} tasks completed` : 'No checklist tasks recorded yet'}
                      </div>
                      <div className="r2d-bar-track" style={{marginBottom: 12}}>
                        <div className="r2d-bar-fill" style={{ width: `${focusPercent}%`, background: "var(--secondary)" }}/>
                      </div>
                      <button
                        className="r2d-mission-btn"
                        onClick={() => handleCreateGuidedSession(`Deep Dive: ${focusTopic}`, 'Interview Remediation')}
                      >
                        Continue Mission
                      </button>
                    </>
                  ) : (
                    <div className="r2d-empty-state">
                      No focus has been identified from your learning or interview history yet.
                    </div>
                  )}
                </div>

                {/* AI RECOMMENDATION ENGINE WIDGET */}
                <div className="r2d-panel">
                  <div className="r2d-panel-heading">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--secondary)">
                      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
                    </svg>
                    AI Recommendation
                  </div>
                  {recommendationTopic ? (
                    <>
                      <p className="r2d-rec-desc">Based on your recorded gaps, we recommend: </p>
                      <div className="r2d-rec-chip" onClick={() => handleCreateGuidedSession(recommendationTopic, 'Concept Learning')}>
                        <span>{recommendationTopic}</span>
                        <span className="r2d-rec-arrow">›</span>
                      </div>
                      <p className="r2d-rec-why" style={{ marginTop: '8px' }}>
                        <strong>Why?</strong> Generated from completed user learning sessions.
                      </p>
                    </>
                  ) : (
                    <div className="r2d-empty-state">
                      No recommendations yet. Complete a learning session or interview so the AI has real evidence to analyze.
                    </div>
                  )}
                </div>

                {/* RECENT ACTIVITY */}
                <div className="r2d-panel">
                  <div className="r2d-panel-heading">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="var(--text-muted)" strokeWidth="2"/>
                      <polyline points="12 6 12 12 16 14" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Recent Activity
                  </div>
                  
                  {recentActivities.length === 0 ? (
                    <div className="r2d-empty-state">
                      No activity yet. Activity appears after you start learning or interview sessions.
                    </div>
                  ) : (
                    recentActivities.map(activity => (
                      <div className="r2d-activity-row" key={activity.id}>
                        <span className="r2d-dot" style={{ background: activity.color }}/>
                        <span className="r2d-activity-text">{activity.text}</span>
                        <span className="r2d-activity-time">{formatActivityTime(activity.time)}</span>
                      </div>
                    ))
                  )}
                </div>

              </aside>

            </div>
          ) : (
            /* History Workspaces resume list inside onboarding portal */
            <div className="onboarding-hero">
              <button 
                onClick={() => setShowHistoryResume(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 'bold', marginBottom: '24px' }}
              >
                <ArrowLeft size={16} /> Back to Curated Goals
              </button>
              
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 8px' }}>Resume Previous Labs Workspaces</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 20px' }}>Select an ongoing mentoring space to load logs, sandbox scripts, and architecture blueprints.</p>
              
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {sessions.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No active labs sessions found. Launch a curated goal to start!</div>
                ) : (
                  sessions.map(s => {
                    const isProj = s.topic.startsWith('Project Defense:');
                    return (
                      <div 
                        key={s._id} 
                        onClick={() => fetchSessionDetails(s._id)}
                        style={{ 
                          background: 'var(--surface)', 
                          border: '1px solid var(--border)', 
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
                          <strong style={{ display: 'block', fontSize: '13.5px', color: 'var(--text-primary)' }}>
                            {isProj ? 'ðŸ›¡ï¸ ' + s.topic.replace('Project Defense: ', '') : 'ðŸ“– ' + s.topic}
                          </strong>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Focus: {s.sessionType} â€¢ Mode: {s.mode}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '13px', color: s.masteryPercentage >= 75 ? 'var(--success)' : s.masteryPercentage >= 40 ? 'var(--info)' : 'var(--error)', fontWeight: 'bold' }}>
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
          DYNAMIC DEDICATED WORKSPACE LAYOUT (NO GENERIC TAB-BARS)
          Wraps workspaces in a Universal Workspace Header system.
        */
        <div className="workspace-journey-container">
          
          {/* Universal Workspace Header System */}
          <header className="workspace-header-system">
            <div className="workspace-header-left">
              <span className="mission-badge-pill">MISSION</span>
              <h2 className="mission-title">
                {activeSession.topic.startsWith('Project Defense:') ? activeSession.topic.replace('Project Defense: ', '') : activeSession.topic}
              </h2>
              <span className="difficulty-badge">{activeSession.mode || 'Intermediate'}</span>
            </div>
            
            <div className="workspace-header-center">
              <span className="progress-label">Progress {calculateChecklistPercent()}%</span>
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: `${calculateChecklistPercent()}%` }} />
              </div>
              <span className="duration-label">Est. {activeSession.sessionType === 'Project Defense' ? '30' : '15'} min</span>
            </div>
            
            <div className="workspace-header-right">
              <button type="button" className="save-exit-btn" onClick={handleExitToGoalsPortal}>
                Save &amp; Exit
              </button>
            </div>
          </header>

          {/* Dedicated post-mission Completion Screen (Dopamine Loop) */}
          {calculateChecklistPercent() >= 100 || activeSession.status === 'completed' ? (
            <div className="completion-screen-container" style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', padding: '40px', overflowY: 'auto' }}>
              <div className="completion-card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '40px', borderRadius: '20px', maxWidth: '580px', width: '100%', textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', animation: 'fadeIn 0.5s ease' }}>
                <div className="confetti-icon" style={{ fontSize: '48px', marginBottom: '16px' }}>ðŸŽ‰</div>
                <h1 className="completion-title" style={{ fontFamily: 'Sora', fontSize: '26px', color: '#fff', margin: '0 0 10px' }}>Mission Completed!</h1>
                <p className="completion-desc" style={{ color: 'var(--text-secondary)', fontSize: '13.5px', margin: '0 0 24px', lineHeight: '1.6' }}>
                  You have successfully completed all checkpoints for <strong>{activeSession.topic.startsWith('Project Defense:') ? activeSession.topic.replace('Project Defense: ', '') : activeSession.topic}</strong>.
                </p>
                
                <div className="completion-stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div className="completion-stat" style={{ background: 'var(--background)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>Objectives Mastered</span>
                    <strong style={{ fontSize: '20px', color: '#a78bfa' }}>{activeSession.missionChecklist?.length || 3} Passed</strong>
                  </div>
                  <div className="completion-stat" style={{ background: 'var(--background)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>Growth Verified</span>
                    <strong style={{ fontSize: '20px', color: '#34d399' }}>{activeSession.masteryPercentage}% Grade</strong>
                  </div>
                </div>

                {/* Before vs After gauge */}
                <div style={{ background: 'var(--background)', border: '1px solid var(--border)', padding: '18px 24px', borderRadius: '12px', marginBottom: '28px', textAlign: 'left' }}>
                  <strong style={{ color: 'var(--text-secondary)', fontSize: '12.5px', display: 'block', marginBottom: '10px' }}>Competency Growth Analytics:</strong>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Before: 25%</span>
                    <div style={{ flex: 1, height: '10px', background: 'var(--border)', borderRadius: '5px', overflow: 'hidden', position: 'relative' }}>
                      <div style={{ width: '25%', height: '100%', background: '#6b7280', borderRadius: '5px', position: 'absolute', top: 0, left: 0 }} />
                      <div style={{ width: `${activeSession.masteryPercentage}%`, height: '100%', background: '#34d399', borderRadius: '5px', position: 'absolute', top: 0, left: 0, zIndex: 2 }} />
                    </div>
                    <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 'bold' }}>After: {activeSession.masteryPercentage}%</span>
                  </div>
                </div>

                {/* AI Next Recommendation CTA */}
                <div className="completion-recommendation" style={{ background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.15)', padding: '20px', borderRadius: '12px', marginBottom: '28px', textAlign: 'left' }}>
                  <div className="rec-badge" style={{ background: 'var(--secondary-translucent)', color: 'var(--secondary-hover)', padding: '2px 6px', borderRadius: '3px', fontSize: '9px', fontWeight: 'bold', display: 'inline-block', marginBottom: '8px' }}>â˜… RECOMMENDED NEXT</div>
                  <h3 style={{ fontSize: '14px', color: '#fff', margin: '0 0 4px', fontWeight: '800' }}>Promises &amp; Async/Await Mastery</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 14px' }}>Estimated Time: 15 mins. Why: Gaps identified in asynchronous function execution flow control.</p>
                  <button className="start-rec-btn" onClick={() => handleCreateGuidedSession('Promises & Async/Await Mastery', 'Concept Learning')} style={{ width: '100%', background: 'var(--secondary)', border: 'none', color: '#fff', padding: '10px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>
                    Start Next Recommended Mission â†’
                  </button>
                </div>

                <div className="completion-actions" style={{ display: 'flex', gap: '10px' }}>
                  <button className="portal-back-btn" onClick={handleExitToGoalsPortal} style={{ flex: 1, background: 'var(--surface-alt)', border: '1px solid var(--border-focus)', color: '#fff', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
                    Back to Goals Portal
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Split pane Workspaces matching specific sessionType */
            <>
              <nav className="lab-mobile-pane-nav" aria-label="Workspace panels">
                <button
                  type="button"
                  className={`lab-mobile-pane-btn ${mobilePane === 'chat' ? 'is-active' : ''}`}
                  onClick={() => setMobilePane('chat')}
                  aria-pressed={mobilePane === 'chat'}
                >
                  <Sparkles size={14} aria-hidden />
                  Mentor Chat
                </button>
                <button
                  type="button"
                  className={`lab-mobile-pane-btn ${mobilePane === 'workspace' ? 'is-active' : ''}`}
                  onClick={() => setMobilePane('workspace')}
                  aria-pressed={mobilePane === 'workspace'}
                >
                  <Terminal size={14} aria-hidden />
                  Workspace
                </button>
              </nav>

            <div className={`workspace-split ${sidebarOpen ? 'workspace-split--sidebar-open' : ''}`}>
              
              {/* Left Column: Chat Pane (Active Analogy Coach) */}
              <div className={`chat-pane ${mobilePane === 'workspace' ? 'lab-pane--hidden-mobile' : ''}`}>
                <div className="chat-header">
                  <h1 style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={14} style={{ color: '#a78bfa' }} /> 
                      <span style={{ fontSize: '13px' }}>{activeSession.sessionType === 'Project Defense' ? 'AI Lead Critic' : 'Senior AI Mentor'}</span>
                    </div>
                    <span className={`session-badge ${
                      activeSession.sessionType === 'Concept Learning' ? 'concept' :
                      activeSession.sessionType === 'Sandbox Practice' ? 'sandbox' :
                      activeSession.sessionType === 'Project Defense' ? 'project' :
                      activeSession.sessionType === 'Interview Remediation' ? 'remediation' : 'career'
                    }`}>
                      {activeSession.sessionType}
                    </span>
                  </h1>
                  
                  {/* Personality select */}
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

                {/* Checklist delta tracker */}
                {activeSession.missionChecklist?.length > 0 && (
                  <div className="mission-tracker-bar">
                    <div style={{ fontSize: '10px', fontWeight: '800', color: '#a78bfa', whiteSpace: 'nowrap' }}>
                      ðŸŽ¯ MISSION DELTA ({calculateChecklistPercent()}%)
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

                {/* Chat Messages */}
                <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                  {loading ? (
                    <div style={{ color: '#71717a', textAlign: 'center', marginTop: '40px', fontSize: '13px' }}>Syncing mentor nodes...</div>
                  ) : (
                    messages.map((m, idx) => (
                      <div key={m.id || idx} className={`message-bubble ${m.role}`}>
                        {m.role === 'assistant' ? parseMentorText(m.text) : <p style={{ margin: 0 }}>{m.text}</p>}
                        
                        {m.playgroundChallenge?.evaluation?.feedback && (
                          <div style={{ background: '#09090b', border: '1px solid #1c1c1f', padding: '10px', borderRadius: '6px', marginTop: '10px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 'bold', color: m.playgroundChallenge.evaluation.passed ? '#34d399' : '#f87171', display: 'block' }}>
                              {m.playgroundChallenge.evaluation.passed ? 'âœ“ ASSERTIONS PASSED' : 'âœ— TEST COMPILER FAILURE'}
                            </span>
                            <p style={{ fontSize: '12px', color: '#a1a1aa', margin: '4px 0 0' }}>{m.playgroundChallenge.evaluation.feedback}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input area */}
                <div className="chat-input-container">
                  <form onSubmit={handleSendMessage} className="chat-input-wrapper">
                    <input 
                      type="text" 
                      className="chat-input"
                      placeholder={activeSession.sessionType === 'Project Defense' ? "Answer the Critic's question..." : "Ask your Mentor about hooks, variables, performance..."}
                      value={inputText}
                      onChange={e => setInputText(e.target.value)}
                    />
                    <button type="submit" className="send-btn">
                      <Send size={14} />
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Column: Decoupled Workspace Renderers */}
              <div className={`workspace-pane ${mobilePane === 'chat' ? 'lab-pane--hidden-mobile' : ''}`}>
                
                {/* 1. CONCEPT LEARNING WORKSPACE */}
                {activeSession.sessionType === 'Concept Learning' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Cheat Sheet & Notes block */}
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '20px', borderRadius: '12px', textAlign: 'left' }}>
                      <h3 style={{ fontSize: '15px', color: '#fff', margin: '0 0 10px', fontFamily: 'Sora' }}>ðŸ“– Cheat Sheet &amp; Module Takeaways</h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: '0 0 12px' }}>
                        Read the AI's explanation on the left. Use this cheat sheet to review code syntax patterns and core takeaways dynamically generated for this concept.
                      </p>
                      <div style={{ background: '#09090b', padding: '12px', borderRadius: '6px', border: '1px solid #1c1c1f', fontSize: '12.5px', color: '#a78bfa', fontFamily: 'monospace' }}>
                        // Mastery Tip: Analyze closely why closures retain parent variable scope in memory execution.
                      </div>
                    </div>

                    {/* Inline Mini Compiler Editor */}
                    <div className="editor-wrapper">
                      <div className="editor-header">
                        <span>quick_sandbox.js</span>
                        <span>ES6 Sandbox Compiler</span>
                      </div>
                      <textarea 
                        className="code-textarea"
                        value={playgroundCode}
                        onChange={e => setPlaygroundCode(e.target.value)}
                        placeholder="// Try testing concepts here immediately..."
                        spellCheck="false"
                        style={{ minHeight: '180px' }}
                      />
                      <div className="editor-footer">
                        <button onClick={handleResetPlayground} className="playground-btn reset">Reset</button>
                        <button onClick={handleRunCode} disabled={runningCode} className="playground-btn run">{runningCode ? 'Compiling...' : 'Run Code'}</button>
                        <button onClick={handleSubmitCode} disabled={isSubmittingCode} className="playground-btn submit">{isSubmittingCode ? 'Evaluating...' : 'Submit to Mentor'}</button>
                      </div>
                    </div>

                    {/* Console stdout outputs */}
                    {(consoleOutput || consoleError) && (
                      <div className="console-output">
                        <h4><Terminal size={11} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Terminal Stdout Console</h4>
                        {consoleError && <div style={{ color: '#f87171', whiteSpace: 'pre-wrap', marginBottom: '8px', fontWeight: 'bold' }}>{consoleError}</div>}
                        {consoleOutput && <div className="console-stdout">{consoleOutput}</div>}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. SANDBOX PRACTICE WORKSPACE */}
                {activeSession.sessionType === 'Sandbox Practice' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Challenge instruction */}
                    {(() => {
                      const challengeMsg = messages.slice().reverse().find(m => m.playgroundChallenge && m.playgroundChallenge.title);
                      if (challengeMsg) {
                        const chal = challengeMsg.playgroundChallenge;
                        return (
                          <div className="playground-challenge-card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '20px', borderRadius: '12px', textAlign: 'left' }}>
                            <h4 className="challenge-title" style={{ margin: '0 0 8px', color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>ðŸŽ¯ Challenge Criteria: {chal.title}</h4>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                              {chal.instructions}
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div className="playground-challenge-card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '20px', borderRadius: '12px', textAlign: 'left' }}>
                          <h4 className="challenge-title" style={{ margin: '0 0 8px', color: '#c084fc', fontSize: '14px', fontWeight: 'bold' }}>ðŸ“ Safe Sandbox Playground</h4>
                          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0 }}>You can freely write JavaScript scripts and compile them safely to test algorithm loops and arrays.</p>
                        </div>
                      );
                    })()}

                    {/* Standard Compiler Code Area */}
                    <div className="editor-wrapper">
                      <div className="editor-header">
                        <span>workspace_sandbox.js</span>
                        <span>ES6 Engine</span>
                      </div>
                      <textarea 
                        className="code-textarea"
                        value={playgroundCode}
                        onChange={e => setPlaygroundCode(e.target.value)}
                        placeholder="// Write JS script logic here..."
                        spellCheck="false"
                        style={{ minHeight: '300px' }}
                      />
                      <div className="editor-footer">
                        <button onClick={handleResetPlayground} className="playground-btn reset">Reset Boilerplate</button>
                        <button onClick={handleRunCode} disabled={runningCode} className="playground-btn run">{runningCode ? 'Compiling...' : 'Run Code'}</button>
                        <button onClick={handleSubmitCode} disabled={isSubmittingCode} className="playground-btn submit">{isSubmittingCode ? 'Evaluating...' : 'Submit Challenge'}</button>
                      </div>
                    </div>

                    {/* Stdout Console logs output */}
                    {(consoleOutput || consoleError) && (
                      <div className="console-output">
                        <h4><Terminal size={11} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Terminal console output logs</h4>
                        {consoleError && <div style={{ color: '#f87171', whiteSpace: 'pre-wrap', marginBottom: '8px', fontWeight: 'bold' }}>{consoleError}</div>}
                        {consoleOutput && <div className="console-stdout">{consoleOutput}</div>}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. FIX MY WEAKNESSES WORKSPACE */}
                {activeSession.sessionType === 'Interview Remediation' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
                    {/* Checklist milestones */}
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '24px', borderRadius: '12px' }}>
                      <h3 style={{ margin: '0 0 6px 0', fontSize: '15px', color: '#fff', fontFamily: 'Sora' }}>âš¡ Remediation Checkpoints Roadmap</h3>
                      <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '0 0 20px' }}>Tick off objectives by discussing with the AI Mentor on the left and executing playground evaluations.</p>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ color: '#34d399' }}>âœ“</span>
                          <div>
                            <strong style={{ display: 'block', fontSize: '13px', color: '#fff' }}>1. Learn Core module</strong>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Discuss loops, variables, or promises scopes with AI coach analogies.</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ color: calculateChecklistPercent() >= 40 ? '#34d399' : 'var(--text-muted)' }}>{calculateChecklistPercent() >= 40 ? 'âœ“' : 'ðŸŸ¡'}</span>
                          <div>
                            <strong style={{ display: 'block', fontSize: '13px', color: '#fff' }}>2. Review Analogical Examples</strong>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Read code outputs closely in parent scope.</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ color: calculateChecklistPercent() >= 80 ? '#34d399' : 'var(--text-muted)' }}>{calculateChecklistPercent() >= 80 ? 'âœ“' : 'ðŸ”’'}</span>
                          <div>
                            <strong style={{ display: 'block', fontSize: '13px', color: '#fff' }}>3. Practical Compiler Sandbox Challenge</strong>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Write algorithms to pass strict assertions checks.</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Inline Playground Compiler */}
                    <div className="editor-wrapper">
                      <div className="editor-header">
                        <span>remediation_editor.js</span>
                        <span>ES6 Engine</span>
                      </div>
                      <textarea 
                        className="code-textarea"
                        value={playgroundCode}
                        onChange={e => setPlaygroundCode(e.target.value)}
                        placeholder="// Write remediation JS script patterns here..."
                        spellCheck="false"
                        style={{ minHeight: '180px' }}
                      />
                      <div className="editor-footer">
                        <button onClick={handleResetPlayground} className="playground-btn reset">Reset</button>
                        <button onClick={handleRunCode} disabled={runningCode} className="playground-btn run">Run</button>
                        <button onClick={handleSubmitCode} disabled={isSubmittingCode} className="playground-btn submit">Submit Solution</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. PROJECT DEFENSE WORKSPACE */}
                {activeSession.sessionType === 'Project Defense' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
                    {projectContext ? (
                      <>
                        <div style={{ padding: '16px', background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.15)', borderRadius: '12px' }}>
                          <h3 style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#fff' }}>
                            ðŸ›¡ï¸ Active Defense Ingestion: {projectContext.projectName}
                          </h3>
                          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>The AI Tech Critic probes technical setup choices. Complete all questions to reveal verified readiness scoring report grades.</p>
                        </div>

                        {/* Diagnostics & Scores report summary */}
                        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '16px', borderRadius: '12px' }}>
                          <strong style={{ fontSize: '13px', color: '#a78bfa', display: 'block', marginBottom: '12px' }}>ðŸ“Š System Architecture Blueprint Diagnostics</strong>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '14px' }}>
                            <div style={{ background: 'var(--background)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                              <span style={{ fontSize: '10px', color: '#71717a', display: 'block' }}>State Engine</span>
                              <strong style={{ fontSize: '12px', color: '#fff' }}>{projectContext.architectureReport?.stateManagement || 'None'}</strong>
                            </div>
                            <div style={{ background: 'var(--background)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                              <span style={{ fontSize: '10px', color: '#71717a', display: 'block' }}>Auth Provider</span>
                              <strong style={{ fontSize: '12px', color: '#fff' }}>{projectContext.architectureReport?.auth || 'None'}</strong>
                            </div>
                            <div style={{ background: 'var(--background)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                              <span style={{ fontSize: '10px', color: '#71717a', display: 'block' }}>Database System</span>
                              <strong style={{ fontSize: '12px', color: '#fff' }}>{projectContext.architectureReport?.database || 'None'}</strong>
                            </div>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--background)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', lineHeight: '1.4' }}>
                            <strong>Analysis Summary:</strong> {projectContext.architectureReport?.summary || 'Scanning file logic directories...'}
                          </div>
                        </div>

                        {/* Q&A Critic form interface */}
                        {activeSession.status === 'active' && (
                          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '16px', borderRadius: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                              <strong style={{ fontSize: '13px', color: '#f4f4f5' }}>ðŸ“ Tech Critic Probing</strong>
                              <span style={{ fontSize: '11px', color: '#a78bfa', fontWeight: 'bold' }}>Question {projectContext.defenseProgress?.currentQuestionIndex + 1 || 1} / 5</span>
                            </div>
                            <form onSubmit={handleSubmitDefenseAnswer}>
                              <textarea 
                                value={defenseAnswer}
                                onChange={e => setDefenseAnswer(e.target.value)}
                                className="ingestion-input"
                                style={{ minHeight: '80px', resize: 'vertical', fontSize: '12.5px', background: 'var(--background)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px', padding: '10px', width: '100%', outline: 'none', marginBottom: '10px' }}
                                placeholder="Defend your architectural folder setups, file logic choices, or database mappings..."
                                required
                              />
                              <button type="submit" disabled={isSubmittingDefense} className="send-btn" style={{ width: '100%', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                {isSubmittingDefense ? 'Critic checking solution...' : 'Submit Defense Explanation'} <ArrowRight size={14} />
                              </button>
                            </form>
                          </div>
                        )}

                        {/* Top 25 Specific custom questions list */}
                        {projectContext.topQuestions && (
                          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                            <button 
                              onClick={() => setTop25QuestionsExpanded(!top25QuestionsExpanded)}
                              style={{ width: '100%', background: 'transparent', border: 'none', color: '#e4e4e7', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '12.5px', padding: 0 }}
                            >
                              <span>ðŸ“ Top 25 custom Project Questions to Practice</span>
                              <span>{top25QuestionsExpanded ? 'â–¼' : 'â–¶'}</span>
                            </button>
                            {top25QuestionsExpanded && (
                              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                                {projectContext.topQuestions.map((q, idx) => (
                                  <div key={idx} style={{ background: 'var(--background)', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                                    <strong>Q{idx + 1}:</strong> {q}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      /* ZIP Upload Repository Form */
                      <div className="ingestion-form" style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '24px', borderRadius: '16px' }}>
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#fff', fontFamily: 'Sora' }}>ðŸ”Œ Ingest GitHub Repository / Code Folder</h3>
                        <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '0 0 20px', lineHeight: '1.5' }}>
                          Provide a public GitHub Repository URL to scan the folder logic, package configurations, state auth components, and trigger automated probe questions.
                        </p>
                        {ingestError && (
                          <div style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', padding: '10px', borderRadius: '6px', marginBottom: '12px', fontSize: '12px' }}>
                            {ingestError}
                          </div>
                        )}
                        <form onSubmit={handleIngestProject} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <input 
                            type="text" 
                            className="ingestion-input"
                            style={{ background: 'var(--background)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', outline: 'none' }}
                            placeholder="e.g. My E-commerce Webapp"
                            value={projectName}
                            onChange={e => setProjectName(e.target.value)}
                            required
                          />
                          <input 
                            type="text" 
                            className="ingestion-input"
                            style={{ background: 'var(--background)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', outline: 'none' }}
                            placeholder="e.g. https://github.com/Azaz-Gori07/Road2Dev"
                            value={githubUrl}
                            onChange={e => setGithubUrl(e.target.value)}
                            required
                          />
                          <button type="submit" disabled={isIngestingProject} className="send-btn" style={{ padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold' }}>
                            {isIngestingProject ? 'Scanning Architecture Files...' : 'Ingest & Compile Report'}
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                )}

                {/* 5. CAREER OPERATING SYSTEM WORKSPACE */}
                {activeSession.sessionType === 'Career Coach' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
                    {loadingCoach ? (
                      <div style={{ color: '#71717a', textAlign: 'center', marginTop: '40px', fontSize: '13px' }}>Compiling Market Readiness roadmap profiles...</div>
                    ) : coachData ? (
                      <>
                        <div style={{ padding: '16px', background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.15)', borderRadius: '12px' }}>
                          <h3 style={{ margin: '0 0 6px 0', fontSize: '15px', color: '#fff', fontFamily: 'Sora' }}>
                            ðŸ’¼ Crowning Stage: Career Operating System
                          </h3>
                          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0 }}>Real-time job readiness scorecards and priorities aggregated from your learning outcomes.</p>
                        </div>

                        {coachData.insufficientData ? (
                          <div className="r2d-empty-state">
                            {coachData.reason || 'Career recommendations require completed learning sessions owned by your account.'}
                          </div>
                        ) : (
                          <>
                            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '20px', borderRadius: '12px' }}>
                              <strong style={{ fontSize: '13px', color: '#fff', display: 'block', marginBottom: '10px' }}>Current job readiness</strong>
                              <p style={{ color: 'var(--text-secondary)', fontSize: '12.5px', margin: '0 0 8px' }}>{coachData.marketReadiness || 'Readiness summary unavailable.'}</p>
                              <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>{coachData.jobReadiness || 'No readiness score generated from your completed sessions yet.'}</p>
                            </div>

                            <div style={{ background: 'rgba(6, 182, 212, 0.04)', border: '1px solid var(--primary-translucent)', padding: '18px 20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                              <div style={{ flex: 1 }}>
                                <span style={{ fontSize: '10px', color: 'var(--primary-hover)', display: 'block', fontWeight: 'bold', textTransform: 'uppercase' }}>Recommended next skill gap</span>
                                <strong style={{ fontSize: '14px', color: '#fff', display: 'block', marginTop: '3px' }}>{recommendationTopic || 'No recommendation generated'}</strong>
                                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Generated only from completed learning sessions owned by your account.</span>
                              </div>
                              {recommendationTopic && (
                                <button className="start-rec-btn" onClick={() => handleCreateGuidedSession(recommendationTopic, 'Concept Learning')} style={{ background: 'var(--primary)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', flexShrink: 0 }}>
                                  Start
                                </button>
                              )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '16px', borderRadius: '12px' }}>
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>compensation expectations</span>
                                <strong style={{ fontSize: '16px', color: '#34d399', display: 'block', marginTop: '4px' }}>{coachData.salaryGuidance || 'Unavailable'}</strong>
                              </div>
                              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '16px', borderRadius: '12px' }}>
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Target Roles Tier</span>
                                <strong style={{ fontSize: '14px', color: '#fff', display: 'block', marginTop: '4px' }}>{coachData.recommendedRoles?.join(', ') || 'Unavailable'}</strong>
                              </div>
                            </div>
                          </>
                        )}

                        {/* Timeline roadmap Priorities */}
                        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '16px', borderRadius: '12px' }}>
                          <strong style={{ fontSize: '13px', color: '#fff', display: 'block', marginBottom: '12px' }}>ðŸ“ˆ 90-Day priority roadmap milestones</strong>
                          <div className="timeline" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {coachData.learningRoadmap?.map((phase, idx) => (
                              <div key={idx} style={{ display: 'flex', gap: '10px', fontSize: '12.5px' }}>
                                <span style={{ color: 'var(--primary-hover)', fontWeight: 'bold' }}>Phase {idx + 1}:</span>
                                <div>
                                  <strong style={{ color: '#fff' }}>{phase.phase}</strong>
                                  <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '2px' }}>{phase.topics?.join(', ')}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div style={{ color: '#71717a', textAlign: 'center', marginTop: '40px', fontSize: '13px' }}>Select Career Operating System to load roadmaps details.</div>
                    )}
                  </div>
                )}
              </div>


            </div>
            </>
          )}
        </div>
      )}

      {/* GUIDED SELECTION PICKER MODALS */}
      {guidedModalType === 'learn' && (
        <div className="guided-modal-overlay" onClick={() => setGuidedModalType(null)}>
          <div className="guided-modal" onClick={e => e.stopPropagation()}>
            <strong style={{ fontSize: '13px', color: '#a78bfa', display: 'block', marginBottom: '6px' }}>ðŸ“– SELECT A CONCEPT TOPIC</strong>
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
            <strong style={{ fontSize: '13px', color: '#f87171', display: 'block', marginBottom: '6px' }}>âš¡ SELECT A WEAKNESS MISSION</strong>
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
                    <span>âš¡ Today's Mission: Master {gap}</span>
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

