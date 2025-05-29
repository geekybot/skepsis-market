import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { PropsWithChildren, createContext, useEffect, useMemo, useState } from "react";
import { useResolveSuiNSName } from "@mysten/dapp-kit";

interface IAppContextProps {
  walletAddress: string | undefined;
  suiName: string | null | undefined;
  refreshWalletState: () => void;
}

export const AppContext = createContext<IAppContextProps>({
  walletAddress: undefined,
  suiName: undefined,
  refreshWalletState: () => {},
});

export const AppContextProvider = (props: PropsWithChildren) => {
  const client = useSuiClient();
  const account = useCurrentAccount();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const walletAddress = useMemo(() => {
    return account?.address;
  }, [account, refreshTrigger]);

  const { data: suiName } = useResolveSuiNSName(walletAddress);

  // Function to force refresh the wallet state
  const refreshWalletState = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Listen for wallet change events
  useEffect(() => {
    const handleWalletChange = () => {
      refreshWalletState();
    };

    window.addEventListener('walletChanged', handleWalletChange);
    
    // Clean up
    return () => {
      window.removeEventListener('walletChanged', handleWalletChange);
    };
  }, []);

  return (
    <>
      <AppContext.Provider
        value={{
          walletAddress,
          suiName,
          refreshWalletState,
        }}
      >
        {props.children}
      </AppContext.Provider>
    </>
  );
};
