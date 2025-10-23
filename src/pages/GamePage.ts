/**
 * Game Page
 * Main gameplay with canvas and HUD
 */

import { NavigationManager } from '../systems/NavigationManager';
import { gameState } from '../systems/GameStateManager';
import { ReactionVisualizer } from '../systems/ReactionVisualizer';
import { audioManager, AudioType } from '../systems/AudioManager';

export class GamePage {
  private container: HTMLElement;
  private visualizer: ReactionVisualizer | null = null;
  private updateInterval: number = 0;
  private gameOverShown: boolean = false;
  private isPaused: boolean = false;
  private pausedTimeRemaining: number = 0;
  private escapeKeyHandler: ((e: KeyboardEvent) => void) | null = null;
  private gameStarted: boolean = false;
  private playerHasInteracted: boolean = false;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
    this.setupEventListeners();
    this.initializeGame();
    this.setupKeyboardListeners();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="game-page">
        <div class="game-canvas-wrapper">
          <canvas id="game-canvas" class="game-canvas"></canvas>
          
          <!-- Floating HUD Elements -->
          <div class="game-overlay">
            <!-- Top Left: Resources -->
            <div class="hud-panel top-left">
              <div class="hud-item">
                <span class="hud-icon">💰</span>
                <div class="hud-info">
                  <span class="hud-label">Coins</span>
                  <span class="hud-value" id="coins-value">0</span>
                </div>
              </div>
              <div class="hud-item">
                <span class="hud-icon">⚡</span>
                <div class="hud-info">
                  <span class="hud-label">Chain</span>
                  <span class="hud-value chain-value" id="chain-value">×0</span>
                </div>
              </div>
            </div>

            <!-- Top Center: Time -->
            <div class="hud-panel top-center">
              <span class="hud-icon">⏱️</span>
              <span class="hud-value time-value" id="time-value">10s</span>
            </div>

            <!-- Top Right: Clicks & Back -->
            <div class="hud-panel top-right">
              <div class="hud-item">
                <span class="hud-icon">👆</span>
                <div class="hud-info">
                  <span class="hud-label">Clicks Left</span>
                  <span class="hud-value" id="clicks-value">2</span>
                </div>
              </div>
              <button class="hud-btn back-btn" id="back-btn" title="Back to Menu">
                🏠
              </button>
            </div>

