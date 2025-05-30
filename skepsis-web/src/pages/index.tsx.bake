import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <Head>
        <title>Skepsis - Reset Home</title>
        <meta name="description" content="Skepsis home page" />
      </Head>

      <main className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
        <h1 className="text-4xl font-bold mb-8">Skepsis Navigation</h1>
        
        <div className="flex flex-col gap-4">
          <Link href="/liquidity">
            <button className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
              Go to Liquidity Page
            </button>
          </Link>
          
          <Link href="/prediction">
            <button className="px-8 py-4 bg-green-600 hover:bg-green-700 rounded-lg transition-colors">
              Go to Prediction Page
            </button>
          </Link>

          <Link href="/test">
            <button className="px-8 py-4 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors">
              Go to Test Page
            </button>
          </Link>
        </div>
      </main>
    </>
  );
}
