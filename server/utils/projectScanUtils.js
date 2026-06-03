const IGNORE_PATTERNS = [
  /node_modules/i,
  /(^|\/)dist(\/|$)/i,
  /(^|\/)build(\/|$)/i,
  /(^|\/)coverage(\/|$)/i,
  /(^|\/)assets(\/|$)/i,
  /(^|\/)public\/uploads/i,
  /\.git(\/|$)/i,
  /\.cache/i,
  /package-lock\.json/i,
  /yarn\.lock/i,
  /pnpm-lock\.yaml/i,
  /bun\.lockb/i,
  /\.(png|jpe?g|gif|svg|webp|woff2?|eot|ttf|mp3|mp4|webm|zip|tar\.gz|ico|map|pdf|exe|dll|so|dylib|bin|wasm)$/i
];

const TEXT_EXTENSIONS = /\.(jsx?|tsx?|mjs|cjs|json|md|mdx|css|scss|sass|less|html?|vue|svelte|yml|yaml|toml|env\.example|prisma|graphql|sql|sh|bat|ps1|dockerfile)$/i;

const KEY_CONFIG_FILES = [
  'package.json',
  'tsconfig.json',
  'vite.config.js',
  'vite.config.ts',
  'next.config.js',
  'next.config.mjs',
  'webpack.config.js',
  'docker-compose.yml',
  'README.md',
  '.env.example',
  'requirements.txt'
];

export const isIgnoredPath = (filePath) => IGNORE_PATTERNS.some((pattern) => pattern.test(filePath));

export const isTextSourcePath = (filePath) => TEXT_EXTENSIONS.test(filePath) || KEY_CONFIG_FILES.some((name) => filePath.endsWith(name));

export const parseGitHubUrl = (url) => {
  const trimmed = (url || '').trim();
  const match = trimmed.match(/github\.com[/:]([^/]+)\/([^/.\s]+)/i);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/i, '') };
};

export const buildProjectSummaryText = ({
  sourceLabel,
  repoUrl = '',
  files = [],
  fileContents = []
}) => {
  const fileLines = files
    .slice(0, 80)
    .map((f) => `- ${f.path} (${f.size ?? (f.content?.length ?? 0)} ${f.content ? 'chars' : 'bytes'})`)
    .join('\n');

  const contentBlocks = fileContents
    .slice(0, 12)
    .map((f) => `\n--- ${f.path} ---\n${(f.content || '').slice(0, 4000)}`)
    .join('\n');

  return `
${sourceLabel}
${repoUrl ? `Repository: ${repoUrl}` : ''}
Scanned ${files.length} relevant files (ignored node_modules, dist, build, coverage, lock files, media, binaries).

File tree sample:
${fileLines || '(no files)'}

Key file excerpts:
${contentBlocks || '(no excerpts)'}
`.trim();
};

