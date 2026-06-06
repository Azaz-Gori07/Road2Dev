/**
 * Sprint 3 Verification — Deterministic Project Classification
 *
 * Tests the classifyProject function against 8 project types using
 * mock scanner evidence (no AI, no MongoDB).
 */

import { classifyProject } from '../utils/projectClassifier.js';

let PASS = 0, FAIL = 0, TOTAL = 0;

function test(label, actual, expected) {
  TOTAL++;
  const ok = actual.type === expected.type &&
             ['High', 'Medium', 'Low', 'Unknown'].includes(actual.confidence) &&
             Array.isArray(actual.evidence) &&
             actual.evidence.length > 0;
  if (ok) {
    PASS++;
    console.log(`  PASS: ${label} → ${actual.type} (${actual.confidence})`);
  } else {
    FAIL++;
    console.log(`  FAIL: ${label} → got ${actual.type}/${actual.confidence}, expected ${expected.type}`);
    console.log(`        evidence: ${actual.evidence.join(', ')}`);
  }
}

console.log('╔══════════════════════════════════════════════╗');
console.log('║   Sprint 3 Verification Suite               ║');
console.log('║   Deterministic Project Classification      ║');
console.log('╚══════════════════════════════════════════════╝');
console.log('');

// ── 1. React App → Web App ──
console.log('--- 1. React App ---');
test('React App', classifyProject({
  technologies: [
    { name: 'React', evidence: ['package.json dependency: react'], paths: ['package.json'] },
    { name: 'Zustand', evidence: ['package.json dependency: zustand'], paths: ['package.json'] },
    { name: 'Axios', evidence: ['package.json dependency: axios'], paths: ['package.json'] },
    { name: 'Vite', evidence: ['Config file: vite.config.js'], paths: ['vite.config.js'] },
  ],
  languages: ['JavaScript', 'HTML', 'CSS'],
  files: [
    { path: 'package.json' }, { path: 'vite.config.js' },
    { path: 'src/App.jsx' }, { path: 'src/index.js' },
    { path: 'src/components/Navbar.jsx' }, { path: 'src/pages/Home.jsx' },
    { path: 'index.html' },
  ],
}), { type: 'Web App' });

// ── 2. Next.js App → Web App ──
console.log('\n--- 2. Next.js App ---');
test('Next.js App', classifyProject({
  technologies: [
    { name: 'Next.js', evidence: ['package.json dependency: next'], paths: ['package.json'] },
    { name: 'React', evidence: ['package.json dependency: react'], paths: ['package.json'] },
    { name: 'TypeScript', evidence: ['Config file: tsconfig.json'], paths: ['tsconfig.json'] },
    { name: 'Prisma', evidence: ['package.json dependency: @prisma/client'], paths: ['package.json'] },
  ],
  languages: ['TypeScript', 'JavaScript', 'HTML', 'CSS'],
  files: [
    { path: 'package.json' }, { path: 'next.config.js' }, { path: 'tsconfig.json' },
    { path: 'app/page.tsx' }, { path: 'app/layout.tsx' },
    { path: 'app/api/posts/route.ts' },
  ],
}), { type: 'Web App' });

// ── 3. Python ML Project → Machine Learning ──
console.log('\n--- 3. Python ML Project ---');
test('Python ML Project', classifyProject({
  technologies: [
    { name: 'scikit-learn', evidence: ['requirements.txt dependency: scikit-learn'], paths: ['requirements.txt'] },
    { name: 'NumPy', evidence: ['requirements.txt dependency: numpy'], paths: ['requirements.txt'] },
    { name: 'Pandas', evidence: ['requirements.txt dependency: pandas'], paths: ['requirements.txt'] },
    { name: 'xgboost', evidence: ['requirements.txt dependency: xgboost'], paths: ['requirements.txt'] },
    { name: 'Flask', evidence: ['requirements.txt dependency: flask'], paths: ['requirements.txt'] },
  ],
  languages: ['Python'],
  files: [
    { path: 'requirements.txt' }, { path: 'setup.py' },
    { path: 'src/data/preprocessor.py' }, { path: 'src/models/train.py' },
    { path: 'src/models/predict.py' }, { path: 'src/api/app.py' },
    { path: 'notebooks/eda.ipynb' },
  ],
}), { type: 'Machine Learning' });

