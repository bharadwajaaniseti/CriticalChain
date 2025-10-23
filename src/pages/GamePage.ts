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

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
    this.setupEventListeners();
    this.initializeGame();
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
          <div class="meta-icon">⭐</div>
          <div class="meta-info">
            <span class="meta-label">Meta Currency Reward</span>
            <span class="meta-value">+${metaEarned} ⭐</span>
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
    document.getElementById('confirm-reset')?.addEventListener('click', () => {
      audioManager.playSFX(AudioType.SFX_CLICK);
      const earned = gameState.resetRun();
      overlay.remove();
      NavigationManager.navigateTo('home');
    });

    document.getElementById('cancel-reset')?.addEventListener('click', () => {
      audioManager.playSFX(AudioType.SFX_CLICK);
      overlay.remove();
    });
  }

  private initializeGame(): void {
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (canvas) {
      this.visualizer = new ReactionVisualizer(canvas);
    }

    // Start the game session
    gameState.startGame();

    // Start update loop (20 FPS for HUD updates)
    this.updateInterval = window.setInterval(() => {
      this.updateHUD();
      this.updateTimer();
    }, 50);
  }

  private updateTimer(): void {
    // Update time by 0.05 seconds (50ms)
    gameState.updateTime(0.05);
  }

  private updateHUD(): void {
    const state = gameState.getState();
    if (!state) return;

    // Check if game ended (only show once)
    if (!state.gameActive && (state.timeRemaining <= 0 || state.clicks <= 0) && !this.gameOverShown) {
      this.gameOverShown = true;
      this.showGameOver();
    }

    // Update coins
    const coinsValue = document.getElementById('coins-value');
    if (coinsValue) {
      coinsValue.textContent = state.coins.toString();
    }

    // Update chain
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
    const coins = state.coins ?? 0;
    const maxChain = state.maxChain ?? 0;
    const rank = state.rank ?? 0;
    const reason = state.clicks <= 0 ? 'Out of Clicks!' : 'Time\'s Up!';
    
    overlay.innerHTML = `
      <div class="game-over-panel">
        <h2>⏱️ ${reason}</h2>
        <div class="game-over-stats">
          <div class="stat-item">
            <span class="stat-label">Coins Earned</span>
            <span class="stat-value">💰 ${coins}</span>
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
      gameState.startGame();
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
  }
}
