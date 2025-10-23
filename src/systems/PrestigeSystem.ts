/**
 * Prestige System
 * Calculates and applies permanent upgrade bonuses
 */

import { gameState } from './GameStateManager';

export interface PrestigeBonuses {
  // Starting resources
  startingClicks: number;
  startingTime: number;
  startingCoins: number;

  // Multipliers
  quantumGainMultiplier: number;
  skillCostReduction: number;
  prestigeCostReduction: number;
  coinValueMultiplier: number;

  // Auto prestige
  autoPrestigeEnabled: boolean;
  autoPrestigeRank: number | null;
  autoPrestigeTime: number | null; // in seconds

  // Offline
  offlineProgressEnabled: boolean;
  offlineRate: number; // multiplier
  offlineCapacity: number; // in hours

  // Game speed
  gameSpeedMultiplier: number;

  // Special atoms
  timeAtomsEnabled: boolean;
  timeAtomChance: number; // percentage
  timeAtomBonus: number; // seconds per atom

  supernovaEnabled: boolean;
  supernovaChance: number; // percentage
  supernovaPower: number; // extra neutrons

  blackholeEnabled: boolean;
  blackholeChance: number; // percentage
  blackholePower: number; // pull multiplier
}

class PrestigeSystem {
  /**
   * Calculate all prestige bonuses from purchased upgrades
   */
  calculateBonuses(): PrestigeBonuses {
    const state = gameState.getState();
    const upgrades = state.prestigeUpgrades || {};

    const bonuses: PrestigeBonuses = {
      startingClicks: 0,
      startingTime: 0,
      startingCoins: 0,
      quantumGainMultiplier: 1,
      skillCostReduction: 0,
      prestigeCostReduction: 0,
      coinValueMultiplier: 1,
      autoPrestigeEnabled: false,
      autoPrestigeRank: null,
      autoPrestigeTime: null,
      offlineProgressEnabled: false,
      offlineRate: 0.25, // base 25% efficiency
      offlineCapacity: 8, // base 8 hours
      gameSpeedMultiplier: 1,
      timeAtomsEnabled: false,
      timeAtomChance: 0,
      timeAtomBonus: 1, // base 1 second
      supernovaEnabled: false,
      supernovaChance: 0,
      supernovaPower: 5, // base 5 neutrons
      blackholeEnabled: false,
      blackholeChance: 0,
      blackholePower: 1, // base 1x pull
    };

    // Helper to get upgrade level
    const getLevel = (id: string): number => {
      return upgrades[id]?.currentLevel || 0;
    };

    // Starting clicks (each tier adds +1)
    bonuses.startingClicks += getLevel('perma_start_clicks_1');
    bonuses.startingClicks += getLevel('perma_start_clicks_2') * 2;
    bonuses.startingClicks += getLevel('perma_start_clicks_3') * 3;
    bonuses.startingClicks += getLevel('perma_start_clicks_4') * 4;
    bonuses.startingClicks += getLevel('perma_start_clicks_5') * 5;

    // Starting time (+2s per level)
    bonuses.startingTime += getLevel('perma_start_time_1') * 2;
    bonuses.startingTime += getLevel('perma_start_time_2') * 2;
    bonuses.startingTime += getLevel('perma_start_time_3') * 2;

    // Starting coins (+100 per level)
    bonuses.startingCoins += getLevel('perma_start_coins_1') * 100;
    bonuses.startingCoins += getLevel('perma_start_coins_2') * 100;
    bonuses.startingCoins += getLevel('perma_start_coins_3') * 100;

    // Quantum gain (+5% per level)
    bonuses.quantumGainMultiplier += getLevel('perma_quantum_gain_1') * 0.05;
    bonuses.quantumGainMultiplier += getLevel('perma_quantum_gain_2') * 0.05;
    bonuses.quantumGainMultiplier += getLevel('perma_quantum_gain_3') * 0.05;

    // Skill cost reduction (-2% per level, max 80%)
    bonuses.skillCostReduction += getLevel('perma_skill_cost_1') * 0.02;
    bonuses.skillCostReduction += getLevel('perma_skill_cost_2') * 0.02;
    bonuses.skillCostReduction = Math.min(bonuses.skillCostReduction, 0.8);

    // Prestige upgrade cost reduction (-2% per level, max 80%)
    bonuses.prestigeCostReduction += getLevel('perma_prestige_cost_1') * 0.02;
    bonuses.prestigeCostReduction += getLevel('perma_prestige_cost_2') * 0.02;
    bonuses.prestigeCostReduction = Math.min(bonuses.prestigeCostReduction, 0.8);

    // Coin value multiplier (+10% per level)
    bonuses.coinValueMultiplier += getLevel('perma_coin_mult_1') * 0.1;
    bonuses.coinValueMultiplier += getLevel('perma_coin_mult_2') * 0.1;
    bonuses.coinValueMultiplier += getLevel('perma_coin_mult_3') * 0.1;

    // Auto prestige
    if (getLevel('perma_auto_prestige_unlock') > 0) {
      bonuses.autoPrestigeEnabled = true;
      
      // Get highest rank setting (lower rank = better)
      if (getLevel('auto_prestige_rank_4') > 0) bonuses.autoPrestigeRank = 9;
      else if (getLevel('auto_prestige_rank_3') > 0) bonuses.autoPrestigeRank = 7;
      else if (getLevel('auto_prestige_rank_2') > 0) bonuses.autoPrestigeRank = 5;
      else if (getLevel('auto_prestige_rank_1') > 0) bonuses.autoPrestigeRank = 3;
      
      // Get highest time setting (longer time = better for automation)
      if (getLevel('auto_prestige_time_3') > 0) bonuses.autoPrestigeTime = 600; // 10 min
      else if (getLevel('auto_prestige_time_2') > 0) bonuses.autoPrestigeTime = 300; // 5 min
      else if (getLevel('auto_prestige_time_1') > 0) bonuses.autoPrestigeTime = 120; // 2 min
    }

    // Offline progress
    if (getLevel('perma_offline_unlock') > 0) {
      bonuses.offlineProgressEnabled = true;
      bonuses.offlineRate += getLevel('perma_offline_rate_1') * 0.1;
      bonuses.offlineRate += getLevel('perma_offline_rate_2') * 0.1;
      bonuses.offlineCapacity += getLevel('perma_offline_capacity_1') * 2;
      bonuses.offlineCapacity += getLevel('perma_offline_capacity_2') * 2;
    }

    // Game speed
    if (getLevel('perma_game_speed_3') > 0) bonuses.gameSpeedMultiplier = 5;
    else if (getLevel('perma_game_speed_2') > 0) bonuses.gameSpeedMultiplier = 3;
    else if (getLevel('perma_game_speed_unlock') > 0) bonuses.gameSpeedMultiplier = 2;

    // Time atoms
    if (getLevel('perma_time_atom_unlock') > 0) {
      bonuses.timeAtomsEnabled = true;
      bonuses.timeAtomChance += getLevel('perma_time_atom_chance_1') * 0.5;
      bonuses.timeAtomChance += getLevel('perma_time_atom_chance_2') * 0.5;
      bonuses.timeAtomBonus += getLevel('perma_time_atom_bonus_1') * 0.5;
      bonuses.timeAtomBonus += getLevel('perma_time_atom_bonus_2') * 0.5;
    }

    // Supernova atoms
    if (getLevel('perma_supernova_atom_unlock') > 0) {
      bonuses.supernovaEnabled = true;
      bonuses.supernovaChance += getLevel('perma_supernova_chance_1') * 0.3;
      bonuses.supernovaChance += getLevel('perma_supernova_chance_2') * 0.3;
      bonuses.supernovaPower += getLevel('perma_supernova_power_1') * 2;
      bonuses.supernovaPower += getLevel('perma_supernova_power_2') * 2;
    }

    // Black hole atoms
    if (getLevel('perma_blackhole_atom_unlock') > 0) {
      bonuses.blackholeEnabled = true;
      bonuses.blackholeChance += getLevel('perma_blackhole_chance_1') * 0.2;
      bonuses.blackholeChance += getLevel('perma_blackhole_chance_2') * 0.2;
      bonuses.blackholePower += getLevel('perma_blackhole_power_1') * 0.2;
      bonuses.blackholePower += getLevel('perma_blackhole_power_2') * 0.2;
    }

    return bonuses;
  }

