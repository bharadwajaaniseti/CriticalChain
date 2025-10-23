# Critical Chain - Game Balance & Formulas Reference

## Core Formulas

### EP Generation

**Click Reaction:**
```
EP_Gain = baseNodeEP × TotalNodes × CM × RS × randomVariance
```

Where:
- `baseNodeEP` = 10 (default, upgradeable)
- `TotalNodes` = Current active nodes in network (1-25)
- `CM` = Chain Multiplier (starts at 1.0)
- `RS` = Reaction Stability (0.0 to 1.0)
- `randomVariance` = 0.95 to 1.05 (±5% variance)

**Example:**
- Base: 10 EP/node
- 5 nodes, CM=1.0, RS=0.5, variance=1.0
- Result: 10 × 5 × 1.0 × 0.5 × 1.0 = **25 EP**

### Passive Generation

**Per Second (from Auto Reactor Units):**
```
Passive_EP = ARU_Level × CurrentEP × 0.01
```

Where:
- `ARU_Level` = Auto Reactor Unit level (0-10)
- `CurrentEP` = Total energy points stored
- `0.01` = Fixed passive generation rate

**Example:**
- ARU Level: 2
- Current EP: 1000
- Result: 2 × 1000 × 0.01 = **20 EP/second**

### Upgrade Costs

**Exponential Cost Scaling:**
```
Cost = baseCost × (costMultiplier ^ currentLevel)
```

Where:
- `baseCost` = Initial cost for level 1
- `costMultiplier` = Per-skill multiplier (1.5-2.4)
- `currentLevel` = Already-purchased levels

**Example (Energy Efficiency):**
- Base Cost: 50 EP
- Multiplier: 1.8
- Cost progression:
  - Level 1: 50 × 1.8^0 = 50 EP
  - Level 2: 50 × 1.8^1 = 90 EP
  - Level 3: 50 × 1.8^2 = 162 EP
  - Level 4: 50 × 1.8^3 = 291.6 EP
  - Level 5: 50 × 1.8^4 = 524.9 EP

## Skill Tree Progression

### Root Node: Initial Reactor
| Level | Cost | CM Bonus | Total Cost |
|-------|------|----------|-----------|
| 1 | 10 | +0.1 | 10 |

### Efficiency Branch
| Level | Cost | EP Mult | Total Cost |
|-------|------|---------|-----------|
| 1 | 50 | +10% | 50 |
| 2 | 90 | +10% | 140 |
| 3 | 162 | +10% | 302 |
| 4 | 291.6 | +10% | 593.6 |
| 5 | 524.9 | +10% | 1118.5 |

### Fractal Spread
| Level | Cost | Range | Total Cost |
|-------|------|-------|-----------|
| 1 | 100 | +1 | 100 |
| 2 | 200 | +1 | 300 |
| 3 | 400 | +1 | 700 |
| 4 | 800 | +1 | 1500 |

### Core Stability
| Level | Cost | RS Bonus | Total Cost |
|-------|------|----------|-----------|
| 1 | 250 | +5% | 250 |
| 2 | 550 | +5% | 800 |
| 3 | 1210 | +5% | 2010 |

### Momentum
| Level | Cost | Nodes | Total Cost |
|-------|------|-------|-----------|
| 1 | 400 | +1 | 400 |
| 2 | 920 | +1 | 1320 |

### Auto Reactor Units
| Level | Cost | ARU | Total Cost |
|-------|------|-----|-----------|
| 1 | 800 | +1 | 800 |
| 2 | 1600 | +1 | 2400 |
| 3 | 3200 | +1 | 5600 |
| 4 | 6400 | +1 | 12000 |
| 5 | 12800 | +1 | 24800 |
| 6 | 25600 | +1 | 50400 |
| 7 | 51200 | +1 | 101600 |
| 8 | 102400 | +1 | 204000 |
| 9 | 204800 | +1 | 408800 |
| 10 | 409600 | +1 | 818400 |

### Quantum Cascade
| Level | Cost | Effect | Total Cost |
|-------|------|--------|-----------|
| 1 | 1000 | Unlock Prestige | 1000 |

## Progression Milestones

### Estimated Progression Timeline

Assuming:
- Base: 10 EP per click
- Average: 2 clicks per second
- No skill tree yet

| Milestone | EP | Time | Progress |
|-----------|-----|------|----------|
| Start | 0 | 0s | Game begins |
| Root Unlocked | 10+ | 5s | Unlock efficiency/spread |
| Efficiency L1 | 50+ | 30s | +10% EP multiplier |
| Spread L1 | 100+ | 60s | Better chain reaction |
| Stability L1 | 250+ | 2m | Improved duration |
| Momentum L1 | 400+ | 3m | Passive nodes |
| Auto Reactor L1 | 800+ | 5m | Idle passive generation |
| 1,000 EP | 1K | 5-10m | Early milestone |
| 10,000 EP | 10K | 30-60m | Mid-game |
| 100,000 EP | 100K | 2-4h | Late-game |
| 1,000,000 EP | 1M | 8-16h | Approaching prestige |
| 1,000,000,000 EP | 1B | Days | Prestige threshold |

