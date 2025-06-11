import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Header from '@/components/header';
import { useContext } from 'react';
import { AppContext } from '@/context/AppContext';
import { User, TrendingUp, PieChart, Clock, Wallet, Star } from 'lucide-react';
import Link from 'next/link';

const DashboardPage: NextPage = () => {
  const { walletAddress, suiName } = useContext(AppContext);

  // Get shortened wallet address for display
  const shortenedAddress = walletAddress ? 
    `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}` : 
    'Connect wallet';

  return (
    <>
      <Head>
        <title>User Dashboard - Skepsis</title>
        <meta name="description" content="Skepsis user dashboard - Coming soon" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Header with wallet connection */}
      <Header />

      <main className="min-h-screen flex flex-col px-6 py-8 max-w-7xl mx-auto pt-24">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-violet-600 rounded-full mb-6">
            <User size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">User Dashboard</h1>
          <p className="text-xl text-white/70 mb-2">
            Your personalized trading hub is coming soon
          </p>
          {walletAddress && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800/60 rounded-lg border border-white/10">
              <Wallet size={16} className="text-blue-400" />
              <span className="text-white/80 text-sm">
                {suiName || shortenedAddress}
              </span>
            </div>
          )}
        </div>

        {/* Coming Soon Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Portfolio Overview */}
          <div className="bg-gray-800/40 backdrop-blur-lg rounded-xl border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <PieChart size={20} className="text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Portfolio Overview</h3>
            </div>
            <p className="text-white/60 text-sm mb-4">
              Track your total positions, profit/loss, and portfolio performance across all markets.
            </p>
            <div className="flex items-center gap-2 text-xs text-blue-400">
              <Clock size={12} />
              <span>Coming Soon</span>
            </div>
          </div>

          {/* Trading History */}
          <div className="bg-gray-800/40 backdrop-blur-lg rounded-xl border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
                <TrendingUp size={20} className="text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Trading History</h3>
            </div>
            <p className="text-white/60 text-sm mb-4">
              View detailed history of all your trades, including timestamps, amounts, and outcomes.
            </p>
            <div className="flex items-center gap-2 text-xs text-green-400">
              <Clock size={12} />
              <span>Coming Soon</span>
            </div>
          </div>

          {/* Favorite Markets */}
          <div className="bg-gray-800/40 backdrop-blur-lg rounded-xl border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-600/20 rounded-lg flex items-center justify-center">
                <Star size={20} className="text-yellow-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Favorite Markets</h3>
            </div>
            <p className="text-white/60 text-sm mb-4">
              Save and quickly access your most traded and watched prediction markets.
            </p>
            <div className="flex items-center gap-2 text-xs text-yellow-400">
              <Clock size={12} />
              <span>Coming Soon</span>
            </div>
          </div>
        </div>

        {/* Current Status */}
        <div className="bg-gradient-to-br from-indigo-900/50 to-violet-900/50 backdrop-blur-lg rounded-xl border border-indigo-800/30 p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            We're Building Something Amazing
          </h2>
          <p className="text-white/70 text-lg mb-6 max-w-2xl mx-auto">
            Our team is hard at work creating a comprehensive dashboard that will give you complete 
            visibility into your trading performance, portfolio analytics, and market insights.
          </p>
          
          {/* Feature Timeline */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-400 mb-2">Q3 2025</div>
              <div className="text-sm text-white/80">Portfolio Analytics</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-400 mb-2">Q4 2025</div>
              <div className="text-sm text-white/80">Advanced Trading Tools</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-400 mb-2">Q1 2026</div>
              <div className="text-sm text-white/80">Social Features</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/prediction"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <TrendingUp size={16} />
              Start Trading Now
            </Link>
            <Link 
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-700/60 hover:bg-gray-600/70 text-white font-medium rounded-lg border border-white/10 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>

        {/* Stay Updated Section */}
        <div className="mt-12 text-center">
          <p className="text-white/60 mb-4">
            Want to be notified when the dashboard launches?
          </p>
          <div className="bg-gray-800/40 backdrop-blur-lg rounded-lg border border-white/10 p-6 max-w-md mx-auto">
            <p className="text-white/80 text-sm mb-3">
              Follow our progress and get updates on new features
            </p>
            <div className="flex gap-3 justify-center">
              <a 
                href="https://twitter.com/skepsis_market" 
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-sm transition-colors"
              >
                Twitter
              </a>
              <a 
                href="https://discord.gg/skepsis" 
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded-lg text-sm transition-colors"
              >
                Discord
              </a>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default DashboardPage;
