/**
 * Skill Tree System
 * Progressive unlock skill tree with parent-child relationships
 */

import { gameState } from './GameStateManager';

export interface SkillNode {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost: number;
  costMultiplier: number;
  maxLevel: number;
  currentLevel: number;
  unlocked: boolean;
  parentIds: string[];
  childIds: string[];
  position: { x: number; y: number };
  requiredParentLevel?: number;
}

export class SkillTreeManager {
  private skills: Map<string, SkillNode> = new Map();

  constructor() {
    this.initializeSkillTree();
  }

  private initializeSkillTree(): void {
    // Root node
    this.addSkill({
      id: 'root',
      name: 'Nuclear Core',
      description: 'The heart of your reactor. Increases base coin generation.',
      icon: '⚛️',
      cost: 10,
      costMultiplier: 1.5,
      maxLevel: 5,
      currentLevel: 0,
      unlocked: true,
      parentIds: [],
      childIds: ['neutron-emitter', 'atom-density'],
      position: { x: 50, y: 10 },
    });

    // Tier 1 - Neutron Path
    this.addSkill({
      id: 'neutron-emitter',
      name: 'Neutron Emitter',
      description: '+1 starting neutron per click',
      icon: '🔺',
      cost: 50,
      costMultiplier: 2,
      maxLevel: 10,
      currentLevel: 0,
      unlocked: false,
      parentIds: ['root'],
      childIds: ['neutron-reflector', 'neutron-speed'],
      position: { x: 25, y: 30 },
      requiredParentLevel: 1,
    });

    // Tier 1 - Atom Path
    this.addSkill({
      id: 'atom-density',
      name: 'Atom Density',
      description: 'Atoms spawn more frequently',
      icon: '🔴',
      cost: 50,
      costMultiplier: 2,
      maxLevel: 5,
      currentLevel: 0,
      unlocked: false,
      parentIds: ['root'],
      childIds: ['atom-value', 'chain-reaction'],
      position: { x: 75, y: 30 },
      requiredParentLevel: 1,
    });

    // Tier 2 - Neutron Branch
    this.addSkill({
      id: 'neutron-reflector',
      name: 'Neutron Reflectors',
      description: '% chance to reflect neutrons at edges',
      icon: '↩️',
      cost: 150,
      costMultiplier: 2.5,
      maxLevel: 10,
      currentLevel: 0,
      unlocked: false,
      parentIds: ['neutron-emitter'],
      childIds: ['advanced-reflector'],
      position: { x: 10, y: 50 },
      requiredParentLevel: 3,
    });

    this.addSkill({
      id: 'neutron-speed',
      name: 'Neutron Acceleration',
      description: 'Neutrons move faster',
      icon: '⚡',
      cost: 120,
      costMultiplier: 2,
      maxLevel: 5,
      currentLevel: 0,
      unlocked: false,
      parentIds: ['neutron-emitter'],
      childIds: ['homing-guidance'],
      position: { x: 40, y: 50 },
      requiredParentLevel: 3,
    });

    // Tier 2 - Atom Branch
    this.addSkill({
      id: 'atom-value',
      name: 'Enriched Atoms',
      description: 'Atoms worth more coins',
      icon: '💎',
      cost: 100,
      costMultiplier: 2,
      maxLevel: 10,
      currentLevel: 0,
      unlocked: false,
      parentIds: ['atom-density'],
      childIds: ['chain-multiplier'],
      position: { x: 60, y: 50 },
      requiredParentLevel: 2,
    });

    this.addSkill({
      id: 'chain-reaction',
      name: 'Chain Momentum',
      description: 'Clicking doesn\'t reset chain',
      icon: '🔗',
      cost: 500,
      costMultiplier: 1,
      maxLevel: 1,
      currentLevel: 0,
      unlocked: false,
      parentIds: ['atom-density'],
      childIds: [],
      position: { x: 90, y: 50 },
      requiredParentLevel: 5,
    });

    // Tier 3
    this.addSkill({
      id: 'advanced-reflector',
      name: 'Quantum Mirrors',
      description: 'Reflectors have 100% chance',
      icon: '🪞',
      cost: 1000,
      costMultiplier: 1,
      maxLevel: 1,
      currentLevel: 0,
      unlocked: false,
      parentIds: ['neutron-reflector'],
      childIds: [],
      position: { x: 10, y: 70 },
      requiredParentLevel: 10,
    });

    this.addSkill({
      id: 'homing-guidance',
      name: 'Homing System',
      description: 'Neutrons track atoms',
      icon: '🎯',
      cost: 300,
      costMultiplier: 2.5,
      maxLevel: 5,
      currentLevel: 0,
      unlocked: false,
      parentIds: ['neutron-speed'],
      childIds: ['pierce'],
      position: { x: 40, y: 70 },
      requiredParentLevel: 5,
    });

    this.addSkill({
      id: 'chain-multiplier',
      name: 'Chain Amplifier',
      description: 'Chain bonus multiplier increased',
      icon: '📈',
      cost: 250,
      costMultiplier: 2.5,
      maxLevel: 10,
      currentLevel: 0,
      unlocked: false,
      parentIds: ['atom-value'],
      childIds: [],
      position: { x: 60, y: 70 },
      requiredParentLevel: 5,
    });

    // Tier 4
    this.addSkill({
      id: 'pierce',
      name: 'Piercing Neutrons',
      description: 'Neutrons pass through atoms',
      icon: '🗡️',
      cost: 800,
      costMultiplier: 3,
      maxLevel: 10,
      currentLevel: 0,
      unlocked: false,
      parentIds: ['homing-guidance'],
      childIds: [],
      position: { x: 40, y: 90 },
      requiredParentLevel: 5,
    });
  }

