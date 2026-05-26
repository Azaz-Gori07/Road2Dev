import axios from 'axios';

const fallbackQuestions = [
  {
    question: 'Walk me through a recent technical problem you solved and the tradeoffs you considered.',
    followUps: [
      'What alternatives did you reject?',
      'How did you measure whether the solution worked?',
    ],
  },
  {
    question: 'Explain a core concept from your selected domain as if you were mentoring a junior developer.',
    followUps: [
      'What common mistake should they avoid?',
      'Can you give a practical example?',
    ],
  },
  {
    question: 'Describe how you debug a production issue under time pressure.',
    followUps: [
      'What signals do you check first?',
      'How do you communicate progress to stakeholders?',
    ],
  },
];

const buildPrompt = ({ field, stack, experienceLevel, interviewType }) => {
  const stackText = stack ? ` Technology stack: ${stack}.` : '';

  return `
Generate an interview prep session as strict JSON only.

Candidate profile:
- Field/domain: ${field}
- Experience level: ${experienceLevel}
- Interview type: ${interviewType}
${stackText}

Return this JSON shape exactly:
{
  "title": "short session title",
  "summary": "one concise sentence describing the focus",
  "questions": [
    {
      "question": "question text",
      "difficulty": "easy | medium | hard",
      "expectedFocus": "what the candidate should cover",
      "followUps": ["follow-up question 1", "follow-up question 2"]
    }
  ],
  "tips": ["tip 1", "tip 2", "tip 3"]
}

Rules:
- Create 6 questions.
- Match the selected experience level.
- Keep questions practical and interview-ready.
- Include follow-up questions where useful.
- Do not include markdown, code fences, or text outside JSON.
`.trim();
};

const extractJson = (text) => {
  if (!text || typeof text !== 'string') {
    throw new Error('AI returned an empty response.');
  }

  const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error('AI response was not valid JSON.');
  }

  return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
};

const normalizeQuestions = (questions) => {
  if (!Array.isArray(questions)) {
    return fallbackQuestions;
  }

  return questions
    .filter((item) => item && typeof item.question === 'string' && item.question.trim())
    .slice(0, 8)
    .map((item) => ({
      question: item.question.trim(),
      difficulty: typeof item.difficulty === 'string' ? item.difficulty.trim() : 'medium',
      expectedFocus:
        typeof item.expectedFocus === 'string'
          ? item.expectedFocus.trim()
          : 'Give a clear, practical answer with examples.',
      followUps: Array.isArray(item.followUps)
        ? item.followUps.filter((followUp) => typeof followUp === 'string' && followUp.trim()).slice(0, 3)
        : [],
    }));
};

const normalizeSession = (session, request) => {
  const questions = normalizeQuestions(session?.questions);

  return {
    title:
      typeof session?.title === 'string' && session.title.trim()
        ? session.title.trim()
        : `${request.field} Interview Practice`,
    summary:
      typeof session?.summary === 'string' && session.summary.trim()
        ? session.summary.trim()
        : 'Practice these questions out loud and answer with concrete examples.',
    questions: questions.length ? questions : fallbackQuestions,
    tips: Array.isArray(session?.tips)
      ? session.tips.filter((tip) => typeof tip === 'string' && tip.trim()).slice(0, 5)
      : ['Answer with examples.', 'Explain tradeoffs.', 'Ask clarifying questions when needed.'],
  };
};

const inferProvider = (apiKey) => {
  const configuredProvider = process.env.AI_PROVIDER?.trim().toLowerCase();

  if (configuredProvider) {
    return configuredProvider;
  }

  if (apiKey.startsWith('AIza')) {
    return 'gemini';
  }

  if (apiKey.startsWith('gsk_')) {
    return 'groq';
  }

  if (apiKey.startsWith('sk-or-')) {
    return 'openrouter';
  }

  return 'openai';
};

const getDefaultModel = (provider) => {
  if (process.env.AI_MODEL?.trim()) {
    return process.env.AI_MODEL.trim();
  }

  const defaultModels = {
    gemini: 'gemini-1.5-flash',
    groq: 'llama-3.3-70b-versatile',
    openrouter: 'openai/gpt-4o-mini',
    openai: 'gpt-4o-mini',
  };

  return defaultModels[provider] || defaultModels.openai;
};

const getOpenAiCompatibleEndpoint = (provider) => {
  if (process.env.AI_API_URL?.trim()) {
    return process.env.AI_API_URL.trim();
  }

  const endpoints = {
    groq: 'https://api.groq.com/openai/v1/chat/completions',
    openrouter: 'https://openrouter.ai/api/v1/chat/completions',
    openai: 'https://api.openai.com/v1/chat/completions',
  };

  return endpoints[provider] || endpoints.openai;
};

const callGemini = async ({ apiKey, model, timeoutMs, prompt }) => {
  const apiVersion = process.env.AI_API_VERSION || 'v1beta';
  const endpoint = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent`;

  const response = await axios.post(
    endpoint,
    {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.35,
        maxOutputTokens: 1800,
        responseMimeType: 'application/json',
      },
    },
    {
      params: { key: apiKey },
      timeout: timeoutMs,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
};

const callOpenAiCompatible = async ({ apiKey, model, provider, timeoutMs, prompt }) => {
  const response = await axios.post(
    getOpenAiCompatibleEndpoint(provider),
    {
      model,
      messages: [
        {
          role: 'system',
          content: 'You generate interview preparation sessions. Always return strict JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.35,
      max_tokens: 1800,
      response_format: { type: 'json_object' },
    },
    {
      timeout: timeoutMs,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data?.choices?.[0]?.message?.content;
};

const getSafeAiErrorMessage = (error) => {
  const upstreamMessage =
    error.response?.data?.error?.message ||
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message;

  if (typeof upstreamMessage !== 'string') {
    return 'AI provider rejected the request.';
  }

  return upstreamMessage.slice(0, 240);
};

export const generateInterviewSession = async (request) => {
  const apiKey = process.env.AI_API_KEY;
  const timeoutMs = Number(process.env.AI_TIMEOUT_MS) || 20000;

  if (!apiKey) {
    const error = new Error('AI service is not configured.');
    error.statusCode = 503;
    throw error;
  }

  const provider = inferProvider(apiKey);
  const model = getDefaultModel(provider);
  const prompt = buildPrompt(request);

  try {
    const text =
      provider === 'gemini'
        ? await callGemini({ apiKey, model, timeoutMs, prompt })
        : await callOpenAiCompatible({ apiKey, model, provider, timeoutMs, prompt });
    const parsed = extractJson(text);

    return normalizeSession(parsed, request);
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      error.statusCode = 504;
      error.publicMessage = 'AI request timed out. Please try again.';
      throw error;
    }

    if (error.response?.status === 400) {
      error.statusCode = 502;
      error.publicMessage = 'AI provider rejected the request. Please check AI_PROVIDER and AI_MODEL in server/.env.';
      error.message = getSafeAiErrorMessage(error);
      throw error;
    }

    if (error.response?.status === 401 || error.response?.status === 403) {
      error.statusCode = 503;
      error.publicMessage = 'AI service authentication failed.';
      error.message = getSafeAiErrorMessage(error);
      throw error;
    }

    if (error.response?.status === 429) {
      error.statusCode = 429;
      error.publicMessage = 'AI service is busy. Please try again shortly.';
      error.message = getSafeAiErrorMessage(error);
      throw error;
    }

    error.statusCode = error.statusCode || 502;
    error.publicMessage = error.publicMessage || 'Unable to generate interview questions right now.';
    throw error;
  }
};
