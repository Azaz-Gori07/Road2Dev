import vm from 'vm';

/**
 * Securely executes Javascript code in a sandboxed Node VM context.
 * Captures console.stdout and prevents infinite loops with a timeout constraint.
 */
export const executeJsCode = async (code, timeoutMs = 1000) => {
  const logs = [];
  
  // Custom console object to redirect stdout inside the sandbox
  const customConsole = {
    log: (...args) => {
      logs.push(args.map(arg => {
        if (typeof arg === 'object') {
          try { return JSON.stringify(arg); } catch (e) { return String(arg); }
        }
        return String(arg);
      }).join(' '));
    },
    error: (...args) => {
      logs.push('[ERROR] ' + args.join(' '));
    },
    warn: (...args) => {
      logs.push('[WARN] ' + args.join(' '));
    }
  };

  const sandbox = {
    console: customConsole,
    process: {
      env: {}
    },
    setTimeout: (fn, delay) => {
      // Simulate timeout inside sandbox
      if (delay < 500) fn();
    },
    setInterval: () => {},
    clearTimeout: () => {},
    clearInterval: () => {}
  };

  const context = vm.createContext(sandbox);
  
  try {
    const script = new vm.Script(code);
    
    // Execute inside sandbox with timeout check
    script.runInContext(context, { timeout: timeoutMs });
    
    return {
      success: true,
      stdout: logs.join('\n') || 'Code executed successfully with no console output.',
      error: null
    };
  } catch (err) {
    let errorMsg = err.message;
    if (err.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT') {
      errorMsg = `Execution Timeout: Code exceeded the ${timeoutMs}ms safety cap. Check for infinite loops!`;
    }
    return {
      success: false,
      stdout: logs.join('\n'),
      error: errorMsg
    };
  }
};
