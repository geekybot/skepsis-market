import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { FC, useContext, useEffect, useState } from "react";
import { COIN } from "bucket-protocol-sdk";
import { ConnectModal, useCurrentWallet } from "@mysten/dapp-kit";
import ConnectMenu from "./ui/connectMenu";
import "@mysten/dapp-kit/dist/index.css";
import { AppContext } from "@/context/AppContext";
import { Link as LinkIcon } from "lucide-react";

// import SlideInMenu from "./slideInMenu";
// import RpcSetting from "./rpcSetting";

const Header = () => {
  const { walletAddress, suiName, refreshWalletState } = useContext(AppContext);
  const { currentWallet } = useCurrentWallet();
  const [previousWalletId, setPreviousWalletId] = useState<string | undefined>(undefined);

  // Listen for wallet changes
  useEffect(() => {
    if (!currentWallet) return;
    
    // If the wallet changed
    if (previousWalletId !== currentWallet.id) {
      setPreviousWalletId(currentWallet.id);
      refreshWalletState();
      
      // Dispatch a custom event for other components
      const event = new Event("walletChanged");
      window.dispatchEvent(event);
    }
  }, [currentWallet, previousWalletId, refreshWalletState]);

  return (
    <div
      className="fixed top-0 left-0 w-full backdrop-blur-md bg-gradient-to-r from-indigo-950/90 to-violet-950/90 z-50 shadow-md shadow-indigo-900/20 border-b border-indigo-800/20"
      style={{
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <header className="w-full max-w-360 mx-auto h-20 flex items-center justify-between pt-4 pb-3 px-4">
        {/* Logo Link */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
            <div className="flex items-center justify-center w-9 h-9 bg-gradient-to-br from-indigo-900/70 to-violet-900/70 rounded-lg shadow-sm">
              <Image 
                src="/images/skepsis-transparent.png" 
                alt="Skepsis Logo" 
                width={32} 
                height={32} 
                className="object-contain group-hover:scale-110 transition-transform duration-200"
                priority={true}
              />
            </div>
            <span className="text-xl lg:text-3xl font-extrabold bg-gradient-to-r from-white to-indigo-100 bg-clip-text text-transparent drop-shadow-sm">Skepsis</span>
          </Link>
          <nav className="hidden md:flex items-center gap-5">
            <Link href="/">
              <span className="text-sm font-medium text-white/80 hover:text-white transition-all hover:drop-shadow-sm">
                Home
              </span>
            </Link>
            <Link href="/prediction">
              <span className="text-sm font-medium text-white/80 hover:text-white transition-all hover:drop-shadow-sm">
                Prediction Markets
              </span>
            </Link>
            <Link href="/create-market">
              <span className="text-sm font-medium text-white/80 hover:text-white transition-all hover:drop-shadow-sm">
                Create Market
              </span>
            </Link>
            <Link href="/liquidity">
              <span className="text-sm font-medium text-white/80 hover:text-white transition-all hover:drop-shadow-sm">
                Liquidity
              </span>
            </Link>
            <Link href="/faucet">
              <span className="text-sm font-medium text-white/80 hover:text-white transition-all hover:drop-shadow-sm">
                Faucet
              </span>
            </Link>
            <Link href="/docs">
              <span className="text-sm font-medium text-white/80 hover:text-white transition-all hover:drop-shadow-sm">
                Docs
              </span>
            </Link>
          </nav>
        </div>

        {/* Connect Button */}
        {walletAddress ? (
          <ConnectMenu walletAddress={walletAddress} suiName={suiName} />
        ) : (
          <ConnectModal
            trigger={
              <button
                className="outline-none ring-0 xl:button-animate-105 overflow-hidden"
                disabled={!!walletAddress}
              >
                <div className="px-5 py-3 flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 transition-colors shadow-md shadow-indigo-900/20">
                  <span className="text-sm font-medium text-white">
                    {walletAddress ? "Connected" : "Connect Wallet"}
                  </span>
                  <LinkIcon size={17} className="text-white" />
                </div>
              </button>
            }
          />
        )}
      </header>
    </div>
  );
};

export default Header;
