import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiMic, FiSend, FiRefreshCw, FiSkipForward, FiSave, FiPlay, FiClock, FiMessageCircle, FiDownload, FiCheckCircle } from 'react-icons/fi';
import useZenuxAuth from '../hooks/useZenuxAuth';
import useAuth from '../hooks/useAuth';
import './InterviewPrep.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5500/api';

// --- Icon Components (Real SVG Icons) ---
const MongoDBIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.193 9.555c-1.264-5.58-4.252-7.414-4.573-8.115-.28-.394-.53-.954-.735-1.44-.036.495-.055.685-.523 1.184-.723.566-4.438 3.682-4.74 10.02-.282 6.002 4.384 9.336 5.022 9.693.52.294.638.353.944.112.374-.293.536-.466.837-1.12.5-.99.867-2.717.768-4.334z"/>
  </svg>
);

const ExpressIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 18.588l-1.137-1.347c-.813.906-1.531 1.384-2.522 1.384-1.528 0-2.556-1.303-2.556-3.112 0-1.809 1.028-3.112 2.556-3.112.991 0 1.709.478 2.522 1.384L24 10.588c-1.05-1.2-2.456-1.953-4.113-1.953-2.947 0-5.175 2.206-5.175 5.3 0 3.094 2.228 5.3 5.175 5.3 1.657 0 3.063-.753 4.113-1.953z"/>
  </svg>
);

const ReactIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 14.964c-2.168 0-3.964-1.772-3.964-3.964 0-2.191 1.796-3.964 3.964-3.964 2.168 0 3.964 1.773 3.964 3.964 0 2.192-1.796 3.964-3.964 3.964zm0-1.5c1.38 0 2.5-1.12 2.5-2.5s-1.12-2.5-2.5-2.5-2.5 1.12-2.5 2.5 1.12 2.5 2.5 2.5z"/>
    <path d="M12 21.964c-1.713 0-3.157-.602-4.2-1.607-1.044-1.005-1.582-2.324-1.529-3.781.052-1.456.682-2.849 1.821-4.012 1.138-1.163 2.635-1.915 4.281-2.166.06-.009.12-.009.18 0 1.646.251 3.143 1.003 4.281 2.166 1.139 1.163 1.769 2.556 1.821 4.012.053 1.457-.485 2.776-1.529 3.781C15.157 21.362 13.713 21.964 12 21.964z"/>
  </svg>
);

const NodeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L2 7.5v9L12 22l10-5.5v-9L12 2zM12 4.5l7.5 4.125v5.625L12 18.75l-7.5-4.125V8.625L12 4.5z"/>
  </svg>
);

const SQLIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 4.5 2 7.5v9C2 19.5 6.48 22 12 22s10-2.5 10-5.5v-9C22 4.5 17.52 2 12 2zm0 4c3.31 0 6 1.34 6 3s-2.69 3-6 3-6-1.34-6-3 2.69-3 6-3z"/>
  </svg>
);

const PHPIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
  </svg>
);

const LaravelIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L2 7v10l10 5 10-5V7l-10-5z"/>
  </svg>
);

const DjangoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.146 2.5c.445.139.89.278 1.335.417 2.225.834 4.45 1.668 6.675 2.502.223.084.445.167.668.25v11.673c0 .668-.668 1.113-1.335.834-2.225-.834-4.45-1.668-6.675-2.502-.223-.084-.445-.167-.668-.25V2.5z"/>
  </svg>
);

const NextIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15h-2V7h2v10zm6-10v10h-2V7h2z"/>
  </svg>
);

const WordPressIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM6.5 9h11c.78 0 1.5.67 1.5 1.5s-.72 1.5-1.5 1.5h-11c-.78 0-1.5-.67-1.5-1.5S5.72 9 6.5 9z"/>
  </svg>
);

const CIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
  </svg>
);

const CPPIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
  </svg>
);

const JavaIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
  </svg>
);

const PythonIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
  </svg>
);

const SpringIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
  </svg>
);

const DotNetIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
  </svg>
);

const AndroidIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24c-2.86-1.21-6.08-1.21-8.94 0L5.65 5.67c-.19-.29-.58-.38-.87-.2-.28.18-.37.54-.22.83l1.84 3.18C4.25 11.1 3 13.83 3 17h18c0-3.17-1.25-5.9-3.4-7.52z"/>
  </svg>
);

const KotlinIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
  </svg>
);

const FlutterIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
  </svg>
);

const ReactNativeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
  </svg>
);

