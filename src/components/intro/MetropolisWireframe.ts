import * as THREE from 'three';

/**
 * METROPOLIS WIREFRAME ARCHITECTURE (00:03 - 00:04 in video)
 * 
 * Symmetrical futuristic architectural gateway with glowing warm-gold neon edges:
 * - Central gateway archway & obelisk
 * - Stepped skyscraper silhouettes
 * - Cantilevered pavilions / landing platforms
 * - Glowing runway contour lines
 */
export class MetropolisWireframe {
  public group: THREE.Group;
  private lines: THREE.LineSegments[] = [];
  private materials: THREE.LineBasicMaterial[] = [];
  private geometries: THREE.BufferGeometry[] = [];
  private targetOpacity: number = 0;
  private currentOpacity: number = 0;

  constructor() {
    this.group = new THREE.Group();

    // 1. Central Stepped Towers
    this.createTower(0, 1.8, -2.5, 1.4, 4.8, 1.4, 0xfbbf24);
    this.createTower(-2.4, 1.2, -2.0, 1.2, 3.6, 1.2, 0xf59e0b);
    this.createTower(2.4, 1.2, -2.0, 1.2, 3.6, 1.2, 0xf59e0b);

    // Flanking wings
    this.createTower(-4.8, 0.4, -1.5, 1.6, 2.2, 1.4, 0xd97706);
    this.createTower(4.8, 0.4, -1.5, 1.6, 2.2, 1.4, 0xd97706);

    // 2. Cantilevered Floating Pavilions / Platforms (00:04 in video)
    this.createPlatform(-4.2, 0.9, -0.8, 2.2, 0.15, 1.8, 0xfde68a);
    this.createPlatform(4.2, 0.9, -0.8, 2.2, 0.15, 1.8, 0xfde68a);

    // 3. Central Gateway Light Runway
    this.createRunway();

    // Initially invisible
    this.setOpacity(0);
  }

  private createTower(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    hexColor: number
  ) {
    const boxGeo = new THREE.BoxGeometry(w, h, d);
    const wireGeo = new THREE.WireframeGeometry(boxGeo);
    this.geometries.push(boxGeo, wireGeo);

    const mat = new THREE.LineBasicMaterial({
      color: hexColor,
      transparent: true,
      opacity: 0,
      linewidth: 1.5,
      blending: THREE.AdditiveBlending,
    });
    this.materials.push(mat);

    const wire = new THREE.LineSegments(wireGeo, mat);
    wire.position.set(x, y, z);
    this.group.add(wire);
    this.lines.push(wire);
  }

  private createPlatform(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    hexColor: number
  ) {
    const boxGeo = new THREE.BoxGeometry(w, h, d);
    const wireGeo = new THREE.WireframeGeometry(boxGeo);
    this.geometries.push(boxGeo, wireGeo);

    const mat = new THREE.LineBasicMaterial({
      color: hexColor,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    this.materials.push(mat);

    const wire = new THREE.LineSegments(wireGeo, mat);
    wire.position.set(x, y, z);
    this.group.add(wire);
    this.lines.push(wire);
  }

  private createRunway() {
    const points: THREE.Vector3[] = [];
    // Glowing central runway boundaries
    points.push(new THREE.Vector3(-1.4, -1.7, 8.0));
    points.push(new THREE.Vector3(-1.4, -1.7, -3.5));
    points.push(new THREE.Vector3(1.4, -1.7, 8.0));
    points.push(new THREE.Vector3(1.4, -1.7, -3.5));

    // Cross ribs along runway
    for (let z = -3.0; z <= 7.0; z += 1.5) {
      points.push(new THREE.Vector3(-1.4, -1.7, z));
      points.push(new THREE.Vector3(1.4, -1.7, z));
    }

    const runwayGeo = new THREE.BufferGeometry().setFromPoints(points);
    this.geometries.push(runwayGeo);

    const mat = new THREE.LineBasicMaterial({
      color: 0x67e8f9, // Electric cyan-white runway
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    this.materials.push(mat);

    const runwayLines = new THREE.LineSegments(runwayGeo, mat);
    this.group.add(runwayLines);
    this.lines.push(runwayLines);
  }

  public setVisibleTarget(visible: boolean) {
    this.targetOpacity = visible ? 0.85 : 0;
  }

  public update(time: number, delta: number, isTransitioning: boolean) {
    // Smooth fade in / out
    this.currentOpacity += (this.targetOpacity - this.currentOpacity) * 0.08;
    this.setOpacity(this.currentOpacity);

    // Subtle micro-float
    this.group.position.y = Math.sin(time * 0.8) * 0.04;

    if (isTransitioning) {
      this.targetOpacity = 0;
      this.group.scale.multiplyScalar(1.0 + delta * 2.0);
    }
  }

  private setOpacity(val: number) {
    for (let i = 0; i < this.materials.length; i++) {
      this.materials[i].opacity = val;
    }
    this.group.visible = val > 0.005;
  }

  public dispose() {
    this.geometries.forEach((g) => g.dispose());
    this.materials.forEach((m) => m.dispose());
  }
}
