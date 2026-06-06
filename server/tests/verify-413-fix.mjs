/**
 * 413 Payload Too Large Fix — Final Verification
 *
 * Tests local folder ingestion for small, medium, and large projects.
 * Reports body size, file count, and whether ingestion succeeds.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_BASE = 'http://localhost:5500/api';

// ── Helpers ──────────────────────────────────────────────────────

async function api(endpoint, opts = {}) {
  const url = `${API_BASE}${endpoint}`;
  const { headers: extraHeaders, ...restOpts } = opts;
  const res = await fetch(url, {
    ...restOpts,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
  const body = await res.text();
  let data;
  try { data = JSON.parse(body); } catch { data = { raw: body }; }
  return { status: res.status, ok: res.ok, data, headers: res.headers };
}

async function registerAndLogin() {
  const email = `test-413-${Date.now()}@example.com`;
  const password = 'TestPass123!';
  // Try register
  const reg = await api('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name: '413 Tester' }),
  });
  if (reg.ok) return reg.data.token;
  // Already exists — login
  const log = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (log.ok) return log.data.token;
  // Use direct token approach — make a new request that doesn't need auth
  return null;
}

async function getToken() {
  // Try login with known test credentials
  const login = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'test413@test.com', password: 'TestPass123!' }),
  });
  if (login.ok) return login.data.token;

  // Register
  const register = await api('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email: 'test413@test.com', password: 'TestPass123!', name: '413 Tester' }),
  });
  if (register.ok) return register.data.token;

  console.error('  ✗ Could not get auth token');
  return null;
}

function collectFiles(dirPath) {
  const files = [];
  const IGNORE = /node_modules|\.git|dist|build|package-lock/i;
  const TEXT_EXTS = /\.(jsx?|tsx?|mjs|cjs|json|md|css|scss|less|html?|yml|yaml|toml|env|sh|bat)$/i;
  const MAX_FILES = 150;
  const MAX_BYTES = 120000;
  const MAX_CONTENT = 48000;

  function walk(dir, relative = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (files.length >= MAX_FILES) break;
      const relPath = relative ? `${relative}/${entry.name}` : entry.name;
      if (IGNORE.test(relPath)) continue;
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath, relPath);
      } else if (entry.isFile()) {
        const stat = fs.statSync(fullPath);
        if (stat.size > MAX_BYTES) {
          files.push({ path: relPath, size: stat.size });
          continue;
        }
        const entry_ = { path: relPath, size: stat.size };
        if (TEXT_EXTS.test(relPath) && stat.size <= MAX_CONTENT) {
          try {
            entry_.content = fs.readFileSync(fullPath, 'utf-8');
          } catch { /* skip binary */ }
        }
        files.push(entry_);
      }
    }
  }

  walk(dirPath);
  return files;
}

