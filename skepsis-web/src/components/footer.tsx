import Link from "next/link";
import Image from "next/image";

const Footer = () => {
  return (
    <div
      className="fixed bottom-0 left-0 w-full backdrop-blur-md bg-gradient-to-r from-indigo-950/80 to-violet-950/80 z-50"
      style={{
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <footer className="w-full max-w-360 mx-auto flex flex-col items-center justify-center gap-2 pb-5 px-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center justify-center w-6 h-6">
            <Image
              src="/images/skepsis-transparent.png"
              alt="Skepsis Logo"
              width={24}
              height={24}
              className="object-contain"
              priority
            />
          </div>
          <span className="text-amber-400 font-medium">COLLECTIVE KNOWLEDGE SYNTHESIS</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/prediction" className="text-white/70 hover:text-white transition-all text-sm">
            Markets
          </Link>
          <Link href="/liquidity" className="text-white/70 hover:text-white transition-all text-sm">
            Liquidity
          </Link>
          <Link href="/faucet" className="text-white/70 hover:text-white transition-all text-sm">
            Faucet
          </Link>
          <Link href="/docs" className="text-white/70 hover:text-white transition-all text-sm">
            Docs
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
