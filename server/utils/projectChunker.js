/**
 * Deterministic Project Chunker (Token Budget Based)
 * Groups files into subchunks using token-budgets instead of file counts.
 */

export const estimateTokens = (text) => {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
};

export const attemptLogicalSegmentation = (filePath, content) => {
  if (!content) return null;
  const normalizedPath = filePath.toLowerCase().replace(/\\/g, '/');
  
  // Exclude third-party library files or test files from logical segmentation if they don't fit the roles
  const isReact = normalizedPath.includes('/components/') || normalizedPath.endsWith('.jsx') || normalizedPath.endsWith('.tsx');
  const isController = normalizedPath.includes('/controllers/') || normalizedPath.includes('/routes/') || normalizedPath.endsWith('controller.js') || normalizedPath.endsWith('controller.ts');
  const isService = normalizedPath.includes('/services/') || normalizedPath.endsWith('service.js') || normalizedPath.endsWith('service.ts');

  if (!isReact && !isController && !isService) {
    return null; // Logical splitting fails/not applicable
  }

  const lines = content.split('\n');
  const segments = [];
  
  if (isReact) {
    let currentSegment = [];
    let stage = 'Imports';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      if (stage === 'Imports') {
        if (
          trimmed.includes('const [') || 
          trimmed.includes('useState') || 
          trimmed.includes('useEffect') ||
          trimmed.includes('useRef') ||
          trimmed.includes('useMemo') ||
          trimmed.includes('useCallback') ||
          (trimmed.startsWith('const ') && (trimmed.includes('=>') || trimmed.includes('function'))) ||
          trimmed.startsWith('function ') ||
          trimmed.startsWith('export ')
        ) {
          if (currentSegment.length > 0) {
            segments.push({ name: 'Imports', lines: currentSegment });
            currentSegment = [];
          }
          stage = 'Hooks & State';
        }
      } else if (stage === 'Hooks & State') {
        if (
          trimmed.startsWith('const handle') || 
          trimmed.startsWith('const on') || 
          trimmed.startsWith('const submit') ||
          trimmed.startsWith('function handle') ||
          trimmed.startsWith('async ') ||
          trimmed.includes('.then') ||
          trimmed.includes('await ')
        ) {
          if (currentSegment.length > 0) {
            segments.push({ name: 'Hooks & State', lines: currentSegment });
            currentSegment = [];
          }
          stage = 'Business Logic';
        }
      } else if (stage === 'Business Logic') {
        if (trimmed.startsWith('return (') || trimmed.startsWith('return <') || (trimmed.startsWith('return') && trimmed.includes('<'))) {
          if (currentSegment.length > 0) {
            segments.push({ name: 'Business Logic', lines: currentSegment });
            currentSegment = [];
          }
          stage = 'Render & JSX';
        }
      }
      
      currentSegment.push(line);
    }
    
    if (currentSegment.length > 0) {
      segments.push({ name: stage, lines: currentSegment });
    }
  } else if (isController) {
    let currentSegment = [];
    let stage = 'Imports';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      if (stage === 'Imports') {
        if (trimmed.includes('validation') || trimmed.includes('schema') || trimmed.includes('body(') || trimmed.includes('check(')) {
          if (currentSegment.length > 0) {
            segments.push({ name: 'Imports', lines: currentSegment });
            currentSegment = [];
          }
          stage = 'Validation & Schemas';
        } else if (trimmed.includes('req, res') || trimmed.includes('async (') || trimmed.startsWith('exports.') || trimmed.includes('Controller')) {
          if (currentSegment.length > 0) {
            segments.push({ name: 'Imports', lines: currentSegment });
            currentSegment = [];
          }
          stage = 'Controller Methods';
        }
      } else if (stage === 'Validation & Schemas') {
        if (trimmed.includes('req, res') || trimmed.includes('async (') || trimmed.startsWith('exports.') || trimmed.includes('Controller')) {
          if (currentSegment.length > 0) {
            segments.push({ name: 'Validation & Schemas', lines: currentSegment });
            currentSegment = [];
          }
          stage = 'Controller Methods';
        }
      } else if (stage === 'Controller Methods') {
        if (trimmed.startsWith('const helper') || (trimmed.startsWith('function ') && !trimmed.includes('req, res'))) {
          if (currentSegment.length > 0) {
            segments.push({ name: 'Controller Methods', lines: currentSegment });
            currentSegment = [];
          }
          stage = 'Helper Functions';
        }
      }
      currentSegment.push(line);
    }
    
    if (currentSegment.length > 0) {
      segments.push({ name: stage, lines: currentSegment });
    }
  } else if (isService) {
    let currentSegment = [];
    let stage = 'Configuration';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      if (stage === 'Configuration') {
        if (trimmed.startsWith('class ') || trimmed.startsWith('export const ') || (trimmed.startsWith('const ') && (trimmed.includes('=>') || trimmed.includes('function'))) || trimmed.startsWith('function ')) {
          if (currentSegment.length > 0) {
            segments.push({ name: 'Configuration', lines: currentSegment });
            currentSegment = [];
          }
          stage = 'Core Logic';
        }
      } else if (stage === 'Core Logic') {
        if (trimmed.startsWith('const format') || trimmed.startsWith('const parse') || (trimmed.startsWith('function ') && trimmed.length < 50)) {
          if (currentSegment.length > 0) {
            segments.push({ name: 'Core Logic', lines: currentSegment });
            currentSegment = [];
          }
          stage = 'Utilities';
        }
      }
      currentSegment.push(line);
    }
    
    if (currentSegment.length > 0) {
      segments.push({ name: stage, lines: currentSegment });
    }
  }

  const validSegments = segments.filter(seg => seg.lines.length > 0);

  // If logical segmentation resulted in a single segment or a segment is too large (> 8000 characters / 2000 tokens), fallback to line ranges
  if (validSegments.length <= 1) {
    return null;
  }
  for (const seg of validSegments) {
    const text = seg.lines.join('\n');
    if (text.length > 8000) {
      return null;
    }
  }

  return validSegments;
};

