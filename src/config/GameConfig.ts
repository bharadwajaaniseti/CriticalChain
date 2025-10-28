/**
 * Game Configuration
 * Central place to control all default values and game constants
 */

export const GameConfig = {
  /**
   * Starting Resources
   */
  STARTING_RESOURCES: {
    coins: 0,
    quantumCores: 0,
    rank: 0,
    score: 0,
    totalAtomsDestroyed: 0,
    highestRank: 0,
  },

  /**
   * Game Session Defaults
   */
  GAME_SESSION: {
    maxClicks: 10,
    maxTime: 10, // seconds
    startingCoins: 100, // coins at start of each round
  },

  /**
   * Audio Default Volumes (0.0 - 1.0)
   */
  AUDIO_VOLUMES: {
    sfxClick: 0.5,
    sfxReaction: 0.5,
    sfxUpgrade: 0.5,
    sfxAtomBreak: 0.5,
    musicIdle: 0.3,
    musicReaction: 0.3,
    homeMusicBg: 0.3,
    homeUiSelect: 0.5,
    skilltreePurchase: 0.5,
    skilltreeHover: 0.5,
  },

  /**
   * Upgrade System Defaults
   */
  UPGRADES: {
    neutronCountPlayer: 2,
    neutronCountAtom: 2,
    neutronSpeed: 1.0,
    neutronLifetime: 1.0,
    neutronSize: 1.0,
    atomSpawnRate: 100.0,
    atomSpeed: 100.0,
    atomSize: 50.0,
    atomLifetime: 2.0,
    atomHealth: 1.0,
    chainMultiplier: 1.0,
    pierce: 0,
    homing: 2,
    momentum: 0,
    neutronReflector: 0,
    
    // Critical Hit System
    critChance: 0,
    critDoublNeutrons: 0,
    
    // Shockwave Systems
    atomShockwave: 90,
    atomShockwaveForce: 1.0,
    clickShockwave: 1,
    clickShockwaveRadius: 1.0,
    
    // Economy
    baseCoinValue: 1,
    skillCostReduction: 1,
    startingCoins: 0,
    economyMastery: 0,
    
    // Special Atoms
    timeAtomsUnlocked: 0,
    timeAtomChance: 0,
    timeAtomBonus: 0.5,
    timeAtomCoins: 0,
    
    supernovaUnlocked: 0,
    supernovaChance: 0,
    supernovaNeutrons: 10,
    supernovaCoins: 0,
    
    blackHoleUnlocked: 0,
    blackHoleChance: 0,
    blackHolePullRadius: 1.0,
    blackHoleCoins: 0,
    blackHoleSpawnAtoms: 20,
    
    fissionMastery: 0,
  },

  /**
   * Skill Tree Costs
   */
  SKILL_TREE: {
    // Path unlocks (usually 1 coin)
    pathUnlockCost: 1,
    
    // Base costs for different tiers
    tier1BaseCost: 1,
    tier2BaseCost: 2,
    tier3BaseCost: 5,
    tier4BaseCost: 10,
    ultimateBaseCost: 50,
    
    // Cost multipliers
    standardMultiplier: 1.5,
    expensiveMultiplier: 2.0,
    veryExpensiveMultiplier: 2.5,
  },

  /**
   * Prestige System
   */
  PRESTIGE: {
    quantumCoresPerRank: 1, // How many quantum cores earned per rank level
    prestigeUnlockRank: 5, // Minimum rank to unlock prestige
  },

  /**
   * Rank System
   */
  RANK_SYSTEM: {
    pointsPerRank: 100, // Score needed per rank
    maxRank: 100,
  },

  /**
   * Physics & Simulation
   */
  PHYSICS: {
    neutronBaseSpeed: 200, // pixels per second
    neutronBaseLifetime: 3, // seconds
    neutronBaseSize: 8, // pixels radius
    
    atomBaseSize: 25, // pixels radius
    atomBaseLifetime: 10, // seconds
    atomSpawnInterval: 2, // seconds
    
    canvasWidth: 800,
    canvasHeight: 600,
  },

  /**
   * UI & Visual
   */
  UI: {
    // Skill tree camera
    defaultZoom: 0.5,
    minZoom: 0.3,
    maxZoom: 3.0,
    
    // Grid size for skill tree layout
    skillTreeGridSize: 150,
    skillTreeOffsetX: 500,
    skillTreeOffsetY: 500,
    
    // Node sizes
    skillNodeRadius: 50,
    
    // Animation timings (ms)
    clickAnimationDuration: 300,
    hoverSoundDebounce: 100,
  },

  /**
   * Development & Debug
   */
  DEBUG: {
    enableLogging: true,
    showFPS: false,
    godMode: false, // Infinite resources
    skipTutorial: false,
    testMode: true, // Show debug controls for testing special atoms
  },

  /**
   * Balance & Economy
   */
  BALANCE: {
    // Coin rewards
    baseAtomBreakCoins: 1,
    comboMultiplier: 0.1, // 10% bonus per combo level
    
    // Special atom spawn chances (base %)
    timeAtomBaseChance: 0.5,
    supernovaBaseChance: 0.2,
    blackHoleBaseChance: 0.1,
    
    // Shockwave defaults
    clickShockwaveBaseRadius: 100, // pixels
    atomShockwaveBaseForce: 1.5,
  },

  /**
   * Save System
   */
  SAVE: {
    autoSaveInterval: 30000, // 30 seconds
    localStoragePrefix: 'CriticalChain_',
  },
} as const;

// Export individual sections for convenience
export const StartingResources = GameConfig.STARTING_RESOURCES;
export const GameSession = GameConfig.GAME_SESSION;
export const AudioVolumes = GameConfig.AUDIO_VOLUMES;
export const DefaultUpgrades = GameConfig.UPGRADES;
export const SkillTreeCosts = GameConfig.SKILL_TREE;
export const PrestigeConfig = GameConfig.PRESTIGE;
export const RankConfig = GameConfig.RANK_SYSTEM;
export const PhysicsConfig = GameConfig.PHYSICS;
export const UIConfig = GameConfig.UI;
export const DebugConfig = GameConfig.DEBUG;
export const BalanceConfig = GameConfig.BALANCE;
export const SaveConfig = GameConfig.SAVE;
