"use client";

import { useEffect, useRef, useState } from 'react';
import { Play, Square, RotateCcw, Loader2, Terminal } from 'lucide-react';

interface PyodideTerminalProps {
  code: string;
  className?: string;
}

// Minimal typed interface for the subset of Pyodide we use here.
interface PyodideRuntime {
  globals: {
    set: (name: string, value: unknown) => void;
    get?: (name: string) => unknown;
  };
  runPythonAsync: (code: string) => Promise<unknown>;
  runPython?: (code: string, options?: unknown) => unknown;
}

declare global {
  interface Window {
    loadPyodide: (config?: { indexURL?: string }) => Promise<PyodideRuntime>;
  }
}

export default function PyodideTerminal({ code, className = "" }: PyodideTerminalProps) {
  const [pyodide, setPyodide] = useState<PyodideRuntime | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const waitingForInputResolveRef = useRef<((value: string) => void) | null>(null);
  const inputStartRef = useRef(0);

  const writeOutput = (text: string) => {
    if (terminalRef.current) {
      terminalRef.current.innerText += text + "\n";
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      inputStartRef.current = terminalRef.current.innerText.length;
    }
  };

  const customInput = async (prompt = ""): Promise<string> => {
    if (prompt) writeOutput(prompt);
    return new Promise<string>((resolve) => {
      waitingForInputResolveRef.current = resolve;
      if (terminalRef.current) {
        terminalRef.current.innerText += "> ";
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        inputStartRef.current = terminalRef.current.innerText.length;
        placeCaretAtEnd();
        terminalRef.current.focus();
      }
    });
  };

  const placeCaretAtEnd = () => {
    if (terminalRef.current) {
      terminalRef.current.focus();
      const range = document.createRange();
      range.selectNodeContents(terminalRef.current);
      range.collapse(false);
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  };

  const loadPyodideEnvironment = async () => {
    if (isReady || isLoading) return;
    
    setIsLoading(true);
    writeOutput("⏳ Loading Python environment...");

    try {
      // Load Pyodide from CDN
      if (!window.loadPyodide) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.28.3/full/pyodide.js';
        script.async = true;
        document.head.appendChild(script);
        
        await new Promise<void>((resolve, reject) => {
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Pyodide'));
          setTimeout(() => reject(new Error('Timeout loading Pyodide')), 30000);
        });
      }

      const pyodideInstance = await window.loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.28.3/full/",
      });

      // Set up exactly like your working HTML example
      pyodideInstance.globals.set("js_writeOutput", writeOutput);
      pyodideInstance.globals.set("js_input", customInput);

      await pyodideInstance.runPythonAsync(`
import builtins

def print(*args, **kwargs):
    s = " ".join(map(str, args))
    js_writeOutput(s)

# Override print globally
builtins.print = print
      `);

  setPyodide(pyodideInstance);
  setIsReady(true);
      
    } catch (error) {
      writeOutput(`❌ Failed to load Python: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Pyodide load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-initialize on mount
  useEffect(() => {
    loadPyodideEnvironment().catch((e) => {
      console.error('Auto-init Pyodide failed', e);
    });
  }, []);

  const executeCode = async () => {
    if (!pyodide || !code.trim()) return;
    
    setIsExecuting(true);
    clearTerminal();

    try {
      // Parse and transform the code to handle input calls properly
      const transformedCode = transformCodeForAsync(code);
      
      await pyodide.runPythonAsync(`
import builtins

async def input(prompt=""):
    return await js_input(prompt)

def print(*args, **kwargs):
    s = " ".join(map(str, args))
    js_writeOutput(s)

builtins.print = print

# Execute in async context
async def execute_user_code():
    # Override input in async context
    builtins.input = input
    
${transformedCode.split('\n').map(line => '    ' + line).join('\n')}

await execute_user_code()
      `);
      
    } catch (error) {
      writeOutput(`${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const transformCodeForAsync = (code: string): string => {
    // Transform input() calls to await input()
    return code.replace(/(\w+\s*=\s*.*?)input\(/g, '$1await input(');
  };

  const clearTerminal = () => {
    if (terminalRef.current) {
      terminalRef.current.innerText = "";
      inputStartRef.current = 0;
    }
  };

  const stopExecution = () => {
    // Note: Stopping execution in Pyodide is limited
    setIsExecuting(false);
    writeOutput("\n--- Execution interrupted ---");
  };

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!terminalRef.current) return;

      // Always keep caret at or after inputStart
      const selection = window.getSelection();
      if (selection && selection.anchorOffset < inputStartRef.current) {
        placeCaretAtEnd();
      }

      // Handle Enter key
      if (e.key === "Enter" && waitingForInputResolveRef.current) {
        e.preventDefault();
        const text = terminalRef.current.innerText.substring(inputStartRef.current).trim();
        waitingForInputResolveRef.current(text);
        waitingForInputResolveRef.current = null;
        terminalRef.current.innerText += "\n";
        inputStartRef.current = terminalRef.current.innerText.length;
        placeCaretAtEnd();
      }
    };

    const handleClick = () => {
      placeCaretAtEnd();
    };

    const terminal = terminalRef.current;
    if (terminal) {
      terminal.addEventListener('keydown', handleKeyDown);
      terminal.addEventListener('click', handleClick);

      return () => {
        terminal.removeEventListener('keydown', handleKeyDown);
        terminal.removeEventListener('click', handleClick);
      };
    }
  }, []);

  return (
    <div className={`bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 ${className}`}>
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Terminal className="w-5 h-5 text-green-400" />
        Interactive Python terminal
      </h3>
      
      <div className="space-y-4">
        {/* Control Buttons */}
        <div className="flex gap-3">
          <button 
            onClick={executeCode}
            disabled={!isReady || isExecuting || isLoading}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : isExecuting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run Code
              </>
            )}
          </button>

          {isExecuting && (
            <button 
              onClick={stopExecution}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              <Square className="w-4 h-4" />
              Stop
            </button>
          )}

          <button 
            onClick={clearTerminal}
            disabled={isLoading}
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-4 h-4" />
            Clear
          </button>
        </div>

        {/* Terminal */}
        <div 
          ref={terminalRef}
          contentEditable={isReady}
          spellCheck={false}
          className="bg-black border border-white/20 rounded-lg p-4 h-64 overflow-y-auto text-green-400 font-mono text-sm whitespace-pre-wrap focus:outline-none"
          style={{ 
            color: 'white', 
            fontFamily: 'monospace',
            lineHeight: '1.4'
          }}
          suppressContentEditableWarning={true}
        >
          {!isReady && !isLoading && "Click 'Initialize Python' to start the Python environment..."}
        </div>
      </div>
    </div>
  );
}
