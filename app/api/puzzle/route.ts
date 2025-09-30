import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const roundId = searchParams.get('round');
  const puzzleName = searchParams.get('puzzle');

  if (!roundId || !puzzleName) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  const roundNumber = parseInt(roundId);
  if (isNaN(roundNumber) || roundNumber < 1 || roundNumber > 6) {
    return NextResponse.json({ error: 'Invalid round number' }, { status: 404 });
  }

  const filePath = path.join(process.cwd(), "public", `Round ${roundNumber}`, `${puzzleName}.py`);
  
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Puzzle not found' }, { status: 404 });
  }

  const code = fs.readFileSync(filePath, 'utf-8');
  
  const roundInfo = {
    1: { difficulty: "Beginner", color: "bg-green-500", roundTitle: "Round 1: Getting Started" },
    2: { difficulty: "Easy", color: "bg-blue-500", roundTitle: "Round 2: Basic Logic" },
    3: { difficulty: "Medium", color: "bg-yellow-500", roundTitle: "Round 3: Data Processing" },
    4: { difficulty: "Hard", color: "bg-orange-500", roundTitle: "Round 4: Complex Algorithms" },
    5: { difficulty: "Expert", color: "bg-red-500", roundTitle: "Round 5: Advanced Challenges" },
    6: { difficulty: "Legendary", color: "bg-purple-500", roundTitle: "Round 6: Master Level" }
  }[roundNumber];

  // Generate description based on puzzle name
  const generateDescription = (name: string) => {
    const formattedName = name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    if (name.includes('battery')) {
      return "Calculate charging speed and time remaining for a device battery based on charging data.";
    } else if (name.includes('first')) {
      return "A simple introduction to Python programming - your first step into the coding world.";
    } else if (name.includes('potato')) {
      return "Solve the famous potato paradox - a mathematical puzzle about water content and weight.";
    } else if (name.includes('scooter')) {
      return "Analyze electric scooter performance and calculate optimal usage patterns.";
    } else if (name.includes('lamp')) {
      return "Diagnose lighting system problems and determine the correct troubleshooting steps.";
    } else if (name.includes('map')) {
      return "Scale map coordinates and calculate distances between geographical points.";
    } else if (name.includes('sweater')) {
      return "Help Sakari choose the perfect sweater based on weather conditions and preferences.";
    } else if (name.includes('matrix')) {
      return "Work with 2D matrices to find local maxima and perform matrix transformations.";
    } else if (name.includes('triangle')) {
      return "Determine triangle properties and classify triangles based on their side lengths.";
    } else if (name.includes('fruit')) {
      return "Simulate a fruit machine and calculate probabilities of winning combinations.";
    } else if (name.includes('basketball')) {
      return "Analyze basketball game statistics and calculate team performance metrics.";
    } else if (name.includes('salary')) {
      return "Process salary data and generate comprehensive statistics for payroll analysis.";
    } else {
      return `A challenging ${formattedName.toLowerCase()} puzzle that will test your Python programming skills and problem-solving abilities.`;
    }
  };

  const puzzleData = {
    name: puzzleName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    code,
    roundNumber,
    description: generateDescription(puzzleName),
    ...roundInfo!
  };

  const response = NextResponse.json(puzzleData);
  
  // Add caching headers for better performance
  response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  
  return response;
}
