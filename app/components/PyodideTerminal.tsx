"use client";

import { useEffect, useRef, useState } from 'react';
import { Play, Square, RotateCcw, Loader2, Terminal } from 'lucide-react';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

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
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const waitingForInputResolveRef = useRef<((value: string) => void) | null>(null);
  const inputStartRef = useRef(0);

  const writeOutput = (text: string) => {
    if (terminalRef.current) {
  terminalRef.current.innerText += text;
  terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
  inputStartRef.current = terminalRef.current.innerText.length;
    }
  };

  const customInput = async (prompt = ""): Promise<string> => {
    if (prompt) writeOutput(prompt);
    return new Promise<string>((resolve) => {
      waitingForInputResolveRef.current = resolve;
  setIsWaitingForInput(true);
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
  writeOutput("⏳ Loading Python environment...\n");

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
  sep = kwargs.get('sep', ' ')
  end = kwargs.get('end', '\\n')
  s = sep.join(map(str, args))
  js_writeOutput(s + end)

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
      // Pass the original user code without any async transforms
      pyodide.globals.set('pyodide_user_code', code);

  await pyodide.runPythonAsync(`
import builtins
import textwrap
from js import Object
from pyodide.ffi import create_proxy

# Create a synchronous-looking input function that actually handles async internally
class SyncInput:
    def __init__(self, js_input_func):
        self.js_input_func = js_input_func
        self.result = None
        self.waiting = False
    
    def __call__(self, prompt=""):
        if self.waiting:
            raise RuntimeError("Nested input() calls not supported")
        
        self.waiting = True
        self.result = None
        
        # Create a promise and immediately resolve it with the JS async function
        import asyncio
        loop = asyncio.get_event_loop()
        
        # Create a future that will be resolved by the callback
        future = loop.create_future()
        
        def resolve_callback(value):
            if not future.done():
                future.set_result(value)
        
        # Call the JS async function and set up the callback
        js_promise = self.js_input_func(prompt)
        js_promise.then(create_proxy(resolve_callback))
        
        # Wait for the result synchronously within the event loop
        self.result = loop.run_until_complete(future)
        self.waiting = False
        return self.result

# Override input with our synchronous wrapper
sync_input = SyncInput(js_input)
builtins.input = sync_input

def print(*args, **kwargs):
  sep = kwargs.get('sep', ' ')
  end = kwargs.get('end', '\\n')
  s = sep.join(map(str, args))
  js_writeOutput(s + end)

builtins.print = print

# Execute the user code directly without any async wrapping
user_code = textwrap.dedent(pyodide_user_code)
exec(user_code, globals())
      `);
      
    } catch (error) {
      writeOutput(`${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExecuting(false);
      writeOutput("\n--- Execution completed ---");
    }
  };  const clearTerminal = () => {
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

      // Only force caret at end while waiting for input
        if (waitingForInputResolveRef.current) {
        const selection = window.getSelection();
        if (selection && selection.anchorOffset < inputStartRef.current) {
          placeCaretAtEnd();
        }

          // Prevent deleting or altering protected text before the input start
          if (e.key === 'Backspace' || e.key === 'Delete') {
            if (selection && selection.anchorOffset <= inputStartRef.current) {
              e.preventDefault();
              return;
            }
          }

          if (e.key === "Enter") {
          e.preventDefault();
          const text = terminalRef.current!.innerText.substring(inputStartRef.current).trim();
          waitingForInputResolveRef.current!(text);
          waitingForInputResolveRef.current = null;
            setIsWaitingForInput(false);
          terminalRef.current!.innerText += "\n";
          inputStartRef.current = terminalRef.current!.innerText.length;
          placeCaretAtEnd();
        }
      }
    };

    const handleClick = () => {
      // If waiting for input, keep caret at end; otherwise allow regular selection/caret
      if (waitingForInputResolveRef.current) placeCaretAtEnd();
    };

    const handlePaste = (e: ClipboardEvent) => {
      // Only allow paste into the editable input region
      if (!waitingForInputResolveRef.current) {
        e.preventDefault();
        return;
      }
      const selection = window.getSelection();
      if (selection && selection.anchorOffset < inputStartRef.current) {
        // Force caret to end so paste only affects input area
        e.preventDefault();
        placeCaretAtEnd();
      }
    };

    const handleCut = (e: ClipboardEvent) => {
      // Disallow cutting protected output
      if (!waitingForInputResolveRef.current) {
        e.preventDefault();
        return;
      }
      const selection = window.getSelection();
      if (selection && selection.anchorOffset < inputStartRef.current) {
        e.preventDefault();
      }
    };

    const terminal = terminalRef.current;
    if (terminal) {
      terminal.addEventListener('keydown', handleKeyDown);
      terminal.addEventListener('click', handleClick);
      terminal.addEventListener('paste', handlePaste as EventListener);
      terminal.addEventListener('cut', handleCut as EventListener);

      return () => {
        terminal.removeEventListener('keydown', handleKeyDown);
        terminal.removeEventListener('click', handleClick);
        terminal.removeEventListener('paste', handlePaste as EventListener);
        terminal.removeEventListener('cut', handleCut as EventListener);
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
                Run
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
          contentEditable={isReady && isWaitingForInput}
          tabIndex={0}
          spellCheck={false}
          className="border-none rounded-lg p-4 h-80 overflow-y-auto font-mono text-sm whitespace-pre-wrap focus:outline-none select-text"
          style={{ 
            backgroundColor: (oneDark.plain && (oneDark as any).plain.backgroundColor) || '#011627',
            color: (oneDark.plain && (oneDark as any).plain.color) || '#d6deeb',
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