            <!-- Bottom: Rank Progress -->
            <div class="hud-panel bottom-center">
              <div class="rank-display">
                <div class="rank-header">
                  <span class="rank-title" id="rank-label">Rank 0</span>
                  <span class="rank-score" id="rank-score">0 / 100</span>
                </div>
                <div class="rank-bar">
                  <div class="rank-bar-fill" id="rank-progress"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private setupEventListeners(): void {
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        audioManager.playSFX(AudioType.SFX_CLICK);
        this.showReturnConfirmation();
      });
    }
  }

  private setupKeyboardListeners(): void {
    this.escapeKeyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (!this.isPaused) {
          this.pauseGame();
          this.showPauseMenu();
        }
      }
    };
    window.addEventListener('keydown', this.escapeKeyHandler);
  }

  private pauseGame(): void {
    this.isPaused = true;
    // Don't modify game state, just set pause flag
    console.log('[GamePage] Game paused');
  }

  private resumeGame(): void {
    this.isPaused = false;
    console.log('[GamePage] Game resumed');
  }

  private showReturnConfirmation(): void {
    const state = gameState.getState();
    const metaEarned = state.rank; // Meta currency = rank level
    
    // Create confirmation overlay
    const overlay = document.createElement('div');
    overlay.className = 'reset-confirmation-overlay';
    overlay.innerHTML = `
      <div class="reset-confirmation-panel">
        <h2>⚠️ Return to Menu?</h2>
        <p class="reset-warning">All skill tree progress and coins will be reset!</p>
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
            <span class="meta-label">Meta Currency Reward</span>
            <span class="meta-value">
              +${metaEarned}
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; margin-left: 4px;">
                <path d="M12 12h.01"/>
                <path d="M7.5 4.2c-.3-.5-.9-.7-1.3-.4C3.9 5.5 2.3 8.1 2 11c-.1.5.4 1 1 1h5c0-1.5.8-2.8 2-3.4-1.1-1.9-2-3.5-2.5-4.4z"/>
                <path d="M21 12c.6 0 1-.4 1-1-.3-2.9-1.8-5.5-4.1-7.1-.4-.3-1.1-.2-1.3.3-.6.9-1.5 2.5-2.6 4.3 1.2.7 2 2 2 3.5h5z"/>
                <path d="M7.5 19.8c-.3.5-.1 1.1.4 1.3 2.6 1.2 5.6 1.2 8.2 0 .5-.2.7-.8.4-1.3-.5-.9-1.4-2.5-2.5-4.3-1.2.7-2.8.7-4 0-1.1 1.8-2 3.4-2.5 4.3z"/>
              </svg>
            </span>
            <span class="meta-hint">Based on Rank ${state.rank}</span>
          </div>
        </div>
        <div class="reset-buttons">
          <button class="reset-btn confirm" id="confirm-reset">Yes, Reset</button>
          <button class="reset-btn cancel" id="cancel-reset">No, Continue</button>
        </div>
      </div>
    `;

    this.container.appendChild(overlay);

    // Add event listeners
    document.getElementById('confirm-reset')?.addEventListener('click', async () => {
      audioManager.playSFX(AudioType.SFX_CLICK);
      const earned = await gameState.resetRun();
      overlay.remove();
      NavigationManager.navigateTo('home');
    });

    document.getElementById('cancel-reset')?.addEventListener('click', () => {
      audioManager.playSFX(AudioType.SFX_CLICK);
      overlay.remove();
    });
  }

  private showPauseMenu(): void {
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
    
    // Create pause overlay
    const overlay = document.createElement('div');
    overlay.className = 'settings-overlay';
    overlay.innerHTML = `
      <div class="settings-panel settings-panel-wide">
        <button class="close-btn" id="resume-game">✕</button>
        <h2>⏸️ Game Paused</h2>
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
                  <input type="range" id="vol-click-pause" class="volume-slider" min="0" max="100" value="${volumeClick * 100}" data-type="${AudioType.SFX_CLICK}">
                  <span class="volume-value" id="val-click-pause">${Math.round(volumeClick * 100)}%</span>
                </div>
              </div>
              
              <div class="volume-control">
                <label class="volume-label">
                  <span class="volume-icon">⚛️</span>
                  <span>Reaction Trigger</span>
                </label>
                <div class="volume-slider-container">
                  <input type="range" id="vol-reaction-pause" class="volume-slider" min="0" max="100" value="${volumeReaction * 100}" data-type="${AudioType.SFX_REACTION}">
                  <span class="volume-value" id="val-reaction-pause">${Math.round(volumeReaction * 100)}%</span>
                </div>
              </div>
              
              <div class="volume-control">
                <label class="volume-label">
                  <span class="volume-icon">⬆️</span>
                  <span>Upgrade Unlock</span>
                </label>
                <div class="volume-slider-container">
                  <input type="range" id="vol-upgrade-pause" class="volume-slider" min="0" max="100" value="${volumeUpgrade * 100}" data-type="${AudioType.SFX_UPGRADE}">
                  <span class="volume-value" id="val-upgrade-pause">${Math.round(volumeUpgrade * 100)}%</span>
                </div>
              </div>
              
              <div class="volume-control">
                <label class="volume-label">
                  <span class="volume-icon">💥</span>
                  <span>Atom Break</span>
                </label>
                <div class="volume-slider-container">
                  <input type="range" id="vol-atom-break-pause" class="volume-slider" min="0" max="100" value="${volumeAtomBreak * 100}" data-type="${AudioType.SFX_ATOM_BREAK}">
                  <span class="volume-value" id="val-atom-break-pause">${Math.round(volumeAtomBreak * 100)}%</span>
                </div>
              </div>
              
              <div class="volume-control">
                <label class="volume-label">
                  <span class="volume-icon">�</span>
                  <span>Home UI Select</span>
                </label>
                <div class="volume-slider-container">
                  <input type="range" id="vol-home-ui-pause" class="volume-slider" min="0" max="100" value="${volumeHomeUI * 100}" data-type="${AudioType.HOME_UI_SELECT}">
                  <span class="volume-value" id="val-home-ui-pause">${Math.round(volumeHomeUI * 100)}%</span>
                </div>
              </div>
              
              <div class="volume-control">
                <label class="volume-label">
                  <span class="volume-icon">💰</span>
                  <span>Skill Purchase</span>
                </label>
                <div class="volume-slider-container">
                  <input type="range" id="vol-skill-purchase-pause" class="volume-slider" min="0" max="100" value="${volumeSkillPurchase * 100}" data-type="${AudioType.SKILLTREE_PURCHASE}">
                  <span class="volume-value" id="val-skill-purchase-pause">${Math.round(volumeSkillPurchase * 100)}%</span>
                </div>
              </div>
              
              <div class="volume-control">
                <label class="volume-label">
                  <span class="volume-icon">👆</span>
                  <span>Skill Hover</span>
                </label>
                <div class="volume-slider-container">
                  <input type="range" id="vol-skill-hover-pause" class="volume-slider" min="0" max="100" value="${volumeSkillHover * 100}" data-type="${AudioType.SKILLTREE_HOVER}">
                  <span class="volume-value" id="val-skill-hover-pause">${Math.round(volumeSkillHover * 100)}%</span>
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
                  <input type="range" id="vol-home-bg-pause" class="volume-slider" min="0" max="100" value="${volumeHomeBG * 100}" data-type="${AudioType.HOME_MUSIC_BG}">
                  <span class="volume-value" id="val-home-bg-pause">${Math.round(volumeHomeBG * 100)}%</span>
                </div>
              </div>
              
              <div class="volume-control">
                <label class="volume-label">
                  <span class="volume-icon">🎮</span>
                  <span>Idle Music</span>
                </label>
                <div class="volume-slider-container">
                  <input type="range" id="vol-music-idle-pause" class="volume-slider" min="0" max="100" value="${volumeMusicIdle * 100}" data-type="${AudioType.MUSIC_IDLE}">
                  <span class="volume-value" id="val-music-idle-pause">${Math.round(volumeMusicIdle * 100)}%</span>
                </div>
              </div>
              
              <div class="volume-control">
                <label class="volume-label">
                  <span class="volume-icon">⚡</span>
                  <span>Reaction Music</span>
                </label>
                <div class="volume-slider-container">
                  <input type="range" id="vol-music-reaction-pause" class="volume-slider" min="0" max="100" value="${volumeMusicReaction * 100}" data-type="${AudioType.MUSIC_REACTION}">
                  <span class="volume-value" id="val-music-reaction-pause">${Math.round(volumeMusicReaction * 100)}%</span>
                </div>
              </div>
            </div>
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

    const resumeGameHandler = () => {
      audioManager.playSFX(AudioType.SFX_CLICK);
      this.resumeGame();
      document.removeEventListener('keydown', handleEscape);
      overlay.remove();
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        resumeGameHandler();
      }
    };

    document.getElementById('resume-game')?.addEventListener('click', resumeGameHandler);

    // Close on background click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        resumeGameHandler();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', handleEscape);
  }

  private initializeGame(): void {
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (canvas) {
      this.visualizer = new ReactionVisualizer(canvas);
    }

    // Start the game session
    gameState.startGame();
    
    // Mark game as started after initialization completes
    // Wait longer to ensure atoms have spawned and game is fully ready
    setTimeout(() => {
      this.gameStarted = true;
    }, 1000);

    // Start update loop (20 FPS for HUD updates)
    this.updateInterval = window.setInterval(() => {
      this.updateHUD();
      this.updateTimer();
    }, 50);
  }

  private updateTimer(): void {
    // Don't update time if paused
    if (this.isPaused) return;
    
    // Update time by 0.05 seconds (50ms)
    gameState.updateTime(0.05);
  }

  private updateHUD(): void {
    const state = gameState.getState();
    if (!state) return;

    // Track player interaction (if clicks have decreased, player has clicked)
    if (!this.playerHasInteracted && state.clicks < state.maxClicks) {
      this.playerHasInteracted = true;
      console.log('[GamePage] Player interaction detected');
    }

    // Check if game ended (only show once, not while paused, and only after game has actually started)
    // Game is ended by ReactionVisualizer when time runs out OR (clicks are 0 AND no neutrons remain)
    // Also require that player has interacted OR time has actually decreased
    const gameHasProgressed = this.playerHasInteracted || state.timeRemaining < state.maxTime;
    
    if (this.gameStarted && gameHasProgressed && !this.isPaused && !state.gameActive && !this.gameOverShown) {
      this.gameOverShown = true;
      this.showGameOver();
    }

    // Update coins (show only THIS round's coins during gameplay)
    const coinsValue = document.getElementById('coins-value');
    if (coinsValue) {
      coinsValue.textContent = state.coinsThisRound.toString();
    }

    // Update chain (show current active chain)
    const chainValue = document.getElementById('chain-value');
    if (chainValue) {
      chainValue.textContent = `×${state.currentChain}`;
      if (state.currentChain > 5) {
        chainValue.classList.add('pulse');
      } else {
        chainValue.classList.remove('pulse');
      }
    }

    // Update time remaining
    const timeValue = document.getElementById('time-value');
    if (timeValue) {
      const seconds = Math.max(0, Math.ceil(state.timeRemaining));
      timeValue.textContent = `${seconds}s`;
      
      // Change color based on time remaining
      if (seconds <= 3) {
        timeValue.style.color = 'var(--danger)';
        timeValue.classList.add('pulse');
      } else if (seconds <= 5) {
        timeValue.style.color = 'var(--warning)';
        timeValue.classList.remove('pulse');
      } else {
        timeValue.style.color = 'var(--text-primary)';
        timeValue.classList.remove('pulse');
      }
    }

    // Update clicks
    const clicksValue = document.getElementById('clicks-value');
    if (clicksValue) {
      clicksValue.textContent = `${state.clicks}`;
      
      // Change color based on clicks remaining
      if (state.clicks === 0) {
        clicksValue.style.color = 'var(--danger)';
      } else if (state.clicks === 1) {
        clicksValue.style.color = 'var(--warning)';
      } else {
        clicksValue.style.color = 'var(--primary)';
      }
    }

    // Update rank
    const rankLabel = document.getElementById('rank-label');
    const rankProgress = document.getElementById('rank-progress');
    const rankScore = document.getElementById('rank-score');

    if (rankLabel) {
      rankLabel.textContent = `Rank ${state.rank}`;
    }

    if (rankProgress) {
      const progress = gameState.getRankProgress();
      rankProgress.style.width = `${progress * 100}%`;
    }

    if (rankScore) {
      const next = gameState.getNextRankThreshold();
      rankScore.textContent = `${state.score} / ${next}`;
    }
  }

  private showGameOver(): void {
    // Show game over overlay
    const overlay = document.createElement('div');
    overlay.className = 'game-over-overlay';
    const state = gameState.getState();
    const baseCoins = state.coinsThisRound ?? 0; // Show only THIS round's coins
    const maxChain = state.maxChain ?? 0;
    const rank = state.rank ?? 0;
    const reason = state.clicks <= 0 ? 'Out of Clicks!' : 'Time\'s Up!';
    
    // Apply chain multiplier to display final coins for THIS round
    const finalCoins = maxChain > 0 ? Math.floor(baseCoins * maxChain) : baseCoins;
    
    overlay.innerHTML = `
      <div class="game-over-panel">
        <h2>⏱️ ${reason}</h2>
        <div class="game-over-stats">
          <div class="stat-item">
            <span class="stat-label">Coins Earned</span>
            <span class="stat-value">💰 ${finalCoins}${maxChain > 1 ? ` (${baseCoins} × ${maxChain})` : ''}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Max Chain</span>
            <span class="stat-value">⚡ ×${maxChain}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Rank</span>
            <span class="stat-value">🏆 ${rank}</span>
          </div>
        </div>
        <div class="game-over-buttons">
          <button class="game-over-btn primary" id="play-again-btn">🔄 Play Again</button>
          <button class="game-over-btn secondary" id="skill-tree-btn">🌟 Skill Tree</button>
        </div>
      </div>
    `;

    this.container.appendChild(overlay);

    // Add event listeners for buttons
    document.getElementById('play-again-btn')?.addEventListener('click', () => {
      audioManager.playSFX(AudioType.SFX_CLICK);
      overlay.remove();
      // Reset game state and restart
      this.gameOverShown = false;
      this.gameStarted = false;
      this.playerHasInteracted = false;
      
      // Reset visualizer to clear atoms and neutrons
      if (this.visualizer) {
        this.visualizer.reset();
      }
      
      gameState.startGame();
      // Re-enable game started flag after initialization
      setTimeout(() => {
        this.gameStarted = true;
      }, 1000);
    });

    document.getElementById('skill-tree-btn')?.addEventListener('click', () => {
      audioManager.playSFX(AudioType.SFX_CLICK);
      overlay.remove();
      NavigationManager.navigateTo('skilltree');
    });
  }

  destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    if (this.visualizer) {
      this.visualizer.reset();
    }
    if (this.escapeKeyHandler) {
      window.removeEventListener('keydown', this.escapeKeyHandler);
    }
  }
}
