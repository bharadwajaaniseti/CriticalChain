/**
 * Automation System
 * Handles auto-triggering of reactions and passive generation
 */

import { gameState } from './GameStateManager';
import { audioManager, AudioType } from './AudioManager';

interface AutomationState {
  autoTriggerEnabled: boolean;
  autoTriggerInterval: number;
  lastTriggerTime: number;
}

class AutomationSystem {
  private state: AutomationState = {
    autoTriggerEnabled: false,
    autoTriggerInterval: 5000, // 5 seconds per ARU level
    lastTriggerTime: Date.now(),
  };
  private automationLoop: number | null = null;

  constructor() {
    this.startAutomation();
  }

  /**
   * Start the automation loop
   */
  private startAutomation(): void {
    this.automationLoop = setInterval(() => {
      const gameData = gameState.getState();
      const aruLevel = gameData.aruLevel;

      if (aruLevel > 0) {
        const interval = this.state.autoTriggerInterval / aruLevel;
        const now = Date.now();

        if (now - this.state.lastTriggerTime >= interval) {
          this.triggerAutoReaction();
          this.state.lastTriggerTime = now;
        }
      }
    }, 1000); // Check every second
  }

  /**
   * Trigger an automated reaction
   */
  private triggerAutoReaction(): void {
    const epGain = gameState.triggerReaction();
    console.log(`[AUTOMATION] Auto-triggered reaction: +${Math.floor(epGain)} EP`);
  }

  /**
   * Stop automation
   */
  stop(): void {
    if (this.automationLoop) {
      clearInterval(this.automationLoop);
      this.automationLoop = null;
    }
  }

  /**
   * Resume automation
   */
  resume(): void {
    if (!this.automationLoop) {
      this.startAutomation();
    }
  }

  /**
   * Get automation state
   */
  getState(): AutomationState {
    return { ...this.state };
  }
}

export const automationSystem = new AutomationSystem();
