/**
 * Home Page
 * Main menu with Play, Settings, Credits
 */

import { NavigationManager } from '../systems/NavigationManager';
import { audioManager, AudioType } from '../systems/AudioManager';
import { gameState } from '../systems/GameStateManager';

export class HomePage {
  private container: HTMLElement;
  private updateInterval: number | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
    this.setupEventListeners();
    this.startCurrencyUpdate();
  }

  private render(): void {
    const state = gameState.getState();
    
    this.container.innerHTML = `
      <div class="home-page">
        <div class="home-header">
          <div class="meta-currency-display">
            <svg class="icon-radiation" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 12h.01"/>
              <path d="M7.5 4.2c-.3-.5-.9-.7-1.3-.4C3.9 5.5 2.3 8.1 2 11c-.1.5.4 1 1 1h5c0-1.5.8-2.8 2-3.4-1.1-1.9-2-3.5-2.5-4.4z"/>
              <path d="M21 12c.6 0 1-.4 1-1-.3-2.9-1.8-5.5-4.1-7.1-.4-.3-1.1-.2-1.3.3-.6.9-1.5 2.5-2.6 4.3 1.2.7 2 2 2 3.5h5z"/>
              <path d="M7.5 19.8c-.3.5-.1 1.1.4 1.3 2.6 1.2 5.6 1.2 8.2 0 .5-.2.7-.8.4-1.3-.5-.9-1.4-2.5-2.5-4.3-1.2.7-2.8.7-4 0-1.1 1.8-2 3.4-2.5 4.3z"/>
            </svg>
            <span class="meta-amount" id="home-quantum-cores">${state.quantumCores}</span>
            <span class="meta-label">Quantum Cores</span>
          </div>
        </div>

        <div class="home-content">
          <div class="home-hero">
            <h1 class="home-title">Critical Chain</h1>
            <p class="home-subtitle">Nuclear Chain Reaction Simulator</p>
          </div>

          <div class="home-main">
            <div class="home-menu">
              <button class="menu-button primary" id="play-btn">
                <span class="button-icon">▶️</span>
                <span class="button-text">Play</span>
              </button>
              
              <button class="menu-button" id="upgrades-btn">
                <span class="button-icon">⬆️</span>
                <span class="button-text">Skills & Upgrades</span>
              </button>
              
              <button class="menu-button" id="settings-btn">
                <span class="button-icon">⚙️</span>
                <span class="button-text">Settings</span>
              </button>
              
              <button class="menu-button" id="credits-btn">
                <span class="button-icon">ℹ️</span>
                <span class="button-text">Credits</span>
              </button>
            </div>

            <div class="home-stats">
              <div class="stat-card">
                <div class="stat-icon">🏆</div>
                <div class="stat-info">
                  <div class="stat-label">Highest Rank</div>
                  <div class="stat-value">${state.highestRank}</div>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-icon">💥</div>
                <div class="stat-info">
                  <div class="stat-label">Atoms Destroyed</div>
                  <div class="stat-value">${state.totalAtomsDestroyed.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
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
            <li>
            <svg class="icon-radiation" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 12h.01"/>
              <path d="M7.5 4.2c-.3-.5-.9-.7-1.3-.4C3.9 5.5 2.3 8.1 2 11c-.1.5.4 1 1 1h5c0-1.5.8-2.8 2-3.4-1.1-1.9-2-3.5-2.5-4.4z"/>
              <path d="M21 12c.6 0 1-.4 1-1-.3-2.9-1.8-5.5-4.1-7.1-.4-.3-1.1-.2-1.3.3-.6.9-1.5 2.5-2.6 4.3 1.2.7 2 2 2 3.5h5z"/>
              <path d="M7.5 19.8c-.3.5-.1 1.1.4 1.3 2.6 1.2 5.6 1.2 8.2 0 .5-.2.7-.8.4-1.3-.5-.9-1.4-2.5-2.5-4.3-1.2.7-2.8.7-4 0-1.1 1.8-2 3.4-2.5 4.3z"/>
            </svg> Meta Currency</li>
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
    // Create credits overlay
    const overlay = document.createElement('div');
    overlay.className = 'credits-overlay';
    overlay.innerHTML = `
      <div class="credits-panel">
        <button class="close-btn" id="close-credits">✕</button>
        
        <div class="credits-particles">
          <div class="particle"></div>
          <div class="particle"></div>
          <div class="particle"></div>
          <div class="particle"></div>
          <div class="particle"></div>
        </div>
        
        <div class="credits-header">
          <div class="credits-icon-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="credits-icon">
              <path d="M12 12h.01"/>
              <path d="M7.5 4.2c-.3-.5-.9-.7-1.3-.4C3.9 5.5 2.3 8.1 2 11c-.1.5.4 1 1 1h5c0-1.5.8-2.8 2-3.4-1.1-1.9-2-3.5-2.5-4.4z"/>
              <path d="M21 12c.6 0 1-.4 1-1-.3-2.9-1.8-5.5-4.1-7.1-.4-.3-1.1-.2-1.3.3-.6.9-1.5 2.5-2.6 4.3 1.2.7 2 2 2 3.5h5z"/>
              <path d="M7.5 19.8c-.3.5-.1 1.1.4 1.3 2.6 1.2 5.6 1.2 8.2 0 .5-.2.7-.8.4-1.3-.5-.9-1.4-2.5-2.5-4.3-1.2.7-2.8.7-4 0-1.1 1.8-2 3.4-2.5 4.3z"/>
            </svg>
            <div class="icon-glow"></div>
          </div>
          <h2 class="credits-title">Critical Chain</h2>
          <p class="credits-subtitle">⚡ Nuclear Chain Reaction Simulator ⚡</p>
        </div>
        
        <div class="credits-content">
          <div class="credits-row">
            <div class="credits-section slide-in" style="animation-delay: 0.1s">
              <div class="section-icon">🎮</div>
              <div class="section-content">
                <h3>Game Design</h3>
                <p>Critical Chain Team</p>
              </div>
            </div>
            
            <div class="credits-section slide-in" style="animation-delay: 0.2s">
              <div class="section-icon music-icon" id="music-sound-icon">🎵</div>
              <div class="section-content">
                <h3>Sound Design</h3>
                <p>Audio by <a href="https://pixabay.com/users/virtual_vibes-51361309/" class="credits-link">Dilip</a> from  <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=379990/" class="credits-link">Pixabay</a></p>
                <p class="sound-hint">💡 Click the icon to hear!</p>
              </div>
            </div>
          </div>
          
          <div class="credits-section slide-in full-width" style="animation-delay: 0.3s">
            <div class="section-icon">🔧</div>
            <div class="section-content">
              <h3>Built With</h3>
              <div class="tech-list">
                <span class="tech-badge"> TypeScript</span>
                <span class="tech-badge"> HTML5 Canvas</span>
                <span class="tech-badge"> Web Audio API</span>
                <span class="tech-badge"> Vite</span>
                <span class="tech-badge"> Lucide Icons</span>
              </div>
            </div>
          </div>
          
          <div class="credits-section slide-in full-width" style="animation-delay: 0.4s">
            <div class="section-icon">💝</div>
            <div class="section-content">
              <h3>Special Thanks</h3>
              <p>To all players and testers who helped shape this game! Your feedback made this possible. 🙏</p>
            </div>
          </div>
        </div>
        
        <div class="credits-footer">
          <div class="footer-divider"></div>
          <p class="version-badge"> Version 1.0.0 </p>
          <p class="credits-copyright">Made with 💚 by Critical Chain Team © 2025</p>
        </div>
      </div>
    `;

    this.container.appendChild(overlay);

    const closeCredits = () => {
      audioManager.playSFX(AudioType.SFX_CLICK);
      document.removeEventListener('keydown', handleEscape);
      overlay.remove();
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeCredits();
      }
    };

    document.getElementById('close-credits')?.addEventListener('click', closeCredits);

    // Add click handler for music icon to play thud sound
    const musicIcon = document.getElementById('music-sound-icon');
    musicIcon?.addEventListener('click', () => {
      audioManager.playSFX(AudioType.SFX_ATOM_BREAK);
    });

    // Close on background click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeCredits();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', handleEscape);
  }

  private startCurrencyUpdate(): void {
    // Update quantum cores display every 500ms
    this.updateInterval = window.setInterval(() => {
      const state = gameState.getState();
      const coresEl = document.getElementById('home-quantum-cores');
      if (coresEl) {
        coresEl.textContent = state.quantumCores.toString();
      }
    }, 500);
  }

  destroy(): void {
    // Clear the update interval
    if (this.updateInterval !== null) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}
