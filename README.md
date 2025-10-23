# 🔗 Critical Chain# Critical Chain - Incremental Game



A nuclear chain reaction idle/incremental game. Click to trigger atomic reactions, build massive chains, and unlock powerful upgrades through a dynamic skill tree system.A chain-reaction-based idle incremental game built with TypeScript, Canvas, and Web Audio API.



![Game Preview](https://img.shields.io/badge/Status-Active-brightgreen) ![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue) ![Vite](https://img.shields.io/badge/Vite-5.4-646CFF)## 🎮 Game Concept



## 🎮 Game FeaturesPlayers trigger energy reactions that spread through connected nodes. Each reaction generates Energy Points (EP) that can be spent on upgrades, unlocking new abilities through a progressive skill tree.



### Core Gameplay## 🎯 Core Features

- **⚡ Chain Reaction System**: Click to release neutrons and create cascading atomic reactions

- **⏱️ Time-Limited Rounds**: Strategic gameplay with 10-second rounds- **Chain Reactions**: Trigger cascading reactions through a node network

- **👆 Click Management**: Limited clicks that regenerate - use them wisely!- **Skill Tree System**: Progressive unlock system with 7 skill branches

- **💰 Coin Economy**: Earn coins through chain reactions with multipliers- **Resource Management**: Manage EP, Chain Multiplier, Reaction Stability, and Auto Reactor Units

- **🏆 Rank Progression**: Level up through 10 rank tiers based on score- **Auto-Progression**: Passive generation and automation systems

- **Prestige System**: Reset for permanent bonuses after reaching 1e9 EP

### Progressive Skill Tree- **Visual Feedback**: Animated node graph with glowing effects

- **🌳 100+ Skills**: Loaded dynamically from JSON configuration- **Auto-Save**: Automatic game saves every 10 seconds to localStorage

- **📊 Radial Layout**: Beautiful circular skill tree with depth-based positioning

- **🔓 Progressive Unlock**: Start with root node, unlock children as you purchase## 🏗️ Project Structure

- **🔄 Session-Based Upgrades**: Skills persist during play session, reset on return to menu

- **⭐ Meta Currency**: Earn permanent meta currency based on your rank when resetting```

- **🎯 Smart Tooltips**: Context-aware tooltips with viewport edge detectionCriticalChain/

- **🖱️ Pan & Zoom**: Mouse wheel zoom (0.3x-3x), click-drag panning with camera persistence├── index.html              # Main HTML entry point

├── package.json            # Dependencies and scripts

### Visual & UX├── tsconfig.json           # TypeScript configuration

- **🎨 Glassmorphism UI**: Modern glass-effect panels with backdrop blur├── vite.config.ts          # Vite build configuration

- **🌈 Gradient Theme**: Indigo-teal gradient background├── src/

- **✨ Smooth Animations**: Particle effects, glowing nodes, hover states│   ├── index.ts            # Main game initialization

- **📱 Responsive Design**: Adapts to different screen sizes│   ├── styles.css          # Global styles

- **💾 Auto-Save**: Progress saved every 10 seconds + on important actions│   ├── systems/

│   │   ├── GameStateManager.ts      # Game state and resources

## 🚀 Quick Start│   │   ├── SkillTreeManager.ts      # Skill tree logic

│   │   ├── AudioManager.ts          # Sound effects and music

### Prerequisites│   │   └── ReactionVisualizer.ts    # Canvas animation and rendering

- Node.js 16+ and npm│   └── ui/

│       └── GameUI.ts                # UI management and updates

### Installation└── assets/

    ├── data/

```bash    │   └── skilltree.json           # Skill tree configuration

# Clone the repository    └── audio/

git clone https://github.com/yourusername/critical-chain.git        ├── ui_click_placeholder.wav

cd critical-chain        ├── reaction_trigger_placeholder.wav

        ├── upgrade_unlock_placeholder.wav

# Install dependencies        ├── ambient_placeholder.mp3

npm install        └── reaction_build_placeholder.mp3

```

# Start development server

npm run dev## 🚀 Getting Started



# Build for production### Prerequisites

npm run build- Node.js 16+ and npm/yarn



# Preview production build### Installation

npm run preview

``````bash

cd CriticalChain

The game will be available at `http://localhost:3000`npm install

```

## 📁 Project Structure

### Development

```

CriticalChain/```bash

├── src/npm run dev

│   ├── index.ts              # Main application entry point```

│   ├── styles.css            # Global styles with glassmorphism

│   ├── pages/This starts a local dev server at `http://localhost:3000` with hot module reloading.

│   │   ├── HomePage.ts       # Main menu with meta currency display

│   │   ├── GamePage.ts       # Main gameplay with HUD### Build for Production

│   │   ├── UpgradePage.ts    # Permanent upgrades (WIP)

│   │   └── SkillTreePage.ts  # Session-based skill tree system```bash

│   └── systems/npm run build

│       ├── AudioManager.ts        # Sound effects system```

│       ├── AutomationSystem.ts    # Idle automation (WIP)

│       ├── GameStateManager.ts    # Core game state & persistenceOutput is generated in the `dist/` directory.

│       ├── NavigationManager.ts   # Page routing

│       ├── PrestigeSystem.ts      # Prestige mechanics (WIP)## 🧮 Game Mechanics

│       ├── ReactionVisualizer.ts  # Canvas particle effects

│       └── SkillTreeManager.ts    # Skill tree utilities (WIP)### Resources

├── assets/

│   ├── audio/                # Sound effects| Resource | Symbol | Purpose |

│   └── data/|----------|--------|---------|

│       └── skilltree.json    # Skill tree configuration (100+ nodes)| Energy Points | EP | Currency for upgrades |

├── index.html| Chain Multiplier | CM | Multiplies EP generation |

├── package.json| Reaction Stability | RS | Affects chain duration |

├── tsconfig.json| Auto Reactor Units | ARU | Passive EP generation |

├── vite.config.ts

└── README.md### Formulas

```

**EP Gain Formula:**

## 🎯 Game Mechanics```

EP Gain = baseNodeEP × TotalNodes × CM × RS × randomVariance

### Round Flow```



1. **Home Screen** → Click "Play"**Upgrade Cost Formula:**

2. **Game Round** → 10 seconds, limited clicks```

3. **Round Ends** → Automatically navigate to Skill Treecost = baseCost × (costMultiplier ^ currentLevel)

4. **Skill Tree** → Upgrade skills (session-only)```

5. **Play Again** → Continue with upgrades OR Return to Menu (reset + earn meta ⭐)

**Passive Gain (per second):**

### Skill System```

Passive EP = ARU_Level × CurrentEP × 0.01

#### Session Skills```

- Purchase skills during a play session

- Skills stack on top of base levels## 🌳 Skill Tree

- Persist across multiple rounds in the same session

- **Reset when returning to home menu**### Root Node: Initial Reactor

- Base upgrade that unlocks efficiency and spread branches

#### Meta Currency (⭐)

- Earned when resetting (1 meta per rank level)### Efficiency Branch

- Persists permanently across all sessions- Energy Efficiency: +10% EP gain per level

- Can be used for permanent meta upgrades (coming soon)- Core Stability: +5% chain duration per level

- Quantum Cascade: Unlocks prestige system

### Score & Ranks

### Spread Branch

```- Fractal Spread: Reactions spread +1 more node per level

Rank 0: 0 points- Momentum: Passive chain continuation even when idle

Rank 1: 100 points- Auto Reactor Units: Automatically trigger reactions

Rank 2: 300 points

Rank 3: 600 points## 💾 Save System

Rank 4: 1,000 points

Rank 5: 1,500 pointsThe game automatically saves every 10 seconds to `localStorage["CriticalChain_Save"]`. Manual save/load is also available via the bottom action bar.

Rank 6: 2,100 points

Rank 7: 2,800 points### Save Data Structure

Rank 8: 3,600 points```json

Rank 9: 4,500 points{

```  "ep": 1000,

  "cm": 1.5,

## 🛠️ Technology Stack  "rs": 0.6,

  "aruLevel": 2,

- **TypeScript**: Type-safe game logic  "totalNodes": 3,

- **Vite**: Fast build tool with HMR  "epMultiplier": 1.2,

- **HTML5 Canvas**: Particle effects and skill tree rendering  "reactionRange": 2,

- **LocalStorage**: Client-side save system  "prestigeLevel": 0,

- **CSS3**: Modern glassmorphism effects with backdrop-filter  "totalEPGenerated": 5000,

- **Poppins Font**: Clean, modern typography  "lastSave": 1698067200000

}

## 📊 Skill Tree Configuration```



Skills are defined in `assets/data/skilltree.json`:## 🎨 UI Layout



```json- **Top Bar**: Shows current stats (EP, CM, RS, ARU)

{- **Left Panel**: Canvas visualization of node graph with trigger button

  "root": {- **Right Panel**: Skill tree with upgradeable nodes

    "id": "root",- **Bottom Bar**: Action buttons (Settings, Refresh, Home)

    "name": "Nuclear Core",

    "description": "The heart of your reactor",## 🔊 Audio

    "currentLevel": 0,

    "maxLevel": 1,The game uses placeholder audio files that should be replaced with finalized audio:

    "baseCost": 0,- `ui_click_placeholder.wav`: Menu interaction SFX

    "costMultiplier": 1,- `reaction_trigger_placeholder.wav`: Reaction trigger SFX

    "unlocked": true,- `upgrade_unlock_placeholder.wav`: Skill upgrade SFX

    "connectedNodes": ["branch1", "branch2", "branch3", "branch4"]- `ambient_placeholder.mp3`: Background idle music

  }- `reaction_build_placeholder.mp3`: Active reaction music

}

```## 🎯 Future Expansions



**Skill Properties:**- [ ] Prestige tier system after 1e9 EP

- `id`: Unique identifier- [ ] Achievement system for milestones

- `name`: Display name- [ ] New "Quantum Layer" skill branch

- `description`: Tooltip description- [ ] Modular "Research" nodes

- `currentLevel`: Base level (persistent)- [ ] Zoom-out effect for major unlocks

- `maxLevel`: Maximum upgrade level- [ ] Advanced prestige mechanics

- `baseCost`: Initial cost in coins- [ ] More complex node network topologies

- `costMultiplier`: Cost scaling factor (cost = baseCost × multiplier^level)- [ ] Multiplayer leaderboards

- `unlocked`: Initial unlock state

- `connectedNodes`: Array of child skill IDs## 📝 License



## 🎨 Visual DesignThis project is provided as-is for educational and entertainment purposes.



### Color Palette## 🤝 Contributing

- **Primary**: `#00ffaa` (Cyan/Green)

- **Secondary**: `#4facfe` (Blue)Feel free to fork and submit pull requests for improvements!

- **Warning**: `#ffd93d` (Yellow)

- **Danger**: `#ff6b6b` (Red)---

- **Meta Currency**: `#ffd700` (Gold)

**Last Updated**: October 23, 2025

### Skill States
- **Locked** (Gray): Not yet unlocked
- **Unlocked** (Blue): Available to purchase
- **Purchased** (Green): Owned with current level
- **Maxed** (Gold): Reached maximum level

## 🔧 Development

### Adding New Skills

1. Edit `assets/data/skilltree.json`
2. Add skill with required properties
3. Connect to parent via `connectedNodes` array
4. Add icon mapping in `SkillTreePage.getSkillIcon()`

### Adding Game Systems

1. Create new system in `src/systems/`
2. Import in relevant page files
3. Add to state management if persistent
4. Update UI components as needed

## 🎮 Controls

### In-Game
- **Mouse Click**: Trigger reactions
- **Visual Feedback**: Particle effects on reactions

### Skill Tree
- **Click Node**: Purchase/upgrade skill
- **Mouse Wheel**: Zoom in/out (0.3x - 3x)
- **Click + Drag**: Pan camera
- **+/- Buttons**: Zoom controls
- **Reset Button**: Center camera on root node
- **Hover**: Show skill tooltip

## 📝 Save System

- **Auto-Save**: Every 10 seconds
- **Manual Save**: On skill purchase, drag end, zoom
- **Data Stored**:
  - Coins, rank, score, stats
  - Meta currency (⭐)
  - Skill tree camera position (pan/zoom)
  - Game configuration

## 🔮 Roadmap

### Planned Features
- [ ] **Permanent Upgrades**: Spend meta currency on persistent boosts
- [ ] **Automation System**: Auto-clickers and passive income
- [ ] **Prestige System**: Deep prestige mechanics with multipliers
- [ ] **Achievement System**: Unlockable achievements with rewards
- [ ] **Sound Effects**: Complete audio implementation
- [ ] **Music System**: Background music with volume controls
- [ ] **Settings Panel**: Audio, visual, and gameplay options
- [ ] **Statistics Page**: Detailed progress tracking
- [ ] **Cloud Saves**: Supabase integration for cross-device play
- [ ] **Leaderboards**: Compare progress with other players

### In Development
- Enhanced skill tree effects
- More skill branches and tiers
- Visual polish and animations
- Balance adjustments

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Credits

- **Development**: Critical Chain Team
- **Font**: [Poppins](https://fonts.google.com/specimen/Poppins) by Google Fonts
- **Icons**: Emoji-based visual elements

## 📞 Support

If you encounter any issues or have suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review the game design documents in the repository

---

**Made with ⚛️ and TypeScript**

*v1.0.0 - Nuclear Chain Reaction Simulator*
