import * as THREE from 'three';

/**
 * DIGITAL CORE — 3D METALLIC IDENTITY CORE & PORTAL
 * 
 * Recreates the exact multi-scene visual characteristics:
 * - Scene 01: Dormant micro-spark in center of void
 * - Scene 02: Assembles sophisticated metallic silver surfaces, reflective obsidian facets,
 *             subtle electric-blue / cyan light, and floating geometric fragments
 * - Scene 03: Stable majestic rotation behind oversized typography
 * - Scene 04: Expands into an interactive dimensional portal with concentric circular light rings
 * - Scene 05: Warp acceleration, outward ring expansion, and light streaks
 */
export class DigitalCore {
  public group: THREE.Group;

  // Primary 3D layers
  private outerRing: THREE.Mesh;
  private innerGimbalRing: THREE.Mesh;
  private middlePolyhedron: THREE.Mesh;
  private polyhedronWireframe: THREE.LineSegments;
  private coreNucleus: THREE.Mesh;
  private coreLight: THREE.PointLight;

  // Floating geometric fragments
  private fragmentsGroup: THREE.Group;
  private fragments: THREE.Mesh[] = [];

  // Portal Concentric Circular Light Rings
  private portalRingsGroup: THREE.Group;
  private portalRings: { mesh: THREE.Line; baseRadius: number; speed: number; rotAxis: THREE.Vector3 }[] = [];

  // Memory management
  private geometries: THREE.BufferGeometry[] = [];
  private materials: THREE.Material[] = [];

