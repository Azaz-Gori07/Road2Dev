import MentorMemory from '../models/MentorMemory.js';
import LearningSession from '../models/LearningSession.js';
import SandboxSubmission from '../models/SandboxSubmission.js';
import InterviewSession from '../models/InterviewSession.js';
import TimelineEvent from '../models/TimelineEvent.js';

const DAY_MS = 86400000;
const RECENCY_HALFLIFE_DAYS = 14;

const clamp = (v) => Math.max(0, Math.min(100, Number(v) || 0));

const recencyWeight = (date) => {
  const daysAgo = (Date.now() - new Date(date).getTime()) / DAY_MS;
  return Math.pow(0.5, daysAgo / RECENCY_HALFLIFE_DAYS);
};

const weightedAverage = (values) => {
  if (!values.length) return 0;
  const totalWeight = values.reduce((s, v) => s + v.weight, 0);
  if (totalWeight === 0) return 0;
  return Math.round(values.reduce((s, v) => s + v.value * v.weight, 0) / totalWeight);
};

export const computeReadinessIndexes = async (userId) => {
  const memories = await MentorMemory.find({ userId });
  const sessions = await LearningSession.find({ userId });
  const submissions = await SandboxSubmission.find({ userId }).sort({ createdAt: -1 }).lean();
  const interviews = await InterviewSession.find({ userId, status: 'completed' }).sort({ createdAt: -1 }).lean();
  const timeline = await TimelineEvent.find({ userId }).sort({ createdAt: -1 }).lean();

  const passedSubmissions = submissions.filter(s => s.passed);
  const completedDefenses = sessions.filter(s =>
    s.sessionType === 'Project Defense' && s.status === 'completed'
  );
  const activeSessions = sessions.filter(s => s.status !== 'completed');

  const avgFromMemories = (dim) => {
    const vals = memories.filter(m => m[dim] > 0).map(m => ({
      value: m[dim],
      weight: recencyWeight(m.lastReviewDate || m.updatedAt)
    }));
    return weightedAverage(vals);
  };

  const avgInterviewScore = () => {
    const vals = interviews.filter(i => i.score > 0).map(i => ({
      value: i.score,
      weight: recencyWeight(i.updatedAt || i.createdAt)
    }));
    return weightedAverage(vals);
  };

  const avgDefenseMastery = () => {
    const vals = completedDefenses.map(d => ({
      value: d.masteryPercentage || 0,
      weight: recencyWeight(d.updatedAt || d.createdAt)
    }));
    return weightedAverage(vals);
  };

  const avgSandboxScore = () => {
    const vals = passedSubmissions.map(s => {
      const sc = s.scores || {};
      const avgScore = Math.round(
        (sc.conceptUnderstanding + sc.codingAbility + sc.problemSolving + sc.projectReadiness + sc.interviewReadiness) / 5
      );
      return { value: avgScore, weight: recencyWeight(s.createdAt) };
    });
    return weightedAverage(vals);
  };

  const avgLearningMastery = () => {
    const vals = activeSessions.map(s => ({
      value: s.masteryPercentage || 0,
      weight: recencyWeight(s.updatedAt || s.createdAt)
    }));
    return weightedAverage(vals);
  };

  const consistencyScore = () => {
    if (!timeline.length) return 0;
    const dates = [...new Set(timeline.map(e =>
      new Date(e.createdAt).toDateString()
    ))];
    if (dates.length <= 1) return 10;
    let streaks = 0;
    for (let i = 0; i < dates.length - 1; i++) {
      const diff = (new Date(dates[i]).getTime() - new Date(dates[i + 1]).getTime()) / DAY_MS;
      if (diff <= 2) streaks++;
    }
    return clamp(Math.round((streaks / (dates.length - 1)) * 100));
  };

  const sInterview = avgInterviewScore();
  const sDefense = avgDefenseMastery();
  const sLearning = avgLearningMastery();
  const sSandbox = avgSandboxScore();
  const sMemConcept = avgFromMemories('conceptUnderstanding');
  const sMemCoding = avgFromMemories('codingAbility');
  const sMemProblem = avgFromMemories('problemSolving');
  const sMemProject = avgFromMemories('projectUsage');
  const sMemInterview = avgFromMemories('interviewReadiness');

  const interviewReadinessIndex = clamp(Math.round(
    (sInterview || sMemInterview) * 0.50 +
    (sDefense || sMemProject) * 0.20 +
    sLearning * 0.15 +
    sSandbox * 0.15
  ));

  const projectReadinessIndex = clamp(Math.round(
    (sDefense || sMemProject) * 0.50 +
    sSandbox * 0.20 +
    sLearning * 0.15 +
    (sInterview || sMemInterview) * 0.15
  ));

  const overallMastery = memories.length > 0
    ? Math.round(memories.reduce((s, m) => s + (m.mastery || 0), 0) / memories.length)
    : 0;

  const hiringReadinessIndex = clamp(Math.round(
    interviewReadinessIndex * 0.40 +
    projectReadinessIndex * 0.30 +
    consistencyScore() * 0.15 +
    overallMastery * 0.15
  ));

  return {
    interviewReadinessIndex,
    projectReadinessIndex,
    hiringReadinessIndex,
    consistencyScore: consistencyScore(),
    overallMastery,
    dimensionAverages: {
      conceptUnderstanding: sMemConcept,
      codingAbility: sMemCoding,
      problemSolving: sMemProblem,
      projectUsage: sMemProject,
      interviewReadiness: sMemInterview
    },
    rawAverages: {
      interview: sInterview,
      defense: sDefense,
      learning: sLearning,
      sandbox: sSandbox
    }
  };
};

