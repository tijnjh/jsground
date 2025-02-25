export const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info
  };
  
  export function formatOutput(args: any[], className: string): HTMLDivElement {
    const output = Array.from(args)
      .map((arg) => {
        if (arg === null) return 'null';
        if (arg === undefined) return 'undefined';
        
        if (typeof arg === 'object') {
          try {
            if (arg instanceof Error) {
              return arg.toString();
            }
            
            return JSON.stringify(arg, null, 2);
          } catch (e) {
            return String(arg);
          }
        }
        return String(arg);
      })
      .join(' ');
  
    const element = document.createElement('div');
    element.className = className;
  
    if (output.includes('{\n') || output.includes('[\n')) {
      element.innerHTML = `<pre>${escapeHtml(output)}</pre>`;
    } else {
      element.textContent = output;
    }
    
    return element;
  }
  
  
  function escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  
  export function overrideConsole(terminal: HTMLDivElement) {
    console.log = (...args) => {
      originalConsole.log.apply(console, args);
      terminal.appendChild(formatOutput(args, 'log'));
      terminal.scrollTop = terminal.scrollHeight;
    };
  
    console.error = (...args) => {
      originalConsole.error.apply(console, args);
      terminal.appendChild(formatOutput(args, 'error'));
      terminal.scrollTop = terminal.scrollHeight;
    };
  
    console.warn = (...args) => {
      originalConsole.warn.apply(console, args);
      terminal.appendChild(formatOutput(args, 'warn'));
      terminal.scrollTop = terminal.scrollHeight;
    };
  
    console.info = (...args) => {
      originalConsole.info.apply(console, args);
      terminal.appendChild(formatOutput(args, 'info'));
      terminal.scrollTop = terminal.scrollHeight;
    };
  }
  
  export function restoreConsole() {
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
    console.info = originalConsole.info;
  }
  