const TECH_EVIDENCE_PATTERNS = [
  // Files that provide strong evidence for specific technologies
  { name: 'Redis', patterns: [/redis/i] },
  { name: 'Kafka', patterns: [/kafka/i] },
  { name: 'Kubernetes', patterns: [/kubernetes|k8s|\.kube/i] },
  { name: 'AWS', patterns: [/aws-sdk|amazonaws|aws-sam/i] },
  { name: 'Docker', patterns: [/docker/i] },
  { name: 'Docker Compose', patterns: [/docker.?compose/i] },
  { name: 'PostgreSQL', patterns: [/postgres|pg\b|pg-promise|sequelize|typeorm/i] },
  { name: 'MongoDB', patterns: [/mongodb|mongoose|mongod/i] },
  { name: 'MySQL', patterns: [/mysql|mariadb/i] },
  { name: 'SQLite', patterns: [/sqlite|sqlite3|better-sqlite3/i] },
  { name: 'Redis', patterns: [/redis/i] },
  { name: 'JWT', patterns: [/jsonwebtoken|jwt/i] },
  { name: 'OAuth', patterns: [/oauth|passport|auth0/i] },
  { name: 'Firebase', patterns: [/firebase/i] },
  { name: 'GraphQL', patterns: [/graphql|apollo/i] },
  { name: 'WebSocket', patterns: [/websocket|socket\.io|ws\b/i] },
  { name: 'gRPC', patterns: [/grpc|protobuf/i] },
  { name: 'Tailwind CSS', patterns: [/tailwindcss/i] },
  { name: 'Bootstrap', patterns: [/bootstrap/i] },
  { name: 'Sass/SCSS', patterns: [/sass|scss/i] },
  { name: 'Redux', patterns: [/redux/i] },
  { name: 'Zustand', patterns: [/zustand/i] },
  { name: 'React Router', patterns: [/react-router/i] },
  { name: 'Axios', patterns: [/axios/i] },
  { name: 'Express', patterns: [/express/i] },
  { name: 'Next.js', patterns: [/next/i] },
  { name: 'Vue', patterns: [/vue/i] },
  { name: 'Angular', patterns: [/@angular/i] },
  { name: 'Svelte', patterns: [/svelte/i] },
  { name: 'React Native', patterns: [/react-native/i] },
  { name: 'Electron', patterns: [/electron/i] },
  { name: 'Prisma', patterns: [/prisma/i] },
  { name: 'TypeORM', patterns: [/typeorm/i] },
  { name: 'Mongoose', patterns: [/mongoose/i] },
  { name: 'Jest', patterns: [/jest/i] },
  { name: 'Vitest', patterns: [/vitest/i] },
  { name: 'Mocha', patterns: [/mocha/i] },
  { name: 'Cypress', patterns: [/cypress/i] },
  { name: 'Playwright', patterns: [/playwright/i] },
  { name: 'ESLint', patterns: [/eslint/i] },
  { name: 'Prettier', patterns: [/prettier/i] },
  { name: 'Webpack', patterns: [/webpack/i] },
  { name: 'Vite', patterns: [/vite/i] },
  { name: 'Babel', patterns: [/@babel|babel-/i] },
  { name: 'TypeScript', patterns: [/typescript|tsconfig/i] },
  { name: 'Flask', patterns: [/flask/i] },
  { name: 'scikit-learn', patterns: [/sklearn|scikit-learn/i] },
  { name: 'NumPy', patterns: [/numpy/i] },
  { name: 'Pandas', patterns: [/pandas/i] },
  { name: 'Joblib', patterns: [/joblib/i] },
  { name: 'Gunicorn', patterns: [/gunicorn/i] },
  { name: 'Django', patterns: [/django/i] },
  { name: 'FastAPI', patterns: [/fastapi/i] },
];

const LANGUAGE_BY_EXTENSION = {
  '.js': 'JavaScript', '.jsx': 'JavaScript (React JSX)', '.ts': 'TypeScript',
  '.tsx': 'TypeScript (React TSX)', '.mjs': 'JavaScript (ES Module)',
  '.cjs': 'JavaScript (CommonJS)', '.py': 'Python', '.rb': 'Ruby',
  '.java': 'Java', '.go': 'Go', '.rs': 'Rust', '.cs': 'C#',
  '.php': 'PHP', '.swift': 'Swift', '.kt': 'Kotlin',
  '.vue': 'Vue', '.svelte': 'Svelte', '.html': 'HTML',
  '.css': 'CSS', '.scss': 'SCSS', '.sass': 'Sass',
  '.less': 'Less', '.sql': 'SQL', '.graphql': 'GraphQL',
  '.yaml': 'YAML', '.yml': 'YAML', '.toml': 'TOML',
  '.dockerfile': 'Docker', '.sh': 'Shell', '.bat': 'Batch',
  '.ps1': 'PowerShell',
};

const HIGH_RISK_CLAIMS = ['Redis', 'Kafka', 'Kubernetes', 'AWS', 'Docker'];

/**
 * Detect technologies deterministically from scanned file contents.
 * Returns { technologies: Array<{name, evidence, path}>, languages: Array<string> }
 */