  /**
   * Get current prestige bonuses formatted for display
   */
  getBonusSummary(): string[] {
    const bonuses = this.calculateBonuses();
    const summary: string[] = [];

    if (bonuses.startingClicks > 0) {
      summary.push(`+${bonuses.startingClicks} Starting Clicks`);
    }
    if (bonuses.startingTime > 0) {
      summary.push(`+${bonuses.startingTime}s Starting Time`);
    }
    if (bonuses.startingCoins > 0) {
      summary.push(`+${bonuses.startingCoins} Starting Coins`);
    }
    if (bonuses.quantumGainMultiplier > 1) {
      summary.push(`${((bonuses.quantumGainMultiplier - 1) * 100).toFixed(0)}% More Quantum Cores`);
    }
    if (bonuses.skillCostReduction > 0) {
      summary.push(`${(bonuses.skillCostReduction * 100).toFixed(0)}% Skill Cost Reduction`);
    }
    if (bonuses.coinValueMultiplier > 1) {
      summary.push(`${((bonuses.coinValueMultiplier - 1) * 100).toFixed(0)}% More Coin Value`);
    }
    if (bonuses.autoPrestigeEnabled) {
      summary.push(`Auto-Prestige Active`);
    }
    if (bonuses.offlineProgressEnabled) {
      summary.push(`Offline Progress: ${(bonuses.offlineRate * 100).toFixed(0)}% for ${bonuses.offlineCapacity}h`);
    }
    if (bonuses.gameSpeedMultiplier > 1) {
      summary.push(`${bonuses.gameSpeedMultiplier}x Game Speed`);
    }
    if (bonuses.timeAtomsEnabled) {
      summary.push(`Time Atoms Unlocked`);
    }
    if (bonuses.supernovaEnabled) {
      summary.push(`Supernova Atoms Unlocked`);
    }
    if (bonuses.blackholeEnabled) {
      summary.push(`Black Hole Atoms Unlocked`);
    }

    return summary;
  }
}

export const prestigeSystem = new PrestigeSystem();
