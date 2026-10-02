import * as THREE from 'three';

/**
 * PHYSICS-BASED CINEMATIC CAMERA CONTROLLER (Sections 29, 44, 46)
 * 
 * Implements:
 * - Second-order spring-damper following (camera lag creates mass & weight)
 * - Impulse-based camera shake (decaying damped harmonic oscillator)
 * - Dynamic FOV expansion during supersonic flight
 * - Smooth lookAt inertia
 */
export class CameraPhysics {
  public position: THREE.Vector3 = new THREE.Vector3(0, -12, 16);
  public velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public lookAt: THREE.Vector3 = new THREE.Vector3(0, -16, -12);
  public lookAtVelocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  // Dynamic Camera Shake State (Section 44)
  private shakeAmount: number = 0;
  private shakeVelocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private shakeOffset: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  // Physical Spring Constants
  private springStiffness: number = 24.0;
  private dampingFactor: number = 6.5;

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.position.set(0, -12, 16);
    this.velocity.set(0, 0, 0);
    this.lookAt.set(0, -16, -12);
    this.lookAtVelocity.set(0, 0, 0);
    this.shakeAmount = 0;
    this.shakeVelocity.set(0, 0, 0);
    this.shakeOffset.set(0, 0, 0);
  }

  /**
   * Adds an impulse to camera shake (e.g. engine ignition, sonic flyby, landing impact)
   */
  public addImpulse(strength: number): void {
    this.shakeAmount += strength;
    this.shakeVelocity.x += (Math.random() - 0.5) * strength * 8.0;
    this.shakeVelocity.y += (Math.random() - 0.5) * strength * 8.0;
    this.shakeVelocity.z += (Math.random() - 0.5) * strength * 8.0;
  }

  /**
   * Physical Camera Integration Step
   */
  public update(
    dt: number,
    targetPos: THREE.Vector3,
    targetLookAt: THREE.Vector3,
    mouseOffset: { x: number; y: number },
    externalShake: number = 0,
    reducedMotion: boolean = false
  ): { position: THREE.Vector3; lookAt: THREE.Vector3 } {
    const clampedDt = Math.min(dt, 0.05);

    // 1. Spring-Damper Position Follow (Section 29: Camera has mass & lags behind rocket)
    const posError = new THREE.Vector3().copy(targetPos).sub(this.position);
    posError.x += mouseOffset.x * 0.8;
    posError.y += mouseOffset.y * 0.6;

    const springAccel = posError.multiplyScalar(this.springStiffness);
    const dampingForce = this.velocity.clone().multiplyScalar(this.dampingFactor);
    const netAccel = springAccel.sub(dampingForce);

    this.velocity.addScaledVector(netAccel, clampedDt);
    this.position.addScaledVector(this.velocity, clampedDt);

    // 2. LookAt Inertia
    const lookAtError = new THREE.Vector3().copy(targetLookAt).sub(this.lookAt);
    const lookAtAccel = lookAtError.multiplyScalar(32.0).sub(this.lookAtVelocity.clone().multiplyScalar(8.0));
    this.lookAtVelocity.addScaledVector(lookAtAccel, clampedDt);
    this.lookAt.addScaledVector(this.lookAtVelocity, clampedDt);

    // 3. Physical Impulse-Based Camera Shake (Section 44)
    if (!reducedMotion) {
      if (externalShake > 0.02) {
        this.addImpulse(externalShake * 0.15);
      }

      // Damped harmonic shake decay
      this.shakeVelocity.x += -this.shakeOffset.x * 45.0 - this.shakeVelocity.x * 12.0;
      this.shakeVelocity.y += -this.shakeOffset.y * 45.0 - this.shakeVelocity.y * 12.0;
      this.shakeVelocity.z += -this.shakeOffset.z * 45.0 - this.shakeVelocity.z * 12.0;

      this.shakeOffset.addScaledVector(this.shakeVelocity, clampedDt);
      this.shakeAmount *= Math.max(0, 1.0 - clampedDt * 6.5);
    } else {
      this.shakeOffset.set(0, 0, 0);
    }

    const finalPos = this.position.clone().add(this.shakeOffset);

    return {
      position: finalPos,
      lookAt: this.lookAt.clone(),
    };
  }
}
