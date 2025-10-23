/**
 * Audio Manager
 * Handles all sound effects and music
 */

export enum AudioType {
  SFX_CLICK = 'sfx_click',
  SFX_REACTION = 'sfx_reaction',
  SFX_UPGRADE = 'sfx_upgrade',
  SFX_ATOM_BREAK = 'sfx_atom_break',
  MUSIC_IDLE = 'music_idle',
  MUSIC_REACTION = 'music_reaction',
  HOME_MUSIC_BG = 'home_music_bg',
  HOME_UI_SELECT = 'home_ui_select',
  SKILLTREE_PURCHASE = 'skilltree_purchase',
  SKILLTREE_HOVER = 'skilltree_hover',
}

const AUDIO_MAP: Record<AudioType, string> = {
  [AudioType.SFX_CLICK]: '/assets/audio/ui_click.mp3',
  [AudioType.SFX_REACTION]: '/assets/audio/reaction_trigger.mp3',
  [AudioType.SFX_UPGRADE]: '/assets/audio/upgrade_unlock.mp3',
  [AudioType.SFX_ATOM_BREAK]: '/assets/audio/thud-impact-sound-sfx-379990.mp3',
  [AudioType.MUSIC_IDLE]: '/assets/audio/ambient.mp3',
  [AudioType.MUSIC_REACTION]: '/assets/audio/reaction_build.mp3',
  [AudioType.HOME_MUSIC_BG]: '/assets/audio/Home Background Music Backbeat.mp3',
  [AudioType.HOME_UI_SELECT]: '/assets/audio/Home UI select-sound.mp3',
  [AudioType.SKILLTREE_PURCHASE]: '/assets/audio/Skilltree purchase sound.mp3',
  [AudioType.SKILLTREE_HOVER]: '/assets/audio/Skilltree hover soundeffect.mp3',
};

class AudioManager {
  private audioContext: AudioContext | null = null;
  private audioCache: Map<AudioType, AudioBuffer> = new Map();
  private currentMusic: AudioBufferSourceNode | null = null;
  private currentMusicGain: GainNode | null = null;
  
  // Individual volume controls for each audio type
  private volumes: Map<AudioType, number> = new Map([
    [AudioType.SFX_CLICK, 0.5],
    [AudioType.SFX_REACTION, 0.5],
    [AudioType.SFX_UPGRADE, 0.5],
    [AudioType.SFX_ATOM_BREAK, 0.5],
    [AudioType.MUSIC_IDLE, 0.3],
    [AudioType.MUSIC_REACTION, 0.3],
    [AudioType.HOME_MUSIC_BG, 0.3],
    [AudioType.HOME_UI_SELECT, 0.5],
    [AudioType.SKILLTREE_PURCHASE, 0.5],
    [AudioType.SKILLTREE_HOVER, 0.5],
  ]);
  
  // Legacy support - master volumes
  private musicVolume: number = 0.3;
  private sfxVolume: number = 0.5;

  constructor() {
    this.loadVolumeSettings();
    this.initializeAudioContext();
  }

  /**
   * Load volume settings from localStorage
   */
  private loadVolumeSettings(): void {
    // Load individual volumes
    Object.values(AudioType).forEach(type => {
      const saved = localStorage.getItem(`CriticalChain_Volume_${type}`);
      if (saved !== null) {
        this.volumes.set(type, parseFloat(saved));
      }
    });
    
    // Load legacy master volumes
    const savedSFXVolume = localStorage.getItem('CriticalChain_SFXVolume');
    const savedMusicVolume = localStorage.getItem('CriticalChain_MusicVolume');
    
    if (savedSFXVolume !== null) {
      this.sfxVolume = parseFloat(savedSFXVolume);
    }
    if (savedMusicVolume !== null) {
      this.musicVolume = parseFloat(savedMusicVolume);
    }
  }

