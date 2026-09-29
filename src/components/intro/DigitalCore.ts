import * as THREE from 'three';

/**
 * DIGITAL CORE — 3D KNOWLEDGE MONOLITH
 * 
 * An interlocking geometric structure representing a futuristic digital archive / knowledge engine:
 * 1. Outer Layer: Dark chrome / brushed titanium metallic ring (TorusGeometry)
 * 2. Middle Layer: Faceted obsidian black glass geometric polyhedron (IcosahedronGeometry with physical transmission)
 * 3. Inner Layer: Small luminous core with warm-white / champagne emissive glow and pulsing light
 * 4. Surrounding: Thin orbital coordinate rings with counter-rotation on inclined gimbal axes
 * 5. Emissive Edges: Delicate wireframe accents highlighting the geometry
 */
export class DigitalCore {
  public group: THREE.Group;

  private outerRing: THREE.Mesh;
  private middleGlass: THREE.Mesh;
  private glassEdges: THREE.LineSegments;
  private innerCore: THREE.Mesh;
  private innerLight: THREE.PointLight;
  private orbitalRing1: THREE.Line;
  private orbitalRing2: THREE.Line;
  private orbitalRing3: THREE.Line;

  private geometries: THREE.BufferGeometry[] = [];
  private materials: THREE.Material[] = [];

  constructor() {
    this.group = new THREE.Group();

    // 1. OUTER LAYER: Dark Chrome / Brushed Titanium Metallic Ring
    const outerRingGeo = new THREE.TorusGeometry(1.85, 0.08, 32, 100);
    this.geometries.push(outerRingGeo);

    const outerRingMat = new THREE.MeshPhysicalMaterial({
      color: 0x18181b,
      metalness: 0.94,
      roughness: 0.18,
      clearcoat: 0.6,
      clearcoatRoughness: 0.1,
      reflectivity: 0.9,
    });
    this.materials.push(outerRingMat);

    this.outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    this.outerRing.rotation.x = Math.PI / 3;
    this.group.add(this.outerRing);

    // 2. MIDDLE LAYER: Faceted Obsidian Black Glass Polyhedron
    const glassGeo = new THREE.IcosahedronGeometry(1.05, 0); // Faceted low-poly for crisp refraction facets
    this.geometries.push(glassGeo);

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x090a0f,
      metalness: 0.15,
      roughness: 0.12,
      transmission: 0.65, // Glass transmission
      ior: 1.52,
      thickness: 1.2,
      specularIntensity: 1.0,
      specularColor: new THREE.Color(0xf5f5f0),
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      transparent: true,
      opacity: 0.95,
    });
    this.materials.push(glassMat);

    this.middleGlass = new THREE.Mesh(glassGeo, glassMat);
    this.group.add(this.middleGlass);

    // Subtle edge lines for geometric precision
    const glassWireGeo = new THREE.WireframeGeometry(glassGeo);
    this.geometries.push(glassWireGeo);

    const glassWireMat = new THREE.LineBasicMaterial({
      color: 0x8b92a5,
      transparent: true,
      opacity: 0.22,
    });
    this.materials.push(glassWireMat);

    this.glassEdges = new THREE.LineSegments(glassWireGeo, glassWireMat);
    this.middleGlass.add(this.glassEdges);

    // 3. INNER LAYER: Luminous Knowledge Core (Warm-White / Subtle Champagne)
    const innerGeo = new THREE.OctahedronGeometry(0.38, 0);
    this.geometries.push(innerGeo);

    const innerMat = new THREE.MeshStandardMaterial({
      color: 0xfffbf0,
      emissive: 0xffeed2,
      emissiveIntensity: 1.8,
      roughness: 0.2,
      metalness: 0.5,
    });
    this.materials.push(innerMat);

    this.innerCore = new THREE.Mesh(innerGeo, innerMat);
    this.group.add(this.innerCore);

    // Point Light inside the core illuminating through the glass
    this.innerLight = new THREE.PointLight(0xffeed2, 1.6, 6.0, 1.8);
    this.group.add(this.innerLight);

    // 4. SURROUNDING: Thin Orbital Coordinate Rings
    this.orbitalRing1 = this.createOrbitalLine(2.35, 0.12, 0.45, 0.25);
    this.orbitalRing2 = this.createOrbitalLine(2.65, -0.35, 0.2, 0.18);
    this.orbitalRing3 = this.createOrbitalLine(2.95, 0.6, -0.3, 0.12);

    this.group.add(this.orbitalRing1);
    this.group.add(this.orbitalRing2);
    this.group.add(this.orbitalRing3);
  }

  private createOrbitalLine(
    radius: number,
    rotX: number,
    rotY: number,
    opacity: number
  ): THREE.Line {
    const points: THREE.Vector3[] = [];
    const segments = 120;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
    }

    const geo = new THREE.BufferGeometry().setFromPoints(points);
    this.geometries.push(geo);

    const mat = new THREE.LineBasicMaterial({
      color: 0xd4d8e2,
      transparent: true,
      opacity: opacity,
    });
    this.materials.push(mat);

    const line = new THREE.Line(geo, mat);
    line.rotation.x = rotX;
    line.rotation.y = rotY;
    return line;
  }

  public update(
    time: number,
    delta: number,
    mouseX: number,
    mouseY: number,
    isTransitioning: boolean
  ) {
    // 1. Slow, expensive floating oscillation
    const floatOffset = Math.sin(time * 0.8) * 0.08;
    this.group.position.y = floatOffset;

    // 2. Damped mouse influence on the entire monolith
    const targetRotY = mouseX * 0.35 + time * 0.08;
    const targetRotX = -mouseY * 0.25 + Math.sin(time * 0.4) * 0.05;

    this.group.rotation.y += (targetRotY - this.group.rotation.y) * 0.05;
    this.group.rotation.x += (targetRotX - this.group.rotation.x) * 0.05;

    // 3. Counter-rotations of individual layers
    this.outerRing.rotation.z += delta * 0.12;
    this.outerRing.rotation.y += delta * 0.06;

    this.middleGlass.rotation.y -= delta * 0.15;
    this.middleGlass.rotation.x += delta * 0.08;

    this.innerCore.rotation.y += delta * 0.4;
    this.innerCore.rotation.z -= delta * 0.25;

    // Subtle breathing pulse of inner core
    const pulse = 1.6 + Math.sin(time * 2.2) * 0.4;
    this.innerLight.intensity = pulse;

    this.orbitalRing1.rotation.y += delta * 0.18;
    this.orbitalRing2.rotation.x -= delta * 0.14;
    this.orbitalRing3.rotation.z += delta * 0.1;

    // 4. Portal Expansion during transition
    if (isTransitioning) {
      this.group.scale.multiplyScalar(1.0 + delta * 3.5);
      this.innerLight.intensity += delta * 15.0;
    }
  }

  public setVisibility(visibility: number) {
    // Fade in materials from darkness
    this.group.visible = visibility > 0.001;
    this.innerLight.intensity = visibility * 1.8;
  }

  public dispose() {
    this.geometries.forEach((g) => g.dispose());
    this.materials.forEach((m) => m.dispose());
  }
}