// ── 4. Docker/DevOps Project → DevOps ──
console.log('\n--- 4. Docker/DevOps Project ---');
test('Docker/DevOps Project', classifyProject({
  technologies: [
    { name: 'Docker', evidence: ['Config file: Dockerfile'], paths: ['Dockerfile'] },
    { name: 'Docker Compose', evidence: ['Config file: docker-compose.yml'], paths: ['docker-compose.yml'] },
    { name: 'Express', evidence: ['package.json dependency: express'], paths: ['api/package.json'] },
    { name: 'Nginx', evidence: ['Config file: nginx/nginx.conf'], paths: ['nginx/nginx.conf'] },
  ],
  languages: ['JavaScript', 'YAML', 'Dockerfile', 'Shell'],
  files: [
    { path: 'docker-compose.yml' }, { path: 'Dockerfile' },
    { path: 'api/package.json' }, { path: 'api/src/server.js' },
    { path: 'nginx/nginx.conf' },
    { path: '.github/workflows/deploy.yml' },
  ],
}), { type: 'DevOps' });

// ── 5. CLI Tool ──
console.log('\n--- 5. CLI Tool ---');
test('CLI Tool', classifyProject({
  technologies: [],
  languages: ['JavaScript'],
  files: [
    { path: 'package.json' }, { path: 'bin/cli.js' },
    { path: 'bin/index.js' }, { path: 'src/commands.js' },
    { path: 'README.md' },
  ],
}), { type: 'CLI Tool' });

// ── 6. Browser Extension ──
console.log('\n--- 6. Browser Extension ---');
test('Browser Extension', classifyProject({
  technologies: [],
  languages: ['JavaScript', 'HTML', 'CSS'],
  files: [
    { path: 'manifest.json' },
    { path: 'background.js' },
    { path: 'content_script.js' },
    { path: 'popup.html' },
    { path: 'popup.js' },
    { path: 'icons/icon128.png' },
  ],
}), { type: 'Browser Extension' });

// ── 7. Library Package (npm library) ──
console.log('\n--- 7. Library Package ---');
test('Library Package', classifyProject({
  technologies: [
    { name: 'TypeScript', evidence: ['Config file: tsconfig.json'], paths: ['tsconfig.json'] },
  ],
  languages: ['TypeScript', 'JavaScript'],
  files: [
    { path: 'package.json' }, { path: 'tsconfig.json' },
    { path: 'src/index.ts' }, { path: 'src/utils.ts' },
    { path: 'README.md' },
  ],
}), { type: 'Library' });

// ── 8. Portfolio Project (HTML/CSS/JS only) ──
console.log('\n--- 8. Portfolio Project ---');
test('Portfolio Project', classifyProject({
  technologies: [],
  languages: ['HTML', 'CSS', 'JavaScript'],
  files: [
    { path: 'index.html' }, { path: 'css/style.css' },
    { path: 'js/main.js' }, { path: 'js/projects.js' },
    { path: 'README.md' },
  ],
}), { type: 'Web App' });

// ── 9. API Service (Express, no frontend) ──
console.log('\n--- 9. API Service ---');
test('API Service', classifyProject({
  technologies: [
    { name: 'Express', evidence: ['package.json dependency: express'], paths: ['package.json'] },
    { name: 'MongoDB', evidence: ['package.json dependency: mongoose'], paths: ['package.json'] },
    { name: 'JWT', evidence: ['package.json dependency: jsonwebtoken'], paths: ['package.json'] },
  ],
  languages: ['JavaScript'],
  files: [
    { path: 'package.json' }, { path: 'src/server.js' },
    { path: 'src/routes/users.js' }, { path: 'src/routes/orders.js' },
    { path: 'src/models/User.js' }, { path: 'src/middleware/auth.js' },
  ],
}), { type: 'API Service' });

// ── 10. Automation (GitHub Actions + Shell) ──
console.log('\n--- 10. Automation Project ---');
test('Automation Project', classifyProject({
  technologies: [
    { name: 'Playwright', evidence: ['package.json dependency: @playwright/test'], paths: ['package.json'] },
  ],
  languages: ['JavaScript', 'Shell'],
  files: [
    { path: 'package.json' },
    { path: '.github/workflows/test.yml' },
    { path: 'tests/e2e.spec.js' },
    { path: 'scripts/setup.sh' },
  ],
}), { type: 'Automation' });