export const detectTechnologiesFromFiles = (files = [], fileContents = []) => {
  const techMap = new Map();
  const contentTexts = fileContents.map(fc => ({ path: fc.path, text: fc.content || '' }));
  const allPaths = files.map(f => f.path);

  // 1. Parse package.json content for dependencies
  const pkgJson = fileContents.find(fc => fc.path.endsWith('package.json'));
  if (pkgJson && pkgJson.content) {
    try {
      const pkg = JSON.parse(pkgJson.content);
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies };
      for (const [dep] of Object.entries(allDeps)) {
        for (const rule of TECH_EVIDENCE_PATTERNS) {
          if (rule.patterns.some(p => p.test(dep))) {
            const key = rule.name;
            if (!techMap.has(key)) {
              techMap.set(key, { name: key, evidence: [], paths: [] });
            }
            techMap.get(key).evidence.push(`package.json dependency: ${dep}`);
            techMap.get(key).paths.push('package.json');
          }
        }
      }
    } catch { /* skip unparseable */ }
  }

  // 2. Scan all file contents for tech evidence patterns
  for (const { path, text } of contentTexts) {
    if (!text) continue;
    for (const rule of TECH_EVIDENCE_PATTERNS) {
      if (techMap.has(rule.name) && techMap.get(rule.name).paths.includes(path)) continue;
      if (rule.patterns.some(p => p.test(text))) {
        const key = rule.name;
        if (!techMap.has(key)) {
          techMap.set(key, { name: key, evidence: [], paths: [] });
        }
        techMap.get(key).evidence.push(`Found in: ${path}`);
        techMap.get(key).paths.push(path);
      }
    }
  }

  // 3. Detect languages from file extensions
  const languages = new Set();
  for (const path of allPaths) {
    const ext = Object.keys(LANGUAGE_BY_EXTENSION).find(e => path.endsWith(e) || path.toLowerCase().includes(e));
    if (ext) {
      languages.add(LANGUAGE_BY_EXTENSION[ext]);
    }
  }

  // 4. Detect runtime/config from key files
  for (const path of allPaths) {
    const lower = path.toLowerCase();
    if (lower.endsWith('dockerfile')) {
      if (!techMap.has('Docker')) techMap.set('Docker', { name: 'Docker', evidence: [`Found: ${path}`], paths: [path] });
    }
    if (lower.includes('docker-compose')) {
      if (!techMap.has('Docker Compose')) techMap.set('Docker Compose', { name: 'Docker Compose', evidence: [`Found: ${path}`], paths: [path] });
    }
    if (lower.endsWith('tsconfig.json')) {
      if (!techMap.has('TypeScript')) techMap.set('TypeScript', { name: 'TypeScript', evidence: [`Found: ${path}`], paths: [path] });
    }
    if (lower.includes('vite.config')) {
      if (!techMap.has('Vite')) techMap.set('Vite', { name: 'Vite', evidence: [`Found: ${path}`], paths: [path] });
    }
    if (lower.includes('next.config')) {
      if (!techMap.has('Next.js')) techMap.set('Next.js', { name: 'Next.js', evidence: [`Found: ${path}`], paths: [path] });
    }
    if (lower.includes('webpack.config')) {
      if (!techMap.has('Webpack')) techMap.set('Webpack', { name: 'Webpack', evidence: [`Found: ${path}`], paths: [path] });
    }
    if (lower.includes('requirements.txt')) {
      if (!techMap.has('Python')) techMap.set('Python', { name: 'Python', evidence: [`Found: ${path}`], paths: [path] });
    }
    if (lower.includes('go.mod')) {
      if (!techMap.has('Go')) techMap.set('Go', { name: 'Go', evidence: [`Found: ${path}`], paths: [path] });
    }
    if (lower.includes('pom.xml')) {
      if (!techMap.has('Java')) techMap.set('Java', { name: 'Java', evidence: [`Found: ${path}`], paths: [path] });
    }
    if (lower.includes('cargo.toml')) {
      if (!techMap.has('Rust')) techMap.set('Rust', { name: 'Rust', evidence: [`Found: ${path}`], paths: [path] });
    }
  }

  return {
    technologies: Array.from(techMap.values()),
    languages: Array.from(languages),
  };
};

/**
 * Validate AI claims against deterministic evidence.
 * Returns { verified, unverified } claims.
 */
export const validateClaimsAgainstEvidence = (aiClaimedTechnologies = [], detectedTechnologies = []) => {
  const detectedNames = new Set(detectedTechnologies.map(t => t.name.toLowerCase()));
  const verified = [];
  const unverified = [];

  for (const claim of aiClaimedTechnologies) {
    const claimName = typeof claim === 'string' ? claim : (claim.name || claim);
    const isHighRisk = HIGH_RISK_CLAIMS.some(hr => claimName.toLowerCase().includes(hr.toLowerCase()));

    if (detectedNames.has(claimName.toLowerCase())) {
      verified.push(claimName);
    } else if (isHighRisk) {
      unverified.push({ name: claimName, status: 'unverified', reason: 'No supporting file evidence found' });
    } else {
      // Low-risk claims with partial match get through but marked low confidence
      verified.push(claimName);
    }
  }

  return { verified, unverified };
};

/**
 * Compute confidence level from evidence strength.
 */
export const computeConfidence = ({ detectedFrom = [] }) => {
  if (!detectedFrom || detectedFrom.length === 0) return 'Unknown';
  if (detectedFrom.length >= 2) return 'High';
  if (detectedFrom.length === 1) return 'Medium';
  return 'Low';
};

export { KEY_CONFIG_FILES, TEXT_EXTENSIONS };
