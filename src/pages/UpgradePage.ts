/**
 * Upgrade Page
 * Displays permanent upgrades using prestige.json data
 */

import { NavigationManager } from '../systems/NavigationManager';
import { gameState } from '../systems/GameStateManager';
import { audioManager, AudioType } from '../systems/AudioManager';

interface UpgradeNode {
  id: string;
  name: string;
  description: string;
  icon: string;
  currentLevel: number;
  maxLevel: number;
  baseCost: number;
  costMultiplier: number;
  unlocked: boolean;
  connectedNodes: string[];
}

export class UpgradePage {
  private container: HTMLElement;
  private upgrades: Map<string, UpgradeNode> = new Map();
  private quantumCores: number = 0;
  private prestigeCostReduction: number = 0;

  constructor(container: HTMLElement) {
    this.container = container;
    this.loadUpgrades();
  }

  private async loadUpgrades(): Promise<void> {
    try {
      const response = await fetch('/assets/data/prestige.json');
      const data = await response.json();
      
      // Get saved prestige upgrades from game state
      const state = gameState.getState();
      const savedUpgrades = state.prestigeUpgrades || {};
      
      // Convert JSON data to Map and apply saved progress
      for (const [key, value] of Object.entries(data)) {
        const upgradeNode = value as UpgradeNode;
        
        // Apply saved progress if it exists
        if (savedUpgrades[key]) {
          upgradeNode.currentLevel = savedUpgrades[key].currentLevel;
          upgradeNode.unlocked = savedUpgrades[key].unlocked;
        }
        
        this.upgrades.set(key, upgradeNode);
      }
      
      // Calculate prestige cost reduction
      await this.updatePrestigeBonuses();
      
      await this.render();
    } catch (error) {
      console.error('Failed to load upgrades:', error);
      this.container.innerHTML = '<div class="error">Failed to load upgrades</div>';
    }
  }

  private async updatePrestigeBonuses(): Promise<void> {
    const { prestigeSystem } = await import('../systems/PrestigeSystem');
    const bonuses = prestigeSystem.calculateBonuses();
    this.prestigeCostReduction = bonuses.prestigeCostReduction;
  }

  private saveUpgradesToGameState(): void {
    // Build the upgrades object
    const upgradesToSave: { [key: string]: { currentLevel: number; unlocked: boolean } } = {};
    
    this.upgrades.forEach((node) => {
      upgradesToSave[node.id] = {
        currentLevel: node.currentLevel,
        unlocked: node.unlocked
      };
    });
    
    // Save all prestige upgrades using the proper method
    gameState.saveAllPrestigeUpgrades(upgradesToSave);
  }

  private async render(): Promise<void> {
    const state = gameState.getState();
    const unlockedCount = this.getUnlockedCount();
    const totalNodes = this.upgrades.size;
    this.quantumCores = state.quantumCores || 0;
    
    // Debug: Check metaCurrency when rendering upgrade page
    console.log(`[UpgradePage] Rendering - metaCurrency: ${state.metaCurrency}, quantumCores: ${state.quantumCores}`);
    
    this.container.innerHTML = `
      <div class="upgrade-page">
        <div class="upgrade-header">
          <button class="header-btn" id="back-to-home">
            ← Back
          </button>
          <h1 class="upgrade-title">Upgrades</h1>
          <button class="reset-prestige-btn" id="reset-prestige-btn">
            ♻️ Reset Prestige
          </button>
          <div class="quantum-cores-display">
            <div class="coins-info">
              <span class="coins-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 12h.01"/>
                  <path d="M7.5 4.2c-.3-.5-.9-.7-1.3-.4C3.9 5.5 2.3 8.1 2 11c-.1.5.4 1 1 1h5c0-1.5.8-2.8 2-3.4-1.1-1.9-2-3.5-2.5-4.4z"/>
                  <path d="M21 12c.6 0 1-.4 1-1-.3-2.9-1.8-5.5-4.1-7.1-.4-.3-1.1-.2-1.3.3-.6.9-1.5 2.5-2.6 4.3 1.2.7 2 2 2 3.5h5z"/>
                  <path d="M7.5 19.8c-.3.5-.1 1.1.4 1.3 2.6 1.2 5.6 1.2 8.2 0 .5-.2.7-.8.4-1.3-.5-.9-1.4-2.5-2.5-4.3-1.2.7-2.8.7-4 0-1.1 1.8-2 3.4-2.5 4.3z"/>
                </svg>
              </span>
              <span class="coins-value" id="header-quantum-cores">${this.quantumCores}</span>
              <span class="coins-label">Available</span>
            </div>
            <div class="total-cores-info">
              <span class="total-label">Prestige unlocked:</span>
              <span class="total-value" id="prestige-unlocked">${unlockedCount}/${totalNodes}</span>
            </div>
          </div>
        </div>

        <div class="active-bonuses-section" id="active-bonuses">
          <!-- Active bonuses rendered here -->
        </div>

        <div class="upgrade-content-wrapper">
          <div id="upgrade-tree" class="upgrade-tree-wrapper">
            <!-- Upgrade tree rendered here -->
          </div>
        </div>
      </div>
    `;

    await this.renderActiveBonuses();
    this.renderUpgradeTree();
    this.setupEventListeners();
  }

