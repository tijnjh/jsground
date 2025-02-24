const runBtn = document.getElementById("run-btn");
const clearBtn = document.getElementById("clear-btn");
const terminal = document.getElementById("terminal");
const executionTime = document.getElementById("execution-time");

let editor;

const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
};

function formatOutput(args, className) {
  const output = Array.from(args)
    .map((arg) => {
      if (typeof arg === "object") {
        try {
          return JSON.stringify(arg, null, 2);
        } catch (e) {
          return String(arg);
        }
      }
      return String(arg);
    })
    .join(" ");

  const element = document.createElement("div");
  element.className = className;
  element.textContent = output;
  return element;
}

function overrideConsole() {
  console.log = (...args) => {
    originalConsole.log.apply(console, args);
    terminal.appendChild(formatOutput(args, "log"));
    terminal.scrollTop = terminal.scrollHeight;
  };

  console.error = (...args) => {
    originalConsole.error.apply(console, args);
    terminal.appendChild(formatOutput(args, "error"));
    terminal.scrollTop = terminal.scrollHeight;
  };

  console.warn = (...args) => {
    originalConsole.warn.apply(console, args);
    terminal.appendChild(formatOutput(args, "warn"));
    terminal.scrollTop = terminal.scrollHeight;
  };

  console.info = (...args) => {
    originalConsole.info.apply(console, args);
    terminal.appendChild(formatOutput(args, "info"));
    terminal.scrollTop = terminal.scrollHeight;
  };
}

function restoreConsole() {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.info = originalConsole.info;
}

function runCode() {
  terminal.innerHTML = "";
  const code = editor.getValue();
  const startTime = performance.now();

  try {
    overrideConsole();
    const executeCode = new Function(code);
    executeCode();
  } catch (error) {
    console.error("Error executing code:", error.message);
  } finally {
    restoreConsole();
    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);
    executionTime.textContent = `Execution time: ${duration}ms`;
  }
}

require.config({
  paths: {
    vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.36.1/min/vs",
  },
});

require(["vs/editor/editor.main"], () => {
  editor = monaco.editor.create(document.getElementById("editor-container"), {
    language: "javascript",
    theme: "vs-dark",
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: window.innerWidth < 480 ? 12 : 14,
  });

  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, runCode);
  runBtn.onclick = runCode;

  clearBtn.onclick = () => {
    terminal.innerHTML = "";
    executionTime.textContent = "";
  };

  window.onresize = () => {
    editor.updateOptions({
      fontSize: window.innerWidth < 480 ? 12 : 14,
    });
  };
});

window.onkeydown = (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "s") {
    e.preventDefault();
  }
};
