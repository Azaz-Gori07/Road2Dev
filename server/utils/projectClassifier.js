/**
 * Deterministic Project Classification
 *
 * Maps scanner evidence (detected technologies, languages, file paths) to
 * project types without any AI inference.
 *
 * Input: output of detectTechnologiesFromFiles() + file list from scanner.
 * Output: { type, confidence, evidence }
 */

const RULES = [

  // ── AI/LLM
  {
    type: 'AI/LLM',
    score: 3,
    match: (techNames) =>
      techNames.some(t => ['OpenAI', 'LangChain', 'Anthropic'].includes(t)),
  },

  // ── Deep Learning
  {
    type: 'Deep Learning',
    score: 3,
    match: (techNames) =>
      techNames.some(t => ['TensorFlow', 'PyTorch', 'Keras'].includes(t)),
  },

  // ── Machine Learning
  {
    type: 'Machine Learning',
    score: 3,
    match: (techNames) =>
      techNames.some(t => ['scikit-learn', 'sklearn', 'xgboost'].includes(t)),
  },

  // ── Data Science (only if ML/DL is absent)
  {
    type: 'Data Science',
    score: 3,
    match: (techNames, langs, paths) => {
      const hasNumpyPandas = techNames.some(t => ['NumPy', 'Pandas'].includes(t));
      const hasNotebook = paths.some(p => /\.ipynb$/i.test(p));
      const hasML = techNames.some(t => ['scikit-learn', 'sklearn', 'xgboost', 'TensorFlow', 'PyTorch', 'Keras'].includes(t));
      return (hasNumpyPandas || hasNotebook) && !hasML;
    },
  },

  // ── DevOps (Docker + CI or orchestration)
  {
    type: 'DevOps',
    score: 3,
    match: (techNames, langs, paths) => {
      const hasDocker = techNames.some(t => ['Docker', 'Docker Compose'].includes(t));
      const hasOrch = techNames.some(t => ['Kubernetes', 'Terraform'].includes(t));
      const hasCI = paths.some(p => /\.github\/workflows|\.gitlab-ci|Jenkinsfile/i.test(p));
      return (hasDocker && hasCI) || hasOrch || (hasDocker && techNames.some(t => ['Nginx'].includes(t)));
    },
  },
  {
    type: 'DevOps',
    score: 2,
    match: (techNames) =>
      techNames.some(t => ['Docker', 'Docker Compose'].includes(t)),
  },

  // ── Mobile App
  {
    type: 'Mobile App',
    score: 3,
    match: (techNames) => techNames.includes('React Native'),
  },

  // ── Desktop App (score 4 so it beats coincident Web App signals)
  {
    type: 'Desktop App',
    score: 4,
    match: (techNames) => techNames.includes('Electron'),
  },

  // ── Browser Extension
  {
    type: 'Browser Extension',
    score: 2,
    match: (techNames, langs, paths) => paths.some(p => /manifest\.json$/i.test(p)),
  },

  // ── Web App (frontend framework present)
  {
    type: 'Web App',
    score: 3,
    match: (techNames) =>
      techNames.some(t => ['React', 'Vue', 'Angular', 'Svelte', 'Next.js'].includes(t)),
  },
  {
    type: 'Web App',
    score: 1,
    match: (techNames, langs) =>
      langs.includes('HTML') && langs.includes('JavaScript'),
  },

  // ── API Service (backend framework without frontend)
  {
    type: 'API Service',
    score: 3,
    match: (techNames) => {
      const hasAPI = techNames.some(t => ['Express', 'FastAPI', 'Flask', 'Django'].includes(t));
      const hasFrontend = techNames.some(t => ['React', 'Vue', 'Angular', 'Svelte', 'Next.js', 'HTML'].includes(t));
      return hasAPI && !hasFrontend;
    },
  },

  // ── CLI Tool
  {
    type: 'CLI Tool',
    score: 2,
    match: (techNames, langs, paths) =>
      paths.some(p => /^bin\//i.test(p) || /^cli\//i.test(p)),
  },

  // ── Library (package-based, no app entry, no web framework)
  {
    type: 'Library',
    score: 2,
    match: (techNames, langs, paths) => {
      const hasPackage = paths.some(p => /package\.json|setup\.py|pyproject\.toml/i.test(p));
      const noAppEntry = !paths.some(p => /app\.(js|ts|jsx|tsx|py)$/i.test(p));
      const noWebFw = !techNames.some(t => ['React', 'Vue', 'Angular', 'Express', 'Flask', 'Django', 'FastAPI'].includes(t));
      return hasPackage && noAppEntry && noWebFw;
    },
  },

  // ── Automation (testing/CI tools without app server)
  {
    type: 'Automation',
    score: 3,
    match: (techNames, langs, paths) => {
      const hasE2E = techNames.some(t => ['Playwright', 'Cypress', 'Puppeteer', 'Selenium'].includes(t));
      const hasWebFw = techNames.some(t => ['React', 'Vue', 'Express', 'Flask', 'Django'].includes(t));
      return hasE2E && !hasWebFw;
    },
  },
  {
    type: 'Automation',
    score: 2,
    match: (techNames, langs, paths) => {
      const hasWorkflows = paths.some(p => /\.github\/workflows/i.test(p));
      const hasWebFw = techNames.some(t => ['React', 'Vue', 'Express', 'Flask', 'Django'].includes(t));
      return hasWorkflows && langs.includes('Shell') && !hasWebFw;
    },
  },

  // ── DSA (algorithm filenames, no framework)
  {
    type: 'DSA',
    score: 1,
    match: (techNames, langs, paths) => {
      const hasAlgo = paths.some(p => /sort|search|graph|tree|dp|recursion|backtrack|bfs|dfs|linked.?list|stack|queue/i.test(p));
      const noFw = !techNames.some(t => ['React', 'Vue', 'Angular', 'Express', 'Flask', 'Django', 'Next.js'].includes(t));
      return hasAlgo && noFw;
    },
  },
];

/**
 * Classify a project from deterministic scanner evidence.
 *
 * @param {Object} opts
 * @param {Array<{name:string}>} opts.technologies  — from detectTechnologiesFromFiles().technologies
 * @param {string[]}            opts.languages       — from detectTechnologiesFromFiles().languages
 * @param {Array<{path:string}>} opts.files          — raw file list (path on each entry)
 * @returns {{ type: string, confidence: string, evidence: string[] }}
 */
export function classifyProject({ technologies = [], languages = [], files = [] } = {}) {
  const techNames = (technologies || []).map(t => t.name);
  const filePaths = (files || []).map(f => f.path);

  const scores = {};

  for (const rule of RULES) {
    try {
      if (rule.match(techNames, languages, filePaths)) {
        scores[rule.type] = (scores[rule.type] || 0) + rule.score;
      }
    } catch (err) {
      // rule error — skip
    }
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const topType = sorted.length > 0 ? sorted[0][0] : 'Unknown';
  const topScore = sorted.length > 0 ? sorted[0][1] : 0;

  const confidence =
    topScore >= 6 ? 'High' :
    topScore >= 3 ? 'Medium' :
    topScore >= 1 ? 'Low' :
    'Unknown';

  const evidence = sorted
    .filter(([, s]) => s > 0)
    .slice(0, 3)
    .map(([t, s]) => `${t} (score: ${s})`);

  if (evidence.length === 0) evidence.push('No matching project type signals detected');

  return { type: topType, confidence, evidence };
}
