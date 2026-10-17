/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SoundtrackId } from '../types/game';

const SPECIAL_SFX_CONFIG: Record<string, string[]> = {
  board_clear: ['/sfx/sfx_tiles_cleared.mp3', '/sfx_tiles_cleared.mp3'],
  level_up: ['/sfx/d7fx_levelup_classic.mp3', '/d7fx_levelup_classic.mp3'],
  game_over: ['/sfx/d7fx_gameover.mp3', '/d7fx_gameover.mp3'],
  crack: ['/sfx/d7fx_crack.mp3', '/d7fx_crack.mp3'],
  crack_reveal: ['/sfx/d7fx_popclear.mp3', '/sfx/d7fx_crackreveal.mp3', '/d7fx_popclear.mp3', '/d7fx_crackreveal.mp3'],
  pop_clear: ['/sfx/d7fx_popclear.mp3', '/d7fx_popclear.mp3', '/sfx/d7fx_crackreveal.mp3'],
};

class AudioEngine {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private masterGain: GainNode | null = null;

  private currentTrack: SoundtrackId = 'drop7_original';
  private isMusicPlaying = false;
  private musicVolume = 0.55;
  private sfxVolume = 0.85;

  private musicLoopTimer: number | null = null;
  private activeMusicOscillators: OscillatorNode[] = [];

  // Audio playback elements for MP3 soundtracks
  private menuAudio: HTMLAudioElement | null = null;
  private classicAudio: HTMLAudioElement | null = null;
  private customAudio: HTMLAudioElement | null = null;
  private customAudioFileName: string | null = null;
  private customClassicAudio: HTMLAudioElement | null = null;
  private customClassicFileName: string | null = null;
  private classicBuffer: AudioBuffer | null = null;
  private menuBuffer: AudioBuffer | null = null;
  private musicBufferSource: AudioBufferSourceNode | null = null;
  private hasCustomAudioFile = false;

  // Authentic SFX: Chain MP3 audio buffers and elements (Chain 0, Chain 1, etc.)
  private chainBuffers: Map<number, AudioBuffer> = new Map();
  private chainAudioElements: Map<number, HTMLAudioElement> = new Map();
  private preloadingChains: Set<number> = new Set();

  // Authentic SFX: Board Clear, Level Up, Game Over, Crack, Crack Reveal
  private specialSfxBuffers: Map<string, AudioBuffer> = new Map();
  private specialSfxAudioElements: Map<string, HTMLAudioElement> = new Map();
  private preloadingSpecialSfx: Set<string> = new Set();

  // Musical scales for combo pitches (Pentatonic scale ascending)
  private pentatonicFrequencies = [
    523.25, // C5 (Combo 1)
    587.33, // D5 (Combo 2)
    659.25, // E5 (Combo 3)
    783.99, // G5 (Combo 4)
    880.00, // A5 (Combo 5)
    1046.50, // C6 (Combo 6)
    1174.66, // D6 (Combo 7)
    1318.51, // E6 (Combo 8)
    1567.98, // G6 (Combo 9)
    1760.00, // A6 (Combo 10)
    2093.00, // C7 (Combo 11+)
  ];

