/**
 * Skill Tree Page
 * Loads and displays skills from skilltree.json with smart tooltip positioning
 */

import { NavigationManager } from '../systems/NavigationManager';
import { gameState } from '../systems/GameStateManager';
import { audioManager, AudioType } from '../systems/AudioManager';
import { skillTreeManager } from '../systems/SkillTreeManager';

interface SkillNodeData {
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

interface SkillNode extends SkillNodeData {
  x?: number;
  y?: number;
  radius?: number;
  depth?: number;
  connectedNodes?: string[];
}

export class SkillTreePage {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private skills: Map<string, SkillNode> = new Map();
  private tooltip: HTMLElement | null = null;
  private skillTreeData: Record<string, SkillNodeData> | null = null;
  
  private sessionSkills: Map<string, { currentLevel: number; unlocked: boolean }> = new Map();
  
  private iconCache: Map<string, HTMLImageElement> = new Map();
  private nodeBaseImage: HTMLImageElement | null = null;
  
  private offsetX: number = 0;
  private offsetY: number = 0;
  private scale: number = 1;
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;
  private saveTimeout: number | null = null;
  private animationFrameId: number | null = null;
  private hoveredSkill: SkillNode | null = null;
  private clickedNodes: Map<string, number> = new Map();
  private lastHoveredSkillId: string | null = null;
  
  // Static dev mode flag that persists across navigation
  private static devModeEnabled: boolean = false;
  
  static setDevMode(enabled: boolean): void {
    SkillTreePage.devModeEnabled = enabled;
    console.log('[SkillTree] Dev mode set to:', enabled);
  }
  
  static isDevMode(): boolean {
    return SkillTreePage.devModeEnabled;
  }

  constructor(container: HTMLElement) {
    this.container = container;
    this.loadSkillTree();
    this.loadNodeBaseImage();
  }

  private loadNodeBaseImage(): void {
    this.nodeBaseImage = new Image();
  }

  private async loadSkillIcon(skillName: string): Promise<HTMLImageElement | null> {
    if (this.iconCache.has(skillName)) {
      return this.iconCache.get(skillName)!;
    }

    try {
      const img = new Image();
      const iconPath = `/assets/Icons/${skillName}.png`;
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          this.iconCache.set(skillName, img);
          console.log(`[SkillTree] Loaded icon for: ${skillName}`);
          resolve();
        };
        img.onerror = () => {
          console.log(`[SkillTree] No icon found for: ${skillName}, using fallback`);
          reject();
        };
        img.src = iconPath;
      });

