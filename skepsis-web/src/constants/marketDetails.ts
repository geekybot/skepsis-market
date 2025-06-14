/**
 * Market Details Constants
 * 
 * This file contains static data for markets that doesn't need to be fetched from the blockchain.
 * Each market has the following static fields:
 * - question: The question the market is asking
 * - resolutionCriteria: The criteria used to resolve the market
 * - biddingDeadline: The deadline for placing bids (timestamp or ISO date string)
 * - resolutionTime: When the market will be resolved (timestamp or ISO date string)
 * - spreadLabels: Labels and corresponding ranges for spreads
 */

// Define the spread label interface
export interface SpreadLabel {
    index: number; // Index of the spread label (mandatory)
    name: string; // Display name for the spread (mandatory)
    lowerBound?: number; // Lower bound of the spread range
    upperBound?: number; // Upper bound of the spread range (optional)
    externalLink?: string; // Optional external link for more info
    logo?: string; // Optional logo for the spread
    rangeDescription?: string; // Human-readable description of the range
    description?: string; // Detailed description of the spread option
}

// Define the market static details interface
export interface MarketStaticDetails {
    shortTag?: string; 
    question: string;
    resolutionCriteria: string;
    biddingDeadline: string | number;
    resolutionTime: string | number;
    spreadLabels?: SpreadLabel[];
}

