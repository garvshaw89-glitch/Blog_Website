import * as THREE from 'three';

/**
 * CINEMATIC FLOATING MICRO-PARTICLE SYSTEM
 * 
 * Provides:
 * - Scene 01: Subtle floating micro-particles in cosmic darkness
 * - Scene 02–04: Harmonic orbital drift with mouse-responsive parallax repulsion
 * - Scene 05: Warp velocity stretching into cinematic light trails past camera
 */
export class ParticleField {
  public points: THREE.Points;

  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private texture: THREE.CanvasTexture;

  private count: number;
  private positions: Float32Array;
  private basePositions: Float32Array;
  private velocities: Float32Array;

  constructor(isMobile: boolean = false) {
    this.count = isMobile ? 240 : 520;

    this.positions = new Float32Array(this.count * 3);
    this.basePositions = new Float32Array(this.count * 3);
    this.velocities = new Float32Array(this.count * 3);

    for (let i = 0; i < this.count; i++) {
      const idx = i * 3;
      // Spherical distribution around center with broad depth
      const radius = 1.4 + Math.pow(Math.random(), 0.7) * 7.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      this.positions[idx] = x;
      this.positions[idx + 1] = y;
      this.positions[idx + 2] = z;

      this.basePositions[idx] = x;
      this.basePositions[idx + 1] = y;
      this.basePositions[idx + 2] = z;

      this.velocities[idx] = (Math.random() - 0.5) * 0.02;
      this.velocities[idx + 1] = (Math.random() - 0.5) * 0.02;
      this.velocities[idx + 2] = 0.5 + Math.random() * 2.0; // Warp forward velocity
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

    // High-resolution soft radial point sprite
    this.texture = (() => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.25, 'rgba(186, 230, 253, 0.85)'); // subtle cyan edge
        grad.addColorStop(0.65, 'rgba(125, 211, 252, 0.2)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 64, 64);
      }
      return new THREE.CanvasTexture(canvas);
    })();

    this.material = new THREE.PointsMaterial({
      size: isMobile ? 0.075 : 0.09,
      map: this.texture,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.points = new THREE.Points(this.geometry, this.material);
  }

  public update(time: number, delta: number, mouseX: number, mouseY: number, isTransitioning: boolean) {
    const pos = this.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < this.count; i++) {
      const idx = i * 3;

      if (isTransitioning) {
        // Warp transition: stretch and fly forward past camera!
        pos[idx + 2] += this.velocities[idx + 2] * delta * 24.0;
        pos[idx] += pos[idx] * delta * 2.5;
        pos[idx + 1] += pos[idx + 1] * delta * 2.5;

        // Reset if past camera
        if (pos[idx + 2] > 14.0) {
          pos[idx + 2] = -6.0;
        }
      } else {
        const bx = this.basePositions[idx];
        const by = this.basePositions[idx + 1];
        const bz = this.basePositions[idx + 2];

        // Smooth harmonic micro-drift
        const driftX = Math.sin(time * 0.4 + i * 0.2) * 0.18;
        const driftY = Math.cos(time * 0.35 + i * 0.3) * 0.2;
        const driftZ = Math.sin(time * 0.25 + i * 0.5) * 0.15;

        // Damped mouse interaction
        const targetX = bx + driftX - mouseX * 0.3;
        const targetY = by + driftY + mouseY * 0.3;
        const targetZ = bz + driftZ;

        pos[idx] += (targetX - pos[idx]) * 0.04;
        pos[idx + 1] += (targetY - pos[idx + 1]) * 0.04;
        pos[idx + 2] += (targetZ - pos[idx + 2]) * 0.04;
      }
    }

    this.geometry.attributes.position.needsUpdate = true;
  }

  public setOpacity(opacity: number) {
    this.material.opacity = Math.max(0, Math.min(1, opacity));
  }

  public dispose() {
    this.geometry.dispose();
    this.material.dispose();
    this.texture.dispose();
  }
}
