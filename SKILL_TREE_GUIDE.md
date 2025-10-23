# Skill Tree System Guide

## Overview
The skill tree system provides 33 upgrades across 4 main paths that enhance your nuclear chain reaction capabilities. All upgrades are purchased with coins earned during gameplay and persist until you reset your run.

## How It Works

### Purchase System
- **Currency**: Coins (earned during gameplay)
- **Progression**: Skills unlock based on parent purchases
- **Cost Scaling**: Multi-level upgrades use exponential cost multipliers (1.3x - 1.7x)
- **Persistence**: Skills persist within a run, reset on fresh run/prestige

### Skill Tree Structure
```
Root (Core Reactor)
├── Neutron Path (10 nodes)
├── Atom Path (7 nodes)
├── Chain Path (5 nodes)
├── Resource Path (8 nodes)
└── Ultimate Masteries (4 nodes)
```

## Upgrade Paths

### 1. Neutron Path (🔵)
**Focus**: Enhance neutron projectiles

| Upgrade | Cost | Max Level | Effect |
|---------|------|-----------|--------|
| Neutron Path Unlock | 10 | 1 | Unlock neutron upgrades |
| Extra Neutron I/II/III | 50/200/800 | 1 each | +1 neutron per click |
| Neutron Velocity I/II | 100/500 | 5 each | +10% neutron speed per level |
| Neutron Duration I/II | 150/600 | 5 each | +20% neutron lifetime per level |
| Neutron Size I | 250 | 5 | +15% neutron size per level |
| Neutron Pierce | 1500 | 5 | +5% pierce chance per level |
| Neutron Homing | 2000 | 5 | Neutrons track atoms (1 level = 1 homing strength) |

**Ultimate: Neutron Mastery** (10k coins)
- +2 neutrons per click
- +50% neutron speed

### 2. Atom Path (⚡)
**Focus**: Modify atom behavior and spawn rates

| Upgrade | Cost | Max Level | Effect |
|---------|------|-----------|--------|
| Atom Path Unlock | 10 | 1 | Unlock atom upgrades |
| Atom Density I/II | 100/500 | 5 each | +10% atom spawn rate per level |
| Atom Size I | 200 | 5 | +15% atom size per level |
| Atom Duration I | 150 | 5 | +25% atom lifetime per level |
| Chain Reaction I/II/III | 400/1200/3000 | 1 each | +1 neutron when atom breaks |

**Ultimate: Atom Mastery** (10k coins)
- +2 neutrons per atom break
- +50% atom spawn rate

### 3. Chain Path (🔗)
**Focus**: Boost chain reactions and momentum

| Upgrade | Cost | Max Level | Effect |
|---------|------|-----------|--------|
| Chain Path Unlock | 10 | 1 | Unlock chain bonuses |
| Chain Bonus I/II/III | 100/500/2000 | 5 each | +0.2x chain multiplier per level |
| Chain Momentum | 2500 | 1 | Clicking doesn't reset chain |
| Wall Bounce | 1000 | 5 | +10% neutron bounce chance per level |

**Ultimate: Chain Mastery** (15k coins)
- +1.0x chain multiplier
- Permanent momentum

### 4. Resource Path (⚙️)
**Focus**: Increase available resources per round

| Upgrade | Cost | Max Level | Effect |
|---------|------|-----------|--------|
| Resource Path Unlock | 10 | 1 | Unlock time and click upgrades |
| Extra Click I/II/III/IV | 50/200/600/1500 | 1 each | +1 max click |
| Extended Time I/II/III/IV | 100/300/800/2000 | 1 each | +2 seconds per upgrade |

**Ultimate: Resource Mastery** (12k coins)
- +2 max clicks
- +5 seconds

## Game State Integration

### Applied Effects
When purchased, skills immediately modify game state:

```typescript
// Neutron upgrades
state.upgrades.neutronCountPlayer  // Base: 2
state.upgrades.neutronSpeed        // Base: 1.0 (multiplier)
state.upgrades.neutronLifetime     // Base: 1.0 (multiplier)
state.upgrades.neutronSize         // Base: 1.0 (multiplier)
state.upgrades.pierce              // Base: 0 (% chance)
state.upgrades.homing              // Base: 0 (strength)

// Atom upgrades
state.upgrades.atomSpawnRate       // Base: 1.0 (multiplier)
state.upgrades.atomSize            // Base: 1.0 (multiplier)
state.upgrades.atomLifetime        // Base: 1.0 (multiplier)
state.upgrades.neutronCountAtom    // Base: 2

// Chain upgrades
state.upgrades.chainMultiplier     // Base: 1.0
state.upgrades.momentum            // Base: 0 (0=disabled, 1=enabled)
state.upgrades.neutronReflector    // Base: 0 (% chance)

// Resource upgrades
state.maxClicks                    // Base: 2
state.maxTime                      // Base: 10
```

### Reset Behavior
- **Fresh Run**: All skills reset, upgrades return to base values
- **Prestige**: All skills reset, earn Quantum Cores for permanent upgrades

## Unlocking System

### Parent-Child Relationships
Skills unlock based on purchasing their parent:

```
root → 4 path unlocks
neutron_basics → neutron_count_1, neutron_speed_1, neutron_lifetime_1, neutron_size_1
neutron_count_1 → neutron_count_2 → neutron_count_3
neutron_speed_1 → neutron_speed_2 → neutron_pierce
neutron_lifetime_1 → neutron_lifetime_2 → neutron_homing
...
```

### Ultimate Unlocks
Ultimates unlock after purchasing 20+ total levels across all paths.

## Cost Examples

### Linear Upgrades (costMultiplier = 1.0)
- Extra Click I: 50 coins (one-time)
- Chain Momentum: 2500 coins (one-time)

### Exponential Upgrades (costMultiplier > 1.0)
**Example: Neutron Velocity I (base 100, multiplier 1.3)**
- Level 1: 100 coins
- Level 2: 130 coins
- Level 3: 169 coins
- Level 4: 220 coins
- Level 5: 286 coins
- **Total**: 905 coins for max level

## Optimal Strategies

### Early Game (0-500 coins)
1. Unlock all 4 paths (40 coins total)
2. Extra Click I (50 coins) - more neutrons per round
3. Extended Time I (100 coins) - more time to react
4. Neutron Velocity I (100 coins) - faster reactions

### Mid Game (500-3000 coins)
1. Chain Bonus upgrades - multiply your earnings
2. Extra Neutron II (200 coins) - more projectiles
3. Atom Density I - more targets to hit
4. Chain Reaction I (400 coins) - self-sustaining chains

### Late Game (3000+ coins)
1. Chain Momentum (2500 coins) - game-changer
2. Ultimate upgrades (10k-15k each) - massive power spike
3. Max out multiplier chains
4. Pierce and Homing for consistency

## Testing Your Upgrades

To test skill effects:
1. Purchase a skill (e.g., Extra Neutron I)
2. Start a game round
3. Click to fire neutrons
4. Observe the increased neutron count
5. Check game state: `gameState.getState().upgrades.neutronCountPlayer`

## Files Modified
- `skilltree.json` - All 33 upgrade definitions
- `SkillTreeManager.ts` - Load, purchase, and apply effects
- `GameStateManager.ts` - Store upgrade state
- `SkillTreePage.ts` - Visual representation and purchases

## Future Enhancements
- [ ] Visual skill tree with connections
- [ ] Skill recommendations based on play style
- [ ] Skill presets/builds
- [ ] Achievement tracking for specific skill paths
