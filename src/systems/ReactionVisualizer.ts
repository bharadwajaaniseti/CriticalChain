/**
 * Reaction Visualizer
 * Handles physics simulation and rendering for Critical Chain
 * Based on Criticality game mechanics
 */

import { gameState } from './GameStateManager';
import { audioManager, AudioType } from './AudioManager';

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
  lifetime: number;  // Frames alive (for decay)
  maxLifetime: number;  // When to decay (based on skill tree)
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
  private clicksDepletedTime: number = 0; // Track when clicks ran out
  private readonly GRACE_PERIOD = 2000; // 2 second grace period after clicks depleted

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

    const state = gameState.getState();
    
    // Base radius: 20 pixels, multiplied by upgrade
    const radius = 20 * state.upgrades.atomSize;
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 100 + 100;
    
    // Base lifetime: 10 seconds (600 frames at 60fps), multiplied by upgrade
    const atomLifetime = 600 * state.upgrades.atomLifetime;
    
    // Base speed: 0.5 pixels/frame, multiplied by upgrade
    const speed = 0.5 * state.upgrades.atomSpeed;
    
    // Health multiplied by upgrade
    const health = Math.ceil(1 * state.upgrades.atomHealth);
    
    this.atoms.push({
      x: this.canvas.width / 2 + Math.cos(angle) * distance,
      y: this.canvas.height / 2 + Math.sin(angle) * distance,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius,
      health,
      maxHealth: health,
      value: 1,
      color: '#FF8800',
      isFissile: true,
      lifetime: 0,
      maxLifetime: atomLifetime,
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
    const neutronCount = state.upgrades.neutronCountPlayer;
    
    // Base speed: 1 pixel/frame (very slow), multiplied by upgrade
    const baseSpeed = 1.0 * state.upgrades.neutronSpeed;
    
    // Base size: 5 pixels, multiplied by upgrade
    const neutronSize = 5 * state.upgrades.neutronSize;
    
    // Spawn neutrons in random directions
    for (let i = 0; i < neutronCount; i++) {
      const angle = (Math.PI * 2 * i) / neutronCount + Math.random() * 0.5;
      const speed = baseSpeed + (Math.random() * 0.2); // Slight variation
      
      this.neutrons.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: neutronSize,
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

    // Track when clicks are depleted
    if (state.clicks <= 0 && this.clicksDepletedTime === 0) {
      this.clicksDepletedTime = now;
      console.log('[VISUALIZER] Clicks depleted, starting grace period');
    }
    
    // Reset grace period if clicks are refilled
    if (state.clicks > 0) {
      this.clicksDepletedTime = 0;
    }

    // Check for early end: no clicks left, no neutrons, grace period expired, and time remaining
    if (state.gameActive && state.clicks <= 0 && this.neutrons.length === 0 && state.timeRemaining > 0) {
      const gracePeriodElapsed = this.clicksDepletedTime > 0 && (now - this.clicksDepletedTime >= this.GRACE_PERIOD);
      
      if (gracePeriodElapsed) {
        console.log('[VISUALIZER] Early end: no clicks, no neutrons, and grace period expired');
        gameState.endGame();
        this.clicksDepletedTime = 0; // Reset for next round
      }
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

    // Health multiplied by upgrade
    const health = Math.ceil(healthLevel * state.upgrades.atomHealth);
    
    // Base radius: 20 pixels, scaled by health and upgrade
    const baseRadius = 20;
    const radius = (baseRadius + (healthLevel - 1) * 8) * state.upgrades.atomSize;
    
    const value = healthLevel;
    
    // Determine if fissile (at rank 1+, some atoms are non-fissile)
    const isFissile = rank === 0 || Math.random() > 0.15;
    
    // Random position at edge of screen or in the middle for initial spawns
    const side = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    
    // Base speed: 0.5 pixels/frame (slow), multiplied by upgrade
    const speed = 0.5 * state.upgrades.atomSpeed;
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

    // Base lifetime: 10 seconds (600 frames at 60fps), multiplied by upgrade
    const atomLifetime = 600 * state.upgrades.atomLifetime;
    
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
      lifetime: 0,
      maxLifetime: atomLifetime,
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
      // Base lifetime: 1.5 seconds (90 frames at 60fps), multiplied by upgrade
      const maxLifetime = 90 * state.upgrades.neutronLifetime;
      return neutron.x >= 0 && neutron.x <= this.canvas.width &&
             neutron.y >= 0 && neutron.y <= this.canvas.height &&
             neutron.lifetime < maxLifetime;
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
    // Update lifetime and position
    this.atoms = this.atoms.filter(atom => {
      atom.x += atom.vx;
      atom.y += atom.vy;
      atom.lifetime++;

      // Remove if lifetime expired
      if (atom.lifetime >= atom.maxLifetime) {
        return false;
      }

      // Remove if out of bounds
      return atom.x >= -atom.radius * 2 && atom.x <= this.canvas.width + atom.radius * 2 &&
             atom.y >= -atom.radius * 2 && atom.y <= this.canvas.height + atom.radius * 2;
    });

    // Check atom-atom collisions for physics
    this.checkAtomCollisions();
  }

  /**
   * Check and handle atom-atom collisions with physics
   */
  private checkAtomCollisions(): void {
    for (let i = 0; i < this.atoms.length; i++) {
      for (let j = i + 1; j < this.atoms.length; j++) {
        const atom1 = this.atoms[i];
        const atom2 = this.atoms[j];

        const dx = atom2.x - atom1.x;
        const dy = atom2.y - atom1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDist = atom1.radius + atom2.radius;

        if (distance < minDist) {
          // Collision detected - apply elastic collision physics
          
          // Normalize collision vector
          const nx = dx / distance;
          const ny = dy / distance;

          // Separate atoms to prevent overlap
          const overlap = minDist - distance;
          const separateX = (overlap / 2) * nx;
          const separateY = (overlap / 2) * ny;
          
          atom1.x -= separateX;
          atom1.y -= separateY;
          atom2.x += separateX;
          atom2.y += separateY;

          // Calculate relative velocity
          const dvx = atom1.vx - atom2.vx;
          const dvy = atom1.vy - atom2.vy;

          // Calculate relative velocity in collision normal direction
          const dvn = dvx * nx + dvy * ny;

          // Only resolve if atoms are moving towards each other
          if (dvn > 0) {
            // Apply impulse (simplified elastic collision)
            // Assuming equal mass for simplicity
            const impulse = dvn;

            atom1.vx -= impulse * nx;
            atom1.vy -= impulse * ny;
            atom2.vx += impulse * nx;
            atom2.vy += impulse * ny;

            // Add some damping to reduce energy over time
            const damping = 0.95;
            atom1.vx *= damping;
            atom1.vy *= damping;
            atom2.vx *= damping;
            atom2.vy *= damping;
          }
        }
      }
    }
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
            
            // Play atom break sound
            audioManager.playSFX(AudioType.SFX_ATOM_BREAK);
            
            // Emit neutrons based on upgrade
            const currentState = gameState.getState();
            const neutronCount = currentState.upgrades.neutronCountAtom;
            const baseSpeed = 1.0 * currentState.upgrades.neutronSpeed;
            const neutronSize = 5 * currentState.upgrades.neutronSize;
            
            for (let k = 0; k < neutronCount; k++) {
              const angle = (Math.PI * 2 * k) / neutronCount + Math.random() * 0.3;
              
              this.neutrons.push({
                x: atom.x,
                y: atom.y,
                vx: Math.cos(angle) * baseSpeed,
                vy: Math.sin(angle) * baseSpeed,
                size: neutronSize,
                lifetime: 0,
                pierceRemaining: currentState.upgrades.pierce,
              });
            }

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
    
    // Calculate lifetime percentage
    const lifetimePercent = atom.lifetime / atom.maxLifetime;
    
    // Fade effect when close to decay (last 20% of lifetime)
    if (lifetimePercent > 0.8) {
      const fadeAmount = (lifetimePercent - 0.8) / 0.2;
      ctx.globalAlpha = 1 - (fadeAmount * 0.5); // Fade to 50% opacity
    }
    
    // Main circle
    ctx.fillStyle = atom.color;
    ctx.beginPath();
    ctx.arc(atom.x, atom.y, atom.radius, 0, Math.PI * 2);
    ctx.fill();

    // Lifetime indicator ring (show when < 30% life remaining)
    if (lifetimePercent > 0.7) {
      ctx.strokeStyle = lifetimePercent > 0.85 ? '#ff0000' : '#ffaa00';
      ctx.lineWidth = 3;
      ctx.beginPath();
      const lifeRemaining = 1 - lifetimePercent;
      ctx.arc(atom.x, atom.y, atom.radius + 5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * lifeRemaining);
      ctx.stroke();
    }

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
    
    // Reset alpha
    ctx.globalAlpha = 1;
  }

  /**
   * Draw a neutron (triangle)
   */
  private drawNeutron(neutron: Neutron): void {
    const ctx = this.ctx;
    const state = gameState.getState();
    const maxLifetime = 90 * state.upgrades.neutronLifetime;
    const lifetimePercent = neutron.lifetime / maxLifetime;
    
    // Fade effect when close to decay (last 20% of lifetime)
    if (lifetimePercent > 0.8) {
      const fadeAmount = (lifetimePercent - 0.8) / 0.2;
      ctx.globalAlpha = 1 - (fadeAmount * 0.6); // Fade more than atoms
    }
    
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
    ctx.globalAlpha = 1;
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
