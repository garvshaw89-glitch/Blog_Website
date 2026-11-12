import * as THREE from 'three';

/**
 * CINEMATIC FLOATING MICRO-PARTICLE SYSTEM
 *
 * - Frame-rate-independent exponential damping across all motion & opacity
 * - Smooth harmonic orbital drift with cursor parallax
 * - Smoothly blended warp acceleration on Enter transition
 */
export class ParticleField {
  public points: THREE.Points;

  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private texture: THREE.CanvasTexture;

  private count: number;
  private positions: Float32Array;
  private basePositions: Float32Array;

  private currentOpacity = 0;
  private targetOpacity = 0.35;

  constructor(isMobile: boolean = false) {
    this.count = isMobile ? 220 : 480;

    this.positions = new Float32Array(this.count * 3);
    this.basePositions = new Float32Array(this.count * 3);

    for (let i = 0; i < this.count; i++) {
      const idx = i * 3;
      const radius = 1.6 + Math.pow(Math.random(), 0.7) * 7.8;
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
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

    this.texture = (() => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.25, 'rgba(186, 230, 253, 0.85)');
        grad.addColorStop(0.65, 'rgba(125, 211, 252, 0.18)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 64, 64);
      }
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    })();

    this.material = new THREE.PointsMaterial({
      size: isMobile ? 0.075 : 0.088,
      map: this.texture,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.points = new THREE.Points(this.geometry, this.material);
  }

  public update(
    time: number,
    delta: number,
    mouseX: number,
    mouseY: number,
    isTransitioning: boolean
  ) {
    const pos = this.geometry.attributes.position.array as Float32Array;

    this.currentOpacity = THREE.MathUtils.damp(
      this.currentOpacity,
      this.targetOpacity,
      isTransitioning ? 2.8 : 3.8,
      delta
    );
    this.material.opacity = this.currentOpacity;

    const dampFactor = 1 - Math.exp(-3.4 * delta);

    for (let i = 0; i < this.count; i++) {
      const idx = i * 3;
      const bx = this.basePositions[idx];
      const by = this.basePositions[idx + 1];
      const bz = this.basePositions[idx + 2];

      const driftX = Math.sin(time * 0.36 + i * 0.2) * 0.18;
      const driftY = Math.cos(time * 0.32 + i * 0.3) * 0.2;
      const driftZ = Math.sin(time * 0.24 + i * 0.5) * 0.15;

      const targetX = bx + driftX - mouseX * 0.32;
      const targetY = by + driftY + mouseY * 0.32;
      const targetZ = bz + driftZ;

      pos[idx] += (targetX - pos[idx]) * dampFactor;
      pos[idx + 1] += (targetY - pos[idx + 1]) * dampFactor;
      pos[idx + 2] += (targetZ - pos[idx + 2]) * dampFactor;
    }

    this.geometry.attributes.position.needsUpdate = true;
  }

  public setTargetOpacity(opacity: number) {
    this.targetOpacity = Math.max(0, Math.min(1, opacity));
  }

  public dispose() {
    this.geometry.dispose();
    this.material.dispose();
    this.texture.dispose();
  }
}
