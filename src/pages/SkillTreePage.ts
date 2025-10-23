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
  private animationFrameId: number | null = null;
  private hoveredSkill: SkillNode | null = null;
  private clickedNodes: Map<string, number> = new Map(); // skillId -> timestamp

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
    return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 12h.01"/><path d="M7.5 4.2c-.3-.5-.9-.7-1.3-.4C3.9 5.5 2.3 8.1 2 11c-.1.5.4 1 1 1h5c0-1.5.8-2.8 2-3.4-1.1-1.9-2-3.5-2.5-4.4z"/><path d="M21 12c.6 0 1-.4 1-1-.3-2.9-1.8-5.5-4.1-7.1-.4-.3-1.1-.2-1.3.3-.6.9-1.5 2.5-2.6 4.3 1.2.7 2 2 2 3.5h5z"/><path d="M7.5 19.8c-.3.5-.1 1.1.4 1.3 2.6 1.2 5.6 1.2 8.2 0 .5-.2.7-.8.4-1.3-.5-.9-1.4-2.5-2.5-4.3-1.2.7-2.8.7-4 0-1.1 1.8-2 3.4-2.5 4.3z"/></svg>';
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

    // Save context and apply transformations
    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);

    this.calculateOptimizedLayout();

    const nodeRadius = 50; // Increased from 35 to 50

    // Only get visible nodes (root + purchased nodes' children)
    const visibleNodes = this.getVisibleNodes();
    
    // Get current coins for affordability checks
    const currentCoins = gameState.getState().coins;

    // Draw connections only for visible nodes
    visibleNodes.forEach(skill => {
      if (!skill.connectedNodes) return;
      
      skill.connectedNodes.forEach(connectedId => {
        const connected = this.skills.get(connectedId);
        if (!connected || !visibleNodes.has(connected) || !skill.x || !skill.y || !connected.x || !connected.y) return;

        // Use effective levels for connection styling
        const skillEffectiveLevel = this.getEffectiveLevel(skill.id);
        const connectedEffectiveLevel = this.getEffectiveLevel(connectedId);
        const connectedEffectivelyUnlocked = this.isEffectivelyUnlocked(connectedId);
        const bothMaxed = skillEffectiveLevel >= skill.maxLevel && connectedEffectiveLevel >= connected.maxLevel;

        // Draw glow for active connections
        if (skillEffectiveLevel > 0 && connectedEffectivelyUnlocked) {
          ctx.beginPath();
          ctx.moveTo(skill.x, skill.y);
          ctx.lineTo(connected.x, connected.y);
          
          // Cyan glow for all active connections (including maxed)
          ctx.strokeStyle = 'rgba(0, 255, 170, 0.2)';
          ctx.lineWidth = 6;
          ctx.stroke();
          ctx.strokeStyle = 'rgba(0, 255, 170, 0.7)';
          ctx.lineWidth = 3;
        } else if (connectedEffectivelyUnlocked) {
          // Blue for available
          ctx.beginPath();
          ctx.moveTo(skill.x, skill.y);
          ctx.lineTo(connected.x, connected.y);
          ctx.strokeStyle = 'rgba(79, 172, 254, 0.6)';
          ctx.lineWidth = 2.5;
        } else {
          // Dim for locked
          ctx.beginPath();
          ctx.moveTo(skill.x, skill.y);
          ctx.lineTo(connected.x, connected.y);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
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
      const isHovered = this.hoveredSkill?.id === skill.id;
      
      // Check if node is affordable
      const cost = Math.floor(skill.baseCost * Math.pow(skill.costMultiplier, effectiveLevel));
      const isAffordable = isEffectivelyUnlocked && !isMaxed && currentCoins >= cost;

      // Animated pulse for affordable nodes only
      const time = Date.now() / 1000;
      const pulseScale = isAffordable ? 1 + Math.sin(time * 3) * 0.05 : 1;
      const hoverScale = isHovered ? 1.15 : 1;
      
      // Click animation effect
      const clickTime = this.clickedNodes.get(skill.id);
      let clickScale = 1;
      if (clickTime) {
        const elapsed = Date.now() - clickTime;
        if (elapsed < 300) {
          // Bounce effect: 0 -> 1.3 -> 1
          const progress = elapsed / 300;
          clickScale = 1 + Math.sin(progress * Math.PI) * 0.3;
        } else {
          this.clickedNodes.delete(skill.id);
        }
      }
      
      const currentRadius = nodeRadius * pulseScale * hoverScale * clickScale;

      // Draw outer glow ring ONLY for affordable nodes
      if (isAffordable) {
        ctx.beginPath();
        ctx.arc(skill.x, skill.y, currentRadius + 12, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(skill.x, skill.y, currentRadius, skill.x, skill.y, currentRadius + 12);
        gradient.addColorStop(0, 'rgba(79, 172, 254, 0.6)');
        gradient.addColorStop(1, 'rgba(79, 172, 254, 0)');
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      // Main node circle with gradient
      ctx.beginPath();
      ctx.arc(skill.x, skill.y, currentRadius, 0, Math.PI * 2);

      if (isMaxed) {
        // Maxed: Same gradient as purchased nodes (cyan/green)
        const gradient = ctx.createRadialGradient(
          skill.x - currentRadius * 0.3, skill.y - currentRadius * 0.3, currentRadius * 0.1,
          skill.x, skill.y, currentRadius
        );
        gradient.addColorStop(0, '#6fffd2');
        gradient.addColorStop(0.6, '#00ffaa');
        gradient.addColorStop(1, '#00cc88');
        ctx.fillStyle = gradient;
        ctx.shadowBlur = 12;
        ctx.shadowColor = 'rgba(0, 255, 170, 0.5)';
        ctx.fill();
        
        // Green border for maxed (no glow, just solid green)
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 5;
        ctx.stroke();
      } else if (isPurchased) {
        // Purchased: Cyan/green gradient with glow
        const gradient = ctx.createRadialGradient(
          skill.x - currentRadius * 0.3, skill.y - currentRadius * 0.3, currentRadius * 0.1,
          skill.x, skill.y, currentRadius
        );
        gradient.addColorStop(0, '#6fffd2');
        gradient.addColorStop(0.6, '#00ffaa');
        gradient.addColorStop(1, '#00cc88');
        ctx.fillStyle = gradient;
        ctx.shadowBlur = 18;
        ctx.shadowColor = 'rgba(0, 255, 170, 0.7)';
        ctx.fill();
        
        ctx.strokeStyle = '#00ffaa';
        ctx.lineWidth = 4;
        ctx.stroke();
      } else if (isEffectivelyUnlocked) {
        // Available: Blue gradient with strong glow and pulse
        const gradient = ctx.createRadialGradient(
          skill.x - currentRadius * 0.3, skill.y - currentRadius * 0.3, currentRadius * 0.1,
          skill.x, skill.y, currentRadius
        );
        gradient.addColorStop(0, '#a5d8ff');
        gradient.addColorStop(0.5, '#4facfe');
        gradient.addColorStop(1, '#0077cc');
        ctx.fillStyle = gradient;
        ctx.shadowBlur = 22;
        ctx.shadowColor = 'rgba(79, 172, 254, 0.8)';
        ctx.fill();
        
        // Animated border
        ctx.strokeStyle = '#4facfe';
        ctx.lineWidth = 4;
        ctx.stroke();
        
        // Inner highlight
        ctx.beginPath();
        ctx.arc(skill.x - currentRadius * 0.25, skill.y - currentRadius * 0.25, currentRadius * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fill();
      } else {
        // Locked: Dark gradient
        const gradient = ctx.createRadialGradient(
          skill.x - currentRadius * 0.3, skill.y - currentRadius * 0.3, currentRadius * 0.1,
          skill.x, skill.y, currentRadius
        );
        gradient.addColorStop(0, 'rgba(100, 100, 100, 0.9)');
        gradient.addColorStop(1, 'rgba(60, 60, 60, 0.9)');
        ctx.fillStyle = gradient;
        ctx.shadowBlur = 5;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(120, 120, 120, 0.7)';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      
      ctx.shadowBlur = 0;
      skill.radius = currentRadius;

      // Icon with better styling
      const icon = this.getSkillIcon(skill);
      const fontSize = currentRadius * 0.85;
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Icon shadow for depth
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

      // Level indicator with better styling
      if (isPurchased) {
        const levelText = `${effectiveLevel}/${skill.maxLevel}`;
        const levelFontSize = currentRadius * 0.38;
        const levelY = skill.y + currentRadius + 18;
        
        // Background badge for level
        const textMetrics = ctx.measureText(levelText);
        const badgeWidth = textMetrics.width + 12;
        const badgeHeight = levelFontSize + 6;
        const badgeX = skill.x - badgeWidth / 2;
        const badgeY = levelY - levelFontSize / 2 - 3;
        
        ctx.fillStyle = isMaxed ? 'rgba(255, 215, 0, 0.3)' : 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 8);
        ctx.fill();
        
        // Level text
        ctx.font = `bold ${levelFontSize}px Arial`;
        ctx.fillStyle = isMaxed ? '#ffd700' : '#00ffaa';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.lineWidth = 3;
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

    // Grid-based layout for perfect positioning without overlaps
    // Grid cells: 150px spacing (horizontal and vertical)
    // Origin at (500, 500), grid extends in rows and columns
    
    const gridSize = 150; // Distance between grid cells
    const offsetX = 500;  // Starting X position
    const offsetY = 500;  // Starting Y position
    
    // Helper function to get grid position
    const grid = (col: number, row: number) => ({
      x: offsetX + col * gridSize,
      y: offsetY + row * gridSize
    });
    
    const positions: { [key: string]: { x: number; y: number } } = {
      // === ROW 0: Ultimate Neutron ===
      'ultimate_neutron': grid(6, 0),
      
      // === ROW 1-2: Neutron Path Upper Branches ===
      'neutron_homing': grid(3, 1),
      'neutron_lifetime_2': grid(4, 1),
      'neutron_pierce': grid(8, 1),
      'neutron_speed_2': grid(9, 1),
      
      'neutron_lifetime_1': grid(4, 2),
      'neutron_count_3': grid(6, 2),
      'neutron_speed_1': grid(8, 2),
      
      // === ROW 3: Time Atoms + Neutron Mid + Critical Neutron ===
      'time_atom_chance_1': grid(2, 3),
      'unlock_time_atoms': grid(3, 3),
      'time_atom_value_1': grid(4, 3),
      'neutron_size_1': grid(5, 3),
      'neutron_count_2': grid(6, 3),
      'critical_neutron_chance_1': grid(8, 3),
      'critical_neutron_effect_1': grid(9, 3),
      
      // === ROW 4: Special Atoms Path + Neutron Basics + Atom Upper ===
      'supernova_atom_chance_1': grid(1, 4),
      'unlock_supernova_atoms': grid(2, 4),
      'supernova_atom_neutrons_1': grid(3, 4),
      'special_atom_basics': grid(4, 4),
      'neutron_count_1': grid(6, 4),
      'critical_neutron_unlock': grid(8, 4),
      'atom_spawn_rate_2': grid(10, 4),
      'ultimate_fission': grid(0, 4),
      
      // === ROW 5: Neutron Basics + Atom Basics ===
      'black_hole_atom_chance_1': grid(2, 5),
      'black_hole_pull_radius_1': grid(3, 5),
      'neutron_basics': grid(6, 5),
      'atom_basics': grid(8, 5),
      'atom_spawn_rate_1': grid(9, 5),
      
      // === ROW 6: ROOT + Atom Mid Branch ===
      'unlock_black_hole_atoms': grid(3, 6),
      'root': grid(6, 6),
      'atom_size_1': grid(8, 6),
      'atom_neutron_count_1': grid(9, 6),
      'atom_neutron_count_2': grid(10, 6),
      'atom_neutron_count_3': grid(11, 6),
      
      // === ROW 7: Economy + Chain Basics + Atom Lower ===
      'base_coin_value_2': grid(2, 7),
      'base_coin_value_1': grid(3, 7),
      'economy_basics': grid(4, 7),
      'chain_basics': grid(8, 7),
      'atom_lifetime_1': grid(9, 7),
      'atom_shockwave_unlock': grid(10, 7),
      'atom_shockwave_force_1': grid(11, 7),
      'ultimate_atom': grid(12, 7),
      
      // === ROW 8: Economy Lower + Resource Basics + Chain Mid ===
      'starting_coins_1': grid(2, 8),
      'skill_cost_reduction_1': grid(3, 8),
      'resource_basics': grid(6, 8),
      'neutron_reflector': grid(7, 8),
      'chain_multiplier_1': grid(8, 8),
      'chain_multiplier_2': grid(9, 8),
      'chain_multiplier_3': grid(10, 8),
      'ultimate_economy': grid(0, 8),
      
      // === ROW 9: Click Shockwave + Clicks + Chain Lower ===
      'click_shockwave_unlock': grid(5, 9),
      'max_clicks_1': grid(6, 9),
      'max_time_1': grid(7, 9),
      'momentum': grid(9, 9),
      
      // === ROW 10: Clicks + Time Mid ===
      'click_shockwave_radius_1': grid(5, 10),
      'max_clicks_2': grid(6, 10),
      'max_time_2': grid(7, 10),
      'ultimate_chain': grid(10, 10),
      
      // === ROW 11: Clicks + Time Lower ===
      'max_clicks_3': grid(6, 11),
      'max_time_3': grid(7, 11),
      
      // === ROW 12: Clicks + Time Final ===
      'max_clicks_4': grid(6, 12),
      'max_time_4': grid(7, 12),
      
      // === ROW 13: Ultimate Resource ===
      'ultimate_resource': grid(6, 13),
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
      // First time - center on root node
      // Root is at grid(6, 6) = (500 + 6*150, 500 + 6*150) = (1400, 1400)
      // Grid spans from (500, 500) to (~2300, ~2450) - 14 rows x 13 cols
      const treeCenterX = 1400; // Root X position (grid col 6)
      const treeCenterY = 1400; // Root Y position (grid row 6)
      
      // Start with scale that shows entire tree
      this.scale = 0.5;
      
      this.offsetX = this.canvas.width / 2 - treeCenterX * this.scale;
      this.offsetY = this.canvas.height / 2 - treeCenterY * this.scale;
      
      console.log('[SkillTree] Centered on root at scale:', this.scale);
      
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
    this.hoveredSkill = skill;
    
    if (skill) {
      this.showTooltip(skill, e.clientX, e.clientY);
      if (this.canvas) {
        this.canvas.style.cursor = 'pointer';
      }
    } else {
      this.hideTooltip();
      if (this.canvas) {
        this.canvas.style.cursor = this.isDragging ? 'grabbing' : 'grab';
      }
    }
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
        const timeBonus = 0.5 + totalLevel * 2; // 0.5s base + 2s per level
        gameState.updateUpgrade('timeAtomBonus', timeBonus);
        break;

      case 'time_atom_coins_1':
        const timeCoins = totalLevel * 5; // 5 coins per level
        gameState.updateUpgrade('timeAtomCoins', timeCoins);
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

      case 'supernova_atom_coins_1':
        const supernovaCoins = totalLevel * 25; // 25 coins per level
        gameState.updateUpgrade('supernovaCoins', supernovaCoins);
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

      case 'black_hole_atom_coins_1':
        const blackHoleCoins = totalLevel * 15; // 15 coins per level
        gameState.updateUpgrade('blackHoleCoins', blackHoleCoins);
        break;

      case 'black_hole_spawn_atoms_1':
        const spawnAtoms = totalLevel; // 1 atom per level
        gameState.updateUpgrade('blackHoleSpawnAtoms', spawnAtoms);
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

      // Trigger click animation
      this.clickedNodes.set(skillId, Date.now());

      // Update UI
      const coinsDisplay = document.getElementById('coins-value');
      if (coinsDisplay) {
        coinsDisplay.textContent = gameState.getState().coins.toString();
      }

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
    // Stop animation loop
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Cleanup event listeners
    window.removeEventListener('resize', this.resizeCanvas);
  }
}
