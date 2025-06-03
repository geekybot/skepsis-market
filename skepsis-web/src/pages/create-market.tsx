import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Header from '@/components/header';
import Footer from '@/components/footer';

const CreateMarket: NextPage = () => {
  return (
    <>
      <Head>
        <title>Create Market | Skepsis</title>
        <meta name="description" content="Create a new prediction market on Skepsis" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Header />
      
      <main className="min-h-screen flex flex-col px-6 max-w-7xl mx-auto pt-24 pb-16">
        <div className="mb-8 flex justify-center items-center">
          <h1 className="text-3xl font-bold text-gradient bg-gradient-to-r from-indigo-200 via-violet-100 to-indigo-200 bg-clip-text text-transparent">Create Market</h1>
        </div>

        <div className="flex flex-col items-center justify-center h-full text-center mt-8">
          <div className="bg-gradient-to-br from-indigo-950/40 to-violet-950/40 backdrop-blur-md rounded-xl p-10 border border-indigo-800/30 shadow-lg max-w-2xl w-full">
            <div className="flex flex-col items-center justify-center space-y-8">
              <div className="relative">
                <div className="absolute -z-10 w-[150px] h-[150px] bg-blue-500/20 rounded-full blur-[80px] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-24 w-24 text-blue-500" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
                  />
                </svg>
              </div>
              
              <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-indigo-100 bg-clip-text text-transparent">Coming Soon!</h2>
              
              <p className="text-xl text-white/90 max-w-lg mx-auto">
                The ability to create your own prediction markets is under development.
                Stay tuned for updates as we expand the Skepsis platform.
              </p>
              
              <div className="relative z-10 mt-8">
                <div className="absolute -z-10 w-[250px] h-[60px] bg-purple-500/20 rounded-full blur-[50px] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                <div className="flex gap-4 flex-wrap justify-center">
                  <Link 
                    href="/prediction"
                    className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white py-3 px-6 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-indigo-900/30"
                  >
                    <span>Explore Markets</span>
                    <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default CreateMarket;
