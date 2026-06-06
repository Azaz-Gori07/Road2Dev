import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  id: { type: String, required: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  text: { type: String, default: '' },
  
  // Playground block configuration if AI issues a challenge or evaluates code
  playgroundChallenge: {
    title: { type: String },
    type: { type: String, enum: ['coding', 'predict_output', 'debugging', 'fill_blanks'] },
    instructions: { type: String },
    initialCode: { type: String },
    solutionTemplate: { type: String },
    userSubmission: { type: String },
    stdout: { type: String },
    evaluation: {
      passed: { type: Boolean },
      feedback: { type: String },
      mode: { type: String, enum: ['practice', 'challenge', 'assessment'] },
      scores: {
        conceptUnderstanding: { type: Number, default: 0 },
        codingAbility: { type: Number, default: 0 },
        problemSolving: { type: Number, default: 0 },
        codeQuality: { type: Number, default: 0 },
        projectReadiness: { type: Number, default: 0 },
        interviewReadiness: { type: Number, default: 0 }
      }
    }
  },
  
  // Rich details generated in structured responses
  structuredContent: {
    quickDefinition: { type: String },
    easyExplanation: { type: String },
    realProjectUsage: { type: String },
    interviewAnswer: { type: String },
    commonMistakes: [{ type: String }],
    practiceQuestions: [{ type: String }],
    miniChallenge: { type: String }
  },
  
  timestamp: { type: Date, default: Date.now }
});

const learningSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topic: { type: String, required: true }, // e.g. "React Hooks", "Closures", "Project: E-commerce"
  mode: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Intermediate' },
  status: { type: String, enum: ['active', 'completed'], default: 'active' },
  masteryPercentage: { type: Number, default: 0 }, // mastery progress for this topic: 0-100
  
  sessionType: { 
    type: String, 
    enum: ['Concept Learning', 'Sandbox Practice', 'Project Defense', 'Interview Remediation', 'Career Strategy', 'Career Coach'], 
    default: 'Concept Learning' 
  },
  personality: { 
    type: String, 
    enum: ['The Tech Lead', 'The Professor', 'The Coding Coach'], 
    default: 'The Coding Coach' 
  },
  missionChecklist: [{
    task: { type: String, required: true },
    completed: { type: Boolean, default: false }
  }],
  suggestedNextStep: {
    title: { type: String, default: '' },
    actionText: { type: String, default: '' },
    targetTab: { type: String, default: '' } // playground, project, coach
  },
  learningEngine: {
    currentStage: {
      type: String,
      enum: [
        'WHY',
        'CONCEPT',
        'VISUALIZATION',
        'SIMPLE_EXAMPLE',
        'REAL_PROJECT_USAGE',
        'UNDERSTANDING_CHECK',
        'GUIDED_CHALLENGE',
        'INDEPENDENT_CHALLENGE',
        'PROJECT_APPLICATION',
        'INTERVIEW_ROUND',
        'EVALUATION',
        'MASTERY_DECISION'
      ],
      default: 'WHY'
    },
    stageProgress: [{
      stage: { type: String, required: true },
      completed: { type: Boolean, default: false },
      completedAt: { type: Date },
      evidenceType: { type: String, default: '' }
    }],
    evaluationScores: {
      conceptUnderstanding: { type: Number, default: 0 },
      codingAbility: { type: Number, default: 0 },
      problemSolving: { type: Number, default: 0 },
      codeQuality: { type: Number, default: 0 },
      projectReadiness: { type: Number, default: 0 },
      interviewReadiness: { type: Number, default: 0 }
    },
    sandboxEvidence: [{
      mode: { type: String, enum: ['practice', 'challenge', 'assessment'], default: 'practice' },
      challengeTitle: { type: String, default: '' },
      passed: { type: Boolean, default: false },
      feedback: { type: String, default: '' },
      stdout: { type: String, default: '' },
      error: { type: String, default: '' },
      scores: {
        conceptUnderstanding: { type: Number, default: 0 },
        codingAbility: { type: Number, default: 0 },
        problemSolving: { type: Number, default: 0 },
        codeQuality: { type: Number, default: 0 },
        projectReadiness: { type: Number, default: 0 },
        interviewReadiness: { type: Number, default: 0 }
      },
      createdAt: { type: Date, default: Date.now }
    }]
  },
  
  // Chat dialogue logs
  messages: [messageSchema],
  
  // Project Ingestion Context
  projectContext: {
    // Master Project Blueprint (1-3 KB)
    masterBlueprint: {
      frameworks: [String],
      database: { type: String },
      authStrategy: { type: String },
      primaryArchitecturePattern: { type: String },
      majorFeatures: [String],
      criticalDependencies: [String],
      summary: { type: String }
    },
    // Project Knowledge Graph
    knowledgeGraph: {
      nodes: [String],
      edges: [{
        from: { type: String },
        to: { type: String },
        type: { type: String }
      }]
    },
    // 2-Level Modules & Subchunks
    modules: [{
      moduleName: { type: String },
      subchunks: [{
        subchunkName: { type: String },
        files: [String],
        status: { type: String, enum: ['pending', 'active', 'completed'], default: 'pending' },
        candidatesGenerated: { type: Boolean, default: false },
        candidatesGeneratedAt: { type: Date },
        questionCandidates: [{
          topic: { type: String },
          difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'] }
        }],
        activeQuestions: [{
          difficulty: { type: String },
          questionText: { type: String },
          askedAt: { type: Date }
        }]
      }]
    }],
    currentModuleIndex: { type: Number, default: 0 },
    currentSubchunkIndex: { type: Number, default: 0 },
    projectName: { type: String },
    repoUrl: { type: String },
    ingestionMethod: { type: String, enum: ['github', 'local', ''], default: '' },
    scanComplete: { type: Boolean, default: false },
    scanStatus: { type: String, enum: ['analyzing', 'success', 'failed', ''], default: '' },
    defenseStarted: { type: Boolean, default: false },
    projectComplexity: {
      level: { type: String, default: '' },
      score: { type: Number, default: 0 },
      rationale: { type: String, default: '' }
    },
    starterDefenseQuestion: { type: String, default: '' },
    detectedTechnologies: [String],
    detectedFeatures: [String],
    potentialWeakAreas: [String],
    scanStats: {
      filesScanned: { type: Number, default: 0 },
      foldersScanned: { type: Number, default: 0 }
    },
    architectureReport: {
      structure: { type: String },
      libraries: [String],
      frameworks: [String],
      components: [String],
      apis: [String],
      stateManagement: { type: String },
      auth: { type: String },
      database: { type: String },
      summary: { type: String }
    },
    defenseProgress: {
      currentQuestionIndex: { type: Number, default: 0 },
      totalQuestions: { type: Number, default: 5 },
      evaluations: [{
        moduleName: String,
        subchunkName: String,
        difficulty: String,
        question: String,
        answer: String,
        authorshipScore: Number,
        technicalCorrectness: { type: Number, default: 0 },
        projectAwareness: { type: Number, default: 0 },
        architectureUnderstanding: { type: Number, default: 0 },
        implementationReasoning: { type: Number, default: 0 },
        tradeoffUnderstanding: { type: Number, default: 0 },
        feedback: String
      }]
    },
    learningReport: {
      strengths: [String],
      weakAreas: [String],
      missingConcepts: [String],
      suggestedImprovements: [String],
      refactoringIdeas: [String],
      productionReadinessScore: { type: Number, default: 0 },
      portfolioReadinessScore: { type: Number, default: 0 }
    },
    topQuestions: [mongoose.Schema.Types.Mixed],
    // New trust & transparency fields
    fallbackMode: {
      active: { type: Boolean, default: false },
      reason: { type: String, default: '' },
      affectedFeatures: [String]
    },
    unverifiedClaims: [{
      name: { type: String },
      status: { type: String, default: 'unverified' },
      reason: { type: String, default: '' }
    }],
    projectClassification: {
      type: { type: String, default: '' },
      confidence: { type: String, enum: ['High', 'Medium', 'Low', 'Unknown', ''], default: '' },
      evidence: [String]
    },
    // Deterministic evidence for architecture claims
    detectedTechnologiesEvidence: [{
      name: { type: String },
      evidence: [String],
      paths: [String]
    }],
    // Persisted text file contents for progressive queries
    fileContents: [{
      path: { type: String },
      content: { type: String }
    }]
  },
  
  // Career Coach recommendations
  careerCoach: {
    marketReadiness: { type: String }, // e.g. "Ready for Frontend Internship"
    jobReadiness: { type: String }, // e.g. "Junior React Developer (75%)"
    recommendedRoles: [String],
    recommendedCompanies: [String],
    salaryGuidance: { type: String },
    learningRoadmap: [
      {
        phase: { type: String }, // e.g. "Immediate", "30 Days", "90 Days"
        topics: [String]
      }
    ]
  }
}, {
  timestamps: true
});

const LearningSession = mongoose.model('LearningSession', learningSessionSchema);
export default LearningSession;