export const analyzeStrengthsAndWeaknesses = async (userId) => {
  const memories = await MentorMemory.find({ userId });
  const submissions = await SandboxSubmission.find({ userId }).lean();

  const weakTopics = [];
  const strongTopics = [];

  for (const mem of memories) {
    const dims = ['conceptUnderstanding', 'codingAbility', 'problemSolving', 'projectUsage', 'interviewReadiness'];
    const activeDims = dims.filter(d => mem[d] > 0);
    const avgDim = activeDims.length > 0
      ? Math.round(activeDims.reduce((s, d) => s + mem[d], 0) / activeDims.length)
      : 0;
    const weighted = avgDim * recencyWeight(mem.lastReviewDate || mem.updatedAt);

    if (mem.mastery > 0 && mem.mastery < 60) {
      const weakestDim = dims
        .map(d => ({ dim: d, score: mem[d] }))
        .filter(d => d.score > 0)
        .sort((a, b) => a.score - b.score)[0];

      weakTopics.push({
        topic: mem.topic,
        mastery: mem.mastery,
        weakestDimension: weakestDim?.dim || 'conceptUnderstanding',
        weakestScore: weakestDim?.score || 0,
        evidenceCount: mem.evidenceCounts || { sandbox: 0, interview: 0, defense: 0 },
        sources: mem.sources || [],
        recencyAdjustedScore: Math.round(weighted)
      });
    }

    if (mem.mastery >= 75) {
      strongTopics.push({
        topic: mem.topic,
        mastery: mem.mastery,
        evidenceCount: mem.evidenceCounts || { sandbox: 0, interview: 0, defense: 0 }
      });
    }
  }

  const failedChallenges = {};
  for (const sub of submissions) {
    if (!sub.passed) {
      failedChallenges[sub.challengeTitle] = (failedChallenges[sub.challengeTitle] || 0) + 1;
    }
  }

  return {
    weakTopics: weakTopics.sort((a, b) => a.mastery - b.mastery),
    strongTopics: strongTopics.sort((a, b) => b.mastery - a.mastery),
    failedChallenges: Object.entries(failedChallenges)
      .filter(([, count]) => count >= 2)
      .map(([title, count]) => ({ title, failedAttempts: count }))
  };
};

