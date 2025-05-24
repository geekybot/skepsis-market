import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useContext, useState, useEffect } from "react";
import { COIN } from "bucket-protocol-sdk";
import { ConnectModal } from "@mysten/dapp-kit";
import ConnectMenu from "./ui/connectMenu";
import "@mysten/dapp-kit/dist/index.css";
import { AppContext } from "@/context/AppContext";
import { Link as LinkIcon } from "lucide-react";

// import SlideInMenu from "./slideInMenu";
// import RpcSetting from "./rpcSetting";

const Header = () => {
  const { walletAddress, suiName } = useContext(AppContext);

  return (
    <div
      className="fixed top-0 left-0 w-full backdrop-blur-md"
      style={{
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <header className="w-full max-w-360 mx-auto h-20 flex items-center justify-between pt-5 pb-3 px-4 z-50">
        {/* Logo Link */}
        <div className="flex items-center gap-6">
          <Link href="/">
            <span className="text-xl lg:text-3xl font-extrabold">Skepsis</span>
          </Link>
          <nav className="hidden md:flex items-center gap-4">
            <Link href="/">
              <span className="text-sm text-white/70 hover:text-white transition-colors">
                Home
              </span>
            </Link>
            <Link href="/prediction">
              <span className="text-sm text-white/70 hover:text-white transition-colors">
                Prediction Markets
              </span>
            </Link>
            <Link href="/faucet">
              <span className="text-sm text-white/70 hover:text-white transition-colors">
                Faucet
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
                className="h-full rounded-[11px] outline-none ring-0 xl:button-animate-105 overflow-hidden p-[1px]"
                disabled={!!walletAddress}
              >
                <div className="h-full px-5 py-4 flex items-center gap-2 rounded-xl bg-white/10">
                  <span className="text-sm">
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
