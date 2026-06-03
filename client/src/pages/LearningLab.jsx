import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Sparkles,
  Terminal,
  Send,
  ArrowRight,
  Copy,
  Check,
  ArrowLeft
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import ProjectDefenseWorkspace from '../components/ProjectDefenseWorkspace';
import { isProjectScanned } from '../utils/projectScanProgress';
import './LearningLab.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5500/api';
const SANDBOX_DRAFT_PREFIX = 'road2dev-learninglab-sandbox-';
const WORKFLOW_UI_PREFIX = 'road2dev-learninglab-ui-';

const getRouteWorkflowTab = (pathname = '') => {
  if (pathname.includes('/project-defense/')) return 'project';
  if (pathname.includes('/career-coach/')) return 'coach';
  if (pathname.includes('/knowledge-gap/')) return 'memory';
  if (pathname.includes('/sandbox/')) return 'playground';
  if (pathname.includes('/session/')) return 'playground';
  return null;
};

const hasPlaygroundChallenge = (session) =>
  Array.isArray(session?.messages) &&
  session.messages.some(message => message.playgroundChallenge?.title);

const getWorkflowRoute = (session, preferredTab) => {
  const id = session?._id || session?.id || session;
  if (!id) return '/learning-lab';

  if (preferredTab === 'project' || session?.sessionType === 'Project Defense' || session?.topic?.startsWith('Project Defense:')) {
    return `/learning-lab/project-defense/${id}`;
  }
  if (preferredTab === 'coach' || session?.sessionType === 'Career Coach' || session?.sessionType === 'Career Strategy') {
    return `/learning-lab/career-coach/${id}`;
  }
  if (preferredTab === 'memory' || session?.sessionType === 'Interview Remediation') {
    return `/learning-lab/knowledge-gap/${id}`;
  }
  if (preferredTab === 'playground' && (session?.sessionType === 'Sandbox Practice' || hasPlaygroundChallenge(session))) {
    return `/learning-lab/sandbox/${id}`;
  }

  return `/learning-lab/session/${id}`;
};

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
  const { sessionId } = useParams();
  
  const { user: authUser } = useAuth();
  
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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [lastSeenNotificationsAt, setLastSeenNotificationsAt] = useState(() => {
    const saved = localStorage.getItem('road2dev-learninglab-notifications-seen-at');
    return saved ? Number(saved) : 0;
  });
  
  // Journey-First Onboarding states
  const [showHistoryResume, setShowHistoryResume] = useState(false);
  const [guidedModalType, setGuidedModalType] = useState(null); // 'learn' | 'weakness' | null
  
  // Playground state
  const [playgroundCode, setPlaygroundCode] = useState('');
  const [consoleOutput, setConsoleOutput] = useState('');
  const [consoleError, setConsoleError] = useState('');
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);
  const [runningCode, setRunningCode] = useState(false);
  
  // Project Defense state
  const [defenseAnswer, setDefenseAnswer] = useState('');
  const [isSubmittingDefense, setIsSubmittingDefense] = useState(false);
  const [top25QuestionsExpanded, setTop25QuestionsExpanded] = useState(false);

  // Career Coach / Recruiter state
  const [coachData, setCoachData] = useState(null);
  const [loadingCoach, setLoadingCoach] = useState(false);
  const [memoryGaps, setMemoryGaps] = useState([]);
  
  // Real history and AI recommendation states
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  // Copied states for code copy button animation
  const [copiedIndex, setCopiedIndex] = useState(null);

  const messagesEndRef = useRef(null);
  const currentRouteWorkflowTab = getRouteWorkflowTab(location.pathname);

  const openLearningSession = useCallback((session) => {
    if (!session?._id) return;
    navigate(getWorkflowRoute(session), { replace: false });
  }, [navigate]);

  useEffect(() => {
    if (activeSession?._id) {
      if (
        activeSession.sessionType === 'Project Defense' &&
        !isProjectScanned(activeSession.projectContext)
      ) {
        setMobilePane('workspace');
      } else {
        setMobilePane('chat');
      }
    }
  }, [activeSession?._id, activeSession?.sessionType, activeSession?.projectContext]);

  // Request Tracking & Abort Refs
  const sessionCreationInFlight = useRef(false);
  const careerCoachInFlight = useRef(false);
  const chatInFlight = useRef(false);
  const codeEvalInFlight = useRef(false);
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

  const fetchTimeline = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/learning-lab/timeline`, {
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setTimelineEvents(data.data);
      }
    } catch (e) {
      console.error('Error fetching timeline:', e);
    }
  }, []);

  const fetchRecommendations = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/learning-lab/recommendations`, {
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setRecommendations(data.data);
      }
    } catch (e) {
      console.error('Error fetching recommendations:', e);
    }
  }, []);

  // Fetch specific session details
  const fetchSessionDetails = useCallback(async (id, options = {}) => {
    const { syncRoute = true, routeWorkflowTab = currentRouteWorkflowTab } = options;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/learning-lab/session/${id}`, {
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        const session = data.data;
        const messages = session.messages || [];
        const uiStateKey = `${WORKFLOW_UI_PREFIX}${session._id}`;
        const savedUiState = (() => {
          try {
            return JSON.parse(localStorage.getItem(uiStateKey) || '{}');
          } catch (e) {
            return {};
          }
        })();

        setActiveSession(session);
        setMessages(messages);
        setSelectedMode(session.mode || 'Intermediate');
        setPersonality(session.personality || 'The Coding Coach');
        
        // Find if last message has a playground challenge to load into playgroundCode
        const lastMsg = messages.slice().reverse().find(m => m.playgroundChallenge && m.playgroundChallenge.initialCode);
        const savedDraft = localStorage.getItem(`${SANDBOX_DRAFT_PREFIX}${session._id}`);
        setPlaygroundCode(savedDraft || lastMsg?.playgroundChallenge?.initialCode || '// Select a topic to start coding or request a challenge in the chat!');

        // Set playground tab active if project defense is not active
        if (routeWorkflowTab) {
          setActiveTab(routeWorkflowTab);
        } else if (['playground', 'project', 'coach', 'memory'].includes(savedUiState.activeTab)) {
          setActiveTab(savedUiState.activeTab);
        } else if (session.sessionType === 'Project Defense' || session.topic.startsWith('Project Defense:')) {
          setActiveTab('project');
          if (!isProjectScanned(session.projectContext)) {
            setMobilePane('workspace');
          }
        } else if (session.sessionType === 'Career Coach' || session.sessionType === 'Career Strategy') {
          setActiveTab('coach');
        } else if (session.sessionType === 'Interview Remediation') {
          setActiveTab('memory');
        } else {
          setActiveTab('playground');
        }

        if (savedUiState.mobilePane === 'chat' || savedUiState.mobilePane === 'workspace') {
          setMobilePane(savedUiState.mobilePane);
        }

        // AUTO-TAB SWITCHING: If AI issued a coding challenge, switch active right toolbox tab to 'playground' instantly!
        if (!routeWorkflowTab && messages.length > 0) {
          const lastAssistantMsg = messages.slice().reverse().find(m => m.role === 'assistant');
          if (lastAssistantMsg?.playgroundChallenge?.title && session.sessionType !== 'Project Defense') {
            setActiveTab('playground');
          }
        }

        if (syncRoute) {
          const nextRoute = getWorkflowRoute(session, routeWorkflowTab || undefined);
          if (location.pathname !== nextRoute) {
            navigate(nextRoute, { replace: false });
          }
        }
      }
    } catch (e) {
      console.error('Error fetching session details:', id, e);
    } finally {
      setLoading(false);
    }
  }, [currentRouteWorkflowTab, location.pathname, navigate]);

  // Initialize or fetch sessions on mount
  useEffect(() => {
    const init = async () => {
      await fetchSessions();
      await fetchTimeline();
      await fetchRecommendations();

      if (sessionId) {
        await fetchSessionDetails(sessionId, { syncRoute: false, routeWorkflowTab: currentRouteWorkflowTab });
        return;
      }
      
      // Check for session to resume passed from navigation state
      if (location.state?.resumeSessionId) {
        await fetchSessionDetails(location.state.resumeSessionId);
        return;
      }

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
            const nextRoute = getWorkflowRoute(data.data);
            navigate(nextRoute, { replace: true, state: {} });
            await fetchSessions();
            await fetchSessionDetails(data.data._id, { syncRoute: false });
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
  }, [sessionId, currentRouteWorkflowTab, location.search, location.state, navigate, fetchSessions, fetchSessionDetails, fetchTimeline, fetchRecommendations]);

  // Clear active session when sessionId is not present in route (e.g. back to landing)
  useEffect(() => {
    if (!sessionId) {
      setActiveSession(null);
      setMessages([]);
    }
  }, [sessionId]);

  // Sync State to URL parameters (Tab & Stage)
  useEffect(() => {
    if (!activeSession) return;

    const id = activeSession._id || activeSession.id;
    const stage = activeSession.learningEngine?.currentStage || 'WHY';
    const tab = activeTab;

    const nextRoute = getWorkflowRoute(activeSession, tab);
    const searchParams = new URLSearchParams(location.search);

    const currentStageInUrl = searchParams.get('stage');
    const currentTabInUrl = searchParams.get('tab');

    const routeChanged = location.pathname !== nextRoute;
    const stageChanged = currentStageInUrl !== stage;
    const tabChanged = currentTabInUrl !== tab;

    if (routeChanged || stageChanged || tabChanged) {
      searchParams.set('stage', stage);
      searchParams.set('tab', tab);
      const isFirstLoad = !currentStageInUrl && !currentTabInUrl;
      navigate(`${nextRoute}?${searchParams.toString()}`, { replace: isFirstLoad });
    }
  }, [activeSession?._id, activeSession?.learningEngine?.currentStage, activeTab, navigate, location.pathname, location.search]);

  // Sync URL parameters to State (for Back/Forward navigation support)
  useEffect(() => {
    if (!activeSession) return;

    const searchParams = new URLSearchParams(location.search);
    const urlTab = searchParams.get('tab');

    if (urlTab && ['playground', 'project', 'coach', 'memory'].includes(urlTab) && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }

    // Stage is driven by server response only; URL param is ignored to prevent client-side manipulation
  }, [location.search, activeSession?._id, activeTab]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!activeSession?._id) return;
    localStorage.setItem(`${SANDBOX_DRAFT_PREFIX}${activeSession._id}`, playgroundCode);
  }, [activeSession?._id, playgroundCode]);

  useEffect(() => {
    if (!activeSession?._id) return;
    localStorage.setItem(`${WORKFLOW_UI_PREFIX}${activeSession._id}`, JSON.stringify({
      activeTab,
      mobilePane,
      route: location.pathname,
      stage: activeSession.learningEngine?.currentStage || '',
      savedAt: new Date().toISOString()
    }));
  }, [activeSession?._id, activeSession?.learningEngine?.currentStage, activeTab, mobilePane, location.pathname]);

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

    if (isProjectDefenseSession) {
      if (!projectDefenseScanned) {
        setMobilePane('workspace');
        return;
      }
      if (!projectDefenseInterviewActive) {
        setMobilePane('workspace');
        return;
      }
    }

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
          const sandboxRoute = getWorkflowRoute(data.data, 'playground');
          if (location.pathname !== sandboxRoute) {
            navigate(sandboxRoute, { replace: false });
          }
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
    const sandboxMode = challengeMsg
      ? activeSession.learningEngine?.currentStage === 'EVALUATION'
        ? 'assessment'
        : 'challenge'
      : 'practice';

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
          body: JSON.stringify({ code: playgroundCode, challengeTitle, sandboxMode })
        },
        'sandbox_code_submit'
      );
      const data = await res.json();
      if (data.success) {
        const evaluation = data.data;
        if (evaluation.passed) {
          setConsoleOutput(`[SUCCESS] ${evaluation.mode === 'practice' ? 'Practice Run' : 'Submission'} Completed Successfully!\nFeedback: ${evaluation.feedback}\nConsole Logs: ${evaluation.stdout}`);
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

  const handleProjectDefenseSessionUpdated = (session) => {
    setActiveSession(session);
    setMessages(session.messages || []);
    fetchSessions();
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
      } else if (data.evaluationFailed) {
        // Evaluation failed but answer was recorded - update UI to show the error message
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
        navigate(getWorkflowRoute(data.data), { replace: false, state: {} });
        await fetchSessions();
        await fetchSessionDetails(data.data._id, { syncRoute: false });
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
  const isProjectDefenseSession = activeSession?.sessionType === 'Project Defense';
  const projectDefenseScanned = isProjectScanned(projectContext);
  const projectDefenseInterviewActive =
    projectDefenseScanned && projectContext?.defenseStarted === true;

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
    fetchTimeline();
    fetchRecommendations();
  }, [fetchSessions, fetchInterviewSessions, fetchTimeline, fetchRecommendations]);

  useEffect(() => {
    const refreshDashboardData = () => {
      fetchSessions();
      fetchInterviewSessions();
      fetchTimeline();
      fetchRecommendations();
    };

    window.addEventListener('interview-sessions-updated', refreshDashboardData);
    window.addEventListener('learning-lab-sessions-updated', refreshDashboardData);
    const intervalId = window.setInterval(refreshDashboardData, 30000);

    return () => {
      window.removeEventListener('interview-sessions-updated', refreshDashboardData);
      window.removeEventListener('learning-lab-sessions-updated', refreshDashboardData);
      window.clearInterval(intervalId);
    };
  }, [fetchSessions, fetchInterviewSessions]);

  const overallMastery = sessions.length > 0 
    ? Math.round(sessions.reduce((acc, s) => acc + (s.masteryPercentage || 0), 0) / sessions.length) 
    : 0;

  const completedInterviewCount = interviewSessions.filter(s => s.status === 'completed').length;
  const learningPathItems = sessions
    .filter(session => session.status === 'completed' || (Number(session.masteryPercentage) || 0) > 0)
    .slice(0, 4)
    .map((session) => ({
    id: session._id,
    title: session.topic,
    status: session.status === 'completed' ? 'Completed' : 'Active',
    mastery: Number(session.masteryPercentage) || 0
  }));
  const latestActiveSession = sessions[0] || null;

  const STAGES_ORDER = [
    { key: 'WHY', label: 'Why This Exists' },
    { key: 'CONCEPT', label: 'Concept Explanation' },
    { key: 'VISUALIZATION', label: 'Visualization' },
    { key: 'SIMPLE_EXAMPLE', label: 'Simple Example' },
    { key: 'REAL_PROJECT_USAGE', label: 'Real Project Usage' },
    { key: 'UNDERSTANDING_CHECK', label: 'Understanding Check' },
    { key: 'GUIDED_CHALLENGE', label: 'Guided Challenge' },
    { key: 'INDEPENDENT_CHALLENGE', label: 'Independent Challenge' },
    { key: 'PROJECT_APPLICATION', label: 'Project Application' },
    { key: 'INTERVIEW_ROUND', label: 'Interview Round' },
    { key: 'EVALUATION', label: 'Evaluation' },
    { key: 'MASTERY_DECISION', label: 'Mastery Decision' }
  ];

  const focusTopic = memoryGaps[0] || null;
  const focusSession = focusTopic ? sessions.find(s => s.topic === focusTopic) : null;
  const focusChecklist = focusSession?.missionChecklist || [];
  const focusCompletedTasks = focusChecklist.filter(item => item.completed).length;
  const focusTotalTasks = focusChecklist.length;
  const focusPercent = focusTotalTasks ? Math.round((focusCompletedTasks / focusTotalTasks) * 100) : 0;

  const unfinishedConceptLearning = sessions.find(s => s.sessionType === 'Concept Learning' && s.status !== 'completed');
  const unfinishedSandboxPractice = sessions.find(s => s.sessionType === 'Sandbox Practice' && s.status !== 'completed');
  const unfinishedProjectDefense = sessions.find(s => (s.sessionType === 'Project Defense' || s.topic?.startsWith('Project Defense:')) && s.status !== 'completed');
  const unfinishedCareerCoach = sessions.find(s => s.sessionType === 'Career Coach' && s.status !== 'completed');
  const recommendation = recommendations[0] || null;
  const recommendationTopic = recommendation?.topic || null;
  const recentActivities = timelineEvents.map(e => ({
    id: e._id,
    text: `${e.action}: ${e.topic}`,
    time: e.createdAt,
    color: e.status === 'completed' || e.action.startsWith('Passed') || e.action.startsWith('Completed') ? 'var(--success)' : e.status === 'failed' || e.action.startsWith('Failed') ? 'var(--error)' : 'var(--secondary)'
  })).slice(0, 3);

  const formatActivityTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const searchValue = searchQuery.trim().toLowerCase();
  const searchResults = searchValue
    ? [
        ...sessions.map(session => ({
          id: `learning-${session._id}`,
          title: session.topic,
          meta: `${session.sessionType || 'Learning Session'} • ${session.status || 'active'} • ${Number(session.masteryPercentage) || 0}% mastery`,
          type: 'Learning',
          action: () => openLearningSession(session)
        })),
        ...interviewSessions.map(session => ({
          id: `interview-${session._id || session.id}`,
          title: session.title || session.field || 'Interview Session',
          meta: `${session.field || 'Interview'}${session.stack ? ` • ${session.stack}` : ''} • ${session.status || 'draft'}`,
          type: 'Interview',
          action: () => navigate(`/interview/session/${session._id || session.id}`)
        }))
      ]
        .filter(item => `${item.title} ${item.meta} ${item.type}`.toLowerCase().includes(searchValue))
        .slice(0, 6)
    : [];

  const notifications = [
    ...sessions.map(session => ({
      id: `learning-${session._id}`,
      title: session.status === 'completed' ? 'Learning session completed' : 'Learning session updated',
      detail: session.topic,
      time: session.updatedAt || session.createdAt,
      action: () => openLearningSession(session)
    })),
    ...interviewSessions.map(session => ({
      id: `interview-${session._id || session.id}`,
      title: session.status === 'completed' ? 'Interview completed' : 'Interview session updated',
      detail: session.title || session.field || 'Interview Session',
      time: session.updatedAt || session.createdAt,
      action: () => navigate(`/interview/session/${session._id || session.id}`)
    }))
  ]
    .filter(item => item.time)
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 8);

  const unreadNotifications = notifications.filter(item => {
    const timestamp = new Date(item.time).getTime();
    return Number.isFinite(timestamp) && timestamp > lastSeenNotificationsAt;
  }).length;

  const openNotifications = () => {
    setNotificationsOpen(prev => {
      const nextOpen = !prev;
      if (nextOpen) {
        const now = Date.now();
        setLastSeenNotificationsAt(now);
        localStorage.setItem('road2dev-learninglab-notifications-seen-at', String(now));
      }
      return nextOpen;
    });
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
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    setSearchOpen(false);
                    event.currentTarget.blur();
                  }
                }}
              />
              {searchOpen && searchQuery.trim() && (
                <div className="r2d-search-results" role="listbox">
                  {searchResults.length > 0 ? (
                    searchResults.map(result => (
                      <button
                        type="button"
                        className="r2d-search-result"
                        key={result.id}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          result.action();
                          setSearchOpen(false);
                          setSearchQuery('');
                        }}
                      >
                        <span className="r2d-search-result-type">{result.type}</span>
                        <span className="r2d-search-result-title">{result.title}</span>
                        <span className="r2d-search-result-meta">{result.meta}</span>
                      </button>
                    ))
                  ) : (
                    <div className="r2d-search-empty">
                      No user-owned learning or interview records match this search.
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="r2d-topbar-actions">
              <div className="r2d-streak" title="5 day streak">
                <span className="r2d-streak-emoji" aria-hidden>🔥</span>
                <span className="r2d-streak-label">5 Day Streak</span>
              </div>
              <div className="r2d-topbar-tools">
                <div className="r2d-notification-wrap">
                  <button
                    type="button"
                    className="r2d-bell-btn"
                    aria-label={`Notifications${unreadNotifications ? `, ${unreadNotifications} unread` : ''}`}
                    aria-expanded={notificationsOpen}
                    onClick={openNotifications}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M6 10a6 6 0 0 1 12 0v4l2 2H4l2-2v-4z" stroke="var(--text-muted)" strokeWidth="2" strokeLinejoin="round"/>
                      <path d="M10 18a2 2 0 0 0 4 0" stroke="var(--text-muted)" strokeWidth="2"/>
                    </svg>
                    {unreadNotifications > 0 && (
                      <span className="r2d-notification-badge">
                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                      </span>
                    )}
                  </button>
                  {notificationsOpen && (
                    <div className="r2d-notification-panel">
                      <div className="r2d-notification-head">
                        <strong>Notifications</strong>
                        <span>Live user activity</span>
                      </div>
                      {notifications.length > 0 ? (
                        notifications.map(item => (
                          <button
                            type="button"
                            className="r2d-notification-item"
                            key={item.id}
                            onClick={() => {
                              item.action();
                              setNotificationsOpen(false);
                            }}
                          >
                            <span className="r2d-notification-title">{item.title}</span>
                            <span className="r2d-notification-detail">{item.detail}</span>
                            <span className="r2d-notification-time">{formatActivityTime(item.time)}</span>
                          </button>
                        ))
                      ) : (
                        <div className="r2d-notification-empty">
                          No notifications yet. New learning and interview activity will appear here.
                        </div>
                      )}
                    </div>
                  )}
                </div>
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
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>Skill Mastery</span>
                    <strong style={{ fontSize: '18px', color: '#34d399' }}>{overallMastery}%</strong>
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
                    <strong style={{ fontSize: '13px', color: 'var(--secondary-hover)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '4px' }}>{focusTopic || 'Not available yet'}</strong>
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
                    <button 
                      type="button" 
                      className="r2d-resume-btn stage-row-cta stage-row-cta--purple" 
                      onClick={() => unfinishedConceptLearning ? openLearningSession(unfinishedConceptLearning) : setGuidedModalType('learn')}
                    >
                      {unfinishedConceptLearning ? "Resume Learning Session" : "Start Learning"}
                    </button>
                  </div>

                  {/* Stage 3: Sandbox Practice */}
                  <div className="stage-row stage-row--green">
                    <div className="stage-num stage-num--green">03</div>
                    <div className="stage-row-body">
                      <strong style={{ color: '#fff', fontSize: '14px', display: 'block' }}>Sandbox Practice Workspace</strong>
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Write code, debug syntax, and pass validation challenges in our secure ES6 compiler.</span>
                    </div>
                    <button 
                      type="button" 
                      className="r2d-resume-btn stage-row-cta stage-row-cta--green" 
                      onClick={() => unfinishedSandboxPractice ? openLearningSession(unfinishedSandboxPractice) : handleCreateGuidedSession('Vanilla JS Sandbox Compiler', 'Sandbox Practice')}
                    >
                      {unfinishedSandboxPractice ? "Resume Sandbox Challenge" : "Open Sandbox"}
                    </button>
                  </div>

                  {/* Stage 4: Project Defense */}
                  <div className="stage-row stage-row--rose">
                    <div className="stage-num stage-num--rose">04</div>
                    <div className="stage-row-body">
                      <strong style={{ color: '#fff', fontSize: '14px', display: 'block' }}>Automated Project Defense</strong>
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Connect GitHub or a local folder, review the architecture report, then start the AI defense interview.</span>
                    </div>
                    <button 
                      type="button" 
                      className="r2d-resume-btn stage-row-cta stage-row-cta--rose" 
                      onClick={() => unfinishedProjectDefense ? openLearningSession(unfinishedProjectDefense) : handleCreateGuidedSession('Project Defense Lab', 'Project Defense')}
                    >
                      {unfinishedProjectDefense ? "Resume Project Defense" : "Defend Project"}
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
                    <button 
                      type="button" 
                      className="r2d-resume-btn stage-row-cta stage-row-cta--cyan" 
                      onClick={() => unfinishedCareerCoach ? openLearningSession(unfinishedCareerCoach) : handleCreateGuidedSession('Career Roadmaps & Interview Guidance', 'Career Coach')}
                    >
                      {unfinishedCareerCoach ? "Resume Career Coach" : "Open Career OS"}
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
                            onClick={() => openLearningSession(s)}
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
                  
                  {latestActiveSession ? (
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                        Active: {latestActiveSession.topic}
                      </div>
                      <div style={{ borderLeft: '2px solid var(--border)', marginLeft: '6px', paddingLeft: '14px', display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative' }}>
                        {STAGES_ORDER.map(stage => {
                          const matchingProgress = (latestActiveSession.learningEngine?.stageProgress || []).find(p => p.stage === stage.key);
                          const isCompleted = matchingProgress?.completed || false;
                          const isActive = (latestActiveSession.learningEngine?.currentStage || 'WHY') === stage.key;
                          
                          let indicatorColor = 'var(--border)';
                          let textColor = 'var(--text-muted)';
                          let weight = 'normal';
                          
                          if (isCompleted) {
                            indicatorColor = '#34d399';
                            textColor = 'var(--success)';
                          } else if (isActive) {
                            indicatorColor = 'var(--secondary)';
                            textColor = '#fff';
                            weight = 'bold';
                          }
                          
                          return (
                            <div key={stage.key} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ 
                                position: 'absolute', 
                                left: '-20px', 
                                background: 'var(--background)', 
                                border: `2px solid ${indicatorColor}`, 
                                borderRadius: '50%', 
                                width: '10px', 
                                height: '10px', 
                                display: 'inline-block',
                                zIndex: 2
                              }} />
                              <div style={{ fontSize: '11.5px', color: textColor, fontWeight: weight }}>
                                {stage.label} {isActive && <span style={{ color: 'var(--secondary-hover)', fontSize: '10px' }}>(Active)</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="r2d-empty-state">
                      No active learning session to map. Start a session to view progression.
                    </div>
                  )}
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
                      Not available yet.
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
                  {recommendation ? (
                    <>
                      <p className="r2d-rec-desc" style={{ fontSize: '12.5px', color: '#fff', fontWeight: 'bold', margin: '0 0 6px' }}>{recommendation.title}</p>
                      <div className="r2d-rec-chip" onClick={() => handleCreateGuidedSession(recommendation.topic, recommendation.type === 'remediation' ? 'Interview Remediation' : 'Concept Learning')} style={{ cursor: 'pointer', marginBottom: '8px' }}>
                        <span>{recommendation.topic}</span>
                        <span className="r2d-rec-arrow">›</span>
                      </div>
                      <p className="r2d-rec-why" style={{ marginTop: '8px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                        <strong>Why?</strong> {recommendation.reason}
                      </p>
                      {recommendation.pathway && recommendation.pathway.length > 0 && (
                        <div style={{ marginTop: '10px', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ color: 'var(--text-secondary)', fontWeight: 'bold' }}>Suggested Pathway:</span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
                            {recommendation.pathway.map((p, idx) => (
                              <React.Fragment key={idx}>
                                {idx > 0 && <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>➔</span>}
                                <span style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)', padding: '2px 6px', borderRadius: '4px', color: '#fff' }}>{p}</span>
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="r2d-empty-state">
                      Complete a learning mission or interview to receive recommendations.
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
                      No activity recorded yet.
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
                        onClick={() => openLearningSession(s)}
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
              {isProjectDefenseSession && projectContext?.fallbackMode?.active === true && (
                <span className="pd-generic-badge">Generic</span>
              )}
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

                {/* Verified mastery gauge */}
                <div style={{ background: 'var(--background)', border: '1px solid var(--border)', padding: '18px 24px', borderRadius: '12px', marginBottom: '28px', textAlign: 'left' }}>
                  <strong style={{ color: 'var(--text-secondary)', fontSize: '12.5px', display: 'block', marginBottom: '10px' }}>Verified Competency Progress:</strong>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Verified</span>
                    <div style={{ flex: 1, height: '10px', background: 'var(--border)', borderRadius: '5px', overflow: 'hidden', position: 'relative' }}>
                      <div style={{ width: `${activeSession.masteryPercentage}%`, height: '100%', background: '#34d399', borderRadius: '5px', position: 'absolute', top: 0, left: 0, zIndex: 2 }} />
                    </div>
                    <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 'bold' }}>{activeSession.masteryPercentage}%</span>
                  </div>
                </div>

                {recommendationTopic ? (
                  <div className="completion-recommendation" style={{ background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.15)', padding: '20px', borderRadius: '12px', marginBottom: '28px', textAlign: 'left' }}>
                    <div className="rec-badge" style={{ background: 'var(--secondary-translucent)', color: 'var(--secondary-hover)', padding: '2px 6px', borderRadius: '3px', fontSize: '9px', fontWeight: 'bold', display: 'inline-block', marginBottom: '8px' }}>RECOMMENDED NEXT</div>
                    <h3 style={{ fontSize: '14px', color: '#fff', margin: '0 0 4px', fontWeight: '800' }}>{recommendationTopic}</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 14px' }}>Generated from completed user-owned learning evidence.</p>
                    <button className="start-rec-btn" onClick={() => handleCreateGuidedSession(recommendationTopic, 'Concept Learning')} style={{ width: '100%', background: 'var(--secondary)', border: 'none', color: '#fff', padding: '10px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>
                      Start Recommended Mission
                    </button>
                  </div>
                ) : (
                  <div className="r2d-empty-state" style={{ marginBottom: '28px', textAlign: 'left' }}>
                    Complete a learning mission or interview to receive recommendations.
                  </div>
                )}

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
                  {isProjectDefenseSession && !projectDefenseInterviewActive ? (
                    <div className="pd-chat-blocked">
                      <p>
                        {!projectDefenseScanned
                          ? 'Please connect a GitHub repository or local project folder before starting Project Defense. Use the Workspace panel.'
                          : 'Review the analysis report and click Start Defense in the Workspace panel.'}
                      </p>
                      <button
                        type="button"
                        className="pd-chat-blocked__btn"
                        onClick={() => setMobilePane('workspace')}
                      >
                        Open Workspace
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSendMessage} className="chat-input-wrapper">
                      <input 
                        type="text" 
                        className="chat-input"
                        placeholder={isProjectDefenseSession ? "Answer the Critic's question..." : "Ask your Mentor about hooks, variables, performance..."}
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                        disabled={isProjectDefenseSession && !projectDefenseInterviewActive}
                      />
                      <button type="submit" className="send-btn" disabled={isProjectDefenseSession && !projectDefenseInterviewActive}>
                        <Send size={14} />
                      </button>
                    </form>
                  )}
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
                  <ProjectDefenseWorkspace
                    activeSession={activeSession}
                    projectContext={projectContext}
                    apiBase={API_BASE}
                    getHeaders={getHeaders}
                    makeTraceableRequest={makeTraceableRequest}
                    onSessionUpdated={handleProjectDefenseSessionUpdated}
                    defenseAnswer={defenseAnswer}
                    setDefenseAnswer={setDefenseAnswer}
                    onSubmitDefenseAnswer={handleSubmitDefenseAnswer}
                    isSubmittingDefense={isSubmittingDefense}
                    top25Expanded={top25QuestionsExpanded}
                    setTop25Expanded={setTop25QuestionsExpanded}
                  />
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