const SANDBOX_CHALLENGES_BY_DIM = {
  conceptUnderstanding: [
    { title: 'Closures Deep Dive', instructions: 'Write a function that demonstrates closure scope chain with 3 nested functions.', initialCode: 'function outer() {\n  let x = 10;\n  // Your code here\n}' },
    { title: 'Promise Chain', instructions: 'Implement a promise chain that handles 3 sequential async operations with error handling.', initialCode: 'function step1() {\n  return Promise.resolve(1);\n}' },
    { title: 'Prototype Inheritance', instructions: 'Create a class hierarchy using prototype-based inheritance with 3 levels.', initialCode: 'function Animal(name) {\n  this.name = name;\n}' }
  ],
  codingAbility: [
    { title: 'Array Methods Practice', instructions: 'Implement map, filter, and reduce manually on arrays.', initialCode: 'function myMap(arr, fn) {\n  // Your implementation\n}' },
    { title: 'Debounce Function', instructions: 'Write a debounce utility function with leading/trailing options.', initialCode: 'function debounce(fn, delay) {\n  // Your implementation\n}' },
    { title: 'Currying Implementation', instructions: 'Implement a curry function that transforms multi-arg functions.', initialCode: 'function curry(fn) {\n  // Your implementation\n}' }
  ],
  problemSolving: [
    { title: 'Two Sum Challenge', instructions: 'Find two indices in an array that sum to a target value.', initialCode: 'function twoSum(nums, target) {\n  // Your implementation\n}' },
    { title: 'Rate Limiter', instructions: 'Implement a rate limiter that allows N calls per second.', initialCode: 'class RateLimiter {\n  constructor(maxRequests) {\n    // Your implementation\n  }\n}' },
    { title: 'Tree Traversal', instructions: 'Implement DFS and BFS on a binary tree.', initialCode: 'class TreeNode {\n  constructor(val) { this.val = val; this.left = null; this.right = null; }\n}' }
  ],
  projectUsage: [
    { title: 'REST API Client', instructions: 'Build a fetch wrapper with retry logic, timeout, and error handling.', initialCode: 'class ApiClient {\n  constructor(baseUrl) {\n    this.baseUrl = baseUrl;\n  }\n}' },
    { title: 'Auth Middleware', instructions: 'Implement JWT verification middleware for Express.', initialCode: 'function authMiddleware(req, res, next) {\n  // Your implementation\n}' },
    { title: 'State Manager', instructions: 'Implement a minimal state management store with subscriptions.', initialCode: 'class Store {\n  constructor(initialState) {\n    // Your implementation\n  }\n}' }
  ],
  interviewReadiness: [
    { title: 'Event Emitter', instructions: 'Implement a custom EventEmitter with on, off, emit, and once.', initialCode: 'class EventEmitter {\n  constructor() {\n    this.events = {};\n  }\n}' },
    { title: 'Async Queue', instructions: 'Implement an async queue that processes tasks with concurrency control.', initialCode: 'class AsyncQueue {\n  constructor(concurrency) {\n    // Your implementation\n  }\n}' },
    { title: 'LRU Cache', instructions: 'Implement an LRU cache with get and put in O(1) time.', initialCode: 'class LRUCache {\n  constructor(capacity) {\n    // Your implementation\n  }\n}' }
  ]
};

const LEARNING_PATHS_BY_DIM = {
  conceptUnderstanding: ['Concept Learning', 'Visualization', 'Simple Examples'],
  codingAbility: ['Sandbox Practice', 'Coding Challenges', 'Code Review'],
  problemSolving: ['Algorithm Practice', 'System Design', 'Debugging Exercises'],
  projectUsage: ['Project Defense', 'Real Project Usage', 'Architecture Review'],
  interviewReadiness: ['Interview Round', 'Mock Interviews', 'Evaluation']
};

