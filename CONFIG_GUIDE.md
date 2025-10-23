# Game Configuration Guide

This file (`src/config/GameConfig.ts`) is the **central control panel** for all game defaults and balance settings.

## How to Use

### 1. **Changing Starting Resources**
```typescript
STARTING_RESOURCES: {
  coins: 100,        // Start with 100 coins instead of 0
  quantumCores: 5,   // Start with 5 quantum cores
  rank: 0,
  // ... etc
}
```

### 2. **Adjusting Audio Volumes**
```typescript
AUDIO_VOLUMES: {
  sfxClick: 0.8,     // Louder click sounds (0.0 - 1.0)
  musicIdle: 0.2,    // Quieter background music
  // ... etc
}
```

### 3. **Modifying Game Session Defaults**
```typescript
GAME_SESSION: {
  maxClicks: 5,      // Start with 5 clicks instead of 2
  maxTime: 15,       // Start with 15 seconds instead of 10
  startingCoins: 50, // Get 50 coins at the start of each round
}
```

### 4. **Tweaking Skill Costs**
```typescript
SKILL_TREE: {
  pathUnlockCost: 5,        // Make path unlocks cost 5 instead of 1
  tier1BaseCost: 2,         // Double tier 1 costs
  standardMultiplier: 2.0,  // Make skills get expensive faster
}
```

### 5. **Balance Adjustments**
```typescript
BALANCE: {
  baseAtomBreakCoins: 5,    // Get 5 coins per atom instead of 1
  timeAtomBaseChance: 1.0,  // 1% spawn chance for time atoms
  comboMultiplier: 0.2,     // 20% bonus per combo level
}
```

### 6. **Debug & Testing**
```typescript
DEBUG: {
  enableLogging: true,   // Show console logs
  showFPS: true,         // Display FPS counter
  godMode: true,         // Infinite resources for testing
  skipTutorial: true,    // Skip intro tutorial
}
```

## Configuration Sections

### 📦 STARTING_RESOURCES
Default values when the game first loads (or after reset)

### 🎮 GAME_SESSION
Values that reset at the start of each gameplay round

### 🔊 AUDIO_VOLUMES
Default volume levels for all sound effects and music (0.0 = mute, 1.0 = full)

### ⬆️ UPGRADES
Starting values for all upgrade multipliers and bonuses

### 🌳 SKILL_TREE
Base costs and multipliers for skill tree nodes

### ⚛️ PRESTIGE
Quantum core rewards and prestige unlock requirements

### 📊 RANK_SYSTEM
Score requirements for ranking up

### ⚙️ PHYSICS
Physics simulation values (speeds, sizes, lifetimes)

### 🎨 UI
User interface settings (zoom, grid sizes, animations)

### 🐛 DEBUG
Development and testing flags

### 💰 BALANCE
Game economy and difficulty settings

### 💾 SAVE
Auto-save intervals and storage settings

## Important Notes

⚠️ **After changing values:**
1. Save the file
2. The build system (esbuild) will automatically recompile
3. Refresh your browser to see changes
4. You may need to reset game progress if changing starting values

⚠️ **Breaking Changes:**
- Changing `localStoragePrefix` will create a new save (old saves won't be found)
- Reducing `maxRank` below player's current rank may cause issues
- Setting volumes above 1.0 or below 0.0 will be clamped

## Examples

### Make the game easier:
```typescript
GAME_SESSION: {
  maxClicks: 10,
  maxTime: 30,
  startingCoins: 100,
}

BALANCE: {
  baseAtomBreakCoins: 10,
}
```

### Make the game harder:
```typescript
SKILL_TREE: {
  tier1BaseCost: 5,
  standardMultiplier: 3.0,
}

PHYSICS: {
  atomSpawnInterval: 5, // Atoms spawn less frequently
}
```

### Testing mode:
```typescript
DEBUG: {
  enableLogging: true,
  godMode: true,
}

STARTING_RESOURCES: {
  coins: 10000,
  quantumCores: 100,
}
```

## Integration

The config is already integrated into:
- ✅ AudioManager (uses AUDIO_VOLUMES)
- 🔄 GameStateManager (TODO: use STARTING_RESOURCES, UPGRADES)
- 🔄 SkillTreeManager (TODO: use SKILL_TREE costs)
- 🔄 ReactionVisualizer (TODO: use PHYSICS)

See individual system files for usage examples.
