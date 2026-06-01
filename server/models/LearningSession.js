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
    enum: ['Concept Learning', 'Sandbox Practice', 'Project Defense', 'Interview Remediation', 'Career Strategy'], 
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
  
  // Chat dialogue logs
  messages: [messageSchema],
  
  // Project Ingestion Context
  projectContext: {
    projectName: { type: String },
    repoUrl: { type: String },
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
        question: String,
        answer: String,
        authorshipScore: Number, // 1-100% evaluating deep understanding
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
    topQuestions: [String] // List of Top 25 Project-Specific Questions
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
