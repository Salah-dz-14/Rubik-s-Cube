// Web Audio API sound synthesizer for offline speedcubing
class SoundEffects {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Realistic mechanical cube slice click
  public playClick(pitchMultiplier: number = 1.0) {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Bandpass filter to emulate plastic click
      filter.type = 'bandpass';
      filter.frequency.value = 1400 * pitchMultiplier;
      filter.Q.value = 3.5;

      // Pitch sweep
      const now = this.ctx.currentTime;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320 * pitchMultiplier, now);
      osc.frequency.exponentialRampToValueAtTime(80 * pitchMultiplier, now + 0.035);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.045);
    } catch {
      // Ignore audio failure
    }
  }

  // Timer ready tone (Speedstacks green light tone)
  public playReadyTone() {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch {
      // Ignore
    }
  }

  // Inspection countdown tick
  public playTick(urgent: boolean = false) {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(urgent ? 1046.5 : 523.25, now);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch {
      // Ignore
    }
  }

  // Victory fanfare on solve
  public playVictoryFanfare() {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const now = this.ctx.currentTime;

      notes.forEach((freq, index) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + index * 0.09;
        const duration = index === notes.length - 1 ? 0.45 : 0.15;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.28, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + duration + 0.01);
      });
    } catch {
      // Ignore
    }
  }
}

export const sound = new SoundEffects();
