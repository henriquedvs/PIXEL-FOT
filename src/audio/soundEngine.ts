import { GameSettings } from '../types/game';
import { DEFAULT_SETTINGS } from '../utils/storage';

type SoundKind =
  | 'menu'
  | 'kick'
  | 'pass'
  | 'ball'
  | 'post'
  | 'net'
  | 'whistle'
  | 'whistleLong'
  | 'crowd'
  | 'crowdOoh'
  | 'crowdBoo'
  | 'crowdChant'
  | 'applause'
  | 'goalRoar'
  | 'flagWave'
  | 'footstep'
  | 'trainingHit'
  | 'celebration';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private settings: GameSettings = DEFAULT_SETTINGS;
  private musicTimer: number | null = null;
  private crowdNode: AudioNode | null = null;
  private crowdGain: GainNode | null = null;
  private stepIdx = 0;
  private currentMusicMode: 'none' | 'menu' | 'match' = 'none';

  public updateSettings(s: GameSettings) {
    this.settings = s;
    if (this.crowdGain && this.ctx) {
      const vol = this.getEffectiveSfxVol('crowdVolume') * 0.08;
      this.crowdGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.1);
    }
    if (!s.audio.musicEnabled && this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    } else if (s.audio.musicEnabled && this.currentMusicMode === 'menu' && this.musicTimer === null) {
      this.startMenuMusic();
    }
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private getEffectiveSfxVol(channel: keyof GameSettings['audio']): number {
    if (!this.settings.audio.sfxEnabled) return 0;
    const master = this.settings.audio.sfxVolume;
    const ch = Number(this.settings.audio[channel] ?? 1);
    return Math.max(0, Math.min(1, master * ch));
  }

  public unlock() {
    this.ensureContext();
  }

  public vibrate(ms = 20) {
    if (this.settings.vibration && typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(ms);
      } catch {
        // ignore
      }
    }
  }

  public startMenuMusic() {
    this.currentMusicMode = 'menu';
    this.stopCrowdAmbience();
    if (!this.settings.audio.musicEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (this.musicTimer !== null) return;

    const chords = [
      [220, 261.63, 329.63],
      [174.61, 220, 261.63],
      [261.63, 329.63, 392.0],
      [196.0, 246.94, 293.66],
    ];
    const bass = [110, 87.31, 130.81, 98.0];

    this.musicTimer = window.setInterval(() => {
      if (!this.settings.audio.musicEnabled || this.currentMusicMode !== 'menu') return;
      const c = this.ensureContext();
      if (!c || c.state !== 'running') return;
      const vol = this.settings.audio.musicVolume * 0.14;
      if (vol <= 0.002) return;

      const bar = Math.floor(this.stepIdx / 4) % chords.length;
      const beat = this.stepIdx % 4;
      const now = c.currentTime;

      const noteFreq = chords[bar][beat % 3];
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(noteFreq, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.36);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(now);
      osc.stop(now + 0.38);

      if (beat === 0 || beat === 2) {
        const bOsc = c.createOscillator();
        const bGain = c.createGain();
        bOsc.type = 'sine';
        bOsc.frequency.setValueAtTime(bass[bar], now);
        bGain.gain.setValueAtTime(0.0001, now);
        bGain.gain.linearRampToValueAtTime(vol * 1.1, now + 0.02);
        bGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
        bOsc.connect(bGain);
        bGain.connect(c.destination);
        bOsc.start(now);
        bOsc.stop(now + 0.45);
      }

      this.stepIdx++;
    }, 380);
  }

  public startMatchAudio() {
    this.currentMusicMode = 'match';
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    this.startCrowdAmbience();
  }

  public stopAllMusic() {
    this.currentMusicMode = 'none';
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    this.stopCrowdAmbience();
  }

  private startCrowdAmbience() {
    const ctx = this.ensureContext();
    if (!ctx || this.crowdNode) return;
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 2.2;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 520;
    filter.Q.value = 0.8;

    const gain = ctx.createGain();
    const vol = this.getEffectiveSfxVol('crowdVolume') * 0.08;
    gain.gain.value = vol;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();

    this.crowdNode = noise;
    this.crowdGain = gain;
  }

  private stopCrowdAmbience() {
    if (this.crowdNode && 'stop' in this.crowdNode) {
      try {
        (this.crowdNode as AudioBufferSourceNode).stop();
      } catch {
        // ignore
      }
    }
    this.crowdNode = null;
    this.crowdGain = null;
  }

  public play(kind: SoundKind) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const jitter = 0.94 + Math.random() * 0.12;

    switch (kind) {
      case 'menu': {
        const vol = this.getEffectiveSfxVol('menuVolume') * 0.16;
        if (vol <= 0.001) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520 * jitter, now);
        osc.frequency.exponentialRampToValueAtTime(760, now + 0.05);
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
        break;
      }
      case 'footstep': {
        const vol = this.getEffectiveSfxVol('footstepVolume') * 0.05;
        if (vol <= 0.001) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(95 * jitter, now);
        osc.frequency.exponentialRampToValueAtTime(48, now + 0.035);
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.045);
        break;
      }
      case 'trainingHit': {
        const vol = this.getEffectiveSfxVol('menuVolume') * 0.22;
        if (vol <= 0.001) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(660, now);
        osc.frequency.setValueAtTime(880, now + 0.06);
        gain.gain.setValueAtTime(vol * 0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.18);
        break;
      }
      case 'ball': {
        const vol = this.getEffectiveSfxVol('ballVolume') * 0.14;
        if (vol <= 0.001) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140 * jitter, now);
        osc.frequency.exponentialRampToValueAtTime(65, now + 0.05);
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.065);
        break;
      }
      case 'pass': {
        const vol = this.getEffectiveSfxVol('passVolume') * 0.24;
        if (vol <= 0.001) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(195 * jitter, now);
        osc.frequency.exponentialRampToValueAtTime(75, now + 0.08);
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      }
      case 'kick': {
        const vol = this.getEffectiveSfxVol('kickVolume') * 0.34;
        if (vol <= 0.001) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(230 * jitter, now);
        osc.frequency.exponentialRampToValueAtTime(48, now + 0.14);
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.16);
        this.vibrate(25);
        break;
      }
      case 'post': {
        const vol = this.getEffectiveSfxVol('ballVolume') * 0.3;
        if (vol <= 0.001) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(640, now);
        osc.frequency.exponentialRampToValueAtTime(420, now + 0.25);
        gain.gain.setValueAtTime(vol * 0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
        this.vibrate(40);
        break;
      }
      case 'net': {
        const vol = this.getEffectiveSfxVol('netVolume') * 0.28;
        if (vol <= 0.001) return;
        const len = Math.floor(ctx.sampleRate * 0.22);
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 1200;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        src.start(now);
        break;
      }
      case 'whistle':
      case 'whistleLong': {
        const vol = this.getEffectiveSfxVol('whistleVolume') * 0.22;
        if (vol <= 0.001) return;
        const dur = kind === 'whistleLong' ? 0.52 : 0.2;
        const osc = ctx.createOscillator();
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2850, now);
        lfo.frequency.value = 36;
        lfoGain.gain.value = 110;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(vol, now + 0.02);
        gain.gain.setValueAtTime(vol, now + dur - 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        lfo.start(now);
        osc.start(now);
        lfo.stop(now + dur + 0.02);
        osc.stop(now + dur + 0.02);
        break;
      }
      case 'crowd':
      case 'crowdOoh':
      case 'crowdBoo':
      case 'goalRoar':
      case 'flagWave': {
        const mult =
          kind === 'goalRoar'
            ? 0.36
            : kind === 'crowd'
            ? 0.28
            : kind === 'flagWave'
            ? 0.1
            : 0.16;
        const vol = this.getEffectiveSfxVol('crowdVolume') * mult;
        if (vol <= 0.001) return;
        const dur = kind === 'goalRoar' ? 1.8 : kind === 'crowd' ? 1.1 : kind === 'flagWave' ? 0.45 : 0.55;
        const len = Math.floor(ctx.sampleRate * dur);
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) {
          const env = Math.sin((i / len) * Math.PI);
          d[i] = (Math.random() * 2 - 1) * env;
        }
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value =
          kind === 'crowdBoo'
            ? 360
            : kind === 'crowdOoh'
            ? 920
            : kind === 'flagWave'
            ? 320
            : kind === 'goalRoar'
            ? 860
            : 760;
        const gain = ctx.createGain();
        gain.gain.value = vol;
        src.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        src.start(now);
        break;
      }
      case 'crowdChant': {
        const vol = this.getEffectiveSfxVol('crowdVolume') * 0.14;
        if (vol <= 0.001) return;
        // Rhythmic stadium drum + chant pulse (3 beats)
        const beats = [0, 0.26, 0.52];
        beats.forEach((offset, idx) => {
          const t = now + offset;
          const drum = ctx.createOscillator();
          const dGain = ctx.createGain();
          drum.type = 'sine';
          drum.frequency.setValueAtTime(idx === 2 ? 120 : 95, t);
          drum.frequency.exponentialRampToValueAtTime(42, t + 0.14);
          dGain.gain.setValueAtTime(vol, t);
          dGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
          drum.connect(dGain);
          dGain.connect(ctx.destination);
          drum.start(t);
          drum.stop(t + 0.18);
        });
        break;
      }
      case 'applause': {
        const vol = this.getEffectiveSfxVol('crowdVolume') * 0.16;
        if (vol <= 0.001) return;
        for (let b = 0; b < 4; b++) {
          const t = now + b * 0.11;
          const len = Math.floor(ctx.sampleRate * 0.09);
          const buf = ctx.createBuffer(1, len, ctx.sampleRate);
          const d = buf.getChannelData(0);
          for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
          const src = ctx.createBufferSource();
          src.buffer = buf;
          const filter = ctx.createBiquadFilter();
          filter.type = 'highpass';
          filter.frequency.value = 1400;
          const g = ctx.createGain();
          g.gain.value = vol * 0.7;
          src.connect(filter);
          filter.connect(g);
          g.connect(ctx.destination);
          src.start(t);
        }
        break;
      }
      case 'celebration': {
        const vol = this.getEffectiveSfxVol('celebrationVolume') * 0.22;
        if (vol <= 0.001) return;
        const fanfare = [523.25, 659.25, 783.99, 1046.5];
        fanfare.forEach((freq, i) => {
          const t = now + i * 0.1;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(freq * jitter, t);
          gain.gain.setValueAtTime(vol * 0.65, t);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.28);
        });
        this.vibrate(75);
        break;
      }
    }
  }
}

export const soundEngine = new SoundEngine();