## Prestige Progression

### Prestige Multiplier Scaling

Each prestige adds ×1.05 multiplier to EP generation.

| Prestige | Multiplier | Previous Total |
|----------|-----------|-----------------|
| 0 | 1.00× | 1.00× |
| 1 | 1.05× | 1.05× |
| 2 | 1.1025× | 1.1576× |
| 3 | 1.1576× | 1.2155× |
| 4 | 1.2155× | 1.2763× |
| 5 | 1.2763× | 1.3401× |
| 10 | 1.6289× | 2.6533× |
| 20 | 2.6533× | 7.0400× |
| 50 | 11.467× | 131.50× |

## Auto-Trigger Mechanics

### Auto Reactor Generation

Base interval: 5000ms per ARU level

```
Interval = 5000 / aruLevel (milliseconds)
```

| ARU Level | Interval | Triggers/min |
|-----------|----------|-------------|
| 0 | ∞ | 0 |
| 1 | 5000ms | 12 |
| 2 | 2500ms | 24 |
| 3 | 1666ms | 36 |
| 4 | 1250ms | 48 |
| 5 | 1000ms | 60 |
| 10 | 500ms | 120 |

## Reaction Mechanics

### Chain Reaction Spread

- Network: 5×5 grid = 25 nodes
- Connection: 8-directional (Moore neighborhood)
- Propagation: 100ms delay per hop
- Visual duration: 2000ms glow decay

### Node Statistics

| Metric | Value |
|--------|-------|
| Grid Size | 5×5 |
| Total Nodes | 25 |
| Root Node | Center (12) |
| Max Connections | 8 per node |
| Average Connections | 5.6 per node |
| Propagation Delay | 100ms |
| Activation Decay | 2000ms |

## Balance Tuning Parameters

### Adjustable Constants

In `GameStateManager.ts`:
```typescript
const AUTOSAVE_INTERVAL = 10000;     // 10 seconds
const DEFAULT_RS = 0.5;              // Start at 50% stability
const DEFAULT_CM = 1.0;              // Start at 1x multiplier
const BASE_NODE_EP = 10;             // EP per node base
```

In `PrestigeSystem.ts`:
```typescript
const PRESTIGE_THRESHOLD = 1e9;      // 1 billion EP
const PRESTIGE_BONUS = 1.05;         // 5% per prestige
```

In `AutomationSystem.ts`:
```typescript
const AUTOSAVE_INTERVAL = 5000;      // Base interval (ms)
```

## Growth Analysis

### Exponential Growth Patterns

**Early Game (0-1M EP):**
- Linear with skill tree progression
- Click-based generation dominates
- ~1-4 hours to reach 1M EP

**Mid Game (1M-1B EP):**
- Exponential with passive automation
- ARU levels provide multiplicative growth
- ~8-24 hours to reach 1B EP

**Late Game (1B+ EP):**
- Prestige resets with compounding multipliers
- Exponential scaling per prestige cycle
- Each prestige is faster than the last

## Performance Considerations

### Resource Usage

| System | Memory | CPU |
|--------|--------|-----|
| Game State | <1MB | Minimal |
| Skill Tree | <1MB | Minimal |
| Canvas Render | <5MB | 60 FPS @ 1080p |
| Audio Buffer | 10-50MB | Depends on duration |
| Total | ~15-60MB | Varies |

### Optimization Metrics

- **Canvas FPS**: Maintains 60 FPS
- **Update Tick**: 100ms baseline
- **Save Interval**: 10 seconds (configurable)
- **Audio Preload**: 3 files (~50MB max)

## Difficulty Scaling

### Perceived Progression

**Early (0-1K EP):**
- Fast feedback loop
- Frequent level-ups
- Visible growth

**Mid (1K-1M EP):**
- Slower progression
- Need patience
- Build strategy

**Late (1M-1B EP):**
- Prestige available
- Massive numbers
- Deep optimization

**Prestige (1B+):**
- Cycle resets
- Permanent bonuses
- Exponential jumps

---

## Reference Tables

### Quick Lookup: Skill Costs (First Level Only)

| Skill | Cost |
|-------|------|
| Root | 10 |
| Efficiency | 50 |
| Spread | 100 |
| Stability | 250 |
| Momentum | 400 |
| Automation | 800 |
| Quantum | 1000 |

### Total Cost to Max All Skills

```
Efficiency (50×1.8): ~1,119 EP
Spread (100×2.0): ~1,550 EP
Stability (250×2.2): ~2,010 EP
Momentum (400×2.3): ~1,320 EP
Automation (800×2.0): ~818,400 EP
Quantum: 1,000 EP

TOTAL: ~824,399 EP to max everything
```

---

**Balance Document v1.0**  
**Last Updated**: October 23, 2025  
**Game Version**: 1.0.0
