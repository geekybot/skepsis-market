import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { useState } from "react";

const SuiOverflowBanner = () => {
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't render if dismissed
  if (isDismissed) {
    return null;
  }

  return (
    <div className="w-full bg-gradient-to-r from-amber-50/95 to-yellow-50/95 backdrop-blur-md border-b border-amber-200/50 relative overflow-hidden shadow-sm">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-100/20 to-orange-100/20"></div>
      <div className="absolute top-0 left-1/4 w-32 h-full bg-gradient-to-b from-amber-200/20 to-transparent transform -skew-x-12"></div>
      <div className="absolute top-0 right-1/3 w-24 h-full bg-gradient-to-b from-yellow-200/20 to-transparent transform skew-x-12"></div>
      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-amber-200/0 via-amber-300/50 to-amber-200/0"></div>
      
      <div className="relative z-10 w-full max-w-6xl mx-auto px-3 sm:px-4 py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm flex-1 min-w-0">
            <span className="text-base sm:text-lg animate-pulse flex-shrink-0">📢</span>
            <span className="text-gray-800 font-medium truncate sm:text-clip">
              Don't miss the 
              <Link 
                href="/competition" 
                className="mx-1 text-blue-700 hover:text-blue-800 font-semibold underline decoration-2 underline-offset-2 hover:decoration-blue-800 transition-all"
              >
                Sui Overflow Campaign
              </Link>
              - predict hackathon winners and earn rewards!
            </span>
            <Link 
              href="https://vote.sui.io/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1 text-blue-700 hover:text-blue-800 font-medium hover:bg-blue-50/70 px-2 py-1 rounded-md transition-all flex-shrink-0"
            >
              <span className="text-xs">Vote Now</span>
              <ExternalLink size={12} />
            </Link>
          </div>
          
          {/* Close button */}
          <button
            onClick={() => setIsDismissed(true)}
            className="text-gray-600 hover:text-gray-800 text-base sm:text-lg opacity-70 hover:opacity-100 transition-all ml-2 sm:ml-4 flex-shrink-0 touch-target flex items-center justify-center"
            title="Dismiss banner"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuiOverflowBanner;