import { GeminiProvider } from './providers/geminiProvider.js';
import { GroqProvider } from './providers/groqProvider.js';

const DEFAULT_COOLDOWN_MS = Number(process.env.AI_CIRCUIT_BREAKER_COOLDOWN_MS) || 60_000;
const FAILURE_COUNT_THRESHOLD = Number(process.env.AI_CIRCUIT_BREAKER_FAILURE_THRESHOLD) || 5;

const isTimeoutError = (err) => {
  return err?.code === 'ECONNABORTED' || /timeout/i.test(err?.message || '');
};

const isNetworkOr5xx = (err) => {
  const status = err?.response?.status;
  if (status && status >= 500) return true;
  return /ECONNRESET|EAI_AGAIN|ENOTFOUND/i.test(err?.code || '') || /network/i.test(err?.message || '');
};

const isRateLimitLike = (err) => {
  const status = err?.response?.status;
  const msg = (err?.message || '').toLowerCase();
  const upstream = (err?.response?.data?.error?.message || err?.response?.data?.message || '').toString();
  const upstreamLower = upstream.toLowerCase();

  return (
    status === 429 ||
    msg.includes('rate limit') ||
    msg.includes('quota') ||
    msg.includes('insufficient') ||
    upstreamLower.includes('rate limit') ||
    upstreamLower.includes('quota') ||
    upstreamLower.includes('insufficient')
  );
};

const getGeminiKey = () => process.env.GEMINI_API_KEY || process.env.AI_API_KEY_2;
const getGroqKey = () => process.env.GROQ_API_KEY || process.env.AI_API_KEY;

const getDefaultModel = (provider) => {
  if (process.env.AI_MODEL?.trim()) return process.env.AI_MODEL.trim();
  const defaultModels = {
    gemini: 'gemini-2.5-flash',
    groq: 'llama-3.3-70b-versatile',
  };
  return defaultModels[provider] || '';
};

const getTimeoutMs = () => Number(process.env.AI_TIMEOUT_MS) || 20_000;

const aiCircuit = {
  gemini: { failures: 0, disabledUntil: 0 },
  groq: { failures: 0, disabledUntil: 0 },
};

const shouldSkip = (providerName) => {
  const state = aiCircuit[providerName];
  return Date.now() < (state?.disabledUntil || 0);
};

const recordFailure = (providerName) => {
  const state = aiCircuit[providerName];
  state.failures += 1;
  if (state.failures >= FAILURE_COUNT_THRESHOLD) {
    state.disabledUntil = Date.now() + DEFAULT_COOLDOWN_MS;
  }
};

const recordSuccess = (providerName) => {
  const state = aiCircuit[providerName];
  state.failures = 0;
  state.disabledUntil = 0;
};

const logProvider = (providerName, endpoint) => {
  // eslint-disable-next-line no-console
  console.log('[AI_PROVIDER]', providerName, endpoint, new Date().toISOString());
};

const ensureMetrics = () => {
  if (!global.aiMetrics) {
    global.aiMetrics = {
      geminiRequests: 0,
      groqRequests: 0,
      geminiFallbacks: 0,
      totalRequests: 0,
    };
  }
  return global.aiMetrics;
};

const normalizeMeta = (meta) => meta || {};

const withMeta = (providerCallResult) => {
  const { text, meta } = providerCallResult || {};
  return {
    text,
    meta: normalizeMeta(meta),
  };
};

const isMissingKeyLike = (err) => {
  return (
    err?.isMissingKey ||
    /api key not configured/i.test(err?.message || '') ||
    /missing/i.test(err?.message || '')
  );
};


export async function hybridGenerate(options) {
  const metrics = ensureMetrics();
  metrics.totalRequests += 1;

  const geminiKey = getGeminiKey();
  const groqKey = getGroqKey();

  const timeoutMs = options?.timeoutMs || getTimeoutMs();
  const prompt = options?.prompt;
  const systemPrompt = options?.systemPrompt;
  const jsonResponse = options?.jsonResponse;

  const geminiModel = options?.geminiModel || getDefaultModel('gemini');
  const groqModel = options?.groqModel || getDefaultModel('groq');

  const geminiProvider = new GeminiProvider();
  const groqProvider = new GroqProvider();

  const tryGemini = async () => {
    if (!geminiKey) {
      const err = new Error('Gemini API key not configured');
      err.publicMessage = 'Gemini API key not configured';
      err.isMissingKey = true;
      throw err;
    }
    // If Gemini is circuit-broken, don't attempt it (Gemini primary behavior).

    if (shouldSkip('gemini')) {
      const err = new Error('Gemini circuit breaker active');
      err.publicMessage = 'Gemini circuit breaker active';
      err.isCircuitBreaker = true;
      throw err;
    }

    metrics.geminiRequests += 1;

    const result = await geminiProvider.generate({
      apiKey: geminiKey,
      prompt,
      systemPrompt,
      model: geminiModel,
      timeoutMs,
      jsonResponse,
    });

    logProvider('Gemini', result?.meta?.endpoint);
    recordSuccess('gemini');

    return withMeta(result);
  };

  const tryGroq = async () => {
    if (!groqKey) {
      const err = new Error('Groq API key not configured');
      err.publicMessage = 'Groq API key not configured';
      err.isMissingKey = true;
      throw err;
    }

    if (shouldSkip('groq')) {
      const err = new Error('Groq circuit breaker active');
      err.publicMessage = 'Groq circuit breaker active';
      err.isCircuitBreaker = true;
      throw err;
    }

    metrics.groqRequests += 1;

    const result = await groqProvider.generate({
      apiKey: groqKey,
      prompt,
      systemPrompt,
      model: groqModel,
      timeoutMs,
      jsonResponse,
    });

    logProvider('Groq', result?.meta?.endpoint);
    recordSuccess('groq');

    return withMeta(result);
  };

  try {
    return await tryGemini();
  } catch (geminiErr) {
    // Determine if we should fallback.
    const shouldFallback =
      isMissingKeyLike(geminiErr) ||
      geminiErr?.isCircuitBreaker ||
      isRateLimitLike(geminiErr) ||
      isTimeoutError(geminiErr) ||
      isNetworkOr5xx(geminiErr);

    if (!shouldFallback) {
      throw geminiErr;
    }

    metrics.geminiFallbacks += 1;

    recordFailure('gemini');

    try {
      return await tryGroq();
    } catch (groqErr) {
      recordFailure('groq');

      // If both fail, throw last error.
      const finalErr = groqErr;
      finalErr.originalGeminiError = geminiErr;
      throw finalErr;
    }
  }
}

