import axios from 'axios';
import { success, error } from '../utils/response.js';

// BCP-47 locale map matching the client-side supported languages
const langToLocale = {
  'english': 'en-US',
  'hindi': 'hi-IN',
  'spanish': 'es-ES',
  'french': 'fr-FR',
  'arabic': 'ar-SA',
  'german': 'de-DE',
  'portuguese': 'pt-PT',
  'russian': 'ru-RU',
  'japanese': 'ja-JP',
  'korean': 'ko-KR',
  'chinese': 'zh-CN',
  'turkish': 'tr-TR',
  'indonesian': 'id-ID',
  'thai': 'th-TH',
  'vietnamese': 'vi-VN'
};

// Locales natively supported by NVIDIA's Magpie-Multilingual model
const supportedNvidiaLocales = {
  'en-US': 'EN-US',
  'hi-IN': 'HI-IN',
  'es-ES': 'ES-ES',
  'fr-FR': 'FR-FR',
  'de-DE': 'DE-DE',
  'ja-JP': 'JA-JP',
  'zh-CN': 'ZH-CN',
  'vi-VN': 'VI-VN',
  'it-IT': 'IT-IT'
};

/**
 * Checks if the NVIDIA API Key is configured in the environment.
 */
export const getTtsStatus = (req, res) => {
  const isConfigured = !!process.env.NVIDIA_API_KEY;
  return success(res, {
    message: 'TTS status retrieved',
    data: {
      active: isConfigured,
      model: process.env.NVIDIA_TTS_MODEL || 'nvidia/magpie_tts_multilingual_357m'
    }
  });
};

/**
 * Synthesizes text to speech using NVIDIA's Magpie API.
 */
export const synthesizeSpeech = async (req, res) => {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    return error(res, {
      message: 'NVIDIA API key is not configured on the server. Falling back to local Web Speech API.',
      status: 503
    });
  }

  const text = req.body.text;
  if (!text || typeof text !== 'string' || !text.trim()) {
    return error(res, {
      message: 'Text input is required for synthesis.',
      status: 400
    });
  }

  let locale = req.body.locale || 'en-US';
  if (req.body.language) {
    const normalizedLang = req.body.language.toLowerCase().trim();
    locale = langToLocale[normalizedLang] || locale;
  }

  const speaker = req.body.speaker || 'Aria';
  const emotion = req.body.emotion || 'Neutral';
  
  // Format voice identifier following NVIDIA guidelines:
  // Magpie-Multilingual.{LOCALE}.{Speaker}.{Emotion}
  // Default fallback to EN-US if the specific locale is not natively supported by Magpie.
  const nvidiaLocale = supportedNvidiaLocales[locale] || 'EN-US';
  const voiceName = req.body.voice || `Magpie-Multilingual.${nvidiaLocale}.${speaker}.${emotion}`;
  const model = process.env.NVIDIA_TTS_MODEL || 'nvidia/magpie_tts_multilingual_357m';

  console.log(`[TTS_PROXY] Synthesizing text using NVIDIA model: "${model}" | Voice: "${voiceName}"`);

  try {
    const response = await axios({
      method: 'post',
      url: 'https://integrate.api.nvidia.com/v1/audio/speech',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        model,
        input: text,
        voice: voiceName,
        response_format: 'mp3'
      },
      responseType: 'arraybuffer'
    });

    res.setHeader('Content-Type', 'audio/mpeg');
    return res.send(Buffer.from(response.data));
  } catch (err) {
    let errorMessage = err.message;
    if (err.response?.data) {
      try {
        const errJson = JSON.parse(Buffer.from(err.response.data).toString());
        errorMessage = errJson.error?.message || errJson.message || errorMessage;
      } catch (e) {
        errorMessage = Buffer.from(err.response.data).toString() || errorMessage;
      }
    }
    console.error('[TTS_PROXY] NVIDIA API error:', errorMessage);
    return error(res, {
      message: `NVIDIA TTS error: ${errorMessage}`,
      status: err.response?.status || 500
    });
  }
};

/**
 * Transcribes audio to text using NVIDIA's ASR/transcriptions API.
 */
export const transcribeSpeech = async (req, res) => {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    return error(res, {
      message: 'NVIDIA API key is not configured on the server.',
      status: 503
    });
  }

  const { audio, locale } = req.body;
  if (!audio || typeof audio !== 'string') {
    return error(res, {
      message: 'Base64 audio string is required for transcription.',
      status: 400
    });
  }

  try {
    const buffer = Buffer.from(audio, 'base64');
    
    // Construct file Blob and FormData using native Node 18+ global APIs
    const fileBlob = new Blob([buffer], { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('file', fileBlob, 'recording.webm');
    
    const model = process.env.NVIDIA_STT_MODEL || 'openai/whisper-large-v3';
    formData.append('model', model);

    if (locale) {
      const languageCode = locale.split('-')[0];
      formData.append('language', languageCode);
    }

    console.log(`[STT_PROXY] Transcribing audio using NVIDIA model: "${model}" | Language: "${locale || 'auto'}"`);

    const response = await fetch('https://integrate.api.nvidia.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      const errText = await response.text();
      let parsedErr = errText;
      try {
        const errJson = JSON.parse(errText);
        parsedErr = errJson.error?.message || errJson.message || errText;
      } catch (e) {}
      throw new Error(parsedErr);
    }

    const data = await response.json();
    return success(res, {
      message: 'Speech transcribed',
      data: { text: data.text || '' }
    });
  } catch (err) {
    console.error('[STT_PROXY] NVIDIA ASR error:', err.message);
    return error(res, {
      message: `NVIDIA STT error: ${err.message}`,
      status: 500
    });
  }
};
