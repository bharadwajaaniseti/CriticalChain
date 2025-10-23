/**
 * Prestige System
 * Handles prestige resets and permanent bonuses
 */

import { gameState } from './GameStateManager';

interface PrestigeBonus {
  level: number;
  epMultiplier: number;
  cmBonus: number;
  totalResets: number;
}

class PrestigeSystem {
  private readonly PRESTIGE_THRESHOLD = 1e9; // 1 billion EP
  private readonly BASE_BONUS = 1.05; // 5% per prestige
  private bonusHistory: PrestigeBonus[] = [];

  constructor() {
    this.loadPrestigeBonuses();
  }

  /**
   * Check if prestige is available
   */
  canPrestige(): boolean {
    const state = gameState.getState();
    return state.ep >= this.PRESTIGE_THRESHOLD && state.totalEPGenerated >= this.PRESTIGE_THRESHOLD;
  }

  /**
   * Perform prestige reset
   */
  performPrestige(): void {
    if (!this.canPrestige()) {
      console.warn('[PRESTIGE] Cannot prestige yet');
      return;
    }

    const currentState = gameState.getState();
    const newBonus = this.BASE_BONUS;

    // Record prestige event
    this.bonusHistory.push({
      level: currentState.prestigeLevel,
      epMultiplier: currentState.epMultiplier * newBonus,
      cmBonus: currentState.cm * 0.05,
      totalResets: currentState.prestigeLevel + 1,
    });

    // Perform reset
    gameState.prestigeReset(newBonus);
    this.savePrestigeBonuses();

    console.log('[PRESTIGE] Reset successful! Bonus: x' + newBonus.toFixed(2));
  }

  /**
   * Get prestige progress
   */
  getPrestigeProgress(): {
    currentEP: number;
    threshold: number;
    percentage: number;
    canPrestige: boolean;
  } {
    const state = gameState.getState();
    const percentage = Math.min((state.ep / this.PRESTIGE_THRESHOLD) * 100, 100);

    return {
      currentEP: state.ep,
      threshold: this.PRESTIGE_THRESHOLD,
      percentage,
      canPrestige: this.canPrestige(),
    };
  }

  /**
   * Get prestige bonuses
   */
  getBonuses(): PrestigeBonus[] {
    return [...this.bonusHistory];
  }

  /**
   * Save prestige bonuses to localStorage
   */
  private savePrestigeBonuses(): void {
    localStorage.setItem(
      'CriticalChain_Prestige',
      JSON.stringify(this.bonusHistory)
    );
  }

  /**
   * Load prestige bonuses from localStorage
   */
  private loadPrestigeBonuses(): void {
    const saved = localStorage.getItem('CriticalChain_Prestige');
    if (saved) {
      try {
        this.bonusHistory = JSON.parse(saved);
      } catch (error) {
        console.error('[PRESTIGE] Failed to load bonuses', error);
      }
    }
  }

  /**
   * Get total prestige level
   */
  getTotalPrestigeLevel(): number {
    return this.bonusHistory.length;
  }

  /**
   * Calculate cumulative bonuses
   */
  getCumulativeBonus(): number {
    let multiplier = 1;
    for (const bonus of this.bonusHistory) {
      multiplier *= bonus.epMultiplier;
    }
    return multiplier;
  }
}

export const prestigeSystem = new PrestigeSystem();
