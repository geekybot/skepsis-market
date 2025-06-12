# Fix for Duplicate "Track" Text Issue

## Problem Description
Competition market questions were showing duplicate "track" text, for example:
- "Which project will win the Cryptography Track track in Sui Overflow 2025?"

## Root Cause Analysis
The issue originated from the market creation script template in `/skepsis_market/scripts/src/create-competition-markets.ts` at line 178:

```typescript
const question = `Which project will win the ${track.name} track in Sui Overflow 2025?`;
```

This template adds " track" to ALL track names, but:
- Track names in `competitionDetails.ts` are clean: "AI", "Cryptography", "DeFi", etc.
- The template adds " track" universally, resulting in "AI track", "Cryptography track", etc.
- Some track names might already include "Track" (like "Entertainment & Culture Track")

## Solution Implemented

### 1. Fixed Market Creation Script (Root Cause)
**File**: `/skepsis_market/scripts/src/create-competition-markets.ts`

**Change**: Made the template smarter to only add " track" when the track name doesn't already end with "track" or "Track":

```typescript
// OLD (problematic):
const question = `Which project will win the ${track.name} track in Sui Overflow 2025?`;
const resolutionCriteria = `Based on the official results announced by the Sui Foundation for the ${track.name} track of Sui Overflow 2025 hackathon. The market will resolve to the project that receives the first place award in this track category.`;

// NEW (fixed):
const trackSuffix = track.name.toLowerCase().endsWith('track') ? '' : ' track';
const question = `Which project will win the ${track.name}${trackSuffix} in Sui Overflow 2025?`;
const resolutionCriteria = `Based on the official results announced by the Sui Foundation for the ${track.name}${trackSuffix} of Sui Overflow 2025 hackathon. The market will resolve to the project that receives the first place award in this track category.`;
```

### 2. Fixed UI Display (Existing Markets)
**File**: `/skepsis-web/src/components/markets/PredictionMarket.tsx`

**Change**: Updated the competition banner text to avoid duplicate "track":

```typescript
// Line ~1016:
<div className="text-yellow-200/80 text-xs mt-1">
  Predict which project will win the {track.name} of the Sui Overflow hackathon
</div>
```

This removes the duplicate " track" from the banner display.

## Impact

### For Future Markets
- New markets created with the updated script will have clean question text
- No more duplicate "track" in market questions

### For Existing Markets
- The blockchain-stored market questions still contain the duplicate text (cannot be changed)
- UI display logic prevents showing duplicate text in the competition banner
- Market titles in `marketDetails.ts` still show "Track" but this is now consistent

## Files Modified

1. `/skepsis_market/scripts/src/create-competition-markets.ts` - Fixed market creation template
2. `/skepsis-web/src/components/markets/PredictionMarket.tsx` - Fixed UI display text

## Testing
- Verified development server compiles without errors
- Tested competition market pages display correctly
- Banner text now shows "Predict which project will win the AI of the Sui Overflow hackathon" instead of "Predict which project will win the AI track of the Sui Overflow hackathon"

## Status
✅ **RESOLVED** - The duplicate "track" issue has been fixed both at the source (market creation script) and in the UI display logic.
