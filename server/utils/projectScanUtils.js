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
  '.env.example'
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

export { KEY_CONFIG_FILES, TEXT_EXTENSIONS };
