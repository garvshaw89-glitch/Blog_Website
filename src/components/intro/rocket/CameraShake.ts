import * as THREE from 'three';

/**
 * Impact-driven damped camera shake controller.
 * Remains completely silent until triggered on landing touchdown, then delivers
 * sharp multi-axis horizontal/vertical impulse and subtle Z-roll with rapid damping.
 */
export class CameraShake {
  private active = false;
  private elapsed = 0;
  private duration = 0.72;
  private intensity = 0;

  public readonly offset = new THREE.Vector3();
  public rotZ = 0;
  public rotX = 0;

  public trigger(intensity = 0.24, duration = 0.72): void {
    this.active = true;
    this.elapsed = 0;
    this.intensity = intensity;
    this.duration = duration;
  }

  public update(delta: number): void {
    if (!this.active) {
      this.offset.set(0, 0, 0);
      this.rotZ = 0;
      this.rotX = 0;
      return;
    }

    this.elapsed += delta;
    if (this.elapsed >= this.duration) {
      this.active = false;
      this.offset.set(0, 0, 0);
      this.rotZ = 0;
      this.rotX = 0;
      return;
    }

    const t = this.elapsed;
    const damp = Math.exp(-6.8 * t);
    const amp = this.intensity * damp;

    // Multi-frequency damped tremor across X, Y, Z & roll
    this.offset.set(
      (Math.sin(t * 58.0) * 0.65 + Math.cos(t * 94.0) * 0.35) * amp,
      (Math.cos(t * 64.0) * 0.7 + Math.sin(t * 107.0) * 0.3) * amp,
      Math.sin(t * 42.0) * amp * 0.45
    );
    this.rotZ = Math.sin(t * 52.0) * amp * 0.085;
    this.rotX = Math.cos(t * 48.0) * amp * 0.055;
  }

  public reset(): void {
    this.active = false;
    this.elapsed = 0;
    this.offset.set(0, 0, 0);
    this.rotZ = 0;
    this.rotX = 0;
  }
}