  private addSkill(skill: SkillNode): void {
    this.skills.set(skill.id, skill);
  }

  getAllSkills(): Map<string, SkillNode> {
    return this.skills;
  }

  getSkill(id: string): SkillNode | undefined {
    return this.skills.get(id);
  }

  upgradeSkill(skillId: string): boolean {
    const skill = this.skills.get(skillId);
    if (!skill || !skill.unlocked || skill.currentLevel >= skill.maxLevel) {
      return false;
    }

    const cost = this.getSkillCost(skill);
    const state = gameState.getState();
    
    if (state.coins >= cost) {
      state.coins -= cost;
      skill.currentLevel++;
      this.checkUnlockChildren(skill);
      this.applySkillEffect(skill);
      gameState.saveGame();
      return true;
    }

    return false;
  }

  private checkUnlockChildren(skill: SkillNode): void {
    for (const childId of skill.childIds) {
      const child = this.skills.get(childId);
      if (child && !child.unlocked) {
        const requiredLevel = child.requiredParentLevel || 1;
        if (skill.currentLevel >= requiredLevel) {
          child.unlocked = true;
        }
      }
    }
  }

  private getSkillCost(skill: SkillNode): number {
    return Math.floor(skill.cost * Math.pow(skill.costMultiplier, skill.currentLevel));
  }

  private applySkillEffect(skill: SkillNode): void {
    const state = gameState.getState();
    
    switch (skill.id) {
      case 'neutron-emitter':
        state.upgrades.startingNeutrons = 2 + skill.currentLevel;
        break;
      case 'atom-density':
        state.upgrades.atomSpawnRate = 1 + skill.currentLevel * 0.2;
        break;
      case 'neutron-reflector':
        state.upgrades.neutronReflector = skill.currentLevel * 10;
        break;
      case 'homing-guidance':
        state.upgrades.homing = skill.currentLevel;
        break;
      case 'chain-reaction':
        state.upgrades.momentum = 1;
        break;
      case 'chain-multiplier':
        state.upgrades.chainMultiplier = 1 + skill.currentLevel * 0.1;
        break;
      case 'pierce':
        state.upgrades.pierce = skill.currentLevel;
        break;
    }
  }

  renderTree(skills: Map<string, SkillNode>): string {
    let html = '<div class="skill-tree">';
    
    // Tier 0 - Root
    html += '<div class="skill-tier">';
    html += this.renderNode(skills.get('root')!);
    html += '</div>';
    
    // Tier 1
    html += '<div class="skill-tier">';
    html += this.renderNode(skills.get('neutron-emitter')!);
    html += this.renderNode(skills.get('atom-density')!);
    html += '</div>';
    
    // Tier 2
    html += '<div class="skill-tier">';
    html += this.renderNode(skills.get('neutron-reflector')!);
    html += this.renderNode(skills.get('neutron-speed')!);
    html += this.renderNode(skills.get('atom-value')!);
    html += this.renderNode(skills.get('chain-reaction')!);
    html += '</div>';
    
    // Tier 3
    html += '<div class="skill-tier">';
    html += this.renderNode(skills.get('advanced-reflector')!);
    html += this.renderNode(skills.get('homing-guidance')!);
    html += this.renderNode(skills.get('chain-multiplier')!);
    html += '</div>';
    
    // Tier 4
    html += '<div class="skill-tier">';
    html += this.renderNode(skills.get('pierce')!);
    html += '</div>';
    
    html += '</div>';
    return html;
  }

  private renderNode(skill: SkillNode | undefined): string {
    if (!skill) return '';
    
    const cost = this.getSkillCost(skill);
    const canAfford = gameState.getState().coins >= cost;
    const isMaxed = skill.currentLevel >= skill.maxLevel;
    
    let statusClass = 'skill-locked';
    if (skill.unlocked) {
      if (isMaxed) statusClass = 'skill-maxed';
      else statusClass = '';
    }
    
    return `
      <div class="skill-node ${statusClass}" data-skill-id="${skill.id}">
        <div class="skill-header">
          <span class="skill-icon">${skill.icon}</span>
          <div>
            <div class="skill-name">${skill.name}</div>
            <div class="skill-level">Level ${skill.currentLevel}/${skill.maxLevel}</div>
          </div>
        </div>
        <p class="skill-description">${skill.description}</p>
        ${!isMaxed && skill.unlocked ? `
          <div class="skill-cost">
            <span class="cost-label">Cost:</span>
            <span class="cost-value">💰 ${cost}</span>
          </div>
        ` : ''}
        ${!skill.unlocked && skill.requiredParentLevel ? `
          <div class="skill-cost">
            <span class="cost-label">Requires parent level ${skill.requiredParentLevel}</span>
          </div>
        ` : ''}
      </div>
    `;
  }
}

export const skillTreeManager = new SkillTreeManager();
