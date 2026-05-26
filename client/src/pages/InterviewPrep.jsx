import React, { useEffect, useRef, useState } from 'react';
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

// --- Main Component ---
const InterviewPrep = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedField, setSelectedField] = useState(null);
  const [selectedStack, setSelectedStack] = useState(null);
  const [selectedExp, setSelectedExp] = useState(null);
  const [selectedInterviewType, setSelectedInterviewType] = useState("technical");
  const [interviewSession, setInterviewSession] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const abortControllerRef = useRef(null);

  const selectedFieldData = FIELDS.find(f => f.id === selectedField);
  const selectedStackData = selectedFieldData?.stacks.find(s => s.id === selectedStack);
  const selectedExpData = EXP.find(e => e.id === selectedExp);
  const selectedTypeData = INTERVIEW_TYPES.find(type => type.id === selectedInterviewType);
  const hasStacks = selectedFieldData && selectedFieldData.stacks.length > 0;

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const resetGeneratedInterview = () => {
    setInterviewSession(null);
    setError("");
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
    setError("");
    setInterviewSession(null);

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`${API_BASE}/interview/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field: selectedFieldData.name,
          stack: selectedStackData?.name || "",
          experienceLevel: selectedExp,
          interviewType: selectedInterviewType,
        }),
        signal: abortControllerRef.current.signal,
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Unable to generate interview questions.");
      }

      setInterviewSession(result.data);
      setCurrentStep(5);
    } catch (requestError) {
      if (requestError.name !== "AbortError") {
        setError(requestError.message || "Unable to generate interview questions.");
      }
    } finally {
      setIsGenerating(false);
    }
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

  // --- Screen Rendering Functions ---
  const renderFieldScreen = () => (
    <div className={`screen ${currentStep === 1 ? 'active' : ''}`}>
      <h2>1. Choose Your Field</h2>
      <p className="sub">Select the field you want to prepare for</p>
      <div className="field-grid">
        {FIELDS.map(field => (
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
        {selectedFieldData?.stacks.map(stack => (
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
        {EXP.map(exp => (
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
        {INTERVIEW_TYPES.map(type => (
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
    const exp = EXP.find(e => e.id === selectedExp);
    const stack = field?.stacks.find(s => s.id === selectedStack);
    const tags = [field?.name, stack?.name, exp?.label].filter(Boolean);

    return (
      <div className={`screen ${currentStep === 5 && !interviewSession ? 'active' : ''}`}>
        <div className="start-summary">
          <div className="start-icon">{field?.icon}</div>
          <h3>Ready to Begin!</h3>
          <p>
            Your AI interviewer is configured for <strong style={{ color: "#f0f2ff" }}>{field?.name}</strong>
            {stack && ` – <strong style={{ color: "#f0f2ff" }}>${stack.name}</strong>`}. You'll be asked questions suited for a <strong style={{ color: "#f0f2ff" }}>{exp?.label}</strong> level candidate.
          </p>
          <div className="tags">
            {tags.map(tag => <div key={tag} className="tag">{tag}</div>)}
          </div>
        </div>
      </div>
    );
  };

  const renderGeneratedScreen = () => (
    <div className={`screen ${currentStep === 5 && interviewSession ? 'active' : ''}`}>
      {interviewSession && (
        <div className="interview-result">
          <div className="result-header">
            <div>
              <h2>{interviewSession.title}</h2>
              <p className="sub">{interviewSession.summary}</p>
            </div>
            <button className="btn-back" onClick={generateInterview} disabled={isGenerating}>
              Regenerate
            </button>
          </div>
          <div className="tags">
            {[selectedFieldData?.name, selectedStackData?.name, selectedExpData?.label, selectedTypeData?.label]
              .filter(Boolean)
              .map(tag => <div key={tag} className="tag">{tag}</div>)}
          </div>
          <div className="question-list">
            {interviewSession.questions?.map((item, index) => (
              <div className="question-card" key={`${item.question}-${index}`}>
                <div className="question-top">
                  <span className="question-number">Q{index + 1}</span>
                  <span className="difficulty">{item.difficulty || "medium"}</span>
                </div>
                <h3>{item.question}</h3>
                {item.expectedFocus && <p>{item.expectedFocus}</p>}
                {item.followUps?.length > 0 && (
                  <div className="follow-ups">
                    <strong>Follow-ups</strong>
                    {item.followUps.map(followUp => (
                      <span key={followUp}>{followUp}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          {interviewSession.tips?.length > 0 && (
            <div className="tips-box">
              <strong>Tips</strong>
              {interviewSession.tips.map(tip => <span key={tip}>{tip}</span>)}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const showBackButton = currentStep > 1;
  const showInfoNote = currentStep !== 5;
  const showHowSection = currentStep <= 1;
  const showActionButton = currentStep < 5;

  return (
    <div className="page">
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

      <div className="content-card">
        {renderFieldScreen()}
        {renderStackScreen()}
        {renderExpScreen()}
        {renderInterviewTypeScreen()}
        {renderStartScreen()}
        {renderGeneratedScreen()}
      </div>

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
              <div className="how-icon-wrap" style={{ background: "#2d2350" }}>💬</div>
              <strong>Answer AI Questions</strong>
              <p>AI will ask role-specific questions.</p>
            </div>
            <div className="how-arrow">→</div>
            <div className="how-item">
              <div className="how-icon-wrap" style={{ background: "#1a2a40" }}>⚡</div>
              <strong>Real-time Interaction</strong>
              <p>Experience a real interview environment.</p>
            </div>
            <div className="how-arrow">→</div>
            <div className="how-item">
              <div className="how-icon-wrap" style={{ background: "#1a2f20" }}>📊</div>
              <strong>Instant Evaluation</strong>
              <p>Get AI feedback and performance analysis.</p>
            </div>
            <div className="how-arrow">→</div>
            <div className="how-item">
              <div className="how-icon-wrap" style={{ background: "#2d2040" }}>⭐</div>
              <strong>Improve &amp; Grow</strong>
              <p>Practice again and improve your skills.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewPrep;
