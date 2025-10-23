/**
 * Home Page
 * Main menu with Play, Settings, Credits
 */

import { NavigationManager } from '../systems/NavigationManager';
import { audioManager, AudioType } from '../systems/AudioManager';
import { gameState } from '../systems/GameStateManager';

export class HomePage {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
    this.setupEventListeners();
  }

  private render(): void {
    const state = gameState.getState();
    
    this.container.innerHTML = `
      <div class="home-page">
        <div class="home-hero">
          <div class="meta-currency-display">
            <span class="meta-icon">⭐</span>
            <span class="meta-amount">${state.metaCurrency}</span>
          </div>
          
          <div class="logo-container">
            <div class="logo-orbit">
              <div class="logo-icon">⚛️</div>
            </div>
          </div>
          
          <h1 class="home-title">Critical Chain</h1>
          <p class="home-subtitle">Nuclear Chain Reaction Simulator</p>
        </div>

        <div class="home-menu">
          <button class="menu-button" id="play-btn">
            <span>▶️ Play</span>
          </button>
          
          <button class="menu-button" id="upgrades-btn">
            <span>⬆️ Skills & Upgrades</span>
          </button>
          
          <button class="menu-button" id="settings-btn">
            <span>⚙️ Settings</span>
          </button>
          
          <button class="menu-button" id="credits-btn">
            <span>ℹ️ Credits</span>
          </button>
        </div>

        <div class="home-footer">
          <p>v1.0.0 | Based on Criticality by mechabit</p>
        </div>
      </div>
    `;
  }

  private setupEventListeners(): void {
    const playBtn = document.getElementById('play-btn');
    const upgradesBtn = document.getElementById('upgrades-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const creditsBtn = document.getElementById('credits-btn');

    if (playBtn) {
      playBtn.addEventListener('click', () => {
        audioManager.playSFX(AudioType.SFX_CLICK);
        NavigationManager.navigateTo('game');
      });
    }

    if (upgradesBtn) {
      upgradesBtn.addEventListener('click', () => {
        audioManager.playSFX(AudioType.SFX_CLICK);
        NavigationManager.navigateTo('upgrades');
      });
    }

    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        audioManager.playSFX(AudioType.SFX_CLICK);
        this.showSettings();
      });
    }

    if (creditsBtn) {
      creditsBtn.addEventListener('click', () => {
        audioManager.playSFX(AudioType.SFX_CLICK);
        this.showCredits();
      });
    }
  }

  private showSettings(): void {
    // TODO: Implement settings modal
    alert('Settings coming soon!');
  }

  private showCredits(): void {
    // TODO: Implement credits modal
    alert('Credits:\nGame Design: Based on Criticality by mechabit\nDevelopment: Critical Chain Team');
  }

  destroy(): void {
    // Cleanup if needed
  }
}
