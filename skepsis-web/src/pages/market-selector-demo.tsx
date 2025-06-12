import React, { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { MarketSelectorCarousel } from '@/components/ui/MarketSelectorCarousel';
import { MarketSelectorMarquee } from '@/components/ui/MarketSelectorMarquee';
import { MarketSelectorHybrid } from '@/components/ui/MarketSelectorHybrid';
import { DEFAULT_MARKET_ID } from '@/constants/appConstants';
import { cn } from '@/lib/utils';

/**
 * Demo page to showcase all market selector components
 */
const MarketSelectorDemo: NextPage = () => {
  const [selectedMarketId, setSelectedMarketId] = useState(DEFAULT_MARKET_ID);
  const [isLoading, setIsLoading] = useState(false);

  const handleMarketChange = (marketId: string) => {
    setIsLoading(true);
    setSelectedMarketId(marketId);
    
    // Simulate loading
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const toggleLoading = () => {
    setIsLoading(!isLoading);
  };

  return (
    <>
      <Head>
        <title>Market Selector Demo | Skepsis</title>
        <meta name="description" content="Demo page showcasing different market selector styles" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900">
        <Header />
        
        <div className="container mx-auto px-4 py-8 pt-36">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              Market Selector Demo
            </h1>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              Compare different market selector styles: Traditional Carousel, News Marquee, and Hybrid modes
            </p>
            
            {/* Controls */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={toggleLoading}
                className={cn(
                  "px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200",
                  isLoading
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-green-600 hover:bg-green-700 text-white"
                )}
              >
                {isLoading ? 'Stop Loading' : 'Simulate Loading'}
              </button>
              
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-700/60 rounded-lg border border-white/10">
                <span className="text-white/70 text-sm">Selected:</span>
                <span className="text-white text-sm font-medium">
                  {selectedMarketId}
                </span>
              </div>
            </div>
          </div>

          {/* Demo Sections */}
          <div className="space-y-12">
            
            {/* Hybrid Component */}
            <section className="bg-gray-800/40 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Hybrid Component
                </h2>
                <p className="text-white/70">
                  Toggle between carousel and marquee modes with smooth transitions. 
                  This gives users the best of both worlds.
                </p>
              </div>
              
              <MarketSelectorHybrid
                selectedMarketId={selectedMarketId}
                onMarketChange={handleMarketChange}
                isLoading={isLoading}
                defaultMode="carousel"
              />
            </section>

            {/* Carousel Component */}
            <section className="bg-gray-800/40 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Carousel Component
                </h2>
                <p className="text-white/70">
                  Traditional horizontal scrolling with navigation arrows. 
                  Features touch/swipe support, keyboard navigation, and auto-scroll to selected items.
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="text-sm font-medium text-white/90">Select Market</div>
                <MarketSelectorCarousel
                  selectedMarketId={selectedMarketId}
                  onMarketChange={handleMarketChange}
                  isLoading={isLoading}
                />
              </div>
            </section>

            {/* Marquee Component */}
            <section className="bg-gray-800/40 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                  News Marquee Component
                </h2>
                <p className="text-white/70">
                  Continuous scrolling news ticker style. 
                  Features play/pause controls, hover to pause, and gradient edges for a professional look.
                </p>
              </div>
              
              <MarketSelectorMarquee
                selectedMarketId={selectedMarketId}
                onMarketChange={handleMarketChange}
                isLoading={isLoading}
                speed={35}
                direction="left"
              />
            </section>

            {/* Fast Marquee Variations */}
            <section className="bg-gray-800/40 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Marquee Variations
                </h2>
                <p className="text-white/70">
                  Different speeds and directions to showcase flexibility.
                </p>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-3">Fast Right-to-Left</h3>
                  <MarketSelectorMarquee
                    selectedMarketId={selectedMarketId}
                    onMarketChange={handleMarketChange}
                    isLoading={isLoading}
                    speed={60}
                    direction="left"
                  />
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-white mb-3">Slow Left-to-Right</h3>
                  <MarketSelectorMarquee
                    selectedMarketId={selectedMarketId}
                    onMarketChange={handleMarketChange}
                    isLoading={isLoading}
                    speed={20}
                    direction="right"
                  />
                </div>
              </div>
            </section>

          </div>

          {/* Footer Info */}
          <div className="mt-12 text-center text-white/50 text-sm">
            <p>
              Built with react-fast-marquee • All components are fully responsive and accessible
            </p>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default MarketSelectorDemo;
