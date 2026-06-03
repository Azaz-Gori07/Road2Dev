const IGNORE_PATTERNS = [
  /node_modules/i,
  /(^|\/)dist(\/|$)/i,
  /(^|\/)build(\/|$)/i,
  /(^|\/)coverage(\/|$)/i,
  /(^|\/)assets(\/|$)/i,
  /\.git(\/|$)/i,
  /package-lock\.json/i,
  /yarn\.lock/i,
  /pnpm-lock\.yaml/i,
  /bun\.lockb/i,
  /\.(png|jpe?g|gif|svg|webp|woff2?|eot|ttf|mp3|mp4|webm|zip|tar\.gz|ico|map|pdf|exe|dll|bin|wasm)$/i
];

const TEXT_EXTENSIONS = /\.(jsx?|tsx?|mjs|cjs|json|md|mdx|css|scss|sass|less|html?|vue|svelte|yml|yaml|toml|env\.example|prisma|graphql|sql)$/i;

const MAX_FILES = 150;
const MAX_FILE_BYTES = 120000;
const MAX_CONTENT_BYTES = 48000;

export const isIgnoredProjectPath = (path) => IGNORE_PATTERNS.some((re) => re.test(path));

const shouldReadContent = (path) =>
  TEXT_EXTENSIONS.test(path) ||
  path.endsWith('package.json') ||
  path.endsWith('README.md') ||
  path.endsWith('.env.example');

const readFileAsText = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result || '');
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });

const normalizePath = (rawPath) => rawPath.replace(/\\/g, '/').replace(/^\/+/, '');

/**
 * Recursively collect files from a FileSystemDirectoryHandle (Chromium).
 */
async function collectFromDirectoryHandle(dirHandle, basePath = '', onProgress) {
  const collected = [];
  for await (const [name, handle] of dirHandle.entries()) {
    const relPath = basePath ? `${basePath}/${name}` : name;
    if (isIgnoredProjectPath(relPath)) continue;

    if (handle.kind === 'directory') {
      if (collected.length >= MAX_FILES) break;
      const nested = await collectFromDirectoryHandle(handle, relPath, onProgress);
      collected.push(...nested);
    } else if (handle.kind === 'file') {
      if (collected.length >= MAX_FILES) break;
      try {
        const file = await handle.getFile();
        if (file.size > MAX_FILE_BYTES) {
          collected.push({ path: relPath, size: file.size });
          onProgress?.({ count: collected.length, path: relPath });
          continue;
        }
        const entry = { path: relPath, size: file.size };
        if (shouldReadContent(relPath) && file.size <= MAX_CONTENT_BYTES) {
          entry.content = await readFileAsText(file);
        }
        collected.push(entry);
        onProgress?.({ count: collected.length, path: relPath });
      } catch {
        /* skip unreadable */
      }
    }
  }
  return collected;
}

/**
 * Pick a local project folder via File System Access API or webkitdirectory fallback.
 * @returns {{ files: Array<{path, size?, content?}>, projectName: string }}
 */
export async function pickLocalProjectFolder({ onProgress } = {}) {
  if (typeof window.showDirectoryPicker === 'function') {
    const dirHandle = await window.showDirectoryPicker({ mode: 'read' });
    const projectName = dirHandle.name;
    const files = await collectFromDirectoryHandle(dirHandle, '', onProgress);
    return { files, projectName };
  }

  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.webkitdirectory = true;
    input.multiple = true;
    input.style.display = 'none';
    document.body.appendChild(input);

    input.onchange = async () => {
      try {
        const fileList = Array.from(input.files || []);
        document.body.removeChild(input);
        if (!fileList.length) {
          reject(new Error('No folder selected'));
          return;
        }

        const rootSegment = normalizePath(fileList[0].webkitRelativePath).split('/')[0];
        const files = [];

        for (const file of fileList) {
          if (files.length >= MAX_FILES) break;
          const relPath = normalizePath(file.webkitRelativePath);
          if (isIgnoredProjectPath(relPath)) continue;
          if (file.size > MAX_FILE_BYTES) {
            files.push({ path: relPath, size: file.size });
            continue;
          }
          const entry = { path: relPath, size: file.size };
          if (shouldReadContent(relPath) && file.size <= MAX_CONTENT_BYTES) {
            entry.content = await readFileAsText(file);
          }
          files.push(entry);
          onProgress?.({ count: files.length, path: relPath });
        }

        resolve({ files, projectName: rootSegment || 'Local Project' });
      } catch (err) {
        document.body.removeChild(input);
        reject(err);
      }
    };

    input.oncancel = () => {
      document.body.removeChild(input);
      reject(new Error('Folder selection cancelled'));
    };

    input.click();
  });
}

export const supportsDirectoryPicker = () =>
  typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';
