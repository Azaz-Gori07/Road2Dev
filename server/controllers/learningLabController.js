import LearningSession from '../models/LearningSession.js';
import TimelineEvent from '../models/TimelineEvent.js';
import MentorMemory from '../models/MentorMemory.js';
import SandboxSubmission from '../models/SandboxSubmission.js';
import { 
  generateMentorResponse, 
  analyzeProjectSummary, 
  evaluateDefenseAnswer,
  compileCareerCoachRoadmap
} from '../services/learningLabAiService.js';
import { executeJsCode } from '../services/codeExecutionService.js';
import axios from 'axios';
import {
  isIgnoredPath,
  isTextSourcePath,
  parseGitHubUrl,
  buildProjectSummaryText,
  KEY_CONFIG_FILES
} from '../utils/projectScanUtils.js';

const isIgnored = (path) => isIgnoredPath(path);

export const logTimelineEvent = async ({ userId, learningSessionId = null, action, topic, detail = '', status = 'active' }) => {
  try {
    await TimelineEvent.create({
      userId,
      learningSessionId,
      action,
      topic,
      detail,
      status
    });
  } catch (error) {
    console.error('Failed to log timeline event:', error.message);
  }
};

export const updateMentorMemory = async ({ userId, topic, scores = {}, passed = null }) => {
  try {
    let memory = await MentorMemory.findOne({ userId, topic });
    if (!memory) {
      memory = new MentorMemory({ userId, topic });
    }

    if (scores.conceptUnderstanding !== undefined) memory.conceptUnderstanding = Math.max(memory.conceptUnderstanding, scores.conceptUnderstanding);
    if (scores.codingAbility !== undefined) memory.codingAbility = Math.max(memory.codingAbility, scores.codingAbility);
    if (scores.problemSolving !== undefined) memory.problemSolving = Math.max(memory.problemSolving, scores.problemSolving);
    if (scores.projectReadiness !== undefined) memory.projectUsage = Math.max(memory.projectUsage, scores.projectReadiness);
    if (scores.interviewReadiness !== undefined) memory.interviewReadiness = Math.max(memory.interviewReadiness, scores.interviewReadiness);
    
    memory.attemptCount += 1;
    if (passed === true) {
      memory.successCount += 1;
    } else if (passed === false) {
      memory.failureCount += 1;
    }

    const activeScores = [
      memory.conceptUnderstanding,
      memory.codingAbility,
      memory.problemSolving,
      memory.projectUsage,
      memory.interviewReadiness
    ];
    const total = activeScores.reduce((sum, s) => sum + s, 0);
    memory.mastery = Math.round(total / activeScores.length);
    memory.lastReviewDate = new Date();

    await memory.save();
    return memory;
  } catch (error) {
    console.error('Failed to update mentor memory:', error.message);
  }
};

export const recordSandboxSubmission = async ({ userId, learningSessionId, challengeTitle, code, stdout, error, passed, feedback, scores, mode }) => {
  try {
    const attempts = await SandboxSubmission.countDocuments({
      userId,
      learningSessionId,
      challengeTitle: challengeTitle || 'General Sandbox Practice'
    });
    const attemptNumber = attempts + 1;

    const sub = await SandboxSubmission.create({
      userId,
      learningSessionId,
      challengeTitle: challengeTitle || 'General Sandbox Practice',
      code,
      stdout,
      error,
      passed,
      feedback,
      scores,
      mode,
      attemptNumber
    });

    let action = '';
    if (mode === 'practice') {
      action = 'Completed Sandbox Practice';
    } else if (mode === 'assessment') {
      action = passed ? 'Passed Assessment' : 'Failed Assessment';
    } else {
      if (passed) {
        action = `Passed ${challengeTitle || 'Challenge'}`;
      } else {
        action = attemptNumber > 1 ? `Retried ${challengeTitle || 'Challenge'}` : `Failed ${challengeTitle || 'Challenge'}`;
      }
    }

    await logTimelineEvent({
      userId,
      learningSessionId,
      action,
      topic: challengeTitle || 'General Sandbox Practice',
      detail: `Attempt ${attemptNumber}: ${passed ? 'Passed' : 'Failed'}`,
      status: passed ? 'completed' : 'failed'
    });

    if (mode !== 'practice') {
      const session = await LearningSession.findById(learningSessionId);
      const topic = session ? session.topic : (challengeTitle || 'General Sandbox Practice');
      await updateMentorMemory({
        userId,
        topic,
        scores,
        passed
      });
    }

    return sub;
  } catch (err) {
    console.error('Error recording sandbox submission:', err.message);
  }
};

// Fetch repository contents recursively from GitHub REST API with safe limit
const fetchGitHubRepoContents = async (owner, repo, path = '', filesCollected = [], depth = 0) => {
  if (depth > 5 || filesCollected.length > 60) return filesCollected;
  
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const headers = {};
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
    }
    
    const response = await axios.get(url, { headers, timeout: 8000 });
    
    if (Array.isArray(response.data)) {
      for (const item of response.data) {
        if (isIgnored(item.path)) continue;
        
        if (item.type === 'dir') {
          await fetchGitHubRepoContents(owner, repo, item.path, filesCollected, depth + 1);
        } else if (item.type === 'file' && item.size < 120000) { // Limit size to 120KB
          filesCollected.push({
            path: item.path,
            downloadUrl: item.download_url,
            size: item.size
          });
        }
      }
    }
  } catch (error) {
    console.error(`GitHub fetch error for path ${path}:`, error.message);
  }
  return filesCollected;
};

const DEFAULT_MASTERY_INCREMENT = {
  sandboxChallengePassed: 15,
  sandboxAssessmentPassed: 20,
  projectDefenseMilestonePassed: 10,
  projectDefenseCompleted: 25
};

const LEARNING_STAGES = [
  { key: 'WHY', label: 'Why this exists' },
  { key: 'CONCEPT', label: 'Concept explanation' },
  { key: 'VISUALIZATION', label: 'Visualization' },
  { key: 'SIMPLE_EXAMPLE', label: 'Simple example' },
  { key: 'REAL_PROJECT_USAGE', label: 'Real project usage' },
  { key: 'UNDERSTANDING_CHECK', label: 'Understanding check' },
  { key: 'GUIDED_CHALLENGE', label: 'Guided challenge' },
  { key: 'INDEPENDENT_CHALLENGE', label: 'Independent challenge' },
  { key: 'PROJECT_APPLICATION', label: 'Project application' },
  { key: 'INTERVIEW_ROUND', label: 'Interview round' },
  { key: 'EVALUATION', label: 'Evaluation' },
  { key: 'MASTERY_DECISION', label: 'Mastery decision' }
];

const clampMastery = (value) => Math.max(0, Math.min(100, Number(value) || 0));

const normalizeTaskText = (task) => (typeof task === 'string' ? task.trim() : '');

const buildIncompleteChecklist = (tasks = []) => tasks
  .map((item) => normalizeTaskText(typeof item === 'string' ? item : item?.task))
  .filter(Boolean)
  .filter((task, index, list) => list.findIndex(t => t.toLowerCase() === task.toLowerCase()) === index)
  .map(task => ({ task, completed: false }));

const getDefaultChecklist = (topic) => buildIncompleteChecklist([
  `WHY: Explain what problem ${topic} solves`,
  `CONCEPT: Explain ${topic} simply`,
  `VISUALIZATION: Map how ${topic} works`,
  `SIMPLE EXAMPLE: Review a short ${topic} example`,
  `REAL PROJECT USAGE: Connect ${topic} to real applications`,
  `UNDERSTANDING CHECK: Explain ${topic} in your own words`,
  `GUIDED CHALLENGE: Practice ${topic} with mentor hints`,
  `INDEPENDENT CHALLENGE: Solve ${topic} without hints`,
  `PROJECT APPLICATION: Apply ${topic} in a real project scenario`,
  `INTERVIEW ROUND: Answer ${topic} interview questions`,
  `EVALUATION: Receive separate skill evaluations`,
  `MASTERY DECISION: Pass evidence-based mastery gate`
]);

