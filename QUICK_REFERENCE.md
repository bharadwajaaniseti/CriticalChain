# Critical Chain - Quick Reference Card

## 🚀 Quick Start Commands

```bash
npm install                    # Install dependencies
npm run dev                    # Start dev server (http://localhost:3000)
npm run build                  # Build for production
npm run preview                # Preview production build
npm run type-check             # Check TypeScript types
```

## 🎮 Game Overview

| Aspect | Value |
|--------|-------|
| **Game Type** | Chain-reaction idle incremental |
| **Primary Currency** | Energy Points (EP) |
| **Main Goal** | Reach 1 billion EP → Prestige |
| **Prestige Bonus** | +5% multiplier per reset |
| **Save Location** | localStorage (auto-save 10s) |
| **Platform** | Web browser (HTML5/Canvas) |

## 📊 Core Resources

```
EP              → Energy Points (main currency)
CM              → Chain Multiplier (starts at 1.0)
RS              → Reaction Stability (0-100%)
ARU             → Auto Reactor Units (0-10 max)
Nodes           → Active network nodes (1-25)
```

## 🌳 Skill Tree Map

```
                    Root (CM +0.1)
                   /              \
          Efficiency            Spread
         (+10% EP)              (+1 range)
            |                      |
        Stability              Momentum
        (+5% RS)              (+1 node)
            |                      |
        Quantum              Automation
       (Prestige)          (+1 ARU/level)
```

**Total:** 7 skills
**Max Levels:** 1-10 depending on skill
**Total Maxing Cost:** ~824K EP

## 🧮 Key Formulas

```
EP Gain = baseNodeEP × nodes × CM × RS
Cost = baseCost × (multiplier ^ level)
Passive = ARU × currentEP × 0.01 per second
Prestige = Current Multiplier × 1.05
```

## 💾 Save Data

**Location:** `localStorage["CriticalChain_Save"]`

**Contains:**
- EP, CM, RS, ARU level
- Nodes, Multipliers, Range
- Prestige level, Total EP generated
- Last save timestamp

**Auto-saves:** Every 10 seconds
**Manual save:** Bottom bar button

## 🎯 Progression Path

```
1. Click "Trigger Reaction" button → Gain EP
2. Unlock and max "Root" skill → Unlock branches
3. Level up skills along branches
4. Unlock "Automation" → Passive income starts
5. Reach 1B EP → Prestige available
6. Prestige → Keep multiplier bonus, reset everything else
7. Repeat with higher multiplier
```

## 🔊 Audio System

**SFX Types:**
- `SFX_CLICK` - UI interaction
- `SFX_REACTION` - Trigger button
- `SFX_UPGRADE` - Skill unlock
- `MUSIC_IDLE` - Background
- `MUSIC_REACTION` - Active theme

**Status:** Placeholder audio included
**Location:** `/assets/audio/`

## 🎨 Color Scheme

```
Primary:   #33AAFF (Cyan) - Main UI elements
Secondary: #00FF66 (Green) - Success/Active
Danger:    #FF3333 (Red) - Locked/Error
Accent:    #FFFF00 (Yellow) - Highlights
Dark BG:   #0a0e27
Darker BG: #050712
```

## 📁 Key Files

| File | Purpose |
|------|---------|
| `index.html` | Main entry point |
| `src/index.ts` | Game bootstrap |
| `src/systems/GameStateManager.ts` | Core state |
| `src/systems/SkillTreeManager.ts` | Skill logic |
| `src/ui/GameUI.ts` | UI updates |
| `assets/data/skilltree.json` | Skill config |
| `README.md` | Quick start |
| `GAME_DESIGN.md` | Full design doc |

## 🛠️ Common Customizations

### Change Prestige Threshold
File: `src/systems/PrestigeSystem.ts`
```typescript
const PRESTIGE_THRESHOLD = 1e9;  // Change this value
```

### Adjust Skill Costs
File: `assets/data/skilltree.json`
```json
"baseCost": 50,        // Change cost
"costMultiplier": 1.8  // Change scaling
```

### Modify Auto-save Interval
File: `src/systems/GameStateManager.ts`
```typescript
private readonly AUTOSAVE_INTERVAL = 10000;  // milliseconds
```

