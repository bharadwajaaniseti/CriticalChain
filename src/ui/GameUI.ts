/**
 * Game UI Manager
 * Handles all UI elements and displays for Critical Chain
 */

import { gameState, GameState } from '../systems/GameStateManager';
import { audioManager, AudioType } from '../systems/AudioManager';

interface UpgradeDefinition {
  id: keyof GameState['upgrades'];
  name: string;
  description: string;
  baseCost: number;
  costMultiplier: number;
  maxLevel: number;
  currentCost: number;
}

export class GameUI {
  private coinsDisplay: HTMLElement | null = null;
  private chainDisplay: HTMLElement | null = null;
  private timeDisplay: HTMLElement | null = null;
  private shotsDisplay: HTMLElement | null = null;
  private rankLabel: HTMLElement | null = null;
  private rankProgress: HTMLElement | null = null;
  private rankScore: HTMLElement | null = null;
  private shopModal: HTMLElement | null = null;
  private shopBtn: HTMLElement | null = null;
  private shopClose: HTMLElement | null = null;
  private shopUpgrades: HTMLElement | null = null;

  private upgrades: UpgradeDefinition[] = [
    {
      id: 'neutronReflector',
      name: 'Neutron Reflectors',
      description: '% chance to reflect neutrons at screen edges',
      baseCost: 50,
      costMultiplier: 2,
      maxLevel: 100,
      currentCost: 50,
    },
    {
      id: 'pierce',
      name: 'Piercing Neutrons',
      description: 'Neutrons can pierce through multiple atoms',
      baseCost: 100,
      costMultiplier: 3,
      maxLevel: 10,
      currentCost: 100,
    },
    {
      id: 'homing',
      name: 'Homing Guidance',
      description: 'Neutrons turn towards nearby atoms',
      baseCost: 200,
      costMultiplier: 2.5,
      maxLevel: 5,
      currentCost: 200,
    },
    {
      id: 'momentum',
      name: 'Chain Momentum',
      description: 'Clicking no longer resets chain counter',
      baseCost: 500,
      costMultiplier: 1,
      maxLevel: 1,
      currentCost: 500,
    },
    {
      id: 'startingNeutrons',
      name: 'Extra Neutrons',
      description: '+1 neutron per click',
      baseCost: 150,
      costMultiplier: 2,
      maxLevel: 10,
      currentCost: 150,
    },
    {
      id: 'chainMultiplier',
      name: 'Chain Amplifier',
      description: 'Increases chain bonus value',
      baseCost: 300,
      costMultiplier: 2.5,
      maxLevel: 10,
      currentCost: 300,
    },
    {
      id: 'atomSpawnRate',
      name: 'Atom Flux',
      description: 'Atoms spawn more frequently',
      baseCost: 100,
      costMultiplier: 2,
      maxLevel: 5,
      currentCost: 100,
    },
  ];

  constructor() {
    this.initializeElements();
    this.setupEventListeners();
    this.startUpdateLoop();
  }

