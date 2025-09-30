"use client";

import { useState, useRef, useEffect } from 'react';
import { Play, Square, RotateCcw, Loader2, Terminal } from 'lucide-react';

interface ExecutionOutput {
  output: string;
  sessionId?: string;
  waitingForInput?: boolean;
  completed?: boolean;
  error?: string;
  details?: string;
  exitCode?: number;
}

interface PythonExecutorProps {
  code: string;
  className?: string;
}

export default function PythonExecutor({ code, className = "" }: PythonExecutorProps) {
  const [output, setOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [currentInput, setCurrentInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const executeCode = async () => {
    try {
      setIsRunning(true);
      setIsCompleted(false);
      setOutput("");
      setSessionId(null);
      setWaitingForInput(false);

      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const result: ExecutionOutput = await response.json();
      
      if (result.error) {
        setOutput(`Error: ${result.error}\n${result.details || ''}`);
        setIsRunning(false);
        setIsCompleted(true);
        return;
      }

      setOutput(result.output || "");
      setSessionId(result.sessionId || null);
      setWaitingForInput(result.waitingForInput || false);
      setIsCompleted(result.completed || false);
      
      if (result.completed || (!result.waitingForInput && !result.sessionId)) {
        setIsRunning(false);
      }
    } catch (error) {
      setOutput(`Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsRunning(false);
      setIsCompleted(true);
    }
  };

  const sendInput = async () => {
    if (!sessionId || !currentInput.trim()) return;

    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          input: currentInput,
          sessionId 
        }),
      });

      const result: ExecutionOutput = await response.json();
      
      if (result.error) {
        setOutput(prev => prev + `\nError: ${result.error}`);
        setIsRunning(false);
        setIsCompleted(true);
        return;
      }

      // Append new output (don't replace)
      if (result.output) {
        setOutput(prev => prev + result.output);
      }
      
      setCurrentInput("");
      setWaitingForInput(result.waitingForInput || false);
      setIsCompleted(result.completed || false);
      
      if (result.completed) {
        setIsRunning(false);
        setSessionId(null);
      }
    } catch (error) {
      setOutput(prev => prev + `\nNetwork Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsRunning(false);
      setIsCompleted(true);
    }
  };

  const stopExecution = async () => {
    if (sessionId) {
      try {
        await fetch(`/api/execute?sessionId=${sessionId}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('Failed to stop execution:', error);
      }
    }
    
    setIsRunning(false);
    setWaitingForInput(false);
    setSessionId(null);
    setIsCompleted(true);
  };

  const clearOutput = () => {
    setOutput("");
    setIsCompleted(false);
    setWaitingForInput(false);
    setCurrentInput("");
    if (sessionId) {
      stopExecution();
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
          <span className="text-white font-medium">Python Executor</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={executeCode}
            disabled={isRunning}
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
          {output ? (
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
              isRunning ? 
                waitingForInput ? "Waiting for input" : "Running..." :
                isCompleted ? "Completed" : "Ready"
            }</span>
            {sessionId && (
              <span className="text-blue-400">Session: {sessionId.slice(0, 8)}...</span>
            )}
          </div>
          <div className="text-gray-500">
            Python Interactive Executor
          </div>
        </div>
      </div>
    </div>
  );
}
