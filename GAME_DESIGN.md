# Critical Chain - Game Design Document

## Overview

**Critical Chain** is a chain-reaction-based idle incremental game where players trigger energy reactions that spread through a network of nodes. Each reaction generates Energy Points (EP) that fuel progression through a skill tree system, leading to prestige resets and permanent upgrades.

## Core Gameplay Loop

1. **Trigger Reaction**: Player clicks the "Trigger Reaction" button
2. **Chain Propagation**: Reaction spreads through connected nodes in sequence
3. **Energy Generation**: Each node generates EP based on game state
4. **Spend Resources**: Use EP to unlock skill tree nodes
5. **Automation**: Unlock automation to generate EP passively
6. **Prestige**: At 1e9 EP, trigger a prestige reset for permanent bonuses

## Game Systems

### 1. Game State Manager

Manages all core game resources:

- **EP (Energy Points)**: Primary currency
- **CM (Chain Multiplier)**: Multiplies EP generation (starts at 1.0)
- **RS (Reaction Stability)**: Affects chain reaction duration (0.0-1.0)
- **ARU Level**: Auto Reactor Unit level (0-10)
- **Total Nodes**: Active nodes in network (starts at 1)
- **EP Multiplier**: From skill tree upgrades
- **Reaction Range**: How far reactions spread

#### Key Formulas

```
EP Gain = baseNodeEP × TotalNodes × CM × RS × variance
Passive Gain = ARU_Level × CurrentEP × 0.01 per second
Upgrade Cost = baseCost × (costMultiplier ^ currentLevel)
```

### 2. Skill Tree Manager

Progressive unlock system with 7 skill nodes organized in branches.

**Structure:**
- Root node unlocks two branches: Efficiency and Spread
- Efficiency → Stability → Quantum Cascade
- Spread → Momentum → Automation

**Unlock Rules:**
- Root node starts unlocked
- Child nodes unlock when parent reaches maxLevel
- Each node has 1-10 levels
- Cost increases exponentially per level

**Skill Effects:**

| Skill | Effect | Max Level |
|-------|--------|-----------|
| Initial Reactor (Root) | +0.1 CM per level | 1 |
| Energy Efficiency | +10% EP multiplier per level | 5 |
| Fractal Spread | +1 reaction range per level | 4 |
| Core Stability | +5% RS per level | 3 |
| Momentum | +1 node per level | 2 |
| Quantum Cascade | Unlocks prestige system | 1 |
| Auto Reactor Units | +1 ARU level per level | 10 |

### 3. Reaction Visualizer

Canvas-based visualization of the node network:

- **5x5 grid** of interconnected nodes
- **Color coding**: Red (inactive) → Blue (connected) → Green (active)
- **Glow effects** on hover and during reactions
- **Wave animation** showing reaction propagation
- **Particle background** (future: nebula field)

### 4. Audio Manager

Web Audio API integration with support for SFX and background music.

**Audio Types:**
- `SFX_CLICK`: Menu interactions
- `SFX_REACTION`: Chain trigger
- `SFX_UPGRADE`: Skill unlock
- `MUSIC_IDLE`: Ambient background
- `MUSIC_REACTION`: Active reaction theme

**Features:**
- Preloading and caching
- Volume control (0-1)
- Music looping
- Graceful fallback if audio unavailable

### 5. Automation System

Triggers reactions automatically based on Auto Reactor Unit level.

**Logic:**
```
autoTriggerInterval = 5000ms / aruLevel
If (now - lastTrigger) >= interval → trigger
```

Each ARU level decreases time between auto-triggers, effectively doubling generation with automation.

### 6. Prestige System

Hard reset with permanent bonuses after reaching 1 billion EP.

**Prestige Mechanic:**
- Threshold: 1e9 EP
- Bonus per prestige: ×1.05 (5% increase)
- Cumulative: Each prestige multiplies by 1.05
- Keeps: Prestige level, multiplier bonus
- Resets: EP, skill tree (except unlocked states), nodes