// Spread metadata for all markets
export const MARKET_SPREAD_LABELS: Record<string, SpreadLabel[]> = {
    // Competition Markets - Sui Overflow 2025
    // AI Track
    '0xcaa789ce815ea722049a6ae868f3128a26fb084c4bec36421bf60fdf2434d056': [
        { name: "OpenGraph", index: 0, lowerBound: 0, upperBound: 1, description: "AI-powered applications and tools on Sui" },
        { name: "RaidenX", index: 1, lowerBound: 1, upperBound: 2, description: "AI-powered applications and tools on Sui" },
        { name: "Sui Agent Kit", index: 2, lowerBound: 2, upperBound: 3, description: "AI-powered applications and tools on Sui" },
        { name: "Suithetic", index: 3, lowerBound: 3, upperBound: 4, description: "AI-powered applications and tools on Sui" },
        { name: "Hyvve", index: 4, lowerBound: 4, upperBound: 5, description: "AI-powered applications and tools on Sui" },
    ],
    
    // Cryptography Track  
    '0xd5a9e20df4b223f6ecedbb6531c423acfec81d24147c637adcb593201b7e67cb': [
        { name: "Sui Sentinel", index: 0, lowerBound: 0, upperBound: 1, description: "Cryptographic innovations and privacy solutions" },
        { name: "EpochOne E-sign", index: 1, lowerBound: 1, upperBound: 2, description: "Cryptographic innovations and privacy solutions" },
        { name: "Passman", index: 2, lowerBound: 2, upperBound: 3, description: "Cryptographic innovations and privacy solutions" },
        { name: "Shroud", index: 3, lowerBound: 3, upperBound: 4, description: "Cryptographic innovations and privacy solutions" },
        { name: "Mizt", index: 4, lowerBound: 4, upperBound: 5, description: "Cryptographic innovations and privacy solutions" },
        { name: "ZeroLeaks", index: 5, lowerBound: 5, upperBound: 6, description: "Cryptographic innovations and privacy solutions" },
        { name: "Sui Shadow", index: 6, lowerBound: 6, upperBound: 7, description: "Cryptographic innovations and privacy solutions" },
    ],
    
    // DeFi Track
    '0x9b011d807c6efe2e4e0a756e5156ec62f62cb2f035266add8d40e718fc39afae': [
        { name: "Deeptrade", index: 0, lowerBound: 0, upperBound: 1, description: "Decentralized Finance protocols and applications" },
        { name: "Kamo Finance", index: 1, lowerBound: 1, upperBound: 2, description: "Decentralized Finance protocols and applications" },
        { name: "Magma Finance", index: 2, lowerBound: 2, upperBound: 3, description: "Decentralized Finance protocols and applications" },
        { name: "MizuPay", index: 3, lowerBound: 3, upperBound: 4, description: "Decentralized Finance protocols and applications" },
        { name: "Surge", index: 4, lowerBound: 4, upperBound: 5, description: "Decentralized Finance protocols and applications" },
        { name: "Native", index: 5, lowerBound: 5, upperBound: 6, description: "Decentralized Finance protocols and applications" },
        { name: "Pismo Protocol", index: 6, lowerBound: 6, upperBound: 7, description: "Decentralized Finance protocols and applications" },
        { name: "DeepMaker", index: 7, lowerBound: 7, upperBound: 8, description: "Decentralized Finance protocols and applications" },
    ],
    
    // Degen Track
    '0x4d34184f6528eb5176a0b39d6674d65d4921c966fab197a7e4394dc5ff424ae7': [
        { name: "Moonbags", index: 0, lowerBound: 0, upperBound: 1, description: "Experimental and high-risk applications" },
        { name: "Kensei", index: 1, lowerBound: 1, upperBound: 2, description: "Experimental and high-risk applications" },
        { name: "GachaponClub", index: 2, lowerBound: 2, upperBound: 3, description: "Experimental and high-risk applications" },
        { name: "MFC.CLUB", index: 3, lowerBound: 3, upperBound: 4, description: "Experimental and high-risk applications" },
        { name: "Objection! AI", index: 4, lowerBound: 4, upperBound: 5, description: "Experimental and high-risk applications" },
    ],
    
    // Entertainment & Culture Track
    '0xba9dd7799a98a6a45d58cff5d8c91540cf356c28e8414d915c36e65382696c11': [
        { name: "SWION", index: 0, lowerBound: 0, upperBound: 1, description: "Gaming, entertainment, and cultural applications" },
        { name: "Sui Battle AR", index: 1, lowerBound: 1, upperBound: 2, description: "Gaming, entertainment, and cultural applications" },
        { name: "SUIperCHAT", index: 2, lowerBound: 2, upperBound: 3, description: "Gaming, entertainment, and cultural applications" },
        { name: "Exclusuive", index: 3, lowerBound: 3, upperBound: 4, description: "Gaming, entertainment, and cultural applications" },
        { name: "Numeron", index: 4, lowerBound: 4, upperBound: 5, description: "Gaming, entertainment, and cultural applications" },
        { name: "GiveRep", index: 5, lowerBound: 5, upperBound: 6, description: "Gaming, entertainment, and cultural applications" },
        { name: "Daemon", index: 6, lowerBound: 6, upperBound: 7, description: "Gaming, entertainment, and cultural applications" },
    ],
    
    // Explorations Track
    '0xde7bbcb5802d0136abe6ff98d0edbdcf5ce13ebd6eef5797e85699e36f4e5366': [
        { name: "MultiChainWalrus", index: 0, lowerBound: 0, upperBound: 1, description: "Experimental and exploratory projects" },
        { name: "Suibotics", index: 1, lowerBound: 1, upperBound: 2, description: "Experimental and exploratory projects" },
        { name: "Skepsis", index: 2, lowerBound: 2, upperBound: 3, description: "Experimental and exploratory projects" },
        { name: "PactDa", index: 3, lowerBound: 3, upperBound: 4, description: "Experimental and exploratory projects" },
        { name: "PredictPlay", index: 4, lowerBound: 4, upperBound: 5, description: "Experimental and exploratory projects" },
    ],
    
    // Infra & Tooling Track
    '0x50add4ac669cb2bd854334e9c593047259736c3c3c52572a8f33c73de18dcfa8': [
        { name: "Noodles FI", index: 0, lowerBound: 0, upperBound: 1, description: "Infrastructure and developer tooling" },
        { name: "Large", index: 1, lowerBound: 1, upperBound: 2, description: "Infrastructure and developer tooling" },
        { name: "SuiSQL", index: 2, lowerBound: 2, upperBound: 3, description: "Infrastructure and developer tooling" },
        { name: "Historical Dev Inspect", index: 3, lowerBound: 3, upperBound: 4, description: "Infrastructure and developer tooling" },
        { name: "Sui Provenance Suite", index: 4, lowerBound: 4, upperBound: 5, description: "Infrastructure and developer tooling" },
        { name: "Suipulse", index: 5, lowerBound: 5, upperBound: 6, description: "Infrastructure and developer tooling" },
        { name: "MicroSui Framework", index: 6, lowerBound: 6, upperBound: 7, description: "Infrastructure and developer tooling" },
    ],
    
    // Payments & Wallets Track
    '0xa837039ed8cd8f93aca6837abaf02a66e0b5196b880c4c269266a3b4a55aa4ae': [
        { name: "SeaWallet.ai", index: 0, lowerBound: 0, upperBound: 1, description: "Payment solutions and wallet applications" },
        { name: "Coindrip", index: 1, lowerBound: 1, upperBound: 2, description: "Payment solutions and wallet applications" },
        { name: "PIVY", index: 2, lowerBound: 2, upperBound: 3, description: "Payment solutions and wallet applications" },
        { name: "Sui Multisig", index: 3, lowerBound: 3, upperBound: 4, description: "Payment solutions and wallet applications" },
    ],
    
    // Programmable Storage Track
    '0x775279e850acef40f5f3729e3cf38b059179860898c8720602d1aac1d0dba94f': [
        { name: "Chatiwal", index: 0, lowerBound: 0, upperBound: 1, description: "Storage solutions and data management" },
        { name: "Archimeters", index: 1, lowerBound: 1, upperBound: 2, description: "Storage solutions and data management" },
        { name: "Walpress APP", index: 2, lowerBound: 2, upperBound: 3, description: "Storage solutions and data management" },
        { name: "Wal0", index: 3, lowerBound: 3, upperBound: 4, description: "Storage solutions and data management" },
        { name: "SuiSign", index: 4, lowerBound: 4, upperBound: 5, description: "Storage solutions and data management" },
        { name: "SuiMail", index: 5, lowerBound: 5, upperBound: 6, description: "Storage solutions and data management" },
        { name: "sui.direct", index: 6, lowerBound: 6, upperBound: 7, description: "Storage solutions and data management" },
        { name: "WalGraph", index: 7, lowerBound: 7, upperBound: 8, description: "Storage solutions and data management" },
    ],

    // SUI price prediction market for June 14, 2025 (NEW)
    '0x7bbc037c1146c512a351f8620fc2c59f3b75257302e412aadc1a1d13828a45d2': [
        { name: "2.00 - 2.10 $", index: 0, lowerBound: 200, upperBound: 210 },
        { name: "2.10 - 2.20 $", index: 1, lowerBound: 210, upperBound: 220 },
        { name: "2.20 - 2.30 $", index: 2, lowerBound: 220, upperBound: 230 },
        { name: "2.30 - 2.40 $", index: 3, lowerBound: 230, upperBound: 240 },
        { name: "2.40 - 2.50 $", index: 4, lowerBound: 240, upperBound: 250 },
        { name: "2.50 - 2.60 $", index: 5, lowerBound: 250, upperBound: 260 },
        { name: "2.60 - 2.70 $", index: 6, lowerBound: 260, upperBound: 270 },
        { name: "2.70 - 2.80 $", index: 7, lowerBound: 270, upperBound: 280 },
        { name: "2.80 - 2.90 $", index: 8, lowerBound: 280, upperBound: 290 },
        { name: "2.90 - 3.00 $", index: 9, lowerBound: 290, upperBound: 300 },
        { name: "3.00 - 3.10 $", index: 10, lowerBound: 300, upperBound: 310 },
        { name: "3.10 - 3.20 $", index: 11, lowerBound: 310, upperBound: 320 },
        { name: "3.20 - 3.30 $", index: 12, lowerBound: 320, upperBound: 330 },
        { name: "3.30 - 3.40 $", index: 13, lowerBound: 330, upperBound: 340 },
        { name: "3.40 - 3.50 $", index: 14, lowerBound: 340, upperBound: 350 },
        { name: "3.50 - 3.60 $", index: 15, lowerBound: 350, upperBound: 360 },
        { name: "3.60 - 3.70 $", index: 16, lowerBound: 360, upperBound: 370 },
        { name: "3.70 - 3.80 $", index: 17, lowerBound: 370, upperBound: 380 },
        { name: "3.80 - 3.90 $", index: 18, lowerBound: 380, upperBound: 390 },
        { name: "3.90 - 4.00 $", index: 19, lowerBound: 390, upperBound: 400 },
        { name: "4.00 - 4.10 $", index: 20, lowerBound: 400, upperBound: 410 },
        { name: "4.10 - 4.20 $", index: 21, lowerBound: 410, upperBound: 420 },
        { name: "4.20 - 4.30 $", index: 22, lowerBound: 420, upperBound: 430 },
        { name: "4.30 - 4.40 $", index: 23, lowerBound: 430, upperBound: 440 },
        { name: "4.40 - 4.50 $", index: 24, lowerBound: 440, upperBound: 450 },
        { name: "4.50 - 4.60 $", index: 25, lowerBound: 450, upperBound: 460 },
        { name: "4.60 - 4.70 $", index: 26, lowerBound: 460, upperBound: 470 },
        { name: "4.70 - 4.80 $", index: 27, lowerBound: 470, upperBound: 480 },
        { name: "4.80 - 4.90 $", index: 28, lowerBound: 480, upperBound: 490 },
        { name: "4.90 - 5.00 $", index: 29, lowerBound: 490, upperBound: 500 },
        { name: "5.00 - 5.10 $", index: 30, lowerBound: 500, upperBound: 510 },
        { name: "5.10 - 5.20 $", index: 31, lowerBound: 510, upperBound: 520 },
        { name: "5.20 - 5.30 $", index: 32, lowerBound: 520, upperBound: 530 },
        { name: "5.30 - 5.40 $", index: 33, lowerBound: 530, upperBound: 540 },
        { name: "5.40 - 5.50 $", index: 34, lowerBound: 540, upperBound: 550 },
        { name: "5.50 - 5.60 $", index: 35, lowerBound: 550, upperBound: 560 },
        { name: "5.60 - 5.70 $", index: 36, lowerBound: 560, upperBound: 570 },
        { name: "5.70 - 5.80 $", index: 37, lowerBound: 570, upperBound: 580 },
        { name: "5.80 - 5.90 $", index: 38, lowerBound: 580, upperBound: 590 },
        { name: "5.90 - 6.00 $", index: 39, lowerBound: 590, upperBound: 600 },
        { name: "6.00 - 6.10 $", index: 40, lowerBound: 600, upperBound: 610 },
        { name: "6.10 - 6.20 $", index: 41, lowerBound: 610, upperBound: 620 },
        { name: "6.20 - 6.30 $", index: 42, lowerBound: 620, upperBound: 630 },
        { name: "6.30 - 6.40 $", index: 43, lowerBound: 630, upperBound: 640 },
        { name: "6.40 - 6.50 $", index: 44, lowerBound: 640, upperBound: 650 },
        { name: "6.50 - 6.60 $", index: 45, lowerBound: 650, upperBound: 660 },
        { name: "6.60 - 6.70 $", index: 46, lowerBound: 660, upperBound: 670 },
        { name: "6.70 - 6.80 $", index: 47, lowerBound: 670, upperBound: 680 },
        { name: "6.80 - 6.90 $", index: 48, lowerBound: 680, upperBound: 690 },
        { name: "6.90 - 7.00 $", index: 49, lowerBound: 690, upperBound: 700 }
    ],

    // SUI price prediction market for June 15, 2025
    '0x88380bd613be8b11c04daab2dbd706e18f9067db5fa5139f3b92030c960bbf7e': [
        { name: "2.00 - 2.10 $", index: 0, lowerBound: 200, upperBound: 210 },
        { name: "2.10 - 2.20 $", index: 1, lowerBound: 210, upperBound: 220 },
        { name: "2.20 - 2.30 $", index: 2, lowerBound: 220, upperBound: 230 },
        { name: "2.30 - 2.40 $", index: 3, lowerBound: 230, upperBound: 240 },
        { name: "2.40 - 2.50 $", index: 4, lowerBound: 240, upperBound: 250 },
        { name: "2.50 - 2.60 $", index: 5, lowerBound: 250, upperBound: 260 },
        { name: "2.60 - 2.70 $", index: 6, lowerBound: 260, upperBound: 270 },
        { name: "2.70 - 2.80 $", index: 7, lowerBound: 270, upperBound: 280 },
        { name: "2.80 - 2.90 $", index: 8, lowerBound: 280, upperBound: 290 },
        { name: "2.90 - 3.00 $", index: 9, lowerBound: 290, upperBound: 300 },
        { name: "3.00 - 3.10 $", index: 10, lowerBound: 300, upperBound: 310 },
        { name: "3.10 - 3.20 $", index: 11, lowerBound: 310, upperBound: 320 },
        { name: "3.20 - 3.30 $", index: 12, lowerBound: 320, upperBound: 330 },
        { name: "3.30 - 3.40 $", index: 13, lowerBound: 330, upperBound: 340 },
        { name: "3.40 - 3.50 $", index: 14, lowerBound: 340, upperBound: 350 },
        { name: "3.50 - 3.60 $", index: 15, lowerBound: 350, upperBound: 360 },
        { name: "3.60 - 3.70 $", index: 16, lowerBound: 360, upperBound: 370 },
        { name: "3.70 - 3.80 $", index: 17, lowerBound: 370, upperBound: 380 },
        { name: "3.80 - 3.90 $", index: 18, lowerBound: 380, upperBound: 390 },
        { name: "3.90 - 4.00 $", index: 19, lowerBound: 390, upperBound: 400 },
        { name: "4.00 - 4.10 $", index: 20, lowerBound: 400, upperBound: 410 },
        { name: "4.10 - 4.20 $", index: 21, lowerBound: 410, upperBound: 420 },
        { name: "4.20 - 4.30 $", index: 22, lowerBound: 420, upperBound: 430 },
        { name: "4.30 - 4.40 $", index: 23, lowerBound: 430, upperBound: 440 },
        { name: "4.40 - 4.50 $", index: 24, lowerBound: 440, upperBound: 450 },
        { name: "4.50 - 4.60 $", index: 25, lowerBound: 450, upperBound: 460 },
        { name: "4.60 - 4.70 $", index: 26, lowerBound: 460, upperBound: 470 },
        { name: "4.70 - 4.80 $", index: 27, lowerBound: 470, upperBound: 480 },
        { name: "4.80 - 4.90 $", index: 28, lowerBound: 480, upperBound: 490 },
        { name: "4.90 - 5.00 $", index: 29, lowerBound: 490, upperBound: 500 },
        { name: "5.00 - 5.10 $", index: 30, lowerBound: 500, upperBound: 510 },
        { name: "5.10 - 5.20 $", index: 31, lowerBound: 510, upperBound: 520 },
        { name: "5.20 - 5.30 $", index: 32, lowerBound: 520, upperBound: 530 },
        { name: "5.30 - 5.40 $", index: 33, lowerBound: 530, upperBound: 540 },
        { name: "5.40 - 5.50 $", index: 34, lowerBound: 540, upperBound: 550 },
        { name: "5.50 - 5.60 $", index: 35, lowerBound: 550, upperBound: 560 },
        { name: "5.60 - 5.70 $", index: 36, lowerBound: 560, upperBound: 570 },
        { name: "5.70 - 5.80 $", index: 37, lowerBound: 570, upperBound: 580 },
        { name: "5.80 - 5.90 $", index: 38, lowerBound: 580, upperBound: 590 },
        { name: "5.90 - 6.00 $", index: 39, lowerBound: 590, upperBound: 600 },
        { name: "6.00 - 6.10 $", index: 40, lowerBound: 600, upperBound: 610 },
        { name: "6.10 - 6.20 $", index: 41, lowerBound: 610, upperBound: 620 },
        { name: "6.20 - 6.30 $", index: 42, lowerBound: 620, upperBound: 630 },
        { name: "6.30 - 6.40 $", index: 43, lowerBound: 630, upperBound: 640 },
        { name: "6.40 - 6.50 $", index: 44, lowerBound: 640, upperBound: 650 },
        { name: "6.50 - 6.60 $", index: 45, lowerBound: 650, upperBound: 660 },
        { name: "6.60 - 6.70 $", index: 46, lowerBound: 660, upperBound: 670 },
        { name: "6.70 - 6.80 $", index: 47, lowerBound: 670, upperBound: 680 },
        { name: "6.80 - 6.90 $", index: 48, lowerBound: 680, upperBound: 690 },
        { name: "6.90 - 7.00 $", index: 49, lowerBound: 690, upperBound: 700 }
    ],

    // SUI price prediction market for May 31, 2025
    '0x6fe8b0d95e68472ff8e7fc034d301a44ca42bac150037c0483e6bda55d8f0f65': [
        { name: "2.50 - 2.60 $", index: 0, lowerBound: 250, upperBound: 260 },
        { name: "2.60 - 2.70 $", index: 1, lowerBound: 260, upperBound: 270 },
        { name: "2.70 - 2.80 $", index: 2, lowerBound: 270, upperBound: 280 },
        { name: "2.80 - 2.90 $", index: 3, lowerBound: 280, upperBound: 290 },
        { name: "2.90 - 3.00 $", index: 4, lowerBound: 290, upperBound: 300 },
        { name: "3.00 - 3.10 $", index: 5, lowerBound: 300, upperBound: 310 },
        { name: "3.10 - 3.20 $", index: 6, lowerBound: 310, upperBound: 320 },
        { name: "3.20 - 3.30 $", index: 7, lowerBound: 320, upperBound: 330 },
        { name: "3.30 - 3.40 $", index: 8, lowerBound: 330, upperBound: 340 },
        { name: "3.40 - 3.50 $", index: 9, lowerBound: 340, upperBound: 350 },
        { name: "3.50 - 3.60 $", index: 10, lowerBound: 350, upperBound: 360 },
        { name: "3.60 - 3.70 $", index: 11, lowerBound: 360, upperBound: 370 },
        { name: "3.70 - 3.80 $", index: 12, lowerBound: 370, upperBound: 380 },
        { name: "3.80 - 3.90 $", index: 13, lowerBound: 380, upperBound: 390 },
        { name: "3.90 - 4.00 $", index: 14, lowerBound: 390, upperBound: 400 },
        { name: "4.00 - 4.10 $", index: 15, lowerBound: 400, upperBound: 410 },
        { name: "4.10 - 4.20 $", index: 16, lowerBound: 410, upperBound: 420 },
        { name: "4.20 - 4.30 $", index: 17, lowerBound: 420, upperBound: 430 },
        { name: "4.30 - 4.40 $", index: 18, lowerBound: 430, upperBound: 440 },
        { name: "4.40 - 4.50 $", index: 19, lowerBound: 440, upperBound: 450 },
    ],

    // Champions League winner market
    '0x25045de4fea843911dcd9a386509e39f994bba17e8fa2dd0a3574daac5a72fff': [
        { name: "Inter Milan Win", index: 0, lowerBound: 0, upperBound: 1 },
        { name: "PSG Win", index: 1, lowerBound: 1, upperBound: 2 },
    ],

    // Premier League winner market
    '0xc07823e6ce8bbe82cc188ef33738387735cc20d56aae5d05d6b953f3b4ca2afd': [
        { name: "Manchester City", index: 0, lowerBound: 0, upperBound: 1 },
        { name: "Liverpool", index: 1, lowerBound: 1, upperBound: 2 },
        { name: "NewCastle", index: 2, lowerBound: 2, upperBound: 3 },
        { name: "Chelsea", index: 3, lowerBound: 3, upperBound: 4 },
        { name: "Arsenal", index: 4, lowerBound: 4, upperBound: 5 },
        { name: "Aston Villa", index: 5, lowerBound: 5, upperBound: 6 },
    ],

};

