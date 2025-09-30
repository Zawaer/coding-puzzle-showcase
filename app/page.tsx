"use client";

import Link from "next/link";
import { Code, Zap, Trophy, Star, Flame, Crown } from "lucide-react";

const rounds = [
  { id: 1, title: "Round 1", description: "Getting started", difficulty: "Beginner", icon: Code, color: "bg-green-500" },
  { id: 2, title: "Round 2", description: "Basic logic", difficulty: "Easy", icon: Zap, color: "bg-blue-500" },
  { id: 3, title: "Round 3", description: "Data processing", difficulty: "Medium", icon: Trophy, color: "bg-yellow-500" },
  { id: 4, title: "Round 4", description: "Complex algorithms", difficulty: "Hard", icon: Star, color: "bg-orange-500" },
  { id: 5, title: "Round 5", description: "Advanced challenges", difficulty: "Expert", icon: Flame, color: "bg-red-500" },
  { id: 6, title: "Round 6", description: "Master level", difficulty: "Legendary", icon: Crown, color: "bg-purple-500" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-6 h-16 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Coding Puzzle Showcase!
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Explore challenging Python programming puzzles across 6 difficulty levels. 
            From beginner-friendly exercises to legendary algorithms.
          </p>
        </div>

        {/* Rounds Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {rounds.map((round) => {
            const IconComponent = round.icon;
            return (
              <Link
                key={round.id}
                href={`/round/${round.id}`}
                prefetch={true}
                className="group relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer"
                onMouseEnter={() => {
                  // Prefetch API data on hover for instant loading
                  fetch(`/api/round?id=${round.id}`).catch(() => {});
                }}
              >
                <div className="p-8">
                  <div className={`w-16 h-16 ${round.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-3">{round.title}</h3>
                  <p className="text-gray-300 mb-4">{round.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      round.difficulty === 'Beginner' ? 'bg-green-500/20 text-green-300' :
                      round.difficulty === 'Easy' ? 'bg-blue-500/20 text-blue-300' :
                      round.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-300' :
                      round.difficulty === 'Hard' ? 'bg-orange-500/20 text-orange-300' :
                      round.difficulty === 'Expert' ? 'bg-red-500/20 text-red-300' :
                      'bg-purple-500/20 text-purple-300'
                    }`}>
                      {round.difficulty}
                    </span>
                    <div className="text-gray-400 group-hover:text-white transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                {/* Subtle glow effect */}
                <div className={`absolute inset-0 ${round.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl`} />
              </Link>
            );
          })}
        </div>

        {/* Stats Section */}
        <div className="mt-20 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <div className="text-3xl font-bold text-purple-400 mb-2">24</div>
              <div className="text-gray-300">Total puzzles</div>
            </div>
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <div className="text-3xl font-bold text-blue-400 mb-2">6</div>
              <div className="text-gray-300">Difficulty levels</div>
            </div>
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <div className="text-3xl font-bold text-green-400 mb-2">Python</div>
              <div className="text-gray-300">Programming language</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
