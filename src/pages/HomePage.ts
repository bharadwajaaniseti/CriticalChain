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
          <p>v1.0.0</p>
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
        // Start fresh run - reset coins, rank, and skill tree (keep quantum cores and prestige upgrades)
        gameState.startFreshRun();
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
    const sfxVolume = audioManager.getSFXVolume();
    const musicVolume = audioManager.getMusicVolume();
    
    // Create settings overlay
    const overlay = document.createElement('div');
    overlay.className = 'settings-overlay';
    overlay.innerHTML = `
      <div class="settings-panel">
        <button class="close-btn" id="close-settings">✕</button>
        <h2>⚙️ Settings</h2>
        <div class="settings-content">
          <div class="setting-section">
            <h3>Audio</h3>
            <div class="volume-control">
              <label class="volume-label">
                <span class="volume-icon">🔊</span>
                <span>Sound Effects Volume</span>
              </label>
              <div class="volume-slider-container">
                <input type="range" id="sfx-volume" class="volume-slider" min="0" max="100" value="${sfxVolume * 100}">
                <span class="volume-value" id="sfx-value">${Math.round(sfxVolume * 100)}%</span>
              </div>
            </div>
            <div class="volume-control">
              <label class="volume-label">
                <span class="volume-icon">🎵</span>
                <span>Music Volume</span>
              </label>
              <div class="volume-slider-container">
                <input type="range" id="music-volume" class="volume-slider" min="0" max="100" value="${musicVolume * 100}">
                <span class="volume-value" id="music-value">${Math.round(musicVolume * 100)}%</span>
              </div>
            </div>
          </div>
          
          <div class="setting-section">
            <h3>Game Progress</h3>
            <p class="setting-description">Warning: This will delete all your progress including coins, ranks, quantum cores, and upgrades!</p>
            <button class="danger-btn" id="reset-all-progress">🗑️ Reset All Progress</button>
          </div>
        </div>
      </div>
    `;

    this.container.appendChild(overlay);

    // Add event listeners
    const sfxSlider = document.getElementById('sfx-volume') as HTMLInputElement;
    const musicSlider = document.getElementById('music-volume') as HTMLInputElement;
    const sfxValueDisplay = document.getElementById('sfx-value');
    const musicValueDisplay = document.getElementById('music-value');

    sfxSlider?.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value) / 100;
      audioManager.setSFXVolume(value);
      if (sfxValueDisplay) sfxValueDisplay.textContent = `${Math.round(value * 100)}%`;
      // Play a test sound
      audioManager.playSFX(AudioType.SFX_CLICK);
    });

    musicSlider?.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value) / 100;
      audioManager.setMusicVolume(value);
      if (musicValueDisplay) musicValueDisplay.textContent = `${Math.round(value * 100)}%`;
    });

    document.getElementById('reset-all-progress')?.addEventListener('click', () => {
      this.showResetConfirmation(overlay);
    });

    const closeSettings = () => {
      audioManager.playSFX(AudioType.SFX_CLICK);
      document.removeEventListener('keydown', handleEscape);
      overlay.remove();
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeSettings();
      }
    };

    document.getElementById('close-settings')?.addEventListener('click', closeSettings);

    // Close on background click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeSettings();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', handleEscape);
  }

  private showResetConfirmation(settingsOverlay: HTMLElement): void {
    const confirmOverlay = document.createElement('div');
    confirmOverlay.className = 'reset-confirmation-overlay';
    confirmOverlay.innerHTML = `
      <div class="reset-confirmation-panel">
        <h2>⚠️ Reset All Progress?</h2>
        <p class="reset-warning">This action cannot be undone!</p>
        <div class="reset-info">
          <p>All of the following will be permanently deleted:</p>
          <ul>
            <li>💰 Coins and Score</li>
            <li>📊 Rank Progress</li>
            <li>⭐ Meta Currency</li>
            <li>⚛️ Quantum Cores</li>
            <li>🌟 All Skill Tree Upgrades</li>
            <li>⬆️ All Prestige Upgrades</li>
          </ul>
        </div>
        <div class="reset-buttons">
          <button class="reset-btn confirm" id="confirm-reset-all">Yes, Delete Everything</button>
          <button class="reset-btn cancel" id="cancel-reset-all">No, Keep My Progress</button>
        </div>
      </div>
    `;

    this.container.appendChild(confirmOverlay);

    document.getElementById('confirm-reset-all')?.addEventListener('click', () => {
      audioManager.playSFX(AudioType.SFX_UPGRADE);
      gameState.reset();
      confirmOverlay.remove();
      settingsOverlay.remove();
      // Reload the page to show fresh state
      this.render();
      this.setupEventListeners();
    });

    document.getElementById('cancel-reset-all')?.addEventListener('click', () => {
      audioManager.playSFX(AudioType.SFX_CLICK);
      confirmOverlay.remove();
    });
  }

  private showCredits(): void {
    // TODO: Implement credits modal
    alert('Credits:\nGame Design: Based on Criticality by mechabit\nDevelopment: Critical Chain Team');
  }

  destroy(): void {
    // Cleanup if needed
  }
}