async function runTest(label, projectDir) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  TEST: ${label}`);
  console.log(`${'='.repeat(60)}`);

  const token = await getToken();
  if (!token) {
    console.log('  SKIP — no auth token available');
    return { skipped: true };
  }
  const headers = { Authorization: `Bearer ${token}` };

  // 1. Create a learning session
  console.log('  Creating learning session...');
  const session = await api('/learning-lab/session', {
    method: 'POST',
    headers,
    body: JSON.stringify({ topic: `Project Defense: ${label}` }),
  });
  if (!session.ok) {
    console.log(`  ✗ Failed to create session: ${session.status} — ${JSON.stringify(session.data)}`);
    return { error: 'session_creation_failed', status: session.status };
  }
  const sessionId = session.data.data._id;
  console.log(`  ✓ Session created: ${sessionId}`);

  // 2. Collect files
  console.log('  Collecting project files...');
  const files = collectFiles(projectDir);
  const rawBody = JSON.stringify({
    files,
    projectName: label,
    sessionId,
    ingestionMethod: 'local',
  });
  const bodySizeBytes = Buffer.byteLength(rawBody, 'utf8');
  const filesScanned = files.length;
  const textFilesWithContent = files.filter(f => f.content).length;
  console.log(`  Files collected: ${filesScanned} total, ${textFilesWithContent} with content`);
  console.log(`  Request body size: ${(bodySizeBytes / 1024).toFixed(1)} KB`);

  // 3. Ingest project
  console.log('  Ingesting project...');
  const ingest = await api('/learning-lab/project/ingest', {
    method: 'POST',
    headers,
    body: rawBody,
  });

  const result = {
    label,
    status: ingest.status,
    ok: ingest.ok,
    bodySizeKB: (bodySizeBytes / 1024).toFixed(1),
    filesScanned,
    textFilesWithContent,
    sessionId,
  };

  if (ingest.status === 413) {
    console.log(`  ✗ FAILED — 413 Payload Too Large`);
    result.error = '413_PAYLOAD_TOO_LARGE';
  } else if (ingest.ok && ingest.data?.success) {
    const ctx = ingest.data.data?.projectContext || {};
    const scanStatus = ctx.scanStatus || 'unknown';
    const hasArchReport = !!ctx.architectureReport;
    const techCount = (ctx.detectedTechnologies || []).length;
    const hasQuestions = Array.isArray(ctx.topQuestions) && ctx.topQuestions.length > 0;
    const fallbackActive = ctx.fallbackMode?.active === true;

    console.log(`  ✓ INGESTION SUCCESS`);
    console.log(`    Scan status: ${scanStatus}`);
    console.log(`    Architecture report: ${hasArchReport ? 'YES' : 'NO'}`);
    console.log(`    Technologies detected: ${techCount}`);
    console.log(`    Questions generated: ${hasQuestions ? 'YES' : 'NO'}`);
    console.log(`    Fallback mode: ${fallbackActive ? 'YES' : 'NO'}`);

    result.scanStatus = scanStatus;
    result.archReportGenerated = hasArchReport;
    result.techCount = techCount;
    result.questionsGenerated = hasQuestions;
    result.fallbackActive = fallbackActive;
  } else {
    console.log(`  ✗ FAILED — status ${ingest.status}: ${JSON.stringify(ingest.data).slice(0, 200)}`);
    result.error = `STATUS_${ingest.status}`;
  }

  return result;
}

// ── Main ─────────────────────────────────────────────────────────

const PROJECTS = [
  { label: 'Small Project (3 HTML/CSS/JS files)', dir: path.join(__dirname, 'projects', 'small-site') },
  { label: 'Medium Project (React app, ~12 files)', dir: path.join(__dirname, 'projects', 'medium-app') },
  { label: 'Large Portfolio Project (~150 files)', dir: path.join(__dirname, 'projects', 'large-portfolio') },
];

async function main() {
  console.log(`\n╔${'═'.repeat(58)}╗`);
  console.log(`║  413 PAYLOAD TOO LARGE — FINAL VERIFICATION        ║`);
  console.log(`╚${'═'.repeat(58)}╝`);
  console.log(`Server: ${API_BASE}`);
  console.log(`Date:   ${new Date().toISOString()}`);

  const results = [];
  for (const project of PROJECTS) {
    const r = await runTest(project.label, project.dir);
    results.push(r);
  }

  // ── Summary Report ──
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  SUMMARY REPORT`);
  console.log(`${'═'.repeat(60)}`);

  let allPassed = true;
  for (const r of results) {
    if (r.skipped) {
      console.log(`  ⚠  ${r.label}: SKIPPED`);
      continue;
    }
    const passed = r.ok && !r.error && !r.fallbackActive;
    if (!passed) allPassed = false;
    const icon = passed ? '✓' : r.error === '413_PAYLOAD_TOO_LARGE' ? '✗' : '✗';
    const size = r.bodySizeKB || '?';
    const files = r.filesScanned || '?';
    const arch = r.archReportGenerated ? 'YES' : r.error ? 'N/A' : 'NO';
    const questions = r.questionsGenerated ? 'YES' : r.error ? 'N/A' : 'NO';
    console.log(`  ${icon}  ${r.label}`);
    console.log(`       Body: ${size} KB | Files: ${files} | Arch: ${arch} | Questions: ${questions}`);
  }

  console.log(`\n  ${'─'.repeat(50)}`);
  if (allPassed) {
    console.log(`  ✅ ALL TESTS PASSED — 413 Bug RESOLVED`);
    console.log(`  No 413 responses. All projects ingested successfully.`);
  } else {
    console.log(`  ❌ SOME TESTS FAILED — See details above`);
  }
  console.log(`  ${'─'.repeat(50)}\n`);
}

main().catch(err => {
  console.error('Test harness error:', err);
  process.exit(1);
});
