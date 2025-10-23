/**
 * Game State Manager
 * Manages core game state for Critical Chain (Criticality clone)
 */

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  level: number;
  maxLevel: number;
  costMultiplier: number;
}

export interface GameState {
  // Core resources
  coins: number;
  shots: number;
  time: number;
  rank: number;
  currentChain: number;
  maxChain: number;
  score: number;
  
  // Meta progression (persists across runs)
  metaCurrency: number;
  quantumCores: number;
  prestigeUpgrades: { [key: string]: { currentLevel: number; unlocked: boolean } };
  
  // Click system
  clicks: number;
  maxClicks: number;
  timeRemaining: number;
  maxTime: number;
  gameActive: boolean;
  
  // Upgrades - Comprehensive stats system
  upgrades: {
    // Neutron stats
    neutronSpeed: number;              // Speed multiplier for neutrons
    neutronLifetime: number;           // Lifetime multiplier for neutrons
    neutronSize: number;               // Size multiplier for neutrons
    neutronCountPlayer: number;        // Number of neutrons spawned by player click
    neutronCountAtom: number;          // Number of neutrons spawned when atom breaks
    
    // Atom stats
    atomSpeed: number;                 // Speed multiplier for atoms
    atomLifetime: number;              // Lifetime multiplier for atoms
    atomSize: number;                  // Size multiplier for atoms
    atomSpawnRate: number;             // Atom spawn rate multiplier
    atomHealth: number;                // Atom health multiplier
    
    // Legacy/Special upgrades
    neutronReflector: number;          // % chance to reflect neutrons
    pierce: number;                    // Neutrons can pierce through atoms
    homing: number;                    // Neutrons home towards atoms
    momentum: number;                  // Clicking doesn't reset chain
    chainMultiplier: number;           // Chain value multiplier
  };
  
  // Game state
  lastSave: number;
  gameStartTime: number;
  totalAtomsDestroyed: number;
  highestRank: number;
}

// Rank thresholds for progression
const RANK_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];

class GameStateManager {
  private state: GameState;
  private readonly AUTOSAVE_INTERVAL = 10000; // 10 seconds

  constructor() {
    this.state = this.initializeState();
    this.startAutosave();
  }

