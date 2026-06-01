import axios from 'axios';

const inferProvider = (apiKey = '') => {
  const configuredProvider = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (configuredProvider) return configuredProvider;
  if (apiKey.startsWith('AIza')) return 'gemini';
  if (apiKey.startsWith('gsk_')) return 'groq';
  if (apiKey.startsWith('sk-or-')) return 'openrouter';
  return 'openai';
};

const getDefaultModel = (provider) => {
  if (process.env.AI_MODEL?.trim()) return process.env.AI_MODEL.trim();
  const defaultModels = {
    gemini: 'gemini-1.5-flash',
    groq: 'llama-3.3-70b-versatile',
    openrouter: 'openai/gpt-4o-mini',
    openai: 'gpt-4o-mini',
  };
  return defaultModels[provider] || defaultModels.openai;
};

const getOpenAiCompatibleEndpoint = (provider) => {
  if (process.env.AI_API_URL?.trim()) return process.env.AI_API_URL.trim();
  const endpoints = {
    groq: 'https://api.groq.com/openai/v1/chat/completions',
    openrouter: 'https://openrouter.ai/api/v1/chat/completions',
    openai: 'https://api.openai.com/v1/chat/completions',
  };
  return endpoints[provider] || endpoints.openai;
};

const callGemini = async ({ apiKey, model, timeoutMs, prompt, systemPrompt }) => {
  const apiVersion = process.env.AI_API_VERSION || 'v1beta';
  const endpoint = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent`;

  const payload = {
    contents: [
      {
        parts: [{ text: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2500,
      responseMimeType: 'application/json',
    },
  };

  if (systemPrompt) {
    payload.systemInstruction = {
      parts: [{ text: systemPrompt }],
    };
    payload.contents[0].parts[0].text = prompt;
  }

  const response = await axios.post(endpoint, payload, {
    params: { key: apiKey },
    timeout: timeoutMs,
    headers: { 'Content-Type': 'application/json' },
  });

  return response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
};

const callOpenAiCompatible = async ({ apiKey, model, provider, timeoutMs, prompt, systemPrompt }) => {
  const response = await axios.post(
    getOpenAiCompatibleEndpoint(provider),
    {
      model,
      messages: [
        {
          role: 'system',
          content: systemPrompt || 'You are an AI Mentor. Always return strict JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2500,
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

/**
 * AI Mentor: Concept explanation and challenge builder
 */
export const generateMentorResponse = async ({ topic, mode, messages, personality = 'The Coding Coach', sessionType = 'Concept Learning' }) => {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) throw new Error('AI Service not configured.');

  const provider = inferProvider(apiKey);
  const model = getDefaultModel(provider);
  const timeoutMs = Number(process.env.AI_TIMEOUT_MS) || 25000;

  let personalityDirective = '';
  if (personality === 'The Tech Lead') {
    personalityDirective = `
- Tone: Extremely pragmatic, highly professional, strict, like a Silicon Valley senior engineering lead review.
- Focus: Highlight edge cases, security considerations, rendering efficiency, memory footprints, and raw scaling tradeoffs.
- Style: Direct, feedback-oriented. Challenges bad coding patterns immediately.
`;
  } else if (personality === 'The Professor') {
    personalityDirective = `
- Tone: Academic, patient, explanatory, warm, highly analogy-driven.
- Focus: Explains the history of concepts, how standard compilers or engines behave, and core computing foundations.
- Style: Uses elegant real-world analogies (e.g. State as a box, closures as backpacks). Perfect for beginner developers.
`;
  } else {
    // The Coding Coach
    personalityDirective = `
- Tone: Energetic, extremely supportive, code-focused, practical, task-oriented.
- Focus: Focuses on quick sandbox snippets, immediate coding challenges, console logging exercises, and quick tricks.
- Style: Short paragraphs, lots of focused snippets, interactive step-by-step mentoring.
`;
  }

  const systemPrompt = `
You are a warm, encouraging, highly technical Senior AI Developer Mentor and Career Coach.
Your goal is to help the candidate understand topics deeply and systematically eliminate knowledge gaps.
You are NOT an interviewer. You behave like a friendly senior colleague pair-programming with a junior.

Topic to teach: "${topic}"
Mode Selected: "${mode}" (Beginner, Intermediate, Advanced)
Current Focus: "${sessionType}"

MENTOR PERSONALITY CONSTRAINTS:
You must adopt this personality strictly:
${personalityDirective}

Rules for teaching:
1. ADAPTIVITY:
   - "Beginner": Use simple English, visual analogies, and basic concepts. Avoid high-level abstractions.
   - "Intermediate": Discuss real-world project context, library usages, and architectural patterns.
   - "Advanced": Analyze execution stack, memory allocations, CPU/rendering profiling, optimization tradeoffs, and low-level code mechanics.
2. SMART CODE SNIPPETS:
   - MUST keep code examples between 5 and 15 lines max. Never output huge bloat code. Write compact, high-quality, illustrative Javascript/Typescript.
3. COMPARISON TABLES:
   - Generate Markdown comparison tables frequently to contrast concepts (e.g. var vs let vs const, let vs const, etc.) where helpful.
4. STRUCTURED HEADINGS:
   - When introducing or clarifying concepts, dynamically choose 3-4 structured headings: Quick Definition, Easy Explanation, Real Project Usage, Common Mistakes, Interview Answer, practice questions.
5. CODING CHALLENGE:
   - If the candidate asks for practice, or if you feel they need testing to raise mastery, you can issue a hands-on Coding Challenge.
   - Make sure to specify it in the "playgroundChallenge" field. Challenge types can be: coding, predict_output, debugging, fill_blanks. For "coding", provide clean, clear initial code and test instructions.
6. THE ZERO-DEAD-END RULE (SUGGESTED NEXT ACTION):
   - You must NEVER leave the user without a next step. Always define a suggestedNextStep in the JSON.
   - Every session must conclude with advice on "What should I learn next?" mapping out a clear milestone suggestion.

You must respond in strict JSON only, using this schema:
{
  "text": "Your mentoring explanation text. Use markdown, tables, lists, and bold words freely. Keep explanations engaging, structured, and customized for your personality.",
  "suggestedNextStep": {
    "title": "Short title, e.g. 'Solve Counter Loop'",
    "actionText": "Instruction, e.g. 'Go to Sandbox Playground and write a closures counter script to achieve 60% mastery.'",
    "targetTab": "playground | project | coach"
  },
  "missionChecklistUpdates": [
    { "task": "Short title of a task to learn or complete in this session", "completed": true }
  ],
  "playgroundChallenge": {
    "title": "Short title of the challenge, or null if not issuing a challenge",
    "type": "coding | predict_output | debugging | fill_blanks | null",
    "instructions": "Markdown instructions for the user, specifying expectations, constraints, and inputs.",
    "initialCode": "Starter Javascript code in the editor",
    "solutionTemplate": "Expected string match or test condition description"
  },
  "masteryDelta": 5
}
`.trim();

  const formattedHistory = messages.map(m => `[${m.role === 'user' ? 'Candidate' : 'Mentor'}]: ${m.text}`).join('\n');
  const prompt = `
CONVERSATION LOGS:
${formattedHistory}

INSTRUCTION:
Generate the mentor response. Respond to the candidate's last request. Output strict JSON.
`.trim();

  const text = provider === 'gemini'
    ? await callGemini({ apiKey, model, timeoutMs, prompt, systemPrompt })
    : await callOpenAiCompatible({ apiKey, model, provider, timeoutMs, prompt, systemPrompt });

  return extractJson(text);
};

/**
 * Project Ingestion: Generates Project Ingestion Architecture Report
 */
export const analyzeProjectSummary = async ({ projectSummaryText, repoUrl = '' }) => {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) throw new Error('AI Service not configured.');

  const provider = inferProvider(apiKey);
  const model = getDefaultModel(provider);
  const timeoutMs = Number(process.env.AI_TIMEOUT_MS) || 25000;

  const systemPrompt = `
You are a Senior Project Reviewer and Technical Architect.
You are given a text summary of an ingested codebase structure, framework, list of files, and package configurations.
Your goal is to parse this codebase summary and construct an advanced Project Understanding Architecture Report, top 25 defense questions, and first starter defense question.

Ignore all generic patterns. Focus on the actual frameworks, configurations, components, APIs, state management, auth strategy, and DB usage present in the code.

You must respond in strict JSON only, using this schema:
{
  "architectureReport": {
    "structure": "Clear markdown list detailing the project's folder layout and component organization.",
    "libraries": ["List of core libraries scanned from package configurations"],
    "frameworks": ["Frameworks used, e.g. React, Express, Next.js"],
    "components": ["List of critical components or modules found in the source code"],
    "apis": ["List of endpoint route paths or external api calls used"],
    "stateManagement": "Zustand, Redux, Context API, Vuex, or None",
    "auth": "JWT, Session Cookies, OAuth2, Firebase Auth, or None",
    "database": "MongoDB, PostgreSQL, MySQL, Redis, SQLite, or None",
    "summary": "1-2 paragraph professional architectural breakdown of what this project does and how it is organized."
  },
  "topQuestions": [
    "A list of EXACTLY 25 highly customized, project-specific defense questions probing details (e.g. 'Why did you use Redux in cart.js?', 'How does token validation in auth.js work?', 'Explain why MongoDB was selected instead of Postgres here.'). Absolutely NO generic questions."
  ],
  "starterDefenseQuestion": "Your first highly challenging project defense question to start the interview defense session. Choose something related to authentication, state, or database usage."
}
`.trim();

  const prompt = `
PROJECT CODEBASE SUMMARY:
${projectSummaryText}
Repo URL (if applicable): ${repoUrl}

INSTRUCTION:
Analyze this summary and compile the high-fidelity Architecture Report, Top 25 Questions list, and starter defense question. Output strict JSON.
`.trim();

  const text = provider === 'gemini'
    ? await callGemini({ apiKey, model, timeoutMs, prompt, systemPrompt })
    : await callOpenAiCompatible({ apiKey, model, provider, timeoutMs, prompt, systemPrompt });

  return extractJson(text);
};

/**
 * Project Defense Mode: evaluates answer to question, decides next question or compiles readiness scorecard
 */
export const evaluateDefenseAnswer = async ({ report, currentQuestion, answer, previousQuestions = [], currentQuestionIndex = 0 }) => {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) throw new Error('AI Service not configured.');

  const provider = inferProvider(apiKey);
  const model = getDefaultModel(provider);
  const timeoutMs = Number(process.env.AI_TIMEOUT_MS) || 25000;

  const isFinalTurn = currentQuestionIndex >= 4; // 5 questions defense

  const systemPrompt = `
You are a Senior Project Reviewer and Technical Critic.
You are evaluating a candidate's answer to a challenging Project Defense question.
Your goal is to detect true authorship:
- Does the candidate truly understand the architecture, libraries, and component logic?
- Or are they giving shallow, vague answers that sound like they copied the repository?

Candidate Project Architecture:
${JSON.stringify(report, null, 2)}

Current Question: "${currentQuestion}"
Candidate Answer: "${answer}"

Turn status: ${isFinalTurn ? 'FINAL_QUESTION' : 'IN_PROGRESS'}

You must respond in strict JSON only, using this schema:
{
  "authorshipScore": 85, // 1-100 score on how confident you are they actually built the project based on this answer.
  "feedback": "Honest, constructive mentor feedback on their answer. Highlight correct choices, point out missing edge cases, or point out shallow assumptions.",
  "isCompleted": ${isFinalTurn ? 'true' : 'false'},
  "nextQuestion": "${isFinalTurn ? '' : 'Next project-specific defense question challenging a different module (e.g. security, rendering, tradeoffs)'}",
  "learningReport": {
    "strengths": ["List of strengths identified in their answers. Empty if isCompleted is false."],
    "weakAreas": ["List of weak topics/areas where they showed shallow understanding. Empty if isCompleted is false."],
    "missingConcepts": ["Important developer concepts they missed. Empty if isCompleted is false."],
    "suggestedImprovements": ["Detailed suggestions for codebase enhancements. Empty if isCompleted is false."],
    "refactoringIdeas": ["Refactoring tips for specific files or folders. Empty if isCompleted is false."],
    "productionReadinessScore": 75, // 1-100 overall score. 0 if isCompleted is false.
    "portfolioReadinessScore": 80 // 1-100 overall score. 0 if isCompleted is false.
  }
}
`.trim();

  const prompt = `
Provide the evaluation of the candidate's response. Output strict JSON matching the instructions.
`.trim();

  const text = provider === 'gemini'
    ? await callGemini({ apiKey, model, timeoutMs, prompt, systemPrompt })
    : await callOpenAiCompatible({ apiKey, model, provider, timeoutMs, prompt, systemPrompt });

  return extractJson(text);
};

/**
 * Career Coach Service: Generates market readiness and 90-day learning timelines
 */
export const compileCareerCoachRoadmap = async ({ masteredSkills = [], weakSkills = [], topic = 'Full Stack Development' }) => {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) throw new Error('AI Service not configured.');

  const provider = inferProvider(apiKey);
  const model = getDefaultModel(provider);
  const timeoutMs = Number(process.env.AI_TIMEOUT_MS) || 25000;

  const systemPrompt = `
You are a warm, professional tech recruiter and Career Coach.
Based on the candidate's mastered and weak competencies, your job is to build a structured Market Readiness and 90-day learning roadmap.

Mastered Skills: ${JSON.stringify(masteredSkills)}
Weak Skills: ${JSON.stringify(weakSkills)}
Target Profile: "${topic}"

You must respond in strict JSON only, using this schema:
{
  "marketReadiness": "Clear statement on current hiring tier, e.g. Ready for Frontend Internship, polishing for Junior, etc.",
  "jobReadiness": "Junior Developer: 75% | Mid-level: 40% (formatted string indicating percentile)",
  "recommendedRoles": ["List of 2-3 matching job roles"],
  "recommendedCompanies": ["List of 2-3 company types, e.g. SaaS Startups, Dev Shops, Fintech Labs"],
  "salaryGuidance": "Estimated salary bracket based on readiness (e.g. $60,000 - $80,000)",
  "learningRoadmap": [
    {
      "phase": "Immediate Gaps (Next 7 Days)",
      "topics": ["Focus topic 1", "Focus topic 2"]
    },
    {
      "phase": "Building Confidence (Next 30 Days)",
      "topics": ["Focus topic 3", "Focus topic 4"]
    },
    {
      "phase": "Advanced Architecture (Next 90 Days)",
      "topics": ["Focus topic 5", "Focus topic 6"]
    }
  ]
}
`.trim();

  const prompt = `
Generate the Career Coach profile scorecard. Output strict JSON.
`.trim();

  const text = provider === 'gemini'
    ? await callGemini({ apiKey, model, timeoutMs, prompt, systemPrompt })
    : await callOpenAiCompatible({ apiKey, model, provider, timeoutMs, prompt, systemPrompt });

  return extractJson(text);
};