// ── 11. Desktop App (Electron) ──
console.log('\n--- 11. Desktop App ---');
test('Desktop App', classifyProject({
  technologies: [
    { name: 'Electron', evidence: ['package.json dependency: electron'], paths: ['package.json'] },
    { name: 'React', evidence: ['package.json dependency: react'], paths: ['package.json'] },
  ],
  languages: ['JavaScript', 'HTML', 'CSS'],
  files: [
    { path: 'package.json' }, { path: 'main.js' },
    { path: 'src/App.jsx' }, { path: 'public/index.html' },
  ],
}), { type: 'Desktop App' });

// ── 12. DSA Practice ──
console.log('\n--- 12. DSA Practice ---');
test('DSA Practice', classifyProject({
  technologies: [],
  languages: ['JavaScript', 'Python'],
  files: [
    { path: 'sorting/quicksort.js' }, { path: 'searching/binarySearch.js' },
    { path: 'trees/BST.js' }, { path: 'dp/fibonacci.py' },
    { path: 'graphs/bfs.py' },
  ],
}), { type: 'DSA' });

// ── 13. Data Science (Jupyter + Pandas, no ML) ──
console.log('\n--- 13. Data Science ---');
test('Data Science', classifyProject({
  technologies: [
    { name: 'NumPy', evidence: ['requirements.txt dependency: numpy'], paths: ['requirements.txt'] },
    { name: 'Pandas', evidence: ['requirements.txt dependency: pandas'], paths: ['requirements.txt'] },
  ],
  languages: ['Python'],
  files: [
    { path: 'requirements.txt' }, { path: 'notebooks/analysis.ipynb' },
    { path: 'data/dataset.csv' }, { path: 'src/visualization.py' },
  ],
}), { type: 'Data Science' });

// ── 14. AI/LLM ──
console.log('\n--- 14. AI/LLM Project ---');
test('AI/LLM Project', classifyProject({
  technologies: [
    { name: 'LangChain', evidence: ['package.json dependency: langchain'], paths: ['package.json'] },
    { name: 'OpenAI', evidence: ['package.json dependency: openai'], paths: ['package.json'] },
  ],
  languages: ['Python', 'JavaScript'],
  files: [
    { path: 'requirements.txt' }, { path: 'src/llm_chain.py' },
    { path: 'src/embeddings.py' }, { path: 'config.yaml' },
  ],
}), { type: 'AI/LLM' });

// ── 15. Deep Learning ──
console.log('\n--- 15. Deep Learning ---');
test('Deep Learning', classifyProject({
  technologies: [
    { name: 'TensorFlow', evidence: ['requirements.txt dependency: tensorflow'], paths: ['requirements.txt'] },
    { name: 'Keras', evidence: ['requirements.txt dependency: keras'], paths: ['requirements.txt'] },
    { name: 'NumPy', evidence: ['requirements.txt dependency: numpy'], paths: ['requirements.txt'] },
  ],
  languages: ['Python'],
  files: [
    { path: 'requirements.txt' }, { path: 'src/train.py' },
    { path: 'src/model.py' }, { path: 'data/train/images/' },
  ],
}), { type: 'Deep Learning' });

// ── 16. Unknown (no signals) ──
console.log('\n--- 16. Unknown ---');
test('Unknown Project', classifyProject({
  technologies: [],
  languages: ['YAML', 'Markdown'],
  files: [
    { path: 'README.md' }, { path: 'notes.txt' },
  ],
}), { type: 'Unknown' });

// ── Report ──
console.log(`\n${'='.repeat(60)}`);
console.log('RESULTS');
console.log(`${'='.repeat(60)}`);
console.log(`  Total: ${TOTAL}  Passed: ${PASS}  Failed: ${FAIL}  Score: ${TOTAL ? Math.round(PASS/TOTAL*100) : 0}%`);
console.log(`${'='.repeat(60)}`);
if (FAIL === 0) {
  console.log('SPRINT 3 VERIFIED — All classification tests pass');
} else {
  console.log(`SPRINT 3 — ${FAIL} test(s) failed — review above`);
}
console.log(`${'='.repeat(60)}`);