  private initializeState(): GameState {
    const saved = this.loadGame();
    if (saved) {
      // Ensure upgrades exist and have all properties
      if (!saved.upgrades) {
        saved.upgrades = {
          // Neutron stats (default values)
          neutronSpeed: 1,           // 1x speed
          neutronLifetime: 1,        // 1x lifetime (1.5 seconds base)
          neutronSize: 1,            // 1x size
          neutronCountPlayer: 2,     // 2 neutrons per player click
          neutronCountAtom: 2,       // 2 neutrons per atom break
          
          // Atom stats (default values)
          atomSpeed: 1,              // 1x speed
          atomLifetime: 1,           // 1x lifetime (10 seconds base)
          atomSize: 1,               // 1x size
          atomSpawnRate: 1,          // 1x spawn rate
          atomHealth: 1,             // 1x health
          
          // Legacy/Special upgrades
          neutronReflector: 0,
          pierce: 0,
          homing: 0,
          momentum: 0,
          chainMultiplier: 1,
        };
      }
      
      // Add new properties if missing (backward compatibility)
      if (saved.upgrades.neutronSpeed === undefined) saved.upgrades.neutronSpeed = 1;
      if (saved.upgrades.neutronLifetime === undefined) saved.upgrades.neutronLifetime = 1;
      if (saved.upgrades.neutronSize === undefined) saved.upgrades.neutronSize = 1;
      if (saved.upgrades.neutronCountPlayer === undefined) saved.upgrades.neutronCountPlayer = 2;
      if (saved.upgrades.neutronCountAtom === undefined) saved.upgrades.neutronCountAtom = 2;
      if (saved.upgrades.atomSpeed === undefined) saved.upgrades.atomSpeed = 1;
      if (saved.upgrades.atomLifetime === undefined) saved.upgrades.atomLifetime = 1;
      if (saved.upgrades.atomSize === undefined) saved.upgrades.atomSize = 1;
      if (saved.upgrades.atomSpawnRate === undefined) saved.upgrades.atomSpawnRate = 1;
      if (saved.upgrades.atomHealth === undefined) saved.upgrades.atomHealth = 1;
      
      // Ensure new click system fields exist (backward compatibility)
      if (saved.clicks === undefined) saved.clicks = 2;
      if (saved.maxClicks === undefined) saved.maxClicks = 2;
      if (saved.timeRemaining === undefined) saved.timeRemaining = 10;
      if (saved.maxTime === undefined) saved.maxTime = 10;
      if (saved.gameActive === undefined) saved.gameActive = false;
      if (saved.currentChain === undefined) saved.currentChain = 0;
      if (saved.maxChain === undefined) saved.maxChain = 0;
      if (saved.rank === undefined) saved.rank = 0;
      if (saved.score === undefined) saved.score = 0;
      if (saved.metaCurrency === undefined) saved.metaCurrency = 0;
      if (saved.quantumCores === undefined) saved.quantumCores = 0;
      if (saved.prestigeUpgrades === undefined) saved.prestigeUpgrades = {};
      
      return saved;
    }

    const initialState: GameState = {
      coins: 0,
      shots: 0,
      time: 0,
      rank: 0,
      currentChain: 0,
      maxChain: 0,
      score: 0,
      metaCurrency: 0,
      quantumCores: 0,
      prestigeUpgrades: {},
      clicks: 2,
      maxClicks: 2,
      timeRemaining: 10,
      maxTime: 10,
      gameActive: false,
      upgrades: {
        // Neutron stats (default values)
        neutronSpeed: 1,           // 1x speed
        neutronLifetime: 1,        // 1x lifetime (1.5 seconds base)
        neutronSize: 1,            // 1x size
        neutronCountPlayer: 2,     // 2 neutrons per player click
        neutronCountAtom: 2,       // 2 neutrons per atom break
        
        // Atom stats (default values)
        atomSpeed: 1,              // 1x speed
        atomLifetime: 1,           // 1x lifetime (10 seconds base)
        atomSize: 1,               // 1x size
        atomSpawnRate: 1,          // 1x spawn rate
        atomHealth: 1,             // 1x health
        
        // Legacy/Special upgrades
        neutronReflector: 0,
        pierce: 0,
        homing: 0,
        momentum: 0,
        chainMultiplier: 1,
      },
      lastSave: Date.now(),
      gameStartTime: Date.now(),
      totalAtomsDestroyed: 0,
      highestRank: 0,
    };
    
    return initialState;
  }

  /**
   * Start the game session
   */
  startGame(): void {
    this.state.gameActive = true;
    this.state.clicks = this.state.maxClicks;
    this.state.timeRemaining = this.state.maxTime;
    // Reset chains at the start of each round
    this.state.currentChain = 0;
    this.state.maxChain = 0;
  }

  /**
   * End the game session
   */
  endGame(): void {
    this.state.gameActive = false;
  }

  /**
   * Use a click (returns true if click was used)
   */
  useClick(): boolean {
    if (this.state.clicks > 0 && this.state.gameActive) {
      this.state.clicks--;
      this.state.shots++;
      
      // Reset chain if momentum upgrade not active
      if (this.state.upgrades.momentum === 0) {
        this.state.currentChain = 0;
      }
      
      return true;
    }
    return false;
  }

  /**
   * Update time (called every frame)
   */
  updateTime(deltaTime: number): void {
    if (this.state.gameActive) {
      this.state.timeRemaining -= deltaTime;
      this.state.time += deltaTime;
      
      if (this.state.timeRemaining <= 0) {
        this.endGame();
        this.state.timeRemaining = 0;
      }
    }
  }

  /**
   * Check if can click
   */
  canClick(): boolean {
    return this.state.clicks > 0 && this.state.gameActive;
  }

  /**
   * Record a shot (click) - legacy method
   */
  recordShot(): void {
    this.state.shots++;
    
    // Reset chain if momentum upgrade not active
    if (this.state.upgrades.momentum === 0) {
      this.state.currentChain = 0;
    }
  }

  /**
   * Increment chain counter
   */
  incrementChain(amount: number = 1): void {
    this.state.currentChain += amount;
    if (this.state.currentChain > this.state.maxChain) {
      this.state.maxChain = this.state.currentChain;
    }
  }