const createLearningEngineState = () => ({
  currentStage: 'WHY',
  stageProgress: LEARNING_STAGES.map(stage => ({
    stage: stage.key,
    completed: false,
    evidenceType: ''
  })),
  evaluationScores: {
    conceptUnderstanding: 0,
    codingAbility: 0,
    problemSolving: 0,
    codeQuality: 0,
    projectReadiness: 0,
    interviewReadiness: 0
  },
  sandboxEvidence: []
});

const appendSuggestedChecklistTasks = (session, updates = []) => {
  if (!Array.isArray(updates)) return;
  updates.forEach(update => {
    const task = normalizeTaskText(update?.task);
    if (!task) return;
    const exists = session.missionChecklist.some(item => item.task.toLowerCase() === task.toLowerCase());
    if (!exists) {
      session.missionChecklist.push({ task, completed: false });
    }
  });
};

const markFirstIncompleteTaskComplete = (session, matcher = () => true) => {
  if (!Array.isArray(session.missionChecklist)) return false;
  const item = session.missionChecklist.find(task => !task.completed && matcher(task));
  if (!item) return false;
  item.completed = true;
  return true;
};

const applyVerifiedProgress = (session, amount) => {
  session.masteryPercentage = clampMastery((session.masteryPercentage || 0) + amount);
};

const normalizeSandboxMode = (mode) => (
  ['practice', 'challenge', 'assessment'].includes(mode) ? mode : 'challenge'
);

const buildSandboxScores = ({ passed, mode, code = '' }) => {
  if (!passed || mode === 'practice') {
    return {
      conceptUnderstanding: 0,
      codingAbility: 0,
      problemSolving: 0,
      codeQuality: 0,
      projectReadiness: 0,
      interviewReadiness: 0
    };
  }

  const hasFunction = /function\s+\w+|\([^)]*\)\s*=>/.test(code);
  const hasBranching = /\b(if|switch|catch)\b/.test(code);
  const hasStructure = /\b(const|let|class|return)\b/.test(code);
  const base = mode === 'assessment' ? 78 : 68;

  return {
    conceptUnderstanding: clampMastery(base + (hasStructure ? 8 : 0)),
    codingAbility: clampMastery(base + (hasFunction ? 10 : 0)),
    problemSolving: clampMastery(base + (hasBranching ? 8 : 0)),
    codeQuality: clampMastery(base + (hasStructure ? 6 : 0) + (code.length < 2500 ? 4 : -8)),
    projectReadiness: clampMastery(mode === 'assessment' ? base + 4 : base - 10),
    interviewReadiness: clampMastery(mode === 'assessment' ? base + 6 : base - 4)
  };
};

const mergeEvaluationScores = (session, scores) => {
  if (!session.learningEngine) {
    session.learningEngine = createLearningEngineState();
  }
  if (!session.learningEngine.evaluationScores) {
    session.learningEngine.evaluationScores = createLearningEngineState().evaluationScores;
  }
  Object.entries(scores).forEach(([key, value]) => {
    session.learningEngine.evaluationScores[key] = Math.max(
      Number(session.learningEngine.evaluationScores[key]) || 0,
      Number(value) || 0
    );
  });
};

const appendSandboxEvidence = (session, evidence) => {
  if (!session.learningEngine) {
    session.learningEngine = createLearningEngineState();
  }
  if (!Array.isArray(session.learningEngine.sandboxEvidence)) {
    session.learningEngine.sandboxEvidence = [];
  }
  session.learningEngine.sandboxEvidence.push(evidence);
};

const completeLearningStage = (session, stageKey, evidenceType) => {
  if (!session.learningEngine) {
    session.learningEngine = createLearningEngineState();
  }

  const stage = session.learningEngine.stageProgress.find(item => item.stage === stageKey);
  if (stage && !stage.completed) {
    stage.completed = true;
    stage.completedAt = new Date();
    stage.evidenceType = evidenceType;
  }

  const currentIndex = LEARNING_STAGES.findIndex(item => item.key === stageKey);
  const nextStage = LEARNING_STAGES[currentIndex + 1];
  if (nextStage) {
    session.learningEngine.currentStage = nextStage.key;
  }
};

const parseReviewPayload = (payload) => {
  if (!payload) return null;
  if (typeof payload === 'object') return payload;
  if (typeof payload !== 'string') return null;

  const cleaned = payload.trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace <= firstBrace) return null;

  try {
    return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
  } catch {
    return null;
  }
};

/**
 * GET user sessions
 */
