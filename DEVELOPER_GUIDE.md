# Critical Chain - Developer Guide

## Project Setup

### Quick Start

```bash
# 1. Navigate to project directory
cd CriticalChain

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# Browser will open at http://localhost:3000
```

### Build for Production

```bash
npm run build
npm run preview  # Test production build locally
```

## Architecture Overview

### Modular System Design

The game is organized into independent systems that communicate through shared state:

```
┌─────────────────────────────────────────┐
│     Game UI (UI Layer)                  │
│  - Display updates                      │
│  - Event handling                       │
└────────────┬────────────────────────────┘
             │
┌────────────┴────────────────────────────┐
│  Game Systems Layer                     │
├─────────────────────────────────────────┤
│ GameState    SkillTree   Automation     │
│ Prestige     Visualizer  Audio          │
└─────────────────────────────────────────┘
             │
┌────────────┴────────────────────────────┐
│     Data Layer                          │
│  - localStorage                         │
│  - skilltree.json                       │
│  - Audio assets                         │
└─────────────────────────────────────────┘
```

### File Structure

```
src/
├── index.ts                 # Main entry point, bootstraps all systems
├── styles.css              # Global styling
├── systems/
│   ├── GameStateManager.ts    # Core game state and resources
│   ├── SkillTreeManager.ts    # Skill tree logic and effects
│   ├── AutomationSystem.ts    # Auto-trigger mechanics
│   ├── PrestigeSystem.ts      # Prestige and resets
│   ├── AudioManager.ts        # Web Audio API wrapper
│   └── ReactionVisualizer.ts  # Canvas rendering
└── ui/
    └── GameUI.ts              # UI updates and interactions
```

## System Details

### GameStateManager

**Purpose**: Single source of truth for all game state

**Key Methods:**
```typescript
calculateEPGain(baseNodeEP)    // Calculate EP per click
triggerReaction(baseNodeEP)    // Generate EP and update state
spendEP(amount)                // Subtract EP, returns success
updateResource(key, value)     // Direct state update
incrementResource(key, amount) // Add to resource
getState()                     // Get current state snapshot
saveGame()                     // Save to localStorage
prestigeReset(bonus)           // Hard reset with bonus
```

**State Structure:**
```typescript
interface GameState {
  ep: number;              // Energy points
  cm: number;              // Chain multiplier
  rs: number;              // Reaction stability (0-1)
  aruLevel: number;        // Auto reactor units
  totalNodes: number;      // Active nodes
  epMultiplier: number;    // Upgrade bonus
  reactionRange: number;   // Spread distance
  prestigeLevel: number;   // Prestige count
  totalEPGenerated: number;// Lifetime EP
  lastSave: number;        // Timestamp
}
```

### SkillTreeManager

**Purpose**: Manage skill unlocking, leveling, and effects

**Key Methods:**
```typescript
getSkill(id)               // Get skill node by ID
getAllSkills()             // Get all nodes
calculateUpgradeCost(id)   // Calculate current cost
upgradeSkill(id)           // Attempt upgrade
getUnlockProgress(id)      // Get level/cost/canUpgrade
onUpgrade(callback)        // Register upgrade listener
```

**Adding New Skills:**

1. Add to `assets/data/skilltree.json`:
```json
{
  "newSkill": {
    "id": "newSkill",
    "name": "New Skill",
    "description": "Does something cool",
    "currentLevel": 0,
    "maxLevel": 3,
    "baseCost": 500,
    "costMultiplier": 1.9,
    "unlocked": false,
    "connectedNodes": []
  }
}
```

2. Add effect in `SkillTreeManager.applySkillEffect()`:
```typescript
case 'newSkill':
  gameState.updateResource('epMultiplier', state.epMultiplier + 0.15);
  break;
```

### ReactionVisualizer

**Purpose**: Render node network and animations

**Key Methods:**
```typescript
triggerReaction()   // Start animation
getNodes()         // Get node list
reset()            // Clear visualization
```

**Customizing Appearance:**

Edit in `ReactionVisualizer.ts`:
```typescript
private nodeRadius: number = 15;           // Node size
private lineWidth: number = 2;             // Connection thickness
// Colors controlled via CSS and Canvas context
```

### AudioManager

**Purpose**: Handle sound effects and music

**Key Methods:**
```typescript
playSFX(type)              // Play one-shot sound
playMusic(type)            // Play looping music
stopMusic()                // Stop current music
setMusicVolume(0-1)        // Set music volume
setSFXVolume(0-1)          // Set SFX volume
preloadAudio(type)         // Preload audio file
```

**Adding New Sounds:**

1. Add to `AudioType` enum in `AudioManager.ts`:
```typescript
export enum AudioType {
  SFX_NEW = 'sfx_new',
}
```

2. Add to `AUDIO_MAP`:
```typescript
[AudioType.SFX_NEW]: '/assets/audio/new_sound.wav',
```