      return img;
    } catch (error) {
      return null;
    }
  }

  private async loadSkillTree(): Promise<void> {
    try {
      const response = await fetch('/assets/data/skilltree.json');
      this.skillTreeData = await response.json();
      this.initializeSkills();
      
      await this.preloadAllIcons();
      
      this.render();
      
      // If dev mode, force a redraw after everything is set up
      if (SkillTreePage.isDevMode()) {
        console.log('[SkillTree] DEV MODE: Force redrawing canvas');
        setTimeout(() => {
          this.draw();
        }, 100);
      }
    } catch (error) {
      console.error('[SkillTree] Failed to load skilltree.json:', error);
      this.container.innerHTML = '<div class="error">Failed to load skill tree</div>';
    }
  }

  private async preloadAllIcons(): Promise<void> {
    if (!this.skillTreeData) return;

    const loadPromises: Promise<void>[] = [];

    for (const [id, skill] of Object.entries(this.skillTreeData)) {
      const promise = this.loadSkillIcon(skill.name).catch(() => {});
      loadPromises.push(promise as Promise<void>);
    }

    await Promise.all(loadPromises);
    console.log(`[SkillTree] Preloaded ${this.iconCache.size} skill icons`);
  }

  private initializeSkills(): void {
    if (!this.skillTreeData) return;

    Object.values(this.skillTreeData).forEach(skillData => {
      this.skills.set(skillData.id, { ...skillData, connectedNodes: [] });
    });

    this.defineConnections();
    this.calculateDepths();
    
    // Check if dev mode is enabled and unlock all skills
    if (SkillTreePage.isDevMode()) {
      this.unlockAllSkillsForDev();
      console.log('[SkillTree] DEV MODE: All skills unlocked for editing');
    }
  }

  private unlockAllSkillsForDev(): void {
    console.log('[SkillTree] DEV MODE: Starting unlock process...');
    
    // Give root node a level so all children are visible
    const rootSession = this.sessionSkills.get('root') ?? { currentLevel: 0, unlocked: false };
    rootSession.currentLevel = 1;
    this.sessionSkills.set('root', rootSession);
    
    // Unlock all skills in session
    this.skills.forEach((skill, id) => {
      if (id !== 'root') {
        const session = this.sessionSkills.get(id) ?? { currentLevel: 0, unlocked: false };
        session.unlocked = true;
        this.sessionSkills.set(id, session);
      }
    });
    
    // Give plenty of coins for testing (modify state directly, not copy)
    const state = gameState.getState();
    state.coins = 1000000;
    
    // Update coins display
    const coinsDisplay = document.getElementById('coins-value');
    if (coinsDisplay) {
      coinsDisplay.textContent = '1000000';
    }
    
    console.log('[SkillTree] DEV MODE: Unlocked all skills and added 1,000,000 coins');
    console.log('[SkillTree] DEV MODE: Total skills unlocked:', this.sessionSkills.size);
    console.log('[SkillTree] DEV MODE: Total skills in tree:', this.skills.size);
  }

  private defineConnections(): void {
    const connections: { [key: string]: string[] } = {
      'root': ['neutron_basics', 'atom_basics', 'chain_basics', 'resource_basics', 'economy_basics', 'special_atom_basics'],
      'neutron_basics': ['neutron_count_1', 'neutron_speed_1', 'neutron_lifetime_1', 'neutron_size_1', 'critical_neutron_unlock'],
      'neutron_count_1': ['neutron_count_2'],
      'neutron_count_2': ['neutron_count_3'],
      'neutron_count_3': ['ultimate_neutron'],
      'neutron_speed_1': ['neutron_speed_2'],
      'neutron_speed_2': ['neutron_pierce'],
      'neutron_pierce': ['ultimate_neutron'],
      'neutron_lifetime_1': ['neutron_lifetime_2'],
      'neutron_lifetime_2': ['neutron_homing'],
      'neutron_homing': ['ultimate_neutron'],
      'neutron_size_1': ['ultimate_neutron'],
      'critical_neutron_unlock': ['critical_neutron_chance_1', 'critical_neutron_effect_1'],
      'critical_neutron_chance_1': ['ultimate_neutron'],
      'critical_neutron_effect_1': ['ultimate_neutron'],
      'atom_basics': ['atom_spawn_rate_1', 'atom_size_1', 'atom_lifetime_1', 'atom_neutron_count_1', 'atom_shockwave_unlock'],
      'atom_spawn_rate_1': ['atom_spawn_rate_2'],
      'atom_spawn_rate_2': ['ultimate_atom'],
      'atom_size_1': ['ultimate_atom'],
      'atom_lifetime_1': ['ultimate_atom'],
      'atom_neutron_count_1': ['atom_neutron_count_2'],
      'atom_neutron_count_2': ['atom_neutron_count_3'],
      'atom_neutron_count_3': ['ultimate_atom'],
      'atom_shockwave_unlock': ['atom_shockwave_force_1'],
      'atom_shockwave_force_1': ['ultimate_atom'],
      'chain_basics': ['chain_multiplier_1', 'momentum', 'neutron_reflector'],
      'chain_multiplier_1': ['chain_multiplier_2'],
      'chain_multiplier_2': ['chain_multiplier_3'],
      'chain_multiplier_3': ['ultimate_chain'],
      'momentum': ['ultimate_chain'],
      'neutron_reflector': ['ultimate_chain'],
      'resource_basics': ['max_clicks_1', 'max_time_1', 'click_shockwave_unlock'],
      'max_clicks_1': ['max_clicks_2'],
      'max_clicks_2': ['max_clicks_3'],
      'max_clicks_3': ['max_clicks_4'],
      'max_clicks_4': ['ultimate_resource'],
      'max_time_1': ['max_time_2'],
      'max_time_2': ['max_time_3'],
      'max_time_3': ['max_time_4'],
      'max_time_4': ['ultimate_resource'],
      'click_shockwave_unlock': ['click_shockwave_radius_1'],
      'click_shockwave_radius_1': ['ultimate_resource'],
      'economy_basics': ['base_coin_value_1', 'skill_cost_reduction_1', 'starting_coins_1'],
      'base_coin_value_1': ['base_coin_value_2'],
      'base_coin_value_2': ['ultimate_economy'],
      'skill_cost_reduction_1': ['ultimate_economy'],
      'starting_coins_1': ['ultimate_economy'],
      'special_atom_basics': ['unlock_time_atoms', 'unlock_supernova_atoms', 'unlock_black_hole_atoms'],
      'unlock_time_atoms': ['time_atom_chance_1', 'time_atom_value_1'],
      'time_atom_chance_1': ['ultimate_fission'],
      'time_atom_value_1': ['time_atom_coins_1'],
      'time_atom_coins_1': ['ultimate_fission'],
      'unlock_supernova_atoms': ['supernova_atom_chance_1', 'supernova_atom_neutrons_1'],
      'supernova_atom_chance_1': ['ultimate_fission'],
      'supernova_atom_neutrons_1': ['supernova_atom_coins_1'],
      'supernova_atom_coins_1': ['ultimate_fission'],
      'unlock_black_hole_atoms': ['black_hole_atom_chance_1', 'black_hole_pull_radius_1'],
      'black_hole_atom_chance_1': ['ultimate_fission'],
      'black_hole_pull_radius_1': ['black_hole_atom_coins_1'],
      'black_hole_atom_coins_1': ['black_hole_spawn_atoms_1'],
      'black_hole_spawn_atoms_1': ['ultimate_fission'],
    };

    Object.entries(connections).forEach(([parentId, children]) => {
      const parent = this.skills.get(parentId);
      if (parent) {
        parent.connectedNodes = children;
      }
    });
  }

  private getEffectiveLevel(skillId: string): number {
    const skill = this.skills.get(skillId);
    if (!skill) return 0;
    
    const session = this.sessionSkills.get(skillId);
    const baseLevel = skill.currentLevel;
    const sessionLevel = session?.currentLevel ?? 0;
    
    return baseLevel + sessionLevel;
  }

  private isEffectivelyUnlocked(skillId: string): boolean {
    const skill = this.skills.get(skillId);
    if (!skill) return false;
    
    const session = this.sessionSkills.get(skillId);
    return skill.unlocked || (session?.unlocked ?? false);
  }

  resetSessionSkills(): void {
    this.sessionSkills.clear();
    console.log('[SkillTree] Session skills reset');
  }

  private calculateDepths(): void {
    const visited = new Set<string>();
    const queue: Array<{ id: string; depth: number }> = [{ id: 'root', depth: 0 }];

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      const skill = this.skills.get(id);
      
      if (!skill || visited.has(id)) continue;
      
      visited.add(id);
      skill.depth = depth;

      if (skill.connectedNodes) {
        skill.connectedNodes.forEach(connectedId => {
          if (!visited.has(connectedId)) {
            queue.push({ id: connectedId, depth: depth + 1 });
          }
        });
      }
    }
  }

  private getSkillIcon(skill: SkillNode): string {
    if (skill.icon) return skill.icon;
    
    const id = skill.id;
    if (id === 'root') return '⚛️';
    if (id.includes('neutron')) return '⚡';
    if (id.includes('atom')) return '⚡';
    if (id.includes('chain')) return '🔗';
    if (id.includes('click')) return '👆';
    if (id.includes('time')) return '⏱️';
    if (id.includes('ultimate')) return '🌟';
    return '⚛️';
  }

  private render(): void {
    const state = gameState.getState();
    const isDevMode = SkillTreePage.isDevMode();
    
    this.container.innerHTML = `
      <div class="skilltree-page">
        <div class="skilltree-header">
          <button class="header-btn" id="back-btn">← Home Screen</button>
          <h1 class="skilltree-title">Skill Tree ${isDevMode ? '<span style="color: #a78bfa; font-size: 0.7em; margin-left: 10px;">🔧 DEV MODE</span>' : ''}</h1>
          <div class="skilltree-controls">
            <button class="zoom-btn" id="zoom-in">+</button>
            <button class="zoom-btn" id="zoom-out">−</button>
            <button class="zoom-btn" id="zoom-reset">Reset</button>
          </div>
          <div class="coins-info">
            <span class="coins-icon">💰</span>
            <span class="coins-value" id="coins-value">${state.coins}</span>
          </div>
        </div>

        <div class="skilltree-canvas-wrapper">
          <canvas id="skilltree-canvas" class="skilltree-canvas"></canvas>
          <div id="skill-tooltip" class="skill-tooltip hidden"></div>
          <button class="play-button" id="play-btn">Play Round</button>
        </div>
      </div>
    `;

    requestAnimationFrame(() => {
      this.setupCanvas();
      this.calculateOptimizedLayout();
      this.setupEventListeners();
      this.centerView();
      this.startAnimationLoop();
    });
  }

  private setupCanvas(): void {
    this.canvas = document.getElementById('skilltree-canvas') as HTMLCanvasElement;
    this.tooltip = document.getElementById('skill-tooltip');

    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();

    window.addEventListener('resize', () => {
      this.resizeCanvas();
      this.draw();
    });
  }

  private resizeCanvas(): void {
    if (!this.canvas) return;

    const wrapper = this.canvas.parentElement;
    if (!wrapper) return;

    const rect = wrapper.getBoundingClientRect();
    this.canvas.width = rect.width - 80;
    this.canvas.height = rect.height - 80;

    this.ctx = this.canvas.getContext('2d');
  }

  private startAnimationLoop(): void {
    const animate = () => {
      this.draw();
      this.animationFrameId = requestAnimationFrame(animate);
    };
    animate();
  }

  private draw(): void {
    if (!this.canvas || !this.ctx) return;

    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);

    this.calculateOptimizedLayout();

    const nodeRadius = 50;

    const visibleNodes = this.getVisibleNodes();
    
    const currentCoins = gameState.getState().coins;

    visibleNodes.forEach(skill => {
      if (!skill.connectedNodes) return;
      
      skill.connectedNodes.forEach(connectedId => {
        const connected = this.skills.get(connectedId);
        if (!connected || !visibleNodes.has(connected) || !skill.x || !skill.y || !connected.x || !connected.y) return;

        const skillEffectiveLevel = this.getEffectiveLevel(skill.id);
        const connectedEffectiveLevel = this.getEffectiveLevel(connectedId);
        const connectedEffectivelyUnlocked = this.isEffectivelyUnlocked(connectedId);

        if (skillEffectiveLevel > 0 && connectedEffectivelyUnlocked) {
          ctx.beginPath();
          ctx.moveTo(skill.x, skill.y);
          ctx.lineTo(connected.x, connected.y);
          
          ctx.strokeStyle = 'rgba(0, 255, 170, 0.2)';
          ctx.lineWidth = 6;
          ctx.stroke();
          ctx.strokeStyle = 'rgba(255, 215, 0, 1)';
          ctx.lineWidth = 3;
        } else if (connectedEffectivelyUnlocked) {
          ctx.beginPath();
          ctx.moveTo(skill.x, skill.y);
          ctx.lineTo(connected.x, connected.y);
          ctx.strokeStyle = 'rgba(79, 172, 254, 0.6)';
          ctx.lineWidth = 2.5;
        } else {
          ctx.beginPath();
          ctx.moveTo(skill.x, skill.y);
          ctx.lineTo(connected.x, connected.y);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = 2;
        }

        ctx.stroke();
      });
    });

    visibleNodes.forEach(skill => {
      if (!skill.x || !skill.y) return;

      const effectiveLevel = this.getEffectiveLevel(skill.id);
      const isEffectivelyUnlocked = this.isEffectivelyUnlocked(skill.id);
      const isPurchased = effectiveLevel > 0;
      const isMaxed = effectiveLevel >= skill.maxLevel;
      const isHovered = this.hoveredSkill?.id === skill.id;
      
      const cost = Math.floor(skill.baseCost * Math.pow(skill.costMultiplier, effectiveLevel));
      const isAffordable = isEffectivelyUnlocked && !isMaxed && currentCoins >= cost;

      const time = Date.now() / 1000;
      const pulseScale = isAffordable ? 1 + Math.sin(time * 3) * 0.05 : 1;
      const hoverScale = isHovered ? 1.15 : 1;
      
      const clickTime = this.clickedNodes.get(skill.id);
      let clickScale = 1;
      if (clickTime) {
        const elapsed = Date.now() - clickTime;
        if (elapsed < 300) {
          const progress = elapsed / 300;
          clickScale = 1 + Math.sin(progress * Math.PI) * 0.3;
        } else {
          this.clickedNodes.delete(skill.id);
        }
      }
      
      const currentRadius = nodeRadius * pulseScale * hoverScale * clickScale;

      if (isAffordable) {
        ctx.beginPath();
        ctx.arc(skill.x, skill.y, currentRadius + 12, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(skill.x, skill.y, currentRadius, skill.x, skill.y, currentRadius + 12);
        gradient.addColorStop(0, 'rgba(79, 172, 254, 0.6)');
        gradient.addColorStop(1, 'rgba(79, 172, 254, 0)');
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(skill.x, skill.y, currentRadius, 0, Math.PI * 2);

      if (isMaxed) {
        ctx.fillStyle = '#000AFF';
        ctx.shadowBlur = 12;
        ctx.shadowColor = 'rgba(0, 10, 255, 0.7)';
        ctx.fill();
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 5;
        ctx.stroke();
      } else if (isPurchased) {
        ctx.fillStyle = '#FF6100';
        ctx.shadowBlur = 18;
        
        ctx.shadowColor = `rgba(255, 168, 112, 1)`;
        ctx.fill();
        
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 5;
        ctx.stroke();
      } else if (isEffectivelyUnlocked) {
        ctx.fillStyle = '#4facfe';
        ctx.shadowBlur = 22;
        ctx.shadowColor = 'rgba(79, 172, 254, 0.8)';
        ctx.fill();
        
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 5;
        ctx.stroke();
      } else {
        ctx.fillStyle = 'rgba(80, 80, 80, 0.9)';
        ctx.shadowBlur = 5;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(120, 120, 120, 0.7)';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      
      ctx.shadowBlur = 0;
      skill.radius = currentRadius;

      const iconImage = this.iconCache.get(skill.name);
      
      if (iconImage && iconImage.complete && iconImage.naturalWidth > 0) {
        const iconSize = currentRadius * 1.4;
        const iconX = skill.x - iconSize / 2;
        const iconY = skill.y - iconSize / 2;
        
        if (isEffectivelyUnlocked) {
          ctx.shadowBlur = 6;
          ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
        }
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(skill.x, skill.y, currentRadius * 0.7, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(iconImage, iconX, iconY, iconSize, iconSize);
        ctx.restore();
        
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      } else {
        const icon = this.getSkillIcon(skill);
        const fontSize = currentRadius * 0.85;
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (isEffectivelyUnlocked) {
          ctx.shadowBlur = 4;
          ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
          ctx.shadowOffsetX = 1;
          ctx.shadowOffsetY = 1;
        }
        
        ctx.fillStyle = isEffectivelyUnlocked ? '#fff' : 'rgba(140, 140, 140, 0.7)';
        ctx.fillText(icon, skill.x, skill.y);
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }

      if (isPurchased) {
        const levelText = `${effectiveLevel}/${skill.maxLevel}`;
        const levelFontSize = currentRadius * 0.32;
        const levelY = skill.y + currentRadius + 22;
        
        ctx.font = `bold ${levelFontSize}px Arial`;
        const textMetrics = ctx.measureText(levelText);
        const badgeWidth = textMetrics.width + 10;
        const badgeHeight = levelFontSize + 4;
        const badgeX = skill.x - badgeWidth / 2;
        const badgeY = levelY - levelFontSize / 2 - 2;
        
        ctx.fillStyle = isMaxed ? 'rgba(255, 215, 0, 0.25)' : 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 6);
        ctx.fill();
        
        ctx.strokeStyle = isMaxed ? 'rgba(255, 215, 0, 0.5)' : 'rgba(0, 255, 170, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = isMaxed ? '#ffd700' : '#ffffff';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.lineWidth = 2.5;
        ctx.strokeText(levelText, skill.x, levelY);
        ctx.fillText(levelText, skill.x, levelY);
      }
    });

    ctx.restore();
  }

  private getVisibleNodes(): Set<SkillNode> {
    const visible = new Set<SkillNode>();
    const root = this.skills.get('root');
    
    if (!root) return visible;

    // Check if in dev mode - show ALL nodes
    if (SkillTreePage.isDevMode()) {
      console.log('[SkillTree] DEV MODE: Showing all nodes, total:', this.skills.size);
      this.skills.forEach(skill => {
        visible.add(skill);
      });
      console.log('[SkillTree] DEV MODE: Visible nodes:', visible.size);
      return visible;
    }

    visible.add(root);

    const queue: SkillNode[] = [root];
    const processed = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (processed.has(current.id)) continue;
      processed.add(current.id);

      const effectiveLevel = this.getEffectiveLevel(current.id);
      if (effectiveLevel > 0 && current.connectedNodes) {
        current.connectedNodes.forEach(connectedId => {
          const connected = this.skills.get(connectedId);
          if (connected && !visible.has(connected)) {
            visible.add(connected);
            queue.push(connected);
          }
        });
      }
    }

    return visible;
  }

  private calculateOptimizedLayout(): void {
    if (!this.canvas) return;

    const gridSize = 200;
    const offsetX = 500;
    const offsetY = 500;
    
    const grid = (col: number, row: number) => ({
      x: offsetX + col * gridSize,
      y: offsetY + row * gridSize
    });
    
    const positions: { [key: string]: { x: number; y: number } } = {
      'ultimate_neutron': grid(6.5, 0),
      'neutron_homing': grid(4, 1),
      'neutron_lifetime_2': grid(4, 2),
      'neutron_pierce': grid(7, 2),
      'neutron_speed_2': grid(7, 3),
      'neutron_lifetime_1': grid(4, 3),
      'neutron_count_3': grid(6, 2),
      'neutron_speed_1': grid(7, 4),
      'time_atom_coins_1': grid(1, 1),
      'time_atom_chance_1': grid(1, 2),
      'unlock_time_atoms': grid(3, 2),
      'time_atom_value_1': grid(3, 1),
      'neutron_size_1': grid(5, 3),
      'neutron_count_2': grid(6, 3),
      'critical_neutron_chance_1': grid(8, 3),
      'critical_neutron_effect_1': grid(9, 3),
      'supernova_atom_coins_1': grid(1, 3),
      'supernova_atom_chance_1': grid(0, 4),
      'unlock_supernova_atoms': grid(3, 4),
      'supernova_atom_neutrons_1': grid(2, 3),
      'special_atom_basics': grid(4, 5),
      'neutron_count_1': grid(6, 4),
      'critical_neutron_unlock': grid(8, 4),
      'atom_spawn_rate_2': grid(10, 4),
      'ultimate_fission': grid(-1, 4),
      'black_hole_atom_chance_1': grid(1, 5),
      'black_hole_pull_radius_1': grid(2, 6),
      'neutron_basics': grid(6, 5),
      'atom_basics': grid(8, 6),
      'atom_spawn_rate_1': grid(9, 4),
      'black_hole_atom_coins_1': grid(1, 6),
      'unlock_black_hole_atoms': grid(3, 5),
      'black_hole_spawn_atoms_1': grid(0, 6.5),
      'root': grid(6, 6),
      'atom_size_1': grid(11, 6),
      'atom_neutron_count_1': grid(9, 5),
      'atom_neutron_count_2': grid(10, 5),
      'atom_neutron_count_3': grid(11, 5),
      'base_coin_value_2': grid(2, 7),
      'base_coin_value_1': grid(3, 7),
      'economy_basics': grid(4, 7),
      'chain_basics': grid(8, 7),
      'atom_lifetime_1': grid(11, 7),
      'atom_shockwave_unlock': grid(10, 7),
      'atom_shockwave_force_1': grid(11, 8),
      'ultimate_atom': grid(13, 6),
      'starting_coins_1': grid(3, 9),
      'skill_cost_reduction_1': grid(3, 8),
      'resource_basics': grid(6, 8),
      'neutron_reflector': grid(7, 8),
      'chain_multiplier_1': grid(9, 7),
      'chain_multiplier_2': grid(9, 8),
      'chain_multiplier_3': grid(10, 8),
      'ultimate_economy': grid(2, 8.5),
      'click_shockwave_unlock': grid(5, 9),
      'max_clicks_1': grid(6, 9),
      'max_time_1': grid(7, 9),
      'momentum': grid(9, 9),
      'click_shockwave_radius_1': grid(5, 10),
      'max_clicks_2': grid(6, 10),
      'max_time_2': grid(7, 10),
      'ultimate_chain': grid(9, 10),
      'max_clicks_3': grid(6, 11),
      'max_time_3': grid(7, 11),
      'max_clicks_4': grid(6, 12),
      'max_time_4': grid(7, 12),
      'ultimate_resource': grid(6, 13),
    };

    this.skills.forEach((skill, id) => {
      const pos = positions[id];
      if (pos) {
        skill.x = pos.x;
        skill.y = pos.y;
      } else {
        console.warn(`[SkillTree] No position defined for ${id}`);
        skill.x = 500;
        skill.y = 500;
      }
    });
  }

  private centerView(): void {
    if (!this.canvas) return;

    const state = gameState.getState();
    const savedCamera = (state as any).skillTreeCamera;

    if (savedCamera && savedCamera.offsetX !== undefined) {
      this.offsetX = savedCamera.offsetX;
      this.offsetY = savedCamera.offsetY;
      this.scale = savedCamera.scale;
      console.log('[SkillTree] Restored camera:', savedCamera);
    } else {
      const treeCenterX = 1400;
      const treeCenterY = 1400;
      
      this.scale = 0.5;
      
      this.offsetX = this.canvas.width / 2 - treeCenterX * this.scale;
      this.offsetY = this.canvas.height / 2 - treeCenterY * this.scale;
      
      console.log('[SkillTree] Centered on root at scale:', this.scale);
      
      this.saveCameraPosition();
    }
  }

  private saveCameraPosition(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    this.saveTimeout = window.setTimeout(() => {
      const state = gameState.getState();
      (state as any).skillTreeCamera = {
        offsetX: this.offsetX,
        offsetY: this.offsetY,
        scale: this.scale
      };
      gameState.saveGame();
      console.log('[SkillTree] Saved camera position:', this.offsetX, this.offsetY, this.scale);
    }, 500);
  }

  private setupEventListeners(): void {
    const backBtn = document.getElementById('back-btn');
    backBtn?.addEventListener('click', () => {
      audioManager.playSFX(AudioType.SFX_CLICK);
      // Clear dev mode flag
      if (SkillTreePage.isDevMode()) {
        SkillTreePage.setDevMode(false);
        console.log('[SkillTree] DEV MODE: Cleared dev mode flag');
      }
      this.showResetConfirmation();
    });

    const playBtn = document.getElementById('play-btn');
    playBtn?.addEventListener('click', () => {
      audioManager.playSFX(AudioType.SFX_CLICK);
      NavigationManager.navigateTo('game');
    });

    const zoomIn = document.getElementById('zoom-in');
    const zoomOut = document.getElementById('zoom-out');
    const zoomReset = document.getElementById('zoom-reset');

    zoomIn?.addEventListener('click', () => {
      this.zoom(1.2);
    });

    zoomOut?.addEventListener('click', () => {
      this.zoom(0.8);
    });

    zoomReset?.addEventListener('click', () => {
      this.scale = 1;
      
      const root = this.skills.get('root');
      if (root && root.x && root.y && this.canvas) {
        this.offsetX = this.canvas.width / 2 - root.x * this.scale;
        this.offsetY = this.canvas.height / 2 - root.y * this.scale;
      }
      
      this.draw();
      this.saveCameraPosition();
    });

    if (this.canvas) {
      this.canvas.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });
      this.canvas.addEventListener('click', (e) => this.handleClick(e));
      this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
      this.canvas.addEventListener('mouseleave', () => {
        this.hideTooltip();
        this.isDragging = false;
      });

      this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
      this.canvas.addEventListener('mouseup', () => {
        if (this.isDragging) {
          this.isDragging = false;
          if (this.saveTimeout) clearTimeout(this.saveTimeout);
          const state = gameState.getState();
          (state as any).skillTreeCamera = {
            offsetX: this.offsetX,
            offsetY: this.offsetY,
            scale: this.scale
          };
          gameState.saveGame();
          console.log('[SkillTree] Saved on drag end');
        }
      });
    }
  }

  private handleWheel(e: WheelEvent): void {
    e.preventDefault();
    
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    this.zoom(zoomFactor, e.clientX, e.clientY);
  }

  private zoom(factor: number, mouseX?: number, mouseY?: number): void {
    if (!this.canvas) return;

    const oldScale = this.scale;
    this.scale = Math.max(0.3, Math.min(3, this.scale * factor));

    if (mouseX !== undefined && mouseY !== undefined) {
      const rect = this.canvas.getBoundingClientRect();
      const canvasX = mouseX - rect.left;
      const canvasY = mouseY - rect.top;

      this.offsetX = canvasX - (canvasX - this.offsetX) * (this.scale / oldScale);
      this.offsetY = canvasY - (canvasY - this.offsetY) * (this.scale / oldScale);
    }

    this.draw();
    
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    const state = gameState.getState();
    (state as any).skillTreeCamera = {
      offsetX: this.offsetX,
      offsetY: this.offsetY,
      scale: this.scale
    };
    gameState.saveGame();
    console.log('[SkillTree] Saved on zoom');
  }

  private handleMouseDown(e: MouseEvent): void {
    if (e.button === 0) {
      this.isDragging = true;
      this.dragStartX = e.clientX - this.offsetX;
      this.dragStartY = e.clientY - this.offsetY;
    }
  }

  private handleMouseMove(e: MouseEvent): void {
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;

    if (this.isDragging) {
      this.offsetX = e.clientX - this.dragStartX;
      this.offsetY = e.clientY - this.dragStartY;
      this.draw();
      this.hideTooltip();
      
      this.saveCameraPosition();
    } else {
      this.handleHover(e);
    }
  }

  private handleClick(e: MouseEvent): void {
    if (this.isDragging) return;
    
    const skill = this.getSkillAtPoint(e);
    if (skill) {
      const isUnlocked = this.isEffectivelyUnlocked(skill.id);
      const effectiveLevel = this.getEffectiveLevel(skill.id);
      
      if (isUnlocked && effectiveLevel < skill.maxLevel) {
        this.purchaseSkill(skill.id);
      }
    }
  }

  private handleHover(e: MouseEvent): void {
    const skill = this.getSkillAtPoint(e);
    this.hoveredSkill = skill;
    
    if (skill) {
      if (this.lastHoveredSkillId !== skill.id) {
        audioManager.playSFX(AudioType.SKILLTREE_HOVER);
        this.lastHoveredSkillId = skill.id;
      }
      
      this.showTooltip(skill, e.clientX, e.clientY);
      if (this.canvas) {
        this.canvas.style.cursor = 'pointer';
      }
    } else {
      this.lastHoveredSkillId = null;
      this.hideTooltip();
      if (this.canvas) {
        this.canvas.style.cursor = this.isDragging ? 'grabbing' : 'grab';
      }
    }
  }

  private getSkillAtPoint(e: MouseEvent): SkillNode | null {
    if (!this.canvas) return null;

    const rect = this.canvas.getBoundingClientRect();
    
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;
    
    const worldX = (canvasX - this.offsetX) / this.scale;
    const worldY = (canvasY - this.offsetY) / this.scale;

    const visibleNodes = this.getVisibleNodes();

    for (const skill of Array.from(visibleNodes)) {
      if (!skill.x || !skill.y || !skill.radius) continue;

      const distance = Math.sqrt((worldX - skill.x) ** 2 + (worldY - skill.y) ** 2);
      if (distance <= skill.radius) return skill;
    }

    return null;
  }

  private showTooltip(skill: SkillNode, mouseX: number, mouseY: number): void {
    if (!this.tooltip) return;

    const state = gameState.getState();
    const effectiveLevel = this.getEffectiveLevel(skill.id);
    const cost = Math.floor(skill.baseCost * Math.pow(skill.costMultiplier, effectiveLevel));
    const canAfford = state.coins >= cost;
    const isMaxed = effectiveLevel >= skill.maxLevel;
    
    const session = this.sessionSkills.get(skill.id);
    const sessionLevel = session?.currentLevel ?? 0;
    const baseLevel = skill.currentLevel;
    const levelDisplay = sessionLevel > 0 
      ? `${baseLevel} + ${sessionLevel} = ${effectiveLevel}/${skill.maxLevel}`
      : `${effectiveLevel}/${skill.maxLevel}`;

    // Get the icon - prefer image over emoji
    const iconImage = this.iconCache.get(skill.name);
    let iconHTML = '';
    if (iconImage && iconImage.complete && iconImage.naturalWidth > 0) {
      // Use the actual icon image
      iconHTML = `<img src="${iconImage.src}" alt="${skill.name}" style="width: 32px; height: 32px; object-fit: contain; border-radius: 50%;">`;
    } else {
      // Fallback to emoji
      iconHTML = `<span>${this.getSkillIcon(skill)}</span>`;
    }

    this.tooltip.innerHTML = `
      <div class="tooltip-header">
        <span class="tooltip-icon">${iconHTML}</span>
        <span class="tooltip-name">${skill.name}</span>
      </div>
      <p class="tooltip-description">${skill.description}</p>
      <div class="tooltip-footer">
        <span class="tooltip-level">Level: ${levelDisplay}</span>
        ${isMaxed 
          ? '<span class="tooltip-owned">✓ Maxed</span>' 
          : effectiveLevel > 0
            ? `<span class="tooltip-cost ${canAfford ? '' : 'insufficient'}">💰 ${cost} (Upgrade)</span>`
            : `<span class="tooltip-cost ${canAfford ? '' : 'insufficient'}">💰 ${cost}</span>`
        }
      </div>
    `;

    this.tooltip.classList.remove('hidden');
    const tooltipRect = this.tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let left = mouseX + 15;
    let top = mouseY + 15;

    if (left + tooltipRect.width > viewportWidth - 20) {
      left = mouseX - tooltipRect.width - 15;
    }

    if (top + tooltipRect.height > viewportHeight - 20) {
      top = mouseY - tooltipRect.height - 15;
    }

    if (left < 20) {
      left = 20;
    }

    if (top < 20) {
      top = 20;
    }

    this.tooltip.style.left = `${left}px`;
    this.tooltip.style.top = `${top}px`;
  }

  private hideTooltip(): void {
    this.tooltip?.classList.add('hidden');
  }

  private calculateCost(skill: SkillNode): number {
    if (skill.currentLevel === 0) {
      return skill.baseCost;
    }
    return Math.floor(skill.baseCost * Math.pow(skill.costMultiplier, skill.currentLevel));
  }

  private applySkillEffect(skillId: string, totalLevel: number): void {
    const getTotalLevels = (skillIds: string[]): number => {
      return skillIds.reduce((sum, id) => sum + this.getEffectiveLevel(id), 0);
    };
    
    switch (skillId) {
      case 'neutron_basics':
      case 'atom_basics':
      case 'chain_basics':
      case 'resource_basics':
      case 'economy_basics':
      case 'special_atom_basics':
        break;

      case 'neutron_count_1':
      case 'neutron_count_2':
      case 'neutron_count_3':
        const neutronCount = 2 + getTotalLevels(['neutron_count_1', 'neutron_count_2', 'neutron_count_3']);
        gameState.updateUpgrade('neutronCountPlayer', neutronCount);
        break;

      case 'neutron_speed_1':
      case 'neutron_speed_2':
        const speedLevels = getTotalLevels(['neutron_speed_1', 'neutron_speed_2']);
        const neutronSpeed = 1 + speedLevels * 0.1;
        gameState.updateUpgrade('neutronSpeed', neutronSpeed);
        break;

      case 'neutron_lifetime_1':
      case 'neutron_lifetime_2':
        const lifetimeLevels = getTotalLevels(['neutron_lifetime_1', 'neutron_lifetime_2']);
        const neutronLifetime = 1 + lifetimeLevels * 0.2;
        gameState.updateUpgrade('neutronLifetime', neutronLifetime);
        break;

      case 'neutron_size_1':
        const neutronSize = 1 + totalLevel * 0.15;
        gameState.updateUpgrade('neutronSize', neutronSize);
        break;

      case 'neutron_pierce':
        const pierce = totalLevel * 5;
        gameState.updateUpgrade('pierce', pierce);
        break;

      case 'neutron_homing':
        gameState.updateUpgrade('homing', totalLevel);
        break;

      case 'atom_spawn_rate_1':
      case 'atom_spawn_rate_2':
        const spawnLevels = getTotalLevels(['atom_spawn_rate_1', 'atom_spawn_rate_2']);
        const atomSpawnRate = 1 + spawnLevels * 0.1;
        gameState.updateUpgrade('atomSpawnRate', atomSpawnRate);
        break;

      case 'atom_size_1':
        const atomSize = 1 + totalLevel * 0.15;
        gameState.updateUpgrade('atomSize', atomSize);
        break;

      case 'atom_lifetime_1':
        const atomLifetime = 1 + totalLevel * 0.25;
        gameState.updateUpgrade('atomLifetime', atomLifetime);
        break;

      case 'atom_neutron_count_1':
      case 'atom_neutron_count_2':
      case 'atom_neutron_count_3':
        const neutronCountAtom = 2 + getTotalLevels(['atom_neutron_count_1', 'atom_neutron_count_2', 'atom_neutron_count_3']);
        gameState.updateUpgrade('neutronCountAtom', neutronCountAtom);
        break;

      case 'chain_multiplier_1':
      case 'chain_multiplier_2':
      case 'chain_multiplier_3':
        const chainLevels = getTotalLevels(['chain_multiplier_1', 'chain_multiplier_2', 'chain_multiplier_3']);
        const chainMultiplier = 1 + chainLevels * 0.2;
        gameState.updateUpgrade('chainMultiplier', chainMultiplier);
        break;

      case 'momentum':
        gameState.updateUpgrade('momentum', totalLevel);
        break;

      case 'neutron_reflector':
        const reflector = totalLevel * 10;
        gameState.updateUpgrade('neutronReflector', reflector);
        break;

      case 'max_clicks_1':
      case 'max_clicks_2':
      case 'max_clicks_3':
      case 'max_clicks_4':
        const clickLevels = getTotalLevels(['max_clicks_1', 'max_clicks_2', 'max_clicks_3', 'max_clicks_4']);
        const maxClicks = 2 + clickLevels;
        gameState.updateResourceCaps(maxClicks, undefined);
        break;

      case 'max_time_1':
      case 'max_time_2':
      case 'max_time_3':
      case 'max_time_4':
        const timeLevels = getTotalLevels(['max_time_1', 'max_time_2', 'max_time_3', 'max_time_4']);
        const maxTime = 10 + timeLevels * 2;
        gameState.updateResourceCaps(undefined, maxTime);
        break;

      case 'ultimate_neutron':
        if (totalLevel > 0) {
          const currentNeutronCount = gameState.getState().upgrades.neutronCountPlayer;
          const currentNeutronSpeed = gameState.getState().upgrades.neutronSpeed;
          gameState.updateUpgrade('neutronCountPlayer', currentNeutronCount + 2);
          gameState.updateUpgrade('neutronSpeed', currentNeutronSpeed * 1.5);
        }
        break;

      case 'ultimate_atom':
        if (totalLevel > 0) {
          const currentAtomNeutrons = gameState.getState().upgrades.neutronCountAtom;
          const currentAtomSpawn = gameState.getState().upgrades.atomSpawnRate;
          gameState.updateUpgrade('neutronCountAtom', currentAtomNeutrons + 2);
          gameState.updateUpgrade('atomSpawnRate', currentAtomSpawn * 1.5);
        }
        break;

      case 'ultimate_chain':
        if (totalLevel > 0) {
          const currentChainMult = gameState.getState().upgrades.chainMultiplier;
          gameState.updateUpgrade('chainMultiplier', currentChainMult + 1.0);
          gameState.updateUpgrade('momentum', 1);
        }
        break;

      case 'ultimate_resource':
        if (totalLevel > 0) {
          const currentMaxClicks = gameState.getState().maxClicks;
          const currentMaxTime = gameState.getState().maxTime;
          gameState.updateResourceCaps(currentMaxClicks + 2, currentMaxTime + 5);
        }
        break;

      case 'critical_neutron_unlock':
        if (totalLevel > 0) {
          gameState.updateUpgrade('critChance', 5);
        }
        break;

      case 'critical_neutron_chance_1':
        const critChance = 5 + totalLevel * 1;
        gameState.updateUpgrade('critChance', critChance);
        break;

      case 'critical_neutron_effect_1':
        if (totalLevel > 0) {
          gameState.updateUpgrade('critDoublNeutrons', 1);
        }
        break;

      case 'atom_shockwave_unlock':
        if (totalLevel > 0) {
          gameState.updateUpgrade('atomShockwave', 1);
        }
        break;

      case 'atom_shockwave_force_1':
        const shockwaveForce = 1 + totalLevel * 0.1;
        gameState.updateUpgrade('atomShockwaveForce', shockwaveForce);
        break;

      case 'click_shockwave_unlock':
        if (totalLevel > 0) {
          gameState.updateUpgrade('clickShockwave', 1);
        }
        break;

      case 'click_shockwave_radius_1':
        const clickRadius = 1 + totalLevel * 0.1;
        gameState.updateUpgrade('clickShockwaveRadius', clickRadius);
        break;

      case 'base_coin_value_1':
        const coinValue1 = totalLevel * 1;
        gameState.updateUpgrade('baseCoinValue', coinValue1);
        break;

      case 'base_coin_value_2':
        const coinValue2 = getTotalLevels(['base_coin_value_1']) * 1 + totalLevel * 2;
        gameState.updateUpgrade('baseCoinValue', coinValue2);
        break;

      case 'skill_cost_reduction_1':
        const costReduction = totalLevel * 1;
        gameState.updateUpgrade('skillCostReduction', costReduction);
        break;

      case 'starting_coins_1':
        const startCoins = totalLevel * 50;
        gameState.updateUpgrade('startingCoins', startCoins);
        break;

      case 'ultimate_economy':
        if (totalLevel > 0) {
          gameState.updateUpgrade('economyMastery', 1);
        }
        break;

      case 'unlock_time_atoms':
        if (totalLevel > 0) {
          gameState.updateUpgrade('timeAtomsUnlocked', 1);
        }
        break;

      case 'time_atom_chance_1':
        const timeChance = totalLevel * 0.5;
        gameState.updateUpgrade('timeAtomChance', timeChance);
        break;

      case 'time_atom_value_1':
        const timeBonus = 0.5 + totalLevel * 2;
        gameState.updateUpgrade('timeAtomBonus', timeBonus);
        break;

      case 'time_atom_coins_1':
        const timeCoins = totalLevel * 5;
        gameState.updateUpgrade('timeAtomCoins', timeCoins);
        break;

      case 'unlock_supernova_atoms':
        if (totalLevel > 0) {
          gameState.updateUpgrade('supernovaUnlocked', 1);
        }
        break;

      case 'supernova_atom_chance_1':
        const supernovaChance = totalLevel * 0.2;
        gameState.updateUpgrade('supernovaChance', supernovaChance);
        break;

      case 'supernova_atom_neutrons_1':
        const supernovaNeutrons = 10 + totalLevel * 2;
        gameState.updateUpgrade('supernovaNeutrons', supernovaNeutrons);
        break;

      case 'supernova_atom_coins_1':
        const supernovaCoins = totalLevel * 25;
        gameState.updateUpgrade('supernovaCoins', supernovaCoins);
        break;

      case 'unlock_black_hole_atoms':
        if (totalLevel > 0) {
          gameState.updateUpgrade('blackHoleUnlocked', 1);
        }
        break;

      case 'black_hole_atom_chance_1':
        const blackHoleChance = totalLevel * 0.1;
        gameState.updateUpgrade('blackHoleChance', blackHoleChance);
        break;

      case 'black_hole_pull_radius_1':
        const blackHoleRadius = 1 + totalLevel * 0.1;
        gameState.updateUpgrade('blackHolePullRadius', blackHoleRadius);
        break;

      case 'black_hole_atom_coins_1':
        const blackHoleCoins = totalLevel * 15;
        gameState.updateUpgrade('blackHoleCoins', blackHoleCoins);
        break;

      case 'black_hole_spawn_atoms_1':
        const spawnAtoms = totalLevel;
        gameState.updateUpgrade('blackHoleSpawnAtoms', spawnAtoms);
        break;

      case 'ultimate_fission':
        if (totalLevel > 0) {
          gameState.updateUpgrade('fissionMastery', 1);
        }
        break;
    }
  }

  private purchaseSkill(skillId: string): void {
    const skill = this.skills.get(skillId);
    if (!skill) return;

    const effectiveLevel = this.getEffectiveLevel(skillId);
    const isUnlocked = this.isEffectivelyUnlocked(skillId);

    if (!isUnlocked || effectiveLevel >= skill.maxLevel) return;

    const cost = Math.floor(skill.baseCost * Math.pow(skill.costMultiplier, effectiveLevel));
    const state = gameState.getState();

    if (state.coins < cost) {
      audioManager.playSFX(AudioType.SFX_CLICK);
      return;
    }

    if (gameState.deductCoins(cost)) {
      const session = this.sessionSkills.get(skillId) ?? { currentLevel: 0, unlocked: false };
      session.currentLevel++;
      this.sessionSkills.set(skillId, session);

      if (effectiveLevel === 0 && skill.connectedNodes) {
        skill.connectedNodes.forEach(connectedId => {
          const sessionConnected = this.sessionSkills.get(connectedId) ?? { currentLevel: 0, unlocked: false };
          sessionConnected.unlocked = true;
          this.sessionSkills.set(connectedId, sessionConnected);
        });
      }

      this.applySkillEffect(skillId, this.getEffectiveLevel(skillId));

      this.clickedNodes.set(skillId, Date.now());

      const coinsDisplay = document.getElementById('coins-value');
      if (coinsDisplay) {
        coinsDisplay.textContent = gameState.getState().coins.toString();
      }

      audioManager.playSFX(AudioType.SKILLTREE_PURCHASE);
      gameState.saveGame();
      
      console.log(`[SkillTree] Purchased ${skillId} - New effective level: ${this.getEffectiveLevel(skillId)}`);
    }
  }

  private showResetConfirmation(): void {
    const state = gameState.getState();
    const metaEarned = state.rank;
    
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
            <span class="meta-value">+${metaEarned} <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline;vertical-align:middle;margin-left:4px"><path d="M12 12h.01"/><path d="M7.5 4.2c-.3-.5-.9-.7-1.3-.4C3.9 5.5 2.3 8.1 2 11c-.1.5.4 1 1 1h5c0-1.5.8-2.8 2-3.4-1.1-1.9-2-3.5-2.5-4.4z"/><path d="M21 12c.6 0 1-.4 1-1-.3-2.9-1.8-5.5-4.1-7.1-.4-.3-1.1-.2-1.3.3-.6.9-1.5 2.5-2.6 4.3 1.2.7 2 2 2 3.5h5z"/><path d="M7.5 19.8c-.3.5-.1 1.1.4 1.3 2.6 1.2 5.6 1.2 8.2 0 .5-.2.7-.8.4-1.3-.5-.9-1.4-2.5-2.5-4.3-1.2.7-2.8.7-4 0-1.1 1.8-2 3.4-2.5 4.3z"/></svg></span>
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

  reattach(container: HTMLElement): void {
    this.container = container;
    this.render();
    console.log('[SkillTree] Reattached to container with session skills preserved');
  }

  destroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    window.removeEventListener('resize', this.resizeCanvas);
  }
}