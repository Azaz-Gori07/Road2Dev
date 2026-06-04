// Helper to detect Web Speech API capabilities
export const isVoiceSupported = () => {
  return typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
};

// Maps supported user languages to standard BCP-47 locale codes
export const getLangLocaleCode = (langName) => {
  const langMap = {
    'English': 'en-US',
    'Hindi': 'hi-IN',
    'Spanish': 'es-ES',
    'French': 'fr-FR',
    'Arabic': 'ar-SA',
    'German': 'de-DE',
    'Portuguese': 'pt-PT',
    'Russian': 'ru-RU',
    'Japanese': 'ja-JP',
    'Korean': 'ko-KR',
    'Chinese': 'zh-CN',
    'Turkish': 'tr-TR',
    'Indonesian': 'id-ID',
    'Thai': 'th-TH',
    'Vietnamese': 'vi-VN'
  };
  return langMap[langName] || 'en-US';
};

// Strip markdown code blocks completely and sanitize text for speech synthesis
export const cleanTextForSpeech = (text, limitLength = true) => {
  if (!text || typeof text !== 'string') return '';

  // 1. Remove standard markdown code blocks (e.g. ```javascript ... ```)
  let cleaned = text.replace(/```[\s\S]*?```/g, '');

  // 2. Remove inline code snippets (e.g. `let a = 1`)
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');

  // 3. Remove markdown headers, bold, italics, links
  cleaned = cleaned
    .replace(/[#*_\-\[\]]+/g, ' ')
    .replace(/$$[^)]+$$/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!limitLength) return cleaned;

  // Truncate to nearest sentence boundary under 400 characters
  if (cleaned.length <= 400) return cleaned;

  const truncated = cleaned.slice(0, 380);
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf('.'),
    truncated.lastIndexOf('?'),
    truncated.lastIndexOf('!')
  );

  if (lastSentenceEnd > 100) {
    return cleaned.slice(0, lastSentenceEnd + 1) + ' ...';
  }

  return truncated.trim() + ' ...';
};

// Speak text using SpeechSynthesis
export const speakTextHelper = (text, langName, onStart, onEnd, onError, limitLength = false) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  window.speechSynthesis.cancel(); // Stop any ongoing speech

  const cleanedText = cleanTextForSpeech(text, limitLength);
  if (!cleanedText) {
    onEnd?.();
    return null;
  }

  const utterance = new SpeechSynthesisUtterance(cleanedText);
  const targetLocale = getLangLocaleCode(langName);
  utterance.lang = targetLocale;

  // Bind the best available system voice matching language
  const voices = window.speechSynthesis.getVoices();
  const matchedVoice = voices.find(v => v.lang.startsWith(targetLocale.split('-')[0])) || 
                       voices.find(v => v.lang === targetLocale) ||
                       null;

  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = (e) => onError?.(e);

  window.speechSynthesis.speak(utterance);
  return utterance;
};

// Initialize Speech Recognition instance
export const initSpeechRecognition = (langName, onStart, onEnd, onResult, onError) => {
  if (typeof window === 'undefined') return null;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return null;

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = getLangLocaleCode(langName);

  recognition.onstart = () => onStart?.();
  recognition.onend = () => onEnd?.();
  recognition.onerror = (e) => onError?.(e);
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    onResult?.(transcript);
  };

  return recognition;
};