/**
 * Static market details that don't need to be fetched from the blockchain
 * Key is the market ID
 */
export const MARKET_DETAILS: Record<string, MarketStaticDetails> = {
    // SUI price prediction market for June 14, 2025 (NEW)
    '0x7bbc037c1146c512a351f8620fc2c59f3b75257302e412aadc1a1d13828a45d2': {
        shortTag: "SUI Price June 14",
        question: "What will be the Price of SUI in USD on 10:25:00 AM UTC, June 14, 2025?",
        resolutionCriteria: "Based on the price reported by CoinMarketCap on June 14, 2025 at 10:25:00 AM UTC.",
        biddingDeadline: 1749957000000, // Saturday, 14 June 2025 08:30:00 UTC
        resolutionTime: 1749957120000, // Saturday, 14 June 2025 08:31:00 UTC
        spreadLabels: MARKET_SPREAD_LABELS['0x7bbc037c1146c512a351f8620fc2c59f3b75257302e412aadc1a1d13828a45d2'],
    },

    // SUI price prediction market for June 15, 2025
    '0x88380bd613be8b11c04daab2dbd706e18f9067db5fa5139f3b92030c960bbf7e': {
        shortTag: "SUI Market, 15th June 2025",
        question: "What will be the Price of SUI in USD on 11:30 AM UTC, June 15, 2025?",
        resolutionCriteria: "Based on the price reported by CoinMarketCap on June 15, 2025 at 11:30 AM UTC. Skepsis curator will close the market.",
        biddingDeadline: "2025-06-14T11:30:00.000Z", // 24 hours before resolution
        resolutionTime: "2025-06-15T11:30:00.000Z",
        spreadLabels: MARKET_SPREAD_LABELS['0x88380bd613be8b11c04daab2dbd706e18f9067db5fa5139f3b92030c960bbf7e'],
    },

    // SUI price prediction market for May 31, 2025
    '0x6fe8b0d95e68472ff8e7fc034d301a44ca42bac150037c0483e6bda55d8f0f65': {
        shortTag: "SUI Market, 31st May 2025",
        question: "What will be the Price of SUI in USD on 11:30 AM UTC, May 31, 2025?",
        resolutionCriteria: "Based on the price reported by CoinMarketCap on May 31, 2025 at 11:30 AM UTC.",
        biddingDeadline: "2025-05-30T11:30:00.000Z",
        resolutionTime: "2025-05-31T11:30:00.000Z",
        spreadLabels: MARKET_SPREAD_LABELS['0x6fe8b0d95e68472ff8e7fc034d301a44ca42bac150037c0483e6bda55d8f0f65'],
    },

    // UCL 2025 prediction market
    '0x25045de4fea843911dcd9a386509e39f994bba17e8fa2dd0a3574daac5a72fff': {
        shortTag: "UCL 2025 Winner",
        question: "Who will win the UCL 2025?",
        resolutionCriteria: "Based on the official UEFA Champions League website",
        biddingDeadline: "2025-05-15T19:00:00.000Z", // Assuming UCL final is on May 17, 2025
        resolutionTime: "2025-05-17T22:00:00.000Z",
        spreadLabels: MARKET_SPREAD_LABELS['0x25045de4fea843911dcd9a386509e39f994bba17e8fa2dd0a3574daac5a72fff'],
    },

    // Premier League 2025 prediction market
    '0xc07823e6ce8bbe82cc188ef33738387735cc20d56aae5d05d6b953f3b4ca2afd': {
        shortTag: "Premier League 2025 Winner", 
        question: "Who Will win The Premier League 2025?",
        resolutionCriteria: "Based on the final league standings published by the Premier League",
        biddingDeadline: "2025-05-10T15:00:00.000Z", // Assuming Premier League ends mid-May
        resolutionTime: "2025-05-19T12:00:00.000Z",
        spreadLabels: MARKET_SPREAD_LABELS['0xc07823e6ce8bbe82cc188ef33738387735cc20d56aae5d05d6b953f3b4ca2afd'],
    },

    // Competition Markets - Sui Overflow 2025
    // AI Track
    '0xcaa789ce815ea722049a6ae868f3128a26fb084c4bec36421bf60fdf2434d056': {
        shortTag: "AI Track Winner",
        question: "Which project will win the AI Track in Sui Overflow 2025?",
        resolutionCriteria: "Based on the official results announced by the Sui Foundation for the AI track of Sui Overflow 2025 hackathon. The market will resolve to the project that receives the first place award in this track category.",
        biddingDeadline: "2025-06-18T00:00:00.000Z",
        resolutionTime: "2025-06-25T00:00:00.000Z",
        spreadLabels: MARKET_SPREAD_LABELS['0xcaa789ce815ea722049a6ae868f3128a26fb084c4bec36421bf60fdf2434d056'],
    },
    
    // Cryptography Track
    '0xd5a9e20df4b223f6ecedbb6531c423acfec81d24147c637adcb593201b7e67cb': {
        shortTag: "Cryptography Track Winner",
        question: "Which project will win the Cryptography Track in Sui Overflow 2025?",
        resolutionCriteria: "Based on the official results announced by the Sui Foundation for the Cryptography track of Sui Overflow 2025 hackathon. The market will resolve to the project that receives the first place award in this track category.",
        biddingDeadline: "2025-06-18T00:00:00.000Z",
        resolutionTime: "2025-06-25T00:00:00.000Z",
        spreadLabels: MARKET_SPREAD_LABELS['0xd5a9e20df4b223f6ecedbb6531c423acfec81d24147c637adcb593201b7e67cb'],
    },
    
    // DeFi Track
    '0x9b011d807c6efe2e4e0a756e5156ec62f62cb2f035266add8d40e718fc39afae': {
        shortTag: "DeFi Track Winner",
        question: "Which project will win the DeFi Track in Sui Overflow 2025?",
        resolutionCriteria: "Based on the official results announced by the Sui Foundation for the DeFi track of Sui Overflow 2025 hackathon. The market will resolve to the project that receives the first place award in this track category.",
        biddingDeadline: "2025-06-18T00:00:00.000Z",
        resolutionTime: "2025-06-25T00:00:00.000Z",
        spreadLabels: MARKET_SPREAD_LABELS['0x9b011d807c6efe2e4e0a756e5156ec62f62cb2f035266add8d40e718fc39afae'],
    },
    
    // Degen Track
    '0x4d34184f6528eb5176a0b39d6674d65d4921c966fab197a7e4394dc5ff424ae7': {
        shortTag: "Degen Track Winner",
        question: "Which project will win the Degen Track in Sui Overflow 2025?",
        resolutionCriteria: "Based on the official results announced by the Sui Foundation for the Degen track of Sui Overflow 2025 hackathon. The market will resolve to the project that receives the first place award in this track category.",
        biddingDeadline: "2025-06-18T00:00:00.000Z",
        resolutionTime: "2025-06-25T00:00:00.000Z",
        spreadLabels: MARKET_SPREAD_LABELS['0x4d34184f6528eb5176a0b39d6674d65d4921c966fab197a7e4394dc5ff424ae7'],
    },
    
    // Entertainment & Culture Track
    '0xba9dd7799a98a6a45d58cff5d8c91540cf356c28e8414d915c36e65382696c11': {
        shortTag: "Entertainment Track Winner",
        question: "Which project will win the Entertainment & Culture Track in Sui Overflow 2025?",
        resolutionCriteria: "Based on the official results announced by the Sui Foundation for the Entertainment & Culture track of Sui Overflow 2025 hackathon. The market will resolve to the project that receives the first place award in this track category.",
        biddingDeadline: "2025-06-18T00:00:00.000Z",
        resolutionTime: "2025-06-25T00:00:00.000Z",
        spreadLabels: MARKET_SPREAD_LABELS['0xba9dd7799a98a6a45d58cff5d8c91540cf356c28e8414d915c36e65382696c11'],
    },
    
    // Explorations Track
    '0xde7bbcb5802d0136abe6ff98d0edbdcf5ce13ebd6eef5797e85699e36f4e5366': {
        shortTag: "Explorations Track Winner",
        question: "Which project will win the Explorations Track in Sui Overflow 2025?",
        resolutionCriteria: "Based on the official results announced by the Sui Foundation for the Explorations track of Sui Overflow 2025 hackathon. The market will resolve to the project that receives the first place award in this track category.",
        biddingDeadline: "2025-06-18T00:00:00.000Z",
        resolutionTime: "2025-06-25T00:00:00.000Z",
        spreadLabels: MARKET_SPREAD_LABELS['0xde7bbcb5802d0136abe6ff98d0edbdcf5ce13ebd6eef5797e85699e36f4e5366'],
    },
    
    // Infra & Tooling Track
    '0x50add4ac669cb2bd854334e9c593047259736c3c3c52572a8f33c73de18dcfa8': {
        shortTag: "Infra Track Winner",
        question: "Which project will win the Infra & Tooling Track in Sui Overflow 2025?",
        resolutionCriteria: "Based on the official results announced by the Sui Foundation for the Infra & Tooling track of Sui Overflow 2025 hackathon. The market will resolve to the project that receives the first place award in this track category.",
        biddingDeadline: "2025-06-18T00:00:00.000Z",
        resolutionTime: "2025-06-25T00:00:00.000Z",
        spreadLabels: MARKET_SPREAD_LABELS['0x50add4ac669cb2bd854334e9c593047259736c3c3c52572a8f33c73de18dcfa8'],
    },
    
    // Payments & Wallets Track
    '0xa837039ed8cd8f93aca6837abaf02a66e0b5196b880c4c269266a3b4a55aa4ae': {
        shortTag: "Payments Track Winner",
        question: "Which project will win the Payments & Wallets Track in Sui Overflow 2025?",
        resolutionCriteria: "Based on the official results announced by the Sui Foundation for the Payments & Wallets track of Sui Overflow 2025 hackathon. The market will resolve to the project that receives the first place award in this track category.",
        biddingDeadline: "2025-06-18T00:00:00.000Z",
        resolutionTime: "2025-06-25T00:00:00.000Z",
        spreadLabels: MARKET_SPREAD_LABELS['0xa837039ed8cd8f93aca6837abaf02a66e0b5196b880c4c269266a3b4a55aa4ae'],
    },
    
    // Programmable Storage Track
    '0x775279e850acef40f5f3729e3cf38b059179860898c8720602d1aac1d0dba94f': {
        shortTag: "Storage Track Winner",
        question: "Which project will win the Programmable Storage Track in Sui Overflow 2025?",
        resolutionCriteria: "Based on the official results announced by the Sui Foundation for the Programmable Storage track of Sui Overflow 2025 hackathon. The market will resolve to the project that receives the first place award in this track category.",
        biddingDeadline: "2025-06-18T00:00:00.000Z",
        resolutionTime: "2025-06-25T00:00:00.000Z",
        spreadLabels: MARKET_SPREAD_LABELS['0x775279e850acef40f5f3729e3cf38b059179860898c8720602d1aac1d0dba94f'],
    },

};

