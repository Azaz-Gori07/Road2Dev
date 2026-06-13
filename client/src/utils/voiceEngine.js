// Helper to detect Web Speech API capabilities
export const isVoiceSupported = () => {
  return typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
};

// --- Module-level voice cache (async loading fix) ---
let _cachedVoices = null;
let _voicesLoaded = false;

const _initVoiceCache = () => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    const initial = window.speechSynthesis.getVoices();
    if (initial.length > 0) {
      _cachedVoices = initial;
      _voicesLoaded = true;
    }
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      _cachedVoices = window.speechSynthesis.getVoices();
      _voicesLoaded = true;
    });
  } catch (e) { /* some environments block addEventListener on speechSynthesis */ }
};
_initVoiceCache();

const _getVoices = () => {
  if (_cachedVoices) return _cachedVoices;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    _cachedVoices = voices;
    _voicesLoaded = true;
  }
  return voices;
};

export const areVoicesLoaded = () => _voicesLoaded;
export const waitForVoices = (timeoutMs = 3000) => {
  return new Promise((resolve) => {
    if (_voicesLoaded) return resolve(true);
    const timer = setTimeout(() => resolve(false), timeoutMs);
    const handler = () => {
      clearTimeout(timer);
      resolve(true);
    };
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.addEventListener('voiceschanged', handler, { once: true }); } catch (e) { clearTimeout(timer); resolve(false); }
    } else { clearTimeout(timer); resolve(false); }
  });
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

// Returns all available browser voices with metadata
export const getAvailableVoices = () => {
  const voices = _getVoices();
  return voices.map(v => ({
    name: v.name,
    lang: v.lang,
    voiceURI: v.voiceURI,
    default: v.default,
    localService: v.localService,
  }));
};

// Finds the best matching voice for a given language name
// Priority: exact locale match → language prefix match → English fallback → null
export const getBestVoiceMatch = (langName) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return { voice: null, log: { requested: langName, targetLocale: getLangLocaleCode(langName), voicesAvailable: 0, selected: null, fallbackReason: 'SpeechSynthesis API not available' } };
  }

  const targetLocale = getLangLocaleCode(langName);
  const voices = _getVoices();
  const log = {
    requested: langName,
    targetLocale,
    voicesAvailable: voices.length,
    selected: null,
    fallbackReason: null,
  };

  // 1. Exact locale match (e.g. "hi-IN")
  const exact = voices.find(v => v.lang === targetLocale);
  if (exact) {
    log.selected = { name: exact.name, lang: exact.lang };
    return { voice: exact, log };
  }

  // 2. Language prefix match (e.g. "hi")
  const langPrefix = targetLocale.split('-')[0];
  const prefixMatch = voices.find(v => v.lang.startsWith(langPrefix));
  if (prefixMatch) {
    log.selected = { name: prefixMatch.name, lang: prefixMatch.lang };
    return { voice: prefixMatch, log };
  }

  // 3. English fallback if this is not already English
  if (langPrefix !== 'en') {
    const enVoice = voices.find(v => v.lang.startsWith('en'));
    if (enVoice) {
      log.selected = { name: enVoice.name, lang: enVoice.lang };
      log.fallbackReason = `Your browser/device does not have a voice installed for "${langName}" (${targetLocale}). Falling back to English.`;
      return { voice: enVoice, log };
    }
  }

  // 4. No voice at all
  log.fallbackReason = 'No suitable voice found on this device for any language.';
  return { voice: null, log };
};

// Returns comprehensive voice diagnostics data
export const getVoiceDiagnosticsData = () => {
  const voices = getAvailableVoices();
  const sttAvailable = typeof window !== 'undefined' &&
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  const ttsAvailable = typeof window !== 'undefined' && 'speechSynthesis' in window;
  return {
    ttsSupported: ttsAvailable,
    sttSupported: sttAvailable,
    totalVoices: voices.length,
    voices,
  };
};

// Checks if TTS has any voice available for a given language
export const isLanguageAvailableForTTS = (langName) => {
  if (!_voicesLoaded) return true; // Assume available until we know — prevents false warning banner
  const { voice } = getBestVoiceMatch(langName);
  return voice !== null;
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

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5500/api';

let _activeAudio = null;

// Hijack speechSynthesis.cancel to also stop our active audio stream
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  try {
    const originalCancel = window.speechSynthesis.cancel.bind(window.speechSynthesis);
    window.speechSynthesis.cancel = () => {
      originalCancel();
      if (_activeAudio) {
        try {
          _activeAudio.pause();
          _activeAudio.src = '';
        } catch (e) {}
        _activeAudio = null;
      }
    };
  } catch (e) {
    console.warn('[VOICE_TTS] Failed to override speechSynthesis.cancel:', e);
  }
}

// Speak text using SpeechSynthesis (fallback method)
const fallbackToBrowserTts = (text, langName, onStart, onEnd, onError, limitLength) => {
  const cleanedText = cleanTextForSpeech(text, limitLength);
  if (!cleanedText) {
    onEnd?.();
    return null;
  }

  const { voice, log } = getBestVoiceMatch(langName);

  // If voices aren't loaded yet, wait and retry
  if (log.voicesAvailable === 0 && !_voicesLoaded && typeof window !== 'undefined') {
    let cancelled = false;
    const retry = () => {
      try { window.speechSynthesis.removeEventListener('voiceschanged', retry); } catch (e) {}
      if (!cancelled) fallbackToBrowserTts(text, langName, onStart, onEnd, onError, limitLength);
    };
    try { window.speechSynthesis.addEventListener('voiceschanged', retry); } catch (e) { /* ignore */ }
    setTimeout(() => {
      if (!_voicesLoaded && !cancelled) {
        cancelled = true;
        try { window.speechSynthesis.removeEventListener('voiceschanged', retry); } catch (e) {}
        doSpeak(cleanedText, { voice: null, log }, onStart, onEnd, onError);
      }
    }, 3000);
    return null;
  }

  return doSpeak(cleanedText, { voice, log }, onStart, onEnd, onError);
};

