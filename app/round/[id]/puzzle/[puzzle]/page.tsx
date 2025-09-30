"use client";

import Link from "next/link";
import { ArrowLeft, Play, Copy, Download, Code, Terminal, Loader2 } from "lucide-react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useEffect, useState, use } from "react";

interface PuzzleData {
  name: string;
  code: string;
  roundNumber: number;
  description: string;
  difficulty: string;
  color: string;
  roundTitle: string;
}

export default function PuzzlePage({ params }: { params: Promise<{ id: string; puzzle: string }> }) {
  const resolvedParams = use(params);
  const [puzzleData, setPuzzleData] = useState<PuzzleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);
  
  // Python execution state
  const [isExecuting, setIsExecuting] = useState(false);
  const [output, setOutput] = useState('Click "Run Code" to execute the Python script...\n');
  const [currentInput, setCurrentInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [waitingForInput, setWaitingForInput] = useState(false);

  useEffect(() => {
    const fetchPuzzleData = async () => {
      try {
        const response = await fetch(`/api/puzzle?round=${resolvedParams.id}&puzzle=${resolvedParams.puzzle}`);
        if (!response.ok) {
          throw new Error('Puzzle not found');
        }
        const data = await response.json();
        setPuzzleData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPuzzleData();
  }, [resolvedParams.id, resolvedParams.puzzle]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center">
        {/* Fixed back button visible during loading */}
        <div className="fixed top-8 left-8 z-50">
          <Link 
            href={`/round/${resolvedParams.id}`}
            className="inline-flex items-center text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </div>
        <div className="flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !puzzleData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">Error: {error || 'Puzzle not found'}</div>
          <Link href={`/round/${resolvedParams.id}`} className="text-purple-400 hover:text-purple-300 cursor-pointer">
            Back to Round {resolvedParams.id}
          </Link>
        </div>
      </div>
    );
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(puzzleData.code);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const downloadCode = () => {
    const blob = new Blob([puzzleData.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${resolvedParams.puzzle}.py`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const runPythonCode = async () => {
    if (!puzzleData?.code) return;
    
    setIsExecuting(true);
    setOutput('> Executing Python code...\n');
    setWaitingForInput(false);
    setSessionId(null);
    
    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: puzzleData.code,
        }),
      });

      const result = await response.json();
      
      if (result.error) {
        setOutput(prev => prev.replace('> Executing Python code...\n', '') + `Error: ${result.error}\n`);
      } else {
        setOutput(prev => prev.replace('> Executing Python code...\n', '') + result.output);
        if (result.sessionId) {
          setSessionId(result.sessionId);
        }
        setWaitingForInput(result.waitingForInput || false);
      }
    } catch (error) {
      setOutput(prev => prev.replace('> Executing Python code...\n', '') + `Network Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    } finally {
      setIsExecuting(false);
    }
  };

  const sendInput = async () => {
    if (!currentInput.trim() || !sessionId) return;
    
    const inputValue = currentInput;
    setCurrentInput('');
    setOutput(prev => prev + `> ${inputValue}\n`);
    setWaitingForInput(false);
    setIsExecuting(true); // Show loading while processing input
    
    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: inputValue,
          sessionId: sessionId,
        }),
      });

      const result = await response.json();
      console.log('Input response:', result); // Debug log
      
      if (result.output) {
        setOutput(prev => prev + result.output);
      }
      
      setWaitingForInput(result.waitingForInput || false);
      
      if (result.completed) {
        setSessionId(null);
      }
    } catch (error) {
      console.error('Input error:', error); // Debug log
      setOutput(prev => prev + `Input Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
      setWaitingForInput(false);
    } finally {
      setIsExecuting(false);
    }
  };

  const clearOutput = () => {
    // Terminate existing session if any
    if (sessionId) {
      fetch(`/api/execute?sessionId=${sessionId}`, {
        method: 'DELETE'
      }).catch(() => {}); // Ignore errors
    }
    
    setOutput('Click "Run Code" to execute the Python script...\n');
    setSessionId(null);
    setWaitingForInput(false);
    setCurrentInput('');
    setIsExecuting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-6 py-12">
        {/* Fixed Navigation - visible at all times */}
        <div className="fixed top-8 left-8 z-50">
          <Link 
            href={`/round/${resolvedParams.id}`}
            className="inline-flex items-center text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto mt-16">
          {/* Puzzle Info Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 sticky top-8">
              <div className={`w-16 h-16 ${puzzleData.color} rounded-xl flex items-center justify-center mb-6`}>
                <Code className="w-8 h-8 text-white" />
              </div>
              
              <h1 className="text-3xl font-bold text-white mb-4">{puzzleData.name}</h1>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Round</span>
                  <span className="text-white font-medium">{puzzleData.roundNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Difficulty</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    puzzleData.difficulty === 'Beginner' ? 'bg-green-500/20 text-green-300' :
                    puzzleData.difficulty === 'Easy' ? 'bg-blue-500/20 text-blue-300' :
                    puzzleData.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-300' :
                    puzzleData.difficulty === 'Hard' ? 'bg-orange-500/20 text-orange-300' :
                    puzzleData.difficulty === 'Expert' ? 'bg-red-500/20 text-red-300' :
                    'bg-purple-500/20 text-purple-300'
                  }`}>
                    {puzzleData.difficulty}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Language</span>
                  <span className="text-white font-medium">Python</span>
                </div>
              </div>

              <p className="text-gray-300 mb-6 leading-relaxed">
                {puzzleData.description}
              </p>

              {/* Action Buttons */}
              <div className="space-y-3">
                <div className="relative">
                  <button
                    onClick={copyToClipboard}
                    className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg transition-colors cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                    Copy code
                  </button>
                  <div className={`absolute -top-10 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-3 py-1 rounded text-sm whitespace-nowrap transition-all duration-300 ${
                    copyFeedback ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
                  }`}>
                    Code copied!
                  </div>
                </div>
                <button
                  onClick={downloadCode}
                  className="w-full flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Download file
                </button>
              </div>
            </div>
          </div>

          {/* Code and Runner Panel */}
          <div className="lg:col-span-2 space-y-8">
            {/* Code Display */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-gray-400" />
                  <span className="text-white font-medium">{resolvedParams.puzzle}.py</span>
                </div>
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <SyntaxHighlighter
                  language="python"
                  style={oneDark}
                  className="!m-0"
                  showLineNumbers={true}
                  lineNumberStyle={{ color: '#6B7280', fontSize: '0.875rem' }}
                >
                  {puzzleData.code}
                </SyntaxHighlighter>
              </div>
            </div>

            {/* Interactive Python terminal */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Terminal className="w-5 h-5 text-green-400" />
                Interactive Python terminal
              </h3>
              
              <div className="space-y-4">
                {/* Control Buttons */}
                <div className="flex gap-3">
                  <button 
                    onClick={runPythonCode}
                    disabled={isExecuting}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isExecuting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Run code
                      </>
                    )}
                  </button>
                  
                  <button 
                    onClick={clearOutput}
                    className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                </div>

                {/* Terminal Output */}
                <div className="bg-black/40 border border-white/20 rounded-lg p-4 h-64 overflow-y-auto">
                  <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap break-words">
                    {output}
                  </pre>
                  
                  {/* Input Line */}
                  {(waitingForInput || isExecuting) && (
                    <div className="flex items-center mt-2">
                      <span className="text-yellow-400 mr-2">{'>'}</span>
                      {isExecuting ? (
                        <div className="flex items-center gap-2 text-gray-400">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing input...
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={currentInput}
                          onChange={(e) => setCurrentInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              sendInput();
                            }
                          }}
                          placeholder="Enter input and press Enter..."
                          className="flex-1 bg-transparent text-green-400 font-mono text-sm outline-none placeholder-gray-500"
                          autoFocus
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Help Text */}
                <div className="text-sm text-gray-400">
                  <p>💡 <strong>Interactive terminal:</strong></p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Click &quot;Run code&quot; to execute the Python script</li>
                    <li>When the program needs input, type your response and press Enter</li>
                    <li>The terminal will show all output and wait for input as needed</li>
                    <li>Use &quot;Clear&quot; to reset the terminal</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
