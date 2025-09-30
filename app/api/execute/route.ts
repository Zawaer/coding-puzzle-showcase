import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';

// Store active Python processes
const activeProcesses = new Map();

export async function POST(request: NextRequest) {
  try {
    const { code, input, sessionId } = await request.json();

    if (!code && !input) {
      return NextResponse.json({ error: 'Code or input required' }, { status: 400 });
    }

    // If this is input for an existing session
    if (input && sessionId && activeProcesses.has(sessionId)) {
      const processData = activeProcesses.get(sessionId);
      const process = processData.process;
      
      // Send input to the process
      process.stdin.write(input + '\n');
      
      // Return a promise that waits for new output
      return new Promise<NextResponse>((resolve) => {
        const startTime = Date.now();
        let newOutput = '';
        let hasNewOutput = false;
        
        // Create a temporary handler for this input cycle
        const outputHandler = (data: Buffer) => {
          const text = data.toString('utf8');
          newOutput += text;
          hasNewOutput = true;
          
          // Check if now waiting for more input
          const lines = (newOutput || text).split('\n');
          const lastLine = lines[lines.length - 1] || '';
          const secondLastLine = lines[lines.length - 2] || '';
          
          // More comprehensive input detection
          const inputIndicators = [
            'How many',
            'Enter',
            'What is',
            '?',
            'choice = int(input())',
            'input()',
            'kannus = float(input())',
            'liters = float(input())'
          ];
          
          const hasInputIndicator = inputIndicators.some(indicator => 
            text.includes(indicator) || 
            lastLine.includes(indicator) || 
            secondLastLine.includes(indicator)
          );
          
          // Check for menu patterns
          const hasMenuPattern = /\d+\)\s/.test(text) || /\d+\)\s/.test(newOutput);
          const endsWithoutNewline = !text.endsWith('\n') && text.trim().length > 0;
          
          const isWaitingForInput = hasInputIndicator || endsWithoutNewline || 
                                   (hasMenuPattern && (lastLine.trim() === '' || secondLastLine.trim() === ''));
          
          // If we detect input prompt, respond immediately
          if (isWaitingForInput) {
            process.stdout.removeListener('data', outputHandler);
            process.stderr.removeListener('data', errorHandler);
            
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
        
        // Add temporary listeners
        process.stdout.on('data', outputHandler);
        process.stderr.on('data', errorHandler);
        
        // Check periodically for output
        const checkOutput = () => {
          if (hasNewOutput) {
            // Wait a bit more to see if there's additional output
            setTimeout(() => {
              process.stdout.removeListener('data', outputHandler);
              process.stderr.removeListener('data', errorHandler);
              
              const lines = newOutput.split('\n');
              const lastLine = lines[lines.length - 1] || '';
              const secondLastLine = lines[lines.length - 2] || '';
              
              // More comprehensive input detection
              const inputIndicators = [
                'How many',
                'Enter',
                'What is',
                '?',
                'choice = int(input())',
                'input()',
                'kannus = float(input())',
                'liters = float(input())'
              ];
              
              const hasInputIndicator = inputIndicators.some(indicator => 
                newOutput.includes(indicator) || 
                lastLine.includes(indicator) || 
                secondLastLine.includes(indicator)
              );
              
              const hasMenuPattern = /\d+\)\s/.test(newOutput);
              const endsWithoutNewline = newOutput.length > 0 && !newOutput.endsWith('\n');
              
              const isWaitingForInput = hasInputIndicator || endsWithoutNewline || 
                                       (hasMenuPattern && (lastLine.trim() === '' || secondLastLine.trim() === ''));
              
              resolve(NextResponse.json({
                output: newOutput,
                sessionId: sessionId,
                waitingForInput: isWaitingForInput,
                completed: false
              }));
            }, 500);
          } else if (Date.now() - startTime > 3000) {
            // Timeout - assume program is done or waiting
            process.stdout.removeListener('data', outputHandler);
            process.stderr.removeListener('data', errorHandler);
            
            resolve(NextResponse.json({
              output: newOutput || '',
              sessionId: sessionId,
              waitingForInput: false,
              completed: true
            }));
          } else {
            // Check again
            setTimeout(checkOutput, 200);
          }
        };
        
        // Start checking after a short delay
        setTimeout(checkOutput, 100);
      });
    }

    // Start new Python execution
    const newSessionId = uuidv4();
    let isWaitingForInput = false;

    // Create a temporary Python file
    const tempCode = `
import sys
import os
import io

# Set up UTF-8 encoding for output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

try:
${code.split('\n').map((line: string) => '    ' + line).join('\n')}
except Exception as e:
    print(f"Error: {e}")
finally:
    print("\\n--- Execution completed ---")
`;

    return new Promise<NextResponse>((resolve) => {
      let outputBuffer = '';
      
    const pythonProcess = spawn('python', ['-u', '-c', tempCode], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { 
        ...process.env, 
        PYTHONIOENCODING: 'utf-8',
        PYTHONUNBUFFERED: '1'
      }
    });      pythonProcess.on('error', (error) => {
        activeProcesses.delete(newSessionId);
        resolve(NextResponse.json({
          error: 'Python not found. Please make sure Python is installed and available in your system PATH.',
          details: error.message
        }, { status: 500 }));
        return;
      });

      // Store the process with metadata
      activeProcesses.set(newSessionId, {
        process: pythonProcess,
        startTime: Date.now()
      });
      
      pythonProcess.stdout.on('data', (data) => {
        const text = data.toString('utf8');
        outputBuffer += text;
        
        // Check if waiting for input - improved detection
        const lines = outputBuffer.split('\n');
        const lastLine = lines[lines.length - 1] || '';
        const secondLastLine = lines[lines.length - 2] || '';
        
        // More comprehensive input detection
        const inputIndicators = [
          '?',
          'How many',
          'Enter',
          'What is',
          'choice = int(input())',
          'input()',
          'kannus = float(input())',
          'liters = float(input())'
        ];
        
        const hasInputIndicator = inputIndicators.some(indicator => 
          text.includes(indicator) || 
          lastLine.includes(indicator) || 
          secondLastLine.includes(indicator)
        );
        
        // Also check if the output ends without a newline (common for input prompts)
        const endsWithoutNewline = !text.endsWith('\n') && text.trim().length > 0;
        
        // Check for menu patterns (numbers followed by closing parenthesis)
        const hasMenuPattern = /\d+\)\s/.test(outputBuffer);
        
        if (hasInputIndicator || endsWithoutNewline || 
            (hasMenuPattern && (lastLine.trim() === '' || secondLastLine.trim() === ''))) {
          isWaitingForInput = true;
        }
      });

      pythonProcess.stderr.on('data', (data) => {
        outputBuffer += `Error: ${data.toString('utf8')}`;
      });

      pythonProcess.on('close', (code) => {
        activeProcesses.delete(newSessionId);
        resolve(NextResponse.json({
          output: outputBuffer,
          sessionId: newSessionId,
          completed: true,
          exitCode: code
        }));
      });

      // For interactive programs, return early if waiting for input
      setTimeout(() => {
        if (activeProcesses.has(newSessionId) && isWaitingForInput) {
          resolve(NextResponse.json({
            output: outputBuffer,
            sessionId: newSessionId,
            completed: false,
            waitingForInput: true
          }));
        }
      }, 2000);

      // Final timeout for non-interactive programs
      setTimeout(() => {
        if (activeProcesses.has(newSessionId)) {
          resolve(NextResponse.json({
            output: outputBuffer,
            sessionId: newSessionId,
            completed: false,
            waitingForInput: isWaitingForInput
          }));
        }
      }, 10000);
    });

  } catch (error) {
    console.error('Python execution error:', error);
    return NextResponse.json({ 
      error: 'Failed to execute Python code',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
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
