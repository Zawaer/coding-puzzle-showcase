"use client";

import Link from "next/link";
import { ArrowLeft, Copy, Download, Code, Terminal, Loader2 } from "lucide-react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useEffect, useState, use } from "react";
import PythonExecutor from "../../../../components/HybridPythonExecutor";

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

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 max-w-7xl mx-auto mt-16">
          {/* Puzzle Info Panel */}
          <div className="xl:col-span-1">
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

          {/* Code and Runner Panel - Two Columns */}
          <div className="xl:col-span-3 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                <div className="overflow-x-auto max-h-96">
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

              {/* Python Executor */}
              <PythonExecutor code={puzzleData.code} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
