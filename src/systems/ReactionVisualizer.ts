/**
 * Reaction Visualizer
 * Handles physics simulation and rendering for Critical Chain
 * Based on Criticality game mechanics
 */

import { gameState } from './GameStateManager';

export interface Neutron {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  lifetime: number;
  pierceRemaining: number;
}

export interface Atom {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  health: number;
  maxHealth: number;
  value: number;
  color: string;
  isFissile: boolean;  // false = non-fissile (black material)
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  lifetime: number;
  color: string;
}

class ReactionVisualizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private neutrons: Neutron[] = [];
  private atoms: Atom[] = [];
  private floatingTexts: FloatingText[] = [];
  private animationId: number = 0;
  private lastSpawnTime: number = 0;
  private lastChainResetTime: number = 0;
  private readonly CHAIN_RESET_DELAY = 1000; // Reset chain if no collisions for 1s

  constructor(canvasElement: HTMLCanvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d')!;
    this.setupCanvas();
    this.setupEventListeners();
    this.startGameLoop();
  }

  /**
   * Setup canvas
   */
  private setupCanvas(): void {
    const resize = () => {
      this.canvas.width = this.canvas.offsetWidth || window.innerWidth;
      this.canvas.height = this.canvas.offsetHeight || window.innerHeight - 140;
      console.log(`[VISUALIZER] Canvas resized to ${this.canvas.width}x${this.canvas.height}`);
    };
    resize();
    window.addEventListener('resize', resize);
    
    // Delay initial spawns to ensure canvas is ready
    setTimeout(() => {
      console.log('[VISUALIZER] Starting initial atom spawns');
      // Spawn atoms in the center for testing
      for (let i = 0; i < 5; i++) {
        setTimeout(() => this.spawnAtomInCenter(), i * 300);
      }
    }, 100);
  }

  /**
   * Spawn atom in center of screen (for initial spawns)
   */
  private spawnAtomInCenter(): void {
    if (this.canvas.width === 0 || this.canvas.height === 0) {
      return;
    }

    const radius = 20;
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 100 + 100;
    
    this.atoms.push({
      x: this.canvas.width / 2 + Math.cos(angle) * distance,
      y: this.canvas.height / 2 + Math.sin(angle) * distance,
      vx: Math.cos(angle) * 0.3,
      vy: Math.sin(angle) * 0.3,
      radius,
      health: 1,
      maxHealth: 1,
      value: 1,
      color: '#FF8800',
      isFissile: true,
    });
    
    console.log(`[VISUALIZER] Spawned center atom, total: ${this.atoms.length}`);
  }

  /**
   * Setup click listener to spawn neutrons
   */
  private setupEventListeners(): void {
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
  }

  /**
   * Handle canvas click - spawn neutrons
   */
  private handleClick(e: MouseEvent): void {
    // Check if player can click
    if (!gameState.canClick()) {
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicked on non-fissile material to remove it
    const clickedAtom = this.atoms.find(atom => {
      const dx = atom.x - x;
      const dy = atom.y - y;
      return !atom.isFissile && Math.sqrt(dx * dx + dy * dy) <= atom.radius;
    });

    if (clickedAtom) {
      // Remove non-fissile material
      this.atoms = this.atoms.filter(a => a !== clickedAtom);
      return;
    }

    // Use a click
    if (!gameState.useClick()) {
      return;
    }
    
    const state = gameState.getState();
    const neutronCount = state.upgrades.startingNeutrons;
    
    // Spawn neutrons in random directions
    for (let i = 0; i < neutronCount; i++) {
      const angle = (Math.PI * 2 * i) / neutronCount + Math.random() * 0.5;
      const speed = 3 + Math.random();
      
      this.neutrons.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 5,
        lifetime: 0,
        pierceRemaining: state.upgrades.pierce,
      });
    }
  }

  /**
   * Main game loop
   */
  private startGameLoop(): void {
    const update = () => {
      this.update();
      this.render();
      this.animationId = requestAnimationFrame(update);
    };
    update();
  }

  /**
   * Update physics
   */
  private update(): void {
    const now = Date.now();
    const state = gameState.getState();
    
    // Safety check
    if (!state || !state.upgrades) {
      return;
    }

    // Spawn atoms periodically (keep at least 3 atoms on screen)
    const spawnInterval = 2000 / state.upgrades.atomSpawnRate;
    if ((this.atoms.length < 3 || now - this.lastSpawnTime > spawnInterval) && this.atoms.length < 20) {
      this.spawnAtom();
      this.lastSpawnTime = now;
    }

    // Update neutrons
    this.updateNeutrons();

    // Update atoms
    this.updateAtoms();

    // Check collisions
    this.checkCollisions();

    // Update floating texts
    this.floatingTexts = this.floatingTexts.filter(text => {
      text.lifetime++;
      return text.lifetime < 60; // 1 second at 60fps
    });

    // Reset chain if no activity
    if (this.neutrons.length === 0 && now - this.lastChainResetTime > this.CHAIN_RESET_DELAY) {
      gameState.resetChain();
      this.lastChainResetTime = now;
    }
  }

  /**
   * Spawn a new atom
   */
  private spawnAtom(): void {
    // Don't spawn if canvas not ready
    if (this.canvas.width === 0 || this.canvas.height === 0) {
      console.warn('[VISUALIZER] Canvas not ready, skipping spawn');
      return;
    }

    const state = gameState.getState();
    const rank = state.rank;
    
    // Determine atom size based on rank
    let healthLevel = 1;
    if (rank >= 1) {
      const rand = Math.random();
      if (rand < 0.1 && rank >= 4) healthLevel = 4;
      else if (rand < 0.3 && rank >= 2) healthLevel = 3;
      else if (rand < 0.5 && rank >= 1) healthLevel = 2;
    }

    const health = healthLevel;
    const radius = 15 + (healthLevel - 1) * 10;
    const value = healthLevel;
    
    // Determine if fissile (at rank 1+, some atoms are non-fissile)
    const isFissile = rank === 0 || Math.random() > 0.15;
    
    // Random position at edge of screen or in the middle for initial spawns
    const side = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    
    const speed = 0.8;
    switch (side) {
      case 0: // Top
        x = Math.random() * this.canvas.width;
        y = -radius;
        vx = (Math.random() - 0.5) * speed;
        vy = speed;
        break;
      case 1: // Right
        x = this.canvas.width + radius;
        y = Math.random() * this.canvas.height;
        vx = -speed;
        vy = (Math.random() - 0.5) * speed;
        break;
      case 2: // Bottom
        x = Math.random() * this.canvas.width;
        y = this.canvas.height + radius;
        vx = (Math.random() - 0.5) * speed;
        vy = -speed;
        break;
      default: // Left
        x = -radius;
        y = Math.random() * this.canvas.height;
        vx = speed;
        vy = (Math.random() - 0.5) * speed;
    }

    this.atoms.push({
      x,
      y,
      vx,
      vy,
      radius,
      health,
      maxHealth: health,
      value,
      color: isFissile ? this.getAtomColor(healthLevel) : '#000000',
      isFissile,
    });
    
    console.log(`[VISUALIZER] Spawned atom at (${x.toFixed(0)}, ${y.toFixed(0)}), radius: ${radius}, health: ${health}, total atoms: ${this.atoms.length}`);
  }

  /**
   * Get atom color based on health level
   */
  private getAtomColor(healthLevel: number): string {
    const colors = ['#FF8800', '#FF6600', '#FF4400', '#FF0000'];
    return colors[Math.min(healthLevel - 1, colors.length - 1)];
  }

  /**
   * Update neutrons
   */
  private updateNeutrons(): void {
    const state = gameState.getState();
    
    this.neutrons = this.neutrons.filter(neutron => {
      neutron.x += neutron.vx;
      neutron.y += neutron.vy;
      neutron.lifetime++;

      // Homing behavior
      if (state.upgrades.homing > 0 && this.atoms.length > 0) {
        const nearest = this.findNearestAtom(neutron.x, neutron.y);
        if (nearest) {
          const dx = nearest.x - neutron.x;
          const dy = nearest.y - neutron.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0) {
            const turnRate = 0.05 * state.upgrades.homing;
            neutron.vx += (dx / dist) * turnRate;
            neutron.vy += (dy / dist) * turnRate;
            
            // Normalize speed
            const speed = Math.sqrt(neutron.vx * neutron.vx + neutron.vy * neutron.vy);
            neutron.vx = (neutron.vx / speed) * 3;
            neutron.vy = (neutron.vy / speed) * 3;
          }
        }
      }

      // Reflector behavior
      if (state.upgrades.neutronReflector > 0) {
        const reflectChance = state.upgrades.neutronReflector / 100;
        if (neutron.x < 0 || neutron.x > this.canvas.width) {
          if (Math.random() < reflectChance) {
            neutron.vx = -neutron.vx;
            neutron.x = Math.max(0, Math.min(this.canvas.width, neutron.x));
            return true;
          }
        }
        if (neutron.y < 0 || neutron.y > this.canvas.height) {
          if (Math.random() < reflectChance) {
            neutron.vy = -neutron.vy;
            neutron.y = Math.max(0, Math.min(this.canvas.height, neutron.y));
            return true;
          }
        }
      }

      // Remove if out of bounds or too old
      return neutron.x >= 0 && neutron.x <= this.canvas.width &&
             neutron.y >= 0 && neutron.y <= this.canvas.height &&
             neutron.lifetime < 600; // 10 seconds
    });
  }

  /**
   * Find nearest atom to a point
   */
  private findNearestAtom(x: number, y: number): Atom | null {
    let nearest: Atom | null = null;
    let minDist = Infinity;

    for (const atom of this.atoms) {
      if (!atom.isFissile) continue; // Don't home towards non-fissile
      const dx = atom.x - x;
      const dy = atom.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        nearest = atom;
      }
    }

    return nearest;
  }

  /**
   * Update atoms
   */
  private updateAtoms(): void {
    this.atoms = this.atoms.filter(atom => {
      atom.x += atom.vx;
      atom.y += atom.vy;

      // Remove if out of bounds
      return atom.x >= -atom.radius * 2 && atom.x <= this.canvas.width + atom.radius * 2 &&
             atom.y >= -atom.radius * 2 && atom.y <= this.canvas.height + atom.radius * 2;
    });
  }

  /**
   * Check collisions between neutrons and atoms
   */
  private checkCollisions(): void {
    for (let i = this.neutrons.length - 1; i >= 0; i--) {
      const neutron = this.neutrons[i];
      
      for (let j = this.atoms.length - 1; j >= 0; j--) {
        const atom = this.atoms[j];
        
        const dx = neutron.x - atom.x;
        const dy = neutron.y - atom.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < atom.radius) {
          // Collision detected
          if (!atom.isFissile) {
            // Non-fissile material: neutron is absorbed
            this.neutrons.splice(i, 1);
            break;
          }
          
          atom.health--;
          gameState.incrementChain();
          this.lastChainResetTime = Date.now();

          if (atom.health <= 0) {
            // Atom destroyed - award coins and emit neutrons
            gameState.awardCoins(atom.value);
            this.showFloatingText(`+${atom.value} x${gameState.getState().currentChain}`, atom.x, atom.y, '#00FF66');
            
            // Emit 2 neutrons
            const angle1 = Math.random() * Math.PI * 2;
            const angle2 = angle1 + Math.PI + (Math.random() - 0.5);
            const speed = 3;

            this.neutrons.push({
              x: atom.x,
              y: atom.y,
              vx: Math.cos(angle1) * speed,
              vy: Math.sin(angle1) * speed,
              size: 5,
              lifetime: 0,
              pierceRemaining: gameState.getState().upgrades.pierce,
            });

            this.neutrons.push({
              x: atom.x,
              y: atom.y,
              vx: Math.cos(angle2) * speed,
              vy: Math.sin(angle2) * speed,
              size: 5,
              lifetime: 0,
              pierceRemaining: gameState.getState().upgrades.pierce,
            });

            this.atoms.splice(j, 1);
          }

          // Remove neutron if pierce is exhausted
          if (neutron.pierceRemaining > 0) {
            neutron.pierceRemaining--;
          } else {
            this.neutrons.splice(i, 1);
          }
          break;
        }
      }
    }
  }

  /**
   * Render everything
   */
  private render(): void {
    const ctx = this.ctx;
    
    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw atoms
    for (const atom of this.atoms) {
      this.drawAtom(atom);
    }

    // Draw neutrons (triangles)
    for (const neutron of this.neutrons) {
      this.drawNeutron(neutron);
    }

    // Draw floating texts
    for (const text of this.floatingTexts) {
      this.drawFloatingText(text);
    }
  }

  /**
   * Draw an atom (circle)
   */
  private drawAtom(atom: Atom): void {
    const ctx = this.ctx;
    
    // Main circle
    ctx.fillStyle = atom.color;
    ctx.beginPath();
    ctx.arc(atom.x, atom.y, atom.radius, 0, Math.PI * 2);
    ctx.fill();

    // Health indicator
    if (atom.isFissile && atom.health < atom.maxHealth) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const healthPercent = atom.health / atom.maxHealth;
      ctx.arc(atom.x, atom.y, atom.radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * healthPercent);
      ctx.stroke();
    }

    // Health multiplier text
    if (atom.isFissile && atom.maxHealth > 1) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`×${atom.health}`, atom.x, atom.y);
    }
  }

  /**
   * Draw a neutron (triangle)
   */
  private drawNeutron(neutron: Neutron): void {
    const ctx = this.ctx;
    
    ctx.fillStyle = '#ff00ff';
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 10;
    
    const angle = Math.atan2(neutron.vy, neutron.vx);
    const size = neutron.size;
    
    ctx.save();
    ctx.translate(neutron.x, neutron.y);
    ctx.rotate(angle);
    
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(-size, -size);
    ctx.lineTo(-size, size);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
    ctx.shadowBlur = 0;
  }

  /**
   * Show floating text
   */
  private showFloatingText(text: string, x: number, y: number, color: string): void {
    this.floatingTexts.push({
      x,
      y,
      text,
      lifetime: 0,
      color,
    });
  }

  /**
   * Draw floating text
   */
  private drawFloatingText(text: FloatingText): void {
    const ctx = this.ctx;
    const alpha = 1 - text.lifetime / 60;
    
    ctx.globalAlpha = alpha;
    ctx.fillStyle = text.color;
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(text.text, text.x, text.y - text.lifetime);
    ctx.globalAlpha = 1;
  }

  /**
   * Reset visualization
   */
  reset(): void {
    this.neutrons = [];
    this.atoms = [];
    this.floatingTexts = [];
  }
}

export { ReactionVisualizer };