**Example Progression:**
- Prestige 1: ×1.05 multiplier
- Prestige 2: ×1.05² = ×1.1025 multiplier
- Prestige 3: ×1.05³ ≈ ×1.1576 multiplier

### 7. Save System

Automatic saves every 10 seconds to `localStorage["CriticalChain_Save"]`

**Save Data:**
```json
{
  "ep": float,
  "cm": float,
  "rs": float,
  "aruLevel": int,
  "totalNodes": int,
  "epMultiplier": float,
  "reactionRange": int,
  "prestigeLevel": int,
  "totalEPGenerated": float,
  "lastSave": timestamp
}
```

## Progression Curve

### Early Game (0 - 1K EP)
- Unlock Root node
- Acquire first 2-3 efficiency upgrades
- Build understanding of mechanics

### Mid Game (1K - 1M EP)
- Unlock all skill branches
- Reach stability upgrades
- Begin automation setup

### Late Game (1M - 1B EP)
- Max out most skill nodes
- Multiple automation layers
- Strong passive generation

### Prestige (1B+ EP)
- Trigger Quantum Cascade
- Reset with multiplier bonus
- Exponential growth begins

## UI Layout

```
┌─────────────────────────────────────┐
│ TOP BAR: EP | CM | RS | ARU Display │
├──────────────────┬──────────────────┤
│                  │   Skill Tree     │
│  Node Visualizer │   ├─ Efficiency  │
│  Canvas          │   ├─ Stability   │
│  [Trigger Btn]   │   ├─ Quantum     │
│                  │   ├─ Spread      │
│                  │   ├─ Momentum    │
│                  │   └─ Automation  │
├──────────────────┴──────────────────┤
│ BOTTOM BAR: Save | Load | Settings  │
└─────────────────────────────────────┘
```

## Balance Parameters

These values can be tuned for game feel:

```typescript
const PRESTIGE_THRESHOLD = 1e9;
const BASE_NODE_EP = 10;
const AUTOSAVE_INTERVAL = 10000;
const PRESTIGE_BONUS = 1.05;
const PASSIVE_GAIN_RATE = 0.01;
```

## Color Scheme

```
Primary: #33AAFF (Cyan)
Secondary: #00FF66 (Bright Green)
Danger: #FF3333 (Red)
Dark BG: #0a0e27
Darker BG: #050712
Accent: #FFFF00 (Yellow)
```

## Audio Placeholders

Current audio files are placeholders. Production versions should include:

- `ui_click.wav`: 0.1-0.2s UI feedback
- `reaction_trigger.wav`: 0.5-1.0s impact sound
- `upgrade_unlock.wav`: 0.3-0.5s positive feedback
- `ambient.mp3`: Looping 30-60s ambient track
- `reaction_build.mp3`: Looping 20-40s active theme

## Future Expansions

### Phase 2: Advanced Systems
- [ ] Achievement system
- [ ] Quantum Layer branch (new skill tree section)
- [ ] Research nodes (modify other effects)
- [ ] Advanced prestige tiers (Quantum, Cosmic, etc.)

### Phase 3: Content
- [ ] More complex node topologies
- [ ] Dynamic node connections
- [ ] Environmental hazards
- [ ] Boss nodes with special mechanics

### Phase 4: Social
- [ ] Leaderboards
- [ ] Achievement sharing
- [ ] Discord integration
- [ ] Cloud save sync

## Technical Stack

- **Language**: TypeScript
- **Build Tool**: Vite
- **Rendering**: HTML5 Canvas
- **Audio**: Web Audio API
- **Storage**: localStorage
- **Styling**: CSS3 with animations

## Performance Targets

- Canvas rendering: 60 FPS
- Update tick: 100ms
- Memory usage: < 50MB
- Startup time: < 2s

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile: iOS Safari 12+, Chrome Android latest

---

**Document Version**: 1.0  
**Last Updated**: October 23, 2025
