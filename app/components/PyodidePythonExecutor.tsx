"use client";

import { useState, useRef, useEffect } from 'react';
import { Play, Square, RotateCcw, Loader2, Terminal } from 'lucide-react';

interface PythonExecutorProps {
  code: string;
  className?: string;
}

declare global {
  interface Window {
    loadPyodide: (config?: { indexURL?: string }) => Promise<PyodideInterface>;
  }
}

interface PyodideInterface {
  runPython: (code: string) => unknown;
  globals: {
    set: (name: string, value: unknown) => void;
  };
}

export default function PyodidePythonExecutor({ code, className = "" }: PythonExecutorProps) {
  const [output, setOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [currentInput, setCurrentInput] = useState("");
  const [pyodideReady, setPyodideReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pyodideRef = useRef<PyodideInterface | null>(null);
  const inputResolverRef = useRef<((value: string) => void) | null>(null);

  // Auto-scroll to bottom when output changes
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  // Focus input when waiting for input
  useEffect(() => {
    if (waitingForInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [waitingForInput]);

  const initializePyodide = async () => {
    if (pyodideReady && pyodideRef.current) return;
    
    setIsLoading(true);
    try {
      // Load Pyodide from CDN
      if (!window.loadPyodide) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
        document.head.appendChild(script);
        
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
      }

      pyodideRef.current = await window.loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/",
      });

      // Simple setup with output redirection
      pyodideRef.current.runPython(`
import sys
import io

# Create a custom stdout that we can capture
class OutputCapture:
    def __init__(self, update_callback):
        self.update_callback = update_callback
        self.content = ""
    
    def write(self, text):
        self.content += text
        self.update_callback(self.content)
        
    def flush(self):
        pass

# Set up the output capture
from js import update_output_callback
_stdout_capture = OutputCapture(update_output_callback)
_original_stdout = sys.stdout
      `);

      // Set up the callback to update React state
      pyodideRef.current.globals.set("update_output_callback", (text: string) => {
        setOutput(text);
      });

      setPyodideReady(true);
    } catch (error) {
      setOutput(`Failed to load Python environment: ${error instanceof Error ? error.message : 'Unknown error'}\n\nNote: This uses Pyodide (Python in WebAssembly) which may take a moment to load on first use.`);
    } finally {
      setIsLoading(false);
    }
  };

  const executeCode = async () => {
    if (!pyodideReady) {
      await initializePyodide();
      if (!pyodideReady) return;
    }

    try {
      setIsRunning(true);
      setOutput("");
      setWaitingForInput(false);
      setCurrentInput("");

      // Simple execution with output capture
      if (pyodideRef.current) {
        pyodideRef.current.runPython(`
# Redirect stdout to our capture
sys.stdout = _stdout_capture
_stdout_capture.content = ""  # Clear previous content
        `);

        try {
          pyodideRef.current.runPython(code);
        } catch (pythonError: unknown) {
          const errorMessage = pythonError instanceof Error ? pythonError.message : String(pythonError);
          pyodideRef.current.runPython(`print(f"Error: {${JSON.stringify(errorMessage)}}")`);
        }

        pyodideRef.current.runPython(`
print("\\n--- Execution completed ---")
# Restore original stdout
sys.stdout = _original_stdout
        `);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setOutput(prev => prev + `\nExecution Error: ${errorMessage}\n--- Execution completed ---`);
    } finally {
      setIsRunning(false);
    }
  };

  const sendInput = () => {
    if (!currentInput.trim() || !inputResolverRef.current) return;

    // Add the input to output display
    setOutput(prev => prev + currentInput + '\n');
    
    // Resolve the input promise
    inputResolverRef.current(currentInput);
    inputResolverRef.current = null;
    
    setCurrentInput("");
    setWaitingForInput(false);
  };

  const stopExecution = () => {
    if (pyodideRef.current) {
      // Interrupt execution (this is limited in Pyodide)
      try {
        pyodideRef.current.runPython("raise KeyboardInterrupt()");
      } catch (error) {
        // Expected to throw
      }
    }
    
    setIsRunning(false);
    setWaitingForInput(false);
    if (inputResolverRef.current) {
      inputResolverRef.current("");
      inputResolverRef.current = null;
    }
  };

  const clearOutput = () => {
    setOutput("");
    setWaitingForInput(false);
    setCurrentInput("");
    if (inputResolverRef.current) {
      inputResolverRef.current("");
      inputResolverRef.current = null;
    }
  };

  const handleInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendInput();
    }
  };

  return (
    <div className={`bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-gray-400" />
          <span className="text-white font-medium">Python Executor (Pyodide)</span>
        </div>
        <div className="flex items-center gap-2">
          {!pyodideReady && (
            <button
              onClick={initializePyodide}
              disabled={isLoading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg transition-colors text-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading Python...
                </>
              ) : (
                <>
                  <Terminal className="w-4 h-4" />
                  Initialize Python
                </>
              )}
            </button>
          )}
          
          <button
            onClick={executeCode}
            disabled={!pyodideReady || isRunning || isLoading}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg transition-colors text-sm"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Running
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run
              </>
            )}
          </button>
          
          {isRunning && (
            <button
              onClick={stopExecution}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition-colors text-sm"
            >
              <Square className="w-4 h-4" />
              Stop
            </button>
          )}
          
          <button
            onClick={clearOutput}
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg transition-colors text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>

      {/* Output Area */}
      <div className="h-80 flex flex-col">
        <div 
          ref={outputRef}
          className="flex-1 p-4 font-mono text-sm text-gray-200 overflow-y-auto bg-gray-900/50"
        >
          {isLoading ? (
            <div className="text-blue-400 italic">
              Loading Python environment (this may take a moment on first use)...
            </div>
          ) : !pyodideReady ? (
            <div className="text-gray-500 italic">
              Click &quot;Initialize Python&quot; to start the Python environment...
            </div>
          ) : output ? (
            <pre className="whitespace-pre-wrap">{output}</pre>
          ) : (
            <div className="text-gray-500 italic">
              Click &quot;Run&quot; to execute the Python code...
            </div>
          )}
        </div>

        {/* Input Area */}
        {waitingForInput && (
          <div className="p-4 border-t border-white/10 bg-gray-900/30">
            <div className="flex items-center gap-2">
              <span className="text-green-400 font-mono text-sm">Input:</span>
              <input
                ref={inputRef}
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyPress={handleInputKeyPress}
                placeholder="Enter your input and press Enter..."
                className="flex-1 bg-gray-800 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none font-mono text-sm"
              />
              <button
                onClick={sendInput}
                disabled={!currentInput.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded transition-colors text-sm"
              >
                Send
              </button>
            </div>
          </div>
        )}

        {/* Status Bar */}
        <div className="px-4 py-2 bg-gray-900/50 border-t border-white/10 text-xs text-gray-400 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>Status: {
              isLoading ? "Loading Python environment..." :
              !pyodideReady ? "Not initialized" :
              isRunning ? 
                waitingForInput ? "Waiting for input" : "Running..." :
                "Ready"
            }</span>
          </div>
          <div className="text-gray-500 text-right">
            <div>Pyodide (Python in Browser)</div>
            <div className="text-xs">Works on Vercel &amp; everywhere!</div>
          </div>
        </div>
      </div>
    </div>
  );
}