export const chunkProjectFiles = (files = [], fileContents = []) => {
  const fileList = Array.isArray(files) ? files : [];
  
  // 1. Identify large files and split them logically/line-by-line
  const processedFiles = [];
  
  fileList.forEach(file => {
    // Check if content is cached
    const fc = fileContents.find(c => c.path === file.path);
    const content = fc ? fc.content : file.content;
    const size = file.size || (content ? content.length : 0);
    const charCount = content ? content.length : size;
    const linesCount = content ? content.split('\n').length : Math.ceil(size / 40);
    
    // Large file threshold: > 1000 lines or > 15000 characters
    const isLarge = linesCount > 1000 || charCount > 15000;
    
    if (isLarge && content) {
      // Try logical segmentation first
      const logicalSegments = attemptLogicalSegmentation(file.path, content);
      
      if (logicalSegments && logicalSegments.length > 0) {
        let startLine = 1;
        logicalSegments.forEach((seg) => {
          const segContent = seg.lines.join('\n');
          const segmentPath = `${file.path} [Logical: ${seg.name}]`;
          const segmentSize = segContent.length;
          const segLineCount = seg.lines.length;
          const endLine = startLine + segLineCount - 1;
          
          if (!fileContents.some(c => c.path === segmentPath)) {
            fileContents.push({
              path: segmentPath,
              content: segContent
            });
          }
          
          processedFiles.push({
            path: segmentPath,
            size: segmentSize,
            content: segContent,
            largeFile: true,
            virtual: true,
            originalPath: file.path,
            lineRange: { start: startLine, end: endLine }
          });
          
          startLine = endLine + 1;
        });
      } else {
        // Fallback to dynamic line range splitting to guarantee each chunk is within target budget (< 8000 characters / 2000 tokens)
        const lines = content.split('\n');
        const parts = [];
        let currentPartLines = [];
        let currentPartChars = 0;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (currentPartLines.length > 0 && (currentPartChars + line.length + 1 > 8000 || currentPartLines.length >= 200)) {
            parts.push(currentPartLines.join('\n'));
            currentPartLines = [];
            currentPartChars = 0;
          }
          currentPartLines.push(line);
          currentPartChars += line.length + 1;
        }
        if (currentPartLines.length > 0) {
          parts.push(currentPartLines.join('\n'));
        }
        
        const totalParts = parts.length;
        let startLine = 1;
        parts.forEach((partContent, index) => {
          const partNum = index + 1;
          const segmentPath = `${file.path} [Part ${partNum} of ${totalParts}]`;
          const segmentSize = partContent.length;
          const partLineCount = partContent.split('\n').length;
          const endLine = startLine + partLineCount - 1;
          
          if (!fileContents.some(c => c.path === segmentPath)) {
            fileContents.push({
              path: segmentPath,
              content: partContent
            });
          }
          
          processedFiles.push({
            path: segmentPath,
            size: segmentSize,
            content: partContent,
            largeFile: true,
            virtual: true,
            originalPath: file.path,
            lineRange: { start: startLine, end: endLine }
          });
          
          startLine = endLine + 1;
        });
      }
    } else {
      processedFiles.push({
        ...file,
        content
      });
    }
  });

  // Group files into raw groups by directory structure
  const rawGroups = {};

  processedFiles.forEach((file) => {
    const origPath = file.path || '';
    const path = origPath.replace(/\\/g, '/');
    const parts = path.split('/');

    let moduleName = 'Other';
    let subchunkName = 'General';

    if (parts.length === 1) {
      moduleName = 'Configuration & Setup';
      subchunkName = 'Project Roots';
    } else {
      const first = parts[0].toLowerCase();
      
      if (first === 'server' || first === 'backend' || first === 'api') {
        moduleName = 'Backend Server';
        if (parts.length > 2) {
          const second = parts[1].toLowerCase();
          subchunkName = second.charAt(0).toUpperCase() + second.slice(1);
        } else {
          subchunkName = 'Server Setup';
        }
      } else if (first === 'client' || first === 'frontend' || first === 'ui') {
        moduleName = 'Frontend UI';
        const fullPathLower = path.toLowerCase();
        if (fullPathLower.includes('/components/')) {
          const compIdx = parts.indexOf('components');
          if (compIdx !== -1 && parts.length > compIdx + 2) {
            subchunkName = `UI Component - ${parts[compIdx + 1].charAt(0).toUpperCase() + parts[compIdx + 1].slice(1)}`;
          } else {
            subchunkName = 'UI Components';
          }
        } else if (fullPathLower.includes('/pages/') || fullPathLower.includes('/app/') || fullPathLower.includes('/screens/')) {
          subchunkName = 'Pages & Routing';
        } else if (fullPathLower.includes('/utils/') || fullPathLower.includes('/services/') || fullPathLower.includes('/helpers/')) {
          subchunkName = 'Frontend Services';
        } else if (fullPathLower.includes('/context/') || fullPathLower.includes('/store/')) {
          subchunkName = 'State & Context';
        } else {
          subchunkName = 'Client Config';
        }
      } else if (first === 'src') {
        moduleName = 'Source Code';
        const second = parts[1].toLowerCase();
        if (second === 'components') {
          if (parts.length > 3) {
            subchunkName = `UI Component - ${parts[2].charAt(0).toUpperCase() + parts[2].slice(1)}`;
          } else {
            subchunkName = 'UI Components';
          }
        } else if (['pages', 'views', 'app', 'screens'].includes(second)) {
          subchunkName = 'Pages & Routing';
        } else if (['models', 'db', 'schemas'].includes(second)) {
          subchunkName = 'Database Layer';
        } else if (['routes', 'controllers', 'middleware'].includes(second)) {
          subchunkName = 'API & Routes';
        } else {
          subchunkName = second.charAt(0).toUpperCase() + second.slice(1);
        }
      } else {
        moduleName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
        if (parts.length > 1) {
          subchunkName = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
        } else {
          subchunkName = 'General';
        }
      }
    }

    if (!rawGroups[moduleName]) {
      rawGroups[moduleName] = {};
    }
    if (!rawGroups[moduleName][subchunkName]) {
      rawGroups[moduleName][subchunkName] = [];
    }
    rawGroups[moduleName][subchunkName].push(file);
  });

  const modules = [];

  // Group split logic based on estimated tokens (Auto split > 3000 tokens)
  Object.keys(rawGroups).forEach((modName) => {
    const subchunks = [];

    Object.keys(rawGroups[modName]).forEach((subName) => {
      const filesInGroup = rawGroups[modName][subName];
      
      let currentSubchunkFiles = [];
      let currentSubchunkTokens = 0;
      let currentSubchunkChars = 0;
      let currentSubchunkLines = 0;
      let partCount = 1;

      filesInGroup.forEach((file) => {
        const content = file.content || '';
        const size = file.size || 0;
        const charCount = content ? content.length : size;
        const linesCount = content ? content.split('\n').length : Math.ceil(size / 40);
        const fileTokens = estimateTokens(content) || Math.ceil(size / 4);

        // Auto split threshold validation (3000 tokens limit)
        if (currentSubchunkFiles.length > 0 && currentSubchunkTokens + fileTokens >= 3000) {
          subchunks.push({
            subchunkName: filesInGroup.length > 1 ? `${subName} Part ${partCount}` : subName,
            files: currentSubchunkFiles.map(f => f.path),
            status: 'pending',
            questionCandidates: [],
            activeQuestions: []
          });
          partCount++;
          
          currentSubchunkFiles = [];
          currentSubchunkTokens = 0;
          currentSubchunkChars = 0;
          currentSubchunkLines = 0;
        }

        currentSubchunkFiles.push(file);
        currentSubchunkTokens += fileTokens;
        currentSubchunkChars += charCount;
        currentSubchunkLines += linesCount;
      });

      if (currentSubchunkFiles.length > 0) {
        subchunks.push({
          subchunkName: partCount > 1 ? `${subName} Part ${partCount}` : subName,
          files: currentSubchunkFiles.map(f => f.path),
          status: 'pending',
          questionCandidates: [],
          activeQuestions: []
        });
      }
    });

    if (subchunks.length > 0) {
      modules.push({
        moduleName: modName,
        subchunks
      });
    }
  });

  return modules;
};