  /**
   * Initialize Web Audio API context
   */
  private initializeAudioContext(): void {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('[AUDIO] Context initialized, state:', this.audioContext.state);
      
      // Resume context on user interaction (required by browsers)
      if (this.audioContext.state === 'suspended') {
        const resumeContext = () => {
          if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume().then(() => {
              console.log('[AUDIO] Context resumed after user interaction');
            });
          }
          // Remove listeners after first interaction
          document.removeEventListener('click', resumeContext);
          document.removeEventListener('keydown', resumeContext);
        };
        
        document.addEventListener('click', resumeContext);
        document.addEventListener('keydown', resumeContext);
      }
    }
  }

  /**
   * Preload an audio file
   */
  async preloadAudio(type: AudioType): Promise<void> {
    if (this.audioCache.has(type)) return;

    try {
      const path = AUDIO_MAP[type];
      const response = await fetch(path);
      
      // Check if file exists
      if (!response.ok) {
        // Silently skip placeholder files that don't exist
        return;
      }
      
      const arrayBuffer = await response.arrayBuffer();

      if (this.audioContext) {
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        this.audioCache.set(type, audioBuffer);
        console.log(`[AUDIO] Preloaded ${type}`);
      }
    } catch (error) {
      // Silently skip missing or invalid audio files (placeholders)
      // Only log if it's the actual audio file we have
      if (type === AudioType.SFX_ATOM_BREAK) {
        console.warn(`[AUDIO] Failed to preload ${type}:`, error);
      }
    }
  }

  /**
   * Play a sound effect
   */
  playSFX(type: AudioType): void {
    if (!this.audioContext) {
      return; // Silently skip if no audio context
    }

    // Resume context if suspended
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().then(() => {
        console.log('[AUDIO] Context resumed');
      });
    }

    const buffer = this.audioCache.get(type);
    if (!buffer) {
      // Silently skip missing placeholder audio files
      return;
    }

    try {
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      source.buffer = buffer;
      // Use individual volume for this sound type
      const volume = this.volumes.get(type) ?? 0.5;
      gainNode.gain.value = volume;

      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      source.start(0);

      console.log(`[AUDIO] Playing ${type} at volume ${volume}`);
    } catch (error) {
      console.error(`[AUDIO] Error playing ${type}:`, error);
    }
  }

  /**
   * Play background music (loops)
   */
  playMusic(type: AudioType): void {
    if (!this.audioContext) return;

    // Stop current music
    if (this.currentMusic) {
      this.currentMusic.stop();
    }

    const buffer = this.audioCache.get(type);
    if (!buffer) {
      console.warn(`[AUDIO] Music not loaded: ${type}`);
      return;
    }

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();

    source.buffer = buffer;
    source.loop = true;
    // Use individual volume for this music type
    const volume = this.volumes.get(type) ?? 0.3;
    gainNode.gain.value = volume;

    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    source.start(0);

    this.currentMusic = source;
    this.currentMusicGain = gainNode;
    console.log(`[AUDIO] Playing music ${type}`);
  }

  /**
   * Stop music
   */
  stopMusic(): void {
    if (this.currentMusic) {
      this.currentMusic.stop();
      this.currentMusic = null;
      this.currentMusicGain = null;
    }
  }

  /**
   * Set music volume (0-1)
   */
  setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    localStorage.setItem('CriticalChain_MusicVolume', this.musicVolume.toString());
    
    // Update currently playing music volume in real-time
    if (this.currentMusicGain) {
      this.currentMusicGain.gain.value = this.musicVolume;
    }
  }

  /**
   * Set SFX volume (0-1)
   */
  setSFXVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    localStorage.setItem('CriticalChain_SFXVolume', this.sfxVolume.toString());
  }

  /**
   * Get music volume
   */
  getMusicVolume(): number {
    return this.musicVolume;
  }

  /**
   * Get SFX volume
   */
  getSFXVolume(): number {
    return this.sfxVolume;
  }
  
  /**
   * Set individual volume for a specific audio type (0-1)
   */
  setVolume(type: AudioType, volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.volumes.set(type, clampedVolume);
    localStorage.setItem(`CriticalChain_Volume_${type}`, clampedVolume.toString());
    
    // Update currently playing music if it's the same type
    if (this.currentMusic && this.currentMusicGain) {
      // We need to track which music is currently playing
      // For now, update the gain if volume changes for any music type
      this.currentMusicGain.gain.value = clampedVolume;
    }
  }
  
  /**
   * Get individual volume for a specific audio type
   */
  getVolume(type: AudioType): number {
    return this.volumes.get(type) ?? 0.5;
  }
  
  /**
   * Get all audio types for settings UI
   */
  getAllAudioTypes(): AudioType[] {
    return Object.values(AudioType);
  }
}

export const audioManager = new AudioManager();
