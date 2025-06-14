import { useEffect, useState } from 'react';
import { testFirebaseConnection } from '../test/firebase-test';

export default function FirebaseTestPage() {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const runTest = async () => {
    setIsLoading(true);
    setTestResult('Running Firebase connection test...');
    
    try {
      // Capture console output
      const originalLog = console.log;
      const originalError = console.error;
      let output = '';
      
      console.log = (...args) => {
        output += args.join(' ') + '\n';
        originalLog(...args);
      };
      
      console.error = (...args) => {
        output += 'ERROR: ' + args.join(' ') + '\n';
        originalError(...args);
      };
      
      await testFirebaseConnection();
      
      // Restore console
      console.log = originalLog;
      console.error = originalError;
      
      setTestResult(output);
    } catch (error) {
      setTestResult(`Test failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Firebase Connection Test</h1>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
          <button
            onClick={runTest}
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            {isLoading ? 'Running Test...' : 'Run Firebase Test'}
          </button>
        </div>
        
        {testResult && (
          <div className="bg-black/30 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-white mb-2">Test Results:</h2>
            <pre className="text-green-300 text-sm whitespace-pre-wrap font-mono">
              {testResult}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
