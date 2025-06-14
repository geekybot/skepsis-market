import React, { useState, useEffect } from 'react';
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import { useChat } from '@/components/chat/useChat';

export default function ChatDebugPage() {
  const account = useCurrentAccount();
  const [logs, setLogs] = useState<string[]>([]);
  
  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-20), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const {
    isLoading,
    isConnected,
    error,
    currentUser,
    onlineUsers,
    messages,
    connect,
    disconnect
  } = useChat({
    marketId: 'debug-market-123',
    messageLimit: 10
  });

  useEffect(() => {
    addLog(`Account changed: ${account?.address || 'none'}`);
  }, [account]);

  useEffect(() => {
    addLog(`Connection status: ${isConnected ? 'connected' : 'disconnected'}`);
  }, [isConnected]);

  useEffect(() => {
    addLog(`Loading status: ${isLoading ? 'loading' : 'idle'}`);
  }, [isLoading]);

  useEffect(() => {
    if (error) {
      addLog(`Error: ${error}`);
    }
  }, [error]);

  useEffect(() => {
    if (currentUser) {
      addLog(`Current user set: ${currentUser.displayName}`);
    }
  }, [currentUser]);

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Chat Debug Page</h1>
      
      {/* Connection Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <h2 className="text-lg font-semibold mb-2">Connection Status</h2>
          <div className="space-y-2 text-sm">
            <div>Wallet: {account?.address ? 'Connected' : 'Not connected'}</div>
            <div>Chat Loading: {isLoading ? 'Yes' : 'No'}</div>
            <div>Chat Connected: {isConnected ? 'Yes' : 'No'}</div>
            <div>Error: {error || 'None'}</div>
            <div>Current User: {currentUser?.displayName || 'None'}</div>
            <div>Online Users: {onlineUsers.length}</div>
            <div>Messages: {messages.length}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <h2 className="text-lg font-semibold mb-2">Controls</h2>
          <div className="space-y-2">
            <ConnectButton />
            {account && (
              <div className="space-y-2">
                <button 
                  onClick={connect}
                  disabled={isLoading || isConnected}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
                >
                  Manual Connect
                </button>
                <button 
                  onClick={disconnect}
                  disabled={!isConnected}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded disabled:bg-gray-400"
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Debug Logs */}
      <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Debug Logs</h2>
        <div className="bg-black text-green-400 p-3 rounded font-mono text-xs h-64 overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
        </div>
        <button 
          onClick={() => setLogs([])}
          className="mt-2 px-3 py-1 bg-gray-600 text-white rounded text-sm"
        >
          Clear Logs
        </button>
      </div>
    </div>
  );
}
