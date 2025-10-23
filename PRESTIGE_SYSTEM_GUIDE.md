# Prestige System Implementation Guide

## Overview
The prestige upgrade system provides permanent bonuses that persist across game runs. Players earn Quantum Cores by reaching higher ranks and spend them on permanent upgrades.

## Architecture

### Key Files
1. **PrestigeSystem.ts** - Calculates all active prestige bonuses
2. **GameStateManager.ts** - Applies bonuses to gameplay
3. **UpgradePage.ts** - UI for purchasing upgrades
4. **prestige.json** - Upgrade definitions (51 total upgrades)

## Upgrade Categories

### 1. Foundation Branch
**Starting Resources**
- **Extra Clicks** (5 tiers): +1 click per tier
  - Tier 1: 5 QC → +1 click
  - Tier 2: 15 QC → +2 clicks
  - Tier 3: 50 QC → +3 clicks
  - Tier 4: 150 QC → +4 clicks
  - Tier 5: 500 QC → +5 clicks

- **Extra Time** (3 tiers): +2 seconds per level
  - Tier 1: 8 QC base, max 10 levels
  - Tier 2: 80 QC base, max 10 levels
  - Tier 3: 400 QC base, max 10 levels

- **Starting Capital** (3 tiers): +100 coins per level
  - Tier 1: 3 QC base, max 10 levels
  - Tier 2: 30 QC base, max 10 levels
  - Tier 3: 200 QC base, max 10 levels

### 2. Economy Branch
**Resource Multipliers**
- **Quantum Efficiency** (3 tiers): +5% quantum cores per level
  - Applies when earning quantum cores on prestige
  - Stackable across all 3 tiers
  - Max 60 levels total = +300% quantum cores

- **Skill Optimization** (2 tiers): -2% skill tree costs per level
  - Max 50 levels = -100% (capped at 80% reduction)
  - Applies to skill tree purchases

- **Quantum Mastery** (2 tiers): -2% prestige upgrade costs per level
  - Max 40 levels = -80% (capped at 80% reduction)
  - Applies to other prestige upgrades

- **Atom Value** (3 tiers): +10% coin value per level
  - Max 90 levels = +900% coin value
  - Applies when destroying atoms

### 3. Automation Branch
**Auto-Prestige**
- Unlock: 100 QC
- Rank triggers: Auto at rank 3, 5, 7, or 9
- Time triggers: Auto after 2, 5, or 10 minutes

**Offline Progress**
- Unlock: 250 QC
- Efficiency: Base 25% + 10% per level (max 40 levels)
- Capacity: Base 8 hours + 2 hours per level (max 24 levels)

**Game Speed**
- 2x Speed: 500 QC
- 3x Speed: 1500 QC
- 5x Speed: 5000 QC

### 4. Advanced Physics Branch
**Special Atom Types**

**Time Atoms** (Blue)
- Unlock: 200 QC
- Spawn Chance: +0.5% per level (max 40 levels)
- Time Bonus: Base 1s + 0.5s per level (max 30 levels)

**Supernova Atoms** (Yellow)
- Unlock: 300 QC
- Spawn Chance: +0.3% per level (max 30 levels)
- Neutron Burst: Base 5 + 2 per level (max 20 levels)

**Black Hole Atoms** (Purple)
- Unlock: 400 QC
- Spawn Chance: +0.2% per level (max 20 levels)
- Pull Strength: Base 1x + 20% per level (max 30 levels)

## Implementation Details

### Bonus Application

**Starting Resources** (Applied in `startFreshRun()`)
```typescript
this.state.clicks = 2 + bonuses.startingClicks;
this.state.maxClicks = 2 + bonuses.startingClicks;
this.state.timeRemaining = 10 + bonuses.startingTime;
this.state.maxTime = 10 + bonuses.startingTime;
this.state.coins = bonuses.startingCoins;
```

**Quantum Gain** (Applied in `resetRun()`)
```typescript
const baseQuantumEarned = Math.floor(this.state.rank / 2);
const quantumEarned = Math.floor(baseQuantumEarned * bonuses.quantumGainMultiplier);
```

**Coin Value** (Applied in `awardCoins()`)
```typescript
const coins = Math.floor(atomValue * chainBonus * prestigeMultiplier);
```

**Cost Reductions** (Applied in `getUpgradeCost()`)
```typescript
return Math.max(1, Math.floor(baseCost * (1 - reduction)));
```

### Caching Strategy
The coin multiplier is cached to avoid recalculating on every atom destruction:
- Recalculates every 100 atom destructions
- Or when cache is older than threshold
- Ensures good performance without stale data

### State Management
All prestige upgrades are saved using proper state management methods:
- `gameState.saveAllPrestigeUpgrades()` - Saves entire upgrade tree
- `gameState.deductQuantumCores()` - Deducts currency with validation
- `gameState.addQuantumCores()` - Adds currency (for resets/rewards)

### Active Bonuses Display
The upgrade page shows all active bonuses in a compact format:
- Only visible when bonuses are active
- Updates automatically when upgrades are purchased
- Color-coded with the primary theme color

## Testing Commands

```javascript
// Add quantum cores for testing (in browser console)
addQuantumCores(1000); // Add 1000 quantum cores

// Check current bonuses
const { prestigeSystem } = require('./systems/PrestigeSystem');
console.log(prestigeSystem.calculateBonuses());
console.log(prestigeSystem.getBonusSummary());
```

## Future Enhancements
The following features are defined but not yet fully implemented:
1. **Auto-Prestige Logic** - Automatic prestige based on rank/time
2. **Offline Progress System** - Earn resources while away
3. **Game Speed Control** - Speed multiplier system
4. **Special Atoms** - Time/Supernova/Black Hole atom behaviors

These require additional systems to be built in the game engine.

## Balance Notes
- Total cost to max everything: ~50,000+ Quantum Cores
- Early game focuses on Foundation upgrades (clicks, time, coins)
- Mid game focuses on Economy (quantum efficiency, cost reductions)
- Late game unlocks Automation and Advanced Physics
- Prestige cost reduction creates positive feedback loop
