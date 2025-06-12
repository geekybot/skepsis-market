import React, { useState, useContext, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { AppContext } from '@/context/AppContext';
import { toast } from 'react-toastify';
import { 
  useCurrentAccount,
  useSuiClient,
  useSignAndExecuteTransaction
} from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { USDC_CONFIG, NETWORK_CONFIG, getExplorerUrl } from '@/constants/appConstants';
import { showTransactionSuccess } from '@/lib/transactionToasts';
import { parseErrorMessage } from '@/lib/errorParser';

const FaucetPage: NextPage = () => {
  const { walletAddress } = useContext(AppContext);
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  
  // Display 50 USDC as per the command
  const displayAmount = (USDC_CONFIG.faucetAmount / 10**USDC_CONFIG.decimals).toString();
  const [isLoading, setIsLoading] = useState(false);
  const [txStatus, setTxStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<string>('0');
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(false);

  // Get shortened wallet address for display
  const shortenedAddress = walletAddress ? 
    `0x${walletAddress.substring(2, 6)}...${walletAddress.substring(walletAddress.length - 4)}` : 
    'Connect wallet';

  // Fetch USDC balance when wallet is connected
  useEffect(() => {
    async function fetchUsdcBalance() {
      if (!account?.address) {
        setUsdcBalance('0');
        return;
      }

      setIsLoadingBalance(true);
      try {
        // Get all coins of the USDC type owned by the account
        const { data: coinData } = await suiClient.getCoins({
          owner: account.address,
          coinType: USDC_CONFIG.tokenType
        });
        
        // Sum up all USDC balances
        const totalBalance = coinData.reduce((sum, coin) => {
          return sum + BigInt(coin.balance);
        }, BigInt(0));

        // Format with proper decimal places
        const formattedBalance = (Number(totalBalance) / 10**USDC_CONFIG.decimals).toFixed(2);
        setUsdcBalance(formattedBalance);
      } catch (error) {
        console.error('Error fetching USDC balance:', error);
        setUsdcBalance('0');
      } finally {
        setIsLoadingBalance(false);
      }
    }

    fetchUsdcBalance();
  }, [account, suiClient, txStatus]); // Refresh balance after transaction status changes

  /**
   * Handles the request for USDC tokens from the faucet using the airdrop function
   */
  const handleRequest = async () => {
    if (!account) {
      toast.error('Please connect your wallet to request tokens');
      return;
    }

    if (NETWORK_CONFIG.isMainnet) {
      toast.error('Faucet is only available on testnet');
      return;
    }

    setIsLoading(true);
    setTxStatus('idle');
    setTxHash(null);

    try {
      // Create a new transaction
      const tx = new Transaction();
      
      // Call the airdrop function to mint USDC to the user
      // This matches the exact command structure:
      // sui client call --package <package> --module faucet --function airdrop --type-args <token-type> --args <treasury-cap> --gas-budget 10000000
      tx.moveCall({
        target: `${USDC_CONFIG.packageId}::${USDC_CONFIG.module}::${USDC_CONFIG.faucetFunction}`,
        typeArguments: [USDC_CONFIG.tokenType],
        arguments: [
          tx.object(USDC_CONFIG.treasuryCap),
        ],
        // No need to specify recipient as the command doesn't have one - it will use the sender address
      });
      
      tx.setSender(account.address);
      tx.setGasBudget(10000000); // Using same gas budget as provided in the command
      
      // Dry run to check for errors
      const dryRunRes = await suiClient.dryRunTransactionBlock({
        transactionBlock: await tx.build({ client: suiClient }),
      });
      
      if (dryRunRes.effects.status.status === "failure") {
        const friendlyError = parseErrorMessage(dryRunRes.effects.status.error || '');
        toast.error(friendlyError);
        setTxStatus('error');
        setIsLoading(false);
        return;
      }
      
      // Execute the transaction
      signAndExecuteTransaction(
        {
          transaction: tx,
        },
        {
          onSuccess: async (txResult) => {
            const digest = txResult.digest;
            setTxHash(digest);
            
            // Wait for transaction to be confirmed
            const finalRes = await suiClient.waitForTransaction({
              digest,
              options: {
                showEffects: true,
              },
            });
            
            if (finalRes.effects?.status.status === "success") {
              setTxStatus('success');
              showTransactionSuccess(`Successfully sent ${displayAmount} ${USDC_CONFIG.symbol} to your wallet!`, digest);
            } else {
              setTxStatus('error');
              const friendlyError = parseErrorMessage(finalRes.effects?.status.error || 'Transaction failed');
              toast.error(friendlyError);
            }
            setIsLoading(false);
          },
          onError: (error) => {
            console.error("Transaction failed:", error);
            setTxStatus('error');
            const friendlyError = parseErrorMessage(error.message || 'Transaction failed');
            toast.error(friendlyError);
            setIsLoading(false);
          }
        }
      );
    } catch (error: any) {
      console.error('Faucet transaction error:', error);
      setTxStatus('error');
      const friendlyError = parseErrorMessage(error.message || 'Failed to send tokens');
      toast.error(friendlyError);
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Skepsis - {USDC_CONFIG.symbol} Faucet</title>
        <meta name="description" content={`Get ${USDC_CONFIG.symbol} tokens to trade on Skepsis prediction markets`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Header with wallet connection */}
      <Header />

      <main className="min-h-screen flex flex-col items-center justify-center px-6 py-8 pt-36">
        <div className="w-full max-w-md p-6 rounded-lg bg-[#1E1E1E]/60 backdrop-blur-lg shadow-xl">
          {/* USDC Balance Display */}
          <div className="bg-[#333333] rounded-lg p-4 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 relative">
                <Image 
                  src="/images/coins/usdc-icon.png" 
                  alt="USDC" 
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <div className="text-white/70 text-xs">Current Balance</div>
                <div className="text-white font-medium">
                  {isLoadingBalance ? 
                    'Loading...' : 
                    `${usdcBalance} ${USDC_CONFIG.symbol}`
                  }
                </div>
              </div>
            </div>
            <div className="py-1 px-3 bg-[#444444] rounded text-xs text-white/70">
              {shortenedAddress}
            </div>
          </div>
          
          {/* Environment indicator */}
          <div className="text-center mb-3">
            <span className="text-xs bg-yellow-500/20 text-yellow-300 py-1 px-2 rounded">
              {NETWORK_CONFIG.isMainnet ? 'MAINNET' : 'TESTNET'}
            </span>
          </div>
          
          {/* Hello message */}
          <div className="text-center mb-8">
            <h2 className="text-xl text-white">Hello!</h2>
            <p className="text-sm text-white/70 mt-1">Request {USDC_CONFIG.symbol} to trade on Skepsis</p>
          </div>
          
          {/* Wallet Address Display */}
          <div className="mb-8">
            <div className="flex items-center justify-between p-3 px-4 rounded-md bg-[#333333] text-white text-sm">
              <span className="truncate max-w-[320px]">{walletAddress || 'Connect wallet...'}</span>
              {walletAddress && <span className="ml-2">✓</span>}
            </div>
          </div>

          {/* Request Button */}
          <button
            onClick={handleRequest}
            disabled={isLoading || !walletAddress || NETWORK_CONFIG.isMainnet}
            className={cn(
              "w-full py-3 px-4 rounded-md text-white transition-all text-center",
              walletAddress && !NETWORK_CONFIG.isMainnet
                ? "bg-[#333333] hover:bg-[#444444]"
                : "bg-[#333333]/50 cursor-not-allowed"
            )}
          >
            {isLoading ? 'Processing...' : `Request ${displayAmount} ${USDC_CONFIG.symbol}`}
          </button>
          
          {/* Transaction Status */}
          {txStatus === 'success' && txHash && (
            <div className="mt-6 p-3 rounded-md bg-green-500/20 border border-green-500/30">
              <div className="flex items-center text-green-300 mb-2">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Transaction Successful</span>
              </div>
              <div className="text-xs text-white/70 break-all">
                <span className="text-white/50">Hash: </span>
                <a 
                  href={getExplorerUrl(txHash)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-300 hover:underline"
                >
                  {txHash}
                </a>
              </div>
            </div>
          )}
          
          {txStatus === 'error' && (
            <div className="mt-6 p-3 rounded-md bg-red-500/20 border border-red-500/30 text-red-300">
              <div className="flex items-center mb-1">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
                <span>Transaction Failed</span>
              </div>
              <div className="text-xs">Please try again or contact support.</div>
            </div>
          )}
          
          {/* Rate limit notice */}
          <div className="mt-8 text-xs text-center text-white/50">
            <p>Limited to {displayAmount} {USDC_CONFIG.symbol} per request. Maximum {USDC_CONFIG.dailyLimit / 10**USDC_CONFIG.decimals} {USDC_CONFIG.symbol} per day.</p>
          </div>
        </div>
        <Footer />
      </main>
    </>
  );
};

export default FaucetPage;