  /**
   * Reset current chain (only resets the active chain counter, not the display)
   * The display shows maxChain which persists through the round
   */
  resetChain(): void {
    // Don't reset currentChain to 0 anymore, since we want to show the max achieved
    // Instead, just keep tracking in currentChain for active reactions
    this.state.currentChain = 0;
  }

  /**
   * Award coins for destroying an atom
   * Longer chains are worth more
   */
  awardCoins(atomValue: number): void {
    const chainBonus = 1 + (this.state.currentChain * 0.1 * this.state.upgrades.chainMultiplier);
    const coins = Math.floor(atomValue * chainBonus);
    this.state.coins += coins;
    this.state.score += coins;
    this.state.totalAtomsDestroyed++;
    
    // Check for rank up
    this.checkRankUp();
  }

  /**
   * Check if player should rank up
   */
  private checkRankUp(): void {
    const nextRank = this.state.rank + 1;
    if (nextRank < RANK_THRESHOLDS.length) {
      if (this.state.score >= RANK_THRESHOLDS[nextRank]) {
        this.state.rank = nextRank;
        if (this.state.rank > this.state.highestRank) {
          this.state.highestRank = this.state.rank;
        }
        console.log(`[RANK UP] Now rank ${this.state.rank}`);
      }
    }
  }

  /**
   * Get rank progress (0-1)
   */
  getRankProgress(): number {
    const nextRank = this.state.rank + 1;
    if (nextRank >= RANK_THRESHOLDS.length) {
      return 1; // Max rank
    }
    const currentThreshold = RANK_THRESHOLDS[this.state.rank];
    const nextThreshold = RANK_THRESHOLDS[nextRank];
    const progress = (this.state.score - currentThreshold) / (nextThreshold - currentThreshold);
    return Math.max(0, Math.min(1, progress));
  }

  /**
   * Get next rank threshold
   */
  getNextRankThreshold(): number {
    const nextRank = this.state.rank + 1;
    if (nextRank >= RANK_THRESHOLDS.length) {
      return RANK_THRESHOLDS[RANK_THRESHOLDS.length - 1];
    }
    return RANK_THRESHOLDS[nextRank];
  }

  /**
   * Purchase an upgrade
   */
  purchaseUpgrade(upgradeId: keyof GameState['upgrades'], cost: number): boolean {
    if (this.state.coins >= cost) {
      this.state.coins -= cost;
      this.state.upgrades[upgradeId]++;
      return true;
    }
    return false;
  }

  /**
   * Deduct coins (for skill tree purchases, etc.)
   */
  deductCoins(amount: number): boolean {
    if (this.state.coins >= amount) {
      this.state.coins -= amount;
      return true;
    }
    return false;
  }

  /**
   * Get current game state
   */
  getState(): GameState {
    return { ...this.state };
  }

  /**
   * Save game to localStorage
   */
  saveGame(): void {
    this.state.lastSave = Date.now();
    localStorage.setItem('CriticalChain_Save', JSON.stringify(this.state));
  }