  private async renderActiveBonuses(): Promise<void> {
    const container = document.getElementById('active-bonuses');
    if (!container) return;

    const { prestigeSystem } = await import('../systems/PrestigeSystem');
    const summary = prestigeSystem.getBonusSummary();

    if (summary.length === 0) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';
    let html = '<div class="bonuses-list"><h3><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline;vertical-align:middle;margin-right:8px"><path d="M12 12h.01"/><path d="M7.5 4.2c-.3-.5-.9-.7-1.3-.4C3.9 5.5 2.3 8.1 2 11c-.1.5.4 1 1 1h5c0-1.5.8-2.8 2-3.4-1.1-1.9-2-3.5-2.5-4.4z"/><path d="M21 12c.6 0 1-.4 1-1-.3-2.9-1.8-5.5-4.1-7.1-.4-.3-1.1-.2-1.3.3-.6.9-1.5 2.5-2.6 4.3 1.2.7 2 2 2 3.5h5z"/><path d="M7.5 19.8c-.3.5-.1 1.1.4 1.3 2.6 1.2 5.6 1.2 8.2 0 .5-.2.7-.8.4-1.3-.5-.9-1.4-2.5-2.5-4.3-1.2.7-2.8.7-4 0-1.1 1.8-2 3.4-2.5 4.3z"/></svg> Active Bonuses</h3><div class="bonus-items">';
    
    summary.forEach(bonus => {
      html += `<span class="bonus-item">${bonus}</span>`;
    });
    
    html += '</div></div>';
    container.innerHTML = html;
  }

