import * as THREE from 'three';

/**
 * CROSSED ORBITAL LASER RINGS (00:05 - 00:06 in video)
 * 
 * Two interlocking, thin luminous elliptical laser rings enclosing the quantum orb:
 * - Ring 1: Tilted at +45 degrees with electric violet/cyan laser glow
 * - Ring 2: Tilted at -45 degrees with warm silver-gold laser glow
 */
export class CrossedOrbitalRings {
  public group: THREE.Group;
  private ring1: THREE.Line;
  private ring2: THREE.Line;
  private mat1: THREE.LineBasicMaterial;
  private mat2: THREE.LineBasicMaterial;
  private geometries: THREE.BufferGeometry[] = [];
  private targetOpacity: number = 0;
  private currentOpacity: number = 0;

  constructor() {
    this.group = new THREE.Group();

    const radiusX = 3.6;
    const radiusY = 1.9;
    const segments = 160;

    // Ring 1 Ellipse
    const points1: THREE.Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      points1.push(new THREE.Vector3(Math.cos(theta) * radiusX, Math.sin(theta) * radiusY, 0));
    }
    const geo1 = new THREE.BufferGeometry().setFromPoints(points1);
    this.geometries.push(geo1);

    this.mat1 = new THREE.LineBasicMaterial({
      color: 0xa78bfa, // Violet-cyan neon glow
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });

    this.ring1 = new THREE.Line(geo1, this.mat1);
    this.ring1.rotation.set(Math.PI / 4, 0, Math.PI / 4);
    this.group.add(this.ring1);

    // Ring 2 Ellipse
    const points2: THREE.Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      points2.push(new THREE.Vector3(Math.cos(theta) * radiusX, Math.sin(theta) * radiusY, 0));
    }
    const geo2 = new THREE.BufferGeometry().setFromPoints(points2);
    this.geometries.push(geo2);

    this.mat2 = new THREE.LineBasicMaterial({
      color: 0x38bdf8, // Electric sky blue neon glow
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });

    this.ring2 = new THREE.Line(geo2, this.mat2);
    this.ring2.rotation.set(-Math.PI / 4, 0, -Math.PI / 4);
    this.group.add(this.ring2);

    this.setOpacity(0);
  }

  public setVisibleTarget(visible: boolean) {
    this.targetOpacity = visible ? 0.95 : 0;
  }

  public update(time: number, delta: number, isTransitioning: boolean) {
    this.currentOpacity += (this.targetOpacity - this.currentOpacity) * 0.08;
    this.setOpacity(this.currentOpacity);

    // Counter-rotations on their tilted planes
    this.ring1.rotation.z += delta * 0.45;
    this.ring2.rotation.z -= delta * 0.45;

    // Organic wobble
    this.group.rotation.y = Math.sin(time * 0.6) * 0.2;

    if (isTransitioning) {
      this.group.scale.multiplyScalar(1.0 + delta * 3.0);
      this.targetOpacity = 0;
    }
  }

  private setOpacity(val: number) {
    this.mat1.opacity = val;
    this.mat2.opacity = val;
    this.group.visible = val > 0.005;
  }

  public dispose() {
    this.geometries.forEach((g) => g.dispose());
    this.mat1.dispose();
    this.mat2.dispose();
  }
}