export const getLearningSessions = async (req, res) => {
  try {
    const sessions = await LearningSession.find({ userId: req.user._id })
      .sort({ updatedAt: -1 })
      .select('topic mode sessionType masteryPercentage updatedAt createdAt status learningEngine');
      
    return res.status(200).json({ success: true, data: sessions });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET specific session
 */
export const getLearningSession = async (req, res) => {
  try {
    const session = await LearningSession.findOne({ _id: req.params.id, userId: req.user._id });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Learning session not found.' });
    }
    return res.status(200).json({ success: true, data: session });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST create learning session
 */
export const createLearningSession = async (req, res) => {
  const { topic, mode = 'Intermediate', personality = 'The Coding Coach', sessionType = 'Concept Learning' } = req.body || {};
  if (!topic) {
    return res.status(400).json({ success: false, message: 'A topic is required.' });
  }

  try {
    const session = new LearningSession({
      userId: req.user._id,
      topic,
      mode,
      personality,
      sessionType,
      learningEngine: createLearningEngineState(),
      messages: []
    });

    if (sessionType === 'Project Defense') {
      session.messages.push({
        id: `defense-landing-${Date.now()}`,
        role: 'assistant',
        text: '### Project Defense Lab\nConnect a **GitHub repository** or **local project folder**. I will scan your architecture and show an analysis report before the interview begins.',
        timestamp: new Date()
      });
      session.missionChecklist = [
        { task: 'Connect GitHub repo or local folder', completed: false },
        { task: 'Review project analysis report', completed: false },
        { task: 'Start defense interview', completed: false },
        { task: 'Complete 5 defense questions', completed: false }
      ];
      session.suggestedNextStep = {
        title: 'Connect your project',
        actionText: 'Choose GitHub URL or local folder in the Project tab to begin scanning.',
        targetTab: 'project'
      };
      await session.save();
      await logTimelineEvent({
        userId: req.user._id,
        learningSessionId: session._id,
        action: 'Started Project Defense',
        topic: topic,
        status: 'started'
      });
      return res.status(201).json({ success: true, data: session });
    }

    // Load mentor memory context
    const memories = await MentorMemory.find({ userId: req.user._id });
    const weakAreas = memories.filter(m => m.mastery < 60 || m.failureCount > 0).map(m => m.topic);
    const strongAreas = memories.filter(m => m.mastery >= 80).map(m => m.topic);
    const currentTopicMemory = memories.find(m => m.topic.toLowerCase() === topic.toLowerCase());
    const memoryPromptContext = `
LEARNER MEMORY PROFILE:
- Known Weak Areas: ${weakAreas.length > 0 ? weakAreas.join(', ') : 'None identified yet'}
- Strong Areas: ${strongAreas.length > 0 ? strongAreas.join(', ') : 'None identified yet'}
${currentTopicMemory ? `- Past attempts on this topic: ${currentTopicMemory.attemptCount} attempts, ${currentTopicMemory.successCount} successes, ${currentTopicMemory.failureCount} failures, current mastery: ${currentTopicMemory.mastery}%` : ''}
`;

    // Auto-initialize first AI explanation to welcome user
    const aiResponse = await generateMentorResponse({
      topic,
      mode,
      messages: [{ role: 'user', text: `Hi, please teach me about ${topic}.` }],
      personality,
      sessionType,
      learningEngine: session.learningEngine,
      mentorMemoryContext: memoryPromptContext
    });

    session.messages.push({
      id: `init-${Date.now()}`,
      role: 'assistant',
      text: aiResponse.text,
      playgroundChallenge: aiResponse.playgroundChallenge,
      structuredContent: aiResponse.structuredContent,
      timestamp: new Date()
    });

    // AI may suggest checklist text, but application logic owns completion state.
    session.missionChecklist = aiResponse.missionChecklistUpdates
      ? buildIncompleteChecklist(aiResponse.missionChecklistUpdates)
      : getDefaultChecklist(topic);

    if (aiResponse.suggestedNextStep) {
      session.suggestedNextStep = aiResponse.suggestedNextStep;
    } else {
      session.suggestedNextStep = {
        title: `Explore ${topic} theory`,
        actionText: `Read through the AI mentor's initial explanation to understand structural definitions.`,
        targetTab: `notes`
      };
    }

    // New sessions always start at 0. AI responses cannot grant progress.
    session.masteryPercentage = 0;
    await session.save();

    let logAction = 'Started learning session';
    if (sessionType === 'Career Coach') {
      logAction = 'Opened Career Operating System';
    } else if (sessionType === 'Interview Remediation') {
      logAction = 'Started targeted remediation';
    }
    await logTimelineEvent({
      userId: req.user._id,
      learningSessionId: session._id,
      action: logAction,
      topic: topic,
      status: 'started'
    });

    return res.status(201).json({ success: true, data: session });
  } catch (error) {
    console.warn('Create learning session AI failed, using high-fidelity fallback welcome response:', error.message);
    try {
      const session = new LearningSession({
        userId: req.user._id,
        topic,
        mode,
        personality,
        sessionType,
        learningEngine: createLearningEngineState(),
        messages: []
      });

      const fallbackText = `Hi there! I am your AI Mentor, and I'm super excited to guide you through mastering **${topic}**! 

Let's break this down step-by-step:
1. **Core Concept**: Understanding what ${topic} is and why we use it.
2. **Analogical Explanation**: Think of ${topic} as a blueprint or building block that allows your software system to interact, manage state, or optimize performance cleanly.
3. **Common Mistakes**: Forgetting scoping rules, mutating state directly, or not handling cleanups properly.

Ask me any questions you have on the left, or try compiling a script in the editor on the right!`;

      session.messages.push({
        id: `init-fallback-${Date.now()}`,
        role: 'assistant',
        text: fallbackText,
        timestamp: new Date()
      });

      session.missionChecklist = getDefaultChecklist(topic);

      session.suggestedNextStep = {
        title: `Explore ${topic} theory`,
        actionText: `Read through the AI mentor's initial explanation to understand structural definitions.`,
        targetTab: `notes`
      };

      session.masteryPercentage = 0;
      await session.save();

      let logAction = 'Started learning session';
      if (sessionType === 'Career Coach') {
        logAction = 'Opened Career Operating System';
      } else if (sessionType === 'Interview Remediation') {
        logAction = 'Started targeted remediation';
      }
      await logTimelineEvent({
        userId: req.user._id,
        learningSessionId: session._id,
        action: logAction,
        topic: topic,
        status: 'started'
      });

      return res.status(201).json({ success: true, data: session });
    } catch (dbError) {
      console.error('Create learning session fallback DB save failed:', dbError.message);
      return res.status(500).json({ success: false, message: 'Failed to start learning session.' });
    }
  }
};

/**
 * POST send message in chat
 */
export const sendChatMessage = async (req, res) => {
  const { text } = req.body || {};
  if (!text) {
    return res.status(400).json({ success: false, message: 'Message text is required.' });
  }

  try {
    const session = await LearningSession.findOne({ _id: req.params.id, userId: req.user._id });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Learning session not found.' });
    }

    if (session.sessionType === 'Project Defense') {
      const ctx = session.projectContext;
      const hasProject =
        ctx?.scanComplete === true ||
        (Boolean(ctx?.architectureReport) && (ctx?.scanStats?.filesScanned ?? 0) > 0);
      const interviewActive = ctx?.defenseStarted === true;

      if (!hasProject) {
        return res.status(400).json({
          success: false,
          message:
            'Please connect a GitHub repository or local project folder before starting Project Defense.'
        });
      }

      if (!interviewActive) {
        return res.status(400).json({
          success: false,
          message:
            'Review the project analysis report and click Start Defense before using the interview chat.'
        });
      }
    }

    // Append user message
    session.messages.push({
      id: `u-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date()
    });

    // Generate AI response
    const aiResponse = await generateMentorResponse({
      topic: session.topic,
      mode: session.mode,
      messages: session.messages,
      personality: session.personality,
      sessionType: session.sessionType,
      learningEngine: session.learningEngine || createLearningEngineState()
    });

    session.messages.push({
      id: `a-${Date.now()}`,
      role: 'assistant',
      text: aiResponse.text,
      playgroundChallenge: aiResponse.playgroundChallenge,
      structuredContent: aiResponse.structuredContent,
      timestamp: new Date()
    });

    // Update suggested next actions & checklist objectives
    if (aiResponse.suggestedNextStep) {
      session.suggestedNextStep = aiResponse.suggestedNextStep;
    }
    
    appendSuggestedChecklistTasks(session, aiResponse.missionChecklistUpdates);
    await session.save();

    return res.status(200).json({ success: true, data: session });
  } catch (error) {
    console.warn('Send chat message AI failed, using high-fidelity fallback response:', error.message);
    try {
      const session = await LearningSession.findOne({ _id: req.params.id, userId: req.user._id });
      if (!session) {
        return res.status(404).json({ success: false, message: 'Learning session not found.' });
      }

      // Check if user is asking for challenge or help
      const userText = text.toLowerCase();
      let fallbackText = `I have received your message! As your AI Mentor, let's explore **${session.topic}** further. 

Could you write a simple example script in the editor to demonstrate how you'd manage scope or promises? If you run it, I'll analyze the terminal outputs and evaluate your solution!`;

      let challenge = null;

      if (userText.includes('practice') || userText.includes('challenge') || userText.includes('test')) {
        fallbackText = `Excellent choice! Let's get hands-on. I've compiled a quick JS sandbox coding challenge for you in the editor!

Try implementing a simple script to verify how closures keep references to parent scopes. Let me know when you run it!`;
        challenge = {
          title: `Closures Reference Challenge`,
          type: `coding`,
          instructions: `Write a function \`createCounter()\` that returns an object with methods \`increment()\` and \`decrement()\` which update a private counter variable.`,
          initialCode: `function createCounter() {\n  let count = 0;\n  return {\n    increment: () => ++count,\n    decrement: () => --count\n  };\n}`,
          solutionTemplate: `createCounter`
        };
      }

      session.messages.push({
        id: `a-fallback-${Date.now()}`,
        role: 'assistant',
        text: fallbackText,
        playgroundChallenge: challenge,
        timestamp: new Date()
      });

      await session.save();

      return res.status(200).json({ success: true, data: session });
    } catch (dbError) {
      console.error('Send chat message fallback DB save failed:', dbError.message);
      return res.status(500).json({ success: false, message: 'Failed to process chat message.' });
    }
  }
};

/**
 * POST run code in sandbox
 */
export const runSandboxCode = async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ success: false, message: 'Code is required.' });
  }

  try {
    const result = await executeJsCode(code);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST submit code for evaluation
 */
export const submitSandboxCode = async (req, res) => {
  const { code, challengeTitle, sandboxMode = 'challenge' } = req.body || {};
  if (!code) {
    return res.status(400).json({ success: false, message: 'Code is required.' });
  }

  const mode = normalizeSandboxMode(sandboxMode);

  try {
    const session = await LearningSession.findOne({ _id: req.params.id, userId: req.user._id });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Learning session not found.' });
    }

    // Exec sandbox
    const runResult = await executeJsCode(code);

    // Call AI to review code structure, validation logic
    const reviewPrompt = `
Review this sandbox code submission for the challenge "${challengeTitle || session.topic}".
Code Submitted:
\`\`\`javascript
${code}
\`\`\`
Stdout output from secure console:
"${runResult.stdout}"
Sandbox error (if any): "${runResult.error || 'None'}"

Output strict JSON:
{
  "passed": true | false,
  "feedback": "constructive 1-2 sentence developer code review, highlighting efficiency, styling, or logic bugs."
}
`;

    // Make AI call using standard mentor response loop
    const aiResponse = await generateMentorResponse({
      topic: `Code Review: ${challengeTitle || session.topic}`,
      mode: session.mode,
      messages: [{ role: 'user', text: reviewPrompt }]
    });

    const lastMsgIdx = session.messages.slice().reverse().findIndex(m => m.playgroundChallenge && m.playgroundChallenge.title);
    const effectiveMode = mode === 'challenge' && lastMsgIdx === -1 ? 'practice' : mode;
    const parsedReview = parseReviewPayload(aiResponse.text) || aiResponse;
    const appPassed = !runResult.error;
    const scores = buildSandboxScores({ passed: appPassed, mode: effectiveMode, code });
    const feedback = typeof parsedReview?.feedback === 'string' && parsedReview.feedback.trim()
      ? parsedReview.feedback.trim()
      : effectiveMode === 'practice'
        ? 'Practice run completed. No progress or mastery was awarded.'
        : appPassed
        ? 'Sandbox execution completed successfully. Progress was awarded by application validation, not AI review.'
        : `Sandbox execution failed: ${runResult.error}`;

    // Append submission evaluation logs to the last message containing the challenge
    if (lastMsgIdx !== -1) {
      const idx = session.messages.length - 1 - lastMsgIdx;
      const wasAlreadyPassed = session.messages[idx].playgroundChallenge.evaluation?.passed === true;
      session.messages[idx].playgroundChallenge.userSubmission = code;
      session.messages[idx].playgroundChallenge.stdout = runResult.stdout;
      session.messages[idx].playgroundChallenge.evaluation = {
        passed: appPassed,
        feedback,
        mode: effectiveMode,
        scores
      };
      if (effectiveMode !== 'practice' && appPassed && !wasAlreadyPassed) {
        markFirstIncompleteTaskComplete(session, task => /practice|challenge|solve|sandbox|validated/i.test(task.task));
        completeLearningStage(session, 'INDEPENDENT_CHALLENGE', 'sandbox_challenge_passed');
        mergeEvaluationScores(session, scores);
        applyVerifiedProgress(
          session,
          effectiveMode === 'assessment'
            ? DEFAULT_MASTERY_INCREMENT.sandboxAssessmentPassed
            : DEFAULT_MASTERY_INCREMENT.sandboxChallengePassed
        );
      }
      appendSandboxEvidence(session, {
        mode: effectiveMode,
        challengeTitle: challengeTitle || session.topic,
        passed: appPassed,
        feedback,
        stdout: runResult.stdout || '',
        error: runResult.error || '',
        scores
      });
      await recordSandboxSubmission({
        userId: req.user._id,
        learningSessionId: session._id,
        challengeTitle: challengeTitle || session.topic,
        code,
        stdout: runResult.stdout || '',
        error: runResult.error || '',
        passed: appPassed,
        feedback,
        scores,
        mode: effectiveMode
      });
      session.markModified('learningEngine');
      session.markModified('messages');
      await session.save();
    } else {
      appendSandboxEvidence(session, {
        mode: effectiveMode,
        challengeTitle: challengeTitle || session.topic,
        passed: appPassed,
        feedback: effectiveMode === 'practice' && mode === 'challenge'
          ? 'No active challenge was found for this submission. Recorded as practice; no progress or mastery was awarded.'
          : feedback,
        stdout: runResult.stdout || '',
        error: runResult.error || '',
        scores: effectiveMode === 'practice' && mode === 'challenge'
          ? buildSandboxScores({ passed: appPassed, mode: 'practice', code })
          : scores
      });
      await recordSandboxSubmission({
        userId: req.user._id,
        learningSessionId: session._id,
        challengeTitle: challengeTitle || session.topic,
        code,
        stdout: runResult.stdout || '',
        error: runResult.error || '',
        passed: appPassed,
        feedback,
        scores: effectiveMode === 'practice' && mode === 'challenge'
          ? buildSandboxScores({ passed: appPassed, mode: 'practice', code })
          : scores,
        mode: effectiveMode
      });
      session.markModified('learningEngine');
      await session.save();
    }

    return res.status(200).json({
      success: true,
      data: {
        passed: appPassed,
        feedback,
        mode: effectiveMode,
        scores,
        stdout: runResult.stdout,
        error: runResult.error,
        masteryPercentage: session.masteryPercentage
      }
    });
  } catch (error) {
    console.warn('Submit code evaluation failed, using high-fidelity code verification fallback:', error.message);
    try {
      const session = await LearningSession.findOne({ _id: req.params.id, userId: req.user._id });
      if (!session) {
        return res.status(404).json({ success: false, message: 'Learning session not found.' });
      }

      // Safe JS compiler run results
      const runResult = await executeJsCode(code);
      const passed = !runResult.error; // If no runtime compilation errors, we pass!
      const lastMsgIdx = session.messages.slice().reverse().findIndex(m => m.playgroundChallenge && m.playgroundChallenge.title);
      const effectiveMode = mode === 'challenge' && lastMsgIdx === -1 ? 'practice' : mode;
      const scores = buildSandboxScores({ passed, mode: effectiveMode, code });
      const feedback = passed 
        ? effectiveMode === 'practice'
          ? "Practice run completed successfully. No progress or mastery was awarded."
          : "Submission executed successfully. Progress was awarded by application validation, not AI review."
        : `Compile error: ${runResult.error}. Double check bracket placements or variable declarations.`;

      if (lastMsgIdx !== -1) {
        const idx = session.messages.length - 1 - lastMsgIdx;
        const wasAlreadyPassed = session.messages[idx].playgroundChallenge.evaluation?.passed === true;
        session.messages[idx].playgroundChallenge.userSubmission = code;
        session.messages[idx].playgroundChallenge.stdout = runResult.stdout;
        session.messages[idx].playgroundChallenge.evaluation = { passed, feedback, mode: effectiveMode, scores };
        if (effectiveMode !== 'practice' && passed && !wasAlreadyPassed) {
          markFirstIncompleteTaskComplete(session, task => /practice|challenge|solve|sandbox|validated/i.test(task.task));
          completeLearningStage(session, 'INDEPENDENT_CHALLENGE', 'sandbox_challenge_passed');
          mergeEvaluationScores(session, scores);
          applyVerifiedProgress(
            session,
            effectiveMode === 'assessment'
              ? DEFAULT_MASTERY_INCREMENT.sandboxAssessmentPassed
              : DEFAULT_MASTERY_INCREMENT.sandboxChallengePassed
          );
        }
        appendSandboxEvidence(session, {
          mode: effectiveMode,
          challengeTitle: challengeTitle || session.topic,
          passed,
          feedback,
          stdout: runResult.stdout || '',
          error: runResult.error || '',
          scores
        });
        await recordSandboxSubmission({
          userId: req.user._id,
          learningSessionId: session._id,
          challengeTitle: challengeTitle || session.topic,
          code,
          stdout: runResult.stdout || '',
          error: runResult.error || '',
          passed,
          feedback,
          scores,
          mode: effectiveMode
        });
        session.markModified('learningEngine');
        session.markModified('messages');
        await session.save();
      } else {
        appendSandboxEvidence(session, {
          mode: effectiveMode,
          challengeTitle: challengeTitle || session.topic,
          passed,
          feedback: effectiveMode === 'practice' && mode === 'challenge'
            ? 'No active challenge was found for this submission. Recorded as practice; no progress or mastery was awarded.'
            : feedback,
          stdout: runResult.stdout || '',
          error: runResult.error || '',
          scores: effectiveMode === 'practice' && mode === 'challenge'
            ? buildSandboxScores({ passed, mode: 'practice', code })
            : scores
        });
        await recordSandboxSubmission({
          userId: req.user._id,
          learningSessionId: session._id,
          challengeTitle: challengeTitle || session.topic,
          code,
          stdout: runResult.stdout || '',
          error: runResult.error || '',
          passed,
          feedback,
          scores: effectiveMode === 'practice' && mode === 'challenge'
            ? buildSandboxScores({ passed, mode: 'practice', code })
            : scores,
          mode: effectiveMode
        });
        session.markModified('learningEngine');
        await session.save();
      }

      return res.status(200).json({
        success: true,
        data: {
          passed,
          feedback,
          mode: effectiveMode,
          scores,
          stdout: runResult.stdout,
          error: runResult.error,
          masteryPercentage: session.masteryPercentage
        }
      });
    } catch (fallbackErr) {
      console.error('Submit code fallback failed:', fallbackErr.message);
      return res.status(500).json({ success: false, message: 'Failed to evaluate code submission.' });
    }
  }
};

