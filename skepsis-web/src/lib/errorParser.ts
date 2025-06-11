/**
 * Utility functions for parsing blockchain error messages and converting them to user-friendly messages
 */

interface ErrorCodeMapping {
  [key: number]: string;
}

// Error codes from the distribution_market.move contract
const DISTRIBUTION_MARKET_ERROR_CODES: ErrorCodeMapping = {
  1000: "Insufficient liquidity for this operation",
  1010: "Invalid operation parameters",
  1020: "Market access denied",
  1030: "Share cap exceeded",
  
  // Position operation errors
  1040: "Position not found",
  1041: "Spread not found",
  1042: "Insufficient shares to sell",
  1043: "Insufficient funds",
  1044: "Market is not open for trading",
  1045: "Market has not been resolved yet",
  1046: "Rewards have already been claimed",
  1047: "Bidding deadline has passed",
  1048: "Invalid number of shares to buy",
  1049: "Invalid number of shares to sell",
  1050: "Price slippage too high, try again with higher tolerance",
};

// Common user-friendly error messages for different scenarios
const CONTEXT_BASED_MESSAGES: { [key: string]: ErrorCodeMapping } = {
  'claim_winnings': {
    1045: "This market hasn't been resolved yet. Please wait for the resolution before claiming rewards.",
    1046: "You have already claimed your rewards for this market.",
    1040: "You don't have any position in this market to claim rewards from.",
  },
  'buy_shares': {
    1047: "The bidding period for this market has ended. No more shares can be purchased.",
    1043: "You don't have enough USDC to complete this purchase.",
    1044: "This market is currently closed for trading.",
    1050: "The price moved too much. Please try again or increase your slippage tolerance.",
  },
  'sell_shares': {
    1042: "You don't have enough shares to complete this sale.",
    1044: "This market is currently closed for trading.",
    1050: "The price moved too much. Please try again or reduce your minimum expected amount.",
  },
};

/**
 * Extracts error code from a Move abort error message
 * @param errorMessage - The raw error message from the blockchain
 * @returns The error code if found, null otherwise
 */
function extractErrorCode(errorMessage: string): number | null {
  // Look for MoveAbort pattern with error code
  const moveAbortMatch = errorMessage.match(/MoveAbort\([^,]+,\s*(\d+)\)/);
  if (moveAbortMatch) {
    return parseInt(moveAbortMatch[1]);
  }
  
  // Look for other error code patterns
  const errorCodeMatch = errorMessage.match(/error[:\s]*(\d+)/i);
  if (errorCodeMatch) {
    return parseInt(errorCodeMatch[1]);
  }
  
  return null;
}

/**
 * Extracts function name from a Move abort error message
 * @param errorMessage - The raw error message from the blockchain
 * @returns The function name if found, null otherwise
 */
function extractFunctionName(errorMessage: string): string | null {
  const functionMatch = errorMessage.match(/function_name:\s*Some\("([^"]+)"\)/);
  if (functionMatch) {
    return functionMatch[1];
  }
  
  // Try to extract from target pattern if present
  const targetMatch = errorMessage.match(/target.*::([^:]+)$/);
  if (targetMatch) {
    return targetMatch[1];
  }
  
  return null;
}

/**
 * Determines if the error is related to insufficient funds/gas
 * @param errorMessage - The raw error message
 * @returns true if it's a funds/gas related error
 */
function isInsufficientFundsError(errorMessage: string): boolean {
  const insufficientFundsPatterns = [
    /insufficient.*funds/i,
    /insufficient.*gas/i,
    /not.*enough.*sui/i,
    /balance.*too.*low/i,
    /InsufficientGas/i,
  ];
  
  return insufficientFundsPatterns.some(pattern => pattern.test(errorMessage));
}

/**
 * Determines if the error is related to network/connectivity issues
 * @param errorMessage - The raw error message
 * @returns true if it's a network related error
 */
function isNetworkError(errorMessage: string): boolean {
  const networkPatterns = [
    /network.*error/i,
    /connection.*failed/i,
    /timeout/i,
    /fetch.*failed/i,
    /network.*request.*failed/i,
  ];
  
  return networkPatterns.some(pattern => pattern.test(errorMessage));
}

/**
 * Parses a blockchain error message and returns a user-friendly version
 * @param errorMessage - The raw error message from the blockchain
 * @param context - Optional context about what operation was being performed (e.g., 'claim_winnings', 'buy_shares')
 * @returns A user-friendly error message
 */
