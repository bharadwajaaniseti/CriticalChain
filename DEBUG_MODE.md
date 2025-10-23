# 🔬 Debug Mode Guide

## How to Test Special Atoms

### Quick Start

1. **Enable Debug Mode**
   - Open `src/config/GameConfig.ts`
   - Set `testMode: true` in the `DEBUG` section (already enabled)

2. **Start the Game**
   - Go to home screen
   - Click **Play**
   - You'll see a debug panel in the bottom-left corner

3. **Test Special Atoms**
   - Click any button to spawn that atom type in the center of screen
   - Shoot neutrons at them to see their effects

### Debug Panel Buttons

| Button | What It Does |
|--------|-------------|
| **Spawn Time Atom ⏰** | Creates a cyan Time Atom that adds +5s when destroyed |
| **Spawn Supernova 💥** | Creates a white Supernova that explodes into many neutrons |
| **Spawn Black Hole 🌑** | Creates a purple Black Hole that pulls nearby atoms |
| **Unlock All Special** | Enables all special atoms to spawn naturally during gameplay |

### Special Atom Effects

#### ⏰ Time Atom (Cyan)
- **Color**: Cyan (#00FFFF)
- **Effect**: Adds bonus time when destroyed
- **Base Bonus**: +5 seconds (configurable in GameConfig)
- **Can also give bonus coins** based on `timeAtomCoins` upgrade

#### 💥 Supernova (White)
- **Color**: White (#FFFFFF)
- **Effect**: Explodes into many neutrons in all directions
- **Base Neutrons**: 10 (configurable via `supernovaNeutrons`)
- **Radius**: 360° explosion pattern
- **Can also give bonus coins** based on `supernovaCoins` upgrade

#### 🌑 Black Hole (Purple)
- **Color**: Purple (#9400D3)
- **Effect**: Pulls nearby atoms toward it, then spawns new atoms when destroyed
- **Pull Radius**: Based on `blackHolePullRadius` upgrade
- **Spawn Atoms**: Based on `blackHoleSpawnAtoms` (default: 20)
- **Can also give bonus coins** based on `blackHoleCoins` upgrade

### Testing Without Debug Panel

If you want to test special atoms spawning naturally:

1. Click **"Unlock All Special"** in debug panel
2. Adjust spawn chances in `GameConfig.ts`:
   ```typescript
   timeAtomChance: 100,     // 100% spawn chance
   supernovaChance: 100,    // 100% spawn chance
   blackHoleChance: 100,    // 100% spawn chance
   ```
3. **Clear your save data**: Open browser console (F12) and run:
   ```javascript
   localStorage.clear()
   ```
4. Refresh and play - special atoms will spawn frequently!

### Disable Debug Mode

When you're done testing:
1. Open `src/config/GameConfig.ts`
2. Set `testMode: false` in the `DEBUG` section
3. Refresh the browser

### Notes

- **Special atoms spawn in the center** when using debug buttons for easy testing
- **They have slow drift** so they stay visible
- **All special atoms are fissile** (can trigger chain reactions)
- **Spawn chances stack** - if you set all to 100%, one type will always spawn
- **Fission Mastery upgrade doubles** special atom spawn chances

### Configuration Reference

All special atom settings are in `src/config/GameConfig.ts`:

```typescript
UPGRADES: {
  // Unlock flags
  timeAtomsUnlocked: 0,
  supernovaUnlocked: 0,
  blackHoleUnlocked: 0,
  
  // Spawn chances (%)
  timeAtomChance: 0.5,
  supernovaChance: 0.2,
  blackHoleChance: 0.1,
  
  // Special abilities
  timeAtomBonus: 0.5,        // Time bonus multiplier
  supernovaNeutrons: 10,     // Neutrons per explosion
  blackHolePullRadius: 1.0,  // Pull radius multiplier
  blackHoleSpawnAtoms: 20,   // Atoms spawned on destruction
}
```

Happy testing! 🧪