export const generateRecommendations = async (userId) => {
  const memories = await MentorMemory.find({ userId });
  const submissions = await SandboxSubmission.find({ userId }).lean();
  const sessions = await LearningSession.find({ userId });

  const { weakTopics, strongTopics, failedChallenges } = await analyzeStrengthsAndWeaknesses(userId);
  const readiness = await computeReadinessIndexes(userId);

  const recommendations = [];

  // 1. Remediation for failed challenges
  for (const fc of failedChallenges) {
    recommendations.push({
      title: `${fc.title} Revision`,
      reason: `You failed ${fc.failedAttempts} attempts for "${fc.title}". Revisit fundamentals then retry.`,
      topic: fc.title,
      type: 'remediation',
      pathway: [fc.title, 'Sandbox Practice', 'Concept Learning'],
      priority: 'high'
    });
  }

  // 2. Weak topic learning paths + sandbox challenges + interview focus
  for (const wt of weakTopics) {
    const dim = wt.weakestDimension;
    const challenges = SANDBOX_CHALLENGES_BY_DIM[dim] || SANDBOX_CHALLENGES_BY_DIM.conceptUnderstanding;
    const selectedChallenge = challenges[wt.topic.length % challenges.length];

    recommendations.push({
      title: `Master ${wt.topic}`,
      reason: `Your mastery on "${wt.topic}" is ${wt.mastery}%. Weakest area: ${dim} (${wt.weakestScore}/100).`,
      topic: wt.topic,
      type: 'concept',
      dimension: dim,
      pathway: LEARNING_PATHS_BY_DIM[dim] || ['Concept Learning'],
      sandboxChallenge: selectedChallenge,
      interviewFocus: {
        question: `Explain the ${dim} concepts behind ${wt.topic} as if presenting to a senior engineer.`,
        expectedTopics: LEARNING_PATHS_BY_DIM[dim]
      },
      priority: wt.mastery < 30 ? 'critical' : 'high'
    });
  }

  // 3. Async JS path (special case)
  const promiseMem = memories.find(m => m.topic.toLowerCase().includes('promise'));
  const asyncMem = memories.find(m => m.topic.toLowerCase().includes('async'));
  if ((promiseMem && promiseMem.mastery < 60) || (asyncMem && asyncMem.mastery < 60)) {
    recommendations.push({
      title: 'Asynchronous JavaScript Path',
      reason: 'Active gaps in async programming. Strengthen promise chaining and async/await patterns.',
      topic: 'Promises',
      type: 'roadmap',
      pathway: ['Promises', 'Promise.all', 'Async Await', 'Error Handling'],
      sandboxChallenge: SANDBOX_CHALLENGES_BY_DIM.conceptUnderstanding[1],
      interviewFocus: {
        question: 'Walk me through how the event loop handles async operations in JavaScript.',
        expectedTopics: ['Event Loop', 'Microtasks', 'Macrotasks', 'Promise Resolution']
      },
      priority: 'high'
    });
  }

  // 4. Continue strong topics (maintain momentum)
  for (const st of strongTopics.slice(0, 3)) {
    const totalEvidence = (st.evidenceCount.sandbox || 0) + (st.evidenceCount.interview || 0) + (st.evidenceCount.defense || 0);
    if (totalEvidence >= 3) continue;
    recommendations.push({
      title: `Solidify ${st.topic}`,
      reason: `Strong foundation in "${st.topic}" (${st.mastery}%). Build more evidence through challenges.`,
      topic: st.topic,
      type: 'reinforcement',
      pathway: ['Sandbox Practice', 'Project Application'],
      priority: 'medium'
    });
  }

  // 5. Readiness-based recommendations
  if (readiness.hiringReadinessIndex >= 70) {
    recommendations.push({
      title: 'Career Ready — Start Applying',
      reason: `Your hiring readiness is ${readiness.hiringReadinessIndex}%. You are well positioned for job applications.`,
      topic: 'Career',
      type: 'career',
      pathway: ['Career Coach', 'Interview Prep', 'Portfolio Review'],
      priority: 'medium'
    });
  } else if (readiness.hiringReadinessIndex < 30 && recommendations.length === 0) {
    recommendations.push({
      title: 'Build Learning Foundation',
      reason: 'Start with Concept Learning sessions to build foundational knowledge.',
      topic: 'Fundamentals',
      type: 'onboarding',
      pathway: ['Concept Learning', 'Sandbox Practice'],
      priority: 'high'
    });
  }

  return recommendations;
};