export function parseErrorMessage(errorMessage: string, context?: string): string {
  if (!errorMessage) {
    return "An unknown error occurred. Please try again.";
  }
  
  // Handle common non-blockchain errors first
  if (isInsufficientFundsError(errorMessage)) {
    return "You don't have enough SUI to pay for transaction fees. Please add SUI to your wallet.";
  }
  
  if (isNetworkError(errorMessage)) {
    return "Network connection error. Please check your internet connection and try again.";
  }
  
  // Handle specific error patterns
  if (errorMessage.toLowerCase().includes('user rejected') || errorMessage.toLowerCase().includes('user denied')) {
    return "Transaction was cancelled by user.";
  }
  
  if (errorMessage.toLowerCase().includes('wallet not connected')) {
    return "Please connect your wallet to continue.";
  }
  
  // Extract error code from Move abort errors
  const errorCode = extractErrorCode(errorMessage);
  const functionName = extractFunctionName(errorMessage);
  
  if (errorCode !== null) {
    // First try context-specific message
    if (context && CONTEXT_BASED_MESSAGES[context] && CONTEXT_BASED_MESSAGES[context][errorCode]) {
      return CONTEXT_BASED_MESSAGES[context][errorCode];
    }
    
    // Fall back to general error code message
    if (DISTRIBUTION_MARKET_ERROR_CODES[errorCode]) {
      return DISTRIBUTION_MARKET_ERROR_CODES[errorCode];
    }
    
    // If we have a function name, provide more context
    if (functionName) {
      return `Operation failed in ${functionName}. Error code: ${errorCode}. Please try again or contact support.`;
    }
    
    return `Transaction failed with error code ${errorCode}. Please try again or contact support.`;
  }
  
  // Handle dry run failures without specific error codes
  if (errorMessage.includes('Dry run failed')) {
    if (errorMessage.includes('could not automatically determine a budget')) {
      return "Unable to estimate transaction costs. Please try again or contact support.";
    }
    return "Transaction validation failed. Please check your inputs and try again.";
  }
  
  // Handle other common error patterns
  if (errorMessage.includes('Transaction failed')) {
    return "Transaction failed. Please try again.";
  }
  
  if (errorMessage.includes('Invalid')) {
    return "Invalid transaction parameters. Please check your inputs.";
  }
  
  // For development purposes, you might want to see the full error
  // In production, you'd want to log this and show a generic message
  if (process.env.NODE_ENV === 'development') {
    console.error('Unparsed error:', errorMessage);
  }
  
  // Generic fallback message
  return "Transaction failed. Please try again or contact support if the problem persists.";
}

/**
 * Shorthand function for parsing claim-related errors
 * @param errorMessage - The raw error message
 * @returns A user-friendly error message specific to claiming operations
 */
export function parseClaimError(errorMessage: string): string {
  return parseErrorMessage(errorMessage, 'claim_winnings');
}

/**
 * Shorthand function for parsing buy-related errors
 * @param errorMessage - The raw error message
 * @returns A user-friendly error message specific to buying operations
 */
export function parseBuyError(errorMessage: string): string {
  return parseErrorMessage(errorMessage, 'buy_shares');
}

/**
 * Shorthand function for parsing sell-related errors
 * @param errorMessage - The raw error message
 * @returns A user-friendly error message specific to selling operations
 */
export function parseSellError(errorMessage: string): string {
  return parseErrorMessage(errorMessage, 'sell_shares');
}

/**
 * Helper function to determine if an error is likely a user action issue vs system issue
 * @param errorMessage - The raw error message
 * @returns true if the error is likely due to user action, false if it's a system issue
 */
export function isUserActionError(errorMessage: string): boolean {
  const errorCode = extractErrorCode(errorMessage);
  
  // These error codes indicate user action issues
  const userActionErrorCodes = [1042, 1043, 1046, 1047, 1048, 1049, 1050];
  
  if (errorCode !== null && userActionErrorCodes.includes(errorCode)) {
    return true;
  }
  
  // Check for other user action patterns
  const userActionPatterns = [
    /insufficient/i,
    /not enough/i,
    /already claimed/i,
    /deadline.*passed/i,
    /invalid.*amount/i,
    /slippage.*too.*high/i,
  ];
  
  return userActionPatterns.some(pattern => pattern.test(errorMessage));
}