  /**
   * Initialize UI elements
   */
  private initializeElements(): void {
    this.coinsDisplay = document.getElementById('coins-display');
    this.chainDisplay = document.getElementById('chain-display');
    this.timeDisplay = document.getElementById('time-display');
    this.shotsDisplay = document.getElementById('shots-display');
    this.rankLabel = document.getElementById('rank-label');
    this.rankProgress = document.getElementById('rank-progress');
    this.rankScore = document.getElementById('rank-score');
    this.shopModal = document.getElementById('shop-modal');
    this.shopBtn = document.getElementById('shop-btn');
    this.shopClose = document.getElementById('shop-close');
    this.shopUpgrades = document.getElementById('shop-upgrades');
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    if (this.shopBtn) {
      this.shopBtn.addEventListener('click', () => this.openShop());
    }

    if (this.shopClose) {
      this.shopClose.addEventListener('click', () => this.closeShop());
    }

    if (this.shopModal) {
      this.shopModal.addEventListener('click', (e) => {
        if (e.target === this.shopModal) {
          this.closeShop();
        }
      });
    }

    // ESC to close shop
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.shopModal?.classList.contains('active')) {
        this.closeShop();
      }
    });
  }

  /**
   * Start update loop
   */
  private startUpdateLoop(): void {
    setInterval(() => this.updateDisplay(), 50); // 20fps for UI
  }

  /**
   * Update all displays
   */
  private updateDisplay(): void {
    const state = gameState.getState();
    
    // Safety check
    if (!state || !state.upgrades) {
      return;
    }

    if (this.coinsDisplay) {
      this.coinsDisplay.textContent = state.coins.toString();
    }

    if (this.chainDisplay) {
      this.chainDisplay.textContent = `×${state.currentChain}`;
      // Pulse effect for high chains
      if (state.currentChain > 5) {
        this.chainDisplay.classList.add('pulse');
      } else {
        this.chainDisplay.classList.remove('pulse');
      }
    }

    if (this.timeDisplay) {
      const minutes = Math.floor(state.time / 60);
      const seconds = state.time % 60;
      this.timeDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    if (this.shotsDisplay) {
      this.shotsDisplay.textContent = state.shots.toString();
    }

    if (this.rankLabel) {
      this.rankLabel.textContent = `Rank ${state.rank}`;
    }

    if (this.rankProgress) {
      const progress = gameState.getRankProgress();
      this.rankProgress.style.width = `${progress * 100}%`;
    }

    if (this.rankScore) {
      const next = gameState.getNextRankThreshold();
      this.rankScore.textContent = `${state.score} / ${next}`;
    }
  }

  /**
   * Open shop
   */
  private openShop(): void {
    if (!this.shopModal) return;
    
    audioManager.playSFX(AudioType.SFX_CLICK);
    this.shopModal.classList.add('active');
    this.renderShop();
  }

  /**
   * Close shop
   */
  private closeShop(): void {
    if (!this.shopModal) return;
    
    audioManager.playSFX(AudioType.SFX_CLICK);
    this.shopModal.classList.remove('active');
  }

  /**
   * Render shop upgrades
   */
  private renderShop(): void {
    if (!this.shopUpgrades) return;

    const state = gameState.getState();
    let html = '';

    for (const upgrade of this.upgrades) {
      const currentLevel = state.upgrades[upgrade.id];
      const cost = this.calculateUpgradeCost(upgrade, currentLevel);
      const canAfford = state.coins >= cost;
      const isMaxed = currentLevel >= upgrade.maxLevel;

      html += `
        <div class="upgrade-item ${isMaxed ? 'maxed' : ''} ${canAfford && !isMaxed ? 'affordable' : ''}">
          <div class="upgrade-header">
            <span class="upgrade-name">${upgrade.name}</span>
            <span class="upgrade-level">Lv ${currentLevel}${isMaxed ? ' (MAX)' : `/${upgrade.maxLevel}`}</span>
          </div>
          <div class="upgrade-description">${upgrade.description}</div>
          ${!isMaxed ? `
            <button class="upgrade-buy-btn ${canAfford ? '' : 'disabled'}" 
              onclick="window.__gameUI.purchaseUpgrade('${upgrade.id}', ${cost})">
              Buy (${cost} coins)
            </button>
          ` : '<div class="upgrade-maxed">✓ Maxed Out</div>'}
        </div>
      `;
    }

    this.shopUpgrades.innerHTML = html;
  }

  /**
   * Calculate upgrade cost
   */
  private calculateUpgradeCost(upgrade: UpgradeDefinition, currentLevel: number): number {
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));
  }

  /**
   * Purchase an upgrade
   */
  purchaseUpgrade(upgradeId: string, cost: number): void {
    const success = gameState.purchaseUpgrade(upgradeId as keyof GameState['upgrades'], cost);
    if (success) {
      audioManager.playSFX(AudioType.SFX_UPGRADE);
      this.renderShop();
    } else {
      audioManager.playSFX(AudioType.SFX_CLICK);
    }
  }
}

// Export for external access
(window as any).__gameUI = null;
