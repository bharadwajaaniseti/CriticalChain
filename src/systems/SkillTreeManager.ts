/**
 * Skill Tree System
 * Loads skill tree from skilltree.json and applies upgrades to game state
 */

import { gameState } from './GameStateManager';

export interface SkillNode {
  id: string;
  name: string;
  description: string;
  icon: string;
  currentLevel: number;
  maxLevel: number;
  baseCost: number;
  costMultiplier: number;
  unlocked: boolean;
}

export class SkillTreeManager {
  private skills: Map<string, SkillNode> = new Map();
  private loaded: boolean = false;

  constructor() {
    this.loadSkillTree();
  }

  async loadSkillTree(): Promise<void> {
    try {
      const response = await fetch('/assets/data/skilltree.json');
      const data = await response.json();
      
      // Convert JSON data to Map
      for (const [key, value] of Object.entries(data)) {
        this.skills.set(key, value as SkillNode);
      }
      
      this.loaded = true;
      console.log(`[SkillTree] Loaded ${this.skills.size} skill nodes`);
    } catch (error) {
      console.error('[SkillTree] Failed to load skilltree.json:', error);
    }
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * Save skill tree state to game state
   */
  saveSkillTree(): void {
    const savedSkills: { [key: string]: SkillNode } = {};
    this.skills.forEach((skill, id) => {
      savedSkills[id] = { ...skill };
    });
    
    // Store in localStorage
    localStorage.setItem('CriticalChain_SkillTree', JSON.stringify(savedSkills));
  }

  /**
   * Load skill tree state from game state
   */
  restoreSkillTree(): void {
    const saved = localStorage.getItem('CriticalChain_SkillTree');
    if (saved) {
      try {
        const savedSkills = JSON.parse(saved);
        for (const [id, savedSkill] of Object.entries(savedSkills)) {
          const skill = this.skills.get(id);
          if (skill) {
            const saved = savedSkill as SkillNode;
            skill.currentLevel = saved.currentLevel;
            skill.unlocked = saved.unlocked;
          }
        }
        console.log('[SkillTree] Restored skill tree state');
      } catch (error) {
        console.error('[SkillTree] Failed to restore skill tree:', error);
      }
    }
  }

  /**
   * Reset skill tree (for fresh runs)
   */
  resetSkillTree(): void {
    this.skills.forEach((skill) => {
      skill.currentLevel = 0;
      skill.unlocked = skill.id === 'root'; // Only root stays unlocked
    });
    
    // Unlock path unlocks if root is purchased
    const root = this.skills.get('root');
    if (root && root.currentLevel > 0) {
      ['neutron_basics', 'atom_basics', 'chain_basics', 'resource_basics', 'economy_basics', 'special_atom_basics'].forEach(id => {
        const node = this.skills.get(id);
        if (node) node.unlocked = true;
      });
    }
    
    this.saveSkillTree();
    console.log('[SkillTree] Skill tree reset');
  }

  getAllSkills(): Map<string, SkillNode> {
    return this.skills;
  }

  getSkill(id: string): SkillNode | undefined {
    return this.skills.get(id);
  }

  /**
   * Purchase a skill upgrade
   */
  upgradeSkill(skillId: string): boolean {
    const skill = this.skills.get(skillId);
    if (!skill || !skill.unlocked || skill.currentLevel >= skill.maxLevel) {
      return false;
    }

    const cost = this.getSkillCost(skill);
    
    if (gameState.deductCoins(cost)) {
      skill.currentLevel++;
      this.unlockChildren(skillId);
      this.applySkillEffect(skill);
      this.saveSkillTree();
      gameState.saveGame();
      return true;
    }

    return false;
  }

  /**
   * Unlock child nodes when purchasing specific upgrades
   */
  private unlockChildren(skillId: string): void {
    // Define parent-child relationships
    const relationships: { [key: string]: string[] } = {
      'root': ['neutron_basics', 'atom_basics', 'chain_basics', 'resource_basics', 'economy_basics', 'special_atom_basics'],
      'neutron_basics': ['neutron_count_1', 'neutron_speed_1', 'neutron_lifetime_1', 'neutron_size_1'],
      'neutron_count_1': ['neutron_count_2'],
      'neutron_count_2': ['neutron_count_3'],
      'neutron_speed_1': ['neutron_speed_2'],
      'neutron_speed_2': ['neutron_pierce'],
      'neutron_lifetime_1': ['neutron_lifetime_2'],
      'neutron_lifetime_2': ['neutron_homing'],
      'atom_basics': ['atom_spawn_rate_1', 'atom_size_1', 'atom_lifetime_1', 'atom_neutron_count_1'],
      'atom_spawn_rate_1': ['atom_spawn_rate_2'],
      'atom_neutron_count_1': ['atom_neutron_count_2'],
      'atom_neutron_count_2': ['atom_neutron_count_3'],
      'chain_basics': ['chain_multiplier_1', 'neutron_reflector'],
      'chain_multiplier_1': ['chain_multiplier_2'],
      'chain_multiplier_2': ['chain_multiplier_3', 'momentum'],
      'resource_basics': ['max_clicks_1', 'max_time_1'],
      'max_clicks_1': ['max_clicks_2'],
      'max_clicks_2': ['max_clicks_3'],
      'max_clicks_3': ['max_clicks_4'],
      'max_time_1': ['max_time_2'],
      'max_time_2': ['max_time_3'],
      'max_time_3': ['max_time_4'],
    };

    const children = relationships[skillId];
    if (children) {
      children.forEach(childId => {
        const child = this.skills.get(childId);
        if (child) {
          child.unlocked = true;
        }
      });
    }

    // Unlock ultimates when all main paths are at certain levels
    this.checkUltimateUnlocks();
  }

  /**
   * Check if ultimate skills should be unlocked
   */
  private checkUltimateUnlocks(): void {
    // Unlock ultimates based on total upgrades purchased
    const totalLevels = Array.from(this.skills.values())
      .reduce((sum, skill) => sum + skill.currentLevel, 0);

    if (totalLevels >= 20) {
      const ultimates = ['ultimate_neutron', 'ultimate_atom', 'ultimate_chain', 'ultimate_resource'];
      ultimates.forEach(id => {
        const skill = this.skills.get(id);
        if (skill) skill.unlocked = true;
      });
    }
  }

  /**
   * Get the cost for the next level of a skill
   */
  getSkillCost(skill: SkillNode): number {
    return Math.floor(skill.baseCost * Math.pow(skill.costMultiplier, skill.currentLevel));
  }

  /**
   * Apply skill effects to game state
   */
  private applySkillEffect(skill: SkillNode): void {
    const state = gameState.getState();
    
    switch (skill.id) {
      // Neutron count upgrades
      case 'neutron_count_1':
      case 'neutron_count_2':
      case 'neutron_count_3':
        state.upgrades.neutronCountPlayer = 2 + this.getTotalLevels(['neutron_count_1', 'neutron_count_2', 'neutron_count_3']);
        break;

      // Neutron speed upgrades
      case 'neutron_speed_1':
      case 'neutron_speed_2':
        const speedLevels = this.getTotalLevels(['neutron_speed_1', 'neutron_speed_2']);
        state.upgrades.neutronSpeed = 1 + speedLevels * 0.1;
        break;

      // Neutron lifetime upgrades
      case 'neutron_lifetime_1':
      case 'neutron_lifetime_2':
        const lifetimeLevels = this.getTotalLevels(['neutron_lifetime_1', 'neutron_lifetime_2']);
        state.upgrades.neutronLifetime = 1 + lifetimeLevels * 0.2;
        break;

      // Neutron size
      case 'neutron_size_1':
        state.upgrades.neutronSize = 1 + skill.currentLevel * 0.15;
        break;

      // Pierce
      case 'neutron_pierce':
        state.upgrades.pierce = skill.currentLevel * 5;
        break;

      // Homing
      case 'neutron_homing':
        state.upgrades.homing = skill.currentLevel;
        break;

      // Atom spawn rate
      case 'atom_spawn_rate_1':
      case 'atom_spawn_rate_2':
        const spawnLevels = this.getTotalLevels(['atom_spawn_rate_1', 'atom_spawn_rate_2']);
        state.upgrades.atomSpawnRate = 1 + spawnLevels * 0.1;
        break;

      // Atom size
      case 'atom_size_1':
        state.upgrades.atomSize = 1 + skill.currentLevel * 0.15;
        break;

      // Atom lifetime
      case 'atom_lifetime_1':
        state.upgrades.atomLifetime = 1 + skill.currentLevel * 0.25;
        break;

      // Atom neutron count
      case 'atom_neutron_count_1':
      case 'atom_neutron_count_2':
      case 'atom_neutron_count_3':
        state.upgrades.neutronCountAtom = 2 + this.getTotalLevels(['atom_neutron_count_1', 'atom_neutron_count_2', 'atom_neutron_count_3']);
        break;

      // Chain multiplier
      case 'chain_multiplier_1':
      case 'chain_multiplier_2':
      case 'chain_multiplier_3':
        const chainLevels = this.getTotalLevels(['chain_multiplier_1', 'chain_multiplier_2', 'chain_multiplier_3']);
        state.upgrades.chainMultiplier = 1 + chainLevels * 0.2;
        break;

      // Momentum
      case 'momentum':
        state.upgrades.momentum = skill.currentLevel;
        break;

      // Reflector
      case 'neutron_reflector':
        state.upgrades.neutronReflector = skill.currentLevel * 10;
        break;

      // Max clicks
      case 'max_clicks_1':
      case 'max_clicks_2':
      case 'max_clicks_3':
      case 'max_clicks_4':
        state.maxClicks = 2 + this.getTotalLevels(['max_clicks_1', 'max_clicks_2', 'max_clicks_3', 'max_clicks_4']);
        break;

      // Max time
      case 'max_time_1':
      case 'max_time_2':
      case 'max_time_3':
      case 'max_time_4':
        state.maxTime = 10 + this.getTotalLevels(['max_time_1', 'max_time_2', 'max_time_3', 'max_time_4']) * 2;
        break;

      // Ultimate Neutron
      case 'ultimate_neutron':
        state.upgrades.neutronCountPlayer += 2;
        state.upgrades.neutronSpeed *= 1.5;
        break;

      // Ultimate Atom
      case 'ultimate_atom':
        state.upgrades.neutronCountAtom += 2;
        state.upgrades.atomSpawnRate *= 1.5;
        break;

      // Ultimate Chain
      case 'ultimate_chain':
        state.upgrades.chainMultiplier += 1.0;
        state.upgrades.momentum = 1;
        break;

      // Ultimate Resource
      case 'ultimate_resource':
        state.maxClicks += 2;
        state.maxTime += 5;
        break;
    }
  }

  /**
   * Get total levels across multiple skills
   */
  private getTotalLevels(skillIds: string[]): number {
    return skillIds.reduce((sum, id) => {
      const skill = this.skills.get(id);
      return sum + (skill ? skill.currentLevel : 0);
    }, 0);
  }

  /**
   * Render skill tree HTML
   */
  renderTree(): string {
    let html = '<div class="skill-tree-container">';
    
    // Root
    html += '<div class="skill-tier">';
    html += '<h3 class="tier-title">Core</h3>';
    html += '<div class="skill-row">';
    html += this.renderNode(this.skills.get('root')!);
    html += '</div></div>';
    
    // Path Unlocks
    html += '<div class="skill-tier">';
    html += '<h3 class="tier-title">Paths</h3>';
    html += '<div class="skill-row">';
    html += this.renderNode(this.skills.get('neutron_basics')!);
    html += this.renderNode(this.skills.get('atom_basics')!);
    html += this.renderNode(this.skills.get('chain_basics')!);
    html += this.renderNode(this.skills.get('resource_basics')!);
    html += '</div></div>';
    
    // Neutron Path
    const neutronNodes = [
      'neutron_count_1', 'neutron_count_2', 'neutron_count_3',
      'neutron_speed_1', 'neutron_speed_2',
      'neutron_lifetime_1', 'neutron_lifetime_2',
      'neutron_size_1', 'neutron_pierce', 'neutron_homing'
    ];
    html += this.renderPath('Neutron Path', neutronNodes);
    
    // Atom Path
    const atomNodes = [
      'atom_spawn_rate_1', 'atom_spawn_rate_2',
      'atom_size_1', 'atom_lifetime_1',
      'atom_neutron_count_1', 'atom_neutron_count_2', 'atom_neutron_count_3'
    ];
    html += this.renderPath('Atom Path', atomNodes);
    
    // Chain Path
    const chainNodes = [
      'chain_multiplier_1', 'chain_multiplier_2', 'chain_multiplier_3',
      'momentum', 'neutron_reflector'
    ];
    html += this.renderPath('Chain Path', chainNodes);
    
    // Resource Path
    const resourceNodes = [
      'max_clicks_1', 'max_clicks_2', 'max_clicks_3', 'max_clicks_4',
      'max_time_1', 'max_time_2', 'max_time_3', 'max_time_4'
    ];
    html += this.renderPath('Resource Path', resourceNodes);
    
    // Ultimates
    const ultimateNodes = ['ultimate_neutron', 'ultimate_atom', 'ultimate_chain', 'ultimate_resource'];
    html += this.renderPath('Ultimate Mastery', ultimateNodes);
    
    html += '</div>';
    return html;
  }

  /**
   * Render a path section
   */
  private renderPath(title: string, nodeIds: string[]): string {
    let html = '<div class="skill-tier">';
    html += `<h3 class="tier-title">${title}</h3>`;
    html += '<div class="skill-row">';
    
    nodeIds.forEach(id => {
      const node = this.skills.get(id);
      if (node) {
        html += this.renderNode(node);
      }
    });
    
    html += '</div></div>';
    return html;
  }

  /**
   * Render a skill node
   */
  private renderNode(skill: SkillNode): string {
    if (!skill) return '';
    
    const cost = this.getSkillCost(skill);
    const state = gameState.getState();
    const canAfford = state.coins >= cost;
    const isMaxed = skill.currentLevel >= skill.maxLevel;
    
    let statusClass = 'skill-locked';
    if (skill.unlocked) {
      if (isMaxed) statusClass = 'skill-maxed';
      else if (canAfford) statusClass = 'skill-available';
      else statusClass = 'skill-visible';
    }
    
    return `
      <div class="skill-node ${statusClass}" data-skill-id="${skill.id}">
        <div class="skill-header">
          <span class="skill-icon">${skill.icon}</span>
          <div class="skill-info">
            <div class="skill-name">${skill.name}</div>
            <div class="skill-level">Level ${skill.currentLevel}/${skill.maxLevel}</div>
          </div>
        </div>
        <p class="skill-description">${skill.description}</p>
        ${!isMaxed && skill.unlocked ? `
          <div class="skill-cost ${canAfford ? 'can-afford' : 'cannot-afford'}">
            <span class="cost-label">Cost:</span>
            <span class="cost-value">💰 ${cost}</span>
          </div>
        ` : ''}
        ${isMaxed ? '<div class="skill-maxed-label">MAXED</div>' : ''}
        ${!skill.unlocked ? '<div class="skill-locked-label">🔒 LOCKED</div>' : ''}
      </div>
    `;
  }
}

export const skillTreeManager = new SkillTreeManager();
