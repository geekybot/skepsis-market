import React from 'react';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { useLiquidityShares } from '@/hooks/useLiquidityShares';
import { useMarketLiquidityInfo } from '@/hooks/useMarketLiquidityInfo';
import { useMarketService } from '@/hooks/useMarketService';
import CacheManager from '@/components/debug/CacheManager';
import { useOptimizedMultipleMarketsInfo } from '@/hooks/useOptimizedMarketInfo';
import { MARKETS } from '@/constants/appConstants';

const DebugPage = () => {
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const client = useSuiClient();
  const account = useCurrentAccount();
  
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Safely wrapped hooks to prevent crashes
  const sharesResult = useSafeHook(() => useLiquidityShares(client, refreshTrigger), 'useLiquidityShares');
  const marketInfo = useSafeHook(() => useMarketLiquidityInfo(client, refreshTrigger), 'useMarketLiquidityInfo');
  const marketService = useSafeHook(() => useMarketService(), 'useMarketService');
  
  useEffect(() => {
    addLog('Page mounted - starting diagnostics');
    
    // Log wallet connection status
    addLog(`Wallet connected: ${account ? 'Yes' : 'No'}`);
    if (account) {
      addLog(`Wallet address: ${account.address.slice(0, 10)}...`);
    }
    
    // Check hooks data
    if (sharesResult.error) {
      addError(`Shares hook error: ${sharesResult.error}`);
    }
    
    if (marketInfo.error) {
      addError(`Market info hook error: ${marketInfo.error}`);
    }
    
    if (!marketService.value) {
      addError('Market service hook not initialized');
    }
    
    // Check loading status
    addLog(`Shares loading: ${sharesResult.value?.loading ? 'Yes' : 'No'}`);
    addLog(`Markets loading: ${marketInfo.value?.loading ? 'Yes' : 'No'}`);
    
    // Log summary of market data
    if (marketInfo.value?.markets) {
      addLog(`Found ${marketInfo.value.markets.length} markets`);
    }
    
    // Log summary of shares data
    if (sharesResult.value?.allShares) {
      addLog(`Found ${sharesResult.value.allShares.length} share positions`);
    }
  }, [account, sharesResult, marketInfo, marketService]);
  
  function addLog(message: string) {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  }
  
  function addError(message: string) {
    setErrorMessages(prev => [...prev, message]);
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ERROR: ${message}`]);
  }
  
  function clearLogs() {
    setLogs([]);
    setErrorMessages([]);
  }
  
  function refreshData() {
    addLog('Manual refresh triggered');
    setRefreshTrigger(Date.now());
  }
  
  function useSafeHook<T>(hookFn: () => T, hookName: string): { value: T | null, error: string | null } {
    const [result, setResult] = useState<{ value: T | null, error: string | null }>({
      value: null,
      error: null
    });
    
    useEffect(() => {
      try {
        const hookResult = hookFn();
        setResult({ value: hookResult, error: null });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setResult({ value: null, error: errorMessage });
        console.error(`Error in ${hookName}:`, err);
      }
    }, [hookName]);
    
    return result;
  }
  
  return (
    <>
      <Head>
        <title>Skepsis Debug</title>
        <meta name="description" content="Debug page for Skepsis application" />
      </Head>
      
      <Header />
      
      <main className="min-h-screen bg-gray-900 text-white p-8 pt-20">
        <h1 className="text-3xl font-bold mb-4">Skepsis Application Debug</h1>
        
        <div className="grid grid-cols-1 gap-4 mb-8">
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-2">Diagnostics</h2>
            <button
              onClick={refreshData}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md mr-2 mb-4"
            >
              Manual Refresh
            </button>
            <button
              onClick={clearLogs}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md mb-4"
            >
              Clear Logs
            </button>
          </div>

          {errorMessages.length > 0 && (
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-2">Errors</h2>
              <ul className="list-disc pl-6">
                {errorMessages.map((error, i) => (
                  <li key={i} className="text-red-300 mb-1">{error}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-2">Logs</h2>
            <div className="bg-gray-900 p-4 rounded-md h-80 overflow-y-auto font-mono text-sm">
              {logs.map((log, i) => (
                <div key={i} className="mb-1">{log}</div>
              ))}
              {logs.length === 0 && <div className="text-gray-400">No logs yet</div>}
            </div>
          </div>
        </div>
        
        {/* Cache Performance Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Cache Performance Monitor</h2>
          <CacheManager />
        </div>
        
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Navigation</h2>
          <div className="flex gap-4">
            <a href="/" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md">
              Home
            </a>
            <a href="/liquidity" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md">
              Liquidity Page
            </a>
            <a href="/prediction" className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md">
              Prediction Page
            </a>
            <a href="/test" className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-md">
              Test Page
            </a>
          </div>
        </div>
        <Footer />
      </main>
    </>
  );
};

export default DebugPage;
