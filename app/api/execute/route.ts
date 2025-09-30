/* eslint-disable prefer-const */
import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';

// Store active Python processes
const activeProcesses = new Map();

// Clean up old processes periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [sessionId, processData] of activeProcesses.entries()) {
      if (now - processData.startTime > 300000) { // 5 minutes
        try {
          processData.process.kill();
        } catch (error) {
          console.error('Error killing old process:', error);
        }
        activeProcesses.delete(sessionId);
      }
    }
  }, 60000); // Check every minute
}

export async function POST(request: NextRequest) {
  try {
    const { code, input, sessionId } = await request.json();

    if (!code && !input) {
      return NextResponse.json({ error: 'Code or input required' }, { status: 400 });
    }

    // Handle interactive input for existing sessions
    if (input && sessionId && activeProcesses.has(sessionId)) {
      const processData = activeProcesses.get(sessionId);
      const process = processData.process;
      
      try {
        // Send input to the process
        process.stdin.write(input + '\n');
        
        // Wait for new output
        return new Promise<NextResponse>((resolve) => {
          let newOutput = '';
          let hasNewOutput = false;
          
          const outputHandler = (data: Buffer) => {
            const text = data.toString('utf8');
            newOutput += text;
            hasNewOutput = true;
            
            // Check if waiting for more input
            const inputIndicators = [
              'How many', 'Enter', 'What is', '?', 'choice = int(input())',
              'input()', 'kannus = float(input())', 'liters = float(input())'
            ];
            
            const isWaitingForInput = inputIndicators.some(indicator => 
              text.includes(indicator)
            ) || (!text.endsWith('\n') && text.trim().length > 0);
            
            if (isWaitingForInput) {
              cleanup();
              resolve(NextResponse.json({
                output: newOutput,
                sessionId: sessionId,
                waitingForInput: true,
                completed: false
              }));
            }
          };
          
          const errorHandler = (data: Buffer) => {
            newOutput += `Error: ${data.toString('utf8')}`;
            hasNewOutput = true;
          };
          
          const cleanup = () => {
            process.stdout.removeListener('data', outputHandler);
            process.stderr.removeListener('data', errorHandler);
          };
          
          process.stdout.on('data', outputHandler);
          process.stderr.on('data', errorHandler);
          
          // Timeout for serverless environments
          setTimeout(() => {
            cleanup();
            resolve(NextResponse.json({
              output: newOutput || '',
              sessionId: sessionId,
              waitingForInput: hasNewOutput && !newOutput.includes('completed'),
              completed: !hasNewOutput
            }));
          }, 8000);
        });
      } catch (error) {
        activeProcesses.delete(sessionId);
        return NextResponse.json({ 
          error: 'Process communication failed', 
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    }

    // Start new Python execution
    const newSessionId = uuidv4();

    // Python code wrapper
    const tempCode = `
import sys
import os
import io

# Set up UTF-8 encoding and unbuffered output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace', line_buffering=True)

try:
${code.split('\n').map((line: string) => '    ' + line).join('\n')}
except KeyboardInterrupt:
    print("\\n--- Execution interrupted ---")
except Exception as e:
    print(f"Error: {e}")
finally:
    print("\\n--- Execution completed ---")
    sys.stdout.flush()
    sys.stderr.flush()
`;

    return new Promise<NextResponse>((resolve) => {
      const outputBuffer = '';
      const isWaitingForInput = false;
      
      // For Windows, try different Python commands in order
      const pythonCommands = [
        process.env.PYTHON_PATH,
        'python',
        'python3',
        'py',
        'C:\\Python\\python.exe',
        'C:\\Python39\\python.exe',
        'C:\\Python310\\python.exe',
        'C:\\Python311\\python.exe',
        'C:\\Python312\\python.exe'
      ].filter((cmd): cmd is string => Boolean(cmd));
      
      let commandIndex = 0;
      
      const tryPythonCommand = () => {
        if (commandIndex >= pythonCommands.length) {
          activeProcesses.delete(newSessionId);
          resolve(NextResponse.json({
            error: 'Python not available',
            details: 'Python is not installed or not available in the PATH. Please install Python from python.org or Microsoft Store. Tried commands: ' + pythonCommands.join(', ')
          }, { status: 500 }));
          return;
        }
        
        const pythonCmd = pythonCommands[commandIndex];
        commandIndex++;
        
        try {
          const pythonProcess = spawn(pythonCmd, ['-u', '-c', tempCode], {
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { 
              ...process.env, 
              PYTHONIOENCODING: 'utf-8',
              PYTHONUNBUFFERED: '1'
            }
          });

          pythonProcess.on('error', (error: Error) => {
            console.log(`Failed to run ${pythonCmd}:`, error.message);
            // Try next command
            tryPythonCommand();
          });

          pythonProcess.on('spawn', () => {
            // Successfully spawned, set up handlers
            setupProcessHandlers(pythonProcess, newSessionId, resolve, outputBuffer, isWaitingForInput);
          });
        } catch (error) {
          console.log(`Failed to spawn ${pythonCmd}:`, error);
          tryPythonCommand();
        }
      };
      
      tryPythonCommand();
    });

  } catch (error) {
    console.error('Python execution error:', error);
    return NextResponse.json({ 
      error: 'Failed to execute Python code',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function setupProcessHandlers(
  pythonProcess: ReturnType<typeof spawn>, 
  sessionId: string, 
  resolve: (value: NextResponse) => void,
  initialOutput: string,
  initialWaitingState: boolean
) {
  let outputBuffer = initialOutput;
  let isWaitingForInput = initialWaitingState;

  // Store the process
  activeProcesses.set(sessionId, {
    process: pythonProcess,
    startTime: Date.now()
  });
  
  if (pythonProcess.stdout) {
    pythonProcess.stdout.on('data', (data: Buffer) => {
      const text = data.toString('utf8');
      outputBuffer += text;
      
      // Check for input indicators
      const inputIndicators = [
        '?', 'How many', 'Enter', 'What is', 'choice = int(input())',
        'input()', 'kannus = float(input())', 'liters = float(input())'
      ];
      
      const hasInputIndicator = inputIndicators.some(indicator => text.includes(indicator));
      const endsWithoutNewline = !text.endsWith('\n') && text.trim().length > 0;
      
      if (hasInputIndicator || endsWithoutNewline) {
        isWaitingForInput = true;
      }
    });
  }

  if (pythonProcess.stderr) {
    pythonProcess.stderr.on('data', (data: Buffer) => {
      const errorText = data.toString('utf8');
      // Don't process character by character - accumulate the full error message
      outputBuffer += `Error: ${errorText}`;
    });
  }

  pythonProcess.on('close', (code: number) => {
    activeProcesses.delete(sessionId);
    resolve(NextResponse.json({
      output: outputBuffer,
      sessionId: sessionId,
      completed: true,
      exitCode: code
    }));
  });

  // Initial timeout for interactive detection
  setTimeout(() => {
    if (activeProcesses.has(sessionId) && isWaitingForInput) {
      resolve(NextResponse.json({
        output: outputBuffer,
        sessionId: sessionId,
        completed: false,
        waitingForInput: true
      }));
    }
  }, 3000);

  // Final timeout
  setTimeout(() => {
    if (activeProcesses.has(sessionId)) {
      try {
        pythonProcess.kill();
      } catch (error) {
        console.error('Error killing process:', error);
      }
      activeProcesses.delete(sessionId);
      resolve(NextResponse.json({
        output: outputBuffer + '\n--- Execution timeout ---',
        sessionId: sessionId,
        completed: true,
        waitingForInput: false
      }));
    }
  }, 25000);
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (sessionId && activeProcesses.has(sessionId)) {
      const processData = activeProcesses.get(sessionId);
      processData.process.kill();
      activeProcesses.delete(sessionId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error terminating process:', error);
    return NextResponse.json({ error: 'Failed to terminate process' }, { status: 500 });
  }
}
