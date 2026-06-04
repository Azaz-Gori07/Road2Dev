import React, { useState, useEffect, useMemo } from 'react';
import './TypingIndicator.css';

const STATUS_MAP = {
  interview: [
    "AI interviewer is evaluating your answer...",
    "AI is analyzing your response...",
    "AI is preparing feedback..."
  ],
  'project-defense': [
    "Analyzing project architecture...",
    "AI is reviewing your project...",
    "AI is analyzing your response..."
  ],
  'learning-lab': [
    "Preparing personalized guidance...",
    "AI is building your learning path...",
    "AI is generating recommendations..."
  ],
  'career-coach': [
    "Building career roadmap...",
    "AI is generating recommendations...",
    "AI is analyzing your response..."
  ],
  default: [
    "Preparing personalized guidance...",
    "AI is analyzing your response...",
    "AI is preparing feedback..."
  ]
};

const mapContextKey = (context) => {
  if (!context) return 'default';
  const norm = context.toLowerCase();
  if (norm.includes('interview')) return 'interview';
  if (norm.includes('project-defense') || norm.includes('project defense')) return 'project-defense';
  if (norm.includes('career-coach') || norm.includes('career coach') || norm.includes('career')) return 'career-coach';
  if (norm.includes('concept') || norm.includes('sandbox') || norm.includes('remediation') || norm.includes('learning')) return 'learning-lab';
  return 'default';
};

export default function TypingIndicator({ context }) {
  const [elapsed, setElapsed] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);

  const contextKey = useMemo(() => mapContextKey(context), [context]);
  const statuses = useMemo(() => STATUS_MAP[contextKey] || STATUS_MAP.default, [contextKey]);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (elapsed > 0 && elapsed % 3 === 0) {
      setStatusIndex((prev) => (prev + 1) % statuses.length);
    }
  }, [elapsed, statuses.length]);

  const currentStatusText = statuses[statusIndex] || statuses[0];

  const subStatusText = useMemo(() => {
    if (elapsed >= 8) {
      return "Complex analysis detected. This may take a little longer.";
    }
    if (elapsed >= 3) {
      return "Still working... Analyzing additional context...";
    }
    return null;
  }, [elapsed]);

  return (
    <div className="typing-indicator-container">
      <div className="typing-main">
        <div className="typing-dots" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div className="typing-text-wrapper">
          <span>{currentStatusText}</span>
          <span className="typing-cursor" aria-hidden="true"></span>
        </div>
      </div>
      {subStatusText && (
        <div className="typing-sub-status">
          {subStatusText}
        </div>
      )}
      <div className="typing-powered-by">
        Using AI analysis
      </div>
    </div>
  );
}
