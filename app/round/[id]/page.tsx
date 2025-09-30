"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Code, Play, Clock, Puzzle, Loader2 } from "lucide-react";
import { use, useEffect, useState } from "react";

interface Puzzle {
  name: string;
  filename: string;
  description: string;
}

interface RoundData {
  title: string;
  description: string;
  difficulty: string;
  color: string;
  puzzles: Puzzle[];
  roundNumber: number;
}

export default function RoundPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [roundData, setRoundData] = useState<RoundData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoundData = async () => {
      try {
        const response = await fetch(`/api/round?id=${resolvedParams.id}`);
        if (!response.ok) {
          throw new Error('Round not found');
        }
        const data = await response.json();
        setRoundData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchRoundData();
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (error || !roundData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">Error: {error || 'Round not found'}</div>
          <Link href="/" className="text-purple-400 hover:text-purple-300 cursor-pointer">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-6 py-12">
        {/* Fixed Header - visible at all times */}
        <div className="fixed top-8 left-8 z-50">
          <Link 
            href="/" 
            className="inline-flex items-center text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </div>
        
        <div className="mt-16">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {roundData.title}
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-6">
              {roundData.description}
            </p>
            <div className="flex items-center justify-center gap-4">
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                roundData.difficulty === 'Beginner' ? 'bg-green-500/20 text-green-300' :
                roundData.difficulty === 'Easy' ? 'bg-blue-500/20 text-blue-300' :
                roundData.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-300' :
                roundData.difficulty === 'Hard' ? 'bg-orange-500/20 text-orange-300' :
                roundData.difficulty === 'Expert' ? 'bg-red-500/20 text-red-300' :
                'bg-purple-500/20 text-purple-300'
              }`}>
                {roundData.difficulty}
              </span>
              <span className="text-gray-300">
                {roundData.puzzles.length} Puzzles
              </span>
            </div>
          </div>

        {/* Puzzles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {roundData.puzzles.map((puzzle, index) => (
            <Link
              key={puzzle.filename}
              href={`/round/${resolvedParams.id}/puzzle/${puzzle.filename}`}
              prefetch={true}
              className="group relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer"
              onMouseEnter={() => {
                // Prefetch API data on hover for instant loading
                fetch(`/api/puzzle?round=${resolvedParams.id}&puzzle=${puzzle.filename}`).catch(() => {});
              }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 ${roundData.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <Puzzle className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm text-gray-400">#{index + 1}</span>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-purple-300 transition-colors">
                  {puzzle.name}
                </h3>
                <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                  {puzzle.description}
                </p>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-400">
                    <Code className="w-4 h-4 mr-1" />
                    Python
                  </div>
                  <div className="flex items-center text-gray-400 group-hover:text-white transition-colors">
                    <Play className="w-4 h-4 mr-1" />
                    Try
                  </div>
                </div>
              </div>
              
              {/* Glow effect */}
              <div className={`absolute inset-0 ${roundData.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-2xl`} />
            </Link>
          ))}
        </div>

        {/* Round Stats */}
        <div className="mt-16 text-center">
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-6">Round statistics</h3>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="text-2xl font-bold text-purple-400 mb-2">{roundData.puzzles.length}</div>
                <div className="text-gray-300 text-sm">Total puzzles</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400 mb-2">{roundData.difficulty}</div>
                <div className="text-gray-300 text-sm">Difficulty</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400 mb-2">
                  {roundData.roundNumber === 1 ? '~30min' :
                   roundData.roundNumber === 2 ? '~30min' :
                   roundData.roundNumber === 3 ? '~1h' :
                   roundData.roundNumber === 4 ? '~1h' :
                   roundData.roundNumber === 5 ? '~1h 30min' :
                   '~2h'}
                </div>
                <div className="text-gray-300 text-sm">Est. time</div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