  public init(): void {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.initAudioStorage().catch(() => {});
      this.preloadAllChainAudio().catch(() => {});
      this.preloadAllSpecialSfx().catch(() => {});
    } catch {
      // AudioContext not supported or restricted
    }
  }

  public ensureContext(): AudioContext | null {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (this.chainBuffers.size < 11) {
      this.preloadAllChainAudio().catch(() => {});
    }
    if (this.specialSfxBuffers.size < Object.keys(SPECIAL_SFX_CONFIG).length) {
      this.preloadAllSpecialSfx().catch(() => {});
    }
    return this.ctx;
  }

  public setMusicVolume(vol: number): void {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
    }
    if (this.menuAudio) {
      this.menuAudio.volume = this.musicVolume;
    }
    if (this.classicAudio) {
      this.classicAudio.volume = this.musicVolume;
    }
    if (this.customAudio) {
      this.customAudio.volume = this.musicVolume;
    }
    if (this.customClassicAudio) {
      this.customClassicAudio.volume = this.musicVolume;
    }
  }

  private getTrackAudio(track: 'drop7_original' | 'drop7_original_2'): HTMLAudioElement {
    if (track === 'drop7_original') {
      if (this.customAudio) {
        this.customAudio.volume = this.musicVolume;
        return this.customAudio;
      }
      if (!this.menuAudio) {
        this.menuAudio = new Audio();
        this.menuAudio.loop = true;
        this.menuAudio.volume = this.musicVolume;
        this.menuAudio.src = '/d7menu_music.mp3';
        this.menuAudio.onerror = () => {
          if (this.menuAudio && !this.menuAudio.src.includes('/assets/')) {
            this.menuAudio.src = '/assets/d7menu_music.mp3';
            if (this.isMusicPlaying && this.currentTrack === 'drop7_original') {
              this.menuAudio.play().catch(() => {});
            }
          }
        };
      }
      return this.menuAudio;
    } else {
      // 1. If user uploaded a custom MP3 for Original Soundtrack 2, prioritize it
      if (this.customClassicAudio) {
        this.customClassicAudio.volume = this.musicVolume;
        return this.customClassicAudio;
      }
      // 2. Play the uploaded classic MP3 file directly
      if (!this.classicAudio) {
        this.classicAudio = new Audio();
        this.classicAudio.loop = true;
        this.classicAudio.volume = this.musicVolume;
        // Primary path: /d7classic_music.mp3 (the uploaded classic MP3)
        this.classicAudio.src = '/d7classic_music.mp3';
        this.classicAudio.onerror = () => {
          if (this.classicAudio && !this.classicAudio.src.includes('/assets/')) {
            this.classicAudio.src = '/assets/d7classic_music.mp3';
            if (this.isMusicPlaying && this.currentTrack === 'drop7_original_2') {
              this.classicAudio.play().catch(() => {});
            }
          }
        };
      }
      return this.classicAudio;
    }
  }

  public async preloadSoundtrackBuffer(track: 'drop7_original' | 'drop7_original_2', candidates: string[]): Promise<void> {
    const ctx = this.ensureContext();
    if (!ctx) return;
    for (const url of candidates) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const ab = await res.arrayBuffer();
          const decoded = await ctx.decodeAudioData(ab);
          if (track === 'drop7_original_2') {
            this.classicBuffer = decoded;
          } else {
            this.menuBuffer = decoded;
          }
          break;
        }
      } catch {
        // try next candidate
      }
    }
  }

  public playWebAudioMusicBuffer(track: 'drop7_original' | 'drop7_original_2'): void {
    const ctx = this.ensureContext();
    const buffer = track === 'drop7_original_2' ? this.classicBuffer : this.menuBuffer;
    if (!ctx || !this.musicGain || !buffer) return;

    if (this.musicBufferSource) {
      try {
        this.musicBufferSource.stop();
        this.musicBufferSource.disconnect();
      } catch {}
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(this.musicGain);
    source.start(0);
    this.musicBufferSource = source;
  }

  public async initAudioStorage(): Promise<void> {
    try {
      // Preload Web Audio buffers for instant, failure-proof fallback
      this.preloadSoundtrackBuffer('drop7_original_2', ['/d7classic_music.mp3', '/assets/d7classic_music.mp3']).catch(() => {});
      this.preloadSoundtrackBuffer('drop7_original', ['/d7menu_music.mp3', '/assets/d7menu_music.mp3']).catch(() => {});

      // Check IndexedDB for any custom uploaded audio files
      const db = await this.openAudioDb();
      if (!db) return;

      // Check classic soundtrack 2 custom upload
      const reqClassic = db.transaction('audio_files', 'readonly').objectStore('audio_files').get('classic_bgm_file');
      reqClassic.onsuccess = async () => {
        const item = reqClassic.result;
        if (item && item.blob) {
          await this.loadCustomAudioForTrack(item.blob, 'drop7_original_2', false, item.name || 'classic_music.mp3');
        }
      };

      // Check menu soundtrack custom upload / legacy bgm_file
      const reqMenu = db.transaction('audio_files', 'readonly').objectStore('audio_files').get('bgm_file');
      reqMenu.onsuccess = async () => {
        const item = reqMenu.result;
        if (item && item.blob) {
          await this.loadCustomAudioForTrack(item.blob, 'drop7_original', false, item.name || 'd7menu_music.mp3');
        }
      };
    } catch {
      // ignore
    }
  }

  private openAudioDb(): Promise<IDBDatabase | null> {
    if (typeof indexedDB === 'undefined') return Promise.resolve(null);
    return new Promise((resolve) => {
      try {
        const req = indexedDB.open('drop7_audio_db', 1);
        req.onupgradeneeded = () => {
          if (!req.result.objectStoreNames.contains('audio_files')) {
            req.result.createObjectStore('audio_files');
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  public loadCustomAudioForTrack(
    fileOrUrl: File | Blob | string,
    track: 'drop7_original' | 'drop7_original_2' = 'drop7_original_2',
    saveToStorage = true,
    customName?: string
  ): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const isString = typeof fileOrUrl === 'string';
        const url = isString ? fileOrUrl : URL.createObjectURL(fileOrUrl);
        const fileName = customName || (fileOrUrl instanceof File ? fileOrUrl.name : (track === 'drop7_original_2' ? 'd7classic_music.mp3' : 'd7menu_music.mp3'));

        if (track === 'drop7_original_2') {
          this.customClassicFileName = fileName;
          if (!this.customClassicAudio) {
            this.customClassicAudio = new Audio();
            this.customClassicAudio.loop = true;
          }
          this.customClassicAudio.src = url;
          this.customClassicAudio.volume = this.musicVolume;
          this.customClassicAudio.load();

          if (saveToStorage && typeof fileOrUrl !== 'string') {
            this.openAudioDb().then((db) => {
              if (db) {
                const tx = db.transaction('audio_files', 'readwrite');
                tx.objectStore('audio_files').put({ blob: fileOrUrl, name: fileName }, 'classic_bgm_file');
              }
            }).catch(() => {});
          }

          if (this.isMusicPlaying && this.currentTrack === 'drop7_original_2') {
            this.stopMusic();
            this.isMusicPlaying = true;
            this.customClassicAudio.play().catch(() => {});
          }
        } else {
          this.customAudioFileName = fileName;
          if (!this.customAudio) {
            this.customAudio = new Audio();
            this.customAudio.loop = true;
          }
          this.customAudio.src = url;
          this.customAudio.volume = this.musicVolume;
          this.hasCustomAudioFile = true;
          this.customAudio.load();

          if (saveToStorage && typeof fileOrUrl !== 'string') {
            this.openAudioDb().then((db) => {
              if (db) {
                const tx = db.transaction('audio_files', 'readwrite');
                tx.objectStore('audio_files').put({ blob: fileOrUrl, name: fileName }, 'bgm_file');
              }
            }).catch(() => {});
          }

          if (this.isMusicPlaying && this.currentTrack === 'drop7_original') {
            this.stopMusic();
            this.isMusicPlaying = true;
            this.customAudio.play().catch(() => {});
          }
        }
        resolve(true);
      } catch {
        resolve(false);
      }
    });
  }

  public loadCustomAudio(fileOrUrl: File | Blob | string, saveToStorage = true, customName?: string): Promise<boolean> {
    return this.loadCustomAudioForTrack(fileOrUrl, 'drop7_original', saveToStorage, customName);
  }

  public hasCustomAudio(): boolean {
    return this.hasCustomAudioFile;
  }

  public getCustomAudioName(): string | null {
    return this.customAudioFileName;
  }

  public getCustomClassicName(): string | null {
    return this.customClassicFileName;
  }

  public setSfxVolume(vol: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    }
    this.chainAudioElements.forEach((audio) => {
      audio.volume = this.sfxVolume;
    });
    this.specialSfxAudioElements.forEach((audio) => {
      audio.volume = this.sfxVolume;
    });
  }

  // Preload authentic Drop7 Chain sound effect (public/sfx/d7fx_chain{n}.mp3)
  public async preloadChainAudio(chain: number): Promise<void> {
    if (this.chainBuffers.has(chain) || this.preloadingChains.has(chain)) return;
    this.preloadingChains.add(chain);

    const candidates = [`/sfx/d7fx_chain${chain}.mp3`, `/d7fx_chain${chain}.mp3`];

    try {
      if (typeof Audio !== 'undefined' && !this.chainAudioElements.has(chain)) {
        const audio = new Audio(candidates[0]);
        audio.volume = this.sfxVolume;
        audio.preload = 'auto';
        this.chainAudioElements.set(chain, audio);
      }

      for (const url of candidates) {
        try {
          const response = await fetch(url);
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            const ctx = this.ensureContext();
            if (ctx) {
              const decoded = await ctx.decodeAudioData(arrayBuffer);
              this.chainBuffers.set(chain, decoded);
              break;
            }
          }
        } catch {
          // Try next candidate
        }
      }
    } catch {
      // Handled via fallback in playChainAudio
    } finally {
      this.preloadingChains.delete(chain);
    }
  }

  // Preload authentic Drop7 Chain sound effects 0 through 10 (public/sfx/d7fx_chain{n}.mp3)
  public async preloadAllChainAudio(): Promise<void> {
    const promises: Promise<void>[] = [];
    for (let c = 0; c <= 10; c++) {
      promises.push(this.preloadChainAudio(c));
    }
    await Promise.allSettled(promises);
  }

  // Preload authentic special sound effects (board clear, level up, game over, crack, crackreveal, popclear)
  public async preloadSpecialSfx(key: string): Promise<void> {
    if (this.specialSfxBuffers.has(key) && this.specialSfxAudioElements.has(key)) return;
    if (this.preloadingSpecialSfx.has(key)) return;
    this.preloadingSpecialSfx.add(key);

    const candidates = SPECIAL_SFX_CONFIG[key] || [];

    try {
      if (typeof Audio !== 'undefined' && !this.specialSfxAudioElements.has(key) && candidates[0]) {
        const audio = new Audio(candidates[0]);
        audio.volume = this.sfxVolume;
        audio.preload = 'auto';
        this.specialSfxAudioElements.set(key, audio);
      }

      for (const url of candidates) {
        try {
          const response = await fetch(url);
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            const ctx = this.ensureContext();
            if (ctx) {
              const decoded = await ctx.decodeAudioData(arrayBuffer);
              this.specialSfxBuffers.set(key, decoded);
              break;
            }
          }
        } catch {
          // Try next candidate
        }
      }
    } catch {
      // Handled via fallback in playSpecialSfx
    } finally {
      this.preloadingSpecialSfx.delete(key);
    }
  }

  // Preload all authentic special sound effects
  public async preloadAllSpecialSfx(): Promise<void> {
    const promises: Promise<void>[] = [];
    for (const key of Object.keys(SPECIAL_SFX_CONFIG)) {
      promises.push(this.preloadSpecialSfx(key));
    }
    await Promise.allSettled(promises);
  }

  // Backwards compatibility alias
  public async preloadChain0Audio(): Promise<void> {
    return this.preloadChainAudio(0);
  }

  // --- SOUND EFFECTS (SFX) ---

  // 1. Airy whoosh/click when player releases the ball at the top
  public playRelease(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.sfxVolume <= 0.01) return;
    const now = ctx.currentTime;

    // Filtered airy whoosh noise
    const bufferSize = Math.floor(ctx.sampleRate * 0.04);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1600, now);
    filter.frequency.exponentialRampToValueAtTime(600, now + 0.038);
    filter.Q.setValueAtTime(2.5, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    // Light subtle release click transient
    const click = ctx.createOscillator();
    const clickGain = ctx.createGain();
    click.type = 'sine';
    click.frequency.setValueAtTime(800, now);
    click.frequency.exponentialRampToValueAtTime(240, now + 0.02);

    clickGain.gain.setValueAtTime(0.3, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

    click.connect(clickGain);
    clickGain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + 0.04);
    click.start(now);
    click.stop(now + 0.02);
  }

  // 2. Solid tactile acoustic impact thud when disc finishes animating down to the bottom
  public playLand(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.sfxVolume <= 0.01) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(170, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.075);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(360, now);

    gain.gain.setValueAtTime(0.85, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    // Subtle wooden impact knock transient
    const knock = ctx.createOscillator();
    const knockGain = ctx.createGain();
    knock.type = 'sine';
    knock.frequency.setValueAtTime(520, now);
    knock.frequency.exponentialRampToValueAtTime(140, now + 0.025);

    knockGain.gain.setValueAtTime(0.4, now);
    knockGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

    knock.connect(knockGain);
    knockGain.connect(this.sfxGain);

    osc.start(now);
    knock.start(now);
    osc.stop(now + 0.08);
    knock.stop(now + 0.025);
  }

  // Soft organic thud alias
  public playDrop(): void {
    this.playLand();
  }

  /**
   * Authentic Chain audio playback using public/sfx/d7fx_chain{n}.mp3.
   * Plays matching audio for chain levels 0 through 10.
   * For any chain beyond 10, repeats level 10 again.
   * Priority 1: Zero-latency decoded AudioBufferSourceNode via Web Audio API.
   * Priority 2: HTMLAudioElement immediate playback with volume control.
   * Priority 3: Synthesizer fallback if audio cannot be played.
   */
  public playChainAudio(chain: number): void {
    if (this.sfxVolume <= 0.01) return;

    // Clamp chain level: 0 through 10, and repeat 10 for anything beyond 10
    const effectiveChain = Math.max(0, Math.min(10, Math.floor(chain)));

    const ctx = this.ensureContext();
    const buffer = this.chainBuffers.get(effectiveChain);

    // 1. Zero-latency decoded AudioBuffer playback
    if (ctx && buffer && this.sfxGain) {
      try {
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.sfxGain);
        source.start(0);
        return;
      } catch {
        // Fall through to HTMLAudioElement
      }
    }

    // Trigger preload in background if not already cached
    this.preloadChainAudio(effectiveChain).catch(() => {});

    // 2. HTML5 Audio element immediate fallback
    try {
      const audio = new Audio(`/sfx/d7fx_chain${effectiveChain}.mp3`);
      audio.volume = this.sfxVolume;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          this.playSyntheticMatch(effectiveChain + 1);
        });
      }
    } catch {
      this.playSyntheticMatch(effectiveChain + 1);
    }
  }

  public playChain0(): void {
    this.playChainAudio(0);
  }

  public playChain1(): void {
    this.playChainAudio(1);
  }

  /**
   * Play chain sound effect.
   * Plays corresponding sound file for chain levels 0 through 10 (d7fx_chain0.mp3 to d7fx_chain10.mp3).
   * For chain levels beyond 10, repeats chain 10 sound again.
   */
  public playChain(chain: number): void {
    const effectiveChain = Math.max(0, Math.min(10, Math.floor(chain)));
    this.playChainAudio(effectiveChain);
  }

  /**
   * Play match sound effect.
   * Combo 1 corresponds to chain 0, combo 2 corresponds to chain 1, ..., combo >= 11 repeats chain 10.
   */
  public playMatch(combo: number = 1): void {
    const chain = Math.max(0, combo - 1);
    this.playChain(chain);
  }

  // Synthesizer match sound with ascending pentatonic frequencies for cascade combos (Combo >= 2)
  public playSyntheticMatch(combo: number = 1): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.sfxVolume <= 0.01) return;

    const idx = Math.min(Math.max(1, combo) - 1, this.pentatonicFrequencies.length - 1);
    const freq = this.pentatonicFrequencies[idx];
    const now = ctx.currentTime;

    // 1. CUTE BUBBLY POP TRANSIENT (Snappy upward pitch sweep: bubbly 'pop!')
    const popOsc = ctx.createOscillator();
    const popGain = ctx.createGain();
    const popFilter = ctx.createBiquadFilter();

    popOsc.type = 'sine';
    const basePopFreq = Math.min(650, 360 + combo * 25);
    popOsc.frequency.setValueAtTime(basePopFreq, now);
    popOsc.frequency.exponentialRampToValueAtTime(basePopFreq * 3.4, now + 0.028);

    popFilter.type = 'lowpass';
    popFilter.frequency.setValueAtTime(2400, now);

    popGain.gain.setValueAtTime(0.9, now);
    popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

    popOsc.connect(popFilter);
    popFilter.connect(popGain);
    popGain.connect(this.sfxGain);

    popOsc.start(now);
    popOsc.stop(now + 0.06);

    // 2. SWEET PENTATONIC CHIME HARMONIC (Accompanying warm tone for combos)
    const chimeOsc = ctx.createOscillator();
    const chimeGain = ctx.createGain();
    chimeOsc.type = 'sine';
    chimeOsc.frequency.setValueAtTime(freq, now + 0.012);

    const chimeDur = 0.42 + Math.min(combo * 0.04, 0.3);
    chimeGain.gain.setValueAtTime(0, now);
    chimeGain.gain.setValueAtTime(0.5, now + 0.012);
    chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + chimeDur);

    chimeOsc.connect(chimeGain);
    chimeGain.connect(this.sfxGain);

    chimeOsc.start(now + 0.012);
    chimeOsc.stop(now + chimeDur);
  }

  /**
   * Generic authentic special SFX playback using public/sfx audio files.
   * Priority 1: Zero-latency decoded AudioBufferSourceNode via Web Audio API.
   * Priority 2: HTMLAudioElement immediate playback.
   * Priority 3: Synthesizer acoustic fallback if audio fails or cannot be loaded.
   */
  public playSpecialSfx(
    key: 'board_clear' | 'level_up' | 'game_over' | 'crack' | 'crack_reveal' | 'pop_clear',
    syntheticFallback?: () => void
  ): void {
    if (this.sfxVolume <= 0.01) return;

    const ctx = this.ensureContext();
    const buffer = this.specialSfxBuffers.get(key);

    // 1. Zero-latency decoded AudioBuffer playback
    if (ctx && buffer && this.sfxGain) {
      try {
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.sfxGain);
        source.start(ctx.currentTime);
        return;
      } catch {
        // Fall through to HTMLAudioElement
      }
    }

    // Trigger preload in background if not already cached
    this.preloadSpecialSfx(key).catch(() => {});

    // 2. Pre-instantiated cached HTML5 Audio element fallback (avoids garbage collection issues)
    const cached = this.specialSfxAudioElements.get(key);
    if (cached) {
      try {
        cached.currentTime = 0;
        cached.volume = this.sfxVolume;
        const playPromise = cached.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            if (syntheticFallback) syntheticFallback();
          });
        }
        return;
      } catch {
        // Fall through to synthetic fallback
      }
    }

    // 3. Fresh HTML5 Audio element fallback
    const urls = SPECIAL_SFX_CONFIG[key] || [];
    const primaryUrl = urls[0];
    if (primaryUrl) {
      try {
        const audio = new Audio(primaryUrl);
        audio.volume = this.sfxVolume;
        this.specialSfxAudioElements.set(key, audio);
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            if (syntheticFallback) syntheticFallback();
          });
        }
      } catch {
        if (syntheticFallback) syntheticFallback();
      }
    } else if (syntheticFallback) {
      syntheticFallback();
    }
  }

  // 1. Special SFX when the block is cracked (public/sfx/d7fx_crack.mp3)
  public playCrack(): void {
    this.playSpecialSfx('crack', () => this.playSyntheticCrack());
  }

  // Fallback synthetic cash register bell chime when solid grey disc cracks
  public playSyntheticCrack(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.sfxVolume <= 0.01) return;
    const now = ctx.currentTime;

    // 1. Sharp metallic strike transient (hammer striking the register bell)
    const bufferSize = Math.floor(ctx.sampleRate * 0.018);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.cos((i / bufferSize) * Math.PI * 0.5);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(3400, now);
    noiseFilter.Q.setValueAtTime(4, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + 0.022);

    // Initial high strike ping (mechanical click / ping)
    const strikeOsc = ctx.createOscillator();
    const strikeGain = ctx.createGain();
    strikeOsc.type = 'sine';
    strikeOsc.frequency.setValueAtTime(3950, now);
    strikeOsc.frequency.exponentialRampToValueAtTime(2600, now + 0.025);
    strikeGain.gain.setValueAtTime(0.65, now);
    strikeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    strikeOsc.connect(strikeGain);
    strikeGain.connect(this.sfxGain);
    strikeOsc.start(now);
    strikeOsc.stop(now + 0.035);

    // 2. Brass Cash Register Bell Chime Partials
    const bellFrequencies = [
      { freq: 2489, gainVal: 0.65, dur: 0.72 },
      { freq: 2496, gainVal: 0.50, dur: 0.68 },
      { freq: 3734, gainVal: 0.40, dur: 0.55 },
      { freq: 5210, gainVal: 0.22, dur: 0.38 },
    ];

    bellFrequencies.forEach(({ freq, gainVal, dur }) => {
      const bellOsc = ctx.createOscillator();
      const bellGain = ctx.createGain();

      bellOsc.type = 'sine';
      bellOsc.frequency.setValueAtTime(freq, now);

      bellGain.gain.setValueAtTime(gainVal, now);
      bellGain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      bellOsc.connect(bellGain);
      bellGain.connect(this.sfxGain!);

      bellOsc.start(now);
      bellOsc.stop(now + dur);
    });
  }

  // 2. Special SFX when a block is broken (public/sfx/d7fx_popclear.mp3)
  public playPopClear(): void {
    this.playSpecialSfx('pop_clear', () => this.playSyntheticShatter());
  }

  // Special SFX when a block turns into a normal circle number (public/sfx/d7fx_popclear.mp3)
  public playCrackReveal(): void {
    this.playPopClear();
  }

  // Backwards compatibility alias
  public playShatter(): void {
    this.playPopClear();
  }

  // Fallback synthetic shatter & reveal chime when cracked grey disc bursts into number
  public playSyntheticShatter(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.sfxVolume <= 0.01) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(650, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1250, ctx.currentTime + 0.18);

    gain.gain.setValueAtTime(0.45, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(ctx.currentTime + 0.22);
  }

  // 3. Special SFX when the next level up happens (public/sfx/d7fx_levelup_classic.mp3)
  public playLevelUp(): void {
    this.playSpecialSfx('level_up', () => this.playSyntheticLevelUp());
  }

  // Fallback synthetic level up sweep
  public playSyntheticLevelUp(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.sfxVolume <= 0.01) return;

    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, ctx.currentTime + i * 0.06);

      const tStart = ctx.currentTime + i * 0.06;
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.setValueAtTime(0.4, tStart);
      gain.gain.exponentialRampToValueAtTime(0.0001, tStart + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(tStart);
      osc.stop(tStart + 0.4);
    });
  }

  // 4. Special SFX when the whole board is cleared (public/sfx/sfx_tiles_cleared.mp3)
  public playBoardClear(): void {
    this.playSpecialSfx('board_clear', () => this.playSyntheticBoardClear());
  }

  // Fallback synthetic board clear fanfare (70,000 pts)
  public playSyntheticBoardClear(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.sfxVolume <= 0.01) return;

    const chord = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
    chord.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, ctx.currentTime);

      const tStart = ctx.currentTime + i * 0.07;
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.setValueAtTime(0.5, tStart);
      gain.gain.exponentialRampToValueAtTime(0.0001, tStart + 1.2);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(tStart);
      osc.stop(tStart + 1.2);
    });
  }

  // 5. Special SFX when the game over occurs (public/sfx/d7fx_gameover.mp3)
  public playGameOver(): void {
    // Immediately silence background music so game over sound plays clearly without conflict
    this.stopMusic();
    this.playSpecialSfx('game_over', () => this.playSyntheticGameOver());
  }

  // Fallback synthetic somber Game Over bell
  public playSyntheticGameOver(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.sfxVolume <= 0.01) return;

    const notes = [392.00, 329.63, 261.63]; // G3 -> E3 -> C3
    notes.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, ctx.currentTime);

      const tStart = ctx.currentTime + i * 0.22;
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.setValueAtTime(0.6, tStart);
      gain.gain.exponentialRampToValueAtTime(0.0001, tStart + 0.8);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(tStart);
      osc.stop(tStart + 0.8);
    });
  }

  // --- SOUNDTRACK SYNTHESIZER ---

  public setSoundtrack(track: SoundtrackId): void {
    this.currentTrack = track;
    if (this.isMusicPlaying) {
      this.stopMusic();
      if (track !== 'muted') {
        this.startMusic();
      }
    }
  }

  public getSoundtrack(): SoundtrackId {
    return this.currentTrack;
  }

  public toggleMusic(): boolean {
    if (this.isMusicPlaying) {
      this.stopMusic();
      return false;
    } else {
      if (this.currentTrack === 'muted') {
        this.currentTrack = 'power_of_seven';
      }
      this.startMusic();
      return true;
    }
  }

  public getIsPlaying(): boolean {
    return this.isMusicPlaying;
  }

  public startMusic(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.musicGain || this.currentTrack === 'muted') return;

    this.stopMusic();
    this.isMusicPlaying = true;

    // Real MP3 audio playback for Original Soundtrack (d7menu) and Original Soundtrack 2 (d7classic)
    if (this.currentTrack === 'drop7_original' || this.currentTrack === 'drop7_original_2') {
      const audio = this.getTrackAudio(this.currentTrack);
      audio.volume = this.musicVolume;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // If playback failed (e.g. initial URL error or format switch), retry with fallback path
          if (this.currentTrack === 'drop7_original_2') {
            const nextSrc = audio.src.includes('/assets/') ? '/d7classic_music.mp3' : '/assets/d7classic_music.mp3';
            audio.src = nextSrc;
            audio.play().catch(() => {
              // Final fallback: decoded Web Audio buffer
              this.playWebAudioMusicBuffer('drop7_original_2');
            });
          } else {
            const nextSrc = audio.src.includes('/assets/') ? '/d7menu_music.mp3' : '/assets/d7menu_music.mp3';
            audio.src = nextSrc;
            audio.play().catch(() => {
              this.playWebAudioMusicBuffer('drop7_original');
            });
          }
        });
      }
      return;
    }

    // Generative loop scheduler based on selected soundtrack
    let step = 0;
    const stepIntervalMs = this.getStepIntervalMs(this.currentTrack);
    const maxSteps = 16;

    const playStep = () => {
      if (!this.isMusicPlaying) return;
      this.triggerTrackNote(this.currentTrack, step);
      step = (step + 1) % maxSteps;
      this.musicLoopTimer = window.setTimeout(playStep, stepIntervalMs);
    };

    playStep();
  }

  public stopMusic(): void {
    this.isMusicPlaying = false;
    if (this.menuAudio) {
      this.menuAudio.pause();
    }
    if (this.classicAudio) {
      this.classicAudio.pause();
    }
    if (this.customAudio) {
      this.customAudio.pause();
    }
    if (this.customClassicAudio) {
      this.customClassicAudio.pause();
    }
    if (this.musicBufferSource) {
      try {
        this.musicBufferSource.stop();
        this.musicBufferSource.disconnect();
      } catch {
        // already stopped
      }
      this.musicBufferSource = null;
    }
    if (this.musicLoopTimer !== null) {
      clearTimeout(this.musicLoopTimer);
      this.musicLoopTimer = null;
    }
    this.activeMusicOscillators.forEach((osc) => {
      try {
        osc.stop();
      } catch {
        // already stopped
      }
    });
    this.activeMusicOscillators = [];
  }

  private getStepIntervalMs(track: SoundtrackId): number {
    switch (track) {
      case 'drop7_original':
        return 138; // Authentic ~108 BPM 16th-note groove
      case 'power_of_seven':
        return 280; // Hypnotic ambient pulse
      case 'drop_everything':
        return 220; // Upbeat electronic
      case 'meditative_7x7':
        return 500; // Deep slow breathing ambient
      case 'retro_arcade':
        return 160; // Fast chiptune
      case 'zen_drops':
        return 340; // Organic marimba
      default:
        return 300;
    }
  }

  private triggerTrackNote(track: SoundtrackId, step: number): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.musicGain || this.musicVolume <= 0.01) return;

    const now = ctx.currentTime;

    switch (track) {
      case 'drop7_original': {
        // Authentic Steve Horelick Drop7 Menu Theme Reproduction
        // Root progression: Dm9 (steps 0..15) -> Bbmaj7 / A7sus (steps 16..31)

        // 1. Kick on steps 0 and 8, 16, 24
        if (step % 8 === 0) {
          const kick = ctx.createOscillator();
          const kickGain = ctx.createGain();
          kick.type = 'sine';
          kick.frequency.setValueAtTime(110, now);
          kick.frequency.exponentialRampToValueAtTime(38, now + 0.08);
          kickGain.gain.setValueAtTime(0.25, now);
          kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
          kick.connect(kickGain);
          kickGain.connect(this.musicGain);
          kick.start(now);
          kick.stop(now + 0.09);
        }

        // 2. Soft shaker/click on odd steps
        if (step % 2 === 1) {
          const hatGain = ctx.createGain();
          const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.02), ctx.sampleRate);
          const d = buf.getChannelData(0);
          for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.3;
          const src = ctx.createBufferSource();
          src.buffer = buf;
          const flt = ctx.createBiquadFilter();
          flt.type = 'highpass';
          flt.frequency.setValueAtTime(6000, now);
          hatGain.gain.setValueAtTime(0.05, now);
          hatGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);
          src.connect(flt);
          flt.connect(hatGain);
          hatGain.connect(this.musicGain);
          src.start(now);
          src.stop(now + 0.02);
        }

        // 3. Sub-bass groove (Syncopated 16th-note bassline)
        const bassSteps = [0, 3, 6, 8, 10, 12, 14, 16, 19, 22, 24, 26, 28, 30];
        if (bassSteps.includes(step)) {
          const bass = ctx.createOscillator();
          const bassFilter = ctx.createBiquadFilter();
          const bassGain = ctx.createGain();

          bass.type = 'triangle';
          let f = 73.42; // D2
          if (step >= 16 && step < 24) f = 58.27; // Bb1
          else if (step >= 24) f = 55.00; // A1
          if (step === 3 || step === 19) f *= 1.5; // fifth jump (A2)
          if (step === 10 || step === 26) f *= 1.334; // fourth jump

          bass.frequency.setValueAtTime(f, now);
          bassFilter.type = 'lowpass';
          bassFilter.frequency.setValueAtTime(280, now);

          bassGain.gain.setValueAtTime(0.32, now);
          bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

          bass.connect(bassFilter);
          bassFilter.connect(bassGain);
          bassGain.connect(this.musicGain);

          bass.start(now);
          bass.stop(now + 0.22);
        }

        // 4. Warm Electric Piano / Pad chords on step 0 and 16
        if (step === 0 || step === 16) {
          const chord = step === 0 
            ? [146.83, 174.61, 220.00, 261.63, 329.63] // Dm9: D3, F3, A3, C4, E4
            : [116.54, 146.83, 174.61, 220.00, 261.63]; // Bbmaj7: Bb2, D3, F3, A3, C4

          chord.forEach((noteFreq) => {
            const pad = ctx.createOscillator();
            const padFilter = ctx.createBiquadFilter();
            const padGain = ctx.createGain();

            pad.type = 'sine';
            pad.frequency.setValueAtTime(noteFreq, now);

            padFilter.type = 'lowpass';
            padFilter.frequency.setValueAtTime(750, now);

            padGain.gain.setValueAtTime(0.08, now);
            padGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

            pad.connect(padFilter);
            padFilter.connect(padGain);
            padGain.connect(this.musicGain!);

            pad.start(now);
            pad.stop(now + 1.8);
          });
        }

        // 5. Playful 7-Note Buchla Modular Synth Arpeggio
        const arpMelody = [
          293.66, 349.23, 392.00, 440.00, 523.25, 587.33, 440.00, 349.23, // D4, F4, G4, A4, C5, D5, A4, F4
          466.16, 587.33, 698.46, 587.33, 523.25, 440.00, 392.00, 329.63, // Bb4, D5, F5, D5, C5, A4, G4, E4
        ];
        if (step % 2 === 0) {
          const noteIndex = Math.floor(step / 2) % arpMelody.length;
          const freq = arpMelody[noteIndex];

          const lead = ctx.createOscillator();
          const leadFilter = ctx.createBiquadFilter();
          const leadGain = ctx.createGain();

          lead.type = 'sine';
          lead.frequency.setValueAtTime(freq, now);

          leadFilter.type = 'bandpass';
          leadFilter.frequency.setValueAtTime(freq * 1.5, now);
          leadFilter.Q.setValueAtTime(1.8, now);

          leadGain.gain.setValueAtTime(0.16, now);
          leadGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

          lead.connect(leadFilter);
          leadFilter.connect(leadGain);
          leadGain.connect(this.musicGain);

          lead.start(now);
          lead.stop(now + 0.32);
        }
        break;
      }

      case 'power_of_seven': {
        // Steve Horelick style Buchla ambient pulse
        // Warm sub-bass drone on step 0 and 8
        if (step % 8 === 0) {
          const bass = ctx.createOscillator();
          const bassGain = ctx.createGain();
          bass.type = 'triangle';
          bass.frequency.setValueAtTime(65.41, now); // C2

          bassGain.gain.setValueAtTime(0.35, now);
          bassGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

          bass.connect(bassGain);
          bassGain.connect(this.musicGain);
          bass.start(now);
          bass.stop(now + 1.8);
        }

        // Modular melody sequence (7-note motif pattern)
        const notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33];
        const pattern = [0, 2, 4, 1, 3, 5, 2, 6, 1, 4, 3, 5, 0, 3, 2, 4];
        const targetFreq = notes[pattern[step % pattern.length]];

        if (step % 2 === 0 || step % 3 === 0) {
          const synth = ctx.createOscillator();
          const synthFilter = ctx.createBiquadFilter();
          const synthGain = ctx.createGain();

          synth.type = 'sine';
          synth.frequency.setValueAtTime(targetFreq, now);

          synthFilter.type = 'lowpass';
          synthFilter.frequency.setValueAtTime(800 + (step * 40), now);

          synthGain.gain.setValueAtTime(0.18, now);
          synthGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

          synth.connect(synthFilter);
          synthFilter.connect(synthGain);
          synthGain.connect(this.musicGain);

          synth.start(now);
          synth.stop(now + 0.45);
        }
        break;
      }

      case 'drop_everything': {
        // Rhythmic electronic synth arpeggio
        const arpeg = [196, 261.63, 329.63, 392, 493.88, 523.25, 659.25, 783.99];
        const freq = arpeg[step % arpeg.length];

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600 + Math.sin(step) * 300, now);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        osc.start(now);
        osc.stop(now + 0.28);
        break;
      }

      case 'meditative_7x7': {
        // Deep space ambient pad with fifths
        if (step % 4 === 0) {
          const chord = [130.81, 196.00, 261.63, 392.00]; // C3, G3, C4, G4
          chord.forEach((f) => {
            const pad = ctx.createOscillator();
            const padGain = ctx.createGain();
            pad.type = 'sine';
            pad.frequency.setValueAtTime(f, now);

            padGain.gain.setValueAtTime(0.001, now);
            padGain.gain.linearRampToValueAtTime(0.08, now + 0.9);
            padGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

            pad.connect(padGain);
            padGain.connect(this.musicGain!);

            pad.start(now);
            pad.stop(now + 3.2);
          });
        }
        break;
      }

      case 'retro_arcade': {
        // 8-bit pulse square arpeggios
        const retroNotes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99];
        const f = retroNotes[step % retroNotes.length];

        const chiptune = ctx.createOscillator();
        const chiptuneGain = ctx.createGain();
        chiptune.type = 'square';
        chiptune.frequency.setValueAtTime(f, now);

        chiptuneGain.gain.setValueAtTime(0.09, now);
        chiptuneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

        chiptune.connect(chiptuneGain);
        chiptuneGain.connect(this.musicGain);

        chiptune.start(now);
        chiptune.stop(now + 0.14);
        break;
      }

      case 'zen_drops': {
        // Organic marimba / bell drops
        if (step % 2 === 0) {
          const zenScale = [329.63, 392.00, 440.00, 523.25, 659.25, 783.99, 880.00];
          const f = zenScale[(step * 3) % zenScale.length];

          const wood = ctx.createOscillator();
          const woodGain = ctx.createGain();
          wood.type = 'triangle';
          wood.frequency.setValueAtTime(f, now);

          woodGain.gain.setValueAtTime(0.24, now);
          woodGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

          wood.connect(woodGain);
          woodGain.connect(this.musicGain);

          wood.start(now);
          wood.stop(now + 0.55);
        }
        break;
      }

      default:
        break;
    }
  }
}

export const audioEngine = new AudioEngine();
