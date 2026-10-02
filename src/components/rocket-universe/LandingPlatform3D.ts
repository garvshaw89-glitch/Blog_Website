import * as THREE from 'three';

/**
 * Architectural Aerospace Launch & Landing Platform
 * Provides a physical luxury structure for liftoff and touchdown.
 */
export class LandingPlatform3D {
  public group: THREE.Group;
  private lights: THREE.PointLight[] = [];
  private materials: THREE.Material[] = [];

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'LandingPlatform3D';

    // Deck Material: Dark brushed carbon-concrete
    const deckMat = new THREE.MeshStandardMaterial({
      color: 0x12141a,
      metalness: 0.65,
      roughness: 0.42,
    });
    this.materials.push(deckMat);

    // Beveled Titanium Outer Rim
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x2e3540,
      metalness: 0.85,
      roughness: 0.25,
    });
    this.materials.push(rimMat);

    // Emissive Guidance Ring (Amber / White)
    const guideMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.85,
    });
    this.materials.push(guideMat);

    // 1. Primary Landing Deck (Diameter 22m, Height 0.6m)
    const deckGeo = new THREE.CylinderGeometry(11, 11.4, 0.6, 48);
    const deckMesh = new THREE.Mesh(deckGeo, deckMat);
    deckMesh.position.y = -0.3;
    deckMesh.receiveShadow = true;
    this.group.add(deckMesh);

    // 2. Outer Beveled Rim
    const rimGeo = new THREE.TorusGeometry(11.2, 0.28, 16, 48);
    rimGeo.rotateX(Math.PI / 2);
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.position.y = 0.02;
    this.group.add(rimMesh);

    // 3. Concentric Guide Rings on Deck
    const innerRingGeo = new THREE.RingGeometry(3.6, 3.85, 36);
    innerRingGeo.rotateX(-Math.PI / 2);
    const innerRing = new THREE.Mesh(innerRingGeo, guideMat);
    innerRing.position.y = 0.02;
    this.group.add(innerRing);

    const outerRingGeo = new THREE.RingGeometry(7.8, 8.05, 48);
    outerRingGeo.rotateX(-Math.PI / 2);
    const outerRing = new THREE.Mesh(outerRingGeo, guideMat);
    outerRing.position.y = 0.02;
    this.group.add(outerRing);

    // 4. Center Crosshairs ('X' Mark Landing Target)
    const crossBarGeo = new THREE.PlaneGeometry(0.35, 4.8);
    crossBarGeo.rotateX(-Math.PI / 2);
    const crossBar1 = new THREE.Mesh(crossBarGeo, guideMat);
    crossBar1.position.y = 0.022;
    this.group.add(crossBar1);

    const crossBar2 = new THREE.Mesh(crossBarGeo, guideMat);
    crossBar2.position.y = 0.022;
    crossBar2.rotation.y = Math.PI / 2;
    this.group.add(crossBar2);

    // 5. Perimeter Runway Beacons (8 amber light points)
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8;
      const x = Math.cos(angle) * 10.6;
      const z = Math.sin(angle) * 10.6;

      const beaconGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.45, 12);
      const beaconMesh = new THREE.Mesh(beaconGeo, rimMat);
      beaconMesh.position.set(x, 0.22, z);
      this.group.add(beaconMesh);

      const light = new THREE.PointLight(0xf59e0b, 0.8, 12, 2.0);
      light.position.set(x, 0.55, z);
      this.group.add(light);
      this.lights.push(light);
    }
  }

  public update(time: number): void {
    // Subtle runway pulse
    const pulse = 0.7 + Math.sin(time * 2.5) * 0.3;
    for (const light of this.lights) {
      light.intensity = pulse;
    }
  }

  public dispose(): void {
    for (const mat of this.materials) {
      mat.dispose();
    }
  }
}
