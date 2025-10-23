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
  coinsThisRound: number; // Track coins earned in current round (before chain multiplier)
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
    
    // Critical hit system
    critChance: number;                // % chance for critical neutrons
    critDoublNeutrons: number;         // 1 = critical hits spawn 2x neutrons from atoms
    
    // Shockwave systems
    atomShockwave: number;             // 1 = broken atoms release shockwave
    atomShockwaveForce: number;        // Multiplier for atom shockwave force
    clickShockwave: number;            // 1 = clicks create explosion
    clickShockwaveRadius: number;      // Multiplier for click shockwave radius
    
    // Economy upgrades
    baseCoinValue: number;             // Bonus coins per atom break
    skillCostReduction: number;        // % reduction in skill costs
    startingCoins: number;             // Bonus coins at start of each run
    economyMastery: number;            // 1 = gain +1% coins per 10 atoms broken
    
    // Special atom types
    timeAtomsUnlocked: number;         // 1 = time atoms can spawn
    timeAtomChance: number;            // % chance for time atoms
    timeAtomBonus: number;             // Bonus time granted by time atoms
    
    supernovaUnlocked: number;         // 1 = supernova atoms can spawn
    supernovaChance: number;           // % chance for supernova atoms
    supernovaNeutrons: number;         // Bonus neutrons from supernova atoms
    
    blackHoleUnlocked: number;         // 1 = black hole atoms can spawn (fissile ones that explode)
    blackHoleChance: number;           // % chance for black hole atoms
    blackHolePullRadius: number;       // Multiplier for black hole pull radius
    
    fissionMastery: number;            // 1 = special atoms 2x spawn and 50% more effective
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
    this.initializePrestigeBonuses();
  }

  /**
   * Initialize prestige bonuses on game load
   */
  private async initializePrestigeBonuses(): Promise<void> {
    try {
      const { prestigeSystem } = await import('./PrestigeSystem');
      const bonuses = prestigeSystem.calculateBonuses();
      this.prestigeCoinMultiplier = bonuses.coinValueMultiplier;
      this.prestigeMultiplierLastUpdate = Date.now();
    } catch (e) {
      console.log('[GameState] Prestige system not yet loaded');
    }
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
          
          // Critical hit system
          critChance: 0,
          critDoublNeutrons: 0,
          
          // Shockwave systems
          atomShockwave: 0,
          atomShockwaveForce: 1,
          clickShockwave: 0,
          clickShockwaveRadius: 1,
          
          // Economy upgrades
          baseCoinValue: 0,
          skillCostReduction: 0,
          startingCoins: 0,
          economyMastery: 0,
          
          // Special atom types
          timeAtomsUnlocked: 0,
          timeAtomChance: 0,
          timeAtomBonus: 0.5,
          
          supernovaUnlocked: 0,
          supernovaChance: 0,
          supernovaNeutrons: 10,
          
          blackHoleUnlocked: 0,
          blackHoleChance: 0,
          blackHolePullRadius: 1,
          
          fissionMastery: 0,
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
      
      // New upgrade properties (backward compatibility)
      if (saved.upgrades.critChance === undefined) saved.upgrades.critChance = 0;
      if (saved.upgrades.critDoublNeutrons === undefined) saved.upgrades.critDoublNeutrons = 0;
      if (saved.upgrades.atomShockwave === undefined) saved.upgrades.atomShockwave = 0;
      if (saved.upgrades.atomShockwaveForce === undefined) saved.upgrades.atomShockwaveForce = 1;
      if (saved.upgrades.clickShockwave === undefined) saved.upgrades.clickShockwave = 0;
      if (saved.upgrades.clickShockwaveRadius === undefined) saved.upgrades.clickShockwaveRadius = 1;
      if (saved.upgrades.baseCoinValue === undefined) saved.upgrades.baseCoinValue = 0;
      if (saved.upgrades.skillCostReduction === undefined) saved.upgrades.skillCostReduction = 0;
      if (saved.upgrades.startingCoins === undefined) saved.upgrades.startingCoins = 0;
      if (saved.upgrades.economyMastery === undefined) saved.upgrades.economyMastery = 0;
      if (saved.upgrades.timeAtomsUnlocked === undefined) saved.upgrades.timeAtomsUnlocked = 0;
      if (saved.upgrades.timeAtomChance === undefined) saved.upgrades.timeAtomChance = 0;
      if (saved.upgrades.timeAtomBonus === undefined) saved.upgrades.timeAtomBonus = 0.5;
      if (saved.upgrades.supernovaUnlocked === undefined) saved.upgrades.supernovaUnlocked = 0;
      if (saved.upgrades.supernovaChance === undefined) saved.upgrades.supernovaChance = 0;
      if (saved.upgrades.supernovaNeutrons === undefined) saved.upgrades.supernovaNeutrons = 10;
      if (saved.upgrades.blackHoleUnlocked === undefined) saved.upgrades.blackHoleUnlocked = 0;
      if (saved.upgrades.blackHoleChance === undefined) saved.upgrades.blackHoleChance = 0;
      if (saved.upgrades.blackHolePullRadius === undefined) saved.upgrades.blackHolePullRadius = 1;
      if (saved.upgrades.fissionMastery === undefined) saved.upgrades.fissionMastery = 0;
      
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
      coinsThisRound: 0,
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
        
        // Critical hit system
        critChance: 0,
        critDoublNeutrons: 0,
        
        // Shockwave systems
        atomShockwave: 0,
        atomShockwaveForce: 1,
        clickShockwave: 0,
        clickShockwaveRadius: 1,
        
        // Economy upgrades
        baseCoinValue: 0,
        skillCostReduction: 0,
        startingCoins: 0,
        economyMastery: 0,
        
        // Special atom types
        timeAtomsUnlocked: 0,
        timeAtomChance: 0,
        timeAtomBonus: 0.5,
        
        supernovaUnlocked: 0,
        supernovaChance: 0,
        supernovaNeutrons: 10,
        
        blackHoleUnlocked: 0,
        blackHoleChance: 0,
        blackHolePullRadius: 1,
        
        fissionMastery: 0,
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
    // Reset coins earned this round
    this.state.coinsThisRound = 0;
  }

  /**
   * End the game session
   */
  endGame(): void {
    this.state.gameActive = false;
    
    // Apply chain multiplier to THIS ROUND's coins and add to total
    if (this.state.maxChain > 0 && this.state.coinsThisRound > 0) {
      const coinsBeforeMultiplier = this.state.coinsThisRound;
      const multipliedCoins = Math.floor(this.state.coinsThisRound * this.state.maxChain);
      
      // Add the multiplied coins to total
      this.state.coins += multipliedCoins;
      
      console.log(`[GameState] 🔗 Round End - Chain Multiplier Applied: ${coinsBeforeMultiplier} coins × ${this.state.maxChain} chain = ${multipliedCoins} coins (total: ${this.state.coins})`);
      this.saveGame(); // Save immediately so coins persist
    } else if (this.state.coinsThisRound > 0) {
      // No chain multiplier, just add the coins
      this.state.coins += this.state.coinsThisRound;
      console.log(`[GameState] Round End - No chain multiplier: ${this.state.coinsThisRound} coins added (total: ${this.state.coins})`);
      this.saveGame();
    }
  }

  /**
   * Use a click (returns true if click was used)
   */
  useClick(): boolean {
    if (this.state.clicks > 0 && this.state.gameActive) {
      this.state.clicks--;
      this.state.shots++;
      
      // Reset chain on click (default behavior)
      // This can be prevented with the "momentum" skill tree upgrade
      if (this.state.upgrades.momentum === 0) {
        this.state.currentChain = 0;
        console.log('[GameState] Chain reset on click (momentum upgrade not active)');
      } else {
        console.log('[GameState] Chain preserved on click (momentum upgrade active)');
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
    
    // Reset chain on click (default behavior)
    // This can be prevented later with the "momentum" skill tree upgrade
    if (this.state.upgrades.momentum === 0) {
      this.state.currentChain = 0;
    }
  }

  /**
   * Increment chain counter
   */
  incrementChain(amount: number = 1): void {
    const before = this.state.currentChain;
    this.state.currentChain += amount;
    if (this.state.currentChain > this.state.maxChain) {
      this.state.maxChain = this.state.currentChain;
    }
    console.log(`[GameState] incrementChain: ${before} + ${amount} = ${this.state.currentChain}`);
  }

  /**
   * Reset current chain (only resets the active chain counter, not the display)
   * The display shows maxChain which persists through the round
   */
  resetChain(): void {
    // Don't reset chain during gameplay - let it accumulate through the round
    // Chain only resets when starting a new game/round
  }

  /**
   * Award coins for destroying an atom
   * Longer chains are worth more
   */
  awardCoins(atomValue: number): void {
    // Get prestige bonuses synchronously (cached calculation)
    const prestigeMultiplier = this.getPrestigeCoinMultiplier();
    
    const chainBonus = 1 + (this.state.currentChain * 0.1 * this.state.upgrades.chainMultiplier);
    const coins = Math.floor(atomValue * chainBonus * prestigeMultiplier);
    
    // Add only to coinsThisRound during gameplay (will be multiplied by chain at round end and added to total coins)
    this.state.coinsThisRound += coins;
    this.state.score += coins;
    this.state.totalAtomsDestroyed++;
    
    // Check for rank up
    this.checkRankUp();
  }

  /**
   * Get cached prestige coin multiplier (to avoid recalculating on every coin award)
   */
  private prestigeCoinMultiplier: number = 1;
  
  private getPrestigeCoinMultiplier(): number {
    // Use cached value (updated on game load and after prestige upgrades)
    return this.prestigeCoinMultiplier;
  }
  
  /**
   * Force recalculation of prestige bonuses (call after purchasing prestige upgrades)
   */
  async recalculatePrestigeBonuses(): Promise<void> {
    await this.initializePrestigeBonuses();
  }
  
  private prestigeMultiplierLastUpdate: number = 0;

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
   * Update max clicks and max time (for skill tree upgrades)
   */
  updateResourceCaps(maxClicks?: number, maxTime?: number): void {
    if (maxClicks !== undefined) {
      this.state.maxClicks = maxClicks;
      console.log(`[GameState] maxClicks updated to ${maxClicks}`);
    }
    if (maxTime !== undefined) {
      this.state.maxTime = maxTime;
      console.log(`[GameState] maxTime updated to ${maxTime}`);
    }
  }

  /**
   * Update upgrade values directly (for skill tree)
   */
  updateUpgrade(upgradeKey: keyof GameState['upgrades'], value: number): void {
    this.state.upgrades[upgradeKey] = value;
    console.log(`[GameState] ${upgradeKey} updated to ${value}`);
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
  async startFreshRun(): Promise<void> {
    // Calculate prestige bonuses and update cached values
    const { prestigeSystem } = await import('./PrestigeSystem');
    const bonuses = prestigeSystem.calculateBonuses();
    this.prestigeCoinMultiplier = bonuses.coinValueMultiplier;
    
    // Debug: Check metaCurrency before any changes
    console.log(`[GameState] startFreshRun - metaCurrency BEFORE: ${this.state.metaCurrency}`);
    
    // Reset run-specific stats (including coins, rank, and skill tree)
    // Keep persistent progression: quantum cores, prestige upgrades, totalAtomsDestroyed, metaCurrency, and highestRank
    // Apply prestige bonuses to starting resources
    this.state.coins = bonuses.startingCoins;
    this.state.shots = 0;
    this.state.time = 0;
    this.state.rank = 0;
    this.state.currentChain = 0;
    this.state.maxChain = 0;
    this.state.score = 0;
    this.state.clicks = 2 + bonuses.startingClicks;
    this.state.maxClicks = 2 + bonuses.startingClicks;
    this.state.timeRemaining = 10 + bonuses.startingTime;
    this.state.maxTime = 10 + bonuses.startingTime;
    // Don't set gameActive here - let startGame() handle it when GamePage loads
    // this.state.gameActive = false;
    // Don't reset totalAtomsDestroyed - it's a lifetime stat
    
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
      
      // Critical hit system
      critChance: 0,
      critDoublNeutrons: 0,
      
      // Shockwave systems
      atomShockwave: 0,
      atomShockwaveForce: 1,
      clickShockwave: 0,
      clickShockwaveRadius: 1,
      
      // Economy upgrades
      baseCoinValue: 0,
      skillCostReduction: 0,
      startingCoins: 0,
      economyMastery: 0,
      
      // Special atom types
      timeAtomsUnlocked: 0,
      timeAtomChance: 0,
      timeAtomBonus: 0.5,
      
      supernovaUnlocked: 0,
      supernovaChance: 0,
      supernovaNeutrons: 10,
      
      blackHoleUnlocked: 0,
      blackHoleChance: 0,
      blackHolePullRadius: 1,
      
      fissionMastery: 0,
    };
    
    // Reset skill tree
    const { skillTreeManager } = await import('./SkillTreeManager');
    skillTreeManager.resetSkillTree();
    
    // Debug: Check metaCurrency after changes
    console.log(`[GameState] startFreshRun - metaCurrency AFTER: ${this.state.metaCurrency}`);
    
    this.saveGame();
    console.log('[GameState] Fresh run started - coins, rank, and skill tree reset (metaCurrency preserved)');
  }

  /**
   * Reset run and award meta currency based on rank
   * Returns the meta currency earned
   */
  async resetRun(): Promise<number> {
    // Calculate prestige bonuses
    const { prestigeSystem } = await import('./PrestigeSystem');
    const bonuses = prestigeSystem.calculateBonuses();
    
    // Note: Chain multiplier already applied in endGame() when round ended
    
    // Calculate meta currency and quantum cores based on rank
    const metaEarned = this.state.rank;
    const baseQuantumEarned = Math.floor(this.state.rank / 2); // 1 quantum core per 2 ranks
    const quantumEarned = Math.floor(baseQuantumEarned * bonuses.quantumGainMultiplier); // Apply multiplier
    
    this.state.metaCurrency += metaEarned;
    this.state.quantumCores += quantumEarned;
    
    // Reset run-specific stats (keep coins, metaCurrency, quantumCores, highestRank, and totalAtomsDestroyed)
    const preservedCoins = this.state.coins;
    const preservedMetaCurrency = this.state.metaCurrency;
    const preservedQuantumCores = this.state.quantumCores;
    const preservedHighestRank = this.state.highestRank;
    const preservedTotalAtomsDestroyed = this.state.totalAtomsDestroyed;
    
    this.state.coins = preservedCoins; // Keep coins accumulated across rounds
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
    
    // Restore persistent stats
    this.state.metaCurrency = preservedMetaCurrency;
    this.state.quantumCores = preservedQuantumCores;
    this.state.highestRank = preservedHighestRank;
    this.state.totalAtomsDestroyed = preservedTotalAtomsDestroyed;
    
    this.saveGame();
    console.log(`[GameState] Run reset - Earned ${metaEarned} meta currency (total: ${this.state.metaCurrency}) and ${quantumEarned} quantum cores (total: ${this.state.quantumCores})`);
    console.log(`[GameState] Coins preserved: ${this.state.coins}`);
    
    return metaEarned;
  }

  /**
   * Add quantum cores (for testing or rewards)
   */
  addQuantumCores(amount: number): void {
    this.state.quantumCores += amount;
    this.saveGame();
  }

  deductQuantumCores(amount: number): boolean {
    if (this.state.quantumCores >= amount) {
      this.state.quantumCores -= amount;
      this.saveGame();
      return true;
    }
    return false;
  }

  savePrestigeUpgrade(upgradeId: string, currentLevel: number, unlocked: boolean): void {
    this.state.prestigeUpgrades[upgradeId] = { currentLevel, unlocked };
    this.saveGame();
  }

  saveAllPrestigeUpgrades(upgrades: { [key: string]: { currentLevel: number; unlocked: boolean } }): void {
    this.state.prestigeUpgrades = upgrades;
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
      coinsThisRound: 0,
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
        
        // Critical hit system
        critChance: 0,
        critDoublNeutrons: 0,
        
        // Shockwave systems
        atomShockwave: 0,
        atomShockwaveForce: 1,
        clickShockwave: 0,
        clickShockwaveRadius: 1,
        
        // Economy upgrades
        baseCoinValue: 0,
        skillCostReduction: 0,
        startingCoins: 0,
        economyMastery: 0,
        
        // Special atom types
        timeAtomsUnlocked: 0,
        timeAtomChance: 0,
        timeAtomBonus: 0.5,
        
        supernovaUnlocked: 0,
        supernovaChance: 0,
        supernovaNeutrons: 10,
        
        blackHoleUnlocked: 0,
        blackHoleChance: 0,
        blackHolePullRadius: 1,
        
        fissionMastery: 0,
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