  private renderUpgradeTree(): void {
    const container = document.getElementById('upgrade-tree');
    if (!container) return;

    const rootNode = this.upgrades.get('perma_root');
    if (!rootNode) {
      container.innerHTML = '<p class="loading-message">Loading upgrades...</p>';
      return;
    }

    let html = '<div class="upgrade-tree">';
    html += this.renderUpgradeNodes();
    html += '</div>';
    
    container.innerHTML = html;

    // Add click listeners to upgrade nodes
    container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const upgradeNode = target.closest('.upgrade-node');
      if (upgradeNode && !upgradeNode.classList.contains('upgrade-locked')) {
        const upgradeId = upgradeNode.getAttribute('data-upgrade-id');
        if (upgradeId) {
          this.handleUpgradePurchase(upgradeId);
        }
      }
    });
  }

  private renderUpgradeNodes(): string {
    let html = '';
    
    // Group all nodes by their type/category for better organization
    const rootNodes: UpgradeNode[] = [];
    const branchNodes: UpgradeNode[] = [];
    const otherNodes: UpgradeNode[] = [];
    
    this.upgrades.forEach((node) => {
      if (node.id === 'perma_root') {
        rootNodes.push(node);
      } else if (node.id.includes('branch')) {
        branchNodes.push(node);
      } else {
        otherNodes.push(node);
      }
    });
    
    // Render all nodes in groups
    if (rootNodes.length > 0) {
      html += '<div class="upgrade-tier">';
      html += '<h2 class="tier-title">Core</h2>';
      rootNodes.forEach(node => {
        html += this.renderNode(node);
      });
      html += '</div>';
    }
    
    if (branchNodes.length > 0) {
      html += '<div class="upgrade-tier">';
      html += '<h2 class="tier-title">Branches</h2>';
      branchNodes.forEach(node => {
        html += this.renderNode(node);
      });
      html += '</div>';
    }
    
    if (otherNodes.length > 0) {
      html += '<div class="upgrade-tier">';
      html += '<h2 class="tier-title">Upgrades</h2>';
      otherNodes.forEach(node => {
        html += this.renderNode(node);
      });
      html += '</div>';
    }
    
    return html;
  }

  private renderNode(node: UpgradeNode): string {
    const cost = this.getUpgradeCost(node);
    const canAfford = this.quantumCores >= cost;
    const isMaxed = node.currentLevel >= node.maxLevel;
    
    let statusClass = 'upgrade-locked';
    if (node.unlocked) {
      if (isMaxed) statusClass = 'upgrade-maxed';
      else if (canAfford) statusClass = 'upgrade-available';
      else statusClass = 'upgrade-visible';
    }
    
    return `
      <div class="upgrade-node ${statusClass}" data-upgrade-id="${node.id}">
        <div class="upgrade-header">
          <div class="upgrade-info">
            <div class="upgrade-name">${node.name}</div>
            <div class="upgrade-level">Level ${node.currentLevel}/${node.maxLevel}</div>
          </div>
        </div>
        <p class="upgrade-description">${node.description}</p>
        ${!isMaxed && node.unlocked ? `
          <div class="upgrade-cost ${canAfford ? 'can-afford' : 'cannot-afford'}">
            <span class="cost-label">Cost:</span>
            <span class="cost-value">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; margin-right: 4px;">
                <path d="M12 12h.01"/>
                <path d="M7.5 4.2c-.3-.5-.9-.7-1.3-.4C3.9 5.5 2.3 8.1 2 11c-.1.5.4 1 1 1h5c0-1.5.8-2.8 2-3.4-1.1-1.9-2-3.5-2.5-4.4z"/>
                <path d="M21 12c.6 0 1-.4 1-1-.3-2.9-1.8-5.5-4.1-7.1-.4-.3-1.1-.2-1.3.3-.6.9-1.5 2.5-2.6 4.3 1.2.7 2 2 2 3.5h5z"/>
                <path d="M7.5 19.8c-.3.5-.1 1.1.4 1.3 2.6 1.2 5.6 1.2 8.2 0 .5-.2.7-.8.4-1.3-.5-.9-1.4-2.5-2.5-4.3-1.2.7-2.8.7-4 0-1.1 1.8-2 3.4-2.5 4.3z"/>
              </svg>
              ${cost}
            </span>
          </div>
        ` : ''}
        ${isMaxed ? '<div class="upgrade-maxed-label">MAXED</div>' : ''}
        ${!node.unlocked ? '<div class="upgrade-locked-label">🔒 LOCKED</div>' : ''}
      </div>
    `;
  }

  private setupEventListeners(): void {
    const backBtn = document.getElementById('back-to-home');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        audioManager.playSFX(AudioType.SFX_CLICK);
        NavigationManager.navigateTo('home');
      });
    }

    const resetBtn = document.getElementById('reset-prestige-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        audioManager.playSFX(AudioType.SFX_CLICK);
        this.showResetConfirmation();
      });
    }

    // Update quantum cores display (less frequently to avoid stuttering)
    setInterval(() => this.updateQuantumCores(), 500);
  }

  private showResetConfirmation(): void {
    const totalSpent = this.calculateTotalSpent();
    
    if (totalSpent === 0) {
      alert('You haven\'t purchased any prestige upgrades yet!');
      return;
    }

    // Create confirmation overlay
    const overlay = document.createElement('div');
    overlay.className = 'reset-confirmation-overlay';
    overlay.innerHTML = `
      <div class="reset-confirmation-panel">
        <h2>⚠️ Reset Prestige Upgrades?</h2>
        <p class="reset-warning">This will reset all prestige upgrades and refund your Quantum Cores.</p>
        <div class="meta-reward">
          <div class="meta-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 12h.01"/>
              <path d="M7.5 4.2c-.3-.5-.9-.7-1.3-.4C3.9 5.5 2.3 8.1 2 11c-.1.5.4 1 1 1h5c0-1.5.8-2.8 2-3.4-1.1-1.9-2-3.5-2.5-4.4z"/>
              <path d="M21 12c.6 0 1-.4 1-1-.3-2.9-1.8-5.5-4.1-7.1-.4-.3-1.1-.2-1.3.3-.6.9-1.5 2.5-2.6 4.3 1.2.7 2 2 2 3.5h5z"/>
              <path d="M7.5 19.8c-.3.5-.1 1.1.4 1.3 2.6 1.2 5.6 1.2 8.2 0 .5-.2.7-.8.4-1.3-.5-.9-1.4-2.5-2.5-4.3-1.2.7-2.8.7-4 0-1.1 1.8-2 3.4-2.5 4.3z"/>
            </svg>
          </div>
          <div class="meta-info">
            <span class="meta-label">Quantum Cores Refunded</span>
            <span class="meta-value">
              +${totalSpent}
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; margin-left: 4px;">
                <path d="M12 12h.01"/>
                <path d="M7.5 4.2c-.3-.5-.9-.7-1.3-.4C3.9 5.5 2.3 8.1 2 11c-.1.5.4 1 1 1h5c0-1.5.8-2.8 2-3.4-1.1-1.9-2-3.5-2.5-4.4z"/>
                <path d="M21 12c.6 0 1-.4 1-1-.3-2.9-1.8-5.5-4.1-7.1-.4-.3-1.1-.2-1.3.3-.6.9-1.5 2.5-2.6 4.3 1.2.7 2 2 2 3.5h5z"/>
                <path d="M7.5 19.8c-.3.5-.1 1.1.4 1.3 2.6 1.2 5.6 1.2 8.2 0 .5-.2.7-.8.4-1.3-.5-.9-1.4-2.5-2.5-4.3-1.2.7-2.8.7-4 0-1.1 1.8-2 3.4-2.5 4.3z"/>
              </svg>
            </span>
            <span class="meta-hint">All upgrades will be locked again</span>
          </div>
        </div>
        <div class="reset-buttons">
          <button class="reset-btn confirm" id="confirm-reset-prestige">Yes, Reset</button>
          <button class="reset-btn cancel" id="cancel-reset-prestige">No, Keep Upgrades</button>
        </div>
      </div>
    `;

    this.container.appendChild(overlay);

    // Add event listeners
    document.getElementById('confirm-reset-prestige')?.addEventListener('click', () => {
      audioManager.playSFX(AudioType.SFX_UPGRADE);
      this.resetPrestigeUpgrades();
      overlay.remove();
    });

    document.getElementById('cancel-reset-prestige')?.addEventListener('click', () => {
      audioManager.playSFX(AudioType.SFX_CLICK);
      overlay.remove();
    });
  }

  private calculateTotalSpent(): number {
    let totalSpent = 0;
    
    this.upgrades.forEach((node) => {
      // Calculate total cost for all levels purchased
      for (let i = 0; i < node.currentLevel; i++) {
        totalSpent += Math.floor(node.baseCost * Math.pow(node.costMultiplier, i));
      }
    });
    
    return totalSpent;
  }

  private resetPrestigeUpgrades(): void {
    const totalSpent = this.calculateTotalSpent();
    
    // Refund quantum cores using the proper method
    gameState.addQuantumCores(totalSpent);
    this.quantumCores = gameState.getState().quantumCores;
    
    // Reset all upgrades to initial state (except root which should be unlocked)
    this.upgrades.forEach((node) => {
      node.currentLevel = 0;
      node.unlocked = node.id === 'perma_root'; // Only root stays unlocked
    });
    
    // Save the reset state
    this.saveUpgradesToGameState();
    
    // Re-render the tree
    this.render();
    
    console.log(`[Prestige] Reset complete. Refunded ${totalSpent} Quantum Cores.`);
  }

  private updateQuantumCores(): void {
    const coresEl = document.getElementById('header-quantum-cores');
    const prestigeEl = document.getElementById('prestige-unlocked');
    
    if (coresEl) {
      const state = gameState.getState();
      this.quantumCores = state.quantumCores || 0;
      coresEl.textContent = this.quantumCores.toString();
      
      if (prestigeEl) {
        const unlockedCount = this.getUnlockedCount();
        const totalNodes = this.upgrades.size;
        prestigeEl.textContent = `${unlockedCount}/${totalNodes}`;
      }
    }
  }

  private getUnlockedCount(): number {
    let count = 0;
    
    this.upgrades.forEach((node) => {
      if (node.currentLevel > 0) {
        count++;
      }
    });
    
    return count;
  }

  private getUpgradeCost(node: UpgradeNode): number {
    const baseCost = Math.floor(node.baseCost * Math.pow(node.costMultiplier, node.currentLevel));
    
    // Apply prestige cost reduction from other prestige upgrades
    // Note: This is a simplified version without async - cost reduction is recalculated in renderUpgradeTree
    return Math.max(1, Math.floor(baseCost * (1 - this.prestigeCostReduction)));
  }

  private async handleUpgradePurchase(upgradeId: string): Promise<void> {
    const node = this.upgrades.get(upgradeId);
    if (!node || !node.unlocked || node.currentLevel >= node.maxLevel) {
      audioManager.playSFX(AudioType.SFX_CLICK);
      return;
    }

    const cost = this.getUpgradeCost(node);
    
    // Try to deduct quantum cores
    if (gameState.deductQuantumCores(cost)) {
      // Upgrade node
      node.currentLevel++;
      
      // Unlock connected nodes if this is first level
      if (node.currentLevel === 1) {
        this.unlockConnectedNodes(node);
      }
      
      // Apply upgrade effect
      this.applyUpgradeEffect(node);
      
      // Save upgrades
      this.saveUpgradesToGameState();
      
      // Update local copy
      this.quantumCores = gameState.getState().quantumCores;
      
      // Update prestige bonuses (cost reduction and coin multiplier might have changed)
      await this.updatePrestigeBonuses();
      await gameState.recalculatePrestigeBonuses();
      
      audioManager.playSFX(AudioType.SFX_UPGRADE);
      this.renderUpgradeTree();
    } else {
      audioManager.playSFX(AudioType.SFX_CLICK);
    }
  }

  private unlockConnectedNodes(node: UpgradeNode): void {
    for (const connectedId of node.connectedNodes) {
      const connectedNode = this.upgrades.get(connectedId);
      if (connectedNode) {
        connectedNode.unlocked = true;
      }
    }
  }

  private applyUpgradeEffect(node: UpgradeNode): void {
    // Effects are automatically applied through PrestigeSystem.calculateBonuses()
    // This is called in:
    // - startFreshRun() for starting resources (clicks, time, coins)
    // - resetRun() for quantum gain multiplier
    // - awardCoins() for coin value multiplier
    // - getUpgradeCost() for prestige cost reduction
    // 
    // Special features like auto-prestige, offline progress, game speed, and special atoms
    // would need to be implemented in their respective systems when those features are added
    
    console.log(`[Prestige] Upgraded ${node.name} to level ${node.currentLevel}`);
  }

  destroy(): void {
    // Cleanup if needed
  }
}
