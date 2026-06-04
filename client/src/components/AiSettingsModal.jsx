import React, { useState, useEffect } from 'react';
import { X, Sparkles, Languages, ShieldCheck, Check } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import './AiSettingsModal.css';

const LANGUAGES = [
  'English',
  'Hindi',
  'Spanish',
  'French',
  'Arabic',
  'German',
  'Portuguese',
  'Russian',
  'Japanese',
  'Korean',
  'Chinese',
  'Turkish',
  'Indonesian',
  'Thai',
  'Vietnamese'
];

const MODES = [
  {
    id: 'Natural',
    name: 'Natural',
    desc: 'Adapts dynamically to you. Speaks in Hinglish (Hindi + English mix) if you do.'
  },
  {
    id: 'Learning Friendly',
    name: 'Learning Friendly',
    desc: 'Explains concepts in your Preferred Language. Code & technical terms remain in English.'
  },
  {
    id: 'Interview Realistic',
    name: 'Interview Realistic',
    desc: 'Mock interviews in your Interview Language. Answer in any language without score penalty.'
  },
  {
    id: 'Industry Ready',
    name: 'Industry Ready',
    desc: 'Conducted in English. Provides corrections/suggestions if you reply in other languages.'
  }
];

export default function AiSettingsModal({ isOpen, onClose }) {
  const { user, updateProfile } = useAuth();
  const [prefLanguage, setPrefLanguage] = useState('English');
  const [commMode, setCommMode] = useState('Natural');
  const [intLanguage, setIntLanguage] = useState('English');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      if (user.language) setPrefLanguage(user.language);
      if (user.communicationMode) setCommMode(user.communicationMode);
      if (user.interviewLanguage) setIntLanguage(user.interviewLanguage);
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      await updateProfile({
        language: prefLanguage,
        communicationMode: commMode,
        interviewLanguage: intLanguage
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ai-settings-backdrop" onClick={onClose}>
      <div className="ai-settings-container" onClick={(e) => e.stopPropagation()}>
        <div className="ai-settings-header">
          <div className="ai-settings-title-group">
            <Sparkles className="ai-settings-icon-glow" size={24} />
            <h2>AI Communication Settings</h2>
          </div>
          <button className="ai-settings-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="ai-settings-content">
          {error && <div className="ai-settings-error">{error}</div>}
          
          <div className="ai-settings-field">
            <label className="ai-settings-label">
              <Languages size={18} />
              Preferred Language (Explanations & Mentoring)
            </label>
            <div className="ai-settings-select-wrapper">
              <select 
                value={prefLanguage}
                onChange={(e) => setPrefLanguage(e.target.value)}
                className="ai-settings-select"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
            <p className="ai-settings-hint">
              This language will be used to explain programming concepts and guide you in Learning Lab, Mentor Chat, and Career Coach.
            </p>
          </div>

          <div className="ai-settings-field">
            <label className="ai-settings-label">
              <ShieldCheck size={18} />
              Interview Prep Target Language
            </label>
            <div className="ai-settings-select-wrapper">
              <select 
                value={intLanguage}
                onChange={(e) => setIntLanguage(e.target.value)}
                className="ai-settings-select"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
            <p className="ai-settings-hint">
              The primary language the AI interviewer will use to ask questions during mock interviews.
            </p>
          </div>

          <div className="ai-settings-field">
            <label className="ai-settings-label">Communication Mode</label>
            <div className="ai-settings-modes-grid">
              {MODES.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  className={`ai-settings-mode-card ${commMode === mode.id ? 'active' : ''}`}
                  onClick={() => setCommMode(mode.id)}
                >
                  <div className="mode-card-header">
                    <span className="mode-card-title">{mode.name}</span>
                    {commMode === mode.id && <Check size={16} className="mode-card-check" />}
                  </div>
                  <p className="mode-card-desc">{mode.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="ai-settings-footer">
          <button className="ai-settings-cancel" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button 
            className={`ai-settings-save ${success ? 'success' : ''}`} 
            onClick={handleSave} 
            disabled={saving}
          >
            {saving ? 'Saving...' : success ? 'Saved!' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
}
