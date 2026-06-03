/** Default scan lines shown while waiting on GitHub / server analysis */
export const DEFAULT_SCAN_LINES = [
  'Scanning package.json...',
  'Scanning src/components...',
  'Scanning routes...',
  'Scanning services...',
  'Compressing architecture context...',
  'Generating analysis report...'
];

/** Map a file path to a human-readable scan line */
export function pathToScanLine(filePath) {
  const p = (filePath || '').replace(/\\/g, '/');
  const base = p.split('/').pop() || p;
  if (base === 'package.json') return 'Scanning package.json...';
  if (/routes?\//i.test(p) || /\/routes?\./i.test(p)) return `Scanning routes (${base})...`;
  if (/services?\//i.test(p) || /\/services?\./i.test(p)) return `Scanning services (${base})...`;
  if (/components?\//i.test(p)) return `Scanning components (${base})...`;
  if (/controllers?\//i.test(p)) return `Scanning controllers (${base})...`;
  if (/models?\//i.test(p)) return `Scanning models (${base})...`;
  if (/middleware/i.test(p)) return `Scanning middleware (${base})...`;
  return `Scanning ${p.length > 48 ? `…/${base}` : p}...`;
}

/** Build ordered unique scan lines from discovered file paths */
export function buildScanLinesFromPaths(paths = [], maxLines = 12) {
  const priority = [
    (p) => p.endsWith('package.json'),
    (p) => /tsconfig/i.test(p),
    (p) => /vite\.config/i.test(p),
    (p) => /routes?\//i.test(p),
    (p) => /services?\//i.test(p),
    (p) => /components?\//i.test(p),
    (p) => /controllers?\//i.test(p)
  ];

  const sorted = [...paths].sort((a, b) => {
    const score = (path) => {
      const idx = priority.findIndex((fn) => fn(path));
      return idx === -1 ? 99 : idx;
    };
    return score(a) - score(b);
  });

  const lines = [];
  const seen = new Set();
  for (const path of sorted) {
    const line = pathToScanLine(path);
    if (seen.has(line)) continue;
    seen.add(line);
    lines.push(line);
    if (lines.length >= maxLines) break;
  }

  lines.push('Generating analysis report...');
  return lines;
}

export function isProjectScanned(projectContext) {
  if (!projectContext) return false;
  if (projectContext.scanComplete === true) return true;
  const files = projectContext.scanStats?.filesScanned ?? 0;
  return files > 0 && Boolean(projectContext.architectureReport);
}
