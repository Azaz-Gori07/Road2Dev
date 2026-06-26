import { GroqProvider } from './providers/groqProvider.js';
import { OpenRouterProvider } from './providers/openRouterProvider.js';
import { NvidiaProvider } from './providers/nvidiaProvider.js';
import { GeminiProvider } from './providers/geminiProvider.js';

const DEFAULT_COOLDOWN_MS = Number(process.env.AI_CIRCUIT_BREAKER_COOLDOWN_MS) || 60_000;
const FAILURE_COUNT_THRESHOLD = Number(process.env.AI_CIRCUIT_BREAKER_FAILURE_THRESHOLD) || 5;

const isTimeoutError = (err) => {
  return err?.code === 'ECONNABORTED' || /timeout/i.test(err?.message || '');
};

const isNetworkOr5xx = (err) => {
  const status = err?.response?.status;
  if (status && status >= 500) return true;
  return /ECONNRESET|EAI_AGAIN|ENOTFOUND|ECONNREFUSED|ENETUNREACH|EHOSTUNREACH|ETIMEDOUT/i.test(err?.code || '') || /network/i.test(err?.message || '');
};

const isRateLimitLike = (err) => {
  const status = err?.response?.status;
  const msg = (err?.message || '').toLowerCase();
  const upstream = (err?.response?.data?.error?.message || err?.response?.data?.message || '').toString();
  const upstreamLower = upstream.toLowerCase();

  return (
    status === 429 ||
    status === 413 ||
    msg.includes('rate limit') ||
    msg.includes('quota') ||
    msg.includes('insufficient') ||
    msg.includes('too large') ||
    upstreamLower.includes('rate limit') ||
    upstreamLower.includes('quota') ||
    upstreamLower.includes('insufficient')
  );
};

const getDefaultModel = (provider) => {
  if (process.env.AI_MODEL?.trim()) return process.env.AI_MODEL.trim();
  const defaultModels = {
    groq: 'llama-3.1-8b-instant',
    openrouter: 'openai/gpt-4o-mini',
    openrouter2: process.env.AI_API_KEY_2_MODEL || 'deepseek/deepseek-chat-v3-0324:free',
    nvidia: process.env.NVIDIA_TEXT_MODEL || 'meta/llama-3.3-70b-instruct',
  };
  return defaultModels[provider] || '';
};

const getTimeoutMs = () => Number(process.env.AI_TIMEOUT_MS) || 60_000;

