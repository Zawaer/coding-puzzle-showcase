"use client";

import { useState, useEffect } from 'react';
import PythonExecutor from './PythonExecutor';
import PyodidePythonExecutor from './PyodidePythonExecutor';

interface HybridPythonExecutorProps {
  code: string;
  className?: string;
}

export default function HybridPythonExecutor({ code, className = "" }: HybridPythonExecutorProps) {
  const [useServerSide, setUseServerSide] = useState(true);
  const [serverAvailable, setServerAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    // Test if server-side execution is available
    const testServerSide = async () => {
      try {
        const response = await fetch('/api/execute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code: 'print("test")' }),
        });

        if (response.ok) {
          const result = await response.json();
          if (!result.error) {
            setServerAvailable(true);
            return;
          }
        }
      } catch (error) {
        console.log('Server-side execution not available:', error);
      }
      
      setServerAvailable(false);
      setUseServerSide(false);
    };

    testServerSide();
  }, []);

  if (serverAvailable === null) {
    return (
      <div className={`bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden ${className}`}>
        <div className="p-8 text-center">
          <div className="text-gray-400 mb-2">Checking Python environment...</div>
          <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {serverAvailable && useServerSide ? (
        <div>
          <PythonExecutor code={code} />
          <div className="mt-2 text-xs text-gray-400 text-center">
            Using server-side Python execution. 
            <button 
              onClick={() => setUseServerSide(false)}
              className="ml-2 text-blue-400 hover:text-blue-300 underline"
            >
              Switch to browser-based
            </button>
          </div>
        </div>
      ) : (
        <div>
          <PyodidePythonExecutor code={code} />
          {serverAvailable && (
            <div className="mt-2 text-xs text-gray-400 text-center">
              Using browser-based Python execution. 
              <button 
                onClick={() => setUseServerSide(true)}
                className="ml-2 text-blue-400 hover:text-blue-300 underline"
              >
                Switch to server-side
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
