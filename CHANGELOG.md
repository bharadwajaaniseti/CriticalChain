# Changelog

All notable changes to Critical Chain will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-23

### Added
- **Core Gameplay**
  - Time-limited rounds (10 seconds)
  - Click-based chain reaction system
  - Particle effects with ReactionVisualizer
  - Rank progression system (10 ranks)
  - Coin economy with chain multipliers
  
- **Skill Tree System**
  - 100+ skills loaded from skilltree.json
  - Radial layout with depth-based positioning
  - Progressive unlock system (start with root)
  - Session-based upgrades that persist during play
  - Pan and zoom controls (0.3x - 3x)
  - Camera position persistence
  - Smart tooltips with viewport edge detection
  - Visual states (locked/unlocked/purchased/maxed)
  
- **Meta Progression**
  - Meta currency (⭐) system
  - Earned based on rank when resetting
  - Persistent across all sessions
  - Displayed on home screen
  
- **UI/UX**
  - Glassmorphism design theme
  - Indigo-teal gradient background
  - Multi-page navigation (Home/Game/Upgrades/SkillTree)
  - HUD with coins, chain, time, clicks, rank
  - Reset confirmation dialog with meta reward preview
  - Smooth animations and transitions
  
- **Game Flow**
  - Automatic navigation to skill tree after round ends
  - "Play Round" button to continue with upgrades
  - Reset confirmation when returning to menu
  - Session skill tracking
  
- **Technical**
  - TypeScript implementation
  - Vite build system
  - LocalStorage save system with auto-save (10s)
  - Debounced camera position saves
  - State management system
  - Audio manager (placeholder sounds)

### Changed
- Migrated from basic incremental to session-based progression
- Redesigned skill tree from simple list to radial canvas layout
- Updated scoring to use rank-based meta currency

### Technical Details
- **Files Modified**: 15+
- **Lines of Code**: ~3000+
- **Skill Nodes**: 100+
- **Dependencies**: TypeScript, Vite, Poppins font

## [Unreleased]

### Planned Features
- Permanent meta upgrades using meta currency
- Automation system (auto-clickers)
- Prestige system with multipliers
- Achievement system
- Complete audio implementation
- Settings panel (audio, visual options)
- Statistics tracking page
- Cloud saves via Supabase
- Leaderboards
- More skill branches and tiers
- Advanced particle effects
- Mobile responsive improvements

---

For more details, see the full [README.md](README.md)