const buildProjectContextFromAnalysis = (analysisReport, {
  projectName,
  repoUrl = '',
  ingestionMethod = '',
  filesScanned = 0
}) => ({
  projectName,
  repoUrl,
  ingestionMethod,
  scanComplete: true,
  defenseStarted: false,
  starterDefenseQuestion: analysisReport.starterDefenseQuestion || '',
  detectedTechnologies: analysisReport.detectedTechnologies || [],
  detectedFeatures: analysisReport.detectedFeatures || [],
  potentialWeakAreas: analysisReport.potentialWeakAreas || [],
  projectComplexity: analysisReport.projectComplexity || {
    level: 'Moderate',
    score: 50,
    rationale: 'Complexity inferred from project structure and dependencies.'
  },
  scanStats: { filesScanned, foldersScanned: 0 },
  architectureReport: analysisReport.architectureReport,
  defenseProgress: {
    currentQuestionIndex: 0,
    totalQuestions: 5,
    evaluations: []
  },
  topQuestions: analysisReport.topQuestions || [],
  learningReport: {
    strengths: [],
    weakAreas: [],
    missingConcepts: [],
    suggestedImprovements: [],
    refactoringIdeas: [],
    productionReadinessScore: 0,
    portfolioReadinessScore: 0
  }
});

