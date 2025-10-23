/**
 * Navigation Manager
 * Handles page routing and navigation
 */

type PageType = 'home' | 'game' | 'upgrades' | 'skilltree';

export class NavigationManager {
  private static currentPage: PageType = 'home';
  private static listeners: Array<(page: PageType) => void> = [];

  static navigateTo(page: PageType): void {
    this.currentPage = page;
    this.notifyListeners();
  }

  static getCurrentPage(): PageType {
    return this.currentPage;
  }

  static onNavigate(callback: (page: PageType) => void): void {
    this.listeners.push(callback);
  }

  private static notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentPage));
  }
}