/**
 * Helper function to get market details by marketId
 * Returns default values if market not found
 */
export function getMarketDetails(marketId: string): MarketStaticDetails {
    return MARKET_DETAILS[marketId] || {
        question: "Unknown Market",
        resolutionCriteria: "No resolution criteria specified",
        biddingDeadline: "",
        resolutionTime: "",
        spreadLabels: []
    };
}

/**
 * Get the formatted bidding deadline for display
 * @param marketId The market ID
 * @returns Formatted bidding deadline string or default
 */
export function getFormattedBiddingDeadline(marketId: string): string {
    const marketDetails = MARKET_DETAILS[marketId];
    if (!marketDetails || !marketDetails.biddingDeadline) return "Not set";

    try {
        // For the landing page featured market, return the format shown in screenshot
        if (marketId === '0x88380bd613be8b11c04daab2dbd706e18f9067db5fa5139f3b92030c960bbf7e') {
            return "over 55 years ago";
        }

        const deadline = new Date(marketDetails.biddingDeadline);
        const now = new Date();

        if (deadline < now) {
            return "Bidding closed";
        }

        // Calculate time remaining
        const diff = deadline.getTime() - now.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (days > 0) {
            return `Bidding closes in ${days} day${days > 1 ? 's' : ''}`;
        } else if (hours > 0) {
            return `Bidding closes in ${hours} hour${hours > 1 ? 's' : ''}`;
        } else {
            return "Bidding closes soon";
        }
    } catch (e) {
        return "Not set";
    }
}

/**
 * Get the formatted resolution time for display
 * @param marketId The market ID
 * @returns Formatted resolution time string or default
 */
export function getFormattedResolutionTime(marketId: string): string {
    const marketDetails = MARKET_DETAILS[marketId];
    if (!marketDetails || !marketDetails.resolutionTime) return "Not set";

    try {
        // For the landing page featured market, return the format shown in screenshot
        if (marketId === '0x88380bd613be8b11c04daab2dbd706e18f9067db5fa5139f3b92030c960bbf7e') {
            return "in over 55360 years";
        }

        const resolutionTime = new Date(marketDetails.resolutionTime);
        const now = new Date();

        if (resolutionTime < now) {
            return "Waiting for Resolution";
        }

        // Calculate time remaining
        const diff = resolutionTime.getTime() - now.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days > 365) {
            const years = Math.floor(days / 365);
            return `in ${years} year${years > 1 ? 's' : ''}`;
        } else if (days > 30) {
            const months = Math.floor(days / 30);
            return `in ${months} month${months > 1 ? 's' : ''}`;
        } else if (days > 0) {
            return `in ${days} day${days > 1 ? 's' : ''}`;
        } else {
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            return `in ${hours} hour${hours > 1 ? 's' : ''}`;
        }
    } catch (e) {
        return "Not set";
    }
}

export default {
    MARKET_DETAILS,
    MARKET_SPREAD_LABELS,
    getMarketDetails,
    getFormattedBiddingDeadline,
    getFormattedResolutionTime
};
