import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env'), quiet: true });

import {
  analyzeProjectSummary,
  generateArchitectureReview,
  generateDefenseQuestions,
} from '../services/learningLabAiService.js';

import {
  hybridGenerate,
} from '../services/ai/hybridAiRouter.js';

// ── Helpers ──

let PASS = 0, FAIL = 0, TOTAL = 0;
const results = [];

function tally(ok, label, detail = '') {
  ok ? PASS++ : FAIL++;
  TOTAL++;
  results.push({ ok, label, detail });
}

function report() {
  console.log(`\n${'='.repeat(60)}`);
  console.log('  RESULTS');
  console.log(`${'='.repeat(60)}`);
  for (const r of results) {
    console.log(`  ${r.ok ? 'PASS' : 'FAIL'}: ${r.label}${r.detail ? ` — ${r.detail}` : ''}`);
  }
  console.log(`\n  Total: ${TOTAL}  Passed: ${PASS}  Failed: ${FAIL}  Score: ${TOTAL ? Math.round(PASS/TOTAL*100) : 0}%`);
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ── Shared extraction test (reuse from Sprint 1) ──

function extractJsonBraceDepth(text) {
  if (!text || typeof text !== 'string') throw new Error('AI returned an empty response.');
  const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  let depth = 0, start = -1, inString = false, escaped = false;
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\' && inString) { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') { if (depth === 0) start = i; depth++; }
    else if (ch === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        const jsonStr = cleaned.slice(start, i + 1);
        try { return JSON.parse(jsonStr); }
        catch (parseErr) {
          const fixed = jsonStr.replace(/,\s*([}\]])/g, '$1');
          try { return JSON.parse(fixed); }
          catch { throw new Error(`AI JSON parse failed: ${parseErr.message}`); }
        }
      }
    }
  }
  throw new Error('AI response was truncated or invalid JSON.');
}

// ── Mock project data (same as Sprint 1) ──

function makeSummary(label, repoUrl, files, contents) {
  const fileLines = files.slice(0, 80)
    .map(f => `- ${f.path} (${f.size ?? (f.content?.length ?? 0)} chars)`)
    .join('\n');
  const contentBlocks = contents.slice(0, 12)
    .map(f => `\n--- ${f.path} ---\n${(f.content || '').slice(0, 4000)}`)
    .join('\n');
  return {
    projectSummaryText: `
${label}
${repoUrl ? `Repository: ${repoUrl}` : ''}
Scanned ${files.length} relevant files (ignored node_modules, dist, build, coverage, lock files, media, binaries).

File tree sample:
${fileLines || '(no files)'}

Key file excerpts:
${contentBlocks || '(no excerpts)'}
`.trim(),
    repoUrl
  };
}

