import { useState } from 'react';
import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { CONSTANTS, MODULES } from '@/constants/appConstants';
import { Position } from './useMarketPositions';

export interface TransactionResult {
    success: boolean;
    error: string | null;
    digest: string | null;
    events: any[] | null;
    createdObjects: any[] | null;
}

/**
 * Hook for executing buy/sell transactions in prediction markets
 */
export function useMarketTransactions() {
    const [isLoading, setIsLoading] = useState<boolean>(false);

    /**
     * Creates a transaction to buy shares from a market
     * @param client SuiClient instance
     * @param marketId The market ID
     * @param spreadIndex The spread index to buy shares for
     * @param sharesAmount Amount of shares to buy
     * @param maxUsdcInput Maximum USDC to spend
     * @param walletAddress User's wallet address
     * @returns A Transaction object ready to be executed
     */
    const buySharesFromMarket = async (
        client: SuiClient,
        marketId: string,
        spreadIndex: number,
        sharesAmount: number,
        maxUsdcInput: number,
        walletAddress: string
    ): Promise<Transaction> => {
        try {
            const tx = new Transaction();

            // Find user's USDC coin to use for purchase
            const { data: coins } = await client.getCoins({
                owner: walletAddress,
                coinType: `${CONSTANTS.PACKAGES.USDC}::${MODULES.USDC}::USDC`,
            });

            if (coins.length === 0) {
                throw new Error('No USDC coins found for purchase');
            }

            // Find a suitable coin to split from
            const coinToUse = coins.find(coin => Number(coin.balance) >= maxUsdcInput);

            if (!coinToUse) {
                throw new Error(`No single coin with sufficient balance (${maxUsdcInput / 1_000_000} USDC) found`);
            }

            console.log(`💰 Using coin ${coinToUse.coinObjectId} with balance ${Number(coinToUse.balance) / 1_000_000} USDC`);

            // Split the max amount needed for the purchase
            const [paymentCoin] = tx.splitCoins(
                tx.object(coinToUse.coinObjectId),
                [tx.pure.u64(maxUsdcInput)]
            );

            // Assuming POSITION_REGISTRY is defined in CONSTANTS
            const positionRegistry = CONSTANTS.OBJECTS.POSITION_REGISTRY || '0x6';

            // Call the buy_exact_shares_with_max_input function
            tx.moveCall({
                target: `${CONSTANTS.PACKAGES.DISTRIBUTION_MARKET_FACTORY}::${MODULES.DISTRIBUTION_MARKET}::buy_exact_shares_with_max_input`,
                typeArguments: [`${CONSTANTS.PACKAGES.USDC}::${MODULES.USDC}::USDC`],
                arguments: [
                    tx.object(positionRegistry),
                    tx.object(marketId),
                    tx.pure.u64(spreadIndex),
                    tx.pure.u64(sharesAmount * 1_000_000), // Convert to 6 decimals
                    paymentCoin,
                    tx.object('0x6'), // Clock object
                ],
            });

            return tx;
        } catch (error) {
            console.error('Error preparing buy transaction:', error);
            throw error;
        }
    };

    /**
     * Creates a transaction to sell shares from a position
     * @param client SuiClient instance
     * @param positionId The position ID to sell from
     * @param sharesAmount Amount of shares to sell
     * @param minUsdcOutput Minimum USDC to receive
     * @param walletAddress User's wallet address
     * @returns A Transaction object ready to be executed
     */
    const sellSharesFromPosition = async (
        client: SuiClient,
        marketId: string,
        spreadIndex: number,
        sharesAmount: number,
        minUsdcOutput: number
    ): Promise<Transaction> => {
        try {
            const tx = new Transaction();
            console.log("minimum usdc output", minUsdcOutput);
            // Call the sell_exact_shares_with_min_output function
            const positionRegistry = CONSTANTS.OBJECTS.POSITION_REGISTRY || '0x6';
            tx.moveCall({
                target: `${CONSTANTS.PACKAGES.DISTRIBUTION_MARKET_FACTORY}::${MODULES.DISTRIBUTION_MARKET}::sell_exact_shares_for_min_output`,
                typeArguments: [`${CONSTANTS.PACKAGES.USDC}::${MODULES.USDC}::USDC`],
                arguments: [
                    tx.object(positionRegistry),
                    tx.object(marketId),
                    tx.pure.u64(spreadIndex),
                    tx.pure.u64(sharesAmount * 1_000_000), // Convert to 6 decimals
                    tx.pure.u64(minUsdcOutput), // Minimum expected USDC output
                    tx.object('0x6'), // Clock object
                ],
            });

            return tx;
        } catch (error) {
            console.error('Error preparing sell transaction:', error);
            throw error;
        }
    };

    /**
     * Creates a transaction to claim rewards from a resolved market
     * @param client SuiClient instance
     * @param marketId The market ID to claim rewards from
     * @param walletAddress User's wallet address
     * @returns A Transaction object ready to be executed
     */
    const claimRewardsFromMarket = async (
        client: SuiClient,
        marketId: string,
        walletAddress: string
    ): Promise<Transaction> => {
        try {
            console.log(`🏆 Creating transaction to claim winnings for market ${marketId}`);
            const tx = new Transaction();

            // Call the claim_winnings function as specified
            tx.moveCall({
                target: `${CONSTANTS.PACKAGES.DISTRIBUTION_MARKET_FACTORY}::${MODULES.DISTRIBUTION_MARKET}::claim_winnings`,
                typeArguments: [`${CONSTANTS.PACKAGES.USDC}::${MODULES.USDC}::USDC`],
                arguments: [
                    tx.object(CONSTANTS.OBJECTS.POSITION_REGISTRY),
                    tx.object(marketId),
                ],
            });

            return tx;
        } catch (error) {
            console.error('Error preparing claim winnings transaction:', error);
            throw error;
        }
    };

    /**
     * Process dry run of a transaction to check for potential errors
     * @param client SuiClient instance
     * @param tx Transaction to check
     * @param sender Sender address
     * @returns true if transaction would succeed, false otherwise
     */
    const validateTransaction = async (
        client: SuiClient,
        tx: Transaction,
        sender: string
    ): Promise<{ isValid: boolean, error: string | null }> => {
        try {
            tx.setSender(sender);

            const dryRunRes = await client.dryRunTransactionBlock({
                transactionBlock: await tx.build({ client }),
            });

            if (dryRunRes.effects.status.status === "failure") {
                return {
                    isValid: false,
                    error: dryRunRes.effects.status.error || "Unknown error"
                };
            }

            return {
                isValid: true,
                error: null
            };
        } catch (error) {
            return {
                isValid: false,
                error: error instanceof Error ? error.message : "Error validating transaction"
            };
        }
    };

    /**
     * Processes a transaction response to extract relevant information
     * @param client SuiClient instance
     * @param digest Transaction digest
     * @returns Processed transaction result
     */
    const processTransactionResult = async (
        client: SuiClient,
        digest: string
    ): Promise<TransactionResult> => {
        try {
            const result = await client.waitForTransaction({
                digest,
                options: {
                    showEffects: true,
                    showEvents: true,
                },
            });

            if (result.effects?.status?.status !== 'success') {
                return {
                    success: false,
                    error: result.effects?.status?.error || "Transaction failed",
                    digest,
                    events: null,
                    createdObjects: null
                };
            }

            // Extract created objects
            const createdObjects = result.effects?.created || [];

            // Extract events
            const events = result.events || [];

            return {
                success: true,
                error: null,
                digest,
                events,
                createdObjects
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Error processing transaction result",
                digest,
                events: null,
                createdObjects: null
            };
        }
    };

    return {
        buySharesFromMarket,
        sellSharesFromPosition,
        claimRewardsFromMarket,
        validateTransaction,
        processTransactionResult,
        isLoading,
        setIsLoading
    };
}