3. Use in code:
```typescript
audioManager.playSFX(AudioType.SFX_NEW);
```

### GameUI

**Purpose**: Update UI and handle user interactions

**Key Methods:**
```typescript
upgradeSkill(skillId)   // Upgrade skill via UI
updateDisplay()         // Refresh stat displays
updateSkillDisplay()    // Refresh skill tree UI
```

## Adding New Features

### Example: Add Resource Cap

1. Add to GameState interface:
```typescript
interface GameState {
  // ... existing fields
  epCap: number;  // Maximum EP
}
```

2. Initialize in `GameStateManager`:
```typescript
private initializeState(): GameState {
  return {
    // ... existing
    epCap: 1e6,
  };
}
```

3. Enforce in `triggerReaction()`:
```typescript
triggerReaction(baseNodeEP: number = 10): number {
  const epGain = this.calculateEPGain(baseNodeEP);
  const newTotal = Math.min(this.state.ep + epGain, this.state.epCap);
  this.state.ep = newTotal;
  return epGain;
}
```

4. Add UI element in `index.html`:
```html
<div class="stat">
  <span class="stat-label">📊 EP Cap:</span>
  <span class="stat-value" id="ep-cap-display">0</span>
</div>
```

5. Update display in `GameUI.ts`:
```typescript
if (this.epCapDisplay) {
  this.epCapDisplay.textContent = this.formatNumber(state.epCap);
}
```

### Example: Add New Skill Effect

1. Update `skilltree.json` with new skill data
2. Add case in `SkillTreeManager.applySkillEffect()`:
```typescript
case 'mySkill':
  // Apply effect to game state
  gameState.updateResource('someResource', newValue);
  break;
```
3. Skill will automatically display in UI and be upgradeable

## Testing

### Manual Testing Checklist

- [ ] Click trigger button - EP increases
- [ ] EP display updates in real-time
- [ ] Can upgrade first skill (Root)
- [ ] Second level skills unlock after maxing parent
- [ ] Auto-save completes without errors
- [ ] Refresh page - game state persists
- [ ] Sound effects play (if audio loaded)
- [ ] All skill nodes display correctly
- [ ] Cannot upgrade beyond maxLevel
- [ ] Cost scales correctly per level

### Browser DevTools

Check console for debug messages:
```
[GAME] Initializing Critical Chain...
[SKILL TREE] Loaded 7 nodes
[AUDIO] Context initialized
[SAVE] Game saved at 14:30:45
[SKILL] Upgraded root to level 1
[PRESTIGE] Reset at level 1
```

## Performance Optimization Tips

### Canvas Rendering
- Canvas renders at 60fps via `requestAnimationFrame`
- Only redraw on state change (not continuous)
- Use off-screen canvas for complex calculations

### Memory Management
- Audio buffers are cached (10s of MB max)
- DOM elements created once, innerHTML updated
- Event listeners registered once at init

### Load Time
- Lazy load audio on first play
- Defer non-critical scripts
- Minify CSS/JS in production

## Debugging

### Enable Debug Mode

Add to `index.ts`:
```typescript
(window as any).__DEBUG = {
  state: () => gameState.getState(),
  skills: () => skillTree.getAllSkills(),
  prestige: () => prestigeSystem.getPrestigeProgress(),
};
```

Then in console:
```javascript
__DEBUG.state()       // Check game state
__DEBUG.skills()      // Check skill tree
__DEBUG.prestige()    // Check prestige progress
```

### Common Issues

**Audio not playing:**
- Check browser autoplay policies
- Verify audio files exist and are accessible
- Check browser console for CORS errors

**Saves not persisting:**
- Check localStorage isn't full or disabled
- Verify no browser privacy mode
- Check DevTools → Application → Storage

**Render glitches:**
- Check canvas size vs container size
- Verify requestAnimationFrame is firing
- Check for infinite loops in render

## Deployment

### Vite Production Build

```bash
npm run build
```

Output files:
- `dist/index.html` - Compiled entry point
- `dist/assets/` - Bundled JS/CSS
- `dist/assets/data/` - JSON data files
- `dist/assets/audio/` - Audio files

### Deploy to Web

```bash
# Deploy dist/ folder to:
# - GitHub Pages
# - Netlify
# - Vercel
# - AWS S3
# - Any static hosting
```

### CORS Considerations

If audio/data files are on different domain:
- Configure CORS headers on server
- Or use JSONP for data loading
- Or bundle assets into JS

## Resources

- [Vite Documentation](https://vitejs.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

## Contributing

1. Create feature branch: `git checkout -b feature/new-feature`
2. Make changes following existing code style
3. Test thoroughly
4. Submit pull request

## Support

For issues or questions:
1. Check existing documentation
2. Review browser console for errors
3. Check localStorage for save data corruption
4. Clear cache and reload if needed

---

**Developer Guide v1.0**  
**Last Updated**: October 23, 2025
