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
  
  // Click system
  clicks: number;
  maxClicks: number;
  timeRemaining: number;
  maxTime: number;
  gameActive: boolean;
  
  // Upgrades
  upgrades: {
    neutronReflector: number;     // % chance to reflect neutrons
    pierce: number;                // Neutrons can pierce through atoms
    homing: number;                // Neutrons home towards atoms
    momentum: number;              // Clicking doesn't reset chain
    startingNeutrons: number;      // More neutrons per click
    chainMultiplier: number;       // Chain value multiplier
    atomSpawnRate: number;         // Faster atom spawning
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
          neutronReflector: 0,
          pierce: 0,
          homing: 0,
          momentum: 0,
          startingNeutrons: 2,
          chainMultiplier: 1,
          atomSpawnRate: 1,
        };
      }
      
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
      clicks: 2,
      maxClicks: 2,
      timeRemaining: 10,
      maxTime: 10,
      gameActive: false,
      upgrades: {
        neutronReflector: 0,
        pierce: 0,
        homing: 0,
        momentum: 0,
        startingNeutrons: 2,  // Start with 2 neutrons per click
        chainMultiplier: 1,
        atomSpawnRate: 1,
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
   * Reset current chain
   */
  resetChain(): void {
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
        if (!parsed.upgrades || typeof parsed.upgrades.startingNeutrons === 'undefined') {
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
   * Reset run and award meta currency based on rank
   * Returns the meta currency earned
   */
  resetRun(): number {
    // Calculate meta currency based on rank (1 meta per rank level)
    const metaEarned = this.state.rank;
    this.state.metaCurrency += metaEarned;
    
    // Reset run-specific stats (keep metaCurrency and highestRank)
    const preservedMetaCurrency = this.state.metaCurrency;
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
    this.state.highestRank = preservedHighestRank;
    
    this.saveGame();
    console.log(`[GameState] Run reset - Earned ${metaEarned} meta currency (total: ${this.state.metaCurrency})`);
    
    return metaEarned;
  }

  /**
   * Reset game
   */
  reset(): void {
    this.state = this.initializeState();
    this.saveGame();
  }
}

export const gameState = new GameStateManager();