// --- Stack Icon Groups ---
const StackIcons = ({ stackId }) => {
  const iconStyle = { display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap', alignItems: 'center' };
  
  switch(stackId) {
    case 'mern':
      return (
        <div style={iconStyle}>
          <MongoDBIcon /><span style={{ fontSize: '10px', color: '#a0a0a0' }}>MongoDB</span>
          <ExpressIcon /><span style={{ fontSize: '10px', color: '#a0a0a0' }}>Express</span>
          <ReactIcon /><span style={{ fontSize: '10px', color: '#a0a0a0' }}>React</span>
          <NodeIcon /><span style={{ fontSize: '10px', color: '#a0a0a0' }}>Node.js</span>
        </div>
      );
    case 'sern':
      return (
        <div style={iconStyle}>
          <SQLIcon /><span style={{ fontSize: '10px', color: '#a0a0a0' }}>SQL</span>
          <ExpressIcon /><span style={{ fontSize: '10px', color: '#a0a0a0' }}>Express</span>
          <ReactIcon /><span style={{ fontSize: '10px', color: '#a0a0a0' }}>React</span>
          <NodeIcon /><span style={{ fontSize: '10px', color: '#a0a0a0' }}>Node.js</span>
        </div>
      );
    case 'laravel':
      return (
        <div style={iconStyle}>
          <PHPIcon /><span style={{ fontSize: '10px', color: '#a0a0a0' }}>PHP</span>
          <LaravelIcon /><span style={{ fontSize: '10px', color: '#a0a0a0' }}>Laravel</span>
        </div>
      );
    case 'django':
      return (
        <div style={iconStyle}>
          <DjangoIcon /><span style={{ fontSize: '10px', color: '#a0a0a0' }}>Django</span>
          <ReactIcon /><span style={{ fontSize: '10px', color: '#a0a0a0' }}>React</span>
        </div>
      );
    case 'nextjs':
      return (
        <div style={iconStyle}>
          <NextIcon /><span style={{ fontSize: '10px', color: '#a0a0a0' }}>Next.js</span>
          <ReactIcon /><span style={{ fontSize: '10px', color: '#a0a0a0' }}>React</span>
        </div>
      );
    case 'wp':
      return (
        <div style={iconStyle}>
          <WordPressIcon /><span style={{ fontSize: '10px', color: '#a0a0a0' }}>WordPress</span>
          <PHPIcon /><span style={{ fontSize: '10px', color: '#a0a0a0' }}>PHP</span>
        </div>
      );
    case 'c':
      return (
        <div style={iconStyle}>
          <CIcon /><span style={{ fontSize: '10px', color: '#a0a0a0' }}>C</span>
        </div>
      );
    case 'cpp':
      return (
        <div style={iconStyle}>
          <CPPIcon /><span style={{ fontSize: '10px', color: '#a0a0a0' }}>C++</span>
        </div>
      );
    case 'java':
      return (
        <div style={iconStyle}>
          <JavaIcon /><span style={{ fontSize: '10px', color: '#a0a0a0' }}>Java</span>
        </div>
      );
    case 'python':
      return (
        <div style={iconStyle}>
          <PythonIcon /><span style={{ fontSize: '10px', color: '#a0a0a0' }}>Python</span>
        </div>
      );
    case 'spring':
      return (
        <div style={iconStyle}>
          <JavaIcon /><span style={{ fontSize: '10px', color: '#a0a0a0' }}>Java</span>
          <SpringIcon /><span style={{ fontSize: '10px', color: '#a0a0a0' }}>Spring Boot</span>
        </div>
      );
    case 'dotnet':
      return (
        <div style={iconStyle}>
          <DotNetIcon /><span style={{ fontSize: '10px', color: '#a0a0a0' }}>.NET</span>
        </div>
      );
    case 'android-java':
      return (
        <div style={iconStyle}>
          <AndroidIcon /><span style={{ fontSize: '10px', color: '#a0a0a0' }}>Android</span>
          <JavaIcon /><span style={{ fontSize: '10px', color: '#a0a0a0' }}>Java</span>
        </div>
      );
    case 'android-kotlin':
      return (
        <div style={iconStyle}>
          <AndroidIcon /><span style={{ fontSize: '10px', color: '#a0a0a0' }}>Android</span>
          <KotlinIcon /><span style={{ fontSize: '10px', color: '#a0a0a0' }}>Kotlin</span>
        </div>
      );
    case 'flutter':
      return (
        <div style={iconStyle}>
          <FlutterIcon /><span style={{ fontSize: '10px', color: '#a0a0a0' }}>Flutter</span>
        </div>
      );
    case 'react-native':
      return (
        <div style={iconStyle}>
          <ReactNativeIcon /><span style={{ fontSize: '10px', color: '#a0a0a0' }}>React Native</span>
          <ReactIcon /><span style={{ fontSize: '10px', color: '#a0a0a0' }}>React</span>
        </div>
      );
    default:
      return null;
  }
};

// --- Data with Real Icons ---
const FIELDS = [
  {
    id: "web-development", name: "Web Development", desc: "Frontend, Backend and Full Stack Development", 
    icon: "</>", iconBg: "#1e2d40", iconColor: "#38bdf8",
    stacks: [
      { id: "mern", name: "MERN Stack", desc: "MongoDB, Express, React and Node.js full stack." },
      { id: "sern", name: "SERN Stack", desc: "SQL, Express, React and Node.js full stack." },
      { id: "laravel", name: "PHP + Laravel", desc: "Backend development using PHP with Laravel." },
      { id: "django", name: "Django + React", desc: "Django backend with React frontend." },
      { id: "nextjs", name: "Next.js Stack", desc: "Modern React framework with SSR and APIs." },
      { id: "wp", name: "WordPress Dev", desc: "CMS-based web development using WordPress." },
    ]
  },
  {
    id: "software-development", name: "Software Development", desc: "Programming & Software Engineering", 
    icon: "⚙️", iconBg: "#2d1f40", iconColor: "#a78bfa",
    stacks: [
      { id: "c", name: "C Programming", desc: "Core programming fundamentals using C." },
      { id: "cpp", name: "C++ with DSA", desc: "Data structures and algorithms using C++." },
      { id: "java", name: "Java Development", desc: "OOP and backend development using Java." },
      { id: "python", name: "Python Dev", desc: "Programming and backend using Python." },
      { id: "spring", name: "Java + Spring Boot", desc: "Enterprise backend using Spring Boot." },
      { id: "dotnet", name: "C# + .NET", desc: "Backend and enterprise dev using .NET." },
    ]
  },
  { id: "data-analyst", name: "Data Analyst", desc: "Data Analysis & Visualization", 
    icon: "📊", iconBg: "#1f2e1a", iconColor: "#4ade80", stacks: [] },
  { id: "data-science", name: "Data Science", desc: "Machine Learning & Artificial Intelligence", 
    icon: "🧠", iconBg: "#2a1f35", iconColor: "#c084fc", stacks: [] },
  {
    id: "mobile-development", name: "Mobile App Development", desc: "Android, iOS & Cross Platform", 
    icon: "📱", iconBg: "#2a2210", iconColor: "#fbbf24",
    stacks: [
      { id: "android-java", name: "Android (Java)", desc: "Native Android development using Java." },
      { id: "android-kotlin", name: "Android (Kotlin)", desc: "Modern Android development using Kotlin." },
      { id: "flutter", name: "Flutter", desc: "Cross-platform mobile using Flutter." },
      { id: "react-native", name: "React Native", desc: "Cross-platform mobile using React Native." },
    ]
  },
  { id: "devops-cloud", name: "DevOps & Cloud", desc: "Cloud, DevOps & Infrastructure", 
    icon: "☁️", iconBg: "#102230", iconColor: "#38bdf8", stacks: [] },
];

const EXP = [
  { id: "fresher", emoji: "🌱", label: "Fresher", years: "0 – 6 months" },
  { id: "junior", emoji: "🚀", label: "Junior", years: "6 months – 1 year" },
  { id: "mid", emoji: "💼", label: "Mid-Level", years: "1 – 3 years" },
  { id: "senior", emoji: "🏆", label: "Senior", years: "3+ years" },
];

const INTERVIEW_TYPES = [
  { id: "technical", label: "Technical", desc: "Core concepts, coding, debugging and system thinking." },
  { id: "hr", label: "HR", desc: "Communication, motivation, goals and workplace readiness." },
  { id: "behavioral", label: "Behavioral", desc: "Past projects, ownership, conflict and collaboration." },
  { id: "mixed", label: "Mixed", desc: "Balanced technical, HR and behavioral preparation." },
];

const formatTimer = (seconds) => {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

const simpleMarkdown = (text = '') => {
  const parts = text.split(/(```[\s\S]*?```|`[^`]+`)/g);
  return parts.map((part, index) => {
    if (!part) return null;
    if (part.startsWith('```') && part.endsWith('```')) {
      const code = part.slice(3, -3).trim();
      return (
        <pre className="code-block" key={index}>
          {code}
        </pre>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code className="inline-code" key={index}>
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={index}>{part}</span>;
  });
};

const buildFeedback = (answer, question, index) => {
  const trimmed = answer.trim();
  const baseScore = Math.min(92, Math.max(55, Math.round(trimmed.length / 1.4)));
  const accuracy = Math.max(60, Math.min(95, baseScore));
  const communication = Math.max(55, Math.min(95, Math.round(baseScore * 0.92)));
  const technical = Math.max(50, Math.min(95, Math.round(baseScore * 0.88)));
  const confidence = Math.round((accuracy + communication + technical) / 3);
  const weaknesses = [];
  if (trimmed.length < 90) weaknesses.push('Add more technical depth and specific examples.');
  if (!/performance|scalability|security|database|architecture|API|algorithm/i.test(trimmed)) weaknesses.push('Include architecture or design terms to strengthen your answer.');
  if (!/first|next|then|finally|because/i.test(trimmed)) weaknesses.push('Use clear structure and transition language for better flow.');
  const missingPoints = weaknesses.length ? weaknesses.join(' ') : 'Good coverage with a professional tone.';
  const improvedAnswer = trimmed
    ? `A polished professional response: ${trimmed.charAt(0).toUpperCase() + trimmed.slice(1)}.`
    : 'A strong answer should include a concise explanation, a technical example, and a structured outcome.';
  const tips = [
    'Keep your answers structured with situation, action, result.',
    'Mention specific tools or frameworks when relevant.',
    'Clarify the trade-offs behind your choices.',
  ];

  return {
    id: `ai-feedback-${index}-${Date.now()}`,
    role: 'ai',
    type: 'feedback',
    analysis: {
      correctness: accuracy >= 85 ? 'Strong' : accuracy >= 70 ? 'Good' : 'Needs improvement',
      technicalDepth: technical >= 78 ? 'Deep' : technical >= 65 ? 'Moderate' : 'Basic',
      communication: communication >= 80 ? 'Clear' : communication >= 65 ? 'Solid' : 'Could improve',
      missingPoints,
      confidence: `${confidence}%`,
    },
    improvedAnswer,
    tips,
    score: {
      accuracy,
      confidence,
      technical,
      communication,
    },
    timestamp: new Date().toISOString(),
  };
};

const buildInterviewSummary = (messages, totalQuestions) => {
  const feedbackMessages = messages.filter((message) => message.type === 'feedback');
  const scores = feedbackMessages.reduce(
    (acc, message) => {
      if (message.score) {
        acc.accuracy += message.score.accuracy || 0;
        acc.technical += message.score.technical || 0;
        acc.communication += message.score.communication || 0;
        acc.confidence += message.score.confidence || 0;
      }
      return acc;
    },
    { accuracy: 0, technical: 0, communication: 0, confidence: 0 }
  );
  const count = Math.max(1, feedbackMessages.length);
  const overall = Math.round((scores.accuracy + scores.technical + scores.communication + scores.confidence) / (count * 4));

  return {
    overallScore: overall,
    completed: feedbackMessages.length,
    totalQuestions,
    strengths: [
      'Clear professional tone',
      'Helpful action-oriented structure',
      'Relevant technical examples',
    ],
    weaknesses: [
      'Improve depth on edge cases',
      'Add more architecture reasoning',
      'Be more explicit about trade-offs',
    ],
    recommendedTopics: ['System design', 'API best practices', 'Performance optimization'],
    readiness:
      overall >= 85
        ? 'Interview-ready'
        : overall >= 70
        ? 'Strong candidate with room to polish'
        : 'Needs more focused practice',
  };
};

const buildMessageId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

// --- Helper Components ---
const HistoryButton = () => (
  <button className="btn-history">
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
    View History
  </button>
);

const Step = ({ number, isActive, isDone, label, detail }) => {
  let stepClass = 'step';
  if (isActive) stepClass += ' active';
  if (isDone) stepClass += ' done';
  if (!isActive && !isDone) stepClass += ' inactive';

  return (
    <div className={stepClass}>
      <div className="step-circle">{number}</div>
      <div className="step-info">
        <strong>{label}</strong>
        <span>{detail}</span>
      </div>
    </div>
  );
};

const StepLine = ({ isDone }) => <div className={`step-line${isDone ? ' done' : ''}`}></div>;

const InfoNote = () => (
  <div className="info-note">
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
    Don't worry! You can change your preferences anytime before starting the interview.
  </div>
);

const InterviewAccessModal = ({ isOpen, onClose, onContinueGuest, onLogin }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="access-modal-overlay">
        <motion.div
          className="access-modal"
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
        >
          <button className="access-modal-close" onClick={onClose} aria-label="Close modal">×</button>
          <div className="access-modal-header">
            <div className="access-modal-badge">Premium Access</div>
            <h2>Unlock the Full SAAS Experience</h2>
            <p>
              Dear User, if you want to get the complete experience of our platform and maximize your interview preparation journey,
              please log in to your account.
            </p>
          </div>

          <div className="access-benefits">
            <div className="benefit-item">
              <FiCheckCircle size={18} />
              <span>Your interview chats and sessions will be automatically saved.</span>
            </div>
            <div className="benefit-item">
              <FiCheckCircle size={18} />
              <span>View your interview performance and scores on the Score Page.</span>
            </div>
            <div className="benefit-item">
              <FiCheckCircle size={18} />
              <span>Track your progress over time.</span>
            </div>
            <div className="benefit-item">
              <FiCheckCircle size={18} />
              <span>Share your achievements directly on LinkedIn, Twitter/X, or any social platform.</span>
            </div>
            <div className="benefit-item">
              <FiCheckCircle size={18} />
              <span>Generate a public scorecard link.</span>
            </div>
            <div className="benefit-item">
              <FiCheckCircle size={18} />
              <span>Embed your scorecard directly into your portfolio website or personal site.</span>
            </div>
            <div className="benefit-item">
              <FiCheckCircle size={18} />
              <span>Access your complete interview history anytime.</span>
            </div>
          </div>

          <div className="access-actions">
            <button className="btn-ghost" onClick={onContinueGuest}>Continue as Guest</button>
            <button className="btn-primary" onClick={onLogin}>Login</button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// --- Main Component ---
const InterviewPrep = () => {
  const getInitialValue = (key, defaultValue) => {
    try {
      const storedSessionId = localStorage.getItem('road2dev-interview-session-id');
      const savedLocalRaw = localStorage.getItem('road2dev-interview');
      if (storedSessionId && savedLocalRaw) {
        const parsed = JSON.parse(savedLocalRaw);
        const parsedId = parsed?.interviewSession?._id || parsed?.interviewSession?.id;
        if (parsedId === storedSessionId) {
          switch (key) {
            case 'chatMessages':
              return parsed.chatMessages || defaultValue;
            case 'interviewStarted':
              return parsed.interviewStarted ?? defaultValue;
            case 'currentQuestionIndex':
              return parsed.currentQuestionIndex ?? defaultValue;
            case 'timerSeconds':
              return parsed.timerSeconds ?? defaultValue;
            case 'interviewCompleted':
              return parsed.interviewCompleted ?? defaultValue;
            case 'savedInterview':
              return parsed;
            case 'sessionId':
              return parsedId;
            case 'interviewSession':
              return parsed.interviewSession || null;
            case 'currentStep':
              return parsed.interviewSession?.status === 'draft' ? 5 : defaultValue;
            default:
              return defaultValue;
          }
        }
      }
    } catch (e) {
      console.warn('Error reading initial value from local storage:', e);
    }
    return defaultValue;
  };

  const [sessionId, setSessionId] = useState(() => getInitialValue('sessionId', null));
  const [rawInterviewSession, setRawInterviewSession] = useState(() => getInitialValue('interviewSession', null));
  
  const setInterviewSession = (session) => {
    if (session) {
      if (!Array.isArray(session.questions) || session.questions.length === 0) {
        session.questions = [
          {
            question: 'Walk me through a recent technical problem you solved and the tradeoffs you considered.',
            difficulty: 'Medium',
            expectedFocus: 'Technical tradeoffs and problem-solving.',
            followUps: [],
          },
          {
            question: 'Explain a core concept from your selected domain as if you were mentoring a junior developer.',
            difficulty: 'Medium',
            expectedFocus: 'Clear conceptual explanation.',
            followUps: [],
          },
          {
            question: 'Describe how you debug a production issue under time pressure.',
            difficulty: 'Medium',
            expectedFocus: 'Debugging process and mitigation.',
            followUps: [],
          }
        ];
      }
    }
    setRawInterviewSession(session);
  };
  const interviewSession = rawInterviewSession;

  const [currentStep, setCurrentStep] = useState(() => getInitialValue('currentStep', 1));
  const [selectedField, setSelectedField] = useState(() => {
    const session = getInitialValue('interviewSession', null);
    if (session?.field) {
      const foundField = FIELDS.find((f) => f.name === session.field);
      return foundField ? foundField.id : null;
    }
    return null;
  });
  
  const [selectedStack, setSelectedStack] = useState(() => {
    const session = getInitialValue('interviewSession', null);
    if (session?.field && session?.stack) {
      const foundField = FIELDS.find((f) => f.name === session.field);
      if (foundField) {
        const foundStack = foundField.stacks.find((s) => s.name === session.stack);
        return foundStack ? foundStack.id : null;
      }
    }
    return null;
  });

  const [selectedExp, setSelectedExp] = useState(() => {
    const session = getInitialValue('interviewSession', null);
    if (session?.experience) {
      const matchedExp = EXP.find(e => e.id.toLowerCase() === session.experience.toLowerCase() || e.label.toLowerCase() === session.experience.toLowerCase());
      return matchedExp ? matchedExp.id : null;
    }
    return null;
  });

  const [selectedInterviewType, setSelectedInterviewType] = useState(() => {
    const session = getInitialValue('interviewSession', null);
    if (session?.type) {
      const matchedType = INTERVIEW_TYPES.find(t => t.id.toLowerCase() === session.type.toLowerCase() || t.label.toLowerCase() === session.type.toLowerCase());
      return matchedType ? matchedType.id : 'technical';
    }
    return 'technical';
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [interviewStarted, setInterviewStarted] = useState(() => getInitialValue('interviewStarted', false));
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(() => getInitialValue('currentQuestionIndex', 0));
  const [chatMessages, setChatMessages] = useState(() => getInitialValue('chatMessages', []));
  const [messageInput, setMessageInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(() => getInitialValue('timerSeconds', 0));
  const [interviewCompleted, setInterviewCompleted] = useState(() => getInitialValue('interviewCompleted', false));
  const [savedInterview, setSavedInterview] = useState(() => getInitialValue('savedInterview', null));
  const abortControllerRef = useRef(null);
  const chatEndRef = useRef(null);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [hasSeenAccessModal, setHasSeenAccessModal] = useState(false);
  const [guestAccessConfirmed, setGuestAccessConfirmed] = useState(false);
  const [showEndConfirmModal, setShowEndConfirmModal] = useState(false);
  const [showAbandonConfirmModal, setShowAbandonConfirmModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle');
  const navigate = useNavigate();
  const customAuth = useAuth();
  const zenuxAuth = useZenuxAuth();
  const isAuthenticated = customAuth.isAuthenticated || zenuxAuth.isAuthenticated;
  const loadingAuth = customAuth.loading || zenuxAuth.loading;

  const selectedFieldData = FIELDS.find((f) => f.id === selectedField);
  const selectedStackData = selectedFieldData?.stacks.find((s) => s.id === selectedStack);
  const selectedExpData = EXP.find((e) => e.id === selectedExp);
  const selectedTypeData = INTERVIEW_TYPES.find((type) => type.id === selectedInterviewType);
  const hasStacks = selectedFieldData && selectedFieldData.stacks.length > 0;
  const totalQuestions = interviewSession?.questions?.length || 0;

  const getAuthToken = () => {
    return localStorage.getItem('auth_token');
  };

  const computeSessionScore = (messages = []) => {
    if (!messages.length) return 0;
    const feedbackMessages = messages.filter((msg) => msg.type === 'feedback');
    if (!feedbackMessages.length) return 0;

    const totals = feedbackMessages.reduce(
      (acc, message) => {
        acc.accuracy += message.score?.accuracy || 0;
        acc.technical += message.score?.technical || 0;
        acc.communication += message.score?.communication || 0;
        acc.confidence += message.score?.confidence || 0;
        return acc;
      },
      { accuracy: 0, technical: 0, communication: 0, confidence: 0 }
    );

    const count = feedbackMessages.length;
    return Math.round((totals.accuracy + totals.technical + totals.communication + totals.confidence) / (count * 4));
  };

  const buildSessionPayload = ({ messages = chatMessages, statusOverride, scoreOverride, feedbackOverride, currentQuestionIndexOverride, questionsOverride, tipsOverride } = {}) => {
    const payloadScore =
      typeof scoreOverride === 'number'
        ? scoreOverride
        : interviewCompleted
        ? buildInterviewSummary(messages, totalQuestions).overallScore
        : computeSessionScore(messages);
    const summary = interviewCompleted ? buildInterviewSummary(messages, totalQuestions) : null;

    const indexToSave = typeof currentQuestionIndexOverride === 'number' ? currentQuestionIndexOverride : currentQuestionIndex;
    const questionsToSave = questionsOverride || interviewSession?.questions || [];
    const tipsToSave = tipsOverride || interviewSession?.tips || [];

    return {
      title: interviewSession?.title || 'Interview Session',
      field: selectedFieldData?.name || '',
      stack: selectedStackData?.name || '',
      experience: selectedExp || '',
      type: selectedInterviewType || '',
      status:
        statusOverride ||
        (interviewCompleted ? 'completed' : interviewStarted ? 'active' : 'draft'),
      score: payloadScore,
      messages,
      feedback: feedbackOverride ?? (summary ? summary.readiness : ''),
      questions: questionsToSave,
      tips: tipsToSave,
      currentQuestionIndex: indexToSave,
      totalQuestions: questionsToSave.length,
      completedQuestions: messages.filter((m) => m.type === 'feedback').length,
      skippedQuestions: messages.filter((m) => m.type === 'note' && m.text.includes('Skipping')).length,
      timerState: timerSeconds,
      difficulty: questionsToSave[indexToSave]?.difficulty || 'Medium',
    };
  };

  const saveInterviewSessionToServer = async (overrides = {}) => {
    const authToken = getAuthToken();
    if (!authToken) return;

    const payload = buildSessionPayload(overrides);
    const url = sessionId
      ? `${API_BASE}/interview-sessions/${sessionId}`
      : `${API_BASE}/interview-sessions`;
    const method = sessionId ? 'PUT' : 'POST';

    // Synchronize to localStorage in real-time
    try {
      const activeId = sessionId || rawInterviewSession?._id || rawInterviewSession?.id;
      if (activeId) {
        const syncedLocal = {
          interviewSession: {
            ...rawInterviewSession,
            ...payload,
            _id: activeId,
          },
          chatMessages: payload.messages,
          currentQuestionIndex: payload.currentQuestionIndex,
          timerSeconds: payload.timerState,
          interviewStarted: payload.status === 'active' || payload.status === 'incomplete' || payload.status === 'in_progress',
          interviewCompleted: payload.status === 'completed',
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem('road2dev-interview', JSON.stringify(syncedLocal));
        setSavedInterview(syncedLocal);
      }
    } catch (e) {
      console.warn('Failed to sync to local storage during autosave:', e);
    }

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        console.warn('Interview session autosave failed:', data?.message || res.statusText);
        return;
      }

      if (data?.data) {
        setInterviewSession(data.data);
        if (!sessionId) {
          const newId = data.data._id || data.data.id;
          setSessionId(newId);
          localStorage.setItem('road2dev-interview-session-id', newId);

          // Write to road2dev-interview cache with the newly created ID
          const syncedLocal = {
            interviewSession: data.data,
            chatMessages: payload.messages,
            currentQuestionIndex: payload.currentQuestionIndex,
            timerSeconds: payload.timerState,
            interviewStarted: payload.status === 'active' || payload.status === 'incomplete' || payload.status === 'in_progress',
            interviewCompleted: payload.status === 'completed',
            savedAt: new Date().toISOString(),
          };
          localStorage.setItem('road2dev-interview', JSON.stringify(syncedLocal));
          setSavedInterview(syncedLocal);
        }
      }

      window.dispatchEvent(new Event('interview-sessions-updated'));
    } catch (saveError) {
      console.warn('Interview session autosave error:', saveError);
    }
  };

  useEffect(() => {
    abortControllerRef.current?.abort();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const authToken = getAuthToken();
    const storedSessionId = localStorage.getItem('road2dev-interview-session-id');
    const savedLocalRaw = localStorage.getItem('road2dev-interview');
    
    let targetSessionId = storedSessionId;
    if (!targetSessionId && savedLocalRaw) {
      try {
        const parsed = JSON.parse(savedLocalRaw);
        targetSessionId = parsed?.interviewSession?._id || parsed?.interviewSession?.id;
      } catch (e) {}
    }

    if (!targetSessionId) {
      setSessionId('');
      setInterviewSession(null);
      setSavedInterview(null);
      return;
    }

    if (!authToken) {
      return;
    }

    const restoreSavedSession = async () => {
      try {
        const response = await fetch(`${API_BASE}/interview-sessions/${targetSessionId}`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.success || !data?.data) {
          console.warn('Session recovery failed or session deleted from backend. Cleaning up stale cache.');
          localStorage.removeItem('road2dev-interview-session-id');
          localStorage.removeItem('road2dev-interview');
          setSessionId('');
          setInterviewSession(null);
          setSavedInterview(null);
          setChatMessages([]);
          setTimerSeconds(0);
          setInterviewStarted(false);
          setInterviewCompleted(false);
          setCurrentQuestionIndex(0);
          setCurrentStep(1);
          return;
        }

        const serverSession = data.data;

        if (serverSession.status === 'completed' || serverSession.status === 'abandoned') {
          console.warn('Recovered session is finalized. Cleaning up active session indicators.');
          localStorage.removeItem('road2dev-interview-session-id');
          localStorage.removeItem('road2dev-interview');
          setSessionId('');
          setInterviewSession(null);
          setSavedInterview(null);
          return;
        }

        setInterviewSession(serverSession);
        setSessionId(serverSession._id || serverSession.id);
        const restoredMessages = Array.isArray(serverSession.messages) ? serverSession.messages : [];
        setChatMessages(restoredMessages);

        const syncedLocal = {
          interviewSession: serverSession,
          chatMessages: restoredMessages,
          currentQuestionIndex: serverSession.currentQuestionIndex || 0,
          timerSeconds: serverSession.timerState || 0,
          interviewStarted: serverSession.status === 'active' || serverSession.status === 'incomplete' || serverSession.status === 'in_progress',
          interviewCompleted: false,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem('road2dev-interview', JSON.stringify(syncedLocal));
        localStorage.setItem('road2dev-interview-session-id', serverSession._id || serverSession.id);
        setSavedInterview(syncedLocal);

        const foundField = FIELDS.find((f) => f.name === serverSession.field);
        if (foundField) {
          setSelectedField(foundField.id);
          const foundStack = foundField.stacks.find((s) => s.name === serverSession.stack);
          if (foundStack) {
            setSelectedStack(foundStack.id);
          }
        }
        if (serverSession.experience) {
          const matchedExp = EXP.find(e => e.id.toLowerCase() === serverSession.experience.toLowerCase() || e.label.toLowerCase() === serverSession.experience.toLowerCase());
          if (matchedExp) setSelectedExp(matchedExp.id);
        }
        if (serverSession.type) {
          const matchedType = INTERVIEW_TYPES.find(t => t.id.toLowerCase() === serverSession.type.toLowerCase() || t.label.toLowerCase() === serverSession.type.toLowerCase());
          if (matchedType) setSelectedInterviewType(matchedType.id);
        }

        if (serverSession.status === 'draft') {
          setCurrentStep(5);
        }

        const questionMessages = restoredMessages.filter((message) => message.type === 'question');
        const feedbackMessages = restoredMessages.filter((message) => message.type === 'feedback');
        
        let restoredIndex = Math.max(0, questionMessages.length - 1);
        let shouldAutoAsk = false;
        if (restoredMessages.length > 0 && restoredMessages[restoredMessages.length - 1].type === 'feedback') {
          restoredIndex = feedbackMessages.length;
          shouldAutoAsk = true;
        }

        const savedIndex = typeof serverSession.currentQuestionIndex === 'number' ? serverSession.currentQuestionIndex : restoredIndex;
        setCurrentQuestionIndex(savedIndex);
        setTimerSeconds(serverSession.timerState || 0);

        setInterviewStarted(serverSession.status === 'active' || serverSession.status === 'incomplete' || serverSession.status === 'in_progress');
        setInterviewCompleted(false);

        if (shouldAutoAsk && savedIndex < serverSession.questions.length) {
          setIsAiTyping(true);
          setTimeout(() => {
            const nextQuestion = serverSession.questions[savedIndex];
            const nextMessages = [
              ...restoredMessages,
              {
                id: buildMessageId('ai-question'),
                role: 'ai',
                type: 'question',
                question: nextQuestion,
                timestamp: new Date().toISOString(),
              },
            ];
            setChatMessages(nextMessages);
            setIsAiTyping(false);
            
            const token = getAuthToken();
            if (token) {
              const payload = {
                title: serverSession.title || 'Interview Session',
                field: serverSession.field,
                stack: serverSession.stack,
                experience: serverSession.experience,
                type: serverSession.type,
                status: 'active',
                score: serverSession.score || 0,
                messages: nextMessages,
                feedback: serverSession.feedback || '',
                questions: serverSession.questions || [],
                tips: serverSession.tips || [],
                currentQuestionIndex: savedIndex,
                totalQuestions: serverSession.questions.length,
                completedQuestions: nextMessages.filter((m) => m.type === 'feedback').length,
                skippedQuestions: nextMessages.filter((m) => m.type === 'note' && m.text.includes('Skipping')).length,
                timerState: serverSession.timerState || 0,
                difficulty: serverSession.questions[savedIndex]?.difficulty || 'Medium',
              };
              
              fetch(`${API_BASE}/interview-sessions/${serverSession._id || serverSession.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
              }).catch(err => console.warn('Restore-autosave failed:', err));
            }
          }, 900);
        }
      } catch (restoreError) {
        console.warn('Unable to restore interview session from server:', restoreError);
      }
    };

    restoreSavedSession();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!interviewStarted) return;

    const timer = setInterval(() => {
      setTimerSeconds((value) => value + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [interviewStarted]);

  useEffect(() => {
    if (!loadingAuth && !isAuthenticated && !hasSeenAccessModal && !guestAccessConfirmed) {
      setShowAccessModal(true);
      setHasSeenAccessModal(true);
    }
  }, [loadingAuth, isAuthenticated, hasSeenAccessModal, guestAccessConfirmed]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [chatMessages, isAiTyping]);

  // Persist incomplete sessions when the user closes or reloads the page.
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      try {
        const authToken = getAuthToken();
        if (!authToken) return;
        if (!interviewStarted || interviewCompleted) return;

        const payload = buildSessionPayload({ messages: chatMessages, statusOverride: 'incomplete' });
        const url = sessionId ? `${API_BASE}/interview-sessions/${sessionId}` : `${API_BASE}/interview-sessions`;
        const method = sessionId ? 'PUT' : 'POST';

        // Try a keepalive fetch; fall back to navigator.sendBeacon when possible.
        const opts = {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(payload),
          keepalive: true,
        };

        try {
          fetch(url, opts);
        } catch {
          try {
            if (navigator.sendBeacon) {
              const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
              navigator.sendBeacon(url, blob);
            }
          } catch (err) {
            // silent fallback - best effort
          }
        }
      } catch (err) {
        // best-effort only
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [interviewStarted, interviewCompleted, chatMessages, sessionId]);

  const resetGeneratedInterview = () => {
    setInterviewSession(null);
    setSessionId(null);
    localStorage.removeItem('road2dev-interview-session-id');
    localStorage.removeItem('road2dev-interview');
    setSavedInterview(null);
    setInterviewStarted(false);
    setChatMessages([]);
    setCurrentQuestionIndex(0);
    setTimerSeconds(0);
    setInterviewCompleted(false);
    setError('');
  };

  const resetSetup = () => {
    setCurrentStep(1);
    setSelectedField(null);
    setSelectedStack(null);
    setSelectedExp(null);
    setSelectedInterviewType('technical');
    resetGeneratedInterview();
  };

  const handleSelectField = (id) => {
    setSelectedField(id);
    setSelectedStack(null);
    resetGeneratedInterview();
  };

  const handleSelectStack = (id) => {
    setSelectedStack(id);
    resetGeneratedInterview();
  };

  const handleSelectExp = (id) => {
    setSelectedExp(id);
    resetGeneratedInterview();
  };

  const handleSelectInterviewType = (id) => {
    setSelectedInterviewType(id);
    resetGeneratedInterview();
  };

  const generateInterview = async () => {
    if (isGenerating || !selectedFieldData || !selectedExpData || !selectedTypeData) {
      return;
    }

    setIsGenerating(true);
    setError('');
    setInterviewSession(null);
    setInterviewStarted(false);
    setChatMessages([]);
    setInterviewCompleted(false);
    setTimerSeconds(0);

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`${API_BASE}/interview/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field: selectedFieldData.name,
          stack: selectedStackData?.name || '',
          experienceLevel: selectedExp,
          interviewType: selectedInterviewType,
        }),
        signal: abortControllerRef.current.signal,
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Unable to generate interview questions.');
      }

      setInterviewSession(result.data);
      setCurrentStep(5);
      saveInterviewSessionToServer({
        statusOverride: 'draft',
        messages: [],
        scoreOverride: 0,
        feedbackOverride: '',
        questionsOverride: result.data.questions,
        tipsOverride: result.data.tips || [],
      });
    } catch (requestError) {
      if (requestError.name !== 'AbortError') {
        setError(requestError.message || 'Unable to generate interview questions.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartInterview = () => {
    if (!interviewSession) return;
    const startingMessages = [
      {
        id: buildMessageId('ai-welcome'),
        role: 'ai',
        type: 'system',
        text: `Welcome to your ${selectedTypeData?.label ?? 'AI'} interview. Answer each question with clarity, confidence, and detail.`,
        timestamp: new Date().toISOString(),
      },
      {
        id: buildMessageId('ai-question-0'),
        role: 'ai',
        type: 'question',
        question: interviewSession.questions[0],
        timestamp: new Date().toISOString(),
      },
    ];

    setInterviewStarted(true);
    setCurrentQuestionIndex(0);
    setTimerSeconds(0);
    setInterviewCompleted(false);
    setChatMessages(startingMessages);
    saveInterviewSessionToServer({
      statusOverride: 'active',
      messages: startingMessages,
      currentQuestionIndexOverride: 0,
    });
  };

  const handleSendMessage = () => {
    const trimmed = messageInput.trim();
    if (!trimmed || !interviewSession || interviewCompleted) return;

    const question = interviewSession.questions[currentQuestionIndex];
    const userMessage = {
      id: buildMessageId('user'),
      role: 'user',
      type: 'user',
      text: trimmed,
      timestamp: new Date().toISOString(),
    };

    const afterUserMessage = [...chatMessages, userMessage];
    setChatMessages(afterUserMessage);
    setMessageInput('');
    setIsAiTyping(true);
    saveInterviewSessionToServer({
      statusOverride: 'active',
      messages: afterUserMessage,
      currentQuestionIndexOverride: currentQuestionIndex,
    });

    const feedback = buildFeedback(trimmed, question, currentQuestionIndex);
    const nextIndex = currentQuestionIndex + 1;

    setTimeout(() => {
      setChatMessages((prev) => {
        const afterFeedback = [...prev, feedback];
        saveInterviewSessionToServer({
          statusOverride: 'active',
          messages: afterFeedback,
          currentQuestionIndexOverride: currentQuestionIndex,
        });

        if (nextIndex < totalQuestions) {
          setTimeout(() => {
            const nextQuestion = interviewSession.questions[nextIndex];
            const nextMessages = [
              ...afterFeedback,
              {
                id: buildMessageId('ai-question'),
                role: 'ai',
                type: 'question',
                question: nextQuestion,
                timestamp: new Date().toISOString(),
              },
            ];
            setChatMessages(nextMessages);
            setCurrentQuestionIndex(nextIndex);
            setIsAiTyping(false);
            saveInterviewSessionToServer({
              statusOverride: 'active',
              messages: nextMessages,
              currentQuestionIndexOverride: nextIndex,
            });
          }, 900);
        } else {
          setTimeout(() => {
            const summary = buildInterviewSummary([...afterFeedback], totalQuestions);
            const summaryMessage = {
              id: buildMessageId('ai-summary'),
              role: 'ai',
              type: 'summary',
              summary,
              timestamp: new Date().toISOString(),
            };
            const completedMessages = [...afterFeedback, summaryMessage];
            setChatMessages((prevNext) => [...prevNext, summaryMessage]);
            setInterviewCompleted(true);
            setIsAiTyping(false);
            saveInterviewSessionToServer({
              statusOverride: 'completed',
              messages: completedMessages,
              scoreOverride: summary.overallScore,
              feedbackOverride: summary.readiness,
              currentQuestionIndexOverride: nextIndex,
            });
          }, 900);
        }

        return afterFeedback;
      });
    }, 1000);
  };

  const handleRetryAnswer = () => {
    if (chatMessages.length === 0) return;
    
    // Find the last user message index
    const lastUserIndex = chatMessages.map(m => m.role).lastIndexOf('user');
    if (lastUserIndex === -1) return;

    const lastUserMsg = chatMessages[lastUserIndex];
    
    // Filter out the last user message and any messages after it
    const newChatMessages = chatMessages.slice(0, lastUserIndex);
    
    setChatMessages(newChatMessages);
    setMessageInput(lastUserMsg.text);
    setInterviewCompleted(false);
    
    saveInterviewSessionToServer({
      messages: newChatMessages,
      statusOverride: 'active',
      currentQuestionIndexOverride: currentQuestionIndex,
    });
  };

  const handleRegenerateFeedback = () => {
    const lastUser = [...chatMessages].reverse().find((message) => message.role === 'user');
    const lastUserIndex = chatMessages.map(m => m.role).lastIndexOf('user');
    if (!lastUser || lastUserIndex === -1 || !interviewSession) return;

    const answeredIndex = Math.max(0, currentQuestionIndex - 1);
    const question = interviewSession.questions[answeredIndex];
    const regenerated = buildFeedback(lastUser.text, question, answeredIndex);
    setIsAiTyping(true);

    setTimeout(() => {
      setChatMessages((prev) => {
        const lastFeedbackIndex = prev.map(m => m.type).lastIndexOf('feedback');
        let newMessages = [...prev];
        if (lastFeedbackIndex !== -1 && lastFeedbackIndex > lastUserIndex) {
          newMessages.splice(lastFeedbackIndex, 1, regenerated);
        } else {
          newMessages.push(regenerated);
        }
        
        saveInterviewSessionToServer({
          statusOverride: 'active',
          messages: newMessages,
          currentQuestionIndexOverride: currentQuestionIndex,
        });
        
        return newMessages;
      });
      setIsAiTyping(false);
    }, 900);
  };

  const handleSkipQuestion = () => {
    if (!interviewSession || interviewCompleted) return;

    const noteMessage = {
      id: buildMessageId('system'),
      role: 'system',
      type: 'note',
      text: 'Skipping this question. We will continue with the next interview prompt.',
      timestamp: new Date().toISOString(),
    };

    const nextIndex = currentQuestionIndex + 1;
    const baseMessages = [...chatMessages, noteMessage];
    setChatMessages(baseMessages);

    setTimeout(() => {
      if (nextIndex < totalQuestions) {
        const nextQuestion = interviewSession.questions[nextIndex];
        const nextMessages = [
          ...baseMessages,
          {
            id: buildMessageId('ai-question'),
            role: 'ai',
            type: 'question',
            question: nextQuestion,
            timestamp: new Date().toISOString(),
          },
        ];

        setChatMessages(nextMessages);
        setCurrentQuestionIndex(nextIndex);
        saveInterviewSessionToServer({
          statusOverride: 'active',
          messages: nextMessages,
          currentQuestionIndexOverride: nextIndex,
        });
      } else {
        const summary = buildInterviewSummary(baseMessages, totalQuestions);
        const completedMessages = [
          ...baseMessages,
          {
            id: buildMessageId('ai-summary'),
            role: 'ai',
            type: 'summary',
            summary,
            timestamp: new Date().toISOString(),
          },
        ];
        setChatMessages(completedMessages);
        setInterviewCompleted(true);
        saveInterviewSessionToServer({
          statusOverride: 'completed',
          messages: completedMessages,
          scoreOverride: summary.overallScore,
          feedbackOverride: summary.readiness,
          currentQuestionIndexOverride: nextIndex,
        });
      }
    }, 850);
  };

  const handleSaveInterview = async () => {
    if (!interviewSession) return;
    setSaveStatus('saving');

    const saved = {
      interviewSession,
      chatMessages,
      currentQuestionIndex,
      timerSeconds,
      interviewStarted,
      interviewCompleted,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem('road2dev-interview', JSON.stringify(saved));
    setSavedInterview(saved);

    await saveInterviewSessionToServer();
    
    setSaveStatus('saved');
    setTimeout(() => {
      setSaveStatus('idle');
    }, 2000);
  };

  const handleContinueAsGuest = () => {
    setGuestAccessConfirmed(true);
    setShowAccessModal(false);
  };

  const handleOpenLogin = () => {
    navigate('/auth', { state: { from: '/interview' } });
  };

  const handleCloseAccessModal = () => {
    setShowAccessModal(false);
  };

  const handleResumeInterview = () => {
    if (!savedInterview) return;
    setInterviewSession(savedInterview.interviewSession);
    setChatMessages(savedInterview.chatMessages || []);
    setCurrentQuestionIndex(savedInterview.currentQuestionIndex || 0);
    setTimerSeconds(savedInterview.timerSeconds || 0);
    setInterviewStarted(savedInterview.interviewStarted ?? true);
    setInterviewCompleted(savedInterview.interviewCompleted ?? false);
  };

  const handleEndInterview = (confirmed = false) => {
    if (!interviewSession) return;

    if (!confirmed && !interviewCompleted && currentQuestionIndex < totalQuestions - 1) {
      setShowEndConfirmModal(true);
      return;
    }

    setShowEndConfirmModal(false);
    const summary = buildInterviewSummary(chatMessages, totalQuestions);
    const completedMessages = [
      ...chatMessages,
      {
        id: buildMessageId('ai-summary'),
        role: 'ai',
        type: 'summary',
        summary,
        timestamp: new Date().toISOString(),
      },
    ];
    setChatMessages(completedMessages);
    setInterviewCompleted(true);
    setIsAiTyping(false);
    saveInterviewSessionToServer({
      statusOverride: 'completed',
      messages: completedMessages,
      scoreOverride: summary.overallScore,
      feedbackOverride: summary.readiness,
      currentQuestionIndexOverride: currentQuestionIndex,
    });
  };

  const handleLeaveSession = () => {
    saveInterviewSessionToServer({
      statusOverride: 'active'
    });
    setInterviewStarted(false);
  };

  const handleAbandonInterview = async (confirmed = false) => {
    if (!confirmed) {
      setShowAbandonConfirmModal(true);
      return;
    }
    setShowAbandonConfirmModal(false);

    await saveInterviewSessionToServer({
      statusOverride: 'abandoned',
    });

    localStorage.removeItem('road2dev-interview-session-id');
    localStorage.removeItem('road2dev-interview');
    setSessionId('');
    setInterviewSession(null);
    setSavedInterview(null);
    setChatMessages([]);
    setTimerSeconds(0);
    setInterviewStarted(false);
    setInterviewCompleted(false);
    setCurrentQuestionIndex(0);
    setCurrentStep(1);
  };

  const handleDownloadReport = () => {
    const report = [`Interview Summary - ${new Date().toLocaleDateString()}`];
    const summaryMessage = chatMessages.find((msg) => msg.type === 'summary');
    if (summaryMessage?.summary) {
      report.push(`Overall score: ${summaryMessage.summary.overallScore}%`);
      report.push(`Readiness: ${summaryMessage.summary.readiness}`);
      report.push('Strengths:');
      summaryMessage.summary.strengths.forEach((item) => report.push(`- ${item}`));
      report.push('Weaknesses:');
      summaryMessage.summary.weaknesses.forEach((item) => report.push(`- ${item}`));
      report.push('Recommended topics:');
      summaryMessage.summary.recommendedTopics.forEach((item) => report.push(`- ${item}`));
    }
    const blob = new Blob([report.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'interview-report.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  const goNext = () => {
    if (currentStep === 4) {
      generateInterview();
      return;
    }

    let nextStep = currentStep + 1;
    if (currentStep === 1 && !hasStacks) {
      nextStep = 3;
    }
    setCurrentStep(nextStep);
  };

  const goBack = () => {
    if (isGenerating) return;

    let prevStep = currentStep - 1;
    if (currentStep === 3 && !hasStacks) {
      prevStep = 1;
    }
    setCurrentStep(prevStep);
  };

  const isNextDisabled = () => {
    if (isGenerating) return true;
    if (currentStep === 1) return !selectedField;
    if (currentStep === 2) return !selectedStack;
    if (currentStep === 3) return !selectedExp;
    if (currentStep === 4) return !selectedInterviewType;
    return true;
  };

  const getNextButtonText = () => {
    if (isGenerating) return 'Generating...';
    if (currentStep === 4) return 'Generate Interview';
    return 'Next';
  };

  const renderFieldScreen = () => (
    <div className={`screen ${currentStep === 1 ? 'active' : ''}`}>
      <h2>1. Choose Your Field</h2>
      <p className="sub">Select the field you want to prepare for</p>
      <div className="field-grid">
        {FIELDS.map((field) => (
          <div
            key={field.id}
            className={`field-card ${selectedField === field.id ? 'selected' : ''}`}
            onClick={() => handleSelectField(field.id)}
          >
            <div className="field-icon" style={{ background: field.iconBg, color: field.iconColor, fontSize: '20px' }}>
              {field.icon}
            </div>
            <div className="field-text" style={{ flex: 1 }}>
              <strong>{field.name}</strong>
              <span>{field.desc}</span>
            </div>
            <div className="field-radio"></div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStackScreen = () => (
    <div className={`screen ${currentStep === 2 ? 'active' : ''}`}>
      <h2>2. Choose Your Stack</h2>
      <p className="sub">Select the technology stack you work with</p>
      <div className="stack-grid">
        {selectedFieldData?.stacks.map((stack) => (
          <div
            key={stack.id}
            className={`stack-card ${selectedStack === stack.id ? 'selected' : ''}`}
            onClick={() => handleSelectStack(stack.id)}
          >
            <div className="stack-radio"></div>
            <strong>{stack.name}</strong>
            <p>{stack.desc}</p>
            <StackIcons stackId={stack.id} />
          </div>
        ))}
      </div>
    </div>
  );

  const renderExpScreen = () => (
    <div className={`screen ${currentStep === 3 ? 'active' : ''}`}>
      <h2>3. Select Experience Level</h2>
      <p className="sub">How much professional experience do you have?</p>
      <div className="exp-grid">
        {EXP.map((exp) => (
          <div
            key={exp.id}
            className={`exp-card ${selectedExp === exp.id ? 'selected' : ''}`}
            onClick={() => handleSelectExp(exp.id)}
          >
            <span className="exp-emoji">{exp.emoji}</span>
            <strong>{exp.label}</strong>
            <span>{exp.years}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderInterviewTypeScreen = () => (
    <div className={`screen ${currentStep === 4 ? 'active' : ''}`}>
      <h2>4. Select Interview Type</h2>
      <p className="sub">Choose the kind of interview session you want AI to generate</p>
      <div className="type-grid">
        {INTERVIEW_TYPES.map((type) => (
          <div
            key={type.id}
            className={`type-card ${selectedInterviewType === type.id ? 'selected' : ''}`}
            onClick={() => handleSelectInterviewType(type.id)}
          >
            <div className="type-radio"></div>
            <strong>{type.label}</strong>
            <p>{type.desc}</p>
          </div>
        ))}
      </div>
      {error && <div className="error-box">{error}</div>}
    </div>
  );

  const renderStartScreen = () => {
    const field = selectedFieldData;
    const exp = EXP.find((e) => e.id === selectedExp);
    const stack = field?.stacks.find((s) => s.id === selectedStack);
    const tags = [field?.name, stack?.name, exp?.label].filter(Boolean);

    return (
      <div className={`screen ${currentStep === 5 ? 'active' : ''}`}>
        <div className="start-summary">
          <div className="start-icon">{field?.icon}</div>
          <h3>Ready to Begin</h3>
          <p>
            Your AI interviewer is ready for <strong>{field?.name}</strong>
            {stack && ` — ${stack.name}`}. This session is tuned for <strong>{exp?.label}</strong> candidates.
          </p>
          <div className="tags">
            {tags.map((tag) => (
              <div key={tag} className="tag">
                {tag}
              </div>
            ))}
          </div>
          <div className="start-actions">
            <button className="btn-next" onClick={handleStartInterview} disabled={!interviewSession}>
              Start Interview
            </button>
            <button className="btn-back" onClick={generateInterview} disabled={isGenerating}>
              {isGenerating ? 'Regenerating...' : 'Refresh Session'}
            </button>
          </div>
          {savedInterview && (
            <div className="resume-panel">
              <span>Saved interview found.</span>
              <button className="btn-small" onClick={handleResumeInterview}>
                Resume Interview
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderChatMessage = (message) => {
    const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (message.type === 'question') {
      return (
        <div className="chat-message ai" key={message.id}>
          <div className="message-card ai-question">
            <div className="message-header">
              <div>
                <span className="message-role">AI Interviewer</span>
                <span className="message-time">{time}</span>
              </div>
              <span className="message-badge">{message.question.difficulty || 'Medium'}</span>
            </div>
            <div className="message-bubble ai-bubble">{simpleMarkdown(message.question.question)}</div>
            {message.question.followUps?.length > 0 && (
              <div className="follow-ups">
                <strong>Follow-up prompts:</strong>
                {message.question.followUps.map((followUp) => (
                  <span key={followUp}>{followUp}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (message.type === 'feedback') {
      return (
        <div className="chat-message ai" key={message.id}>
          <div className="message-card ai-feedback">
            <div className="message-header">
              <div>
                <span className="message-role">Analysis & Feedback</span>
                <span className="message-time">{time}</span>
              </div>
            </div>
            <div className="feedback-grid">
              <div className="feedback-pill">
                <strong>Correctness</strong>
                <span>{message.analysis.correctness}</span>
              </div>
              <div className="feedback-pill">
                <strong>Technical</strong>
                <span>{message.analysis.technicalDepth}</span>
              </div>
              <div className="feedback-pill">
                <strong>Communication</strong>
                <span>{message.analysis.communication}</span>
              </div>
              <div className="feedback-pill">
                <strong>Confidence</strong>
                <span>{message.analysis.confidence}</span>
              </div>
            </div>
            <div className="feedback-section">
              <strong>Missing / improvement points</strong>
              <p>{message.analysis.missingPoints}</p>
            </div>
            <div className="feedback-section">
              <strong>Polished answer</strong>
              <div className="message-bubble ai-bubble">{simpleMarkdown(message.improvedAnswer)}</div>
            </div>
            <div className="feedback-section">
              <strong>Tips</strong>
              <ul>
                {message.tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>
            <div className="score-grid">
              <div>
                <strong>Accuracy</strong>
                <span>{message.score?.accuracy ?? 0}%</span>
              </div>
              <div>
                <strong>Technical</strong>
                <span>{message.score?.technical ?? 0}%</span>
              </div>
              <div>
                <strong>Comm</strong>
                <span>{message.score?.communication ?? 0}%</span>
              </div>
              <div>
                <strong>Confidence</strong>
                <span>{message.score?.confidence ?? 0}%</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (message.type === 'summary') {
      if (!message.summary) return null;
      return (
        <div className="chat-message ai" key={message.id}>
          <div className="message-card ai-summary">
            <div className="summary-header">
              <div>
                <span className="message-role">Interview Summary</span>
                <span className="message-time">{time}</span>
              </div>
              <span className="summary-score">{message.summary.overallScore}%</span>
            </div>
            <div className="summary-grid">
              <div>
                <strong>Readiness</strong>
                <p>{message.summary.readiness}</p>
              </div>
              <div>
                <strong>Completed</strong>
                <p>{message.summary.completed} / {message.summary.totalQuestions}</p>
              </div>
            </div>
            <div className="summary-section">
              <strong>Strengths</strong>
              <ul>{message.summary.strengths.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
            <div className="summary-section">
              <strong>Weaknesses</strong>
              <ul>{message.summary.weaknesses.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
            <div className="summary-section">
              <strong>Recommended topics</strong>
              <ul>{message.summary.recommendedTopics.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
            <button className="btn-save" onClick={handleDownloadReport}>
              <FiDownload size={16} /> Download report
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="chat-message system" key={message.id}>
        <div className="system-note">{message.text}</div>
      </div>
    );
  };

  const renderActiveSessionPanel = () => {
    if (!interviewSession) return null;
    const activeIndex = currentQuestionIndex;
    
    return (
      <div className="active-session-control-panel" style={{ padding: '24px', background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '16px', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.03), 0 8px 30px rgba(0,0,0,.45)', width: '100%', maxWidth: '600px', margin: '40px auto 0', transition: 'all 0.3s ease' }}>
        <div className="start-summary" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div className="start-icon" style={{ background: 'rgba(139,92,246,0.15)', color: '#8B5CF6', fontSize: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '16px', marginBottom: '16px' }}>💬</div>
          <h3 style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '-0.3px', margin: '0 0 8px' }}>Active Session in Progress</h3>
          <p style={{ color: '#a1a1aa', fontSize: '13px', margin: '0 0 20px', maxWidth: '440px' }}>
            You have an unfinished interview session for <strong>{interviewSession.field}</strong>
            {interviewSession.stack && ` — ${interviewSession.stack}`}.
          </p>
          
          <div className="tags" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', margin: '8px 0 24px' }}>
            <div className="tag" style={{ background: '#111', border: '1px solid #222', padding: '6px 12px', borderRadius: '8px', fontSize: '11.5px', color: '#a1a1aa' }}>{interviewSession.experience}</div>
            <div className="tag" style={{ background: '#111', border: '1px solid #222', padding: '6px 12px', borderRadius: '8px', fontSize: '11.5px', color: '#a1a1aa' }}>{(interviewSession.type || 'Behavioral').toUpperCase()}</div>
            <div className="tag" style={{ background: '#111', border: '1px solid #222', padding: '6px 12px', borderRadius: '8px', fontSize: '11.5px', color: '#a1a1aa' }}>{interviewSession.difficulty || 'Medium'}</div>
            <div className="tag" style={{ background: '#111', border: '1px solid #222', padding: '6px 12px', borderRadius: '8px', fontSize: '11.5px', color: '#a1a1aa' }}>Progress: Q {Math.min(activeIndex + 1, totalQuestions)} / {totalQuestions}</div>
            <div className="tag" style={{ background: '#111', border: '1px solid #222', padding: '6px 12px', borderRadius: '8px', fontSize: '11.5px', color: '#a1a1aa' }}>Time: {formatTimer(timerSeconds)}</div>
          </div>

          <div className="start-actions" style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '320px', margin: '0 auto' }}>
            <button className="btn-next" style={{ width: '100%', padding: '12px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', border: 'none', color: 'white', boxShadow: '0 0 25px rgba(139,92,246,0.25)', transition: 'all 0.2s' }} onClick={() => {
              setInterviewStarted(true);
            }}>
              Resume Interview
            </button>
            <button className="btn-back" style={{ width: '100%', padding: '12px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', background: '#0a0a0a', border: '1px solid #1a1a1a', color: 'white', transition: 'all 0.2s' }} onClick={() => handleEndInterview(false)}>
              End & View Summary
            </button>
            <button className="btn-back" style={{ width: '100%', padding: '12px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', background: '#0a0a0a', border: '1px solid rgba(255,107,107,0.2)', color: '#ff6b6b', transition: 'all 0.2s' }} onClick={() => {
              localStorage.removeItem('road2dev-interview-session-id');
              localStorage.removeItem('road2dev-interview');
              setSessionId('');
              setInterviewSession(null);
              setSavedInterview(null);
              setChatMessages([]);
              setTimerSeconds(0);
              setInterviewStarted(false);
              setInterviewCompleted(false);
              setCurrentQuestionIndex(0);
              setCurrentStep(1);
            }}>
              Start New Interview
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderChatScreen = () => {
    const activeIndex = Math.min(currentQuestionIndex, Math.max(0, totalQuestions - 1));
    const progress = totalQuestions ? Math.round(((activeIndex + 1) / totalQuestions) * 100) : 0;

    return (
      <div className="chat-shell">
        <div className="chat-panel">
          <div className="chat-topbar">
            <div className="interviewer-card">
              <div className="interviewer-avatar">AI</div>
              <div>
                <span className="subtitle">AI Interviewer</span>
                <h3>{selectedTypeData?.label || 'Technical'} Interview</h3>
              </div>
            </div>
            <div className="session-summary">
              <span className="session-pill">Q {Math.min(activeIndex + 1, totalQuestions)} / {totalQuestions}</span>
              <span className="session-pill">{formatTimer(timerSeconds)}</span>
              <span className="session-pill">{interviewSession?.questions?.[activeIndex]?.difficulty || 'Medium'}</span>
            </div>
          </div>

          <div className="progress-bar-wrap">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
            <span>{progress}% complete</span>
          </div>

          <div className="chat-messages">
            <AnimatePresence initial={false}>
              {chatMessages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25 }}
                >
                  {renderChatMessage(message)}
                </motion.div>
              ))}
            </AnimatePresence>
            {isAiTyping && (
              <div className="chat-message ai typing">
                <div className="typing-bubble">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="chat-input-panel">
            <div className="chat-input-row">
              <button className="icon-button" type="button">
                <FiMic size={18} />
              </button>
              <textarea
                className="chat-input"
                rows={2}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type your answer here and press Enter to submit..."
                disabled={interviewCompleted}
              />
              <button className="btn-send" onClick={handleSendMessage} disabled={!messageInput.trim() || interviewCompleted}>
                <FiSend size={18} /> Send
              </button>
            </div>
            <div className="chat-actions">
              <button className="action-pill" onClick={handleRetryAnswer} disabled={interviewCompleted}>Retry Answer</button>
              <button className="action-pill" onClick={handleRegenerateFeedback} disabled={interviewCompleted}>Regenerate Feedback</button>
              <button className="action-pill" onClick={handleSkipQuestion} disabled={interviewCompleted}>Skip Question</button>
              <button className="action-pill" onClick={handleSaveInterview}>
                {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved ✓' : 'Save History'}
              </button>
              <button className="action-pill" onClick={handleLeaveSession} disabled={interviewCompleted}>Leave & Keep Later</button>
              <button className="action-pill end" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#fca5a5' }} onClick={() => handleAbandonInterview(false)} disabled={interviewCompleted}>Abandon Interview</button>
              <button className="action-pill end" onClick={() => handleEndInterview(false)}>End Session</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const showBackButton = currentStep > 1;
  const showInfoNote = currentStep !== 5;
  const showHowSection = currentStep <= 1;
  const showActionButton = currentStep < 5;

  const hasActiveSession = sessionId && interviewSession && (interviewSession.status === 'active' || interviewSession.status === 'incomplete' || interviewSession.status === 'in_progress');

  return (
    <div className={`page ${interviewStarted ? 'interview-mode' : ''}`}>
      <InterviewAccessModal
        isOpen={showAccessModal}
        onClose={handleCloseAccessModal}
        onContinueGuest={handleContinueAsGuest}
        onLogin={handleOpenLogin}
      />
      {showEndConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>End interview session early?</h3>
            <p>
              You have answered <strong>{chatMessages.filter(m => m.type === 'feedback').length}</strong> of{' '}
              <strong>{totalQuestions}</strong> questions. Ending now will calculate your final score based only on completed questions.
            </p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowEndConfirmModal(false)}>
                Cancel & Continue
              </button>
              <button className="btn-danger" onClick={() => handleEndInterview(true)}>
                Yes, End Session
              </button>
            </div>
          </div>
        </div>
      )}
      {showAbandonConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Abandon interview session?</h3>
            <p>
              This session will be saved in your history under <strong>Abandoned</strong> status. 
              You will not be able to resume it, but you will be able to review your progress so far.
            </p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowAbandonConfirmModal(false)}>
                Cancel & Continue
              </button>
              <button className="btn-danger" onClick={() => handleAbandonInterview(true)}>
                Yes, Abandon
              </button>
            </div>
          </div>
        </div>
      )}
      {!interviewStarted && !hasActiveSession && (
        <>
          <div className="header">
            <div className="header-left">
              <h1>Interview Prep</h1>
              <p>AI will conduct a personalized interview based on your profile and preferences.</p>
            </div>
            <HistoryButton />
          </div>

          <div className="stepper-wrap">
            <div className="stepper">
              <Step number={1} isActive={currentStep === 1} isDone={currentStep > 1} label="Field" detail="Choose your field" />
              <StepLine isDone={currentStep > 1} />
              <Step number={2} isActive={currentStep === 2} isDone={currentStep > 2} label="Stack" detail="Choose your stack" />
              <StepLine isDone={currentStep > 2} />
              <Step number={3} isActive={currentStep === 3} isDone={currentStep > 3} label="Experience" detail="Select experience level" />
              <StepLine isDone={currentStep > 3} />
              <Step number={4} isActive={currentStep === 4} isDone={currentStep > 4} label="Type" detail="Interview type" />
              <StepLine isDone={currentStep > 4} />
              <Step number={5} isActive={currentStep === 5} isDone={false} label="Questions" detail="AI generated" />
            </div>
          </div>
        </>
      )}
      {!interviewStarted && hasActiveSession && (
        <div className="header">
          <div className="header-left">
            <h1>Active Interview Found</h1>
            <p>You have an unfinished interview session in progress.</p>
          </div>
          <HistoryButton />
        </div>
      )}

      <div className={`content-card ${interviewStarted ? 'chat-content' : ''}`}>
        {interviewStarted ? (
          renderChatScreen()
        ) : hasActiveSession ? (
          renderActiveSessionPanel()
        ) : (
          <>
            {renderFieldScreen()}
            {renderStackScreen()}
            {renderExpScreen()}
            {renderInterviewTypeScreen()}
            {renderStartScreen()}
          </>
        )}
      </div>

      {!interviewStarted && !hasActiveSession && (
        <>
          <div className="footer-bar">
            {showBackButton && (
              <button className="btn-back" onClick={goBack}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
                Back
              </button>
            )}
            {showInfoNote && <InfoNote />}
            {showActionButton && (
              <button className="btn-next" onClick={goNext} disabled={isNextDisabled()}>
                {getNextButtonText()}
              </button>
            )}
          </div>

          {showHowSection && (
            <div className="how-section">
              <h3>How AI Interview Works</h3>
              <div className="how-grid">
                <div className="how-item">
                  <div className="how-icon-wrap" style={{ background: '#2d2350' }}>💬</div>
                  <strong>Answer AI Questions</strong>
                  <p>AI will ask role-specific questions.</p>
                </div>
                <div className="how-arrow">→</div>
                <div className="how-item">
                  <div className="how-icon-wrap" style={{ background: '#1a2a40' }}>⚡</div>
                  <strong>Real-time Interaction</strong>
                  <p>Experience a real interview environment.</p>
                </div>
                <div className="how-arrow">→</div>
                <div className="how-item">
                  <div className="how-icon-wrap" style={{ background: '#1a2f20' }}>📊</div>
                  <strong>Instant Evaluation</strong>
                  <p>Get AI feedback and performance analysis.</p>
                </div>
                <div className="how-arrow">→</div>
                <div className="how-item">
                  <div className="how-icon-wrap" style={{ background: '#2d2040' }}>⭐</div>
                  <strong>Improve &amp; Grow</strong>
                  <p>Practice again and improve your skills.</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default InterviewPrep;