const aiCircuit = {
  groq: { failures: 0, disabledUntil: 0 },
  openrouter: { failures: 0, disabledUntil: 0 },
  openrouter2: { failures: 0, disabledUntil: 0 },
  nvidia: { failures: 0, disabledUntil: 0 },
  gemini: { failures: 0, disabledUntil: 0 },
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

const logAiCall = (provider, model, latency, status) => {
  console.log(JSON.stringify({ provider, model, latency, status }));
};

const ensureMetrics = () => {
  if (!global.aiMetrics) {
    global.aiMetrics = {
      groqRequests: 0,
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

  const timeoutMs = options?.timeoutMs || getTimeoutMs();
  const prompt = options?.prompt;
  const systemPrompt = options?.systemPrompt;
  const jsonResponse = options?.jsonResponse;
  const maxTokens = options?.maxTokens;

  const groqModel = options?.groqModel || getDefaultModel('groq');
  const openRouterModel = options?.openRouterModel || getDefaultModel('openrouter');
  const openRouter2Model = options?.openRouter2Model || getDefaultModel('openrouter2');
  const nvidiaModel = options?.nvidiaModel || getDefaultModel('nvidia');

  const groqProvider = new GroqProvider();
  const openRouterProvider = new OpenRouterProvider();
  const nvidiaProvider = new NvidiaProvider();
  const geminiProvider = new GeminiProvider();

  const tryNvidia = async () => {
    const nvidiaKey = process.env.NVIDIA_TEXT_API_KEY;
    if (!nvidiaKey) {
      const err = new Error('NVIDIA_TEXT_API_KEY not configured');
      err.publicMessage = 'NVIDIA_TEXT_API_KEY not configured';
      err.isMissingKey = true;
      throw err;
    }

    if (shouldSkip('nvidia')) {
      const err = new Error('NVIDIA circuit breaker active');
      err.publicMessage = 'NVIDIA circuit breaker active';
      err.isCircuitBreaker = true;
      throw err;
    }

    const start = Date.now();
    let result;
    try {
      result = await nvidiaProvider.generate({
        apiKey: nvidiaKey,
        prompt,
        systemPrompt,
        model: nvidiaModel,
        timeoutMs,
        jsonResponse,
        maxTokens,
      });
    } catch (err) {
      logAiCall('nvidia', nvidiaModel, Date.now() - start, 'failure');
      throw err;
    }

    if (!result?.text?.trim()) {
      const err = new Error('AI returned an empty response');
      err.isEmptyResponse = true;
      throw err;
    }

    const latency = Date.now() - start;
    logAiCall('nvidia', nvidiaModel, latency, 'success');
    recordSuccess('nvidia');

    return withMeta(result);
  };

  const tryGemini = async () => {
    const geminiKey = process.env.AI_API_KEY;
    if (!geminiKey || !geminiKey.startsWith('AIza')) {
      const err = new Error('Gemini API key not configured or invalid');
      err.publicMessage = 'Gemini API key not configured';
      err.isMissingKey = true;
      throw err;
    }

    if (shouldSkip('gemini')) {
      const err = new Error('Gemini circuit breaker active');
      err.publicMessage = 'Gemini circuit breaker active';
      err.isCircuitBreaker = true;
      throw err;
    }

    const start = Date.now();
    let result;
    try {
      result = await geminiProvider.generate({
        apiKey: geminiKey,
        prompt,
        systemPrompt,
        model: 'gemini-1.5-flash',
        timeoutMs,
        jsonResponse,
      });
    } catch (err) {
      logAiCall('gemini', 'gemini-1.5-flash', Date.now() - start, 'failure');
      throw err;
    }

    if (!result?.text?.trim()) {
      const err = new Error('AI returned an empty response');
      err.isEmptyResponse = true;
      throw err;
    }

    const latency = Date.now() - start;
    logAiCall('gemini', 'gemini-1.5-flash', latency, 'success');
    recordSuccess('gemini');

    return withMeta(result);
  };

  const tryOpenRouter2 = async () => {
    const key2 = process.env.AI_API_KEY_2;
    if (!key2) {
      const err = new Error('AI_API_KEY_2 not configured');
      err.publicMessage = 'AI_API_KEY_2 not configured';
      err.isMissingKey = true;
      throw err;
    }

    if (shouldSkip('openrouter2')) {
      const err = new Error('OpenRouter (AI_API_KEY_2) circuit breaker active');
      err.publicMessage = 'OpenRouter (AI_API_KEY_2) circuit breaker active';
      err.isCircuitBreaker = true;
      throw err;
    }

    const start = Date.now();
    let result;
    try {
      result = await openRouterProvider.generate({
        apiKey: key2,
        prompt,
        systemPrompt,
        model: openRouter2Model,
        timeoutMs,
        jsonResponse,
        maxTokens,
      });
    } catch (err) {
      logAiCall('openrouter2', openRouter2Model, Date.now() - start, 'failure');
      throw err;
    }

    if (!result?.text?.trim()) {
      const err = new Error('AI returned an empty response');
      err.isEmptyResponse = true;
      throw err;
    }

    const latency = Date.now() - start;
    logAiCall('openrouter2', openRouter2Model, latency, 'success');
    recordSuccess('openrouter2');

    return withMeta(result);
  };

  const tryOpenRouter = async () => {
    const openRouterKey = process.env.DEFENCE_API_KEY;
    if (!openRouterKey) {
      const err = new Error('DEFENCE_API_KEY not configured');
      err.publicMessage = 'DEFENCE_API_KEY not configured';
      err.isMissingKey = true;
      throw err;
    }

    if (shouldSkip('openrouter')) {
      const err = new Error('OpenRouter circuit breaker active');
      err.publicMessage = 'OpenRouter circuit breaker active';
      err.isCircuitBreaker = true;
      throw err;
    }

    const start = Date.now();
    let result;
    try {
      result = await openRouterProvider.generate({
        apiKey: openRouterKey,
        prompt,
        systemPrompt,
        model: openRouterModel,
        timeoutMs,
        jsonResponse,
        maxTokens,
      });
    } catch (err) {
      const latency = Date.now() - start;
      logAiCall('openrouter', openRouterModel, latency, 'failure');
      throw err;
    }

    if (!result?.text?.trim()) {
      const err = new Error('AI returned an empty response');
      err.isEmptyResponse = true;
      throw err;
    }

    const latency = Date.now() - start;
    logAiCall('openrouter', openRouterModel, latency, 'success');
    recordSuccess('openrouter');

    return withMeta(result);
  };

  const tryGroq = async () => {
    const groqKey = process.env.GROQ_API_KEY || process.env.AI_API_KEY;
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
      maxTokens,
    });

    if (!result?.text?.trim()) {
      const err = new Error('AI returned an empty response');
      err.isEmptyResponse = true;
      throw err;
    }

    logAiCall('groq', groqModel, 0, 'success');
    recordSuccess('groq');

    return withMeta(result);
  };

  // Provider chain — iterate in order, fall through on retryable errors
  // Outer backoff loop: 1s, 2s, 4s — bans immediate retries
  const providerOrder = options?.providers || ['groq', 'openrouter2'];
  const BACKOFF_DELAYS = [1000, 2000, 4000];

  let lastError = null;
  for (let chainAttempt = 0; chainAttempt <= BACKOFF_DELAYS.length; chainAttempt++) {
    lastError = null;
    for (let i = 0; i < providerOrder.length; i++) {
      const name = providerOrder[i];
      try {
        if (name === 'nvidia') return await tryNvidia();
        if (name === 'gemini') return await tryGemini();
        if (name === 'openrouter') return await tryOpenRouter();
        if (name === 'openrouter2') return await tryOpenRouter2();
        if (name === 'groq') return await tryGroq();
        throw new Error(`Unknown provider in chain: ${name}`);
      } catch (err) {
        console.error(`[AI_CHAIN_ERROR] Provider ${name} failed:`, err.response?.status, err.message, JSON.stringify(err.response?.data || {}));
        lastError = err;
        const isRetryable =
          isMissingKeyLike(err) ||
          err?.isCircuitBreaker ||
          isRateLimitLike(err) ||
          isTimeoutError(err) ||
          isNetworkOr5xx(err) ||
          err?.isEmptyResponse === true;

        if (!isRetryable) {
          throw err;
        }

        recordFailure(name);

        if (i === providerOrder.length - 1) {
          break;
        }
      }
    }

    if (chainAttempt < BACKOFF_DELAYS.length) {
      const delay = BACKOFF_DELAYS[chainAttempt];
      console.warn(`[BACKOFF] All providers failed: ${lastError?.message}. Retrying chain in ${delay}ms (attempt ${chainAttempt + 1}/${BACKOFF_DELAYS.length})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('All providers exhausted');
}