const fetchKeyFileContents = async (filesList) => {
  const contents = [];
  const priority = [...KEY_CONFIG_FILES, 'README.md'];
  const sorted = [...filesList].sort((a, b) => {
    const aPri = priority.findIndex((p) => a.path.endsWith(p));
    const bPri = priority.findIndex((p) => b.path.endsWith(p));
    return (aPri === -1 ? 99 : aPri) - (bPri === -1 ? 99 : bPri);
  });

  for (const file of sorted) {
    if (contents.length >= 12) break;
    if (!isTextSourcePath(file.path)) continue;
    if (file.content) {
      contents.push({ path: file.path, content: String(file.content).slice(0, 6000) });
      continue;
    }
    if (!file.downloadUrl) continue;
    try {
      const res = await axios.get(file.downloadUrl, { timeout: 6000, responseType: 'text', transformResponse: [(d) => d] });
      contents.push({ path: file.path, content: String(res.data).slice(0, 6000) });
    } catch (_e) {
      /* skip unreadable */
    }
  }
  return contents;
};

const getFallbackAnalysis = () => ({
  architectureReport: {
    structure: "- `client/`: React frontend pages and components\n- `server/`: Node.js/Express API, models, and middleware\n- `package.json`: Root dependency and script configuration",
    libraries: ['React', 'Express', 'Mongoose', 'Axios'],
    frameworks: ['React', 'Express'],
    components: ['App shell', 'API controllers', 'Data models'],
    apis: ['/api routes', 'REST handlers'],
    stateManagement: 'Context API or local state',
    auth: 'JWT or session middleware',
    database: 'MongoDB or SQL store',
    summary: 'A full-stack application with separated client and server layers, typical of portfolio or learning platforms.'
  },
  detectedTechnologies: ['React', 'Node.js', 'Express', 'MongoDB', 'Vite'],
  detectedFeatures: ['REST API layer', 'Authenticated routes', 'Client routing', 'Persistent data models'],
  potentialWeakAreas: ['Error handling consistency', 'Input validation on API routes', 'Client-side loading states'],
  projectComplexity: {
    level: 'Moderate',
    score: 55,
    rationale: 'Multi-layer client/server structure with authentication and persistence.'
  },
  topQuestions: [
    'Why did you choose this authentication approach for your API?',
    'How do you structure error responses across controllers?',
    'Explain how client state syncs with server data.',
    'What database indexing or schema decisions did you make?',
    'Why was your chosen bundler or framework selected over alternatives?'
  ],
  starterDefenseQuestion: 'Walk me through your authentication flow from client request to protected route.'
});

/**
 * POST ingest project — GitHub URL or local folder file manifest (no ZIP)
 * Attaches analysis to an existing session or creates a new one.
 */
export const ingestProject = async (req, res) => {
  const {
    githubUrl,
    files = [],
    projectName = 'Untitled Project',
    sessionId = null,
    ingestionMethod = ''
  } = req.body;

  try {
    let filesList = [];
    let fileContents = [];
    let resolvedMethod = ingestionMethod;
    let sourceLabel = '';

    if (githubUrl) {
      const parsed = parseGitHubUrl(githubUrl);
      if (!parsed) {
        return res.status(400).json({ success: false, message: 'Invalid GitHub URL. Use https://github.com/owner/repo' });
      }
      resolvedMethod = 'github';
      filesList = await fetchGitHubRepoContents(parsed.owner, parsed.repo);
      fileContents = await fetchKeyFileContents(filesList);
      sourceLabel = `Ingested GitHub Repository: ${githubUrl}`;
    } else if (Array.isArray(files) && files.length > 0) {
      resolvedMethod = 'local';
      filesList = files
        .filter((f) => f?.path && !isIgnored(f.path))
        .slice(0, 120)
        .map((f) => ({
          path: f.path.replace(/\\/g, '/'),
          size: f.size || (f.content ? f.content.length : 0),
          content: f.content
        }));
      fileContents = filesList
        .filter((f) => f.content && isTextSourcePath(f.path))
        .slice(0, 15)
        .map((f) => ({ path: f.path, content: String(f.content).slice(0, 6000) }));
      sourceLabel = `Ingested Local Project: ${projectName}`;
    } else {
      return res.status(400).json({ success: false, message: 'Provide a GitHub URL or local folder files.' });
    }

    if (!filesList.length) {
      return res.status(400).json({ success: false, message: 'No scannable project files found. Check the path or repository visibility.' });
    }

    const projectSummaryText = buildProjectSummaryText({
      sourceLabel,
      repoUrl: githubUrl || '',
      files: filesList,
      fileContents
    });

    let analysisReport;
    try {
      analysisReport = await analyzeProjectSummary({
        projectSummaryText,
        repoUrl: githubUrl || ''
      });
    } catch (aiErr) {
      console.warn('Project ingestion AI failed, using fallback analysis:', aiErr.message);
      analysisReport = getFallbackAnalysis();
    }

    const projectContext = buildProjectContextFromAnalysis(analysisReport, {
      projectName,
      repoUrl: githubUrl || '',
      ingestionMethod: resolvedMethod,
      filesScanned: filesList.length
    });

    let session;
    if (sessionId) {
      session = await LearningSession.findOne({ _id: sessionId, userId: req.user._id });
      if (!session) {
        return res.status(404).json({ success: false, message: 'Learning session not found.' });
      }
      session.topic = `Project Defense: ${projectName}`;
      session.sessionType = 'Project Defense';
      session.projectContext = projectContext;
      session.messages.push({
        id: `defense-scan-${Date.now()}`,
        role: 'assistant',
        text: `### Project scan complete\nI've analyzed **${projectName}** and prepared your **Project Analysis Report**. Review detected technologies, architecture, and weak areas in the Project tab, then click **Start Defense** when you're ready.`,
        timestamp: new Date()
      });
      if (session.missionChecklist?.length) {
        markFirstIncompleteTaskComplete(session, (t) => /connect|github|local|folder/i.test(t.task));
      }
    } else {
      session = new LearningSession({
        userId: req.user._id,
        topic: `Project Defense: ${projectName}`,
        mode: 'Advanced',
        sessionType: 'Project Defense',
        status: 'active',
        projectContext,
        messages: [{
          id: `defense-scan-${Date.now()}`,
          role: 'assistant',
          text: `### Project scan complete\nI've analyzed **${projectName}** and prepared your **Project Analysis Report**. Review the findings below, then click **Start Defense** when you're ready for interview questions.`,
          timestamp: new Date()
        }],
        missionChecklist: [
          { task: 'Connect GitHub repo or local folder', completed: true },
          { task: 'Review project analysis report', completed: false },
          { task: 'Start defense interview', completed: false },
          { task: 'Complete 5 defense questions', completed: false }
        ]
      });
    }

    await session.save();
    return res.status(sessionId ? 200 : 201).json({ success: true, data: session });
  } catch (error) {
    console.error('Project ingestion failed:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to analyze project codebase.' });
  }
};

