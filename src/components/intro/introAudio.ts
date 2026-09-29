/**
 * OPTIONAL USER-INITIATED LUXURY AUDIO SYNTHESIS
 * 
 * Powered by Web Audio API — zero external mp3/wav asset downloads.
 * Strictly inactive unless the visitor explicitly clicks the Sound toggle.
 */

class IntroAudioEngine {
  private ctx: AudioContext | null = null;
  private isEnabled: boolean = false;
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;

  public toggle(): boolean {
    if (!this.isEnabled) {
      this.start();
      return true;
    } else {
      this.stop();
      return false;
    }
  }

  public get enabled(): boolean {
    return this.isEnabled;
  }

  public start() {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();
      this.isEnabled = true;

      // Master low-pass filter for velvety luxury warmth
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 320;
      filter.connect(this.ctx.destination);

      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.droneGain.gain.exponentialRampToValueAtTime(0.12, this.ctx.currentTime + 2.0);
      this.droneGain.connect(filter);

      // Deep 48Hz Sub-bass drone
      this.droneOsc1 = this.ctx.createOscillator();
      this.droneOsc1.type = 'sine';
      this.droneOsc1.frequency.setValueAtTime(48, this.ctx.currentTime);
      this.droneOsc1.connect(this.droneGain);
      this.droneOsc1.start();

      // Warm 96Hz overtone
      this.droneOsc2 = this.ctx.createOscillator();
      this.droneOsc2.type = 'triangle';
      this.droneOsc2.frequency.setValueAtTime(96.4, this.ctx.currentTime);
      this.droneOsc2.connect(this.droneGain);
      this.droneOsc2.start();
    } catch {
      this.isEnabled = false;
    }
  }

  public triggerChime(freq: number = 528) {
    if (!this.isEnabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 1.9);
    } catch {
      // Ignore
    }
  }

  public triggerWarp() {
    if (!this.isEnabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(60, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(380, this.ctx.currentTime + 0.8);

      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, this.ctx.currentTime + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.9);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.95);
    } catch {
      // Ignore
    }
  }

  public stop() {
    this.isEnabled = false;
    try {
      if (this.droneGain && this.ctx) {
        this.droneGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.5);
      }
      setTimeout(() => {
        this.droneOsc1?.stop();
        this.droneOsc2?.stop();
        this.ctx?.close();
        this.ctx = null;
      }, 550);
    } catch {
      // Ignore
    }
  }
}

export const introAudio = new IntroAudioEngine();
