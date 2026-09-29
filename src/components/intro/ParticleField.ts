import * as THREE from 'three';

/**
 * AMBIENT KNOWLEDGE PARTICLE FIELD
 * 
 * Disciplined, GPU-optimized floating micro-particles surrounding the central monolith.
 * Uses a single BufferGeometry Points mesh with procedural soft-radial alpha map.
 */
export class ParticleField {
  public points: THREE.Points;

  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private texture: THREE.CanvasTexture;

  private positions: Float32Array;
  private basePositions: Float32Array;
  private count: number;

  constructor(isMobile: boolean = false) {
    this.count = isMobile ? 180 : 380;

    this.positions = new Float32Array(this.count * 3);
    this.basePositions = new Float32Array(this.count * 3);

    for (let i = 0; i < this.count; i++) {
      const idx = i * 3;
      // Spherical distribution around center with depth
      const radius = 1.8 + Math.random() * 6.5;
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

    // Procedural soft-radial circular point sprite
    this.texture = (() => {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.3, 'rgba(235, 238, 245, 0.7)');
        grad.addColorStop(0.8, 'rgba(200, 205, 215, 0.15)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 32, 32);
      }
      return new THREE.CanvasTexture(canvas);
    })();

    this.material = new THREE.PointsMaterial({
      size: isMobile ? 0.08 : 0.09,
      map: this.texture,
      transparent: true,
      opacity: 0, // Fades in according to timeline
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.points = new THREE.Points(this.geometry, this.material);
  }

  public update(time: number, mouseX: number, mouseY: number, isTransitioning: boolean) {
    const pos = this.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < this.count; i++) {
      const idx = i * 3;
      const bx = this.basePositions[idx];
      const by = this.basePositions[idx + 1];
      const bz = this.basePositions[idx + 2];

      // Subtle slow harmonic drift
      const driftX = Math.sin(time * 0.4 + i) * 0.15;
      const driftY = Math.cos(time * 0.35 + i * 0.5) * 0.18;
      const driftZ = Math.sin(time * 0.25 + i * 0.8) * 0.12;

      // Restrained mouse repulsion
      const targetX = bx + driftX - mouseX * 0.25;
      const targetY = by + driftY + mouseY * 0.25;
      const targetZ = bz + driftZ;

      if (isTransitioning) {
        // Accelerate outwards during portal transition
        pos[idx] += (pos[idx] * 0.06);
        pos[idx + 1] += (pos[idx + 1] * 0.06);
        pos[idx + 2] += (pos[idx + 2] * 0.08);
      } else {
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
