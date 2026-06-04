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
import {
  generateRecommendations,
  computeReadinessIndexes,
  analyzeStrengthsAndWeaknesses
} from '../services/mentorIntelligenceEngine.js';
import { canonicalize } from '../utils/topicNormalizer.js';
import axios from 'axios';
import {
  isIgnoredPath,
  isTextSourcePath,
  parseGitHubUrl,
  buildProjectSummaryText,
  detectTechnologiesFromFiles,
  validateClaimsAgainstEvidence,
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

export const updateMentorMemory = async ({ userId, topic: rawTopic, scores = {}, passed = null, sourceInfo = null }) => {
  try {
    const topic = canonicalize(rawTopic);
    let memory = await MentorMemory.findOne({ userId, topic });
    if (!memory) {
      memory = new MentorMemory({ userId, topic });
    }

    if (scores.conceptUnderstanding !== undefined) memory.conceptUnderstanding = Math.max(memory.conceptUnderstanding, scores.conceptUnderstanding);
    if (scores.codingAbility !== undefined) memory.codingAbility = Math.max(memory.codingAbility, scores.codingAbility);
    if (scores.problemSolving !== undefined) memory.problemSolving = Math.max(memory.problemSolving, scores.problemSolving);
    if (scores.projectUsage !== undefined) memory.projectUsage = Math.max(memory.projectUsage, scores.projectUsage);
    if (scores.projectReadiness !== undefined) memory.projectUsage = Math.max(memory.projectUsage, scores.projectReadiness);
    if (scores.interviewReadiness !== undefined) memory.interviewReadiness = Math.max(memory.interviewReadiness, scores.interviewReadiness);
    
    memory.attemptCount += 1;
    if (passed === true) {
      memory.successCount += 1;
    } else if (passed === false) {
      memory.failureCount += 1;
    }

    if (sourceInfo && sourceInfo.refType && sourceInfo.refId && sourceInfo.source) {
      // Avoid duplicate source logs for the same activity completion
      const alreadyLogged = memory.sources.some(s => s.refId.toString() === sourceInfo.refId.toString() && s.source === sourceInfo.source);
      if (!alreadyLogged) {
        memory.sources.push({
          refType: sourceInfo.refType,
          refId: sourceInfo.refId,
          source: sourceInfo.source,
          date: new Date()
        });

        // Increment evidence counts based on the activity type
        if (!memory.evidenceCounts) {
          memory.evidenceCounts = { sandbox: 0, interview: 0, defense: 0 };
        }
        if (sourceInfo.refType === 'SandboxSubmission') {
          memory.evidenceCounts.sandbox += 1;
        } else if (sourceInfo.refType === 'InterviewSession') {
          memory.evidenceCounts.interview += 1;
        } else if (sourceInfo.refType === 'LearningSession') {
          if (sourceInfo.source === 'project_defense_completed') {
            memory.evidenceCounts.defense += 1;
          } else {
            memory.evidenceCounts.sandbox += 1; // Fallback or learning checkpoint
          }
        }
      }
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

    if (mode !== 'practice' && passed) {
      const session = await LearningSession.findById(learningSessionId);
      const topic = session ? session.topic : (challengeTitle || 'General Sandbox Practice');
      await updateMentorMemory({
        userId,
        topic,
        scores,
        passed,
        sourceInfo: {
          refType: 'SandboxSubmission',
          refId: sub._id,
          source: 'sandbox_passed'
        }
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

  // Only advance one stage from current position (sequential progression)
  const currentIndex = LEARNING_STAGES.findIndex(item => item.key === session.learningEngine.currentStage);
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

    const userPreferences = req.user ? {
      language: req.user.language || 'English',
      communicationMode: req.user.communicationMode || 'Natural',
    } : {
      language: 'English',
      communicationMode: 'Natural',
    };

    // Auto-initialize first AI explanation to welcome user
    const aiResponse = await generateMentorResponse({
      topic,
      mode,
      messages: [{ role: 'user', text: `Hi, please teach me about ${topic}.` }],
      personality,
      sessionType,
      learningEngine: session.learningEngine,
      mentorMemoryContext: memoryPromptContext,
      userPreferences
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
  const { text: rawText } = req.body || {};
  const text = (rawText || '').trim().slice(0, 5000);
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

    const userPreferences = req.user ? {
      language: req.user.language || 'English',
      communicationMode: req.user.communicationMode || 'Natural',
    } : {
      language: 'English',
      communicationMode: 'Natural',
    };

    // Generate AI response
    const aiResponse = await generateMentorResponse({
      topic: session.topic,
      mode: session.mode,
      messages: session.messages,
      personality: session.personality,
      sessionType: session.sessionType,
      learningEngine: session.learningEngine || createLearningEngineState(),
      userPreferences
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
  filesScanned = 0,
  detectedTechnologiesEvidence = [],
  unverifiedClaims = [],
  fallbackReason = ''
}) => {
  const analysisFailed = !analysisReport;
  const fallbackMode = analysisFailed ? {
    active: true,
    reason: fallbackReason,
    affectedFeatures: ['architecture_report', 'question_generation']
  } : { active: false, reason: '', affectedFeatures: [] };

  const base = {
    projectName,
    repoUrl,
    ingestionMethod,
    scanComplete: true,
    scanStatus: analysisFailed ? 'failed' : 'success',
    defenseStarted: false,
    starterDefenseQuestion: '',
    detectedTechnologies: [],
    detectedFeatures: [],
    potentialWeakAreas: [],
    projectComplexity: {
      level: 'Moderate',
      score: 50,
      rationale: 'Complexity inferred from project structure and dependencies.'
    },
    scanStats: { filesScanned, foldersScanned: 0 },
    architectureReport: null,
    defenseProgress: {
      currentQuestionIndex: 0,
      totalQuestions: 5,
      evaluations: []
    },
    topQuestions: [],
    learningReport: {
      strengths: [],
      weakAreas: [],
      missingConcepts: [],
      suggestedImprovements: [],
      refactoringIdeas: [],
      productionReadinessScore: 0,
      portfolioReadinessScore: 0
    },
    fallbackMode,
    unverifiedClaims,
    detectedTechnologiesEvidence
  };

  if (analysisFailed) return base;

  return {
    ...base,
    scanStatus: 'success',
    starterDefenseQuestion: analysisReport.starterDefenseQuestion || '',
    detectedTechnologies: analysisReport.detectedTechnologies || [],
    detectedFeatures: analysisReport.detectedFeatures || [],
    potentialWeakAreas: analysisReport.potentialWeakAreas || [],
    projectComplexity: analysisReport.projectComplexity || base.projectComplexity,
    architectureReport: analysisReport.architectureReport || null,
    topQuestions: analysisReport.topQuestions || []
  };
};

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

    // Step 1: Deterministic technology detection (always runs, no AI needed)
    const deterministicTech = detectTechnologiesFromFiles(filesList, fileContents);

    // Step 2: Build summary for AI
    const projectSummaryText = buildProjectSummaryText({
      sourceLabel,
      repoUrl: githubUrl || '',
      files: filesList,
      fileContents
    });

    // Step 3: AI analysis with multi-provider fallback (Gemini → Groq → Failure)
    let analysisReport = null;
    let aiError = '';
    try {
      analysisReport = await analyzeProjectSummary({
        projectSummaryText,
        repoUrl: githubUrl || ''
      });
    } catch (aiErr) {
      aiError = aiErr?.publicMessage || aiErr?.message || 'AI analysis failed after all providers exhausted';
      console.warn('Project ingestion AI failed (all providers):', aiError);
    }

    // Step 4: Hallucination protection - validate AI claims against evidence
    let unverifiedClaims = [];
    if (analysisReport && Array.isArray(analysisReport.detectedTechnologies)) {
      const validation = validateClaimsAgainstEvidence(
        analysisReport.detectedTechnologies,
        deterministicTech.technologies
      );
      analysisReport.detectedTechnologies = validation.verified;
      unverifiedClaims = validation.unverified;
    }

    // Step 5: Build project context
    const projectContext = buildProjectContextFromAnalysis(analysisReport, {
      projectName,
      repoUrl: githubUrl || '',
      ingestionMethod: resolvedMethod,
      filesScanned: filesList.length,
      detectedTechnologiesEvidence: deterministicTech.technologies,
      unverifiedClaims,
      fallbackReason: aiError
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
      const scanText = analysisReport
        ? `### Project scan complete\nI've analyzed **${projectName}** and prepared your **Project Analysis Report**. Review detected technologies, architecture, and weak areas in the Project tab, then click **Start Defense** when you're ready.`
        : `### Project scan complete\nI scanned **${projectName}** but could not generate an AI architecture review. Technologies were detected from your project files. You can still start a generic defense interview. Reason: ${aiError}`;
      session.messages.push({
        id: `defense-scan-${Date.now()}`,
        role: 'assistant',
        text: scanText,
        timestamp: new Date()
      });
      if (session.missionChecklist?.length) {
        markFirstIncompleteTaskComplete(session, (t) => /connect|github|local|folder/i.test(t.task));
      }
    } else {
      const scanTextForNew = analysisReport
        ? `### Project scan complete\nI've analyzed **${projectName}** and prepared your **Project Analysis Report**. Review the findings below, then click **Start Defense** when you're ready for interview questions.`
        : `### Project scan complete\nI scanned **${projectName}** but could not generate an AI architecture review. Technologies were detected from your project files. You can still start a generic defense interview. Reason: ${aiError}`;
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
          text: scanTextForNew,
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

    const isFallback = context?.fallbackMode?.active === true;
    const genericQuestions = [
      'Explain the core architecture of your project and the main tradeoffs you made.',
      'Walk me through your authentication flow from client request to protected route.',
      'How do you structure error responses across your application?',
      'What database schema decisions did you make and why?',
      'How do you handle state management across your application?'
    ];

    const starterQuestion = isFallback
      ? genericQuestions[0]
      : (context.starterDefenseQuestion || context.topQuestions?.[0] || genericQuestions[0]);

    // Ensure topQuestions exist even in fallback mode for fallback evaluation
    if (isFallback && (!Array.isArray(context.topQuestions) || context.topQuestions.length === 0)) {
      context.topQuestions = genericQuestions;
    }

    context.defenseStarted = true;
    const startMsg = isFallback
      ? `### Project Defense started (Generic Mode)\nAI architecture review was unavailable. Questions will be based on general project patterns. Here is your first question:\n\n**"${starterQuestion}"**`
      : `### Project Defense started\nBased on my analysis of your codebase, here is your first question:\n\n**"${starterQuestion}"**`;
    session.messages.push({
      id: `defense-start-${Date.now()}`,
      role: 'assistant',
      text: startMsg,
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

    if (session.status === 'completed') {
      return res.status(400).json({ success: false, message: 'This project defense has already been completed.' });
    }

    const context = session.projectContext;
    if (!context || (!context.architectureReport && context?.fallbackMode?.active !== true)) {
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

    const userPreferences = req.user ? {
      language: req.user.language || 'English',
      communicationMode: req.user.communicationMode || 'Natural',
    } : {
      language: 'English',
      communicationMode: 'Natural',
    };

    // Evaluate answer with AI
    const evalResult = await evaluateDefenseAnswer({
      report: context.architectureReport,
      currentQuestion,
      answer,
      currentQuestionIndex: currentQIdx,
      userPreferences
    });

    // Deduplication: reject exact duplicate of any previous answer
    const isDuplicate = progress.evaluations.some(e => e.answer.trim() === answer.trim());
    if (isDuplicate) {
      return res.status(400).json({ success: false, message: 'Duplicate answer. Please provide a new response.' });
    }

    // Append evaluation details with multi-dimension scores
    progress.evaluations.push({
      question: currentQuestion,
      answer,
      authorshipScore: evalResult.authorshipScore || 0,
      technicalCorrectness: evalResult.technicalCorrectness || 0,
      projectAwareness: evalResult.projectAwareness || 0,
      architectureUnderstanding: evalResult.architectureUnderstanding || 0,
      implementationReasoning: evalResult.implementationReasoning || 0,
      tradeoffUnderstanding: evalResult.tradeoffUnderstanding || 0,
      feedback: evalResult.feedback || ''
    });

    // Append user response to chat logs
    session.messages.push({
      id: `u-def-${Date.now()}`,
      role: 'user',
      text: answer,
      timestamp: new Date()
    });

    // AI evaluation scoring: award progress based on authorshipScore (>= 40 indicates genuine effort)
    const milestonePassed = (evalResult.authorshipScore || 0) >= 40;
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

      // MentorMemory update for completed defense with evaluation-based scoring
      try {
        const evals = progress.evaluations || [];
        const avg = (key) => evals.length > 0 ? Math.round(evals.reduce((s, e) => s + (e[key] || 0), 0) / evals.length) : 0;
        const defenseScores = {
          conceptUnderstanding: avg('technicalCorrectness'),
          codingAbility: avg('implementationReasoning'),
          problemSolving: avg('architectureUnderstanding'),
          projectUsage: avg('projectAwareness'),
          interviewReadiness: Math.round((avg('technicalCorrectness') + avg('implementationReasoning') + avg('architectureUnderstanding') + avg('projectAwareness') + avg('tradeoffUnderstanding')) / 5)
        };
        await updateMentorMemory({
          userId: req.user._id,
          topic: session.topic,
          scores: defenseScores,
          passed: milestonePassed,
          sourceInfo: {
            refType: 'LearningSession',
            refId: session._id,
            source: 'project_defense_completed'
          }
        });
      } catch (memErr) {
        console.error('Failed to sync defense scores to mentor memory:', memErr.message);
      }

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

      // Unified Mentor Memory Project Defense Integration
      try {
        const evaluations = context.defenseProgress.evaluations || [];
        const authorshipScores = evaluations.map(e => e.authorshipScore || 0);
        const avgAuthorship = authorshipScores.length > 0
          ? Math.round(authorshipScores.reduce((a, b) => a + b, 0) / authorshipScores.length)
          : 70;

        const defenseReport = context.learningReport || {};
        const productionScore = defenseReport.productionReadinessScore || avgAuthorship;
        const portfolioScore = defenseReport.portfolioReadinessScore || avgAuthorship;

        const defenseMappedScores = {
          projectUsage: avgAuthorship,
          problemSolving: productionScore,
          codingAbility: portfolioScore,
          conceptUnderstanding: productionScore,
          interviewReadiness: avgAuthorship
        };

        await updateMentorMemory({
          userId: req.user._id,
          topic: session.topic.replace('Project Defense: ', ''),
          scores: defenseMappedScores,
          passed: avgAuthorship >= 60,
          sourceInfo: {
            refType: 'LearningSession',
            refId: session._id,
            source: 'project_defense_completed'
          }
        });
      } catch (memErr) {
        console.error('Failed to sync project defense score to mentor memory:', memErr.message);
      }
    } else {
      // Prompt next question
      progress.currentQuestionIndex += 1;
      const nextQ = evalResult.nextQuestion || context.topQuestions?.[progress.currentQuestionIndex] || 'How does the authentication flow work in your application?';
      const nextQText = typeof nextQ === 'object' ? nextQ.text : nextQ;
      
      session.messages.push({
        id: `a-def-next-${Date.now()}`,
        role: 'assistant',
        text: `**Feedback**: ${evalResult.feedback || 'Good effort.'}\n\nHere is your next Project Defense question:\n\n**"${nextQText}"**`,
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
    console.warn('Submit project defense AI evaluation failed:', error.message);
    try {
      const session = await LearningSession.findOne({ _id: req.params.id, userId: req.user._id });
      if (!session) {
        return res.status(404).json({ success: false, message: 'Learning session not found.' });
      }

      const context = session.projectContext;
      const progress = context.defenseProgress;
      const currentQIdx = progress.currentQuestionIndex;

      // Record the user answer without scoring
      session.messages.push({
        id: `u-def-fallback-${Date.now()}`,
        role: 'user',
        text: answer,
        timestamp: new Date()
      });

      const totalDefenseQuestions = progress.totalQuestions || context.topQuestions?.length || 5;
      const isLastQuestion = currentQIdx >= totalDefenseQuestions - 1;

      // Do NOT advance progress or assign fabricated scores
      // Show evaluation failure message with retry option
      const evalFailedMsg = isLastQuestion
        ? `### Evaluation unavailable\nI could not evaluate your final answer due to an AI service error. You may retry or try switching providers.\n\n**Your answer was:** ${answer}`
        : `### Evaluation unavailable\nI could not evaluate your answer due to an AI service error. Your answer has been recorded but no score was assigned. Please retry or switch providers.\n\n**Your answer was:** ${answer}`;

      session.messages.push({
        id: `a-def-eval-failed-${Date.now()}`,
        role: 'assistant',
        text: evalFailedMsg,
        timestamp: new Date()
      });

      session.markModified('projectContext');
      session.markModified('messages');
      await session.save();

      return res.status(200).json({ success: false, evaluationFailed: true, message: 'AI evaluation failed. Answer recorded but not scored. Please retry.', data: session });
    } catch (fallbackErr) {
      console.error('Submit project defense fallback save failed:', fallbackErr.message);
      return res.status(500).json({ success: false, message: 'Failed to process project defense response.' });
    }
  }
};

/**
 * POST compile career coach roadmap
 */
export const getCareerCoachRoadmap = async (req, res) => {
  const { topic = 'Full Stack Development', sessionId } = req.body || {};
  const weakSkills = [];
  const masteredSkills = [];

  try {
    const memories = await MentorMemory.find({ userId: req.user._id });

    let readiness = null;
    try {
      readiness = await computeReadinessIndexes(req.user._id);
    } catch (engineErr) {
      console.warn('Readiness engine unavailable for career coach:', engineErr.message);
    }

    const completedSessions = await LearningSession.find({ userId: req.user._id, status: 'completed' });

    for (const mem of memories) {
      if (mem.mastery >= 75) {
        masteredSkills.push(mem.topic);
      } else if (mem.mastery > 0 && mem.mastery < 50) {
        weakSkills.push(mem.topic);
      }
    }

    completedSessions.forEach(s => {
      const topicStr = s.topic || '';
      if (!memories.some(m => m.topic === topicStr)) {
        if (s.masteryPercentage >= 75) {
          masteredSkills.push(topicStr);
        } else if (s.masteryPercentage < 50 && s.masteryPercentage > 0) {
          weakSkills.push(topicStr);
        }
      }
    });

    if (completedSessions.length === 0 && memories.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          insufficientData: true,
          reason: 'Career recommendations require completed learning sessions or mentor memory topics.',
          weakSkills: [],
          masteredSkills: [],
          recommendedRoles: [],
          recommendedCompanies: [],
          learningRoadmap: [],
          readinessScores: null
        }
      });
    }

    const userPreferences = req.user ? {
      language: req.user.language || 'English',
      communicationMode: req.user.communicationMode || 'Natural',
    } : {
      language: 'English',
      communicationMode: 'Natural',
    };

    const coachData = await compileCareerCoachRoadmap({
      masteredSkills,
      weakSkills,
      topic,
      userPreferences
    });

    // Persist career coach data to a LearningSession
    try {
      let coachSession = null;
      if (sessionId) {
        coachSession = await LearningSession.findOne({ _id: sessionId, userId: req.user._id });
      }
      if (!coachSession) {
        coachSession = await LearningSession.findOne({ userId: req.user._id, sessionType: 'Career Coach', status: 'active' });
      }
      if (!coachSession) {
        coachSession = await LearningSession.create({
          userId: req.user._id,
          topic: 'Career Coach',
          sessionType: 'Career Coach',
          mode: 'Advanced',
          status: 'active'
        });
      }
      coachSession.careerCoach = {
        marketReadiness: coachData.marketReadiness || '',
        jobReadiness: coachData.jobReadiness || '',
        recommendedRoles: coachData.recommendedRoles || [],
        recommendedCompanies: coachData.recommendedCompanies || [],
        salaryGuidance: coachData.salaryGuidance || '',
        learningRoadmap: (coachData.learningRoadmap || []).map(phase => ({
          phase: phase.phase || '',
          topics: phase.topics || []
        }))
      };
      coachSession.masteryPercentage = Math.min(100, Math.max(
        coachSession.masteryPercentage || 0,
        readiness?.hiringReadinessIndex || 0
      ));
      await coachSession.save();

      await logTimelineEvent({
        userId: req.user._id,
        learningSessionId: coachSession._id,
        action: 'Generated career coach roadmap',
        topic: 'Career Coach',
        detail: `Market: ${coachData.marketReadiness || 'N/A'}, Roles: ${(coachData.recommendedRoles || []).slice(0, 3).join(', ') || 'N/A'}`,
        status: 'completed'
      });
    } catch (persistErr) {
      console.warn('Failed to persist career coach data to session:', persistErr.message);
    }

    return res.status(200).json({
      success: true,
      data: {
        ...coachData,
        weakSkills,
        masteredSkills,
        insufficientData: false,
        readinessScores: readiness ? {
          interviewReadiness: readiness.interviewReadinessIndex,
          projectReadiness: readiness.projectReadinessIndex,
          hiringReadiness: readiness.hiringReadinessIndex,
          consistencyScore: readiness.consistencyScore,
          overallMastery: readiness.overallMastery
        } : null
      }
    });
  } catch (error) {
    console.warn('Career Coach generation AI failed, serving robust high-fidelity fallback:', error.message);
    
    let fallbackReadiness = null;
    try {
      fallbackReadiness = await computeReadinessIndexes(req.user._id);
    } catch { /* skip */ }

    const fallbackData = {
      insufficientData: true,
      reason: 'Career recommendations are unavailable because AI roadmap generation failed. No fallback recommendations are shown.',
      weakSkills,
      masteredSkills,
      recommendedRoles: [],
      recommendedCompanies: [],
      learningRoadmap: [],
      readinessScores: fallbackReadiness ? {
        interviewReadiness: fallbackReadiness.interviewReadinessIndex,
        projectReadiness: fallbackReadiness.projectReadinessIndex,
        hiringReadiness: fallbackReadiness.hiringReadinessIndex,
        consistencyScore: fallbackReadiness.consistencyScore,
        overallMastery: fallbackReadiness.overallMastery
      } : null
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
        // Once completed, a task cannot be reverted (integrity enforcement)
        if (wasCompleted) {
          return { task: item.task, completed: true };
        }
        const willBeCompleted = requestedByTask.has(item.task.toLowerCase())
          ? requestedByTask.get(item.task.toLowerCase())
          : false;
        if (willBeCompleted) {
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

/**
 * POST create a learning session from a recommendation
 * Bridges the gap between Recommendations → Learning Paths
 */
export const createLearningPathFromRecommendation = async (req, res) => {
  const { topic, mode = 'Intermediate', sessionType = 'Concept Learning', personality = 'The Coding Coach' } = req.body || {};
  if (!topic) {
    return res.status(400).json({ success: false, message: 'Topic is required to create a learning path.' });
  }

  try {
    const session = await LearningSession.create({
      userId: req.user._id,
      topic,
      mode,
      sessionType,
      personality,
      status: 'active',
      learningEngine: { currentStage: 'WHY', stageProgress: [] },
      missionChecklist: [
        { task: `WHY: Why ${topic}?`, completed: false },
        { task: `CONCEPT: Core concepts of ${topic}`, completed: false },
        { task: `VISUALIZATION: Visualize ${topic}`, completed: false },
        { task: `SIMPLE EXAMPLE: Simple ${topic} example`, completed: false },
        { task: `REAL PROJECT USAGE: ${topic} in projects`, completed: false },
        { task: `UNDERSTANDING CHECK: Check understanding`, completed: false },
        { task: `GUIDED CHALLENGE: Guided ${topic} challenge`, completed: false },
        { task: `INDEPENDENT CHALLENGE: Independent ${topic} challenge`, completed: false },
        { task: `PROJECT APPLICATION: Apply ${topic}`, completed: false },
        { task: `INTERVIEW ROUND: ${topic} interview`, completed: false },
        { task: `EVALUATION: Evaluate ${topic} mastery`, completed: false },
        { task: `MASTERY DECISION: Mastery check`, completed: false }
      ]
    });

    await logTimelineEvent({
      userId: req.user._id,
      learningSessionId: session._id,
      action: 'Started learning path from recommendation',
      topic,
      detail: `Learning path generated for ${topic} (${sessionType})`,
      status: 'active'
    });

    return res.status(201).json({ success: true, data: session });
  } catch (error) {
    console.error('Create learning path failed:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET unified intelligence dashboard
 * Returns readiness + SWOT + recommendations + career coach data in a single call
 */
export const getUnifiedDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    const [readiness, swot, recommendations, coachSessions] = await Promise.all([
      computeReadinessIndexes(userId).catch(() => null),
      analyzeStrengthsAndWeaknesses(userId).catch(() => null),
      generateRecommendations(userId).catch(() => []),
      LearningSession.find({ userId, sessionType: 'Career Coach' })
        .sort({ updatedAt: -1 })
        .limit(1)
        .lean()
        .catch(() => [])
    ]);

    const latestCoach = coachSessions[0] || null;

    const data = {
      readiness: readiness ? {
        interviewReadinessIndex: readiness.interviewReadinessIndex,
        projectReadinessIndex: readiness.projectReadinessIndex,
        hiringReadinessIndex: readiness.hiringReadinessIndex,
        consistencyScore: readiness.consistencyScore,
        overallMastery: readiness.overallMastery,
        dimensionAverages: readiness.dimensionAverages,
        rawAverages: readiness.rawAverages
      } : null,
      swot: swot ? {
        weakTopics: swot.weakTopics,
        strongTopics: swot.strongTopics,
        failedChallenges: swot.failedChallenges
      } : null,
      recommendations: recommendations.slice(0, 10),
      careerCoach: latestCoach ? {
        marketReadiness: latestCoach.careerCoach?.marketReadiness || '',
        jobReadiness: latestCoach.careerCoach?.jobReadiness || '',
        recommendedRoles: latestCoach.careerCoach?.recommendedRoles || [],
        recommendedCompanies: latestCoach.careerCoach?.recommendedCompanies || [],
        salaryGuidance: latestCoach.careerCoach?.salaryGuidance || '',
        learningRoadmap: latestCoach.careerCoach?.learningRoadmap || []
      } : null,
      coachSessionId: latestCoach?._id || null
    };

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Unified dashboard failed:', error.message);
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

    // Unified Intelligence Engine: weighted readiness indexes
    let unifiedReadiness = null;
    let swot = null;
    try {
      unifiedReadiness = await computeReadinessIndexes(req.user._id);
      swot = await analyzeStrengthsAndWeaknesses(req.user._id);
    } catch (engineErr) {
      console.warn('Unified readiness engine failed, using legacy calculations:', engineErr.message);
    }

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
          hoursPracticed,
          // Unified indexes (fall back to legacy if engine unavailable)
          unifiedInterviewReadiness: unifiedReadiness?.interviewReadinessIndex ?? interviewReadiness,
          unifiedProjectReadiness: unifiedReadiness?.projectReadinessIndex ?? projectReadiness,
          hiringReadinessIndex: unifiedReadiness?.hiringReadinessIndex ?? 0,
          consistencyScore: unifiedReadiness?.consistencyScore ?? 0,
          overallMastery: unifiedReadiness?.overallMastery ?? masteryAvg
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
        },
        unified: unifiedReadiness ? {
          dimensionAverages: unifiedReadiness.dimensionAverages,
          rawAverages: unifiedReadiness.rawAverages,
          weakTopics: swot?.weakTopics ?? [],
          strongTopics: swot?.strongTopics ?? []
        } : null
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getRecommendations = async (req, res) => {
  try {
    const recommendations = await generateRecommendations(req.user._id);
    return res.status(200).json({ success: true, data: recommendations });
  } catch (error) {
    console.error('Recommendations generation failed:', error.message);
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

    // Unified Mentor Memory Learning Session integration
    try {
      const engine = session.learningEngine || {};
      const evalScores = engine.evaluationScores || {};
      const mastery = session.masteryPercentage || 0;
      
      const baseScore = Math.max(mastery, 70);
      const scores = {
        conceptUnderstanding: evalScores.conceptUnderstanding || baseScore,
        codingAbility: evalScores.codingAbility || baseScore,
        problemSolving: evalScores.problemSolving || baseScore,
        projectUsage: evalScores.projectReadiness || baseScore,
        interviewReadiness: evalScores.interviewReadiness || baseScore
      };

      await updateMentorMemory({
        userId: req.user._id,
        topic: session.topic,
        scores,
        passed: mastery >= 60,
        sourceInfo: {
          refType: 'LearningSession',
          refId: session._id,
          source: 'learning_session_archived'
        }
      });
    } catch (memErr) {
      console.error('Failed to sync learning session score to mentor memory:', memErr.message);
    }

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
