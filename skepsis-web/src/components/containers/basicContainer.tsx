import { useContext } from "react";
import { AppContext } from "@/context/AppContext";
import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const BasicContainer = () => {
  const { walletAddress, suiName } = useContext(AppContext);

  return (
    <div className="w-full flex flex-col items-center justify-center gap-8">
      {/* Skepsis Section */}
      <div className="w-full max-w-4xl">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-white mb-2">Skepsis</h1>
          <p className="text-white/80">Decentralized Prediction Markets on Sui</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <Link
            href="/prediction"
            className={cn(
              "p-6 rounded-xl bg-white/10 backdrop-blur-md hover:bg-white/15",
              "transition-all flex flex-col gap-3"
            )}
          >
            <h2 className="text-xl font-medium text-white">
              Bitcoin Price Prediction
            </h2>
            <p className="text-white/70">
              Predict the price of Bitcoin on May 30th, 2025
            </p>
            <div className="mt-2 py-2 px-4 rounded-lg bg-main-700 text-white self-start">
              Explore Market
            </div>
          </Link>

          <div
            className={cn(
              "p-6 rounded-xl bg-white/10 backdrop-blur-md",
              "flex flex-col gap-3"
            )}
          >
            <h2 className="text-xl font-medium text-white">Coming Soon</h2>
            <p className="text-white/70">
              More prediction markets will be available soon
            </p>
            <div className="mt-2 py-2 px-4 rounded-lg bg-white/20 text-white/50 self-start">
              Stay Tuned
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicContainer;