// Speak text using Web Speech API directly, bypassing the backend model proxy
export const speakTextHelper = (text, langName, onStart, onEnd, onError, limitLength = false) => {
  if (typeof window === 'undefined') return null;

  // Stop any ongoing speech synthesis or audio streams
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }

  // Use the browser's direct speech synthesis API (Web Speech API) directly
  fallbackToBrowserTts(text, langName, onStart, onEnd, onError, limitLength);
  return null;
};

// Internal: does the actual window.speechSynthesis.speak() call
const doSpeak = (cleanedText, { voice, log }, onStart, onEnd, onError) => {
  console.log(`[VOICE_TTS] Requested: "${log.requested}" | Locale: "${log.targetLocale}" | Voices: ${log.voicesAvailable}`);
  if (log.selected) {
    console.log(`[VOICE_TTS] Selected voice: "${log.selected.name}" (${log.selected.lang})`);
  }
  if (log.fallbackReason) {
    console.warn(`[VOICE_TTS] ${log.fallbackReason}`);
  }

  const utterance = new SpeechSynthesisUtterance(cleanedText);

  // Set lang to the TARGET locale regardless of voice.
  utterance.lang = log.targetLocale;

  // Only assign voice if it supports the target language (exact or prefix match).
  // For fallback (e.g. English voice for Hindi), do NOT assign voice —
  // let the browser use its default for the target locale.
  const targetPrefix = log.targetLocale.split('-')[0];
  if (voice && voice.lang.startsWith(targetPrefix)) {
    utterance.voice = voice;
  }

  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = (e) => onError?.(e);

  window.speechSynthesis.speak(utterance);
  return utterance;
};

class NvidiaCloudSpeechRecognition {
  constructor() {
    this.continuous = false;
    this.interimResults = false;
    this.lang = 'en-US';
    
    this.onstart = null;
    this.onend = null;
    this.onresult = null;
    this.onerror = null;

    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
  }

  async start() {
    if (this.isRecording) return;
    this.audioChunks = [];
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        await this.transcribeAudio(audioBlob);
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      this.onstart?.();
    } catch (err) {
      console.error('[VOICE_STT] MediaRecorder start failed:', err);
      this.onerror?.(err);
      this.onend?.();
    }
  }

  stop() {
    if (!this.isRecording || !this.mediaRecorder) return;
    this.mediaRecorder.stop();
    this.isRecording = false;
  }

  abort() {
    if (!this.isRecording || !this.mediaRecorder) return;
    this.mediaRecorder.onstop = () => {}; 
    this.mediaRecorder.stop();
    this.isRecording = false;
    this.onend?.();
  }

  async transcribeAudio(blob) {
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const token = localStorage.getItem('auth_token');
      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log(`[VOICE_STT] Sending audio for NVIDIA transcription (Locale: ${this.lang})...`);
      const response = await fetch(`${API_BASE}/tts/transcribe`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          audio: base64,
          locale: this.lang
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'Transcription failed');
      }

      const data = await response.json();
      if (data.success && data.text) {
        const resultEvent = {
          results: [[{ transcript: data.text }]]
        };
        this.onresult?.(resultEvent);
      } else {
        throw new Error(data.message || 'Empty transcription result');
      }
    } catch (err) {
      console.error('[VOICE_STT] NVIDIA STT error:', err);
      this.onerror?.(err);
    } finally {
      this.onend?.();
    }
  }
}

// Initialize Speech Recognition instance
export const initSpeechRecognition = (langName, onStart, onEnd, onResult, onError) => {
  if (typeof window === 'undefined') return null;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const forceNvidiaStt = localStorage.getItem('road2dev-use-nvidia-stt') === 'true';

  if (!SpeechRecognition || forceNvidiaStt) {
    console.log(`[VOICE_STT] Instantiating NVIDIA Cloud ASR (Reason: ${!SpeechRecognition ? 'Browser Web Speech API unsupported' : 'Forced by user setting'}).`);
    const recognition = new NvidiaCloudSpeechRecognition();
    recognition.lang = getLangLocaleCode(langName);
    
    recognition.onstart = () => onStart?.();
    recognition.onend = () => onEnd?.();
    recognition.onerror = (e) => onError?.(e);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onResult?.(transcript);
    };
    return recognition;
  }

  const targetLocale = getLangLocaleCode(langName);

  console.log(`[VOICE_STT] Requested language: "${langName}"`);
  console.log(`[VOICE_STT] Target locale: "${targetLocale}"`);

  // Check if TTS has a voice for this language — used as a hint for STT support
  const { voice, log: ttsLog } = getBestVoiceMatch(langName);
  let effectiveLocale = targetLocale;

  if (!voice && langName !== 'English') {
    console.warn(`[VOICE_STT] WARNING: No TTS voice available for "${langName}" (${targetLocale}). Speech recognition may not work for this language. Falling back to en-US.`);
    effectiveLocale = 'en-US';
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = effectiveLocale;

  recognition.onstart = () => onStart?.();
  recognition.onend = () => onEnd?.();
  recognition.onerror = (e) => onError?.(e);
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    onResult?.(transcript);
  };

  return recognition;
};