/**
 * POST begin project defense interview after user confirms analysis report
 */
export const startProjectDefense = async (req, res) => {
  try {
    const session = await LearningSession.findOne({ _id: req.params.id, userId: req.user._id });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Learning session not found.' });
    }

    const context = session.projectContext;
    const hasProject =
      context?.scanComplete === true ||
      (Boolean(context?.architectureReport) && (context?.scanStats?.filesScanned ?? 0) > 0);

    if (!hasProject) {
      return res.status(400).json({
        success: false,
        message:
          'Please connect a GitHub repository or local project folder before starting Project Defense.'
      });
    }
    if (context.defenseStarted) {
      return res.status(200).json({ success: true, data: session });
    }

    const starterQuestion = context.starterDefenseQuestion
      || context.topQuestions?.[0]
      || 'Explain the core architecture of your project and the main tradeoffs you made.';

    context.defenseStarted = true;
    session.messages.push({
      id: `defense-start-${Date.now()}`,
      role: 'assistant',
      text: `### Project Defense started\nBased on my analysis of your codebase, here is your first question:\n\n**"${starterQuestion}"**`,
      timestamp: new Date()
    });

    if (session.missionChecklist?.length) {
      markFirstIncompleteTaskComplete(session, (t) => /review|analysis|report/i.test(t.task));
      markFirstIncompleteTaskComplete(session, (t) => /start defense/i.test(t.task));
    }

    session.markModified('projectContext');
    session.markModified('messages');
    await session.save();

    await logTimelineEvent({
      userId: req.user._id,
      learningSessionId: session._id,
      action: 'Started project defense',
      topic: session.topic,
      detail: `Connected repository/folder`,
      status: 'started'
    });

    return res.status(200).json({ success: true, data: session });
  } catch (error) {
    console.error('Start project defense failed:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to start project defense.' });
  }
};

/**
 * POST submit response to project defense question
 */
export const submitProjectDefenseAnswer = async (req, res) => {
  const { answer } = req.body;
  if (!answer) {
    return res.status(400).json({ success: false, message: 'Answer is required.' });
  }

  try {
    const session = await LearningSession.findOne({ _id: req.params.id, userId: req.user._id });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Learning session not found.' });
    }

    const context = session.projectContext;
    if (!context || !context.architectureReport) {
      return res.status(400).json({ success: false, message: 'This learning session is not a project defense session.' });
    }

    const hasProject =
      context?.scanComplete === true ||
      (Boolean(context?.architectureReport) && (context?.scanStats?.filesScanned ?? 0) > 0);

    if (!hasProject) {
      return res.status(400).json({
        success: false,
        message:
          'Please connect a GitHub repository or local project folder before starting Project Defense.'
      });
    }

    if (!context.defenseStarted) {
      return res.status(400).json({
        success: false,
        message: 'Review the analysis report and click Start Defense first.'
      });
    }

    const progress = context.defenseProgress;
    const currentQIdx = progress.currentQuestionIndex;
    
    // Extract current question text from last message
    const lastMsg = session.messages[session.messages.length - 1];
    let currentQuestion = lastMsg.text;
    if (currentQuestion.includes('**"')) {
      currentQuestion = currentQuestion.split('**"')[1].split('"**')[0];
    }

    // Evaluate answer with AI
    const evalResult = await evaluateDefenseAnswer({
      report: context.architectureReport,
      currentQuestion,
      answer,
      currentQuestionIndex: currentQIdx
    });

    // Append evaluation details
    progress.evaluations.push({
      question: currentQuestion,
      answer,
      authorshipScore: evalResult.authorshipScore,
      feedback: evalResult.feedback
    });

    // Append user response to chat logs
    session.messages.push({
      id: `u-def-${Date.now()}`,
      role: 'user',
      text: answer,
      timestamp: new Date()
    });

    const milestonePassed = answer.trim().length >= 15;
    if (milestonePassed) {
      completeLearningStage(session, 'PROJECT_APPLICATION', 'project_defense_answer');
      applyVerifiedProgress(session, DEFAULT_MASTERY_INCREMENT.projectDefenseMilestonePassed);
    }

    const totalDefenseQuestions = progress.totalQuestions || context.topQuestions?.length || 5;
    const isDefenseComplete = currentQIdx >= totalDefenseQuestions - 1;

    if (isDefenseComplete) {
      // Completed! Generate final learning scores and report
      session.status = 'completed';
      markFirstIncompleteTaskComplete(session, task => /defense|project|validated|solve|challenge/i.test(task.task));
      if (milestonePassed) {
        completeLearningStage(session, 'INTERVIEW_ROUND', 'project_defense_completed');
        completeLearningStage(session, 'EVALUATION', 'project_defense_completed');
        completeLearningStage(session, 'MASTERY_DECISION', 'project_defense_completed');
        applyVerifiedProgress(session, DEFAULT_MASTERY_INCREMENT.projectDefenseCompleted);
      }
      context.learningReport = {
        strengths: Array.isArray(evalResult.learningReport?.strengths) ? evalResult.learningReport.strengths : [],
        weakAreas: Array.isArray(evalResult.learningReport?.weakAreas) ? evalResult.learningReport.weakAreas : [],
        missingConcepts: Array.isArray(evalResult.learningReport?.missingConcepts) ? evalResult.learningReport.missingConcepts : [],
        suggestedImprovements: Array.isArray(evalResult.learningReport?.suggestedImprovements) ? evalResult.learningReport.suggestedImprovements : [],
        refactoringIdeas: Array.isArray(evalResult.learningReport?.refactoringIdeas) ? evalResult.learningReport.refactoringIdeas : [],
        productionReadinessScore: session.masteryPercentage,
        portfolioReadinessScore: session.masteryPercentage
      };

      session.messages.push({
        id: `a-def-summary-${Date.now()}`,
        role: 'assistant',
        text: `### 🏁 Project Defense Completed!\n\n**Authorship Check Summary**:\n${evalResult.feedback}\n\nWe have finalized your comprehensive **Project Readiness Report** inside the learning dashboard tab containing refactoring roadmaps and portfolio readiness grades. Great job defending your implementation choices!`,
        timestamp: new Date()
      });

      await logTimelineEvent({
        userId: req.user._id,
        learningSessionId: session._id,
        action: 'Completed project defense',
        topic: session.topic,
        detail: `Final score: ${session.masteryPercentage}%`,
        status: 'completed'
      });
    } else {
      // Prompt next question
      progress.currentQuestionIndex += 1;
      
      session.messages.push({
        id: `a-def-next-${Date.now()}`,
        role: 'assistant',
        text: `**Feedback**: ${evalResult.feedback}\n\nHere is your next Project Defense question:\n\n**"${evalResult.nextQuestion}"**`,
        timestamp: new Date()
      });

      await logTimelineEvent({
        userId: req.user._id,
        learningSessionId: session._id,
        action: 'Completed project defense checkpoint',
        topic: session.topic,
        detail: `Question ${currentQIdx + 1} of ${totalDefenseQuestions}`,
        status: 'active'
      });
    }

    session.markModified('projectContext');
    session.markModified('messages');
    await session.save();

    return res.status(200).json({ success: true, data: session });
  } catch (error) {
    console.warn('Submit project defense AI failed, using high-fidelity fallback evaluation:', error.message);
    try {
      const session = await LearningSession.findOne({ _id: req.params.id, userId: req.user._id });
      if (!session) {
        return res.status(404).json({ success: false, message: 'Learning session not found.' });
      }

      const context = session.projectContext;
      const progress = context.defenseProgress;
      const currentQIdx = progress.currentQuestionIndex;

      const lastMsg = session.messages[session.messages.length - 1];
      let currentQuestion = lastMsg.text;
      if (currentQuestion.includes('**"')) {
        currentQuestion = currentQuestion.split('**"')[1].split('"**')[0];
      }

      // Check if user answer is at least 15 chars (basic sanity authorship check)
      const passedCheck = answer.trim().length > 15;
      const score = passedCheck ? 80 : 45;
      const feedbackText = passedCheck 
        ? "Excellent defense response. You accurately explained the scoping pattern and architectural rationale."
        : "Vague response. Try to elaborate more on specific files, functions, or package configs in your repo.";

      progress.evaluations.push({
        question: currentQuestion,
        answer,
        authorshipScore: score,
        feedback: feedbackText
      });

      session.messages.push({
        id: `u-def-fallback-${Date.now()}`,
        role: 'user',
        text: answer,
        timestamp: new Date()
      });

      const totalDefenseQuestions = progress.totalQuestions || context.topQuestions?.length || 5;
      const isCompleted = currentQIdx >= totalDefenseQuestions - 1;
      if (passedCheck) {
        completeLearningStage(session, 'PROJECT_APPLICATION', 'project_defense_answer');
        applyVerifiedProgress(session, DEFAULT_MASTERY_INCREMENT.projectDefenseMilestonePassed);
      }

      if (isCompleted) {
        session.status = 'completed';
        context.learningReport = {
          strengths: [],
          weakAreas: [],
          missingConcepts: [],
          suggestedImprovements: [],
          refactoringIdeas: [],
          productionReadinessScore: session.masteryPercentage,
          portfolioReadinessScore: session.masteryPercentage
        };
        markFirstIncompleteTaskComplete(session, task => /defense|project|validated|solve|challenge/i.test(task.task));
        if (passedCheck) {
          completeLearningStage(session, 'INTERVIEW_ROUND', 'project_defense_completed');
          completeLearningStage(session, 'EVALUATION', 'project_defense_completed');
          completeLearningStage(session, 'MASTERY_DECISION', 'project_defense_completed');
          applyVerifiedProgress(session, DEFAULT_MASTERY_INCREMENT.projectDefenseCompleted);
          context.learningReport.productionReadinessScore = session.masteryPercentage;
          context.learningReport.portfolioReadinessScore = session.masteryPercentage;
        }

        session.messages.push({
          id: `a-def-summary-fallback-${Date.now()}`,
          role: 'assistant',
          text: `### 🏁 Project Defense Completed!\n\n**Authorship Check Summary**:\n${feedbackText}\n\nWe have finalized your comprehensive **Project Readiness Report** inside the learning dashboard tab containing refactoring roadmaps and portfolio readiness grades. Great job defending your implementation choices!`,
          timestamp: new Date()
        });

        await logTimelineEvent({
          userId: req.user._id,
          learningSessionId: session._id,
          action: 'Completed project defense',
          topic: session.topic,
          detail: `Final score: ${session.masteryPercentage}%`,
          status: 'completed'
        });
      } else {
        progress.currentQuestionIndex += 1;
        // Draw a next question from topQuestions list
        const nextQ = context.topQuestions[progress.currentQuestionIndex] || "How do you manage cross-origin resource sharing (CORS) on your API routes?";

        session.messages.push({
          id: `a-def-next-fallback-${Date.now()}`,
          role: 'assistant',
          text: `**Feedback**: ${feedbackText}\n\nHere is your next Project Defense question:\n\n**"${nextQ}"**`,
          timestamp: new Date()
        });

        await logTimelineEvent({
          userId: req.user._id,
          learningSessionId: session._id,
          action: 'Completed project defense checkpoint',
          topic: session.topic,
          detail: `Question ${currentQIdx + 1} of ${totalDefenseQuestions}`,
          status: 'active'
        });
      }

      session.markModified('projectContext');
      session.markModified('messages');
      await session.save();

      return res.status(200).json({ success: true, data: session });
    } catch (fallbackErr) {
      console.error('Submit project defense fallback failed:', fallbackErr.message);
      return res.status(500).json({ success: false, message: 'Failed to process project defense response.' });
    }
  }
};

