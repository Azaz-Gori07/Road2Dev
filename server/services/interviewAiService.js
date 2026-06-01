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
      temperature: 0.35,
      maxOutputTokens: 1800,
      responseMimeType: 'application/json',
    },
  };

  if (systemPrompt) {
    payload.systemInstruction = {
      parts: [{ text: systemPrompt }],
    };
    payload.contents[0].parts[0].text = prompt;
  }

  const response = await axios.post(
    endpoint,
    payload,
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

const callOpenAiCompatible = async ({ apiKey, model, provider, timeoutMs, prompt, systemPrompt }) => {
  const response = await axios.post(
    getOpenAiCompatibleEndpoint(provider),
    {
      model,
      messages: [
        {
          role: 'system',
          content: systemPrompt || 'You generate interview preparation sessions. Always return strict JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.35,
      max_tokens: 1800,
      response_format: provider === 'openai' || provider === 'openrouter' || provider === 'groq' ? { type: 'json_object' } : undefined,
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

const buildInterviewerSystemPrompt = ({ field, stack, experienceLevel, interviewType, questionCount, previousSummaries = [], candidateName = 'Candidate' }) => {
  const stackText = stack ? ` Technology stack: ${stack}.` : '';
  
  // Define Domain Skill Trees
  const skillTrees = {
    'Web Development': {
      'JavaScript': ['Variables', 'Data Types', 'Operators', 'Expressions', 'Conditions', 'Loops', 'Functions', 'Scope', 'Closures', 'Hoisting', 'Objects', 'Arrays', 'Async Programming', 'Promises', 'Event Loop', 'DOM', 'ES6+'],
      'React': ['JSX', 'Components', 'Props', 'State', 'useState', 'useEffect', 'Context API', 'Routing', 'Forms', 'API Calls', 'Performance', 'Optimization', 'Error Boundaries', 'Architecture'],
      'Backend': ['Node.js', 'Express', 'Authentication', 'Authorization', 'APIs', 'Middleware', 'Error Handling', 'Security'],
      'Database': ['MongoDB', 'Indexing', 'Aggregation', 'Relationships']
    },
    'Software Engineering': {
      'Fundamentals': ['Variables', 'Data Types', 'Loops', 'Functions', 'Scope', 'Closures', 'Promises', 'Async Programming'],
      'System Design': ['System Design', 'Scalability', 'Distributed Systems', 'CAP Theorem', 'Event Sourcing', 'Load Balancers', 'Microservices', 'Caching'],
      'DevOps & Scaling': ['Redux', 'Docker', 'Redis', 'AWS', 'CI/CD']
    }
  };

  const domainTree = skillTrees[field] || skillTrees['Web Development'];

  const historyText = previousSummaries.length > 0 
    ? `We have found summaries of the candidate's PREVIOUS completed interviews in this domain: \n${JSON.stringify(previousSummaries, null, 2)}\n- Spend heavily on previous 'weak' or 'not_assessed' areas. Reduce coverage on mastered strengths. Measure improvement!`
    : 'This is the candidate\'s first completed interview in this field. Start with standard topic mapping.';

  return `
# AI INTERVIEWER & KNOWLEDGE GAP ELIMINATION BEHAVIOR PROMPT

You are not a chatbot.
You are an experienced Human Interviewer, Technical Lead, and Mentor conducting a realistic professional hiring simulation.
Your goal is NOT to ask a fixed list of questions.
Your goal is: "Kya mujhe candidate ki actual capability aur knowledge gaps samajh aa gayi hai?"
You must systematically identify what the candidate knows, what they do not know, and create a roadmap to eliminate their knowledge gaps.

Candidate name: **${candidateName}**
Selected Domain: **${field}**
Tech Stack: **${stack || 'General'}**
Experience Level: **${experienceLevel}**

---

## DOMAIN SKILL TREE ARCHITECTURE
You are tracking competency across the following structured skill tree nodes:
${JSON.stringify(domainTree, null, 2)}

---

## 1. EVIDENCE-BASED SKILL CLASSIFICATION
You must maintain a dynamic status map for every skill in the tree.
A skill can ONLY be marked "mastered" if you have explicitly verified:
1. Concept verified (theoretical understanding)
2. Practical implementation verified (syntax or code structure)
3. Real project usage verified (how they used it in a project)
4. Debugging/troubleshooting verified (how they handle edge cases or solve bugs with it)
Otherwise, classify it as "average" (concept okay but lacks practical/project depth), "weak" (has major misconceptions, errors, or fails to answer), or "not_assessed" (never queried).

---

## 2. PROGRESSIVE COVERAGE STRATEGY
Do not attempt to assess the entire skill tree in a single session. Adapt based on experience:
- **FRESHER MODE**: Focus heavily on Fundamentals Coverage (variables, loops, basic functions, react state/props, API fetching, simple debugging). Verify core blocks. Do NOT rush into advanced enterprise system architectures unless they explicitly introduce it themselves.
- **EXPERIENCED MODE (Junior, Mid, Senior)**: Skip basic questions. Target Intermediate and Advanced Coverage (optimization, caching, docker, Redis, CI/CD, React memoization trade-offs, security, databases, system design).
- **WEAK AREA REMEDIATION**: If a skill was marked "weak" in history or earlier turns, reassess it using a different project, example, or context to check for true capability.

---

## 3. REAL HIRING SIMULATION & CONTEXTUAL PROBING
Do not ask HR or project questions as a generic checklist. Listen to their answers and probe:
- **layoffs vs resignations**: If candidate says "I left because of layoffs", follow up contextually: "What happened? How did you handle it? What did you learn?". If they resigned, follow up on what was missing in their previous role.
- **Career Analysis**: Dig deep into team experience, actual ownership scope, and real project business/technical impact.
- Generate future technical or behavioral questions based on candidate history.

---

## 4. MULTI-LANGUAGE Hinglish/Hindi COMMUNICATION
- The candidate can answer in English, Hindi, Hinglish, or mixed-language.
- You must remain a professional, English-first interviewer.
- However, to make the conversation feel natural, encourage them and sprinkle minor Hindi/Hinglish feedback or clarifications:
  * Example: "Your explanation of useState was correct. Bas thoda aur closures se relative detail me batate to answer stronger lagta."
  * Maintain professional standards, do not switch entirely to Hindi.

---

## 5. CAPABILITY-BASED COMPLETION RULE
You have asked **${questionCount}** questions so far.
- Count alone must NEVER determine completion.
- You may conclude the interview ONLY when you have gathered sufficient, high-confidence evidence to form a detailed hiring recommendation and mapped their core capability gaps, OR when you reach the hard cap of 15 questions.
- If **${questionCount} < 5**: You MUST continue the interview. Set \`isCompleted: false\`.

---

## REPEAT INTERVIEWS & PRIOR MASTERIES
${historyText}

---

## REQUIRED STRICT JSON RESPONSE SCHEMA
Always respond in strict JSON matching this structure exactly (do not output any markdown code fences, headers, or text outside the JSON):
{
  "isCompleted": boolean,
  "evaluation": {
    "correctness": "Strong | Good | Needs improvement",
    "technicalDepth": "Deep | Moderate | Basic",
    "communication": "Clear | Solid | Could improve",
    "missingPoints": "Constructive explanation of what was missing, edge cases not covered, or weak points",
    "confidence": "percentage, e.g. 85%",
    "improvedAnswer": "A polished professional response demonstrating a model answer to this question",
    "tips": ["tip 1", "tip 2", "tip 3"],
    "score": {
      "accuracy": number,
      "technical": number,
      "communication": number,
      "confidence": number
    },
    "scoringJustification": "detailed evidence-based paragraph explaining exactly how these scores were derived",
    "skillsPerformance": [
      {
        "skill": "name of skill from domain tree",
        "status": "mastered | average | weak | not_assessed",
        "confidence": "percentage string, e.g. 90%",
        "evidence": "detailed justification mapping to conceptual, practical, project, and debugging verification"
      }
    ],
    "coveragePercentage": number
  },
  "nextQuestion": {
    "question": "next targeted probing question or contextual follow-up",
    "difficulty": "Easy | Medium | Hard",
    "expectedFocus": "what the candidate should focus on in their answer",
    "followUps": []
  } | null,
  "summary": {
    "overallScore": number,
    "technicalScore": number,
    "communicationScore": number,
    "problemSolvingScore": number,
    "confidenceScore": number,
    "completed": number,
    "totalQuestions": number,
    "strengths": ["observed strength 1", "observed strength 2"],
    "weaknesses": ["observed improvement 1", "observed improvement 2"],
    "recommendedTopics": ["topic 1", "topic 2"],
    "readiness": "Interview-ready | Strong candidate with room to polish | Needs more focused practice",
    "marketReadiness": "Explicit market readiness statement summarizing targeted roles",
    "skillsPerformance": [
      {
        "skill": "name of skill",
        "status": "mastered | average | weak | not_assessed",
        "confidence": "percentage string",
        "evidence": "evidence justification"
      }
    ],
    "coveragePercentage": number,
    "marketReadinessMatrix": {
      "internship": "Ready | Polishing | Not Ready | Not Assessed",
      "junior": "Ready | Polishing | Not Ready | Not Assessed",
      "midLevel": "Ready | Polishing | Not Ready | Not Assessed",
      "senior": "Ready | Polishing | Not Ready | Not Assessed"
    },
    "timePhasedLearningPlan": {
      "immediate": ["Priority 1: Urgent concept gaps to resolve"],
      "next30Days": ["Detailed 30-day topic roadmap and project builds"],
      "next90Days": ["Advanced optimization and system topics for long-term growth"]
    },
    "closingMessage": "Natural, personalized human-like closing message directly addressing ${candidateName} summarizing their capability.",
    "hiringRecommendation": {
      "recommendation": "Strong Hire | Hire | Borderline | Not Yet Ready",
      "confidence": "percentage string",
      "strengths": ["strengths"],
      "weaknesses": ["weaknesses"],
      "hiring_rationale": "comprehensive explanation of capability, fit, and role alignment."
    }
  } | null
}
`.trim();
};

const formatConversationHistory = (messages) => {
  return messages
    .map((msg) => {
      if (msg.role === 'user') {
        return `[Candidate]: ${msg.text}`;
      }
      if (msg.role === 'ai') {
        if (msg.type === 'question') {
          return `[Interviewer]: ${msg.question?.question || msg.text}`;
        }
        if (msg.type === 'feedback') {
          return `[Interviewer (Feedback Analysis)]: Correctness: ${msg.analysis?.correctness}, Technical: ${msg.score?.technical}%, Justification: ${msg.analysis?.missingPoints}`;
        }
        if (msg.type === 'system' || msg.type === 'note') {
          return `[System Note]: ${msg.text}`;
        }
      }
      return `[${msg.role}]: ${msg.text || ''}`;
    })
    .join('\n\n');
};

const normalizeSkillsPerformance = (skillsPerf) => {
  if (!Array.isArray(skillsPerf)) return [];
  return skillsPerf
    .filter(item => item && typeof item.skill === 'string' && item.skill.trim())
    .map(item => ({
      skill: item.skill.trim(),
      status: ['mastered', 'average', 'weak', 'not_assessed'].includes(item.status) ? item.status : 'not_assessed',
      confidence: typeof item.confidence === 'string' ? item.confidence.trim() : '0%',
      evidence: typeof item.evidence === 'string' ? item.evidence.trim() : '',
    }));
};

const normalizeEvaluationResponse = (parsed, questionCount) => {
  const isCompleted = !!parsed?.isCompleted;
  
  const rawEval = parsed?.evaluation || {};
  const evaluation = {
    correctness: typeof rawEval.correctness === 'string' ? rawEval.correctness.trim() : 'Good',
    technicalDepth: typeof rawEval.technicalDepth === 'string' ? rawEval.technicalDepth.trim() : 'Moderate',
    communication: typeof rawEval.communication === 'string' ? rawEval.communication.trim() : 'Solid',
    missingPoints: typeof rawEval.missingPoints === 'string' ? rawEval.missingPoints.trim() : 'Add more specific examples and structure.',
    confidence: typeof rawEval.confidence === 'string' ? rawEval.confidence.trim() : '75%',
    improvedAnswer: typeof rawEval.improvedAnswer === 'string' ? rawEval.improvedAnswer.trim() : 'A comprehensive professional response includes examples.',
    tips: Array.isArray(rawEval.tips)
      ? rawEval.tips.filter((tip) => typeof tip === 'string' && tip.trim()).slice(0, 4)
      : ['Ensure structured answer.', 'Explain architectural tradeoffs.', 'Give real project references.'],
    score: {
      accuracy: typeof rawEval.score?.accuracy === 'number' ? rawEval.score.accuracy : 70,
      technical: typeof rawEval.score?.technical === 'number' ? rawEval.score.technical : 68,
      communication: typeof rawEval.score?.communication === 'number' ? rawEval.score.communication : 75,
      confidence: typeof rawEval.score?.confidence === 'number' ? rawEval.score.confidence : 70,
    },
    scoringJustification: typeof rawEval.scoringJustification === 'string' ? rawEval.scoringJustification.trim() : 'Based on clarity and technical content.',
    skillsPerformance: normalizeSkillsPerformance(rawEval.skillsPerformance),
    coveragePercentage: typeof rawEval.coveragePercentage === 'number' ? rawEval.coveragePercentage : 0,
  };

  let nextQuestion = null;
  if (!isCompleted && parsed?.nextQuestion) {
    nextQuestion = {
      question: typeof parsed.nextQuestion.question === 'string' ? parsed.nextQuestion.question.trim() : 'Explain your approach further.',
      difficulty: typeof parsed.nextQuestion.difficulty === 'string' ? parsed.nextQuestion.difficulty.trim() : 'Medium',
      expectedFocus: typeof parsed.nextQuestion.expectedFocus === 'string' ? parsed.nextQuestion.expectedFocus.trim() : 'Cover technical tradeoffs.',
      followUps: Array.isArray(parsed.nextQuestion.followUps)
        ? parsed.nextQuestion.followUps.filter((f) => typeof f === 'string' && f.trim()).slice(0, 3)
        : [],
    };
  }

  let summary = null;
  if (isCompleted && parsed?.summary) {
    const rawSum = parsed.summary;
    const rawRec = rawSum.hiringRecommendation || {};
    summary = {
      overallScore: typeof rawSum.overallScore === 'number' ? rawSum.overallScore : 70,
      technicalScore: typeof rawSum.technicalScore === 'number' ? rawSum.technicalScore : 70,
      communicationScore: typeof rawSum.communicationScore === 'number' ? rawSum.communicationScore : 70,
      problemSolvingScore: typeof rawSum.problemSolvingScore === 'number' ? rawSum.problemSolvingScore : 70,
      confidenceScore: typeof rawSum.confidenceScore === 'number' ? rawSum.confidenceScore : 70,
      completed: questionCount,
      totalQuestions: questionCount,
      strengths: Array.isArray(rawSum.strengths)
        ? rawSum.strengths.filter((s) => typeof s === 'string' && s.trim())
        : ['Clear communication'],
      weaknesses: Array.isArray(rawSum.weaknesses)
        ? rawSum.weaknesses.filter((w) => typeof w === 'string' && w.trim())
        : ['Needs deeper technical coverage'],
      recommendedTopics: Array.isArray(rawSum.recommendedTopics)
        ? rawSum.recommendedTopics.filter((t) => typeof t === 'string' && t.trim())
        : ['System Architecture'],
      readiness: typeof rawSum.readiness === 'string' ? rawSum.readiness.trim() : 'Strong candidate with room to polish',
      marketReadiness: typeof rawSum.marketReadiness === 'string' ? rawSum.marketReadiness.trim() : 'Ready for Frontend Intern roles.',
      skillsPerformance: normalizeSkillsPerformance(rawSum.skillsPerformance),
      coveragePercentage: typeof rawSum.coveragePercentage === 'number' ? rawSum.coveragePercentage : 0,
      marketReadinessMatrix: {
        internship: typeof rawSum.marketReadinessMatrix?.internship === 'string' ? rawSum.marketReadinessMatrix.internship : 'Not Assessed',
        junior: typeof rawSum.marketReadinessMatrix?.junior === 'string' ? rawSum.marketReadinessMatrix.junior : 'Not Assessed',
        midLevel: typeof rawSum.marketReadinessMatrix?.midLevel === 'string' ? rawSum.marketReadinessMatrix.midLevel : 'Not Assessed',
        senior: typeof rawSum.marketReadinessMatrix?.senior === 'string' ? rawSum.marketReadinessMatrix.senior : 'Not Assessed',
      },
      timePhasedLearningPlan: {
        immediate: Array.isArray(rawSum.timePhasedLearningPlan?.immediate) 
          ? rawSum.timePhasedLearningPlan.immediate.filter(item => typeof item === 'string' && item.trim())
          : [],
        next30Days: Array.isArray(rawSum.timePhasedLearningPlan?.next30Days) 
          ? rawSum.timePhasedLearningPlan.next30Days.filter(item => typeof item === 'string' && item.trim())
          : [],
        next90Days: Array.isArray(rawSum.timePhasedLearningPlan?.next90Days) 
          ? rawSum.timePhasedLearningPlan.next90Days.filter(item => typeof item === 'string' && item.trim())
          : [],
      },
      closingMessage: typeof rawSum.closingMessage === 'string' ? rawSum.closingMessage.trim() : 'Thank you for your time. Keep building!',
      hiringRecommendation: {
        recommendation: ['Strong Hire', 'Hire', 'Borderline', 'Not Yet Ready'].includes(rawRec.recommendation) ? rawRec.recommendation : 'Borderline',
        confidence: typeof rawRec.confidence === 'string' ? rawRec.confidence.trim() : '75%',
        strengths: Array.isArray(rawRec.strengths)
          ? rawRec.strengths.filter((s) => typeof s === 'string' && s.trim())
          : [],
        weaknesses: Array.isArray(rawRec.weaknesses)
          ? rawRec.weaknesses.filter((w) => typeof w === 'string' && w.trim())
          : [],
        hiring_rationale: typeof rawRec.hiring_rationale === 'string' ? rawRec.hiring_rationale.trim() : 'The candidate demonstrates competent core skills with growth potential.',
      }
    };
  }

  return {
    isCompleted,
    evaluation,
    nextQuestion,
    summary,
  };
};

export const evaluateResponseAndNext = async (request) => {
  const apiKey = process.env.AI_API_KEY;
  const timeoutMs = Number(process.env.AI_TIMEOUT_MS) || 20000;

  if (!apiKey) {
    const error = new Error('AI service is not configured.');
    error.statusCode = 503;
    throw error;
  }

  const provider = inferProvider(apiKey);
  const model = getDefaultModel(provider);

  const { field, stack, experienceLevel, interviewType, messages = [], previousSummaries = [], candidateName = 'Candidate' } = request;
  const questionCount = messages.filter((m) => m.type === 'question').length;
  
  const systemPrompt = buildInterviewerSystemPrompt({
    field,
    stack,
    experienceLevel,
    interviewType,
    questionCount,
    previousSummaries,
    candidateName,
  });

  const formattedHistory = formatConversationHistory(messages);
  const prompt = `
Candidate Profile:
- Domain: ${field}
- Name: ${candidateName}
- Tech Stack: ${stack || 'General'}
- Experience Level: ${experienceLevel}
- Interview Mode: ${interviewType}

---

CONVERSATION HISTORY SO FAR:
${formattedHistory}

---

INSTRUCTION FOR THIS TURN:
1. Analyze the candidate's latest response (the very last [Candidate] message in the conversation history).
2. Evaluate it strictly under the evidence-based scoring rules and tailored interview mode constraints.
3. Determine whether to conclude the interview (under the progressive limits system: min 5, target 8-12, cap 15) or ask the next dynamic question.
4. Output your analysis, next question, and optional final summary strictly in the JSON format requested.
`.trim();

  try {
    const text =
      provider === 'gemini'
        ? await callGemini({ apiKey, model, timeoutMs, prompt, systemPrompt })
        : await callOpenAiCompatible({ apiKey, model, provider, timeoutMs, prompt, systemPrompt });
    
    const parsed = extractJson(text);
    return normalizeEvaluationResponse(parsed, questionCount);
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
    error.publicMessage = error.publicMessage || 'Unable to evaluate response right now.';
    throw error;
  }
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
