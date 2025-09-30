import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const roundId = searchParams.get('id');

  if (!roundId) {
    return NextResponse.json({ error: 'Missing round ID' }, { status: 400 });
  }

  const roundNumber = parseInt(roundId);
  if (isNaN(roundNumber) || roundNumber < 1 || roundNumber > 6) {
    return NextResponse.json({ error: 'Invalid round number' }, { status: 404 });
  }

  const roundPath = path.join(process.cwd(), "public", `Round ${roundNumber}`);
  
  if (!fs.existsSync(roundPath)) {
    return NextResponse.json({ error: 'Round not found' }, { status: 404 });
  }

  const files = fs.readdirSync(roundPath).filter((file: string) => file.endsWith('.py'));
  
  const puzzles: Puzzle[] = files.map((file: string) => ({
    name: file.replace('.py', '').replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
    filename: file.replace('.py', ''),
    description: `A challenging Python puzzle that tests your programming skills.`
  }));

  const roundInfo = {
    1: { title: "Round 1: Getting Started", description: "Welcome to your coding journey! These foundational puzzles introduce basic programming concepts.", difficulty: "Beginner", color: "bg-green-500" },
    2: { title: "Round 2: Basic Logic", description: "Build your logical thinking with these intermediate challenges.", difficulty: "Easy", color: "bg-blue-500" },
    3: { title: "Round 3: Data Processing", description: "Learn to manipulate and process data effectively.", difficulty: "Medium", color: "bg-yellow-500" },
    4: { title: "Round 4: Complex Algorithms", description: "Dive into more sophisticated algorithmic thinking.", difficulty: "Hard", color: "bg-orange-500" },
    5: { title: "Round 5: Advanced Challenges", description: "Push your limits with these expert-level problems.", difficulty: "Expert", color: "bg-red-500" },
    6: { title: "Round 6: Master Level", description: "The ultimate test of your programming mastery.", difficulty: "Legendary", color: "bg-purple-500" }
  }[roundNumber];

  const roundData: RoundData = {
    title: roundInfo!.title,
    description: roundInfo!.description,
    difficulty: roundInfo!.difficulty,
    color: roundInfo!.color,
    puzzles,
    roundNumber
  };

  return NextResponse.json(roundData);
}
