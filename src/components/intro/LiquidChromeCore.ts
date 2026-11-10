import * as THREE from 'three';

/**
 * LIQUID CHROME CORE — FLUID MERCURIAL SCULPTURE (Scene 02 - Scene 04)
 * 
 * Replaces generic spheres with a liquid chrome ribbon sculpture:
 * - Fluid vertex morphing with multi-frequency sinusoidal displacement
 * - Ultra-high specularity MeshPhysicalMaterial with procedural reflection map
 * - Orbiting mercury droplets / fluid beads
 * - Kinetic transformation from typography fragmentation into molten chrome
 */
export class LiquidChromeCore {
  public group: THREE.Group;

  private ribbonMesh: THREE.Mesh;
  private ribbonGeometry: THREE.BufferGeometry;
  private ribbonMaterial: THREE.MeshPhysicalMaterial;
  private initialPositions: Float32Array;

  // Fluid mercury droplets
  private dropletsGroup: THREE.Group;
  private droplets: {
    mesh: THREE.Mesh;
    basePos: THREE.Vector3;
    speed: number;
    phase: number;
    orbitRadius: number;
  }[] = [];

  // Lighting attached to group
  private specularLight: THREE.PointLight;
  private envTexture: THREE.CanvasTexture;

  private geometries: THREE.BufferGeometry[] = [];
  private materials: THREE.Material[] = [];

  constructor() {
    this.group = new THREE.Group();

    // 1. Procedural Studio Reflection Map for High-End Chrome Finish
    this.envTexture = (() => {
      const cvs = document.createElement('canvas');
      cvs.width = 512;
      cvs.height = 256;
      const ctx = cvs.getContext('2d');
      if (ctx) {
        // Studio softbox reflections with dark slate horizon
        const grad = ctx.createLinearGradient(0, 0, 0, 256);
        grad.addColorStop(0, '#020408');
        grad.addColorStop(0.35, '#1e293b');
        grad.addColorStop(0.48, '#e2e8f0'); // bright horizon highlight
        grad.addColorStop(0.52, '#ffffff'); // blinding specular softbox
        grad.addColorStop(0.65, '#0f172a');
        grad.addColorStop(1, '#020408');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 256);

        // Add subtle cyan light slit
        const grad2 = ctx.createRadialGradient(256, 128, 20, 256, 128, 180);
        grad2.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
        grad2.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad2;
        ctx.fillRect(0, 0, 512, 256);
      }
      const tex = new THREE.CanvasTexture(cvs);
      tex.mapping = THREE.EquirectangularReflectionMapping;
      return tex;
    })();

    // 2. Liquid Chrome Ribbon Geometry (Complex Torus Knot with high density)
    // High resolution enables liquid undulating wave displacement
    const baseGeo = new THREE.TorusKnotGeometry(1.65, 0.42, 200, 36, 2, 3);
    this.ribbonGeometry = baseGeo.clone();
    this.geometries.push(this.ribbonGeometry, baseGeo);

    // Store base positions for real-time fluid wave calculations
    const posAttr = baseGeo.attributes.position;
    this.initialPositions = new Float32Array(posAttr.array.length);
    this.initialPositions.set(posAttr.array);