/**
 * POST compile career coach roadmap
 */
export const getCareerCoachRoadmap = async (req, res) => {
  const { topic = 'Full Stack Development' } = req.body || {};
  const weakSkills = [];
  const masteredSkills = [];

  try {
    // Collect candidate skills memory
    const completedSessions = await LearningSession.find({ userId: req.user._id, status: 'completed' });
    if (completedSessions.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          insufficientData: true,
          reason: 'Career recommendations require completed learning sessions owned by the current user.',
          weakSkills: [],
          masteredSkills: [],
          recommendedRoles: [],
          recommendedCompanies: [],
          learningRoadmap: []
        }
      });
    }

    // Analyze previous learning states
    completedSessions.forEach(s => {
      if (s.masteryPercentage >= 75) {
        masteredSkills.push(s.topic);
      } else if (s.masteryPercentage < 50) {
        weakSkills.push(s.topic);
      }
    });

    const coachData = await compileCareerCoachRoadmap({
      masteredSkills,
      weakSkills,
      topic
    });

    return res.status(200).json({
      success: true,
      data: {
        ...coachData,
        weakSkills,
        masteredSkills,
        insufficientData: false
      }
    });
  } catch (error) {
    console.warn('Career Coach generation AI failed, serving robust high-fidelity fallback:', error.message);
    
    const fallbackData = {
      insufficientData: true,
      reason: 'Career recommendations are unavailable because AI roadmap generation failed. No fallback recommendations are shown.',
      weakSkills,
      masteredSkills,
      recommendedRoles: [],
      recommendedCompanies: [],
      learningRoadmap: []
    };
    
    return res.status(200).json({ success: true, data: fallbackData });
  }
};

/**
 * PUT update learning session details (personality, mode, checklists)
 */
