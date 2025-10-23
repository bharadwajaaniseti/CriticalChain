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
  specialType?: 'time' | 'supernova' | 'blackhole';  // Special atom types
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
  private lastCollisionTime: number = 0; // Track last time a neutron hit an atom (for chain logic)
  private readonly CHAIN_TIMEOUT = 1000; // Reset chain if no collisions for 1s (configurable)
  private clicksDepletedTime: number = 0; // Track when clicks ran out
  private readonly GRACE_PERIOD = 2000; // 2 second grace period after clicks depleted
  private gameStartTime: number = 0; // Track when game actually started
  private readonly STARTUP_GRACE_PERIOD = 500; // Don't end game in first 500ms

  constructor(canvasElement: HTMLCanvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d')!;
    this.setupCanvas();
    this.setupEventListeners();
    this.startGameLoop();
    this.gameStartTime = Date.now(); // Mark startup time
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
      // Remove non-fissile material and use a click, but DON'T spawn neutrons
      if (gameState.useClick()) {
        this.atoms = this.atoms.filter(a => a !== clickedAtom);
      }
      return; // Exit early - don't spawn neutrons
    }

    // Use a click for spawning neutrons
    if (!gameState.useClick()) {
      return;
    }
    
    const state = gameState.getState();
    const neutronCount = state.upgrades.neutronCountPlayer;
    
    // Base speed: 1 pixel/frame (very slow), multiplied by upgrade
    const baseSpeed = 1.0 * state.upgrades.neutronSpeed;
    
    // Base size: 5 pixels, multiplied by upgrade
    const neutronSize = 5 * state.upgrades.neutronSize;
    
    // 🔥 Player triggered reaction - initialize collision timer
    this.lastCollisionTime = Date.now();
    
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
    
    console.log(`[VISUALIZER] 🚀 Spawned ${neutronCount} neutrons from click at (${x.toFixed(0)}, ${y.toFixed(0)})`);
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
    // BUT: Don't end game during startup grace period
    const startupComplete = (now - this.gameStartTime) >= this.STARTUP_GRACE_PERIOD;
    
    if (startupComplete && state.gameActive && state.clicks <= 0 && this.neutrons.length === 0 && state.timeRemaining > 0) {
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

    // 🔥 CHAIN REACTION LOGIC (Criticality-style)
    // Reset chain ONLY when:
    // 1. No active neutrons exist (all have expired or been absorbed)
    // 2. AND at least CHAIN_TIMEOUT (1s) has passed since the last collision
    // 3. AND a collision has actually occurred this round (lastCollisionTime is recent)
    // This allows the chain to continue as long as neutrons keep hitting atoms
    const timeSinceLastCollision = now - this.lastCollisionTime;
    const currentChain = gameState.getState().currentChain;
    
    // Chain persists through the entire round - no mid-game resets
    // Chain will only reset when starting a new game/round
    // Log for debugging if needed
    if (this.neutrons.length === 0 && currentChain > 0 && timeSinceLastCollision > this.CHAIN_TIMEOUT && timeSinceLastCollision < 5000) {
      console.log(`[VISUALIZER] 🔗 Chain at x${currentChain}: all neutrons expired but chain persists (${timeSinceLastCollision}ms since last collision)`);
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
    
    // Check for special atom types (with fission mastery multiplier)
    const fissionMult = state.upgrades.fissionMastery ? 2 : 1;
    let specialType: 'time' | 'supernova' | 'blackhole' | undefined;
    let atomColor = this.getAtomColor(healthLevel);
    
    const specialRoll = Math.random() * 100;
    
    // Check Time Atoms (highest priority)
    if (state.upgrades.timeAtomsUnlocked && specialRoll < (state.upgrades.timeAtomChance * fissionMult)) {
      specialType = 'time';
      atomColor = '#00FFFF'; // Cyan
    }
    // Check Supernova Atoms
    else if (state.upgrades.supernovaUnlocked && specialRoll < (state.upgrades.timeAtomChance + state.upgrades.supernovaChance) * fissionMult) {
      specialType = 'supernova';
      atomColor = '#FFFFFF'; // White/Bright
    }
    // Check Black Hole Atoms (lowest spawn rate)
    else if (state.upgrades.blackHoleUnlocked && specialRoll < (state.upgrades.timeAtomChance + state.upgrades.supernovaChance + state.upgrades.blackHoleChance) * fissionMult) {
      specialType = 'blackhole';
      atomColor = '#8000FF'; // Purple
    }
    
    // Determine if fissile (at rank 1+, some atoms are non-fissile)
    // Special atoms are always fissile
    const isFissile = specialType ? true : (rank === 0 || Math.random() > 0.15);
    
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
    
    // Override color for non-fissile
    if (!isFissile) atomColor = '#000000';
    
    this.atoms.push({
      x,
      y,
      vx,
      vy,
      radius,
      health,
      maxHealth: health,
      value,
      color: atomColor,
      isFissile,
      lifetime: 0,
      maxLifetime: atomLifetime,
      specialType,
    });
    
    console.log(`[VISUALIZER] Spawned atom at (${x.toFixed(0)}, ${y.toFixed(0)}), radius: ${radius}, health: ${health}, total atoms: ${this.atoms.length}`);
  }

  /**
   * Spawn a new atom near a specific point (for black hole destruction)
   */
  private spawnAtomNearPoint(x: number, y: number): void {
    if (this.canvas.width === 0 || this.canvas.height === 0) {
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

    const health = Math.ceil(healthLevel * state.upgrades.atomHealth);
    const baseRadius = 20;
    const radius = (baseRadius + (healthLevel - 1) * 8) * state.upgrades.atomSize;
    const value = healthLevel;
    const atomColor = this.getAtomColor(healthLevel);
    const atomLifetime = 600 * state.upgrades.atomLifetime;
    
    // Spawn near the specified point with random offset
    const angle = Math.random() * Math.PI * 2;
    const distance = 50 + Math.random() * 100;
    const spawnX = x + Math.cos(angle) * distance;
    const spawnY = y + Math.sin(angle) * distance;
    
    // Random velocity (slow drift)
    const speed = 0.3 * state.upgrades.atomSpeed;
    const vAngle = Math.random() * Math.PI * 2;
    
    this.atoms.push({
      x: spawnX,
      y: spawnY,
      vx: Math.cos(vAngle) * speed,
      vy: Math.sin(vAngle) * speed,
      radius,
      health,
      maxHealth: health,
      value,
      color: atomColor,
      isFissile: true,
      lifetime: 0,
      maxLifetime: atomLifetime,
    });
    
    console.log(`[VISUALIZER] Spawned atom near (${x.toFixed(0)}, ${y.toFixed(0)}) from black hole destruction`);
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
      // Black hole gravity - apply before normal movement
      let absorbedByBlackHole = false;
      for (const atom of this.atoms) {
        if (!atom.isFissile) {
          // This is a black hole (non-fissile atom)
          const dx = atom.x - neutron.x;
          const dy = atom.y - neutron.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          // Strong gravity pull - affects neutrons within 200 pixels
          const gravityRange = 200;
          if (dist < gravityRange && dist > 0) {
            // Gravity strength increases as neutron gets closer (inverse square)
            const gravityStrength = 0.8 * (1 - dist / gravityRange);
            neutron.vx += (dx / dist) * gravityStrength;
            neutron.vy += (dy / dist) * gravityStrength;
          }
          
          // If neutron gets close enough, it's absorbed
          if (dist < atom.radius + neutron.size) {
            absorbedByBlackHole = true;
            break;
          }
        }
      }
      
      // Black hole absorbed this neutron
      if (absorbedByBlackHole) {
        return false;
      }
      
      neutron.x += neutron.vx;
      neutron.y += neutron.vy;
      neutron.lifetime++;

      // Homing behavior (nerfed - reduced turn rate)
      if (state.upgrades.homing > 0 && this.atoms.length > 0) {
        const nearest = this.findNearestAtom(neutron.x, neutron.y);
        if (nearest) {
          const dx = nearest.x - neutron.x;
          const dy = nearest.y - neutron.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0) {
            // Reduced from 0.05 to 0.02 per level (60% weaker)
            const turnRate = 0.02 * state.upgrades.homing;
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
          // 🔥 COLLISION DETECTED - Update last collision time to keep chain alive
          this.lastCollisionTime = Date.now();
          
          if (!atom.isFissile) {
            // Non-fissile material: neutron is absorbed (but still counts as collision)
            this.neutrons.splice(i, 1);
            break;
          }
          
          // Fissile atom hit - damage it
          atom.health--;
          
          // 🔥 Increment chain ONLY when atom is destroyed (not on every hit)
          if (atom.health <= 0) {
            const chainBefore = gameState.getState().currentChain;
            gameState.incrementChain();
            const chainAfter = gameState.getState().currentChain;
            console.log(`[VISUALIZER] 💥 Atom destroyed! Chain: ${chainBefore} → ${chainAfter}`);
            
            // 🔥 UPDATE COLLISION TIME - This extends the chain window when new neutrons are released
            this.lastCollisionTime = Date.now();
            
            // SPECIAL ATOM EFFECTS
            if (atom.specialType === 'time') {
              // Time atom - add time to the timer
              const state = gameState.getState();
              const fissionMult = state.upgrades.fissionMastery ? 1.5 : 1;
              const timeBonus = (0.5 + state.upgrades.timeAtomBonus) * fissionMult;
              gameState.updateTime(-timeBonus); // Negative to add time
              
              // Award bonus coins for time atoms (base value * 2 + upgrade bonus)
              const baseCoinValue = atom.value * 2;
              const bonusCoins = state.upgrades.timeAtomCoins;
              const totalCoins = baseCoinValue + bonusCoins;
              gameState.awardCoins(totalCoins);
              
              this.showFloatingText(`+${timeBonus.toFixed(1)}s ⏱ +${totalCoins}💰`, atom.x, atom.y, '#00FFFF');
              console.log(`[VISUALIZER] Time atom broken! Added ${timeBonus}s and ${totalCoins} coins`);
            } else if (atom.specialType === 'supernova') {
              // Supernova atom - release MANY neutrons
              const state = gameState.getState();
              const fissionMult = state.upgrades.fissionMastery ? 1.5 : 1;
              const supernovaNeutrons = Math.floor((10 + state.upgrades.supernovaNeutrons) * fissionMult);
              const baseSpeed = 1.0 * state.upgrades.neutronSpeed;
              const neutronSize = 5 * state.upgrades.neutronSize;
              
              for (let k = 0; k < supernovaNeutrons; k++) {
                const angle = (Math.PI * 2 * k) / supernovaNeutrons + Math.random() * 0.2;
                this.neutrons.push({
                  x: atom.x,
                  y: atom.y,
                  vx: Math.cos(angle) * baseSpeed * 1.5,
                  vy: Math.sin(angle) * baseSpeed * 1.5,
                  size: neutronSize,
                  lifetime: 0,
                  pierceRemaining: state.upgrades.pierce,
                });
              }
              
              // Award bonus coins for supernova atoms (base value * 2 + upgrade bonus)
              const baseCoinValue = atom.value * 2;
              const bonusCoins = state.upgrades.supernovaCoins;
              const totalCoins = baseCoinValue + bonusCoins;
              gameState.awardCoins(totalCoins);
              
              this.showFloatingText(`💥 ${supernovaNeutrons}n +${totalCoins}💰`, atom.x, atom.y, '#FFFF00');
              console.log(`[VISUALIZER] Supernova atom broken! Released ${supernovaNeutrons} neutrons and ${totalCoins} coins`);
            } else if (atom.specialType === 'blackhole') {
              // Black hole atom - it already pulls neutrons, just log
              const state = gameState.getState();
              
              // Award bonus coins for black hole atoms (base value * 2 + upgrade bonus)
              const baseCoinValue = atom.value * 2;
              const bonusCoins = state.upgrades.blackHoleCoins;
              const totalCoins = baseCoinValue + bonusCoins;
              gameState.awardCoins(totalCoins);
              
              // Spawn new atoms when black hole is destroyed
              const atomsToSpawn = state.upgrades.blackHoleSpawnAtoms;
              if (atomsToSpawn > 0) {
                for (let k = 0; k < atomsToSpawn; k++) {
                  // Delay spawns slightly for visual effect
                  setTimeout(() => this.spawnAtomNearPoint(atom.x, atom.y), k * 150);
                }
              }
              
              this.showFloatingText(`🌀 +${totalCoins}💰 +${atomsToSpawn}⚛️`, atom.x, atom.y, '#8000FF');
              console.log(`[VISUALIZER] Black hole atom destroyed! Awarded ${totalCoins} coins and spawning ${atomsToSpawn} atoms`);
            }
            
            // Normal atom destruction
            if (!atom.specialType) {
              // Atom destroyed - award coins and emit neutrons
              const currentChain = gameState.getState().currentChain;
              gameState.awardCoins(atom.value);
              
              // Enhanced floating text with chain indication
              const chainText = currentChain > 1 ? `⚡ +${atom.value} ×${currentChain} ⚡` : `+${atom.value} ×${currentChain}`;
              this.showFloatingText(chainText, atom.x, atom.y, '#00FF66');
              
              // Play atom break sound
              audioManager.playSFX(AudioType.SFX_ATOM_BREAK);
              
              // 🔥 Emit neutrons to continue chain reaction
              const currentState = gameState.getState();
              const neutronCount = currentState.upgrades.neutronCountAtom;
              const baseSpeed = 1.0 * currentState.upgrades.neutronSpeed;
              const neutronSize = 5 * currentState.upgrades.neutronSize;
              
              if (neutronCount > 0) {
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
                console.log(`[VISUALIZER] ⚛️ Atom broken → Released ${neutronCount} neutrons | Chain: x${currentState.currentChain} | Active neutrons: ${this.neutrons.length}`);
              }
            } else {
              // Special atoms - just play sound (coins already awarded above)
              audioManager.playSFX(AudioType.SFX_ATOM_BREAK);
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
    
    // SPECIAL ATOM TYPES - Draw with unique visual effects
    if (atom.specialType === 'time') {
      // TIME ATOM - Cyan with clock icon
      const pulsePhase = (Date.now() % 1000) / 1000;
      const pulseSize = Math.sin(pulsePhase * Math.PI * 2) * 5;
      
      // Outer glow
      const glowGradient = ctx.createRadialGradient(atom.x, atom.y, 0, atom.x, atom.y, atom.radius + 15);
      glowGradient.addColorStop(0, 'rgba(0, 255, 255, 0.8)');
      glowGradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(atom.x, atom.y, atom.radius + 15 + pulseSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Main body
      ctx.fillStyle = '#00FFFF';
      ctx.beginPath();
      ctx.arc(atom.x, atom.y, atom.radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw clock icon using SVG-style rendering
      ctx.save();
      ctx.fillStyle = '#003366';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      
      // Clock circle
      ctx.beginPath();
      ctx.arc(atom.x, atom.y, atom.radius * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      // Clock hands
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      // Hour hand
      ctx.beginPath();
      ctx.moveTo(atom.x, atom.y);
      ctx.lineTo(atom.x + atom.radius * 0.2, atom.y - atom.radius * 0.25);
      ctx.stroke();
      // Minute hand
      ctx.beginPath();
      ctx.moveTo(atom.x, atom.y);
      ctx.lineTo(atom.x + atom.radius * 0.35, atom.y - atom.radius * 0.1);
      ctx.stroke();
      
      ctx.restore();
      
      ctx.globalAlpha = 1;
      return;
    }
    
    if (atom.specialType === 'supernova') {
      // SUPERNOVA ATOM - Bright white with star icon
      const pulsePhase = (Date.now() % 800) / 800;
      const pulseSize = Math.sin(pulsePhase * Math.PI * 2) * 8;
      
      // Outer energy burst
      const burstGradient = ctx.createRadialGradient(atom.x, atom.y, 0, atom.x, atom.y, atom.radius + 20);
      burstGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      burstGradient.addColorStop(0.5, 'rgba(255, 200, 0, 0.6)');
      burstGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
      ctx.fillStyle = burstGradient;
      ctx.beginPath();
      ctx.arc(atom.x, atom.y, atom.radius + 20 + pulseSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Main body
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#FFFF00';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(atom.x, atom.y, atom.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      // Draw star icon using SVG-style rendering
      ctx.save();
      ctx.fillStyle = '#FF6600';
      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = 2;
      
      // 5-pointed star
      const starRadius = atom.radius * 0.6;
      const starInnerRadius = atom.radius * 0.3;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const angle = (Math.PI * 2 * i) / 10 - Math.PI / 2;
        const r = i % 2 === 0 ? starRadius : starInnerRadius;
        const x = atom.x + Math.cos(angle) * r;
        const y = atom.y + Math.sin(angle) * r;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      ctx.restore();
      
      ctx.globalAlpha = 1;
      return;
    }
    
    if (atom.specialType === 'blackhole') {
      // BLACK HOLE ATOM - Purple with spiral icon
      const pulsePhase = (Date.now() % 1500) / 1500;
      const pulseSize = Math.sin(pulsePhase * Math.PI * 2) * 10;
      
      // Gravity rings
      ctx.strokeStyle = `rgba(128, 0, 255, ${0.4 * (1 - pulsePhase)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(atom.x, atom.y, atom.radius + 40 + pulseSize, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.strokeStyle = `rgba(128, 0, 255, ${0.6 * (1 - pulsePhase * 0.5)})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(atom.x, atom.y, atom.radius + 20 + pulseSize * 0.5, 0, Math.PI * 2);
      ctx.stroke();
      
      // Main body with gradient
      const gradient = ctx.createRadialGradient(atom.x, atom.y, 0, atom.x, atom.y, atom.radius);
      gradient.addColorStop(0, '#1a0033');
      gradient.addColorStop(0.7, '#4400AA');
      gradient.addColorStop(1, '#8000FF');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(atom.x, atom.y, atom.radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw spiral/vortex icon using SVG-style rendering
      ctx.save();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      
      // Spiral effect
      const spirals = 3;
      for (let s = 0; s < spirals; s++) {
        ctx.beginPath();
        const startAngle = (Math.PI * 2 * s) / spirals;
        for (let i = 0; i <= 20; i++) {
          const t = i / 20;
          const angle = startAngle + t * Math.PI * 2;
          const r = atom.radius * 0.6 * (1 - t);
          const x = atom.x + Math.cos(angle) * r;
          const y = atom.y + Math.sin(angle) * r;
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }
      
      // Center dot
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(atom.x, atom.y, atom.radius * 0.15, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
      
      ctx.globalAlpha = 1;
      return;
    }
    
    // Black hole special effects (non-fissile atoms)
    if (!atom.isFissile) {
      // Draw gravity field rings (pulsing effect)
      const pulsePhase = (Date.now() % 2000) / 2000;
      const pulseSize = Math.sin(pulsePhase * Math.PI * 2) * 10;
      
      // Outer gravity field
      ctx.strokeStyle = `rgba(128, 0, 255, ${0.3 * (1 - pulsePhase)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(atom.x, atom.y, atom.radius + 60 + pulseSize, 0, Math.PI * 2);
      ctx.stroke();
      
      // Middle gravity field
      ctx.strokeStyle = `rgba(128, 0, 255, ${0.5 * (1 - pulsePhase * 0.5)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(atom.x, atom.y, atom.radius + 40 + pulseSize * 0.5, 0, Math.PI * 2);
      ctx.stroke();
      
      // Inner glow
      const gradient = ctx.createRadialGradient(atom.x, atom.y, 0, atom.x, atom.y, atom.radius);
      gradient.addColorStop(0, '#000000');
      gradient.addColorStop(0.7, '#1a0033');
      gradient.addColorStop(1, '#330066');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(atom.x, atom.y, atom.radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Accretion disk effect
      ctx.strokeStyle = 'rgba(128, 0, 255, 0.6)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(atom.x, atom.y, atom.radius + 8, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.globalAlpha = 1;
      return;
    }
    
    // Fade effect when close to decay (last 20% of lifetime)
    if (lifetimePercent > 0.8) {
      const fadeAmount = (lifetimePercent - 0.8) / 0.2;
      ctx.globalAlpha = 1 - (fadeAmount * 0.5); // Fade to 50% opacity
    }
    
    // Main circle (fissile atoms)
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
    const progress = text.lifetime / 60; // 0 to 1
    const alpha = 1 - progress;
    
    // Extract chain value from text (e.g., "x2" from "+1 x2")
    const chainMatch = text.text.match(/x(\d+)/);
    const chainValue = chainMatch ? parseInt(chainMatch[1]) : 1;
    
    // Scale and intensity based on chain level
    let fontSize = 24;
    let glowIntensity = 10;
    let textColor = text.color;
    
    if (chainValue >= 20) {
      fontSize = 48; // Legendary
      glowIntensity = 30;
      textColor = '#ff6b6b';
    } else if (chainValue >= 15) {
      fontSize = 42; // Epic
      glowIntensity = 25;
      textColor = '#ffd93d';
    } else if (chainValue >= 10) {
      fontSize = 36; // Rare
      glowIntensity = 20;
      textColor = '#a78bfa';
    } else if (chainValue >= 5) {
      fontSize = 30; // Uncommon
      glowIntensity = 15;
      textColor = '#4facfe';
    } else {
      fontSize = 24; // Common
      glowIntensity = 10;
      textColor = text.color;
    }
    
    // Animate: scale up then fade
    const scale = progress < 0.2 ? 1 + (0.2 - progress) * 2 : 1; // Pop effect in first 20%
    const yOffset = text.lifetime * 1.5; // Float upward
    
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(text.x, text.y - yOffset);
    ctx.scale(scale, scale);
    
    // Draw glow effect
    ctx.shadowColor = textColor;
    ctx.shadowBlur = glowIntensity * alpha;
    ctx.fillStyle = textColor;
    ctx.font = `bold ${fontSize}px 'Poppins', Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw text with stroke for better visibility
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.lineWidth = 3;
    ctx.strokeText(text.text, 0, 0);
    ctx.fillText(text.text, 0, 0);
    
    ctx.restore();
  }

  /**
   * Debug method: Force spawn a specific special atom type
   */
  debugSpawnSpecialAtom(type: 'time' | 'supernova' | 'blackhole'): void {
    if (this.canvas.width === 0 || this.canvas.height === 0) {
      console.warn('[VISUALIZER] Canvas not ready');
      return;
    }

    const state = gameState.getState();
    
    // Spawn in center of screen for visibility
    const x = this.canvas.width / 2;
    const y = this.canvas.height / 2;
    
    // Base properties
    const healthLevel = 2; // Medium size for visibility
    const health = Math.ceil(healthLevel * state.upgrades.atomHealth);
    const baseRadius = 20;
    const radius = (baseRadius + (healthLevel - 1) * 8) * state.upgrades.atomSize;
    const atomLifetime = 600 * state.upgrades.atomLifetime;
    
    // Set color based on type
    let atomColor: string;
    switch (type) {
      case 'time':
        atomColor = '#00FFFF'; // Cyan
        break;
      case 'supernova':
        atomColor = '#FFFFFF'; // White
        break;
      case 'blackhole':
        atomColor = '#9400D3'; // Purple
        break;
    }
    
    // Very slow drift so it stays visible
    const speed = 0.2 * state.upgrades.atomSpeed;
    const angle = Math.random() * Math.PI * 2;
    
    this.atoms.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius,
      health,
      maxHealth: health,
      value: healthLevel,
      color: atomColor,
      isFissile: true,
      lifetime: 0,
      maxLifetime: atomLifetime,
      specialType: type,
    });
    
    console.log(`[DEBUG] Spawned ${type} atom at center with color ${atomColor}`);
  }

  /**
   * Reset visualization
   */
  reset(): void {
    this.neutrons = [];
    this.atoms = [];
    this.floatingTexts = [];
    this.lastCollisionTime = Date.now(); // Reset collision timer for new game
    this.gameStartTime = Date.now(); // Reset startup grace period for new game
    this.clicksDepletedTime = 0; // Reset clicks depleted timer
  }
}

export { ReactionVisualizer };
