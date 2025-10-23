/**
 * Upgrade Page
 * Skills and Prestige tabs
 */

import { NavigationManager } from '../systems/NavigationManager';
import { skillTreeManager } from '../systems/SkillTreeManager';
import { gameState } from '../systems/GameStateManager';
import { audioManager, AudioType } from '../systems/AudioManager';

export class UpgradePage {
  private container: HTMLElement;
  private activeTab: 'skills' | 'prestige' = 'skills';

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
    this.setupEventListeners();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="upgrade-page">
        <div class="upgrade-header">
          <button class="header-btn" id="back-to-home">
            ← Back
          </button>
          <h1 class="upgrade-title">Skill Tree</h1>
          <div class="coins-info">
            <span class="coins-icon">💰</span>
            <span class="coins-value" id="header-coins">0</span>
          </div>
        </div>

        <div class="upgrade-tabs">
          <button class="tab-button active" data-tab="skills">
            Skills
          </button>
          <button class="tab-button locked" data-tab="prestige" title="Unlock at Rank 10">
            Prestige 🔒
          </button>
        </div>

        <div class="upgrade-content-wrapper">
          <div class="tab-content active" id="skills-tab">
            <div id="skill-tree" class="skill-tree-wrapper">
              <!-- Skill tree rendered here -->
            </div>
          </div>

          <div class="tab-content" id="prestige-tab">
            <div class="prestige-locked-message">
              <h2>🔒 Prestige System Locked</h2>
              <p>Reach <span class="prestige-requirement">Rank 10</span> to unlock Prestige</p>
              <p>Prestige allows you to restart with powerful permanent bonuses!</p>
            </div>
          </div>
        </div>
      </div>
    `;

    this.renderSkillTree();
  }

  private setupEventListeners(): void {
    const backBtn = document.getElementById('back-to-home');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        audioManager.playSFX(AudioType.SFX_CLICK);
        NavigationManager.navigateTo('home');
      });
    }

    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.classList.contains('locked')) {
          audioManager.playSFX(AudioType.SFX_CLICK);
          return;
        }
        this.switchTab(btn.getAttribute('data-tab') as 'skills' | 'prestige');
      });
    });

    // Update coins display
    setInterval(() => this.updateCoins(), 100);
  }

  private switchTab(tab: 'skills' | 'prestige'): void {
    this.activeTab = tab;

    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
    });

    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `${tab}-tab`);
    });

    audioManager.playSFX(AudioType.SFX_CLICK);
  }

  private updateCoins(): void {
    const coinsEl = document.getElementById('header-coins');
    if (coinsEl) {
      const state = gameState.getState();
      coinsEl.textContent = state?.coins?.toString() || '0';
    }
  }

  private renderSkillTree(): void {
    const container = document.getElementById('skill-tree');
    if (!container) return;

    const skills = skillTreeManager.getAllSkills();
    container.innerHTML = skillTreeManager.renderTree(skills);

    // Add click listeners to skill nodes
    container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const skillNode = target.closest('.skill-node');
      if (skillNode && !skillNode.classList.contains('locked')) {
        const skillId = skillNode.getAttribute('data-skill-id');
        if (skillId) {
          this.handleSkillUpgrade(skillId);
        }
      }
    });
  }

  private handleSkillUpgrade(skillId: string): void {
    const success = skillTreeManager.upgradeSkill(skillId);
    if (success) {
      audioManager.playSFX(AudioType.SFX_UPGRADE);
      this.renderSkillTree();
    } else {
      audioManager.playSFX(AudioType.SFX_CLICK);
    }
  }

  destroy(): void {
    // Cleanup if needed
  }
}
