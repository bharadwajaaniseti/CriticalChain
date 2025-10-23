/**
 * Config Integration Examples
 * 
 * This file shows how to use GameConfig.ts in different parts of the game.
 * Copy these patterns when integrating the config into your systems.
 */

// ============================================================================
// EXAMPLE 1: Using Config in GameStateManager
// ============================================================================

/*
import { StartingResources, GameSession, DefaultUpgrades } from '../config/GameConfig';

class GameStateManager {
  private state: GameState = {
    // Use config for starting resources
    coins: StartingResources.coins,
    quantumCores: StartingResources.quantumCores,
    rank: StartingResources.rank,
    score: StartingResources.score,
    totalAtomsDestroyed: StartingResources.totalAtomsDestroyed,
    highestRank: StartingResources.highestRank,
    
    // Use config for session defaults
    maxClicks: GameSession.maxClicks,
    maxTime: GameSession.maxTime,
    
    // Use config for upgrades
    upgrades: { ...DefaultUpgrades },
  };
  
  reset(): void {
    this.state = {
      coins: StartingResources.coins,
      quantumCores: StartingResources.quantumCores,
      // ... use config instead of hardcoded values
    };
  }
}
*/

// ============================================================================
// EXAMPLE 2: Using Config in ReactionVisualizer (Physics)
// ============================================================================

/*
import { PhysicsConfig } from '../config/GameConfig';

class ReactionVisualizer {
  private neutronSpeed = PhysicsConfig.neutronBaseSpeed;
  private neutronLifetime = PhysicsConfig.neutronBaseLifetime;
  private neutronSize = PhysicsConfig.neutronBaseSize;
  
  spawnNeutron() {
    return {
      speed: this.neutronSpeed * upgradeMultiplier,
      lifetime: this.neutronLifetime * upgradeMultiplier,
      radius: this.neutronSize * upgradeMultiplier,
    };
  }
}
*/

// ============================================================================
// EXAMPLE 3: Using Config in SkillTreeManager (Costs)
// ============================================================================

/*
import { SkillTreeCosts } from '../config/GameConfig';

class SkillTreeManager {
  calculateCost(skill: Skill): number {
    let baseCost = SkillTreeCosts.tier1BaseCost;
    
    // Adjust base cost by tier
    if (skill.tier === 2) baseCost = SkillTreeCosts.tier2BaseCost;
    if (skill.tier === 3) baseCost = SkillTreeCosts.tier3BaseCost;
    if (skill.tier === 4) baseCost = SkillTreeCosts.tier4BaseCost;
    if (skill.isUltimate) baseCost = SkillTreeCosts.ultimateBaseCost;
    
    // Apply multiplier
    const multiplier = skill.isExpensive 
      ? SkillTreeCosts.expensiveMultiplier 
      : SkillTreeCosts.standardMultiplier;
    
    return Math.floor(baseCost * Math.pow(multiplier, skill.currentLevel));
  }
}
*/

// ============================================================================
// EXAMPLE 4: Using Config for Balance Tweaks
// ============================================================================

/*
import { BalanceConfig } from '../config/GameConfig';

function calculateCoinReward(atomType: string, comboLevel: number): number {
  let baseCoins = BalanceConfig.baseAtomBreakCoins;
  
  // Special atom bonuses
  if (atomType === 'time') baseCoins += 5;
  if (atomType === 'supernova') baseCoins += 25;
  if (atomType === 'blackhole') baseCoins += 15;
  
  // Combo multiplier
  const comboBonus = 1 + (comboLevel * BalanceConfig.comboMultiplier);
  
  return Math.floor(baseCoins * comboBonus);
}
*/

// ============================================================================
// EXAMPLE 5: Using Config for Debug Features
// ============================================================================

/*
import { DebugConfig } from '../config/GameConfig';

class GameUI {
  render() {
    if (DebugConfig.showFPS) {
      this.renderFPSCounter();
    }
    
    if (DebugConfig.enableLogging) {
      console.log('[GameUI] Rendering...');
    }
  }
  
  deductCoins(amount: number): boolean {
    if (DebugConfig.godMode) {
      return true; // Always succeed in god mode
    }
    
    return this.state.coins >= amount;
  }
}
*/

// ============================================================================
// EXAMPLE 6: Overriding Config Values at Runtime
// ============================================================================

/*
import { GameConfig } from '../config/GameConfig';

// For special events or difficulty modes
function applyEasyMode() {
  // Note: This modifies the imported object
  // Better to create a separate gameState.difficultyMultiplier
  const easyMultiplier = 2;
  
  console.log('Easy mode activated!');
  console.log(`Starting coins: ${GameConfig.GAME_SESSION.startingCoins * easyMultiplier}`);
}

// Better approach: Use config as defaults, store current values in state
class DifficultyManager {
  private currentMaxClicks: number;
  
  constructor() {
    this.currentMaxClicks = GameConfig.GAME_SESSION.maxClicks;
  }
  
  setDifficulty(mode: 'easy' | 'normal' | 'hard') {
    switch(mode) {
      case 'easy':
        this.currentMaxClicks = GameConfig.GAME_SESSION.maxClicks * 2;
        break;
      case 'normal':
        this.currentMaxClicks = GameConfig.GAME_SESSION.maxClicks;
        break;
      case 'hard':
        this.currentMaxClicks = Math.floor(GameConfig.GAME_SESSION.maxClicks / 2);
        break;
    }
  }
}
*/

export {};
