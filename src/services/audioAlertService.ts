class AudioAlertService {
  private audioCtx: AudioContext | null = null;
  private sirenOscillator: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private sirenTimer: number | null = null;
  private isMuted: boolean = false;
  private voiceEnabled: boolean = true;
  private lastSpokenDistance: number = 0;
  private lastSpokenTime: number = 0;
  private cachedVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          this.loadVoices();
        };
      }
    }
  }

  private loadVoices() {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        this.cachedVoices = window.speechSynthesis.getVoices();
      }
    } catch {
      // Ignore
    }
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (this.cachedVoices.length === 0 && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.loadVoices();
    }
    return this.cachedVoices;
  }

  private initContext() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopSiren();
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setVoiceEnabled(enabled: boolean) {
    this.voiceEnabled = enabled;
  }

  public getVoiceEnabled(): boolean {
    return this.voiceEnabled;
  }

  /**
   * High-priority acoustic pre-alert chime (2 distinct melodic pings with resonant reverb tail)
   * Designed to grab the driver's attention before siren frequency is acoustically audible.
   */
  public playPreAlertChime() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;

      // Primary tone
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now); // A5
      osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.12); // E6

      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.exponentialRampToValueAtTime(0.35, now + 0.03);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.45);

      // Second harmonic confirmation ping
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1760, now + 0.14); // A6
      osc2.frequency.exponentialRampToValueAtTime(2200, now + 0.26);

      gain2.gain.setValueAtTime(0.001, now + 0.14);
      gain2.gain.exponentialRampToValueAtTime(0.25, now + 0.17);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);
      osc2.start(now + 0.14);
      osc2.stop(now + 0.55);
    } catch {
      // AudioContext could fail gracefully if backgrounded
    }
  }

  /**
   * Spoken synthetic navigation advisory
   */
  public speakAlert(text: string, distanceMeters?: number) {
    if (this.isMuted || !this.voiceEnabled) return;
    if (!('speechSynthesis' in window)) return;

    const now = Date.now();
    // Throttle voice alerts to prevent speech queue buildup
    if (now - this.lastSpokenTime < 4500) {
      return;
    }

    if (distanceMeters !== undefined) {
      if (Math.abs(distanceMeters - this.lastSpokenDistance) < 70 && now - this.lastSpokenTime < 10000) {
        return;
      }
      this.lastSpokenDistance = distanceMeters;
    }

    this.lastSpokenTime = now;
    window.speechSynthesis.cancel(); // Cancel stale queued phrases

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.08;
    utterance.pitch = 1.05;
    utterance.volume = 0.85;

    // Pick appropriate voice
    const voices = this.getAvailableVoices();
    const isGujarati = /[\u0A80-\u0AFF]/.test(text);

    if (isGujarati) {
      utterance.lang = 'gu-IN';
      const guVoice = voices.find(
        v => v.lang.startsWith('gu') || v.lang === 'gu-IN' || v.lang.includes('IN')
      );
      if (guVoice) utterance.voice = guVoice;
    } else {
      utterance.lang = 'en-US';
      const enVoice = voices.find(
        v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Alex'))
      );
      if (enVoice) utterance.voice = enVoice;
    }

    window.speechSynthesis.speak(utterance);
  }

  /**
   * Optional siren tone synthesis for ambulance cockpit preview
   */
  public startSiren(mode: 'wail' | 'yelp' | 'hi_lo' = 'wail') {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.audioCtx) return;
      if (this.sirenOscillator) return; // Already running

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sawtooth';

      gain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);

      // Low pass filter to soften the harshness of sawtooth wave
      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, this.audioCtx.currentTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioCtx.destination);

      const startTime = this.audioCtx.currentTime;
      let step = 0;

      if (mode === 'yelp') {
        // Fast modulating siren
        const cycle = 0.35;
        for (let i = 0; i < 40; i++) {
          const t = startTime + i * cycle;
          osc.frequency.setValueAtTime(650, t);
          osc.frequency.linearRampToValueAtTime(1300, t + cycle * 0.7);
          osc.frequency.linearRampToValueAtTime(650, t + cycle);
        }
      } else if (mode === 'hi_lo') {
        // European 2-tone
        const cycle = 0.6;
        for (let i = 0; i < 30; i++) {
          const t = startTime + i * cycle;
          osc.frequency.setValueAtTime(800, t);
          osc.frequency.setValueAtTime(600, t + cycle * 0.5);
        }
      } else {
        // Classic wail
        const cycle = 1.8;
        for (let i = 0; i < 20; i++) {
          const t = startTime + i * cycle;
          osc.frequency.setValueAtTime(500, t);
          osc.frequency.linearRampToValueAtTime(1100, t + cycle * 0.5);
          osc.frequency.linearRampToValueAtTime(500, t + cycle);
        }
      }

      osc.start(startTime);
      this.sirenOscillator = osc;
      this.sirenGain = gain;
    } catch {
      // AudioContext fallback
    }
  }

  /**
   * Realistic radio microphone keying and unkeying squelch chirp
   */
  public playMicClick(isKeying: boolean = true) {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;

      if (isKeying) {
        // High frequency squelch burst (like Motorola/Whelen radio mic key)
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1450, now);
        osc.frequency.exponentialRampToValueAtTime(2100, now + 0.04);
        osc.frequency.setValueAtTime(1200, now + 0.05);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.25, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        // Bandpass filter to create radio resonance
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1800, now);
        filter.Q.setValueAtTime(3, now);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.09);
      } else {
        // Release squelch tail click
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.06);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.06);
      }
    } catch {
      // AudioContext fallback
    }
  }

  /**
   * Emergency Vehicle Public Address (PA) speech synthesis using Web Speech API
   * Immediately speaks custom broadcast message aloud, mimicking a vehicular PA system.
   */
  public broadcastPA(
    text: string,
    lang: 'en' | 'gu' = 'en',
    onStart?: () => void,
    onEnd?: () => void,
    options?: { rate?: number; pitch?: number; volume?: number; voiceURI?: string }
  ) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }

    // Play mic keying chirp
    this.playMicClick(true);

    // Cancel any pending speech queue so the PA announcement takes immediate priority
    window.speechSynthesis.cancel();

    let hasEnded = false;
    const finishCallback = () => {
      if (hasEnded) return;
      hasEnded = true;
      this.playMicClick(false); // Squelch release click
      if (onEnd) onEnd();
    };

    // Short timeout to allow the mic squelch chirp to lead the speech
    setTimeout(() => {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = options?.rate ?? 0.98; // Authoritative, deliberate PA pace
        utterance.pitch = options?.pitch ?? 1.02;
        utterance.volume = options?.volume ?? 1.0;

        // Select matching voice
        const voices = this.getAvailableVoices();
        const isGujaratiText = /[\u0A80-\u0AFF]/.test(text) || lang === 'gu';

        if (options?.voiceURI) {
          const chosen = voices.find(v => v.voiceURI === options.voiceURI);
          if (chosen) utterance.voice = chosen;
        } else if (isGujaratiText) {
          utterance.lang = 'gu-IN';
          // Attempt to find Gujarati or Indian localized voice
          const guVoice = voices.find(
            v => v.lang.startsWith('gu') || v.lang === 'gu-IN' || v.lang.includes('IN')
          );
          if (guVoice) utterance.voice = guVoice;
        } else {
          utterance.lang = 'en-US';
          // Crisp authoritative English voice
          const enVoice = voices.find(
            v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Alex') || v.name.includes('Daniel') || v.name.includes('Samantha'))
          );
          if (enVoice) utterance.voice = enVoice;
        }

        utterance.onstart = () => {
          if (onStart) onStart();
        };

        utterance.onend = () => {
          finishCallback();
        };

        utterance.onerror = () => {
          finishCallback();
        };

        // Safety fallback timer in case browser stalls
        const estimatedDurationMs = Math.max(3000, Math.ceil((text.length / 10) * 1200));
        setTimeout(() => {
          if (!hasEnded && !window.speechSynthesis.speaking) {
            finishCallback();
          }
        }, estimatedDurationMs + 1500);

        window.speechSynthesis.speak(utterance);
      } catch {
        finishCallback();
      }
    }, 90);
  }

  public cancelBroadcast(onEnd?: () => void) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.playMicClick(false);
    }
    if (onEnd) onEnd();
  }

  public stopSiren() {
    if (this.sirenOscillator) {
      try {
        this.sirenOscillator.stop();
        this.sirenOscillator.disconnect();
      } catch {
        // Ignore stop error
      }
      this.sirenOscillator = null;
    }
    if (this.sirenGain) {
      try {
        this.sirenGain.disconnect();
      } catch {
        // Ignore
      }
      this.sirenGain = null;
    }
    if (this.sirenTimer) {
      window.clearTimeout(this.sirenTimer);
      this.sirenTimer = null;
    }
  }
}

export const audioAlertService = new AudioAlertService();
