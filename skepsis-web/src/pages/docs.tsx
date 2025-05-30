import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import Header from "@/components/header";
import Footer from "@/components/footer";
import Head from "next/head";
import Link from "next/link";
import { BookOpen, FileText, Users, Code, ArrowRight } from "lucide-react";
import { useState } from "react";

const inter = Inter({ subsets: ["latin"] });

export default function DocsPage() {
  // Keep track of the active doc section
  const [activeSection, setActiveSection] = useState("overview");

  const sections = [
    { 
      id: "overview", 
      title: "Overview", 
      icon: <BookOpen size={20} />,
      description: "Core concepts and introduction to Skepsis",
      content: (
        <div className="prose prose-invert max-w-none">
          <h2 className="text-2xl font-bold mb-4">Skepsis Platform Overview</h2>
          <p className="text-white/80 mb-4">
            Skepsis is a decentralized prediction market platform built on the Sui blockchain 
            that enables users to express nuanced beliefs about future events through continuous 
            numerical outcomes. Unlike traditional prediction markets that only offer binary yes/no 
            outcomes, Skepsis allows trading on distributions across a range of possible outcomes.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
            <div className="p-4 bg-indigo-900/20 rounded-lg border border-indigo-800/30">
              <h4 className="font-semibold text-lg mb-2">Why Continuous Outcomes?</h4>
              <p className="text-white/80 text-sm">
                Traditional prediction markets only allow binary yes/no bets, but reality is rarely binary.
                Continuous outcome markets enable predictions across a spectrum of possibilities, providing
                more nuanced and accurate forecasts.
              </p>
            </div>
            <div className="p-4 bg-indigo-900/20 rounded-lg border border-indigo-800/30">
              <h4 className="font-semibold text-lg mb-2">Why Skepsis?</h4>
              <p className="text-white/80 text-sm">
                Skepsis combines the power of blockchain technology with advanced market mechanisms to create
                a platform that is secure, transparent, and efficient. Our innovative approach to prediction
                markets opens new possibilities for forecasting and risk assessment.
              </p>
            </div>
          </div>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Key Features</h3>
          <ul className="list-disc pl-5 text-white/80 space-y-2">
            <li>
              <span className="font-medium text-white">Continuous Outcome Markets:</span> Trade on a range 
              of possible outcomes rather than just binary yes/no options
            </li>
            <li>
              <span className="font-medium text-white">LMSR Mechanism:</span> Automated market making with 
              infinite liquidity and efficient price discovery
            </li>
            <li>
              <span className="font-medium text-white">Spread Metadata System:</span> Enhanced user experience 
              with meaningful labels and descriptions
            </li>
            <li>
              <span className="font-medium text-white">Sui Blockchain Integration:</span> Fast, low-cost 
              transactions on a high-performance blockchain
            </li>
          </ul>
          
          <div className="p-5 bg-gradient-to-br from-indigo-900/40 to-indigo-800/20 rounded-lg border border-indigo-600/30 mt-8 mb-6 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-300">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <path d="M14 2v6h6"></path>
                <path d="M16 13H8"></path>
                <path d="M16 17H8"></path>
                <path d="M10 9H8"></path>
              </svg>
              <h3 className="text-xl font-bold text-white">Whitepaper</h3>
            </div>
            <p className="text-white/80 mb-3">
              Dive deeper into the technical details of Skepsis with our comprehensive whitepaper. 
              Learn about the mathematical foundations, LMSR mechanisms, and continuous outcome market design.
            </p>
            <div className="flex items-center mt-4">
              <Link
                href="/whitepaper.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600/40 hover:bg-indigo-600/60 rounded-lg text-white font-medium transition-all"
              >
                <span>Read the Whitepaper</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </Link>
            </div>
          </div>

          <h3 className="text-xl font-semibold mt-6 mb-3">Platform Capabilities</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-indigo-500/20 rounded-full p-2 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-300"><path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"></path><path d="M12 10c1-.56 2.78-2 5-2a4.9 4.9 0 0 1 5 4.78"></path></svg>
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">Market Creation</h4>
                <p className="text-sm text-white/70">Create custom prediction markets with flexible parameters and resolution criteria</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-indigo-500/20 rounded-full p-2 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-300"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">Price Discovery</h4>
                <p className="text-sm text-white/70">Efficient price discovery through the LMSR automated market maker</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-indigo-500/20 rounded-full p-2 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-300"><path d="m9 11 3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">Liquidity Provision</h4>
                <p className="text-sm text-white/70">Earn fees by providing liquidity to markets</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-indigo-500/20 rounded-full p-2 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-300"><path d="M21 9V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3"></path><path d="M3 16c0 2 2 3 3 3h12c1 0 3-1 3-3"></path><path d="M12 7v9"></path><path d="M15 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"></path><path d="M9 10a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"></path><path d="M12.02 16.93c-.8-.8-2.18-1.36-3.53-1.4-1.96-.06-3.38 1.07-3.45 1.13-.7.07.27.31.97.31H18c.7 0 1.68-.24.97-.31-.07-.06-1.5-1.19-3.45-1.13-1.04.03-2.19.41-3 1.13"></path></svg>
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">Communities</h4>
                <p className="text-sm text-white/70">Join market-specific communities to discuss and analyze predictions</p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-indigo-900/30 rounded-lg border border-indigo-800/50">
            <h4 className="text-lg font-semibold mb-2">Getting Started</h4>
            <p className="text-white/80 mb-3">
              New to Skepsis? Our comprehensive guides will help you get started:
            </p>
            <div className="flex flex-col space-y-2">
              <button 
                onClick={() => setActiveSection("user-guide")}
                className="flex items-center text-indigo-400 hover:text-indigo-300 font-medium underline underline-offset-2"
              >
                <span>User Guide</span>
                <ArrowRight size={14} className="ml-1" />
              </button>
              <button 
                onClick={() => setActiveSection("technical-guide")}
                className="flex items-center text-indigo-400 hover:text-indigo-300 font-medium underline underline-offset-2"
              >
                <span>Technical Guide</span>
                <ArrowRight size={14} className="ml-1" />
              </button>
              <Link 
                href="/whitepaper.pdf" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center text-indigo-400 hover:text-indigo-300 font-medium underline underline-offset-2"
              >
                <span>Whitepaper</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      )
    },
    { 
      id: "user-guide", 
      title: "User Guide", 
      icon: <Users size={20} />,
      description: "How to use the Skepsis platform",
      content: (
        <div className="prose prose-invert max-w-none">
          <h2 className="text-2xl font-bold mb-4">Skepsis User Guide</h2>
          <p className="text-white/80 mb-4">
            This guide will walk you through the basic steps to get started with the Skepsis platform and how to effectively use its features.
          </p>
          
          <figure className="my-6 border border-indigo-800/30 rounded-lg overflow-hidden">
            <img 
              src="/examples/Screenshot 2025-05-30 at 1.32.17 AM.png" 
              alt="Skepsis Platform Interface" 
              className="w-full h-auto rounded-lg"
            />
            <figcaption className="text-xs text-center mt-2 pb-2 text-white/50">
              Skepsis platform interface showing a prediction market
            </figcaption>
          </figure>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Getting Started</h3>
          <ol className="list-decimal pl-5 text-white/80 space-y-4">
            <li>
              <span className="font-medium text-white">Connect your wallet</span>
              <p className="mt-1">
                Click on the "Connect Wallet" button in the top-right corner of the page and select your Sui wallet. 
                Skepsis supports Sui Wallet, Ethos Wallet, and other major Sui-compatible wallets.
              </p>
              
              <div className="mt-3 mb-4 bg-indigo-950/30 p-3 rounded-lg border border-indigo-900/50">
                <p className="text-sm text-white/70 italic">Once connected, you'll see your wallet address and SUI balance in the header.</p>
              </div>
            </li>
            <li>
              <span className="font-medium text-white">Get test tokens from the faucet</span>
              <p className="mt-1">
                Visit the <Link href="/faucet" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">Faucet</Link> page 
                to get test USDC tokens that you can use to participate in prediction markets.
              </p>
            </li>
            <li>
              <span className="font-medium text-white">Browse prediction markets</span>
              <p className="mt-1">
                Navigate to the <Link href="/prediction" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">Prediction Markets</Link> page 
                to see active markets. Each market represents a question about a future event with a continuous range of possible outcomes.
              </p>
            </li>
            <li>
              <span className="font-medium text-white">Place trades</span>
              <p className="mt-1">
                Select a market and use the trading interface to express your belief about the outcome. 
                You can buy or sell shares across different sections of the outcome range.
              </p>
            </li>
          </ol>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Understanding Market Types</h3>
          <p className="text-white/80 mb-4">
            Skepsis supports continuous outcome markets, which allow for predictions across a range of possible values:
          </p>
          
          <div className="space-y-4">
            <div className="p-4 bg-indigo-900/20 rounded-lg border border-indigo-800/30">
              <h4 className="text-lg font-semibold mb-2">Price Prediction Markets</h4>
              <p className="text-white/80">
                Example: "Will Bitcoin price exceed $100,000 by end of 2025?"
              </p>
              <p className="text-white/70 mt-1">
                In this market:
              </p>
              <ul className="list-disc pl-5 text-white/70 mt-1">
                <li>The outcome space is divided into spreads (e.g., $0-10k, $10k-25k, etc.)</li>
                <li>Each spread is marked with the label of a spread (e.g., $0-10k, $10k-25k, etc.)</li>
                <li>You can buy shares in the spread(s) that match your prediction</li>
              </ul>
            </div>
            
            <div className="p-4 bg-indigo-900/20 rounded-lg border border-indigo-800/30">
              <h4 className="text-lg font-semibold mb-2">Temperature Markets</h4>
              <p className="text-white/80">
                Example: "What will be temperature in Celsius of Bengaluru on May 27, 2025 2 AM?"
              </p>
              <p className="text-white/70 mt-1">
                In this market:
              </p>
              <ul className="list-disc pl-5 text-white/70 mt-1">
                <li>Spreads might represent temperature ranges (e.g., 0-10°C, 10-20°C, etc.)</li>
                <li>Labels provide context (e.g., "Cold", "Mild", "Hot", etc.)</li>
              </ul>
            </div>
          </div>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Trading on Markets</h3>
          
          <div className="space-y-2 text-white/80">
            <h4 className="text-lg font-semibold text-white">Reading Market Information</h4>
            <p>
              The market page provides comprehensive information:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="text-white font-medium">Question:</span> The specific question the market is predicting</li>
              <li><span className="text-white font-medium">Status:</span> Whether the market is active, pending resolution, or resolved</li>
              <li><span className="text-white font-medium">Timing:</span> Deadlines for bidding and resolution</li>
              <li><span className="text-white font-medium">Distribution:</span> Visual representation of the current probability distribution</li>
              <li><span className="text-white font-medium">Spreads:</span> The available prediction ranges with their current prices and probabilities</li>
            </ul>
            
            <figure className="my-4 p-3 bg-indigo-950/30 rounded-lg border border-indigo-900/50">
              <div className="p-3 bg-indigo-950/50 rounded">
                <div className="text-sm text-center text-white/60">Example Market Information Display</div>
              </div>
              <figcaption className="text-xs text-center mt-2 text-white/50">Visualization showing the market's probability distribution</figcaption>
            </figure>
            
            <h4 className="text-lg font-semibold text-white mt-6">Making Predictions</h4>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                <span className="font-medium text-white">Select a Spread:</span> Click on the spread that represents your prediction
                <ul className="list-disc pl-5 mt-1 text-white/70 text-sm">
                  <li>Spread selection highlights your chosen range</li>
                  <li>You can view detailed metadata by hovering over spreads</li>
                </ul>
              </li>
              <li>
                <span className="font-medium text-white">Buy/Sell Selection:</span> Select whether you want to buy or sell shares
              </li>
              <li>
                <span className="font-medium text-white">Enter Amount:</span> Specify how many shares you want to buy or sell
              </li>
              <li>
                <span className="font-medium text-white">Confirm Transaction:</span> Click the "Buy" or "Sell" button and approve in your wallet
              </li>
            </ol>
          </div>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Market Resolution & Rewards</h3>
          <p className="text-white/80 mb-3">
            When a market's resolution time arrives:
          </p>
          <ol className="list-decimal pl-5 text-white/80 space-y-1">
            <li>The actual outcome is determined based on the resolution criteria</li>
            <li>The market state changes to "Resolved"</li>
            <li>The winning spread is identified (the one containing the actual outcome)</li>
            <li>If you hold positions in the winning spread, you can claim your rewards</li>
          </ol>
          
          <div className="mt-6 p-4 bg-indigo-900/30 rounded-lg border border-indigo-800/50">
            <h4 className="text-lg font-semibold mb-2">Advanced Features</h4>
            <p className="text-white/80 mb-3">
              Advanced users can access additional features:
            </p>
            <ul className="list-disc pl-5 text-white/80 space-y-2">
              <li>
                <span className="font-medium text-white">Providing Liquidity:</span> Visit the <Link href="/liquidity" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">Liquidity</Link> page 
                to provide liquidity to markets and earn trading fees.
              </li>
              <li>
                <span className="font-medium text-white">Market Information:</span> Review detailed resolution criteria, spread legends, and market timing.
              </li>
              <li>
                <span className="font-medium text-white">Spread Metadata:</span> Use the enhanced spread metadata to understand the market context better.
              </li>
            </ul>
          </div>
        </div>
      )
    },
    { 
      id: "technical-guide", 
      title: "Technical Guide", 
      icon: <FileText size={20} />,
      description: "How continuous outcome markets work",
      content: (
        <div className="prose prose-invert max-w-none">
          <h2 className="text-2xl font-bold mb-4">Continuous Outcome Markets</h2>
          <p className="text-white/80 mb-4">
            Skepsis implements a novel approach to prediction markets that allows trading on continuous numerical outcomes rather than just binary options.
            This technical guide explains the key concepts behind Skepsis' implementation.
          </p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">LMSR Implementation</h3>
          <p className="text-white/80 mb-4">
            Skepsis uses the Logarithmic Market Scoring Rule (LMSR) automated market maker, extended to work with continuous outcome spaces. 
            The LMSR provides several key benefits:
          </p>
          <ul className="list-disc pl-5 text-white/80 space-y-1">
            <li>Infinite liquidity (trades can always be executed)</li>
            <li>Efficient price discovery reflecting all available information</li>
            <li>No counterparty required (trades are against the automated market maker)</li>
            <li>Mathematical guarantees on market maker loss bounds</li>
          </ul>
          
          <div className="mt-6 p-4 bg-indigo-900/30 rounded-lg border border-indigo-800/50">
            <h4 className="text-lg font-semibold mb-2">Key Formula</h4>
            <p className="text-white/80 mb-2">
              The LMSR cost function is defined as:
            </p>
            <p className="bg-indigo-950/50 p-2 rounded-md font-mono text-sm text-white/90">
              C(q) = b * log(Σ e^(q_i/b))
            </p>
            <p className="text-white/80 mt-2">
              where q is the quantity vector and b is the liquidity parameter.
            </p>
            <p className="text-white/70 mt-2">
              The price of outcome i is calculated as:
            </p>
            <p className="bg-indigo-950/50 p-2 rounded-md font-mono text-sm text-white/90">
              p_i = e^(q_i/b) / Σ(e^(q_j/b))
            </p>
          </div>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Spread Discretization</h3>
          <p className="text-white/80 mb-4">
            Continuous outcomes are divided into discrete spreads or bins:
          </p>
          <ol className="list-decimal pl-5 text-white/80 space-y-1">
            <li>Each market defines a lower and upper bound for the outcome space</li>
            <li>This range is divided into a fixed number of equal-sized spreads</li>
            <li>Each spread is assigned an index (0 to n-1) for reference</li>
            <li>Each spread has associated metadata that gives context to its numerical range</li>
          </ol>
          
          <div className="mt-4 mb-4 bg-indigo-950/30 p-3 rounded-lg border border-indigo-900/50">
            <p className="text-sm text-white/70">
              <span className="font-semibold">Example:</span> A Bitcoin price market with range $0 to $100,000 might be divided into 5 spreads of $20,000 each, with custom names like "Bear Market" or "Bullish".
            </p>
          </div>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Spread Metadata System</h3>
          <p className="text-white/80 mb-4">
            To enhance user experience, Skepsis implements a metadata system that provides rich context for each spread:
          </p>
          
          <div className="bg-indigo-950/50 p-3 rounded-md font-mono text-sm text-white/90 mb-4">
{`interface SpreadMetadata {
  name: string;         // Display name (e.g., "Bear Market")
  description: string;  // Context or explanation
  rangeDescription: string; // Numerical representation
}`}
          </div>
          
          <p className="text-white/80 mb-3">
            This metadata system provides several benefits:
          </p>
          <ul className="list-disc pl-5 text-white/80 space-y-1">
            <li>Intuitive labels instead of just numeric ranges</li>
            <li>Contextual information for each spread</li>
            <li>Preserved original numerical range for reference</li>
            <li>Enhanced UI visualization</li>
          </ul>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Market Resolution</h3>
          <p className="text-white/80 mb-4">
            When a market resolves:
          </p>
          <ol className="list-decimal pl-5 text-white/80 space-y-1">
            <li>The actual outcome value is submitted</li>
            <li>The system identifies which spread contains this value</li>
            <li>The market state changes to "Resolved"</li>
            <li>Positions in the winning spread become valuable and can be claimed</li>
          </ol>
          
          <div className="mt-6 p-4 bg-indigo-900/30 rounded-lg border border-indigo-800/50">
            <h4 className="text-lg font-semibold mb-2">Integration Points</h4>
            <p className="text-white/80 mb-2">
              The continuous outcome market implementation integrates with:
            </p>
            <ul className="list-disc pl-5 text-white/80 space-y-1">
              <li>Wallet Connection for executing transactions</li>
              <li>Blockchain RPC for fetching market data</li>
              <li>Transaction Builder for creating trade transactions</li>
              <li>Event System for real-time updates</li>
              <li>UI Components for visualization and interaction</li>
            </ul>
          </div>
        </div>
      )
    },
    { 
      id: "api-reference", 
      title: "API Reference", 
      icon: <Code size={20} />,
      description: "For developers integrating with Skepsis",
      content: (
        <div className="prose prose-invert max-w-none">
          <h2 className="text-2xl font-bold mb-4">Skepsis API Reference</h2>
          <p className="text-white/80 mb-4">
            Skepsis provides a set of Move modules for interacting with the prediction market platform on the Sui blockchain, 
            as well as React hooks and components for frontend development.
          </p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Core Move Modules</h3>
          <div className="space-y-4">
            <div className="p-4 bg-indigo-900/30 rounded-lg border border-indigo-800/50">
              <h4 className="text-lg font-semibold mb-2">Market Module</h4>
              <p className="text-white/80 mb-2">
                Handles the creation and management of prediction markets.
              </p>
              <p className="text-white/80">
                <strong>Key Functions:</strong>
              </p>
              <ul className="list-disc pl-5 text-white/80 space-y-1">
                <li><code className="bg-indigo-950/50 px-1 py-0.5 rounded text-sm">create_market</code> - Creates a new prediction market</li>
                <li><code className="bg-indigo-950/50 px-1 py-0.5 rounded text-sm">resolve_market</code> - Resolves a market with the actual outcome</li>
                <li><code className="bg-indigo-950/50 px-1 py-0.5 rounded text-sm">place_trade</code> - Places a trade in a specific market</li>
              </ul>
            </div>
            
            <div className="p-4 bg-indigo-900/30 rounded-lg border border-indigo-800/50">
              <h4 className="text-lg font-semibold mb-2">Liquidity Module</h4>
              <p className="text-white/80 mb-2">
                Manages liquidity provision for markets.
              </p>
              <p className="text-white/80">
                <strong>Key Functions:</strong>
              </p>
              <ul className="list-disc pl-5 text-white/80 space-y-1">
                <li><code className="bg-indigo-950/50 px-1 py-0.5 rounded text-sm">add_liquidity</code> - Adds liquidity to a market</li>
                <li><code className="bg-indigo-950/50 px-1 py-0.5 rounded text-sm">remove_liquidity</code> - Removes liquidity from a market</li>
              </ul>
            </div>
          </div>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">React Hooks</h3>
          <div className="space-y-4">
            <div className="p-4 bg-indigo-900/30 rounded-lg border border-indigo-800/50">
              <h4 className="text-lg font-semibold mb-2">useLiveMarketInfo</h4>
              <p className="text-white/80 mb-2">
                Fetches and maintains real-time market information.
              </p>
              <div className="bg-indigo-950/50 p-3 rounded-md font-mono text-xs text-white/90 mb-3">
{`const { data, loading, error, refresh } = useLiveMarketInfo(marketId);`}
              </div>
              <p className="text-white/80">
                <strong>Parameters:</strong>
              </p>
              <ul className="list-disc pl-5 text-white/80 text-sm space-y-1">
                <li><code className="bg-indigo-950/50 px-1 py-0.5 rounded">marketId</code> - The ID of the market to fetch information for</li>
              </ul>
            </div>
            
            <div className="p-4 bg-indigo-900/30 rounded-lg border border-indigo-800/50">
              <h4 className="text-lg font-semibold mb-2">useMarketPositions</h4>
              <p className="text-white/80 mb-2">
                Retrieves user positions for a specific market.
              </p>
              <div className="bg-indigo-950/50 p-3 rounded-md font-mono text-xs text-white/90 mb-3">
{`const { positions, loading, error, refresh } = useMarketPositions(marketId);`}
              </div>
              <p className="text-white/80">
                <strong>Returns user positions including:</strong>
              </p>
              <ul className="list-disc pl-5 text-white/80 text-sm space-y-1">
                <li>Spread index and market ID</li>
                <li>Shares amount and current value</li>
                <li>Profit/loss calculation</li>
                <li>Timestamp information</li>
              </ul>
            </div>
            
            <div className="p-4 bg-indigo-900/30 rounded-lg border border-indigo-800/50">
              <h4 className="text-lg font-semibold mb-2">useMarketTransactions</h4>
              <p className="text-white/80 mb-2">
                Provides functions for executing market transactions.
              </p>
              <div className="bg-indigo-950/50 p-3 rounded-md font-mono text-xs text-white/90 mb-3">
{`const { 
  buyShares, 
  sellShares, 
  claimWinnings,
  isLoading, 
  error 
} = useMarketTransactions(marketId);`}
              </div>
            </div>
          </div>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Integration Example</h3>
          <p className="text-white/80 mb-2">
            Below is a simple example of integrating with the Skepsis platform:
          </p>
          <pre className="bg-indigo-950/50 p-4 rounded-md overflow-auto text-sm">
            {`import { SkepsisSDK } from '@skepsis/sdk';

// Initialize the SDK
const skepsis = new SkepsisSDK({
  network: 'testnet'
});

// Place a trade in a market
async function placeSkepsisTrade(marketId, tradeAmount, outcomeIndex) {
  const tx = await skepsis.createTradeTx({
    marketId,
    amount: tradeAmount,
    outcomeIndex
  });
  
  return tx;
}`}
          </pre>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">UI Components</h3>
          <p className="text-white/80 mb-4">
            Skepsis provides React components for building prediction market interfaces:
          </p>
          
          <div className="p-4 bg-indigo-900/30 rounded-lg border border-indigo-800/50">
            <h4 className="text-lg font-semibold mb-2">MarketSpreadsBar</h4>
            <p className="text-white/80 mb-2">
              Visualizes the probability distribution across market spreads.
            </p>
            <div className="bg-indigo-950/50 p-3 rounded-md font-mono text-xs text-white/90 mb-3">
{`<MarketSpreadsBar
  marketId={marketId}
  className="mb-6"
/>`}
            </div>
            <p className="text-white/80 text-sm">
              Renders horizontal bars representing each spread with width proportional to the market's probability estimate.
            </p>
          </div>
          
          <div className="mt-6">
            <p className="text-white/80 text-sm">
              For complete API documentation, please refer to the <Link href="https://github.com/your-org/skepsis" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">GitHub repository</Link>.
            </p>
          </div>
        </div>
      )
    },
    { 
      id: "troubleshooting", 
      title: "Troubleshooting", 
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>,
      description: "Common issues and solutions",
      content: (
        <div className="prose prose-invert max-w-none">
          <h2 className="text-2xl font-bold mb-4">Troubleshooting & Support</h2>
          <p className="text-white/80 mb-4">
            This section helps you resolve common issues that you might encounter while using the Skepsis platform.
          </p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Common Issues</h3>
          
          <div className="space-y-4">
            <div className="p-4 bg-indigo-900/20 rounded-lg border border-indigo-800/30">
              <h4 className="text-lg font-semibold mb-2">Transaction Failed</h4>
              <ul className="list-disc pl-5 text-white/80 space-y-1">
                <li>Check your wallet balance</li>
                <li>Ensure you're connected to the correct network</li>
                <li>Try again with a smaller amount</li>
              </ul>
            </div>
            
            <div className="p-4 bg-indigo-900/20 rounded-lg border border-indigo-800/30">
              <h4 className="text-lg font-semibold mb-2">Unable to Claim Rewards</h4>
              <ul className="list-disc pl-5 text-white/80 space-y-1">
                <li>Verify the market has been resolved</li>
                <li>Ensure you have winning positions</li>
                <li>Check if you've already claimed your rewards</li>
              </ul>
            </div>
            
            <div className="p-4 bg-indigo-900/20 rounded-lg border border-indigo-800/30">
              <h4 className="text-lg font-semibold mb-2">Market Data Not Loading</h4>
              <ul className="list-disc pl-5 text-white/80 space-y-1">
                <li>Refresh the page</li>
                <li>Check your internet connection</li>
                <li>Verify the RPC connection status</li>
              </ul>
            </div>
          </div>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Getting Help</h3>
          <p className="text-white/80 mb-4">
            If you encounter issues that aren't covered here:
          </p>
          
          <div className="p-4 bg-indigo-900/30 rounded-lg border border-indigo-800/50">
            <ol className="list-decimal pl-5 text-white/80 space-y-2">
              <li>Check the <span className="text-white font-medium">FAQ section</span> on the Skepsis website</li>
              <li>Join the <a href="https://discord.gg/skepsis" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">community Discord</a> for support</li>
              <li>Contact <a href="mailto:support@skepsis.io" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">support@skepsis.io</a> for assistance</li>
            </ol>
            
            <div className="mt-4 p-3 bg-indigo-950/30 rounded-lg">
              <p className="text-sm text-center text-white/70 italic">
                The Skepsis team is committed to providing prompt support and continuously improving the platform based on user feedback.
              </p>
            </div>
          </div>
        </div>
      )
    },
  ];

  return (
    <>
      <Head>
        <title>Documentation | Skepsis - Decentralized Continuous Outcome Prediction Markets</title>
        <meta name="description" content="Documentation for Skepsis - a decentralized prediction market platform on Sui blockchain that enables trading on continuous numerical outcome spaces." />
        <link rel="icon" href="/images/skepsis-transparent.png" />
      </Head>
      <main
        className={cn(
          "relative w-full min-h-svh h-full max-w-360 flex flex-col mx-auto pb-28 pt-20 px-4 z-10",
          inter.className
        )}
      >
        <Header />
        
        <div className="w-full mt-8 mb-12">
          <div className="flex items-center text-sm text-white/60 mb-6">
            <Link href="/" className="hover:text-white/80">Home</Link>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-2">
              <path d="m9 18 6-6-6-6"/>
            </svg>
            <span className="text-white/80">Documentation</span>
            {activeSection !== "overview" && (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-2">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
                <span className="text-white/80">{sections.find(s => s.id === activeSection)?.title}</span>
              </>
            )}
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent mb-3">
            Documentation
          </h1>
          <p className="text-white/80 text-lg max-w-3xl">
            Learn about the Skepsis platform, how to use it, and technical details about continuous outcome markets.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full">
          {/* Sidebar Menu */}
          <div className="md:col-span-1 space-y-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg transition-all",
                  activeSection === section.id
                    ? "bg-indigo-600/20 border border-indigo-500/30"
                    : "bg-indigo-900/10 hover:bg-indigo-900/20 border border-transparent"
                )}
              >
                <div className={cn(
                  "text-indigo-300",
                  activeSection === section.id && "text-indigo-200"
                )}>
                  {section.icon}
                </div>
                <div className="text-left">
                  <div className={cn(
                    "font-medium",
                    activeSection === section.id ? "text-white" : "text-white/80"
                  )}>
                    {section.title}
                  </div>
                  <div className={cn(
                    "text-xs",
                    activeSection === section.id ? "text-white/70" : "text-white/50"
                  )}>
                    {section.description}
                  </div>
                </div>
                {activeSection === section.id && (
                  <ArrowRight size={16} className="ml-auto text-indigo-300" />
                )}
              </button>
            ))}
          </div>

          {/* Main Content */}
          <div className="md:col-span-3 bg-indigo-900/10 border border-indigo-800/30 rounded-lg p-6">
            {sections.find(s => s.id === activeSection)?.content}
            
            {/* Navigation Buttons */}
            <div className="flex flex-col mt-8 pt-6 border-t border-indigo-800/30">
              {/* Progress indicator */}
              <div className="flex items-center justify-center mb-4">
                <div className="text-white/60 text-sm">
                  Section {sections.findIndex(s => s.id === activeSection) + 1} of {sections.length}
                </div>
                <div className="mx-3 flex-grow max-w-[200px]">
                  <div className="h-1 bg-indigo-900/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500/70" 
                      style={{ 
                        width: `${((sections.findIndex(s => s.id === activeSection) + 1) / sections.length) * 100}%`,
                        transition: 'width 0.3s ease-in-out'
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              
              {/* Navigation buttons */}
              <div className="flex justify-between">
                {sections.findIndex(s => s.id === activeSection) > 0 && (
                  <button
                    onClick={() => {
                      const currentIndex = sections.findIndex(s => s.id === activeSection);
                      if (currentIndex > 0) {
                        setActiveSection(sections[currentIndex - 1].id);
                        // Scroll to top when changing sections
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-900/30 hover:bg-indigo-900/50 rounded-lg border border-indigo-800/30 transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-300">
                      <path d="m15 18-6-6 6-6"/>
                    </svg>
                    <span>Previous: {sections[sections.findIndex(s => s.id === activeSection) - 1].title}</span>
                  </button>
                )}
                
                {sections.findIndex(s => s.id === activeSection) < sections.length - 1 && (
                  <button
                    onClick={() => {
                      const currentIndex = sections.findIndex(s => s.id === activeSection);
                      if (currentIndex < sections.length - 1) {
                        setActiveSection(sections[currentIndex + 1].id);
                        // Scroll to top when changing sections
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 ml-auto bg-indigo-900/30 hover:bg-indigo-900/50 rounded-lg border border-indigo-800/30 transition-all"
                  >
                    <span>Next: {sections[sections.findIndex(s => s.id === activeSection) + 1].title}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-300">
                      <path d="m9 18 6-6-6-6"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </main>
    </>
  );
}