  constructor() {
    this.group = new THREE.Group();

    // ----------------------------------------------------
    // 1. OUTER METALLIC RING (Polished Titanium / Chrome)
    // ----------------------------------------------------
    const outerRingGeo = new THREE.TorusGeometry(1.95, 0.07, 32, 120);
    this.geometries.push(outerRingGeo);

    const metallicSilverMat = new THREE.MeshPhysicalMaterial({
      color: 0x22262d,
      emissive: 0x0a1018,
      metalness: 0.95,
      roughness: 0.15,
      clearcoat: 0.8,
      clearcoatRoughness: 0.12,
      reflectivity: 0.95,
    });
    this.materials.push(metallicSilverMat);

    this.outerRing = new THREE.Mesh(outerRingGeo, metallicSilverMat);
    this.outerRing.rotation.x = Math.PI / 3.2;
    this.group.add(this.outerRing);

    // ----------------------------------------------------
    // 2. INNER GIMBAL RING (Tilted Counter-Rotating Axis)
    // ----------------------------------------------------
    const innerRingGeo = new THREE.TorusGeometry(1.65, 0.045, 24, 100);
    this.geometries.push(innerRingGeo);

    const innerRingMat = new THREE.MeshPhysicalMaterial({
      color: 0x384152,
      emissive: 0x05101a,
      metalness: 0.98,
      roughness: 0.2,
      clearcoat: 0.9,
    });
    this.materials.push(innerRingMat);

    this.innerGimbalRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    this.innerGimbalRing.rotation.y = Math.PI / 4;
    this.group.add(this.innerGimbalRing);

    // ----------------------------------------------------
    // 3. MIDDLE FACETED POLYHEDRON (Obsidian / Chrome Core)
    // ----------------------------------------------------
    const polyGeo = new THREE.IcosahedronGeometry(1.08, 0); // Low-poly crisp facet refractions
    this.geometries.push(polyGeo);

    const polyMat = new THREE.MeshPhysicalMaterial({
      color: 0x0c0f14,
      metalness: 0.35,
      roughness: 0.08,
      transmission: 0.72,
      ior: 1.58,
      thickness: 1.5,
      specularIntensity: 1.0,
      specularColor: new THREE.Color(0x7dd3fc), // subtle electric cyan specular highlight
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      transparent: true,
      opacity: 0.94,
    });
    this.materials.push(polyMat);

    this.middlePolyhedron = new THREE.Mesh(polyGeo, polyMat);
    this.group.add(this.middlePolyhedron);

    // Subtle laser edge wireframe
    const wireGeo = new THREE.WireframeGeometry(polyGeo);
    this.geometries.push(wireGeo);

    const wireMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
    });
    this.materials.push(wireMat);

    this.polyhedronWireframe = new THREE.LineSegments(wireGeo, wireMat);
    this.middlePolyhedron.add(this.polyhedronWireframe);

    // ----------------------------------------------------
    // 4. INNER NUCLEUS (Luminous Digital Spark)
    // ----------------------------------------------------
    const nucleusGeo = new THREE.OctahedronGeometry(0.36, 0);
    this.geometries.push(nucleusGeo);

    const nucleusMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x38bdf8,
      emissiveIntensity: 2.2,
      roughness: 0.1,
      metalness: 0.8,
    });
    this.materials.push(nucleusMat);

    this.coreNucleus = new THREE.Mesh(nucleusGeo, nucleusMat);
    this.group.add(this.coreNucleus);

    // Electric-blue / cyan point light inside
    this.coreLight = new THREE.PointLight(0x38bdf8, 1.8, 8.0, 1.5);
    this.group.add(this.coreLight);

    // ----------------------------------------------------
    // 5. FLOATING GEOMETRIC FRAGMENTS (Orbiting Shards)
    // ----------------------------------------------------
    this.fragmentsGroup = new THREE.Group();
    const fragmentCount = 14;

    const shardGeo1 = new THREE.TetrahedronGeometry(0.14, 0);
    const shardGeo2 = new THREE.OctahedronGeometry(0.12, 0);
    this.geometries.push(shardGeo1, shardGeo2);

    const shardMat = new THREE.MeshPhysicalMaterial({
      color: 0xd4d8e2,
      metalness: 0.92,
      roughness: 0.18,
      clearcoat: 0.7,
      reflectivity: 0.9,
    });
    this.materials.push(shardMat);

    for (let i = 0; i < fragmentCount; i++) {
      const geo = i % 2 === 0 ? shardGeo1 : shardGeo2;
      const shard = new THREE.Mesh(geo, shardMat);

      const r = 2.4 + Math.random() * 1.6;
      const theta = (i / fragmentCount) * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.7;

      shard.position.set(
        r * Math.cos(theta) * Math.cos(phi),
        r * Math.sin(phi),
        r * Math.sin(theta) * Math.cos(phi)
      );

      shard.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      shard.userData = {
        radius: r,
        speed: 0.3 + Math.random() * 0.4,
        theta,
        phi,
        rotSpeedX: (Math.random() - 0.5) * 1.5,
        rotSpeedY: (Math.random() - 0.5) * 1.5,
      };

      this.fragments.push(shard);
      this.fragmentsGroup.add(shard);
    }
    this.group.add(this.fragmentsGroup);

    // ----------------------------------------------------
    // 6. PORTAL CONCENTRIC CIRCULAR LIGHT RINGS
    // ----------------------------------------------------
    this.portalRingsGroup = new THREE.Group();
    const ringRadii = [2.2, 2.7, 3.2, 3.8];
    const ringColors = [0x38bdf8, 0x818cf8, 0x0284c7, 0x93c5fd];

    ringRadii.forEach((rad, idx) => {
      const segments = 128;
      const pts: THREE.Vector3[] = [];
      for (let s = 0; s <= segments; s++) {
        const a = (s / segments) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * rad, Math.sin(a) * rad, 0));
      }
      const rGeo = new THREE.BufferGeometry().setFromPoints(pts);
      this.geometries.push(rGeo);

      const rMat = new THREE.LineBasicMaterial({
        color: ringColors[idx % ringColors.length],
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
      });
      this.materials.push(rMat);

      const rLine = new THREE.Line(rGeo, rMat);
      const rotAxis = new THREE.Vector3(
        (Math.random() - 0.5) * 0.4,
        (Math.random() - 0.5) * 0.4,
        1
      ).normalize();

      this.portalRings.push({
        mesh: rLine,
        baseRadius: rad,
        speed: (idx % 2 === 0 ? 1 : -1) * (0.2 + idx * 0.1),
        rotAxis,
      });
      this.portalRingsGroup.add(rLine);
    });

    this.group.add(this.portalRingsGroup);

    // Initial scale state
    this.group.scale.set(0.01, 0.01, 0.01);
  }

  public update(
    time: number,
    delta: number,
    elapsed: number,
    mouseX: number,
    mouseY: number,
    isTransitioning: boolean
  ) {
    // 1. Stage Scale & Visibility Emergence
    if (elapsed < 1.8) {
      // Scene 01: Tiny pin-prick awakening
      const p = Math.max(0.01, elapsed / 1.8);
      const s = 0.01 + Math.pow(p, 3) * 0.28;
      this.group.scale.set(s, s, s);
      this.coreLight.intensity = p * 0.8;
      this.portalRingsGroup.visible = false;
    } else if (elapsed < 4.8) {
      // Scene 02: Full metallic object formation and expansion
      const p = (elapsed - 1.8) / 3.0;
      const ease = 0.5 - 0.5 * Math.cos(p * Math.PI);
      const s = 0.28 + ease * 0.72;
      this.group.scale.set(s, s, s);
      this.coreLight.intensity = 0.8 + ease * 1.2;
      this.portalRingsGroup.visible = true;

      // Portal rings fade in softly
      this.portalRings.forEach((r) => {
        (r.mesh.material as THREE.LineBasicMaterial).opacity = ease * 0.25;
      });
    } else if (elapsed < 7.8) {
      // Scene 03: Name reveal composition (stabilizes behind typography)
      this.group.scale.set(1.0, 1.0, 1.0);
      this.portalRingsGroup.visible = true;
      this.portalRings.forEach((r) => {
        (r.mesh.material as THREE.LineBasicMaterial).opacity = 0.35;
      });
    } else {
      // Scene 04: Interactive portal expansion & pulse
      const pulse = Math.sin((elapsed - 7.8) * 2.5) * 0.04;
      this.group.scale.set(1.0 + pulse, 1.0 + pulse, 1.0 + pulse);
      this.portalRingsGroup.visible = true;
      this.portalRings.forEach((r, idx) => {
        const ringPulse = 0.45 + Math.sin(time * 3.0 + idx) * 0.25;
        (r.mesh.material as THREE.LineBasicMaterial).opacity = ringPulse;
      });
    }

    // 2. Slow, cinematic floating motion
    const floatY = Math.sin(time * 0.9) * 0.07;
    this.group.position.y = floatY;

    // 3. Mouse-responsive 3D depth and parallax tilt
    const targetRotY = mouseX * 0.38 + time * 0.09;
    const targetRotX = -mouseY * 0.28 + Math.sin(time * 0.4) * 0.04;

    this.group.rotation.y += (targetRotY - this.group.rotation.y) * 0.045;
    this.group.rotation.x += (targetRotX - this.group.rotation.x) * 0.045;

    // 4. Layer rotations
    this.outerRing.rotation.z += delta * 0.14;
    this.outerRing.rotation.y += delta * 0.08;

    this.innerGimbalRing.rotation.x += delta * 0.16;
    this.innerGimbalRing.rotation.z -= delta * 0.1;

    this.middlePolyhedron.rotation.y -= delta * 0.18;
    this.middlePolyhedron.rotation.x += delta * 0.09;

    this.coreNucleus.rotation.y += delta * 0.5;
    this.coreNucleus.rotation.z -= delta * 0.3;

    // Core breathing light
    const lightPulse = 1.6 + Math.sin(time * 2.8) * 0.45;
    this.coreLight.intensity = isTransitioning ? this.coreLight.intensity + delta * 20.0 : lightPulse;

    // 5. Floating geometric fragments orbit
    this.fragments.forEach((shard) => {
      shard.userData.theta += delta * shard.userData.speed;
      const r = shard.userData.radius;
      const th = shard.userData.theta;
      const ph = shard.userData.phi + Math.sin(time * 0.5 + th) * 0.1;

      shard.position.set(
        r * Math.cos(th) * Math.cos(ph),
        r * Math.sin(ph),
        r * Math.sin(th) * Math.cos(ph)
      );

      shard.rotation.x += delta * shard.userData.rotSpeedX;
      shard.rotation.y += delta * shard.userData.rotSpeedY;
    });

    // 6. Portal concentric rings rotation
    this.portalRings.forEach((r) => {
      r.mesh.rotation.z += delta * r.speed;
    });

    // 7. Scene 05: Transition Acceleration & Warp Explosion
    if (isTransitioning) {
      this.group.scale.multiplyScalar(1.0 + delta * 4.2);
      this.outerRing.rotation.z += delta * 3.5;
      this.middlePolyhedron.rotation.y += delta * 4.0;
      this.portalRings.forEach((r) => {
        r.mesh.scale.multiplyScalar(1.0 + delta * 5.0);
        (r.mesh.material as THREE.LineBasicMaterial).opacity = Math.max(0, 1.0 - delta * 2.0);
      });
    }
  }

  public dispose() {
    this.geometries.forEach((g) => g.dispose());
    this.materials.forEach((m) => m.dispose());
  }
}
