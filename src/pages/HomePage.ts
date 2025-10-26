/**
 * Home Page
 * Main menu with Play, Settings, Credits
 */

import { NavigationManager } from '../systems/NavigationManager';
import { audioManager, AudioType } from '../systems/AudioManager';
import { gameState } from '../systems/GameStateManager';
import { DebugConfig } from '../config/GameConfig';
import { SkillTreePage } from './SkillTreePage';

export class HomePage {
  private container: HTMLElement;
  private updateInterval: number | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
    this.setupEventListeners();
    this.startCurrencyUpdate();
    
    // Start background music
    audioManager.preloadAudio(AudioType.HOME_MUSIC_BG).then(() => {
      audioManager.playMusic(AudioType.HOME_MUSIC_BG);
    });
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
              
              ${DebugConfig.testMode ? `
              <button class="menu-button dev-button" id="dev-skilltree-btn" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: 2px solid #a78bfa;">
                <span class="button-icon">🔧</span>
                <span class="button-text">DEV: Full Skill Tree</span>
              </button>
              ` : ''}
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
        audioManager.playSFX(AudioType.HOME_UI_SELECT);
        // Start fresh run - reset coins, rank, and skill tree (keep quantum cores and prestige upgrades)
        gameState.startFreshRun();
        NavigationManager.navigateTo('game');
      });
    }

    if (upgradesBtn) {
      upgradesBtn.addEventListener('click', () => {
        audioManager.playSFX(AudioType.HOME_UI_SELECT);
        NavigationManager.navigateTo('upgrades');
      });
    }

    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        audioManager.playSFX(AudioType.HOME_UI_SELECT);
        this.showSettings();
      });
    }

    if (creditsBtn) {
      creditsBtn.addEventListener('click', () => {
        audioManager.playSFX(AudioType.HOME_UI_SELECT);
        this.showCredits();
      });
    }

    // Only add dev button listener if testMode is enabled
    if (DebugConfig.testMode) {
      const devSkillTreeBtn = document.getElementById('dev-skilltree-btn');
      if (devSkillTreeBtn) {
        devSkillTreeBtn.addEventListener('click', () => {
          audioManager.playSFX(AudioType.HOME_UI_SELECT);
          // Set dev mode flag before navigating
          SkillTreePage.setDevMode(true);
          NavigationManager.navigateTo('skilltree');
        });
      }
    }
  }

  private showSettings(): void {
    const sfxVolume = audioManager.getSFXVolume();
    const musicVolume = audioManager.getMusicVolume();
    
    // Get individual volumes for each sound
    const volumeClick = audioManager.getVolume(AudioType.SFX_CLICK);
    const volumeReaction = audioManager.getVolume(AudioType.SFX_REACTION);
    const volumeUpgrade = audioManager.getVolume(AudioType.SFX_UPGRADE);
    const volumeAtomBreak = audioManager.getVolume(AudioType.SFX_ATOM_BREAK);
    const volumeHomeUI = audioManager.getVolume(AudioType.HOME_UI_SELECT);
    const volumeSkillPurchase = audioManager.getVolume(AudioType.SKILLTREE_PURCHASE);
    const volumeSkillHover = audioManager.getVolume(AudioType.SKILLTREE_HOVER);
    const volumeMusicIdle = audioManager.getVolume(AudioType.MUSIC_IDLE);
    const volumeMusicReaction = audioManager.getVolume(AudioType.MUSIC_REACTION);
    const volumeHomeBG = audioManager.getVolume(AudioType.HOME_MUSIC_BG);
    
    // Create settings overlay
    const overlay = document.createElement('div');
    overlay.className = 'settings-overlay';
    overlay.innerHTML = `
      <div class="settings-panel settings-panel-wide">
        <button class="close-btn" id="close-settings">✕</button>
        <h2>⚙️ Settings</h2>
        <div class="settings-content">
          <div class="setting-section">
            <h3>🔊 Sound Effects Volume</h3>
            <div class="volume-grid">
              <div class="volume-control">
                <label class="volume-label">
                  <span class="volume-icon">�️</span>
                  <span>UI Click</span>
                </label>
                <div class="volume-slider-container">
                  <input type="range" id="vol-click" class="volume-slider" min="0" max="100" value="${volumeClick * 100}" data-type="${AudioType.SFX_CLICK}">
                  <span class="volume-value" id="val-click">${Math.round(volumeClick * 100)}%</span>
                </div>
              </div>
              
              <div class="volume-control">
                <label class="volume-label">
                  <span class="volume-icon">⚛️</span>
                  <span>Reaction Trigger</span>
                </label>
                <div class="volume-slider-container">
                  <input type="range" id="vol-reaction" class="volume-slider" min="0" max="100" value="${volumeReaction * 100}" data-type="${AudioType.SFX_REACTION}">
                  <span class="volume-value" id="val-reaction">${Math.round(volumeReaction * 100)}%</span>
                </div>
              </div>
              
              <div class="volume-control">
                <label class="volume-label">
                  <span class="volume-icon">⬆️</span>
                  <span>Upgrade Unlock</span>
                </label>
                <div class="volume-slider-container">
                  <input type="range" id="vol-upgrade" class="volume-slider" min="0" max="100" value="${volumeUpgrade * 100}" data-type="${AudioType.SFX_UPGRADE}">
                  <span class="volume-value" id="val-upgrade">${Math.round(volumeUpgrade * 100)}%</span>
                </div>
              </div>
              
              <div class="volume-control">
                <label class="volume-label">
                  <span class="volume-icon">💥</span>
                  <span>Atom Break</span>
                </label>
                <div class="volume-slider-container">
                  <input type="range" id="vol-atom-break" class="volume-slider" min="0" max="100" value="${volumeAtomBreak * 100}" data-type="${AudioType.SFX_ATOM_BREAK}">
                  <span class="volume-value" id="val-atom-break">${Math.round(volumeAtomBreak * 100)}%</span>
                </div>
              </div>
              
              <div class="volume-control">
                <label class="volume-label">
                  <span class="volume-icon">�</span>
                  <span>Home UI Select</span>
                </label>
                <div class="volume-slider-container">
                  <input type="range" id="vol-home-ui" class="volume-slider" min="0" max="100" value="${volumeHomeUI * 100}" data-type="${AudioType.HOME_UI_SELECT}">
                  <span class="volume-value" id="val-home-ui">${Math.round(volumeHomeUI * 100)}%</span>
                </div>
              </div>
              
              <div class="volume-control">
                <label class="volume-label">
                  <span class="volume-icon">💰</span>
                  <span>Skill Purchase</span>
                </label>
                <div class="volume-slider-container">
                  <input type="range" id="vol-skill-purchase" class="volume-slider" min="0" max="100" value="${volumeSkillPurchase * 100}" data-type="${AudioType.SKILLTREE_PURCHASE}">
                  <span class="volume-value" id="val-skill-purchase">${Math.round(volumeSkillPurchase * 100)}%</span>
                </div>
              </div>
              
              <div class="volume-control">
                <label class="volume-label">
                  <span class="volume-icon">👆</span>
                  <span>Skill Hover</span>
                </label>
                <div class="volume-slider-container">
                  <input type="range" id="vol-skill-hover" class="volume-slider" min="0" max="100" value="${volumeSkillHover * 100}" data-type="${AudioType.SKILLTREE_HOVER}">
                  <span class="volume-value" id="val-skill-hover">${Math.round(volumeSkillHover * 100)}%</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="setting-section">
            <h3>🎵 Music Volume</h3>
            <div class="volume-grid">
              <div class="volume-control">
                <label class="volume-label">
                  <span class="volume-icon">🏠</span>
                  <span>Home Background</span>
                </label>
                <div class="volume-slider-container">
                  <input type="range" id="vol-home-bg" class="volume-slider" min="0" max="100" value="${volumeHomeBG * 100}" data-type="${AudioType.HOME_MUSIC_BG}">
                  <span class="volume-value" id="val-home-bg">${Math.round(volumeHomeBG * 100)}%</span>
                </div>
              </div>
              
              <div class="volume-control">
                <label class="volume-label">
                  <span class="volume-icon">🎮</span>
                  <span>Idle Music</span>
                </label>
                <div class="volume-slider-container">
                  <input type="range" id="vol-music-idle" class="volume-slider" min="0" max="100" value="${volumeMusicIdle * 100}" data-type="${AudioType.MUSIC_IDLE}">
                  <span class="volume-value" id="val-music-idle">${Math.round(volumeMusicIdle * 100)}%</span>
                </div>
              </div>
              
              <div class="volume-control">
                <label class="volume-label">
                  <span class="volume-icon">⚡</span>
                  <span>Reaction Music</span>
                </label>
                <div class="volume-slider-container">
                  <input type="range" id="vol-music-reaction" class="volume-slider" min="0" max="100" value="${volumeMusicReaction * 100}" data-type="${AudioType.MUSIC_REACTION}">
                  <span class="volume-value" id="val-music-reaction">${Math.round(volumeMusicReaction * 100)}%</span>
                </div>
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

    // Add event listeners for all volume sliders
    const volumeSliders = overlay.querySelectorAll('.volume-slider');
    volumeSliders.forEach((slider) => {
      const inputSlider = slider as HTMLInputElement;
      const audioType = inputSlider.getAttribute('data-type') as AudioType;
      const sliderId = inputSlider.id;
      const valueDisplayId = sliderId.replace('vol-', 'val-');
      const valueDisplay = document.getElementById(valueDisplayId);
      
      inputSlider.addEventListener('input', (e) => {
        const value = parseInt((e.target as HTMLInputElement).value) / 100;
        audioManager.setVolume(audioType, value);
        if (valueDisplay) valueDisplay.textContent = `${Math.round(value * 100)}%`;
        
        // Play a preview sound for SFX types
        if (audioType !== AudioType.HOME_MUSIC_BG && 
            audioType !== AudioType.MUSIC_IDLE && 
            audioType !== AudioType.MUSIC_REACTION) {
          audioManager.preloadAudio(audioType).then(() => {
            audioManager.playSFX(audioType);
          });
        }
      });
    });

    document.getElementById('reset-all-progress')?.addEventListener('click', () => {
      this.showResetConfirmation(overlay);
    });

    const closeSettings = () => {
      audioManager.playSFX(AudioType.HOME_UI_SELECT);
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
      audioManager.playSFX(AudioType.HOME_UI_SELECT);
      gameState.reset();
      confirmOverlay.remove();
      settingsOverlay.remove();
      // Reload the page to show fresh state
      this.render();
      this.setupEventListeners();
    });

    document.getElementById('cancel-reset-all')?.addEventListener('click', () => {
      audioManager.playSFX(AudioType.HOME_UI_SELECT);
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
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="credits-icon">
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
              <div class="section-icon music-icon">🎵</div>
              <div class="section-content">
                <h3>Sound Design</h3>
                <p><strong>Impact Sound:</strong> <a href="https://pixabay.com/users/virtual_vibes-51361309/" class="credits-link">Dilip</a> from <a href="https://pixabay.com/" class="credits-link">Pixabay</a> <button class="play-sound-btn" id="play-impact">▶️</button></p>
                <p><strong>Home UI Sound:</strong> <a href="https://pixabay.com/users/freesound_community-46691455/" class="credits-link">freesound_community</a> from <a href="https://pixabay.com/sound-effects/" class="credits-link">Pixabay</a> <button class="play-sound-btn" id="play-home-ui">▶️</button></p>
                <p><strong>Skill Tree Upgrade:</strong> <a href="https://pixabay.com/users/soundreality-31074404/" class="credits-link">Jurij</a> from <a href="https://pixabay.com/sound-effects/" class="credits-link">Pixabay</a> <button class="play-sound-btn" id="play-skilltree-upgrade">▶️</button></p>
                <p><strong>Skill Tree Hover:</strong> <a href="https://pixabay.com/users/irinairinafomicheva-25140203/" class="credits-link">irinairinafomicheva</a> from <a href="https://pixabay.com/sound-effects/" class="credits-link">Pixabay</a> <button class="play-sound-btn" id="play-skilltree-hover">▶️</button></p>
                <p><strong>UI Click Sound:</strong> <a href="https://pixabay.com/users/dragon-studio-38165424/" class="credits-link">DRAGON-STUDIO</a> from <a href="https://pixabay.com/" class="credits-link">Pixabay</a> <button class="play-sound-btn" id="play-click">▶️</button></p>
                <p><strong>Reaction Sound:</strong> <a href="https://pixabay.com/users/blendertimer-9538909/" class="credits-link">Daniel Roberts</a> from <a href="https://pixabay.com/sound-effects/" class="credits-link">Pixabay</a> <button class="play-sound-btn" id="play-reaction">▶️</button></p>
                <p><strong>Upgrade Unlock Sound:</strong> <a href="https://pixabay.com/users/abhicreates-21479734/" class="credits-link">Abhishek Vishwakarma</a> from <a href="https://pixabay.com/" class="credits-link">Pixabay</a> <button class="play-sound-btn" id="play-upgrade-unlock">▶️</button></p>
                <p><strong>Idle Music:</strong> <a href="https://pixabay.com/users/electronic-senses-18259555/" class="credits-link">Joel palahi gallego</a> from <a href="https://pixabay.com/music/" class="credits-link">Pixabay</a> <button class="play-sound-btn" id="play-idle-music">▶️</button></p>
                <p><strong>Reaction Music:</strong> <a href="https://pixabay.com/users/freesound_community-46691455/" class="credits-link">freesound_community</a> from <a href="https://pixabay.com/" class="credits-link">Pixabay</a> <button class="play-sound-btn" id="play-reaction-music">▶️</button></p>
                <p><strong>Home Background Music:</strong> Kevin MacLeod via <a href="https://freepd.com/electronic.php" class="credits-link">FreePD</a></p>
                <p class="sound-hint">💡 Click the play buttons to preview each sound!</p>
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
      audioManager.playSFX(AudioType.HOME_UI_SELECT);
      document.removeEventListener('keydown', handleEscape);
      overlay.remove();
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeCredits();
      }
    };

    // Add escape key listener
    document.addEventListener('keydown', handleEscape);

    // Add close button click listener
    document.getElementById('close-credits')?.addEventListener('click', closeCredits);

    // Close on overlay click (outside the panel)
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeCredits();
      }
    });

    // Add click handlers for sound preview buttons
    document.getElementById('play-impact')?.addEventListener('click', (e) => {
      e.stopPropagation();
      audioManager.preloadAudio(AudioType.SFX_ATOM_BREAK).then(() => {
        audioManager.playSFX(AudioType.SFX_ATOM_BREAK);
      });
    });

    document.getElementById('play-home-ui')?.addEventListener('click', (e) => {
      e.stopPropagation();
      audioManager.preloadAudio(AudioType.HOME_UI_SELECT).then(() => {
        audioManager.playSFX(AudioType.HOME_UI_SELECT);
      });
    });

    document.getElementById('play-skilltree-upgrade')?.addEventListener('click', (e) => {
      e.stopPropagation();
      audioManager.preloadAudio(AudioType.SKILLTREE_PURCHASE).then(() => {
        audioManager.playSFX(AudioType.SKILLTREE_PURCHASE);
      });
    });

    document.getElementById('play-skilltree-hover')?.addEventListener('click', (e) => {
      e.stopPropagation();
      audioManager.preloadAudio(AudioType.SKILLTREE_HOVER).then(() => {
        audioManager.playSFX(AudioType.SKILLTREE_HOVER);
      });
    });

    document.getElementById('play-click')?.addEventListener('click', (e) => {
      e.stopPropagation();
      audioManager.preloadAudio(AudioType.SFX_CLICK).then(() => {
        audioManager.playSFX(AudioType.SFX_CLICK);
      });
    });

    document.getElementById('play-reaction')?.addEventListener('click', (e) => {
      e.stopPropagation();
      audioManager.preloadAudio(AudioType.SFX_REACTION).then(() => {
        audioManager.playSFX(AudioType.SFX_REACTION);
      });
    });

    document.getElementById('play-upgrade-unlock')?.addEventListener('click', (e) => {
      e.stopPropagation();
      audioManager.preloadAudio(AudioType.SFX_UPGRADE).then(() => {
        audioManager.playSFX(AudioType.SFX_UPGRADE);
      });
    });

    document.getElementById('play-idle-music')?.addEventListener('click', (e) => {
      e.stopPropagation();
      audioManager.preloadAudio(AudioType.MUSIC_IDLE).then(() => {
        audioManager.playSFX(AudioType.MUSIC_IDLE);
      });
    });

    document.getElementById('play-reaction-music')?.addEventListener('click', (e) => {
      e.stopPropagation();
      audioManager.preloadAudio(AudioType.MUSIC_REACTION).then(() => {
        audioManager.playSFX(AudioType.MUSIC_REACTION);
      });
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
    
    // Stop background music
    audioManager.stopMusic();
  }
}
