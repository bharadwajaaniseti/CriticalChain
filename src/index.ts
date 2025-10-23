/**
 * Main Game Application
 * Critical Chain - Nuclear Chain Reaction Game
 */

import { NavigationManager } from './systems/NavigationManager';
import { audioManager, AudioType } from './systems/AudioManager';
import { HomePage } from './pages/HomePage';
import { GamePage } from './pages/GamePage';
import { UpgradePage } from './pages/UpgradePage';
import { SkillTreePage } from './pages/SkillTreePage';

class CriticalChainGame {
  private currentPage: any = null;
  private appContainer: HTMLElement | null = null;
  private skillTreePage: SkillTreePage | null = null;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the game
   */
  private async initialize(): Promise<void> {
    console.log('[GAME] Initializing Critical Chain...');

    // Wait for DOM
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  /**
   * Setup after DOM is ready
   */
  private async setup(): Promise<void> {
    try {
      // Preload audio (optional, errors are non-blocking)
      await Promise.allSettled([
        audioManager.preloadAudio(AudioType.SFX_CLICK),
        audioManager.preloadAudio(AudioType.SFX_REACTION),
        audioManager.preloadAudio(AudioType.SFX_UPGRADE),
        audioManager.preloadAudio(AudioType.SFX_ATOM_BREAK),
      ]);

      // Get app container
      this.appContainer = document.getElementById('app');
      if (!this.appContainer) {
        throw new Error('App container not found');
      }

      // Setup navigation
      NavigationManager.onNavigate((page) => this.navigateToPage(page));

      // Start on home page
      this.navigateToPage('home');

      console.log('[GAME] Critical Chain initialized');
    } catch (error) {
      console.error('[GAME] Initialization failed', error);
    }
  }

  /**
   * Navigate to a page
   */
  private navigateToPage(page: 'home' | 'game' | 'upgrades' | 'skilltree'): void {
    if (!this.appContainer) return;

    // Reset session skills when going to home
    if (page === 'home' && this.skillTreePage) {
      this.skillTreePage.resetSessionSkills();
      console.log('[GAME] Session skills reset - returning to home');
    }

    // Destroy current page
    if (this.currentPage && this.currentPage.destroy) {
      this.currentPage.destroy();
    }

    // Clear container
    this.appContainer.innerHTML = '';

    // Create new page
    switch (page) {
      case 'home':
        this.currentPage = new HomePage(this.appContainer);
        break;
      case 'game':
        this.currentPage = new GamePage(this.appContainer);
        break;
      case 'upgrades':
        this.currentPage = new UpgradePage(this.appContainer);
        break;
      case 'skilltree':
        // Reuse the same skill tree instance to maintain session skills
        if (!this.skillTreePage) {
          this.skillTreePage = new SkillTreePage(this.appContainer);
        } else {
          this.skillTreePage.reattach(this.appContainer);
        }
        this.currentPage = this.skillTreePage;
        break;
    }
  }
}

// Start the game when module loads
new CriticalChainGame();

// Dev helper: Add quantum cores for testing
// Usage in browser console: addQuantumCores(100)
import { gameState } from './systems/GameStateManager';
(window as any).addQuantumCores = (amount: number) => {
  gameState.addQuantumCores(amount);
  console.log(`Added ${amount} quantum cores. Total: ${gameState.getState().quantumCores}`);
};
