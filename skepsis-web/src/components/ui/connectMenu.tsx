import { cn } from "@/lib/utils";
import Image from "next/image";
import { useCurrentAccount, useDisconnectWallet } from "@mysten/dapp-kit";
import { BiExit } from "react-icons/bi";
import { SlMagnifier } from "react-icons/sl";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "./dropdown-menu";
import { useMemo } from "react";
import useMeidaSize from "@/hooks/useMediaSize";
import { ClipboardCopyIcon, User } from "lucide-react";
import { toast } from "react-toastify";
import RpcMenu from "./rpcMenu";
import NetworkMenu from "./networkMenu";

const ConnectMenu = ({
  walletAddress,
  suiName,
}: {
  walletAddress: string;
  suiName: string | undefined | null;
}) => {
  const screenWidth = useMeidaSize();
  const isDesktop = screenWidth >= 1280;
  const { mutate: disconnectWallet } = useDisconnectWallet();

  const displayName = useMemo(() => {
    if (suiName) {
      if (suiName.length > 14) {
        return suiName.slice(0, 4) + "..." + suiName.slice(-3);
      }

      return suiName;
    }

    if (walletAddress) {
      return walletAddress?.slice(0, 4) + "..." + walletAddress?.slice(-4);
    }

    return undefined;
  }, [walletAddress, suiName]);

  return (
    <DropdownMenu>
      {/* Trigger */}
      <DropdownMenuTrigger className="px-5 py-3 rounded-lg flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 outline-none ring-0 xl:button-animate-105 shadow-md shadow-indigo-900/20 transition-colors">
        <div className={cn("w-3 aspect-square rounded-[50%] bg-emerald-400")} />
        <span className="text-sm font-medium text-white">{displayName ? displayName : "Connect"}</span>
      </DropdownMenuTrigger>
      {/* Content */}
      <DropdownMenuContent
        align={"end"}
        className="relative flex w-44 flex-col items-center bg-gradient-to-br from-indigo-950/90 to-violet-950/90 border border-indigo-800/30 overflow-hidden shadow-lg"
      >
        <div
          className="absolute top-0 left-0 w-full h-full -z-[1] backdrop-blur-md"
          style={{
            WebkitBackdropFilter: "blur(12px)",
          }}
        />
        <DropdownMenuGroup className="w-full p-0 m-0">
          {/* Copy Address */}
          <DropdownMenuItem className="DropdownMenuItem w-full">
            <button
              className="w-full flex items-center justify-start gap-2 rounded-lg px-3 py-2.5 hover:bg-indigo-800/30 transition-colors"
              onClick={() => {
                window.navigator.clipboard.writeText(walletAddress);
                toast.info("Your address copied to clipboard");
              }}
            >
              <ClipboardCopyIcon
                strokeWidth={2}
                className="h-4 w-4 text-indigo-200"
              />
              <span className="text-sm text-white">Copy Address</span>
            </button>
          </DropdownMenuItem>
          {/* Dashboard */}
          <DropdownMenuItem className="DropdownMenuItem w-full">
            <Link
              href="/dashboard"
              className="w-full"
            >
              <button className="w-full flex items-center justify-start gap-2 rounded-lg px-3 py-2.5 hover:bg-indigo-800/30 transition-colors">
                <User strokeWidth={2} className="h-4 w-4 text-indigo-200" />
                <span className="text-sm text-white">Dashboard</span>
              </button>
            </Link>
          </DropdownMenuItem>
          {/* Explorer */}
          <DropdownMenuItem className="DropdownMenuItem w-full">
            <Link
              href={`https://suivision.xyz/account/${walletAddress}`}
              target="_blank"
              className="w-full"
            >
              <button className="w-full flex items-center justify-start gap-2 rounded-lg px-3 py-2.5 hover:bg-indigo-800/30 transition-colors">
                <SlMagnifier strokeWidth={2} className="h-4 w-4 text-indigo-200" />
                <span className="text-sm text-white">Explorer</span>
              </button>
            </Link>
          </DropdownMenuItem>
          {/* Network Setting */}
          <NetworkMenu />
          {/* RPC Setting */}
          <RpcMenu />
          {/* <DropdownMenuSeparator className="bg-white h-[1px] w-full m-0 p-0" /> */}
          {/* Disconnect */}
          <DropdownMenuItem className="DropdownMenuItem w-full">
            <button
              className="w-full flex items-center justify-start gap-2 rounded-lg px-3 py-2.5 hover:bg-red-800/30 transition-colors"
              onClick={() => disconnectWallet()}
            >
              <BiExit strokeWidth={1} className="h-4 w-4 text-red-300" />
              <span className="text-sm text-red-200">Disconnect</span>
            </button>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ConnectMenu;
