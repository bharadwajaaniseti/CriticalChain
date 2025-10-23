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
}

const AUDIO_MAP: Record<AudioType, string> = {
  [AudioType.SFX_CLICK]: '/assets/audio/ui_click_placeholder.wav',
  [AudioType.SFX_REACTION]: '/assets/audio/reaction_trigger_placeholder.wav',
  [AudioType.SFX_UPGRADE]: '/assets/audio/upgrade_unlock_placeholder.wav',
  [AudioType.SFX_ATOM_BREAK]: '/assets/audio/thud-impact-sound-sfx-379990.mp3',
  [AudioType.MUSIC_IDLE]: '/assets/audio/ambient_placeholder.mp3',
  [AudioType.MUSIC_REACTION]: '/assets/audio/reaction_build_placeholder.mp3',
};

class AudioManager {
  private audioContext: AudioContext | null = null;
  private audioCache: Map<AudioType, AudioBuffer> = new Map();
  private currentMusic: AudioBufferSourceNode | null = null;
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
      gainNode.gain.value = this.sfxVolume;

      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      source.start(0);

      console.log(`[AUDIO] Playing ${type} at volume ${this.sfxVolume}`);
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
    gainNode.gain.value = this.musicVolume;

    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    source.start(0);

    this.currentMusic = source;
    console.log(`[AUDIO] Playing music ${type}`);
  }

  /**
   * Stop music
   */
  stopMusic(): void {
    if (this.currentMusic) {
      this.currentMusic.stop();
      this.currentMusic = null;
    }
  }

  /**
   * Set music volume (0-1)
   */
  setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    localStorage.setItem('CriticalChain_MusicVolume', this.musicVolume.toString());
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
}

export const audioManager = new AudioManager();