### Change Colors
File: `src/styles.css`
```css
:root {
  --primary-color: #33AAFF;    /* Modify these */
  --secondary-color: #00FF66;
  --danger-color: #FF3333;
}
```

## 🐛 Debug Commands

In browser console:
```javascript
// Check game state
window.__gameUI?.upgradeSkill?.('efficiency')

// Check console for debug logs
// [GAME] [SKILL] [SAVE] [AUDIO] etc.
```

## 📈 Progression Timeline

| Stage | EP | Time* | Activities |
|-------|-----|-------|-----------|
| Early | 10-1K | 5-30m | Learn, unlock basics |
| Mid | 1K-1M | 30m-4h | Build strategy |
| Late | 1M-1B | 4h-1d+ | Optimize, reach prestige |
| Post | 1B+ | Daily+ | Prestige resets |

*Approximate, varies based on play style

## 🎓 Learning Path

1. **Start Game** → Understand core loop
2. **Click Trigger** → See EP generation
3. **Max Root** → Learn skill progression
4. **Explore Skills** → See different effects
5. **Unlock Automation** → See passive income
6. **Reach Prestige** → Complete first cycle
7. **Optimize** → Fine-tune strategy

## 📋 Skill Effects Summary

| Skill | Effect | Max Level |
|-------|--------|-----------|
| Root | +0.1 CM | 1 |
| Efficiency | +10% EP | 5 |
| Spread | +1 range | 4 |
| Stability | +5% RS | 3 |
| Momentum | +1 node | 2 |
| Automation | +1 ARU | 10 |
| Quantum | Prestige unlock | 1 |

## 🎮 UI Layout

```
┌─────────────────────────────────────────┐
│    TOP BAR: EP | CM | RS | ARU         │
├─────────────────┬──────────────────────┤
│   Canvas with   │  Skill Tree Nodes   │
│   Node Network  │  (Clickable)        │
│  [TRIGGER BTN]  │                     │
├─────────────────┴──────────────────────┤
│  BOTTOM: Settings | Refresh | Home     │
└─────────────────────────────────────────┘
```

## ⚙️ System Requirements

- **Browser:** Chrome/Firefox/Safari (latest 2 versions)
- **RAM:** 50-100MB recommended
- **CPU:** Any modern processor
- **Storage:** ~5MB (including audio)
- **Connection:** Required for initial load, can work offline after

## 🔗 Important Links

- **Vite Docs:** https://vitejs.dev/
- **TypeScript:** https://www.typescriptlang.org/
- **Canvas API:** https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
- **Web Audio:** https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API

## 📝 Project Statistics

```
Total Lines of Code:      2,000+
TypeScript Systems:       8
HTML Templates:           1
CSS Styling:              1,000+ lines
JSON Data:                95 lines
Documentation:            3,000+ lines
Total Project Size:       ~500KB (uncompressed)
```

## 🚀 Deployment Checklist

- [ ] Run `npm run build`
- [ ] Test `npm run preview`
- [ ] Verify all audio loads correctly
- [ ] Test save/load functionality
- [ ] Check mobile responsiveness
- [ ] Optimize audio files for web
- [ ] Deploy `dist/` folder to hosting
- [ ] Set CORS headers if needed
- [ ] Test on multiple browsers
- [ ] Verify localStorage works

## 🎯 Next Development Steps

1. **Replace Placeholder Audio** - Add real sound files
2. **Tweak Balance** - Adjust costs/rewards
3. **Add More Skills** - Expand the tree
4. **Visual Polish** - Enhanced animations
5. **Mobile Optimization** - Touch controls
6. **Analytics** - Track player progress
7. **Achievements** - Milestone system
8. **Content** - Story/lore elements

## 📞 Support & Help

**For errors:**
1. Check browser console (F12)
2. Clear localStorage and refresh
3. Check CORS/audio file access
4. Review DEVELOPER_GUIDE.md

**For features:**
1. See GAME_DESIGN.md for design doc
2. Check DEVELOPER_GUIDE.md for API
3. See BALANCE_REFERENCE.md for formulas

---

**Quick Reference v1.0**  
**Print this page** for quick access during development  
**Last Updated**: October 23, 2025