  /**
   * Load game from localStorage
   */
  private loadGame(): GameState | null {
    const saved = localStorage.getItem('CriticalChain_Save');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as GameState;
        // Validate that it has the new structure
        if (!parsed.upgrades || typeof parsed.upgrades.neutronCountPlayer === 'undefined') {
          console.log('[LOAD] Old save format detected, resetting');
          localStorage.removeItem('CriticalChain_Save');
          return null;
        }
        return parsed;
      } catch (error) {
        console.error('[LOAD] Failed to parse saved game', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Start autosave loop
   */
  private startAutosave(): void {
    setInterval(() => this.saveGame(), this.AUTOSAVE_INTERVAL);
  }

  /**
   * Start a fresh run - reset coins, rank, and skill tree but keep quantum cores and prestige upgrades
   */
  startFreshRun(): void {
    // Reset run-specific stats only (keep quantum cores, prestige upgrades, and base upgrades)
    this.state.coins = 0;
    this.state.shots = 0;
    this.state.time = 0;
    this.state.rank = 0;
    this.state.currentChain = 0;
    this.state.maxChain = 0;
    this.state.score = 0;
    this.state.clicks = 2;
    this.state.maxClicks = 2;
    this.state.timeRemaining = 10;
    this.state.maxTime = 10;
    this.state.gameActive = false;
    this.state.totalAtomsDestroyed = 0;
    
    // Reset base upgrades (skill tree) but keep prestige upgrades
    this.state.upgrades = {
      // Neutron stats (default values)
      neutronSpeed: 1,
      neutronLifetime: 1,
      neutronSize: 1,
      neutronCountPlayer: 2,
      neutronCountAtom: 2,
      
      // Atom stats (default values)
      atomSpeed: 1,
      atomLifetime: 1,
      atomSize: 1,
      atomSpawnRate: 1,
      atomHealth: 1,
      
      // Legacy/Special upgrades
      neutronReflector: 0,
      pierce: 0,
      homing: 0,
      momentum: 0,
      chainMultiplier: 1,
    };
    
    this.saveGame();
    console.log('[GameState] Fresh run started - coins, rank, and skill tree reset');
  }

  /**
   * Reset run and award meta currency based on rank
   * Returns the meta currency earned
   */
  resetRun(): number {
    // Calculate meta currency and quantum cores based on rank
    const metaEarned = this.state.rank;
    const quantumEarned = Math.floor(this.state.rank / 2); // 1 quantum core per 2 ranks
    
    this.state.metaCurrency += metaEarned;
    this.state.quantumCores += quantumEarned;
    
    // Reset run-specific stats (keep metaCurrency, quantumCores, and highestRank)
    const preservedMetaCurrency = this.state.metaCurrency;
    const preservedQuantumCores = this.state.quantumCores;
    const preservedHighestRank = this.state.highestRank;
    
    this.state.coins = 0;
    this.state.shots = 0;
    this.state.time = 0;
    this.state.rank = 0;
    this.state.currentChain = 0;
    this.state.maxChain = 0;
    this.state.score = 0;
    this.state.clicks = 2;
    this.state.maxClicks = 2;
    this.state.timeRemaining = 10;
    this.state.maxTime = 10;
    this.state.gameActive = false;
    this.state.totalAtomsDestroyed = 0;
    
    // Restore persistent stats
    this.state.metaCurrency = preservedMetaCurrency;
    this.state.quantumCores = preservedQuantumCores;
    this.state.highestRank = preservedHighestRank;
    
    this.saveGame();
    console.log(`[GameState] Run reset - Earned ${metaEarned} meta currency (total: ${this.state.metaCurrency}) and ${quantumEarned} quantum cores (total: ${this.state.quantumCores})`);
    
    return metaEarned;
  }

  /**
   * Add quantum cores (for testing or rewards)
   */
  addQuantumCores(amount: number): void {
    this.state.quantumCores += amount;
    this.saveGame();
  }

  /**
   * Reset game - completely wipe all progress
   */
  reset(): void {
    // Clear localStorage first
    localStorage.removeItem('CriticalChain_Save');
    
    // Reset to fresh state
    this.state = {
      coins: 0,
      shots: 0,
      time: 0,
      rank: 0,
      currentChain: 0,
      maxChain: 0,
      score: 0,
      metaCurrency: 0,
      quantumCores: 0,
      prestigeUpgrades: {},
      clicks: 2,
      maxClicks: 2,
      timeRemaining: 10,
      maxTime: 10,
      gameActive: false,
      upgrades: {
        // Neutron stats (default values)
        neutronSpeed: 1,
        neutronLifetime: 1,
        neutronSize: 1,
        neutronCountPlayer: 2,
        neutronCountAtom: 2,
        
        // Atom stats (default values)
        atomSpeed: 1,
        atomLifetime: 1,
        atomSize: 1,
        atomSpawnRate: 1,
        atomHealth: 1,
        
        // Legacy/Special upgrades
        neutronReflector: 0,
        pierce: 0,
        homing: 0,
        momentum: 0,
        chainMultiplier: 1,
      },
      lastSave: Date.now(),
      gameStartTime: Date.now(),
      totalAtomsDestroyed: 0,
      highestRank: 0,
    };
    
    // Save the fresh state
    this.saveGame();
    console.log('[GameState] All progress reset!');
  }
}

export const gameState = new GameStateManager();