const projects = {
  react: makeSummary('Ingested Local Project: ecommerce-dashboard', '', [
    { path: 'package.json', size: 3200 }, { path: 'src/App.jsx', size: 2400 },
    { path: 'src/index.js', size: 500 }, { path: 'src/components/Navbar.jsx', size: 1800 },
    { path: 'src/components/ProductCard.jsx', size: 3200 }, { path: 'src/components/Cart.jsx', size: 4500 },
    { path: 'src/components/CheckoutForm.jsx', size: 3800 }, { path: 'src/pages/Home.jsx', size: 1200 },
    { path: 'src/pages/Products.jsx', size: 2100 }, { path: 'src/pages/Checkout.jsx', size: 1600 },
    { path: 'src/context/AuthContext.jsx', size: 2800 }, { path: 'src/context/CartContext.jsx', size: 2200 },
    { path: 'src/hooks/useFetch.js', size: 1500 }, { path: 'src/utils/api.js', size: 900 },
    { path: 'src/styles/global.css', size: 3400 }, { path: 'src/styles/ProductCard.module.css', size: 800 },
    { path: 'vite.config.js', size: 400 }, { path: '.env.example', size: 150 },
  ], [
    { path: 'package.json', content: JSON.stringify({ name: 'ecommerce-dashboard', version: '1.0.0', dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1', 'react-router-dom': '^6.26.0', 'react-hook-form': '^7.52.0', axios: '^1.7.2', zustand: '^4.5.2', recharts: '^2.12.0' }, devDependencies: { vite: '^5.3.4' } }) },
    { path: 'src/App.jsx', content: "import { Routes, Route } from 'react-router-dom';\nimport Navbar from './components/Navbar';\nimport Home from './pages/Home';\nimport Products from './pages/Products';\nimport Checkout from './pages/Checkout';\nimport { AuthProvider } from './context/AuthContext';\nimport { CartProvider } from './context/CartContext';\nexport default function App() {\n  return (\n    <AuthProvider><CartProvider><Navbar /><Routes><Route path='/' element={<Home />} /><Route path='/products' element={<Products />} /><Route path='/checkout' element={<Checkout />} /></Routes></CartProvider></AuthProvider>\n  );\n}" },
    { path: 'src/context/AuthContext.jsx', content: "import { createContext, useContext, useState, useEffect } from 'react';\nimport api from '../utils/api';\nconst AuthContext = createContext(null);\nexport function AuthProvider({ children }) {\n  const [user, setUser] = useState(null);\n  const [loading, setLoading] = useState(true);\n  useEffect(() => {\n    const token = localStorage.getItem('token');\n    if (token) { api.get('/auth/me').then(r => setUser(r.data)).catch(() => localStorage.removeItem('token')).finally(() => setLoading(false)); }\n    else { setLoading(false); }\n  }, []);\n  const login = async (email, password) => { const res = await api.post('/auth/login', { email, password }); localStorage.setItem('token', res.data.token); setUser(res.data.user); };\n  const logout = () => { localStorage.removeItem('token'); setUser(null); };\n  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;\n}\nexport const useAuth = () => useContext(AuthContext);" },
    { path: 'src/utils/api.js', content: "import axios from 'axios';\nconst api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });\napi.interceptors.request.use(config => { const token = localStorage.getItem('token'); if (token) config.headers.Authorization = `Bearer ${token}`; return config; });\napi.interceptors.response.use(res => res, err => { if (err.response?.status === 401) { localStorage.removeItem('token'); window.location.href = '/login'; } return Promise.reject(err); });\nexport default api;" },
    { path: 'vite.config.js', content: "import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\nexport default defineConfig({ plugins: [react()], server: { port: 3000 } });" },
  ]),

  nextjs: makeSummary('Ingested GitHub Repository: https://github.com/user/blog-platform', 'https://github.com/user/blog-platform', [
    { path: 'package.json', size: 2800 }, { path: 'next.config.js', size: 300 },
    { path: 'tsconfig.json', size: 600 }, { path: 'app/layout.tsx', size: 1200 },
    { path: 'app/page.tsx', size: 1800 }, { path: 'app/globals.css', size: 2600 },
    { path: 'app/blog/[slug]/page.tsx', size: 3400 }, { path: 'app/api/posts/route.ts', size: 2200 },
    { path: 'app/api/auth/[...nextauth]/route.ts', size: 1500 }, { path: 'components/Header.tsx', size: 900 },
    { path: 'components/PostCard.tsx', size: 1400 }, { path: 'components/MarkdownRenderer.tsx', size: 2100 },
    { path: 'lib/db.ts', size: 600 }, { path: 'lib/posts.ts', size: 2500 },
    { path: 'prisma/schema.prisma', size: 1200 },
  ], [
    { path: 'package.json', content: JSON.stringify({ name: 'blog-platform', dependencies: { next: '^14.2.4', react: '^18.3.1', 'next-auth': '^4.24.6', '@prisma/client': '^5.16.0', 'react-markdown': '^9.0.1', 'gray-matter': '^4.0.3' }, devDependencies: { typescript: '^5.5.3', prisma: '^5.16.0', tailwindcss: '^3.4.4' } }) },
    { path: 'app/page.tsx', content: "import { getPosts } from '@/lib/posts';\nimport PostCard from '@/components/PostCard';\nexport default async function Home() { const posts = await getPosts(); return (<div><h1>Blog</h1>{posts.map(p => <PostCard key={p.slug} post={p}/>)}</div>); }" },
    { path: 'app/api/posts/route.ts', content: "import { NextResponse } from 'next/server';\nimport prisma from '@/lib/db';\nexport async function GET() { const posts = await prisma.post.findMany({orderBy:{createdAt:'desc'}}); return NextResponse.json(posts); }" },
    { path: 'prisma/schema.prisma', content: "generator client { provider = 'prisma-client-js' }\ndatasource db { provider = 'postgresql' url = env('DATABASE_URL') }\nmodel User { id String @id @default(cuid()) name String? email String @unique posts Post[] }\nmodel Post { id String @id @default(cuid()) title String slug String @unique content String excerpt String? author User @relation(fields:[authorId],references:[id]) authorId String published Boolean @default(false) createdAt DateTime @default(now()) }" },
  ]),

  ml_python: makeSummary('Ingested GitHub Repository: https://github.com/user/house-price-predictor', 'https://github.com/user/house-price-predictor', [
    { path: 'requirements.txt', size: 300 }, { path: 'setup.py', size: 800 },
    { path: 'src/data/loader.py', size: 2400 }, { path: 'src/data/preprocessor.py', size: 3600 },
    { path: 'src/features/build_features.py', size: 2800 }, { path: 'src/models/train.py', size: 4200 },
    { path: 'src/models/predict.py', size: 1800 }, { path: 'src/models/evaluate.py', size: 2200 },
    { path: 'src/api/app.py', size: 3400 }, { path: 'Dockerfile', size: 600 },
  ], [
    { path: 'requirements.txt', content: "pandas==2.2.2\nnumpy==1.26.4\nscikit-learn==1.5.0\nflask==3.0.3\nxgboost==2.0.3\npydantic==2.7.4\njoblib==1.4.2" },
    { path: 'src/data/preprocessor.py', content: "import pandas as pd\nimport numpy as np\nfrom sklearn.model_selection import train_test_split\nfrom sklearn.preprocessing import StandardScaler, OneHotEncoder\nfrom sklearn.compose import ColumnTransformer\nfrom sklearn.pipeline import Pipeline\n\nclass DataPreprocessor:\n    def __init__(self, target_col='price', test_size=0.2, random_state=42):\n        self.target_col = target_col\n        self.test_size = test_size\n        self.random_state = random_state\n\n    def split(self, df):\n        X = df.drop(columns=[self.target_col])\n        y = df[self.target_col]\n        return train_test_split(X, y, test_size=self.test_size, random_state=self.random_state)\n\n    def build_pipeline(self, numerical_cols, categorical_cols):\n        num_pipeline = Pipeline([('scaler', StandardScaler())])\n        cat_pipeline = Pipeline([('onehot', OneHotEncoder(handle_unknown='ignore'))])\n        return ColumnTransformer([('num', num_pipeline, numerical_cols), ('cat', cat_pipeline, categorical_cols)])" },
    { path: 'src/models/train.py', content: "import joblib\nimport numpy as np\nfrom sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor\nfrom sklearn.linear_model import Ridge\nfrom sklearn.metrics import mean_squared_error, r2_score\nimport xgboost as xgb\n\nclass ModelTrainer:\n    MODELS = {\n        'ridge': Ridge(alpha=1.0),\n        'random_forest': RandomForestRegressor(n_estimators=300, max_depth=20, n_jobs=-1),\n        'xgboost': xgb.XGBRegressor(n_estimators=300, learning_rate=0.03, max_depth=7)\n    }\n    def train_all(self, X_train, y_train, X_val, y_val):\n        for name, model in self.MODELS.items():\n            model.fit(X_train, y_train)\n            preds = model.predict(X_val)\n            rmse = np.sqrt(mean_squared_error(y_val, preds))\n            r2 = r2_score(y_val, preds)\n            print(f'{name}: RMSE={rmse:.2f}, R2={r2:.4f}')\n        return self.MODELS" },
    { path: 'src/api/app.py', content: "from flask import Flask, request, jsonify\nimport joblib\nimport pandas as pd\nfrom pydantic import BaseModel, Field, ValidationError\n\napp = Flask(__name__)\nmodel = joblib.load('models/best_model.pkl')\n\nclass HouseFeatures(BaseModel):\n    bedrooms: int = Field(ge=0, le=50)\n    bathrooms: float = Field(ge=0, le=50)\n    sqft_living: float = Field(ge=100, le=50000)\n    yr_built: int = Field(ge=1800, le=2025)\n\n@app.route('/predict', methods=['POST'])\ndef predict():\n    data = HouseFeatures(**request.json)\n    df = pd.DataFrame([data.model_dump()])\n    prediction = model.predict(df)[0]\n    return jsonify({'predicted_price': round(float(prediction), 2)})\n\nif __name__ == '__main__':\n    app.run(host='0.0.0.0', port=8000)" },
  ]),

  docker: makeSummary('Ingested GitHub Repository: https://github.com/user/microservice-app', 'https://github.com/user/microservice-app', [
    { path: 'docker-compose.yml', size: 3200 }, { path: 'Dockerfile', size: 600 },
    { path: 'api/package.json', size: 1200 }, { path: 'api/src/server.js', size: 3600 },
    { path: 'api/src/routes/users.js', size: 2400 }, { path: 'api/src/routes/orders.js', size: 2800 },
    { path: 'api/src/middleware/auth.js', size: 1200 }, { path: 'worker/src/index.js', size: 2200 },
    { path: 'web/package.json', size: 900 }, { path: 'nginx/nginx.conf', size: 800 },
  ], [
    { path: 'docker-compose.yml', content: "version: '3.8'\nservices:\n  api:\n    build: ./api\n    ports: ['4000:4000']\n    environment: [DATABASE_URL=postgresql://user:pass@postgres:5432/mydb, REDIS_URL=redis://redis:6379]\n    depends_on: [postgres, redis]\n  worker:\n    build: ./worker\n    environment: [REDIS_URL=redis://redis:6379, DATABASE_URL=postgresql://user:pass@postgres:5432/mydb]\n    depends_on: [redis, postgres]\n  web:\n    build: ./web\n    ports: ['3000:3000']\n  nginx:\n    image: nginx:alpine\n    ports: ['80:80']\n    volumes: ['./nginx/nginx.conf:/etc/nginx/nginx.conf']\n    depends_on: [api, web]\n  postgres:\n    image: postgres:16-alpine\n    environment: {POSTGRES_DB: mydb, POSTGRES_USER: user, POSTGRES_PASSWORD: pass}\n  redis:\n    image: redis:7-alpine" },
    { path: 'api/src/server.js', content: "const express = require('express');\nconst cors = require('cors');\nconst helmet = require('helmet');\nconst Redis = require('ioredis');\nconst { Pool } = require('pg');\nconst userRoutes = require('./routes/users');\nconst orderRoutes = require('./routes/orders');\n\nconst app = express();\nconst redis = new Redis(process.env.REDIS_URL);\nconst pool = new Pool({ connectionString: process.env.DATABASE_URL });\n\napp.use(helmet()); app.use(cors()); app.use(express.json());\napp.use((req, res, next) => { req.redis = redis; req.pool = pool; next(); });\napp.use('/api/users', userRoutes);\napp.use('/api/orders', orderRoutes);\napp.get('/health', (req, res) => res.json({ status: 'ok' }));\napp.listen(4000);" },
    { path: 'api/src/routes/orders.js', content: "const { Router } = require('express');\nconst router = Router();\nrouter.get('/', async (req, res) => {\n  const { rows } = await req.pool.query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 50');\n  res.json({ orders: rows });\n});\nrouter.post('/', async (req, res) => {\n  const { userId, items, total } = req.body;\n  const { rows } = await req.pool.query('INSERT INTO orders (user_id, items, total, status) VALUES ($1, $2, $3, $4) RETURNING *', [userId, JSON.stringify(items), total, 'pending']);\n  res.status(201).json(rows[0]);\n});\nmodule.exports = router;" },
  ]),

  portfolio: makeSummary('Ingested Local Project: my-portfolio', '', [
    { path: 'index.html', size: 3400 }, { path: 'css/style.css', size: 5600 },
    { path: 'js/main.js', size: 2800 }, { path: 'js/projects.js', size: 1800 },
  ], [
    { path: 'index.html', content: "<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'><title>John Doe - Developer</title><link rel='stylesheet' href='css/style.css'></head><body><header><nav><a href='#home'>Home</a><a href='#projects'>Projects</a><a href='#skills'>Skills</a><a href='#contact'>Contact</a></nav></header><section id='home'><h1>John Doe</h1><p>Full Stack Developer</p></section><section id='projects'><h2>Projects</h2><div id='project-list'></div></section><section id='skills'><ul><li>JavaScript</li><li>React</li><li>Node.js</li></ul></section><section id='contact'><form><input type='email'><textarea></textarea><button>Send</button></form></section><script src='js/main.js'></script></body></html>" },
    { path: 'js/main.js', content: "document.addEventListener('DOMContentLoaded', () => {\n  document.querySelectorAll('nav a').forEach(anchor => {\n    anchor.addEventListener('click', function(e) {\n      e.preventDefault();\n      const target = document.querySelector(this.getAttribute('href'));\n      if (target) target.scrollIntoView({ behavior: 'smooth' });\n    });\n  });\n  document.getElementById('contact-form')?.addEventListener('submit', async (e) => {\n    e.preventDefault();\n    alert('Thank you!');\n  });\n});" },
  ]),
};

// ── Main ──

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   Sprint 2 Verification Suite               ║');
  console.log('║   Two-Stage Architecture Review + Questions  ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`Started: ${new Date().toISOString()}\n`);

  // ── Section 1: JSON extraction (same as Sprint 1) ──
  console.log('=== SECTION 1: JSON Extraction (Brace-Depth) ===\n');
  // Quick ref tests
  try { extractJsonBraceDepth('{"a":1}'); tally(true, 'extract: well-formed JSON'); } catch { tally(false, 'extract: well-formed JSON'); }
  try { extractJsonBraceDepth('```json\n{"a":1}\n```'); tally(true, 'extract: markdown fenced'); } catch { tally(false, 'extract: markdown fenced'); }
  try { extractJsonBraceDepth('{"a":{"b":{"c":3}}}'); tally(true, 'extract: nested'); } catch { tally(false, 'extract: nested'); }
  try { extractJsonBraceDepth('{"a":1,}'); tally(true, 'extract: trailing comma'); } catch { tally(false, 'extract: trailing comma'); }
  try { extractJsonBraceDepth(''); tally(false, 'extract: empty — correctly rejected'); } catch { tally(true, 'extract: empty — correctly rejected'); }
  try { extractJsonBraceDepth('{"a":{"b":3}'); tally(false, 'extract: truncated — correctly rejected'); } catch { tally(true, 'extract: truncated — correctly rejected'); }

  // ── Section 2: Per-stage AI tests ──
  console.log(`\n${'='.repeat(60)}`);
  console.log('SECTION 2: Two-Stage AI Pipeline (5 project types)');
  console.log(`${'='.repeat(60)}`);

  // Reset global metrics
  if (global.aiMetrics) global.aiMetrics = { geminiRequests: 0, groqRequests: 0, geminiFallbacks: 0, totalRequests: 0 };

  const apiKey = process.env.AI_API_KEY;
  const inferProvider = (key) => {
    if (!key) return 'unknown';
    if (key.startsWith('gsk_')) return 'groq';
    if (key.startsWith('AIza')) return 'gemini';
    return 'unknown';
  };
  const provider = inferProvider(apiKey);
  const model = provider === 'groq' ? 'llama-3.3-70b-versatile' : provider === 'gemini' ? 'gemini-2.5-flash' : 'unknown';

  // Sprint 1 comparative metrics (from previous run)
  const sprint1Metrics = {
    totalLatency: 0,
    totalResponseSize: 0,
    successCount: 0,
  };

  const projectEntries = Object.entries(projects);
  let idx = 0;

  for (const [name, data] of projectEntries) {
    if (idx > 0) {
      const delay = 30000;
      console.log(`  Waiting ${delay/1000}s before next project...`);
      await sleep(delay);
    }

    console.log(`\n>>> Testing ${name}...`);
    const result = {
      project: name,
      stage1: { status: null, latency: 0, responseSize: 0, retries: 0, parseFailures: 0, promptSize: 0 },
      stage2: { status: null, latency: 0, responseSize: 0, retries: 0, parseFailures: 0, promptSize: 0 },
      combined: { status: null, latency: 0, responseSize: 0 },
      technologiesDetected: null,
      complexityLevel: null,
      complexityScore: null,
      questionCount: 0,
      provider,
      model,
    };

    try {
      result.stage1.promptSize = data.projectSummaryText.length;

      // Stage 1: Architecture Review
      const t1Start = Date.now();
      let stage1Retries = 0;
      let stage1Result;
      try {
        stage1Result = await generateArchitectureReview({
          projectSummaryText: data.projectSummaryText,
          repoUrl: data.repoUrl,
          apiKey, provider, model,
          timeoutMs: 25000,
        });
      } catch (err) {
        // Parse retry count from console output
        stage1Retries = err.message.includes('retry') ? 2 : (err.message.includes('attempt') ? 1 : 0);
        throw err;
      }
      result.stage1.latency = Date.now() - t1Start;
      result.stage1.responseSize = JSON.stringify(stage1Result).length;
      result.stage1.status = 'success';
      result.stage1.retries = stage1Retries;

      const hasArch = !!(stage1Result.architectureReport?.structure);
      tally(hasArch, `s2-stage1: ${name} arch report`, `latency: ${result.stage1.latency}ms, size: ${result.stage1.responseSize}b`);

      if (!hasArch) {
        result.stage1.status = 'failure';
        result.combined.status = 'failure';
        result.combined.latency = Date.now() - t1Start;
        throw new Error('Stage 1: architectureReport missing');
      }

      result.technologiesDetected = (stage1Result.detectedTechnologies || []).slice(0, 8);
      result.complexityLevel = stage1Result.projectComplexity?.level;
      result.complexityScore = stage1Result.projectComplexity?.score;

      // Delay between Stage 1 and Stage 2 to avoid rate limiting
      await sleep(6000);

      // Stage 2: Question Generation
      const t2Start = Date.now();
      let questionsResult;
      try {
        questionsResult = await generateDefenseQuestions({
          projectSummaryText: data.projectSummaryText,
          repoUrl: data.repoUrl,
          architectureReview: stage1Result.architectureReport,
          detectedTechnologies: stage1Result.detectedTechnologies,
          apiKey, provider, model,
          timeoutMs: 25000,
        });
      } catch (err) {
        throw err;
      }
      result.stage2.latency = Date.now() - t2Start;
      result.stage2.responseSize = JSON.stringify(questionsResult).length;
      result.stage2.status = 'success';
      result.stage2.promptSize = data.projectSummaryText.length;

      const hasQuestions = !!(questionsResult.topQuestions?.length);
      result.questionCount = questionsResult.topQuestions?.length || 0;
      tally(hasQuestions, `s2-stage2: ${name} questions`, `latency: ${result.stage2.latency}ms, size: ${result.stage2.responseSize}b, questions: ${result.questionCount}`);

      // Combined
      const combinedObj = { ...stage1Result, ...questionsResult };
      result.combined.responseSize = JSON.stringify(combinedObj).length;
      result.combined.status = 'success';

      console.log(`  Technologies: ${result.technologiesDetected.join(', ')}`);
      console.log(`  Complexity: ${result.complexityLevel} (${result.complexityScore})`);
      console.log(`  Questions: ${result.questionCount}`);
      console.log(`  Stage 1: ${result.stage1.latency}ms | Stage 2: ${result.stage2.latency}ms | Total: ${result.stage1.latency + result.stage2.latency}ms`);

      const totalOk = result.stage1.status === 'success' && result.stage2.status === 'success';
      tally(totalOk, `s2-combined: ${name}`, `total latency: ${result.stage1.latency + result.stage2.latency}ms, response: ${result.combined.responseSize}b`);

    } catch (e) {
      result.combined.status = 'failure';
      result.combined.latency = result.stage1.latency + result.stage2.latency;
      result.combined.responseSize = 0;
      result.stage1.status = result.stage1.status || 'failure';
      result.stage2.status = result.stage2.status || 'failure';
      tally(false, `s2-combined: ${name}`, `error: ${e.message}`);
    }

    idx++;
  }

  // ── Section 3: Metrics and comparison ──
  console.log(`\n${'='.repeat(60)}`);
  console.log('SECTION 3: Backward Compatibility — analyzeProjectSummary');
  console.log(`${'='.repeat(60)}`);

  // Reset metrics for combined call test
  if (global.aiMetrics) global.aiMetrics = { geminiRequests: 0, groqRequests: 0, geminiFallbacks: 0, totalRequests: 0 };

  // Test combined API on one project (react)
  console.log('  Testing combined analyzeProjectSummary on react project...');
  try {
    const reactData = projects.react;
    const tStart = Date.now();
    const combined = await analyzeProjectSummary(reactData);
    const combinedLatency = Date.now() - tStart;
    const combinedSize = JSON.stringify(combined).length;

    const shapeOk = !!combined.architectureReport && !!combined.detectedTechnologies && !!combined.detectedFeatures &&
                    !!combined.potentialWeakAreas && !!combined.projectComplexity &&
                    Array.isArray(combined.topQuestions) && combined.topQuestions.length > 0 &&
                    typeof combined.starterDefenseQuestion === 'string';
    tally(shapeOk, 's2-backward-compat: output shape matches original',
      `latency: ${combinedLatency}ms, size: ${combinedSize}b, questions: ${combined.topQuestions.length}`);

    if (combined.architectureReport) {
      const archShape = !!combined.architectureReport.structure && !!combined.architectureReport.libraries &&
                        !!combined.architectureReport.frameworks && !!combined.architectureReport.components &&
                        !!combined.architectureReport.apis;
      tally(archShape, 's2-backward-compat: architectureReport shape',
        `fields: ${Object.keys(combined.architectureReport).join(', ')}`);
    }
  } catch (e) {
    tally(false, 's2-backward-compat: combined call', `error: ${e.message}`);
  }

  // ── Section 4: Final metrics ──
  console.log(`\n${'='.repeat(60)}`);
  console.log('SECTION 4: Metrics Summary');
  console.log(`${'='.repeat(60)}`);

  const metrics = global.aiMetrics || {};
  console.log(`  Provider: ${provider}`);
  console.log(`  Model: ${model}`);
  console.log(`  Gemini requests: ${metrics.geminiRequests || 0}`);
  console.log(`  Groq requests: ${metrics.groqRequests || 0}`);
  console.log(`  Gemini fallbacks: ${metrics.geminiFallbacks || 0}`);
  console.log(`  Total AI calls: ${metrics.totalRequests || 0}`);

  // ── FINAL REPORT ──
  report();

  console.log(`\n${'='.repeat(60)}`);
  if (FAIL === 0) {
    console.log('SPRINT 2 VERIFIED — All tests passed');
  } else {
    console.log(`SPRINT 2 — ${FAIL} test(s) failed`);
  }
  console.log(`${'='.repeat(60)}`);
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
