/**
 * Helper to clean and format Project Defense questions for clean user presentation.
 * Strips raw file paths, difficulty labels, and technical metadata,
 * leaving only clean, interviewer-style, voice-assistant friendly questions.
 */

export const cleanQuestionText = (qText, subchunkName) => {
  if (!qText || typeof qText !== 'string') return '';
  let cleaned = qText.trim();

  // 1. Remove double quotes wrapping the question text if present
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  // 2. Clean specific configuration file paths
  cleaned = cleaned.replace(/\bpackage\.json\b/gi, 'your dependencies configuration');
  cleaned = cleaned.replace(/\b(?:tsconfig|vite\.config|webpack\.config)\.(json|js|ts)\b/gi, 'your project configuration');
  
  // 3. Clean generic file paths (e.g. app.jsx, server.js) to "your code" or "this file"
  cleaned = cleaned.replace(/\b\w+[-.\w]*\.(jsx?|tsx?|json|css|scss|html|md|env)\b/gi, 'your code');

  // 4. Remove references to "subchunk [Name]" or "subchunk: [Name]"
  if (subchunkName) {
    const escapedName = subchunkName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    
    // "subchunk: Client Config Part 1" or "subchunk Client Config Part 1"
    const subchunkRegex = new RegExp(`(?:the\\s+)?subchunk\\s*:?\\s*${escapedName}`, 'gi');
    cleaned = cleaned.replace(subchunkRegex, 'this module');

    // "Client Config Part 1"
    const nameRegex = new RegExp(escapedName, 'gi');
    cleaned = cleaned.replace(nameRegex, 'this section');
  }

  // Generic subchunk phrase cleanups (matching any other subchunk patterns)
  cleaned = cleaned.replace(/(?:in\s+)?(?:the\s+)?subchunk\s*:?\s*[\w\s-]+(?:Part\s+\d+)?/gi, 'this module');
  cleaned = cleaned.replace(/in\s+this\s+module\s+this\s+module/gi, 'in this module');

  // 5. Strip markdown bold and italic formatting within the question itself
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
  cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1');

  // 6. Clean up white spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // Ensure first character is uppercase
  if (cleaned) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return cleaned;
};

export const parseProjectDefenseQuestionMessage = (text, projectContext) => {
  if (!text || typeof text !== 'string') return null;

  // Check if it is a completed message, which shouldn't be processed as a question bubble
  if (text.includes('Progressive Project Defense Completed') || text.includes('Project Defense Completed')) {
    return null;
  }

  // Check if the message contains a question (usually inside **"..."** or ending with **"...)
  let rawQuestionText = null;
  const lastBoldQuoteIdx = text.lastIndexOf('**"');
  if (lastBoldQuoteIdx !== -1) {
    const endIdx = text.indexOf('"**', lastBoldQuoteIdx + 3);
    if (endIdx !== -1) {
      rawQuestionText = text.substring(lastBoldQuoteIdx + 3, endIdx);
    }
  }

  // Fallback match for bold quotes anywhere
  if (!rawQuestionText) {
    const quoteMatch = text.match(/\*\*"(.*?)"\*\*/s);
    if (quoteMatch) {
      rawQuestionText = quoteMatch[1];
    }
  }

  // If there's no question matched, it's not a question/critic message (like general welcome)
  if (!rawQuestionText) {
    return null;
  }

  // 1. Extract feedback
  let feedback = null;
  const feedbackMatch = text.match(/(?:\*\*Feedback\*\*|Feedback):\s*([\s\S]*?)(?=\n\n|\n---\n|Here is your|Moving to|$)/i);
  if (feedbackMatch) {
    feedback = feedbackMatch[1].trim();
    // Clean markdown bold symbols from feedback header if present
    feedback = feedback.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1');
  }

  // 2. Extract module name
  let moduleName = null;
  const moduleMatch = text.match(/(?:\*\*Module\*\*|Module):\s*([^*→\n]+)/i);
  if (moduleMatch) {
    moduleName = moduleMatch[1].trim();
  } else {
    // Failover to active session context module name
    const isProgressive = Array.isArray(projectContext?.modules) && projectContext.modules.length > 0;
    const currentModule = isProgressive ? projectContext.modules[projectContext.currentModuleIndex || 0] : null;
    moduleName = currentModule?.moduleName || 'Project Architecture';
  }

  // 3. Extract subchunk name
  let subchunkName = null;
  const subchunkMatch = text.match(/(?:\*\*Subchunk\*\*|Subchunk):\s*([^*→\n]+)/i);
  if (subchunkMatch) {
    subchunkName = subchunkMatch[1].trim();
  } else {
    // Failover to active session context subchunk name
    const isProgressive = Array.isArray(projectContext?.modules) && projectContext.modules.length > 0;
    const currentModule = isProgressive ? projectContext.modules[projectContext.currentModuleIndex || 0] : null;
    const currentSubchunk = currentModule?.subchunks?.[projectContext.currentSubchunkIndex || 0];
    subchunkName = currentSubchunk?.subchunkName;
  }

  // Clean the question text
  const cleanedQuestion = cleanQuestionText(rawQuestionText, subchunkName);

  return {
    feedback,
    moduleName,
    questionText: cleanedQuestion
  };
};
