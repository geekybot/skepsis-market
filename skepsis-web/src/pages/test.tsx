import React from 'react';
import Head from 'next/head';
import Header from '@/components/header';
import Footer from '@/components/footer';

const TestPage = () => {
  return (
    <>
      <Head>
        <title>Test Page</title>
        <meta name="description" content="Test page to debug routing issues" />
      </Head>

      <Header />

      <main className="min-h-screen flex flex-col px-6 py-8 max-w-7xl mx-auto pt-36">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Test Page</h1>
          <p className="text-gray-400 text-sm mt-1">This is a test page to debug routing issues</p>
        </div>
        <Footer />
      </main>
    </>
  );
};

export default TestPage;
