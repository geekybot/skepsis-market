import Link from "next/link";
import Image from "next/image";

const Footer = () => {
  return (
    <div
      className="w-full backdrop-blur-md bg-gradient-to-r from-indigo-950/80 to-violet-950/80 border-t border-indigo-800/20"
      style={{
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <footer className="w-full max-w-360 mx-auto flex flex-col items-center justify-center gap-3 sm:gap-2 py-4 sm:pb-5 px-4">
        <div className="flex items-center gap-2 mb-1 sm:mb-2">
          <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6">
            <Image
              src="/images/skepsis-transparent.png"
              alt="Skepsis Logo"
              width={20}
              height={20}
              className="object-contain sm:w-6 sm:h-6"
              priority
            />
          </div>
          <span className="text-amber-400 font-medium text-xs sm:text-sm text-center">COLLECTIVE KNOWLEDGE SYNTHESIS</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <Link href="/prediction" className="text-white/70 hover:text-white transition-all text-xs sm:text-sm">
            Markets
          </Link>
          <Link href="/sui-overflow-campaign" className="text-white/70 hover:text-white transition-all text-xs sm:text-sm">
            Sui Overflow
          </Link>
          <Link href="/liquidity" className="text-white/70 hover:text-white transition-all text-xs sm:text-sm">
            Liquidity
          </Link>
          <Link href="/faucet" className="text-white/70 hover:text-white transition-all text-xs sm:text-sm">
            Faucet
          </Link>
          <Link href="/docs" className="text-white/70 hover:text-white transition-all text-xs sm:text-sm">
            Docs
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
