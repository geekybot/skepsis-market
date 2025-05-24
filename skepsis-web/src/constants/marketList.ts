import { COIN } from "bucket-protocol-sdk";

export const TOKEN_LIST: {
  // You can use key in COIN for more token
  [key in BasicCoin]: TokenInfo;
} = {
  SUI: {
    token: "SUI",
    symbol: "SUI",
    iconPath: "/images/coins/sui-icon.svg",
  },
  BUCK: {
    token: "BUCK",
    symbol: "BUCK",
    iconPath: "/images/coins/buck-icon.png",
  },
  USDC: {
    token: "USDC",
    symbol: "USDC",
    iconPath: "/images/coins/usdc-icon.png",
  },
  USDT: {
    token: "USDT",
    symbol: "USDT",
    iconPath: "/images/coins/usdt-light.png",
  },
};

export const getTokenSymbol = (coin: BasicCoin) => {
  return TOKEN_LIST[coin].symbol ?? "";
};

// Bitcoin price prediction market data
export const btcPredictionMarketData = {
  question: "What will be BTC price on 30th May, 2025?",
  options: [
    { range: "100,000-105,000", percentage: 27 },
    { range: "105,000-110,000", percentage: 12 },
    { range: "110,000-115,000", percentage: 8 },
    { range: "115,000-120,000", percentage: 4 },
    { range: "95,000-100,000", percentage: 49 },
  ],
  resolutionCriteria:
    "At 12 pm UTC, the price average of 1 hour will be calculated and winning spread will be decided",
  resolver: "0xabcd",
  currentPrice: 98085,
};