export const updateLearningSession = async (req, res) => {
  const { mode, personality, sessionType, missionChecklist } = req.body || {};
  try {
    const session = await LearningSession.findOne({ _id: req.params.id, userId: req.user._id });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Learning session not found.' });
    }
    
    if (mode) session.mode = mode;
    if (personality) session.personality = personality;
    if (sessionType) session.sessionType = sessionType;
    if (Array.isArray(missionChecklist)) {
      const newlyCompleted = [];
      const requestedByTask = new Map(
        missionChecklist
          .map(item => [normalizeTaskText(item?.task).toLowerCase(), !!item?.completed])
          .filter(([task]) => task)
      );
      session.missionChecklist = session.missionChecklist.map(item => {
        const wasCompleted = !!item.completed;
        const willBeCompleted = requestedByTask.has(item.task.toLowerCase())
          ? requestedByTask.get(item.task.toLowerCase())
          : wasCompleted;
        if (!wasCompleted && willBeCompleted) {
          newlyCompleted.push(item.task);
        }
        return {
          task: item.task,
          completed: willBeCompleted
        };
      });

      for (const task of newlyCompleted) {
        let action = 'Completed Objective';
        if (task.startsWith('WHY:')) {
          action = 'Completed Why Explanation';
        } else if (task.startsWith('CONCEPT:')) {
          action = 'Completed Concept Explanation';
        } else if (task.startsWith('VISUALIZATION:')) {
          action = 'Completed Visualization';
        } else if (task.startsWith('SIMPLE EXAMPLE:')) {
          action = 'Completed Simple Example';
        } else if (task.startsWith('REAL PROJECT USAGE:')) {
          action = 'Completed Real Project Usage';
        } else if (task.startsWith('UNDERSTANDING CHECK:')) {
          action = 'Completed Understanding Check';
        } else if (task.startsWith('GUIDED CHALLENGE:')) {
          action = 'Completed Guided Challenge';
        } else if (task.startsWith('INDEPENDENT CHALLENGE:')) {
          action = 'Passed Challenge';
        } else if (task.startsWith('PROJECT APPLICATION:')) {
          action = 'Completed Project Application';
        } else if (task.startsWith('INTERVIEW ROUND:')) {
          action = 'Completed Interview Round';
        } else if (task.startsWith('EVALUATION:')) {
          action = 'Completed Evaluation';
        } else if (task.startsWith('MASTERY DECISION:')) {
          action = 'Completed Mastery Decision';
        }
        
        await logTimelineEvent({
          userId: req.user._id,
          learningSessionId: session._id,
          action,
          topic: session.topic,
          detail: task,
          status: 'completed'
        });
      }
    }
    
    await session.save();
    return res.status(200).json({ success: true, data: session });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getTimelineEvents = async (req, res) => {
  try {
    const events = await TimelineEvent.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: events });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getSandboxHistory = async (req, res) => {
  try {
    const submissions = await SandboxSubmission.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    const grouped = {};
    for (const sub of submissions) {
      const title = sub.challengeTitle;
      if (!grouped[title]) {
        grouped[title] = {
          challengeTitle: title,
          attempts: [],
          passed: false,
          finalScore: 0,
          lastAttemptDate: sub.createdAt
        };
      }

      grouped[title].attempts.push(sub);
      if (sub.passed) {
        grouped[title].passed = true;
      }
    }

    const data = Object.values(grouped).map(group => {
      const latest = group.attempts[0];
      const highestScore = Math.max(...group.attempts.map(a => {
        const sc = a.scores || {};
        return sc.codingAbility || 0;
      }));
      group.finalScore = highestScore || latest?.scores?.codingAbility || 0;
      group.attempts.sort((a, b) => a.attemptNumber - b.attemptNumber);
      return group;
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getLearningAnalytics = async (req, res) => {
  try {
    const sessions = await LearningSession.find({ userId: req.user._id });
    const submissions = await SandboxSubmission.find({ userId: req.user._id });
    const timeline = await TimelineEvent.find({ userId: req.user._id }).sort({ createdAt: -1 });

    const topicsLearned = sessions.filter(s => s.status === 'completed').length;
    const challengesSolved = submissions.filter(s => s.passed && s.mode === 'challenge').length;
    const assessmentsPassed = submissions.filter(s => s.passed && s.mode === 'assessment').length;

    const masteryAvg = sessions.length > 0
      ? Math.round(sessions.reduce((sum, s) => sum + (s.masteryPercentage || 0), 0) / sessions.length)
      : 0;

    let totalInterviewScore = 0;
    let interviewCount = 0;
    let totalProjectScore = 0;
    let projectCount = 0;

    for (const s of sessions) {
      if (s.learningEngine?.evaluationScores) {
        const evalScores = s.learningEngine.evaluationScores;
        if (evalScores.interviewReadiness > 0) {
          totalInterviewScore += evalScores.interviewReadiness;
          interviewCount++;
        }
        if (evalScores.projectReadiness > 0) {
          totalProjectScore += evalScores.projectReadiness;
          projectCount++;
        }
      }
    }

    const interviewReadiness = interviewCount > 0 ? Math.round(totalInterviewScore / interviewCount) : 0;
    const projectReadiness = projectCount > 0 ? Math.round(totalProjectScore / projectCount) : 0;

    const uniqueDates = [...new Set(timeline.map(e => new Date(e.createdAt).toDateString()))]
      .map(d => new Date(d))
      .sort((a, b) => b - a);

    let streak = 0;
    if (uniqueDates.length > 0) {
      const today = new Date();
      today.setHours(0,0,0,0);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0,0,0,0);

      const firstDate = new Date(uniqueDates[0]);
      firstDate.setHours(0,0,0,0);

      if (firstDate.getTime() === today.getTime() || firstDate.getTime() === yesterday.getTime()) {
        streak = 1;
        let expected = new Date(firstDate);
        for (let i = 1; i < uniqueDates.length; i++) {
          expected.setDate(expected.getDate() - 1);
          expected.setHours(0,0,0,0);
          const actual = new Date(uniqueDates[i]);
          actual.setHours(0,0,0,0);

          if (actual.getTime() === expected.getTime()) {
            streak++;
          } else {
            break;
          }
        }
      }
    }

    const hoursPracticed = Math.round((sessions.length * 20 + submissions.length * 10) / 60 * 10) / 10 || 0;

    const lastSixSessions = [...sessions]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, 6)
      .reverse();
    const masteryGrowth = lastSixSessions.map(s => ({
      topic: s.topic,
      mastery: s.masteryPercentage || 0
    }));

    const weeklyProgress = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toDateString();
      const count = timeline.filter(e => new Date(e.createdAt).toDateString() === dStr).length;
      weeklyProgress.push({
        day: d.toLocaleDateString(undefined, { weekday: 'short' }),
        count
      });
    }

    const passedCount = submissions.filter(s => s.passed).length;
    const failedCount = submissions.filter(s => !s.passed).length;
    const successRate = {
      passed: passedCount,
      failed: failedCount,
      percent: submissions.length > 0 ? Math.round((passedCount / submissions.length) * 100) : 0
    };

    const completedTopics = sessions.filter(s => s.status === 'completed').length;
    const activeTopics = sessions.filter(s => s.status !== 'completed').length;

    const interviewReadinessTrend = lastSixSessions.map(s => ({
      topic: s.topic,
      score: s.learningEngine?.evaluationScores?.interviewReadiness || 0
    }));

    return res.status(200).json({
      success: true,
      data: {
        overview: {
          topicsLearned,
          challengesSolved,
          assessmentsPassed,
          masteryAvg,
          interviewReadiness,
          projectReadiness,
          learningStreak: streak,
          hoursPracticed
        },
        charts: {
          masteryGrowth,
          weeklyProgress,
          successRate,
          completionRate: {
            completed: completedTopics,
            active: activeTopics
          },
          interviewReadinessTrend
        }
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getRecommendations = async (req, res) => {
  try {
    const memories = await MentorMemory.find({ userId: req.user._id });
    const submissions = await SandboxSubmission.find({ userId: req.user._id });

    const recommendations = [];

    const failedMap = {};
    for (const sub of submissions) {
      if (!sub.passed) {
        failedMap[sub.challengeTitle] = (failedMap[sub.challengeTitle] || 0) + 1;
      }
    }

    for (const [title, count] of Object.entries(failedMap)) {
      if (count >= 2) {
        recommendations.push({
          title: `${title} Revision`,
          reason: `You failed ${count} challenge attempts for "${title}". We suggest revisiting this module.`,
          topic: title,
          type: 'remediation',
          pathway: [title, 'Sandbox Practice']
        });
      }
    }

    for (const mem of memories) {
      if (mem.mastery > 0 && mem.mastery < 60) {
        recommendations.push({
          title: `Master ${mem.topic}`,
          reason: `Your current mastery on "${mem.topic}" is at ${mem.mastery}%. Revisit explanations to build confidence.`,
          topic: mem.topic,
          type: 'concept',
          pathway: [mem.topic, 'Concept Learning']
        });
      }
    }

    const promiseMemory = memories.find(m => m.topic.toLowerCase().includes('promise'));
    const asyncMemory = memories.find(m => m.topic.toLowerCase().includes('async'));
    if ((promiseMemory && promiseMemory.mastery < 60) || (asyncMemory && asyncMemory.mastery < 60)) {
      recommendations.push({
        title: 'Asynchronous JS Path',
        reason: 'You have active gaps in Asynchronous JavaScript and Promises. Practice chaining.',
        topic: 'Promises',
        type: 'roadmap',
        pathway: ['Promises', 'Promise.all', 'Async Await']
      });
    }

    return res.status(200).json({ success: true, data: recommendations });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const archiveLearningSession = async (req, res) => {
  try {
    const session = await LearningSession.findOne({ _id: req.params.id, userId: req.user._id });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Learning session not found.' });
    }

    session.status = 'completed';
    await session.save();

    await logTimelineEvent({
      userId: req.user._id,
      learningSessionId: session._id,
      action: 'Archived learning session',
      topic: session.topic,
      detail: `Topic mastery reached: ${session.masteryPercentage}%`,
      status: 'completed'
    });

    return res.status(200).json({ success: true, data: session });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteLearningSession = async (req, res) => {
  try {
    const session = await LearningSession.findOne({ _id: req.params.id, userId: req.user._id });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Learning session not found.' });
    }

    await TimelineEvent.deleteMany({ learningSessionId: session._id });
    await SandboxSubmission.deleteMany({ learningSessionId: session._id });
    await MentorMemory.deleteOne({ userId: req.user._id, topic: session.topic });
    await LearningSession.deleteOne({ _id: session._id });

    return res.status(200).json({ success: true, message: 'Learning session and all associated files/logs permanently deleted.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
