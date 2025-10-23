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
  
  // Session-only skill upgrades (reset when returning to home)
  private sessionSkills: Map<string, { currentLevel: number; unlocked: boolean }> = new Map();
  
  // Pan and Zoom
  private offsetX: number = 0;
  private offsetY: number = 0;
  private scale: number = 1;
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;
  private saveTimeout: number | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.loadSkillTree();
  }

  private async loadSkillTree(): Promise<void> {
    try {
      const response = await fetch('/assets/data/skilltree.json');
      this.skillTreeData = await response.json();
      this.initializeSkills();
      this.render();
    } catch (error) {
      console.error('[SkillTree] Failed to load skilltree.json:', error);
      this.container.innerHTML = '<div class="error">Failed to load skill tree</div>';
    }
  }

  private initializeSkills(): void {
    if (!this.skillTreeData) return;

    // Initialize all skills with connectedNodes array
    Object.values(this.skillTreeData).forEach(skillData => {
      this.skills.set(skillData.id, { ...skillData, connectedNodes: [] });
    });

    // Define parent-child relationships (same as SkillTreeManager)
    this.defineConnections();
    this.calculateDepths();
  }

  private defineConnections(): void {
    const connections: { [key: string]: string[] } = {
      'root': ['neutron_basics', 'atom_basics', 'chain_basics', 'resource_basics'],
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

    // Apply connections
    Object.entries(connections).forEach(([parentId, children]) => {
      const parent = this.skills.get(parentId);
      if (parent) {
        parent.connectedNodes = children;
      }
    });
  }

  /**
   * Get effective skill level (base + session)
   */
  private getEffectiveLevel(skillId: string): number {
    const skill = this.skills.get(skillId);
    if (!skill) return 0;
    
    const session = this.sessionSkills.get(skillId);
    const baseLevel = skill.currentLevel;
    const sessionLevel = session?.currentLevel ?? 0;
    
    return baseLevel + sessionLevel;
  }

  /**
   * Get effective unlock state (base || session)
   */
  private isEffectivelyUnlocked(skillId: string): boolean {
    const skill = this.skills.get(skillId);
    if (!skill) return false;
    
    const session = this.sessionSkills.get(skillId);
    return skill.unlocked || (session?.unlocked ?? false);
  }

  /**
   * Reset session skills (called when returning to home)
   */
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
    // Use icon from JSON if available
    if (skill.icon) return skill.icon;
    
    // Fallback icons based on id
    const id = skill.id;
    if (id === 'root') return '⚛️';
    if (id.includes('neutron')) return '�';
    if (id.includes('atom')) return '⚡';
    if (id.includes('chain')) return '�';
    if (id.includes('click')) return '👆';
    if (id.includes('time')) return '⏱️';
    if (id.includes('ultimate')) return '🌟';
    return '⭐';
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="skilltree-page">
        <div class="skilltree-header">
          <button class="header-btn" id="back-btn">← Home Screen</button>
          <h1 class="skilltree-title">Skill Tree</h1>
          <div class="skilltree-controls">
            <button class="zoom-btn" id="zoom-in">+</button>
            <button class="zoom-btn" id="zoom-out">−</button>
            <button class="zoom-btn" id="zoom-reset">Reset</button>
          </div>
          <div class="coins-info">
            <span class="coins-icon">💰</span>
            <span class="coins-value" id="coins-value">${gameState.getState().coins}</span>
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
      this.calculateOptimizedLayout(); // Calculate positions first
      this.setupEventListeners();
      this.centerView();
      this.draw();
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

  private draw(): void {
    if (!this.canvas || !this.ctx) return;

    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Save context and apply transformations
    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);

    this.calculateOptimizedLayout();

    const nodeRadius = 35;

    // Only get visible nodes (root + purchased nodes' children)
    const visibleNodes = this.getVisibleNodes();

    // Draw connections only for visible nodes
    visibleNodes.forEach(skill => {
      if (!skill.connectedNodes) return;
      
      skill.connectedNodes.forEach(connectedId => {
        const connected = this.skills.get(connectedId);
        if (!connected || !visibleNodes.has(connected) || !skill.x || !skill.y || !connected.x || !connected.y) return;

        ctx.beginPath();
        ctx.moveTo(skill.x, skill.y);
        ctx.lineTo(connected.x, connected.y);

        // Use effective levels for connection styling
        const skillEffectiveLevel = this.getEffectiveLevel(skill.id);
        const connectedEffectivelyUnlocked = this.isEffectivelyUnlocked(connectedId);

        if (skillEffectiveLevel > 0 && connectedEffectivelyUnlocked) {
          ctx.strokeStyle = 'rgba(0, 255, 170, 0.7)';
          ctx.lineWidth = 3;
        } else if (connectedEffectivelyUnlocked) {
          ctx.strokeStyle = 'rgba(79, 172, 254, 0.6)';
          ctx.lineWidth = 2.5;
        } else {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.lineWidth = 2;
        }

        ctx.stroke();
      });
    });

    // Draw only visible nodes
    visibleNodes.forEach(skill => {
      if (!skill.x || !skill.y) return;

      // Use effective level for rendering
      const effectiveLevel = this.getEffectiveLevel(skill.id);
      const isEffectivelyUnlocked = this.isEffectivelyUnlocked(skill.id);
      const isPurchased = effectiveLevel > 0;
      const isMaxed = effectiveLevel >= skill.maxLevel;

      ctx.beginPath();
      ctx.arc(skill.x, skill.y, nodeRadius, 0, Math.PI * 2);

      if (isMaxed) {
        ctx.fillStyle = 'rgba(255, 215, 0, 0.95)';
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 5;
        ctx.shadowBlur = 20;
        ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
      } else if (isPurchased) {
        ctx.fillStyle = 'rgba(0, 255, 170, 0.95)';
        ctx.strokeStyle = '#00ffaa';
        ctx.lineWidth = 4;
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(0, 255, 170, 0.6)';
      } else if (isEffectivelyUnlocked) {
        ctx.fillStyle = 'rgba(79, 172, 254, 0.95)';
        ctx.strokeStyle = '#4facfe';
        ctx.lineWidth = 4;
        ctx.shadowBlur = 20;
        ctx.shadowColor = 'rgba(79, 172, 254, 0.7)';
      } else {
        ctx.fillStyle = 'rgba(80, 80, 80, 0.9)';
        ctx.strokeStyle = 'rgba(120, 120, 120, 0.7)';
        ctx.lineWidth = 3;
      }

      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      skill.radius = nodeRadius;

      // Icon
      const icon = this.getSkillIcon(skill);
      const fontSize = nodeRadius * 0.9;
      ctx.font = `${fontSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isEffectivelyUnlocked ? '#fff' : 'rgba(180, 180, 180, 0.6)';
      ctx.fillText(icon, skill.x, skill.y);

      // Level indicator
      if (isPurchased) {
        const levelText = `${effectiveLevel}/${skill.maxLevel}`;
        const levelFontSize = nodeRadius * 0.4;
        ctx.font = `bold ${levelFontSize}px Arial`;
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.lineWidth = 3;
        ctx.strokeText(levelText, skill.x, skill.y + nodeRadius + 15);
        ctx.fillText(levelText, skill.x, skill.y + nodeRadius + 15);
      }
    });

    ctx.restore();
  }

  private getVisibleNodes(): Set<SkillNode> {
    const visible = new Set<SkillNode>();
    const root = this.skills.get('root');
    
    if (!root) return visible;

    // Always show root
    visible.add(root);

    // BFS to find all visible nodes
    const queue: SkillNode[] = [root];
    const processed = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (processed.has(current.id)) continue;
      processed.add(current.id);

      // If current node is purchased (use effective level), show its connected nodes
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

    // Fixed positions for all nodes to prevent any overlap
    const positions: { [key: string]: { x: number; y: number } } = {
      // Root node
      'root': { x: 200, y: 2500 },
      
      // Path unlocks (column 1) - spread out more vertically
      'neutron_basics': { x: 700, y: 400 },
      'atom_basics': { x: 700, y: 1400 },
      'chain_basics': { x: 700, y: 2400 },
      'resource_basics': { x: 700, y: 3400 },
      'economy_basics': { x: 700, y: 4400 },
      'special_atom_basics': { x: 700, y: 5400 },
      
      // Neutron path (rows 1-4)
      'neutron_count_1': { x: 1200, y: 150 },
      'neutron_count_2': { x: 1700, y: 150 },
      'neutron_count_3': { x: 2200, y: 150 },
      
      'neutron_speed_1': { x: 1200, y: 300 },
      'neutron_speed_2': { x: 1700, y: 300 },
      'neutron_pierce': { x: 2200, y: 300 },
      
      'neutron_lifetime_1': { x: 1200, y: 450 },
      'neutron_lifetime_2': { x: 1700, y: 450 },
      'neutron_homing': { x: 2200, y: 450 },
      
      'neutron_size_1': { x: 1200, y: 600 },
      
      // Critical neutron system
      'critical_neutron_unlock': { x: 1200, y: 800 },
      'critical_neutron_chance_1': { x: 1700, y: 750 },
      'critical_neutron_effect_1': { x: 1700, y: 900 },
      
      // Atom path
      'atom_spawn_rate_1': { x: 1200, y: 1200 },
      'atom_spawn_rate_2': { x: 1700, y: 1200 },
      
      'atom_size_1': { x: 1200, y: 1350 },
      
      'atom_lifetime_1': { x: 1200, y: 1500 },
      
      'atom_neutron_count_1': { x: 1200, y: 1650 },
      'atom_neutron_count_2': { x: 1700, y: 1650 },
      'atom_neutron_count_3': { x: 2200, y: 1650 },
      
      // Atom shockwave system
      'atom_shockwave_unlock': { x: 1200, y: 1850 },
      'atom_shockwave_force_1': { x: 1700, y: 1850 },
      
      // Chain path
      'chain_multiplier_1': { x: 1200, y: 2200 },
      'chain_multiplier_2': { x: 1700, y: 2200 },
      'chain_multiplier_3': { x: 2200, y: 2200 },
      
      'momentum': { x: 1700, y: 2400 },
      'neutron_reflector': { x: 1200, y: 2600 },
      
      // Resource path
      'max_clicks_1': { x: 1200, y: 3200 },
      'max_clicks_2': { x: 1700, y: 3200 },
      'max_clicks_3': { x: 2200, y: 3200 },
      'max_clicks_4': { x: 2700, y: 3200 },
      
      'max_time_1': { x: 1200, y: 3400 },
      'max_time_2': { x: 1700, y: 3400 },
      'max_time_3': { x: 2200, y: 3400 },
      'max_time_4': { x: 2700, y: 3400 },
      
      // Click shockwave system
      'click_shockwave_unlock': { x: 1200, y: 3650 },
      'click_shockwave_radius_1': { x: 1700, y: 3650 },
      
      // Economy path
      'base_coin_value_1': { x: 1200, y: 4200 },
      'base_coin_value_2': { x: 1700, y: 4200 },
      
      'skill_cost_reduction_1': { x: 1200, y: 4400 },
      
      'starting_coins_1': { x: 1200, y: 4600 },
      
      // Special atoms path - Time atoms
      'unlock_time_atoms': { x: 1200, y: 5200 },
      'time_atom_chance_1': { x: 1700, y: 5100 },
      'time_atom_value_1': { x: 1700, y: 5300 },
      
      // Special atoms path - Supernova
      'unlock_supernova_atoms': { x: 1200, y: 5500 },
      'supernova_atom_chance_1': { x: 1700, y: 5400 },
      'supernova_atom_neutrons_1': { x: 1700, y: 5600 },
      
      // Special atoms path - Black Hole
      'unlock_black_hole_atoms': { x: 1200, y: 5800 },
      'black_hole_atom_chance_1': { x: 1700, y: 5700 },
      'black_hole_pull_radius_1': { x: 1700, y: 5900 },
      
      // Ultimates (far right column)
      'ultimate_neutron': { x: 3200, y: 600 },
      'ultimate_atom': { x: 3200, y: 1500 },
      'ultimate_chain': { x: 3200, y: 2400 },
      'ultimate_resource': { x: 3200, y: 3400 },
      'ultimate_economy': { x: 3200, y: 4400 },
      'ultimate_fission': { x: 3200, y: 5500 },
    };

    // Apply positions
    this.skills.forEach((skill, id) => {
      const pos = positions[id];
      if (pos) {
        skill.x = pos.x;
        skill.y = pos.y;
      } else {
        // Fallback for any missing nodes
        console.warn(`[SkillTree] No position defined for ${id}`);
        skill.x = 500;
        skill.y = 500;
      }
    });
  }

  private centerView(): void {
    if (!this.canvas) return;

    // Load saved camera position from game state
    const state = gameState.getState();
    const savedCamera = (state as any).skillTreeCamera;

    if (savedCamera && savedCamera.offsetX !== undefined) {
      // Restore previous position and zoom
      this.offsetX = savedCamera.offsetX;
      this.offsetY = savedCamera.offsetY;
      this.scale = savedCamera.scale;
      console.log('[SkillTree] Restored camera:', savedCamera);
    } else {
      // First time - center on the middle of the visible tree
      // Tree spans roughly from x:200 to x:3200, y:150 to y:5900
      const treeCenterX = 1700; // Middle of tree
      const treeCenterY = 3000; // Middle of tree
      
      // Start with smaller scale to see full tree
      this.scale = 0.3;
      
      this.offsetX = this.canvas.width / 2 - treeCenterX * this.scale;
      this.offsetY = this.canvas.height / 2 - treeCenterY * this.scale;
      
      console.log('[SkillTree] Centered on tree overview:', { scale: this.scale });
      
      // Save initial position
      this.saveCameraPosition();
    }
  }

  private saveCameraPosition(): void {
    // Debounce saves to avoid too many writes
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
    }, 500); // Save 500ms after last change
  }

  private setupEventListeners(): void {
    const backBtn = document.getElementById('back-btn');
    backBtn?.addEventListener('click', () => {
      audioManager.playSFX(AudioType.SFX_CLICK);
      this.showResetConfirmation();
    });

    const playBtn = document.getElementById('play-btn');
    playBtn?.addEventListener('click', () => {
      audioManager.playSFX(AudioType.SFX_CLICK);
      NavigationManager.navigateTo('game');
    });

    // Zoom controls
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
      
      // Reset to center on root node
      const root = this.skills.get('root');
      if (root && root.x && root.y && this.canvas) {
        this.offsetX = this.canvas.width / 2 - root.x * this.scale;
        this.offsetY = this.canvas.height / 2 - root.y * this.scale;
      }
      
      this.draw();
      this.saveCameraPosition();
    });

    if (this.canvas) {
      // Mouse wheel zoom
      this.canvas.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });
      
      // Click
      this.canvas.addEventListener('click', (e) => this.handleClick(e));
      
      // Hover
      this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
      this.canvas.addEventListener('mouseleave', () => {
        this.hideTooltip();
        this.isDragging = false;
      });

      // Pan controls
      this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
      this.canvas.addEventListener('mouseup', () => {
        if (this.isDragging) {
          this.isDragging = false;
          // Save immediately when drag ends
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

    // Zoom towards mouse position if provided
    if (mouseX !== undefined && mouseY !== undefined) {
      const rect = this.canvas.getBoundingClientRect();
      const canvasX = mouseX - rect.left;
      const canvasY = mouseY - rect.top;

      this.offsetX = canvasX - (canvasX - this.offsetX) * (this.scale / oldScale);
      this.offsetY = canvasY - (canvasY - this.offsetY) * (this.scale / oldScale);
    }

    this.draw();
    
    // Save immediately after zoom
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
    if (e.button === 0) { // Left mouse button
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
      
      // Debounced save while dragging
      this.saveCameraPosition();
    } else {
      this.handleHover(e);
    }
  }

  private handleClick(e: MouseEvent): void {
    if (this.isDragging) return; // Don't click if we were dragging
    
    const skill = this.getSkillAtPoint(e);
    if (skill) {
      // Use effective values for session-aware checking
      const isUnlocked = this.isEffectivelyUnlocked(skill.id);
      const effectiveLevel = this.getEffectiveLevel(skill.id);
      
      if (isUnlocked && effectiveLevel < skill.maxLevel) {
        this.purchaseSkill(skill.id);
      }
    }
  }

  private handleHover(e: MouseEvent): void {
    const skill = this.getSkillAtPoint(e);
    skill ? this.showTooltip(skill, e.clientX, e.clientY) : this.hideTooltip();
  }

  private getSkillAtPoint(e: MouseEvent): SkillNode | null {
    if (!this.canvas) return null;

    const rect = this.canvas.getBoundingClientRect();
    
    // Transform mouse coordinates to world space
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;
    
    const worldX = (canvasX - this.offsetX) / this.scale;
    const worldY = (canvasY - this.offsetY) / this.scale;

    // Only check visible nodes
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
    
    // Show session progress if any
    const session = this.sessionSkills.get(skill.id);
    const sessionLevel = session?.currentLevel ?? 0;
    const baseLevel = skill.currentLevel;
    const levelDisplay = sessionLevel > 0 
      ? `${baseLevel} + ${sessionLevel} = ${effectiveLevel}/${skill.maxLevel}`
      : `${effectiveLevel}/${skill.maxLevel}`;

    this.tooltip.innerHTML = `
      <div class="tooltip-header">
        <span class="tooltip-icon">${this.getSkillIcon(skill)}</span>
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

    // Show tooltip temporarily to get dimensions
    this.tooltip.classList.remove('hidden');
    const tooltipRect = this.tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let left = mouseX + 15;
    let top = mouseY + 15;

    // Check right edge
    if (left + tooltipRect.width > viewportWidth - 20) {
      left = mouseX - tooltipRect.width - 15;
    }

    // Check bottom edge
    if (top + tooltipRect.height > viewportHeight - 20) {
      top = mouseY - tooltipRect.height - 15;
    }

    // Ensure not off left edge
    if (left < 20) {
      left = 20;
    }

    // Ensure not off top edge
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

  /**
   * Apply skill effects to game state
   */
  private applySkillEffect(skillId: string, totalLevel: number): void {
    // Helper to get total levels across multiple skills
    const getTotalLevels = (skillIds: string[]): number => {
      return skillIds.reduce((sum, id) => sum + this.getEffectiveLevel(id), 0);
    };
    
    switch (skillId) {
      // Path unlocks (no game effect, just unlock connected nodes)
      case 'neutron_basics':
      case 'atom_basics':
      case 'chain_basics':
      case 'resource_basics':
      case 'economy_basics':
      case 'special_atom_basics':
        // These are just unlock nodes, no direct effect
        break;

      // Neutron count upgrades
      case 'neutron_count_1':
      case 'neutron_count_2':
      case 'neutron_count_3':
        const neutronCount = 2 + getTotalLevels(['neutron_count_1', 'neutron_count_2', 'neutron_count_3']);
        gameState.updateUpgrade('neutronCountPlayer', neutronCount);
        break;

      // Neutron speed upgrades
      case 'neutron_speed_1':
      case 'neutron_speed_2':
        const speedLevels = getTotalLevels(['neutron_speed_1', 'neutron_speed_2']);
        const neutronSpeed = 1 + speedLevels * 0.1;
        gameState.updateUpgrade('neutronSpeed', neutronSpeed);
        break;

      // Neutron lifetime upgrades
      case 'neutron_lifetime_1':
      case 'neutron_lifetime_2':
        const lifetimeLevels = getTotalLevels(['neutron_lifetime_1', 'neutron_lifetime_2']);
        const neutronLifetime = 1 + lifetimeLevels * 0.2;
        gameState.updateUpgrade('neutronLifetime', neutronLifetime);
        break;

      // Neutron size
      case 'neutron_size_1':
        const neutronSize = 1 + totalLevel * 0.15;
        gameState.updateUpgrade('neutronSize', neutronSize);
        break;

      // Pierce
      case 'neutron_pierce':
        const pierce = totalLevel * 5;
        gameState.updateUpgrade('pierce', pierce);
        break;

      // Homing
      case 'neutron_homing':
        gameState.updateUpgrade('homing', totalLevel);
        break;

      // Atom spawn rate
      case 'atom_spawn_rate_1':
      case 'atom_spawn_rate_2':
        const spawnLevels = getTotalLevels(['atom_spawn_rate_1', 'atom_spawn_rate_2']);
        const atomSpawnRate = 1 + spawnLevels * 0.1;
        gameState.updateUpgrade('atomSpawnRate', atomSpawnRate);
        break;

      // Atom size
      case 'atom_size_1':
        const atomSize = 1 + totalLevel * 0.15;
        gameState.updateUpgrade('atomSize', atomSize);
        break;

      // Atom lifetime
      case 'atom_lifetime_1':
        const atomLifetime = 1 + totalLevel * 0.25;
        gameState.updateUpgrade('atomLifetime', atomLifetime);
        break;

      // Atom neutron count
      case 'atom_neutron_count_1':
      case 'atom_neutron_count_2':
      case 'atom_neutron_count_3':
        const neutronCountAtom = 2 + getTotalLevels(['atom_neutron_count_1', 'atom_neutron_count_2', 'atom_neutron_count_3']);
        gameState.updateUpgrade('neutronCountAtom', neutronCountAtom);
        break;

      // Chain multiplier
      case 'chain_multiplier_1':
      case 'chain_multiplier_2':
      case 'chain_multiplier_3':
        const chainLevels = getTotalLevels(['chain_multiplier_1', 'chain_multiplier_2', 'chain_multiplier_3']);
        const chainMultiplier = 1 + chainLevels * 0.2;
        gameState.updateUpgrade('chainMultiplier', chainMultiplier);
        break;

      // Momentum
      case 'momentum':
        gameState.updateUpgrade('momentum', totalLevel);
        break;

      // Reflector
      case 'neutron_reflector':
        const reflector = totalLevel * 10;
        gameState.updateUpgrade('neutronReflector', reflector);
        break;

      // Max clicks
      case 'max_clicks_1':
      case 'max_clicks_2':
      case 'max_clicks_3':
      case 'max_clicks_4':
        const clickLevels = getTotalLevels(['max_clicks_1', 'max_clicks_2', 'max_clicks_3', 'max_clicks_4']);
        const maxClicks = 2 + clickLevels;
        gameState.updateResourceCaps(maxClicks, undefined);
        break;

      // Max time
      case 'max_time_1':
      case 'max_time_2':
      case 'max_time_3':
      case 'max_time_4':
        const timeLevels = getTotalLevels(['max_time_1', 'max_time_2', 'max_time_3', 'max_time_4']);
        const maxTime = 10 + timeLevels * 2;
        gameState.updateResourceCaps(undefined, maxTime);
        break;

      // Ultimate Neutron
      case 'ultimate_neutron':
        if (totalLevel > 0) {
          const currentNeutronCount = gameState.getState().upgrades.neutronCountPlayer;
          const currentNeutronSpeed = gameState.getState().upgrades.neutronSpeed;
          gameState.updateUpgrade('neutronCountPlayer', currentNeutronCount + 2);
          gameState.updateUpgrade('neutronSpeed', currentNeutronSpeed * 1.5);
          console.log(`[SkillTree] Applied ultimate_neutron bonuses`);
        }
        break;

      // Ultimate Atom
      case 'ultimate_atom':
        if (totalLevel > 0) {
          const currentAtomNeutrons = gameState.getState().upgrades.neutronCountAtom;
          const currentAtomSpawn = gameState.getState().upgrades.atomSpawnRate;
          gameState.updateUpgrade('neutronCountAtom', currentAtomNeutrons + 2);
          gameState.updateUpgrade('atomSpawnRate', currentAtomSpawn * 1.5);
          console.log(`[SkillTree] Applied ultimate_atom bonuses`);
        }
        break;

      // Ultimate Chain
      case 'ultimate_chain':
        if (totalLevel > 0) {
          const currentChainMult = gameState.getState().upgrades.chainMultiplier;
          gameState.updateUpgrade('chainMultiplier', currentChainMult + 1.0);
          gameState.updateUpgrade('momentum', 1);
          console.log(`[SkillTree] Applied ultimate_chain bonuses`);
        }
        break;

      // Ultimate Resource
      case 'ultimate_resource':
        if (totalLevel > 0) {
          const currentMaxClicks = gameState.getState().maxClicks;
          const currentMaxTime = gameState.getState().maxTime;
          gameState.updateResourceCaps(currentMaxClicks + 2, currentMaxTime + 5);
          console.log(`[SkillTree] Applied ultimate_resource bonuses`);
        }
        break;

      // ===== CRITICAL HIT SYSTEM =====
      case 'critical_neutron_unlock':
        if (totalLevel > 0) {
          gameState.updateUpgrade('critChance', 5); // Base 5% crit chance
        }
        break;

      case 'critical_neutron_chance_1':
        const critChance = 5 + totalLevel * 1; // 5% base + 1% per level
        gameState.updateUpgrade('critChance', critChance);
        break;

      case 'critical_neutron_effect_1':
        if (totalLevel > 0) {
          gameState.updateUpgrade('critDoublNeutrons', 1);
        }
        break;

      // ===== SHOCKWAVE SYSTEMS =====
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

      // ===== ECONOMY SYSTEM =====
      case 'base_coin_value_1':
        const coinValue1 = totalLevel * 1; // +1 coin per level
        gameState.updateUpgrade('baseCoinValue', coinValue1);
        break;

      case 'base_coin_value_2':
        const coinValue2 = getTotalLevels(['base_coin_value_1']) * 1 + totalLevel * 2;
        gameState.updateUpgrade('baseCoinValue', coinValue2);
        break;

      case 'skill_cost_reduction_1':
        const costReduction = totalLevel * 1; // 1% per level
        gameState.updateUpgrade('skillCostReduction', costReduction);
        break;

      case 'starting_coins_1':
        const startCoins = totalLevel * 50; // +50 coins per level
        gameState.updateUpgrade('startingCoins', startCoins);
        break;

      case 'ultimate_economy':
        if (totalLevel > 0) {
          gameState.updateUpgrade('economyMastery', 1);
        }
        break;

      // ===== SPECIAL ATOM TYPES =====
      // Time Atoms
      case 'unlock_time_atoms':
        if (totalLevel > 0) {
          gameState.updateUpgrade('timeAtomsUnlocked', 1);
        }
        break;

      case 'time_atom_chance_1':
        const timeChance = totalLevel * 0.5; // 0.5% per level
        gameState.updateUpgrade('timeAtomChance', timeChance);
        break;

      case 'time_atom_value_1':
        const timeBonus = 0.5 + totalLevel * 0.25; // 0.5s base + 0.25s per level
        gameState.updateUpgrade('timeAtomBonus', timeBonus);
        break;

      // Supernova Atoms
      case 'unlock_supernova_atoms':
        if (totalLevel > 0) {
          gameState.updateUpgrade('supernovaUnlocked', 1);
        }
        break;

      case 'supernova_atom_chance_1':
        const supernovaChance = totalLevel * 0.2; // 0.2% per level
        gameState.updateUpgrade('supernovaChance', supernovaChance);
        break;

      case 'supernova_atom_neutrons_1':
        const supernovaNeutrons = 10 + totalLevel * 2; // 10 base + 2 per level
        gameState.updateUpgrade('supernovaNeutrons', supernovaNeutrons);
        break;

      // Black Hole Atoms (fissile explosive ones)
      case 'unlock_black_hole_atoms':
        if (totalLevel > 0) {
          gameState.updateUpgrade('blackHoleUnlocked', 1);
        }
        break;

      case 'black_hole_atom_chance_1':
        const blackHoleChance = totalLevel * 0.1; // 0.1% per level
        gameState.updateUpgrade('blackHoleChance', blackHoleChance);
        break;

      case 'black_hole_pull_radius_1':
        const blackHoleRadius = 1 + totalLevel * 0.1; // +10% per level
        gameState.updateUpgrade('blackHolePullRadius', blackHoleRadius);
        break;

      // Ultimate Fission
      case 'ultimate_fission':
        if (totalLevel > 0) {
          gameState.updateUpgrade('fissionMastery', 1);
          // 2x spawn rates and 50% more effective is applied in ReactionVisualizer
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

    // Calculate cost based on effective level
    const cost = Math.floor(skill.baseCost * Math.pow(skill.costMultiplier, effectiveLevel));
    const state = gameState.getState();

    if (state.coins < cost) {
      audioManager.playSFX(AudioType.SFX_CLICK);
      return;
    }

    if (gameState.deductCoins(cost)) {
      // Update session skills
      const session = this.sessionSkills.get(skillId) ?? { currentLevel: 0, unlocked: false };
      session.currentLevel++;
      this.sessionSkills.set(skillId, session);

      // Unlock connected nodes if this is first purchase
      if (effectiveLevel === 0 && skill.connectedNodes) {
        skill.connectedNodes.forEach(connectedId => {
          const sessionConnected = this.sessionSkills.get(connectedId) ?? { currentLevel: 0, unlocked: false };
          sessionConnected.unlocked = true;
          this.sessionSkills.set(connectedId, sessionConnected);
        });
      }

      // Apply the skill effect directly to game state
      this.applySkillEffect(skillId, this.getEffectiveLevel(skillId));

      // Update UI
      const coinsDisplay = document.getElementById('coins-value');
      if (coinsDisplay) {
        coinsDisplay.textContent = gameState.getState().coins.toString();
      }

      this.draw();
      audioManager.playSFX(AudioType.SFX_UPGRADE);
      gameState.saveGame();
      
      console.log(`[SkillTree] Purchased ${skillId} - New effective level: ${this.getEffectiveLevel(skillId)}, Applied to game state`);
    }
  }

  /**
   * Show confirmation dialog before resetting and going home
   */
  private showResetConfirmation(): void {
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

  /**
   * Reattach the skill tree to a new container (when navigating back)
   */
  reattach(container: HTMLElement): void {
    this.container = container;
    this.render();
    console.log('[SkillTree] Reattached to container with session skills preserved');
  }

  destroy(): void {
    // Cleanup
  }
}