    this.ribbonMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xcfd6e0,
      metalness: 0.98,
      roughness: 0.06,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      reflectivity: 1.0,
      envMap: this.envTexture,
      envMapIntensity: 2.2,
      specularIntensity: 1.0,
      specularColor: new THREE.Color(0xffffff),
    });
    this.materials.push(this.ribbonMaterial);

    this.ribbonMesh = new THREE.Mesh(this.ribbonGeometry, this.ribbonMaterial);
    this.group.add(this.ribbonMesh);

    // 3. Orbiting Liquid Mercury Droplets (Floating fluid beads)
    this.dropletsGroup = new THREE.Group();
    const dropletGeo = new THREE.SphereGeometry(0.12, 24, 24);
    this.geometries.push(dropletGeo);

    const dropletCount = 12;
    for (let i = 0; i < dropletCount; i++) {
      const dMesh = new THREE.Mesh(dropletGeo, this.ribbonMaterial);
      const orbitRadius = 2.4 + Math.random() * 1.5;
      const phase = (i / dropletCount) * Math.PI * 2;
      const basePos = new THREE.Vector3(
        Math.cos(phase) * orbitRadius,
        (Math.random() - 0.5) * 1.8,
        Math.sin(phase) * orbitRadius
      );
      dMesh.position.copy(basePos);

      // Random scale for natural fluid droplet variety
      const s = 0.6 + Math.random() * 0.9;
      dMesh.scale.set(s, s, s);

      this.droplets.push({
        mesh: dMesh,
        basePos,
        speed: 0.4 + Math.random() * 0.5,
        phase,
        orbitRadius,
      });
      this.dropletsGroup.add(dMesh);
    }
    this.group.add(this.dropletsGroup);

    // 4. Cyan specular point light embedded inside fluid
    this.specularLight = new THREE.PointLight(0x38bdf8, 2.0, 9.0, 1.8);
    this.group.add(this.specularLight);

    // Initial state: hidden during Scene 01, reveals in Scene 02
    this.group.scale.set(0.001, 0.001, 0.001);
  }

  public update(
    time: number,
    delta: number,
    elapsed: number,
    mouseX: number,
    mouseY: number,
    isTransitioning: boolean
  ) {
    // ----------------------------------------------------
    // SCENE TIMELINE SCALING & VISIBILITY
    // ----------------------------------------------------
    if (elapsed < 2.8) {
      // Scene 01: Typography takeover. Liquid core remains dormant.
      this.group.visible = false;
      this.group.scale.set(0.001, 0.001, 0.001);
      return;
    }

    this.group.visible = true;

    if (elapsed >= 2.8 && elapsed < 5.8) {
      // Scene 02: Typography fragments and transforms into liquid chrome
      const p = (elapsed - 2.8) / 3.0;
      const ease = 0.5 - 0.5 * Math.cos(p * Math.PI);
      const currentScale = 0.05 + ease * 0.95;
      this.group.scale.set(currentScale, currentScale, currentScale);
      this.specularLight.intensity = 0.5 + ease * 1.8;
    } else if (elapsed >= 5.8 && elapsed < 8.8) {
      // Scene 03: Identity composition. Liquid chrome drifts majestically in balanced position
      this.group.scale.set(1.0, 1.0, 1.0);
      this.specularLight.intensity = 2.0;
    } else {
      // Scene 04: Enter state
      const pulse = Math.sin((elapsed - 8.8) * 2.0) * 0.03;
      this.group.scale.set(1.0 + pulse, 1.0 + pulse, 1.0 + pulse);
    }

    // ----------------------------------------------------
    // FLUID VERTEX DISPLACEMENT (Undulating Liquid Wave)
    // ----------------------------------------------------
    const pos = this.ribbonGeometry.attributes.position.array as Float32Array;
    const base = this.initialPositions;
    const vertexCount = base.length / 3;

    // Amplitude of liquid ripples
    const rippleIntensity = isTransitioning ? 0.45 : 0.22;
    const rippleSpeed = isTransitioning ? 3.5 : 1.8;

    for (let i = 0; i < vertexCount; i++) {
      const i3 = i * 3;
      const bx = base[i3];
      const by = base[i3 + 1];
      const bz = base[i3 + 2];

      // Multi-octave sinusoidal fluid ripple
      const wave =
        Math.sin(bx * 1.8 + time * rippleSpeed) *
        Math.cos(by * 1.8 + time * (rippleSpeed * 0.9)) *
        rippleIntensity;

      const wave2 =
        Math.sin((bx + bz) * 2.4 - time * (rippleSpeed * 1.2)) *
        (rippleIntensity * 0.5);

      const factor = 1.0 + wave + wave2;

      pos[i3] = bx * factor;
      pos[i3 + 1] = by * factor;
      pos[i3 + 2] = bz * factor;
    }
    this.ribbonGeometry.attributes.position.needsUpdate = true;
    this.ribbonGeometry.computeVertexNormals();

    // ----------------------------------------------------
    // SCULPTURE ROTATION & PARALLAX
    // ----------------------------------------------------
    const targetRotY = mouseX * 0.4 + time * 0.25;
    const targetRotX = -mouseY * 0.3 + Math.sin(time * 0.5) * 0.15;

    this.group.rotation.y += (targetRotY - this.group.rotation.y) * 0.05;
    this.group.rotation.x += (targetRotX - this.group.rotation.x) * 0.05;

    // Inner mesh counter-twist
    this.ribbonMesh.rotation.z += delta * 0.15;

    // ----------------------------------------------------
    // ORBITING MERCURY DROPLETS
    // ----------------------------------------------------
    this.droplets.forEach((d) => {
      d.phase += delta * d.speed;
      const r = d.orbitRadius + Math.sin(time * 1.5 + d.phase) * 0.2;
      d.mesh.position.x = Math.cos(d.phase) * r;
      d.mesh.position.z = Math.sin(d.phase) * r;
      d.mesh.position.y = d.basePos.y + Math.sin(time * 2.0 + d.phase) * 0.35;
    });

    // ----------------------------------------------------
    // TRANSITION WARP BURST (Scene 05)
    // ----------------------------------------------------
    if (isTransitioning) {
      this.group.scale.multiplyScalar(1.0 + delta * 3.8);
      this.ribbonMaterial.roughness = Math.max(0, this.ribbonMaterial.roughness - delta * 0.1);
      this.specularLight.intensity += delta * 15.0;
    }
  }

  public dispose() {
    this.geometries.forEach((g) => g.dispose());
    this.materials.forEach((m) => m.dispose());
    this.envTexture.dispose();
  }
}
