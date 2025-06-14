// Demo page to showcase the chat functionality
import React, { useState } from 'react';
import { ChatWindow, UsernameManager } from '@/components/chat';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { cn } from '@/lib/utils';

export default function ChatDemoPage() {
  const account = useCurrentAccount();
  const [selectedMarket, setSelectedMarket] = useState('demo-market-1');
  const [showUsernameManager, setShowUsernameManager] = useState(false);

  // Demo markets for testing
  const demoMarkets = [
    { id: 'demo-market-1', name: 'Bitcoin Price Q4 2025' },
    { id: 'demo-market-2', name: 'Ethereum Price Prediction' },
    { id: 'demo-market-3', name: 'SUI Token Performance' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-violet-950 to-purple-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Skepsis Chat System Demo
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Experience real-time chat functionality for prediction markets. 
            Connect your wallet and start chatting with other traders in market-specific channels.
          </p>
        </div>

        {/* Connection Status */}
        <div className="mb-6 p-4 rounded-lg bg-gray-800/60 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-3 h-3 rounded-full",
                account ? "bg-green-500 animate-pulse" : "bg-red-500"
              )} />
              <span className="text-white font-medium">
                {account ? 'Wallet Connected' : 'Wallet Not Connected'}
              </span>
              {account && (
                <span className="text-gray-400 text-sm">
                  {account.address.slice(0, 6)}...{account.address.slice(-4)}
                </span>
              )}
            </div>
            
            {account && (
              <button
                onClick={() => setShowUsernameManager(!showUsernameManager)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors"
              >
                Manage Username
              </button>
            )}
          </div>
        </div>

        {/* Username Manager */}
        {account && showUsernameManager && (
          <div className="mb-6">
            <UsernameManager
              walletAddress={account.address}
              onClaimUsername={async (username) => {
                // Demo implementation - always succeeds for now
                console.log('Claiming username:', username);
                return { success: true };
              }}
              onReleaseUsername={async () => {
                console.log('Releasing username');
              }}
            />
          </div>
        )}

        {/* Market Selector */}
        <div className="mb-6">
          <div className="p-4 rounded-lg bg-gray-800/60 backdrop-blur-md">
            <h2 className="text-white font-medium mb-3">Select Market Chat Room</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {demoMarkets.map((market) => (
                <button
                  key={market.id}
                  onClick={() => setSelectedMarket(market.id)}
                  className={cn(
                    "p-3 rounded-lg text-left transition-colors",
                    selectedMarket === market.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  )}
                >
                  <div className="font-medium">{market.name}</div>
                  <div className="text-xs opacity-75">Market ID: {market.id}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Features Overview */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-gray-800/60 backdrop-blur-md">
            <div className="text-2xl mb-2">💬</div>
            <h3 className="text-white font-medium mb-1">Real-time Messaging</h3>
            <p className="text-gray-400 text-sm">Instant message delivery with Firebase</p>
          </div>
          
          <div className="p-4 rounded-lg bg-gray-800/60 backdrop-blur-md">
            <div className="text-2xl mb-2">👥</div>
            <h3 className="text-white font-medium mb-1">User Presence</h3>
            <p className="text-gray-400 text-sm">See who's online and typing</p>
          </div>
          
          <div className="p-4 rounded-lg bg-gray-800/60 backdrop-blur-md">
            <div className="text-2xl mb-2">🏷️</div>
            <h3 className="text-white font-medium mb-1">Custom Usernames</h3>
            <p className="text-gray-400 text-sm">Claim unique usernames for better UX</p>
          </div>
          
          <div className="p-4 rounded-lg bg-gray-800/60 backdrop-blur-md">
            <div className="text-2xl mb-2">😀</div>
            <h3 className="text-white font-medium mb-1">Reactions & Replies</h3>
            <p className="text-gray-400 text-sm">React and reply to messages</p>
          </div>
        </div>

        {/* Main Chat Interface */}
        <div className="mb-8">
          <div className="h-96 rounded-lg overflow-hidden border border-gray-600">
            {account ? (
              <ChatWindow
                marketId={selectedMarket}
                marketName={demoMarkets.find(m => m.id === selectedMarket)?.name || 'Demo Market'}
                position="relative"
                showUserList={true}
                className="h-full"
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-800/60 backdrop-blur-md">
                <div className="text-center">
                  <div className="text-6xl mb-4">🔒</div>
                  <h3 className="text-white font-medium mb-2">Connect Your Wallet</h3>
                  <p className="text-gray-400 text-sm max-w-md">
                    Please connect your wallet to access the chat functionality. 
                    Your wallet address will be used as your unique identifier.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Technical Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-lg bg-gray-800/60 backdrop-blur-md">
            <h2 className="text-white font-medium mb-4">🔧 Technical Implementation</h2>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>• Firebase Firestore for real-time message storage</li>
              <li>• Wallet-based authentication system</li>
              <li>• Market-specific chat rooms</li>
              <li>• Typing indicators and user presence</li>
              <li>• Message reactions and replies</li>
              <li>• Username claiming system</li>
            </ul>
          </div>
          
          <div className="p-6 rounded-lg bg-gray-800/60 backdrop-blur-md">
            <h2 className="text-white font-medium mb-4">🚀 Production Features</h2>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>• Message moderation and safety filters</li>
              <li>• Notification system for mentions</li>
              <li>• Chat history and search</li>
              <li>• Rich text formatting support</li>
              <li>• File sharing capabilities</li>
              <li>• Admin controls and permissions</li>
            </ul>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 p-4 rounded-lg bg-blue-900/20 border border-blue-600/20">
          <div className="flex items-start gap-3">
            <div className="text-blue-400 text-xl">ℹ️</div>
            <div>
              <h3 className="text-blue-300 font-medium mb-1">Demo Mode</h3>
              <p className="text-blue-200/80 text-sm">
                This is a demonstration of the chat system. In production, all features would be 
                fully functional with Firebase backend integration. Messages and usernames are 
                currently simulated for demo purposes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
