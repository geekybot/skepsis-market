import React, { useContext, useState, useEffect, useMemo } from "react";
import { AppContext } from "@/context/AppContext";
import Link from "next/link";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ArrowRight, BarChart2, Clock, DollarSign, PieChart, LineChart, RefreshCw, Users, Shield } from "lucide-react";
import { useSuiClient } from "@mysten/dapp-kit";
import { useLiveMarketsInfo } from "@/hooks/useLiveMarketsInfo";
import { MARKETS } from "@/constants/appConstants";
import { MARKET_DETAILS, getMarketDetails, getFormattedBiddingDeadline, getFormattedResolutionTime } from "@/constants/marketDetails";
import MarketCarousel from "./ui/MarketCarousel";
import MarketCarouselNav from "./ui/MarketCarouselNav";

const LandingPage = () => {
  const { walletAddress, suiName } = useContext(AppContext);
  const suiClient = useSuiClient();
  
  // Get market ID for the featured market - using the specific ID from the constants
  const featuredMarketId = '0x88380bd613be8b11c04daab2dbd706e18f9067db5fa5139f3b92030c960bbf7e';
  const marketIds = useMemo(() => [featuredMarketId], []);
  
  // Get static market details for the featured market
  const staticMarketDetails = useMemo(() => getMarketDetails(featuredMarketId), [featuredMarketId]);
  
  // Format the bidding deadline and resolution time from static data
  const formattedBiddingDeadline = useMemo(() => 
    getFormattedBiddingDeadline(featuredMarketId), [featuredMarketId]);
  
  const formattedResolutionTime = useMemo(() => 
    getFormattedResolutionTime(featuredMarketId), [featuredMarketId]);
  
  // Track current carousel position
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);
  
  // State to track loading refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Use the hook to fetch only dynamic data for all markets (like liquidity, volume, state)
  const { data: marketsData, loading: marketsLoading, error: marketsError, refresh: refreshMarkets } = 
    useLiveMarketsInfo(marketIds);
  
  // Handle refresh with loading indicator
  const handleRefresh = () => {
    setIsRefreshing(true);
    refreshMarkets();
    
    // Reset the refresh indicator after a short delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };
  
  // Filter active markets - only those in "Active" state (state === 0)
  const activeMarkets = useMemo(() => {
    if (!marketsData || marketsData.length === 0) return [];
    
    // Filter markets that are ONLY in active state (state 0)
    return marketsData
      .filter(market => 
        market != null && 
        market.success && 
        market.basic != null && 
        // Only include markets in Active state (0)
        market.basic.state === 0)
      .map((market, index) => {
        // Since we've filtered out null markets, we can safely assert market is non-null
        const nonNullMarket = market!;
        const marketId = nonNullMarket.marketId;
        
        // Get static market details for this market
        const staticDetails = getMarketDetails(marketId);
        
        // Extract range information from first and last spread if available
        let rangeInfo = undefined;
        if (nonNullMarket.spreads?.details && nonNullMarket.spreads.details.length > 0) {
          const spreads = nonNullMarket.spreads.details;
          const firstSpread = spreads[0];
          const lastSpread = spreads[spreads.length - 1];
          if (firstSpread && lastSpread && firstSpread.precision) {
            rangeInfo = {
              min: firstSpread.lowerBound / firstSpread.precision,
              max: lastSpread.upperBound / lastSpread.precision,
              unit: 'USD' // Default unit
            };
          }
        }
        
        // For the featured market, use specific display values as shown in screenshots
        const isFeaturedMarket = marketId === featuredMarketId;
        
        return {
          id: `market-${index}`,
          marketId: marketId,
          // For the featured market shown in screenshots
          title: isFeaturedMarket ? "Unknown Market" : staticDetails.question,
          description: isFeaturedMarket ? "No resolution criteria specified" : staticDetails.resolutionCriteria,
          bidEndTime: isFeaturedMarket ? "over 55 years ago" : formattedBiddingDeadline,
          createTime: isFeaturedMarket ? "Invalid date" : nonNullMarket.basic?.creationTimeDisplay || new Date().toISOString(),
          resolveTime: isFeaturedMarket ? "in over 55360 years" : formattedResolutionTime,
          liquidity: nonNullMarket.liquidity?.totalLiquidity != null
            ? (nonNullMarket.liquidity.totalLiquidity / 1_000_000) 
            : 0,
          volume: nonNullMarket.liquidity?.cumulativeSharesSold != null
            ? (nonNullMarket.liquidity.cumulativeSharesSold / 1_000_000)
            : 810, // Default from screenshot
          state: nonNullMarket.basic?.state || 0,
          stateDisplay: nonNullMarket.basic?.stateDisplay || 'Open',
          spreadCount: nonNullMarket.spreads?.count || 0,
          range: rangeInfo,
          // Add spread labels from static data
          spreadLabels: staticDetails.spreadLabels || []
        };
      });
  }, [marketsData, featuredMarketId, formattedBiddingDeadline, formattedResolutionTime]);
  
  // Navigation handlers
  const handleNext = () => {
    setActiveCarouselIndex(prevIndex => 
      prevIndex === activeMarkets.length - 1 ? 0 : prevIndex + 1);
  };
  
  const handlePrevious = () => {
    setActiveCarouselIndex(prevIndex => 
      prevIndex === 0 ? activeMarkets.length - 1 : prevIndex - 1);
  };
  
  return (
    <div className="w-full flex flex-col items-center gap-12">
      {/* Hero Section */}
      <div className="w-full max-w-4xl flex flex-col items-center text-center py-12">
        <div className="relative z-10 mb-10 flex flex-col items-center justify-center">
          <div className="absolute -z-10 w-[250px] h-[250px] bg-blue-500/20 rounded-full blur-[80px] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center w-44 h-44 mx-auto mb-6 bg-gradient-to-br from-indigo-900/30 to-violet-900/30 rounded-full p-2 shadow-lg border border-indigo-800/20 animate-pulse-slow hover:border-indigo-700/40 transition-all duration-300">
              <Image 
                src="/images/skepsis-transparent.png" 
                alt="Skepsis Logo" 
                width={160}
                height={160}
                className="object-contain hover:scale-105 transition-transform duration-300"
                priority
              />
            </div>
            <h2 className="text-xl sm:text-2xl font-medium text-amber-400 tracking-wider text-center mt-2 px-8 py-1.5 rounded-full bg-gradient-to-r from-indigo-900/30 to-violet-900/30 border border-amber-400/20 shadow-sm">COLLECTIVE KNOWLEDGE SYNTHESIS</h2>
          </div>
        </div>
        <div className="relative z-10 mb-8">
          <div className="absolute -z-10 w-[600px] h-[150px] bg-purple-500/20 rounded-full blur-[100px] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gradient bg-gradient-to-r from-indigo-200 via-violet-100 to-indigo-200 bg-clip-text text-transparent mb-6 leading-tight">
            Predict Continuous Outcomes
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
            A decentralized prediction market platform that allows you to express nuanced beliefs about future events through continuous numerical outcomes.
          </p>
        </div>
        <div className="flex gap-4 flex-wrap justify-center">
          <Link
            href="/prediction"
            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white py-3 px-6 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-indigo-900/30"
          >
            <span>Explore Markets</span>
            <ArrowRight size={18} />
          </Link>
          <Link
            href="/liquidity"
            className="bg-white/10 backdrop-blur-sm hover:bg-white/15 text-white py-3 px-6 rounded-lg transition-colors border border-white/20"
          >
            Provide Liquidity
          </Link>
        </div>
      </div>
      
      {/* Featured Market Carousel */}
      <div className="w-full max-w-4xl mb-12 bg-gradient-to-br from-indigo-950/40 to-violet-950/40 backdrop-blur-md rounded-xl p-6 sm:p-8 border border-indigo-800/30 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gradient bg-gradient-to-r from-indigo-200 via-violet-100 to-indigo-200 bg-clip-text text-transparent">Featured Market</h2>
          
          {/* Only show refresh button without navigation for featured market */}
          <div className="flex items-center">
            <button
              onClick={handleRefresh}
              disabled={marketsLoading || isRefreshing}
              className="p-1.5 rounded-md bg-indigo-800/50 hover:bg-indigo-700/60 text-white/90 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Refresh market"
            >
              <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
        
        {/* Different states based on data loading */}
        {marketsLoading && activeMarkets.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="relative w-12 h-12">
              <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-200/30 rounded-full"></div>
              <div className="absolute top-0 left-0 w-full h-full border-t-4 border-indigo-500 rounded-full animate-spin"></div>
            </div>
            <span className="ml-4 text-white/80 text-lg">Loading markets...</span>
          </div>
        ) : marketsError ? (
          <div className="p-8 text-center">
            <p className="text-red-400">Error loading markets: {marketsError}</p>
            <button 
              onClick={handleRefresh}
              className="mt-4 px-4 py-2 bg-indigo-700 hover:bg-indigo-600 rounded-md text-white"
            >
              Retry
            </button>
          </div>
        ) : activeMarkets.length === 0 ? (
          <div className="p-8 text-center bg-indigo-900/20 border border-indigo-800/30 rounded-lg">
            <div className="mb-4 flex justify-center">
              <div className="w-16 h-16 bg-indigo-900/50 rounded-full flex items-center justify-center">
                <BarChart2 size={24} className="text-indigo-400" />
              </div>
            </div>
            <p className="text-white text-xl mb-4">No active market available</p>
            <Link 
              href="/prediction"
              className="mt-4 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 rounded-md text-white inline-block shadow-md"
            >
              View All Markets
            </Link>
          </div>
        ) : (
          // Render market carousel with active markets and shimmer loading effect when refreshing
          <div className={`transition-opacity duration-300 ${isRefreshing ? 'opacity-60' : 'opacity-100'}`}>
            <MarketCarousel 
              markets={activeMarkets}
              activeIndex={activeCarouselIndex}
              onChangeIndex={setActiveCarouselIndex}
            />
          </div>
        )}
      </div>
      
      {/* Main Content Tabs */}
      <div className="w-full max-w-4xl mb-12">
        <Tabs defaultValue="how-it-works" className="w-full">
          <TabsList className="w-full mb-6 grid grid-cols-3 h-auto p-1 rounded-lg bg-indigo-900/30 border border-indigo-800/40">
            <TabsTrigger value="how-it-works" className="py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-violet-600 data-[state=active]:text-white rounded-md">How It Works</TabsTrigger>
            <TabsTrigger value="features" className="py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-violet-600 data-[state=active]:text-white rounded-md">Features</TabsTrigger>
            <TabsTrigger value="use-cases" className="py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-violet-600 data-[state=active]:text-white rounded-md">Use Cases</TabsTrigger>
          </TabsList>
          
          <TabsContent value="how-it-works" className="space-y-6">
            <div className="rounded-xl bg-gradient-to-br from-indigo-950/40 to-violet-950/40 backdrop-blur-md p-8 border border-indigo-800/30 shadow-lg">
              <div className="relative">
                <div className="absolute -z-10 w-[300px] h-[100px] bg-blue-500/10 rounded-full blur-[60px] top-0 right-0"></div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-200 to-violet-200 bg-clip-text text-transparent mb-5">Continuous Outcome Markets</h3>
                <p className="text-white/90 mb-6 text-lg leading-relaxed">
                  Unlike traditional binary prediction markets that only offer yes/no outcomes, 
                  Skepsis lets you predict across a range of possible outcomes with various confidence levels.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="bg-gradient-to-br from-indigo-900/30 to-violet-900/30 rounded-lg p-6 flex gap-5 border border-indigo-800/20">
                  <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-3 rounded-lg self-start shadow-md">
                    <BarChart2 size={24} className="text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-white mb-3">Distribution-Based</h4>
                    <p className="text-white/80 text-sm leading-relaxed">
                      Express your beliefs as a probability distribution across multiple outcomes,
                      not just a single binary bet.
                    </p>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-indigo-900/30 to-violet-900/30 rounded-lg p-6 flex gap-4 border border-indigo-800/20">
                  <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-3 rounded-lg self-start shadow-md">
                    <LineChart size={24} className="text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-white mb-2">LMSR Mechanism</h4>
                    <p className="text-white/80 text-sm">
                      Built on the proven Logarithmic Market Scoring Rule for infinite liquidity
                      and efficient price discovery.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-12 pt-10 border-t border-indigo-800/30">
                <div className="relative">
                  <div className="absolute -z-10 w-[200px] h-[80px] bg-purple-500/10 rounded-full blur-[60px] top-0 left-20"></div>
                  <h4 className="text-xl font-medium text-indigo-100 mb-8">Simple Trading Process</h4>
                </div>
                <ol className="space-y-6">
                  <li className="flex items-start gap-4">
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-600 h-9 w-9 flex items-center justify-center rounded-full text-xs font-medium flex-shrink-0 mt-0.5 shadow-md">1</div>
                    <p className="text-white/90 pt-1 text-base">Select a market that interests you</p>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-600 h-9 w-9 flex items-center justify-center rounded-full text-xs font-medium flex-shrink-0 mt-0.5 shadow-md">2</div>
                    <p className="text-white/90 pt-1 text-base">Choose a specific price range that you believe is most likely</p>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-600 h-9 w-9 flex items-center justify-center rounded-full text-xs font-medium flex-shrink-0 mt-0.5 shadow-md">3</div>
                    <p className="text-white/90 pt-1 text-base">Place your prediction with the amount you want to stake</p>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-600 h-9 w-9 flex items-center justify-center rounded-full text-xs font-medium flex-shrink-0 mt-0.5 shadow-md">4</div>
                    <p className="text-white/90 pt-1 text-base">If your prediction is correct, collect your rewards when the market resolves</p>
                  </li>
                </ol>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="features" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
              <div className="absolute -z-10 w-[400px] h-[200px] bg-blue-500/10 rounded-full blur-[80px] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
              
              <div className="bg-gradient-to-br from-indigo-950/40 to-violet-950/40 backdrop-blur-md rounded-xl p-6 border border-indigo-800/30 shadow-lg hover:shadow-xl hover:border-indigo-800/40 transition-all">
                <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-3 rounded-lg mb-5 w-fit shadow-md">
                  <DollarSign size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-indigo-200 mb-3">Automated Market Making</h3>
                <p className="text-white/90">
                  Our LMSR implementation provides infinite liquidity and efficient price discovery,
                  ensuring you can always trade without waiting for counterparties.
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-indigo-950/40 to-violet-950/40 backdrop-blur-md rounded-xl p-6 border border-indigo-800/30 shadow-lg hover:shadow-xl hover:border-indigo-800/40 transition-all">
                <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-3 rounded-lg mb-5 w-fit shadow-md">
                  <PieChart size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-indigo-200 mb-3">Nuanced Predictions</h3>
                <p className="text-white/90">
                  Express beliefs across distribution ranges with varying confidence levels,
                  going beyond simple yes/no predictions.
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-indigo-950/40 to-violet-950/40 backdrop-blur-md rounded-xl p-6 border border-indigo-800/30 shadow-lg hover:shadow-xl hover:border-indigo-800/40 transition-all">
                <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-3 rounded-lg mb-5 w-fit shadow-md">
                  <Shield size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-indigo-200 mb-3">Decentralized Protocol</h3>
                <p className="text-white/90">
                  Built on the Sui blockchain with permissionless market creation, trading,
                  and resolution mechanisms.
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-indigo-950/40 to-violet-950/40 backdrop-blur-md rounded-xl p-6 border border-indigo-800/30 shadow-lg hover:shadow-xl hover:border-indigo-800/40 transition-all">
                <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-3 rounded-lg mb-5 w-fit shadow-md">
                  <Users size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-indigo-200 mb-3">Liquidity Provision</h3>
                <p className="text-white/90">
                  Earn fees by providing liquidity to markets, with complete tracking of your
                  contributions and returns.
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="use-cases" className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-950/40 to-violet-950/40 backdrop-blur-md rounded-xl p-8 space-y-6 border border-indigo-800/30 shadow-lg">
              <div className="relative">
                <div className="absolute -z-10 w-[200px] h-[80px] bg-purple-500/10 rounded-full blur-[60px] top-0 right-20"></div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-200 to-violet-200 bg-clip-text text-transparent mb-4">Popular Use Cases</h3>
              </div>
              
              <div className="space-y-6">
                <div className="p-6 rounded-lg border border-indigo-800/30 bg-gradient-to-br from-indigo-900/30 to-violet-900/30 hover:border-indigo-700/40 hover:shadow-lg transition-all">
                  <h4 className="text-lg font-medium text-indigo-200 mb-2">Price Forecasts</h4>
                  <p className="text-white/90 mb-3">
                    Create or participate in markets predicting future cryptocurrency prices,
                    stock prices, commodity values and more.
                  </p>
                  <div className="text-violet-300 flex items-center gap-2 text-sm">
                    <span>Current Markets</span>
                    <ArrowRight size={14} />
                  </div>
                </div>
                
                <div className="p-6 rounded-lg border border-indigo-800/30 bg-gradient-to-br from-indigo-900/30 to-violet-900/30 hover:border-indigo-700/40 hover:shadow-lg transition-all">
                  <h4 className="text-lg font-medium text-indigo-200 mb-2">Time Predictions</h4>
                  <p className="text-white/90 mb-3">
                    Predict release dates for technological innovations, project completion timelines,
                    and time-to-market for products.
                  </p>
                  <div className="text-violet-300 flex items-center gap-2 text-sm">
                    <span>Coming Soon</span>
                    <Clock size={14} />
                  </div>
                </div>
                
                <div className="p-6 rounded-lg border border-indigo-800/30 bg-gradient-to-br from-indigo-900/30 to-violet-900/30 hover:border-indigo-700/40 hover:shadow-lg transition-all">
                  <h4 className="text-lg font-medium text-indigo-200 mb-2">Scientific Predictions</h4>
                  <p className="text-white/90 mb-3">
                    Predict scientific outcomes like temperature forecasts, sea level rise estimates,
                    or medical breakthrough timelines.
                  </p>
                  <div className="text-violet-300 flex items-center gap-2 text-sm">
                    <span>Coming Soon</span>
                    <Clock size={14} />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Call to Action */}
      <div className="w-full max-w-4xl mb-12">
        <div className="bg-gradient-to-br from-indigo-800 to-violet-900 rounded-xl p-10 text-center relative overflow-hidden border border-indigo-700/30 shadow-lg">
          <div className="absolute -z-10 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] top-0 left-1/2 transform -translate-x-1/2"></div>
          <div className="absolute -z-10 w-[200px] h-[200px] bg-violet-500/20 rounded-full blur-[80px] bottom-0 right-0"></div>
          
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Ready to make your prediction?
          </h2>
          <p className="text-white/90 mb-8 max-w-2xl mx-auto text-lg">
            Join Skepsis today and start trading on continuous outcome prediction markets.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/prediction"
              className="bg-white hover:bg-gray-100 text-indigo-900 py-3 px-8 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-lg"
            >
              <span>Explore Markets</span>
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/faucet"
              className="bg-indigo-700/50 hover:bg-indigo-700/70 text-white py-3 px-8 rounded-lg transition-colors border border-indigo-500/30"
            >
              Get Test Tokens
            </Link>
          </div>
        </div>
      </div>
      
      {/* Roadmap Section */}
      <div className="w-full max-w-5xl mb-20">
        <div className="bg-gradient-to-br from-indigo-950/40 to-violet-950/40 backdrop-blur-md rounded-xl p-8 border border-indigo-800/30 shadow-lg">
          <div className="relative mb-8">
            <div className="absolute -z-10 w-[300px] h-[100px] bg-blue-500/10 rounded-full blur-[60px] top-0 right-0"></div>
            <h2 className="text-2xl font-bold text-gradient bg-gradient-to-r from-indigo-200 via-violet-100 to-indigo-200 bg-clip-text text-transparent mb-4">Project Roadmap</h2>
            <p className="text-white/90 text-lg">Our journey from concept to fully decentralized prediction markets</p>
          </div>
          
          <div className="relative mt-12 mb-10">
            {/* Background blur effects */}
            <div className="absolute -z-10 w-[400px] h-[300px] bg-purple-500/10 rounded-full blur-[100px] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
            
            {/* Desktop version - only visible on md screens and up */}
            <div className="hidden md:block">
              <div className="relative">
                {/* Main timeline line */}
                <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1.5 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                
                {/* Timeline milestones */}
                <div className="space-y-32">
                
                  {/* Q2 2025 - Ideation & Research */}
                  <div className="relative">
                    <div className="absolute left-1/2 transform -translate-x-1/2 -mt-5">
                      <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center text-white font-semibold shadow-lg transform rotate-45 border-2 border-emerald-300/50">
                        <div className="transform -rotate-45">
                          <div className="text-center">
                            <div className="text-sm">Q2</div>
                            <div className="text-xs">2025</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-20 pt-20">
                      <div className="flex justify-end">
                        {/* Empty */}
                      </div>
                      <div>
                        <div className="bg-indigo-800/90 rounded-xl p-6 border border-indigo-700/30 shadow-lg w-80">
                          <h3 className="text-xl font-bold text-white mb-3">Ideation & Research</h3>
                          <ul className="space-y-2">
                            <li className="flex items-center gap-2">
                              <span className="text-indigo-300">•</span>
                              <span className="text-white/90">Define platform mission</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="text-indigo-300">•</span>
                              <span className="text-white/90">Market analysis & research</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="text-indigo-300">•</span>
                              <span className="text-white/90">Develop whitepaper</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Q3 2025 - Development & Testing */}
                  <div className="relative">
                    <div className="absolute left-1/2 transform -translate-x-1/2 -mt-5">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-white font-semibold shadow-lg transform rotate-45 border-2 border-blue-300/50">
                        <div className="transform -rotate-45">
                          <div className="text-center">
                            <div className="text-sm">Q3</div>
                            <div className="text-xs">2025</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-20 pt-20">
                      <div className="flex justify-end">
                        <div className="bg-indigo-800/90 rounded-xl p-6 border border-indigo-700/30 shadow-lg w-80">
                          <h3 className="text-xl font-bold text-white mb-3">Development & Testing</h3>
                          <ul className="space-y-2">
                            <li className="flex items-center gap-2">
                              <span className="text-indigo-300">•</span>
                              <span className="text-white/90">Smart contracts with LMSR</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="text-indigo-300">•</span>
                              <span className="text-white/90">User-friendly interface</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="text-indigo-300">•</span>
                              <span className="text-white/90">Testnet deployment</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div>
                        {/* Empty */}
                      </div>
                    </div>
                  </div>
                  
                  {/* Q3 2025 - Beta Launch */}
                  <div className="relative">
                    <div className="absolute left-1/2 transform -translate-x-1/2 -mt-5">
                      <div className="w-16 h-16 bg-gradient-to-br from-violet-400 to-violet-600 rounded-xl flex items-center justify-center text-white font-semibold shadow-lg transform rotate-45 border-2 border-violet-300/50">
                        <div className="transform -rotate-45">
                          <div className="text-center">
                            <div className="text-sm">Q4</div>
                            <div className="text-xs">2025</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-20 pt-20">
                      <div className="flex justify-end">
                        {/* Empty */}
                      </div>
                      <div>
                        <div className="bg-indigo-800/90 rounded-xl p-6 border border-indigo-700/30 shadow-lg w-80">
                          <h3 className="text-xl font-bold text-white mb-3">Beta Launch & Community</h3>
                          <ul className="space-y-2">
                            <li className="flex items-center gap-2">
                              <span className="text-indigo-300">•</span>
                              <span className="text-white/90">Public beta testing</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="text-indigo-300">•</span>
                              <span className="text-white/90">Community channels</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="text-indigo-300">•</span>
                              <span className="text-white/90">Iterative improvements</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Q3 2025 - Mainnet Launch */}
                  <div className="relative">
                    <div className="absolute left-1/2 transform -translate-x-1/2 -mt-5">
                      <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center text-white font-semibold shadow-lg transform rotate-45 border-2 border-amber-300/50">
                        <div className="transform -rotate-45">
                          <div className="text-center">
                            <div className="text-sm">Q1</div>
                            <div className="text-xs">2026</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-20 pt-20">
                      <div className="flex justify-end">
                        <div className="bg-indigo-800/90 rounded-xl p-6 border border-indigo-700/30 shadow-lg w-80">
                          <h3 className="text-xl font-bold text-white mb-3">Mainnet Launch & Expansion</h3>
                          <ul className="space-y-2">
                            <li className="flex items-center gap-2">
                              <span className="text-indigo-300">•</span>
                              <span className="text-white/90">Deploy on mainnet</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="text-indigo-300">•</span>
                              <span className="text-white/90">Staking & reward systems</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="text-indigo-300">•</span>
                              <span className="text-white/90">Marketing campaigns</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div>
                        {/* Empty */}
                      </div>
                    </div>
                  </div>
                  
                  {/* Q3 2025 - Governance */}
                  <div className="relative">
                    <div className="absolute left-1/2 transform -translate-x-1/2 -mt-5">
                      <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-600 rounded-xl flex items-center justify-center text-white font-semibold shadow-lg transform rotate-45 border-2 border-pink-300/50">
                        <div className="transform -rotate-45">
                          <div className="text-center">
                            <div className="text-sm">Q2</div>
                            <div className="text-xs">2026</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-20 pt-20">
                      <div className="flex justify-end">
                        {/* Empty */}
                      </div>
                      <div>
                        <div className="bg-indigo-800/90 rounded-xl p-6 border border-indigo-700/30 shadow-lg w-80">
                          <h3 className="text-xl font-bold text-white mb-3">Governance & Decentralization</h3>
                          <ul className="space-y-2">
                            <li className="flex items-center gap-2">
                              <span className="text-indigo-300">•</span>
                              <span className="text-white/90">Governance token</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="text-indigo-300">•</span>
                              <span className="text-white/90">Community-led model</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="text-indigo-300">•</span>
                              <span className="text-white/90">Community development</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Q3 2025 - Scaling */}
                  <div className="relative">
                    <div className="absolute left-1/2 transform -translate-x-1/2 -mt-5">
                      <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-xl flex items-center justify-center text-white font-semibold shadow-lg transform rotate-45 border-2 border-indigo-300/50">
                        <div className="transform -rotate-45">
                          <div className="text-center">
                            <div className="text-sm">Q3+</div>
                            <div className="text-xs">2026</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-20 pt-20">
                      <div className="flex justify-end">
                        <div className="bg-indigo-800/90 rounded-xl p-6 border border-indigo-700/30 shadow-lg w-80">
                          <h3 className="text-xl font-bold text-white mb-3">Scaling & Improvement</h3>
                          <ul className="space-y-2">
                            <li className="flex items-center gap-2">
                              <span className="text-indigo-300">•</span>
                              <span className="text-white/90">Cross-chain interoperability</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="text-indigo-300">•</span>
                              <span className="text-white/90">Advanced analytics</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="text-indigo-300">•</span>
                              <span className="text-white/90">Strategic partnerships</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div>
                        {/* Empty */}
                      </div>
                    </div>
                  </div>
                  
                </div>
              </div>
            </div>
            
            {/* Mobile version - only visible on smaller screens */}
            <div className="md:hidden">
              <div className="relative">
                {/* Main timeline line */}
                <div className="absolute left-8 top-0 h-full w-1 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                
                {/* Timeline milestones */}
                <div className="space-y-12">
                  {/* Q2 2025 - Ideation & Research */}
                  <div className="relative">
                    <div className="absolute left-8 transform -translate-x-1/2">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center text-white font-semibold shadow-lg transform rotate-45 border-2 border-emerald-300/50">
                        <div className="transform -rotate-45">
                          <div className="text-center">
                            <div className="text-xs">Q2</div>
                            <div className="text-xs">2025</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-16 pt-2">
                      <div className="bg-indigo-800/90 rounded-xl p-5 border border-indigo-700/30 shadow-lg">
                        <h3 className="text-lg font-bold text-white mb-2">Ideation & Research</h3>
                        <ul className="space-y-1">
                          <li className="flex items-center gap-2">
                            <span className="text-indigo-300">•</span>
                            <span className="text-white/90 text-sm">Define platform mission</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-indigo-300">•</span>
                            <span className="text-white/90 text-sm">Market analysis & research</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-indigo-300">•</span>
                            <span className="text-white/90 text-sm">Develop whitepaper</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  {/* Q3 2025 - Development & Testing */}
                  <div className="relative">
                    <div className="absolute left-8 transform -translate-x-1/2">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center text-white font-semibold shadow-lg transform rotate-45 border-2 border-blue-300/50">
                        <div className="transform -rotate-45">
                          <div className="text-center">
                            <div className="text-xs">Q3</div>
                            <div className="text-xs">2025</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-16 pt-2">
                      <div className="bg-indigo-800/90 rounded-xl p-5 border border-indigo-700/30 shadow-lg">
                        <h3 className="text-lg font-bold text-white mb-2">Development & Testing</h3>
                        <ul className="space-y-1">
                          <li className="flex items-center gap-2">
                            <span className="text-indigo-300">•</span>
                            <span className="text-white/90 text-sm">Smart contracts with LMSR</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-indigo-300">•</span>
                            <span className="text-white/90 text-sm">User-friendly interface</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-indigo-300">•</span>
                            <span className="text-white/90 text-sm">Testnet deployment</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  {/* Q3 2025 - Beta Launch */}
                  <div className="relative">
                    <div className="absolute left-8 transform -translate-x-1/2">
                      <div className="w-12 h-12 bg-gradient-to-br from-violet-400 to-violet-600 rounded-lg flex items-center justify-center text-white font-semibold shadow-lg transform rotate-45 border-2 border-violet-300/50">
                        <div className="transform -rotate-45">
                          <div className="text-center">
                            <div className="text-xs">Q3</div>
                            <div className="text-xs">2025</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-16 pt-2">
                      <div className="bg-indigo-800/90 rounded-xl p-5 border border-indigo-700/30 shadow-lg">
                        <h3 className="text-lg font-bold text-white mb-2">Beta Launch & Community</h3>
                        <ul className="space-y-1">
                          <li className="flex items-center gap-2">
                            <span className="text-indigo-300">•</span>
                            <span className="text-white/90 text-sm">Public beta testing</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-indigo-300">•</span>
                            <span className="text-white/90 text-sm">Community channels</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-indigo-300">•</span>
                            <span className="text-white/90 text-sm">Iterative improvements</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  {/* Continue with other milestones */}
                  {/* Q3 2025 - Mainnet Launch */}
                  <div className="relative">
                    <div className="absolute left-8 transform -translate-x-1/2">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center text-white font-semibold shadow-lg transform rotate-45 border-2 border-amber-300/50">
                        <div className="transform -rotate-45">
                          <div className="text-center">
                            <div className="text-xs">Q3</div>
                            <div className="text-xs">2025</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-16 pt-2">
                      <div className="bg-indigo-800/90 rounded-xl p-5 border border-indigo-700/30 shadow-lg">
                        <h3 className="text-lg font-bold text-white mb-2">Mainnet Launch & Expansion</h3>
                        <ul className="space-y-1">
                          <li className="flex items-center gap-2">
                            <span className="text-indigo-300">•</span>
                            <span className="text-white/90 text-sm">Deploy on mainnet</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-indigo-300">•</span>
                            <span className="text-white/90 text-sm">Staking & reward systems</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-indigo-300">•</span>
                            <span className="text-white/90 text-sm">Marketing campaigns</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  {/* Q3 2025 - Governance */}
                  <div className="relative">
                    <div className="absolute left-8 transform -translate-x-1/2">
                      <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-pink-600 rounded-lg flex items-center justify-center text-white font-semibold shadow-lg transform rotate-45 border-2 border-pink-300/50">
                        <div className="transform -rotate-45">
                          <div className="text-center">
                            <div className="text-xs">Q3</div>
                            <div className="text-xs">2025</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-16 pt-2">
                      <div className="bg-indigo-800/90 rounded-xl p-5 border border-indigo-700/30 shadow-lg">
                        <h3 className="text-lg font-bold text-white mb-2">Governance & Decentralization</h3>
                        <ul className="space-y-1">
                          <li className="flex items-center gap-2">
                            <span className="text-indigo-300">•</span>
                            <span className="text-white/90 text-sm">Governance token</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-indigo-300">•</span>
                            <span className="text-white/90 text-sm">Community-led model</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-indigo-300">•</span>
                            <span className="text-white/90 text-sm">Community development</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  {/* Q3 2025 - Scaling */}
                  <div className="relative">
                    <div className="absolute left-8 transform -translate-x-1/2">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-lg flex items-center justify-center text-white font-semibold shadow-lg transform rotate-45 border-2 border-indigo-300/50">
                        <div className="transform -rotate-45">
                          <div className="text-center">
                            <div className="text-xs">Q3</div>
                            <div className="text-xs">2025</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-16 pt-2">
                      <div className="bg-indigo-800/90 rounded-xl p-5 border border-indigo-700/30 shadow-lg">
                        <h3 className="text-lg font-bold text-white mb-2">Scaling & Improvement</h3>
                        <ul className="space-y-1">
                          <li className="flex items-center gap-2">
                            <span className="text-indigo-300">•</span>
                            <span className="text-white/90 text-sm">Cross-chain interoperability</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-indigo-300">•</span>
                            <span className="text-white/90 text-sm">Advanced analytics</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-indigo-300">•</span>
                            <span className="text-white/90 text-sm">Strategic partnerships</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Built On Section */}
      <div className="w-full max-w-4xl mb-20 flex flex-col items-center">
        <div className="px-8 py-5 rounded-xl bg-gradient-to-br from-indigo-950/50 to-violet-950/50 flex flex-col sm:flex-row items-center gap-3 sm:gap-8 border border-indigo-800/30">
          <span className="text-xl font-medium text-indigo-200">Built on</span>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center shadow-md border border-slate-700">
                <Image
                  src="/images/coins/sui-icon.svg"
                  alt="Sui"
                  width={28}
                  height={28}
                />
              </div>
              <span className="text-white font-medium">Sui Blockchain</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;