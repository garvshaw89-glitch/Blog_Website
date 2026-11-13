import * as THREE from 'three';

export interface RocketSurfaceSample {
  position: THREE.Vector3;
  color: THREE.Color;
  size: number;
}

/**
 * Generates procedural aerospace hull plating albedo & panel-seam bump maps
 * cleanly via offscreen HTML5 Canvas with zero external image dependencies.
 */
function createHullTextures(maxAnisotropy: number): {
  albedo: THREE.CanvasTexture;
  bump: THREE.CanvasTexture;
} {
  const w = 512;
  const h = 512;

  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = w;
  albedoCanvas.height = h;
  const actx = albedoCanvas.getContext('2d')!;

  // Base bright brushed titanium composite hull
  const baseGrad = actx.createLinearGradient(0, 0, w, 0);
  baseGrad.addColorStop(0, '#cbd5e1');
  baseGrad.addColorStop(0.35, '#f8fafc');
  baseGrad.addColorStop(0.68, '#e2e8f0');
  baseGrad.addColorStop(1, '#cbd5e1');
  actx.fillStyle = baseGrad;
  actx.fillRect(0, 0, w, h);

  // Subtle brushed metal vertical micro-grain
  for (let i = 0; i < 650; i++) {
    const x = Math.random() * w;
    const len = 18 + Math.random() * 65;
    const y = Math.random() * h;
    actx.strokeStyle =
      Math.random() > 0.5 ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.08)';
    actx.lineWidth = 1;
    actx.beginPath();
    actx.moveTo(x, y);
    actx.lineTo(x, y + len);
    actx.stroke();
  }

  // Dark aerospace interstage carbon rings & orbital telemetry stripes
  actx.fillStyle = '#0f172a';
  actx.fillRect(0, h * 0.14, w, h * 0.055);
  actx.fillRect(0, h * 0.61, w, h * 0.068);

  // Crisp aerospace cyan & amber mission trim bands
  actx.fillStyle = '#0284c7';
  actx.fillRect(0, h * 0.195, w, h * 0.022);
  actx.fillStyle = '#f59e0b';
  actx.fillRect(0, h * 0.678, w, h * 0.018);

  // Panel grid seams & rivets
  actx.strokeStyle = 'rgba(15, 23, 42, 0.34)';
  actx.lineWidth = 1.6;
  for (let row = 1; row < 8; row++) {
    const ry = (row / 8) * h;
    actx.beginPath();
    actx.moveTo(0, ry);
    actx.lineTo(w, ry);
    actx.stroke();
  }
  for (let col = 0; col < 8; col++) {
    const rx = (col / 8) * w;
    actx.beginPath();
    actx.moveTo(rx, 0);
    actx.lineTo(rx, h);
    actx.stroke();
  }

  // Matching linear bump map for machined seams & rivets
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = w;
  bumpCanvas.height = h;
  const bctx = bumpCanvas.getContext('2d')!;
  bctx.fillStyle = '#808080';
  bctx.fillRect(0, 0, w, h);
  bctx.strokeStyle = '#303030';
  bctx.lineWidth = 2;
  for (let row = 1; row < 8; row++) {
    const ry = (row / 8) * h;
    bctx.beginPath();
    bctx.moveTo(0, ry);
    bctx.lineTo(w, ry);
    bctx.stroke();
  }
  for (let col = 0; col < 8; col++) {
    const rx = (col / 8) * w;
    bctx.beginPath();
    bctx.moveTo(rx, 0);
    bctx.lineTo(rx, h);
    bctx.stroke();
  }

  const albedo = new THREE.CanvasTexture(albedoCanvas);
  albedo.colorSpace = THREE.SRGBColorSpace;
  albedo.wrapS = THREE.RepeatWrapping;
  albedo.wrapT = THREE.ClampToEdgeWrapping;
  albedo.anisotropy = maxAnisotropy;

  const bump = new THREE.CanvasTexture(bumpCanvas);
  bump.wrapS = THREE.RepeatWrapping;
  bump.wrapT = THREE.ClampToEdgeWrapping;
  bump.anisotropy = maxAnisotropy;

  return { albedo, bump };
}

/**
 * Composite multi-part 3D PBR Rocket Assembly (`THREE.Group`):
 * 1. Ogive fuselage & pressurized fairing (`LatheGeometry`)
 * 2. Titanium thermal nose cone & pitot probe (`LatheGeometry`)
 * 3. Interstage carbon ring & service manifold collars
 * 4. Recessed sapphire-glass cockpit canopy & machined bezel ring
 * 5. 4x beveled swept delta aerospace stabilizer fins (`ExtrudeGeometry`)
 * 6. 4x articulated deployable landing legs + hydraulic struts
 * 7. Parabolic De Laval bell engine nozzle + glowing plasma throat interior
 *
 * Local coordinate origin (0, 0, 0) sits near the center of mass;
 * Nose tip at y = +2.62, nozzle rim at y = -2.42 (overall height ~5.04 units).
 */
export class RocketModel {
  public readonly group = new THREE.Group();
  public readonly nozzlePositionLocal = new THREE.Vector3(0, -2.42, 0);
  public readonly baseFootLocalY = -2.72;

  private geometries: THREE.BufferGeometry[] = [];
  private materials: THREE.Material[] = [];
  private textures: THREE.Texture[] = [];
  private legPivots: THREE.Group[] = [];
  private coreGlowMat: THREE.MeshBasicMaterial;
  private cockpitGlowMat: THREE.MeshStandardMaterial;

  constructor(maxAnisotropy: number, isSoftwareGl: boolean) {
    const { albedo, bump } = createHullTextures(maxAnisotropy);
    this.textures.push(albedo, bump);

    // PBR Materials with clear metallic sheen and contrast against deep space
    const hullMat = new THREE.MeshStandardMaterial({
      map: albedo,
      bumpMap: bump,
      bumpScale: 0.022,
      metalness: 0.52,
      roughness: 0.28,
      envMapIntensity: 1.45,
    });

    const noseFairingMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.86,
      roughness: 0.22,
      envMapIntensity: 1.5,
    });

    const chromeRingMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      metalness: 0.94,
      roughness: 0.14,
      envMapIntensity: 1.55,
    });

    const finMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.8,
      roughness: 0.26,
      envMapIntensity: 1.45,
    });

    const legMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.85,
      roughness: 0.32,
      envMapIntensity: 1.35,
    });

    const nozzleMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.92,
      roughness: 0.24,
      side: THREE.DoubleSide,
      envMapIntensity: 1.4,
    });

    const canopyGlassMat = isSoftwareGl
      ? new THREE.MeshStandardMaterial({
          color: 0x0ea5e9,
          metalness: 0.3,
          roughness: 0.1,
          transparent: true,
          opacity: 0.78,
        })
      : new THREE.MeshPhysicalMaterial({
          color: 0x0c4a6e,
          metalness: 0.1,
          roughness: 0.06,
          clearcoat: 1.0,
          clearcoatRoughness: 0.06,
          ior: 1.55,
          envMapIntensity: 1.55,
        });

    this.cockpitGlowMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0ea5e9,
      emissiveIntensity: 1.5,
      roughness: 0.3,
      metalness: 0.2,
    });

    this.coreGlowMat = new THREE.MeshBasicMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.95,
    });

    this.materials.push(
      hullMat,
      noseFairingMat,
      chromeRingMat,
      finMat,
      legMat,
      nozzleMat,
      canopyGlassMat,
      this.cockpitGlowMat,
      this.coreGlowMat
    );

    // 1. Primary Ogive Tank Fuselage (LatheGeometry, y = -1.90 .. +1.55)
    const hullProfile: THREE.Vector2[] = [];
    const hullSteps = 22;
    for (let i = 0; i <= hullSteps; i++) {
      const f = i / hullSteps;
      const y = -1.9 + f * 3.45;
      let r = 0.56;
      if (f < 0.08) {
        r = 0.44 + (f / 0.08) * 0.12;
      } else if (f > 0.65) {
        const taper = (f - 0.65) / 0.35;
        r = 0.56 * Math.cos(taper * 0.52);
      }
      hullProfile.push(new THREE.Vector2(r, y));
    }
    const hullGeo = new THREE.LatheGeometry(hullProfile, 44);
    hullGeo.computeTangents();
    this.geometries.push(hullGeo);
    const hullMesh = new THREE.Mesh(hullGeo, hullMat);
    hullMesh.castShadow = true;
    hullMesh.receiveShadow = true;
    this.group.add(hullMesh);

    // 2. Thermal Titanium Nose Cone & Pitot Probe (y = +1.55 .. +2.62)
    const noseProfile: THREE.Vector2[] = [];
    for (let i = 0; i <= 14; i++) {
      const f = i / 14;
      const y = 1.54 + f * 0.92;
      const r = 0.486 * Math.pow(1 - f, 0.72);
      noseProfile.push(new THREE.Vector2(Math.max(0.012, r), y));
    }
    const noseGeo = new THREE.LatheGeometry(noseProfile, 36);
    this.geometries.push(noseGeo);
    const noseMesh = new THREE.Mesh(noseGeo, noseFairingMat);
    noseMesh.castShadow = true;
    this.group.add(noseMesh);

    const probeGeo = new THREE.CylinderGeometry(0.012, 0.032, 0.24, 16);
    this.geometries.push(probeGeo);
    const probeMesh = new THREE.Mesh(probeGeo, chromeRingMat);
    probeMesh.position.y = 2.52;
    this.group.add(probeMesh);

    // 3. Machined Chrome Structural Collars & Docking Flange
    const collarGeo1 = new THREE.TorusGeometry(0.49, 0.024, 12, 40);
    const collarGeo2 = new THREE.TorusGeometry(0.562, 0.022, 12, 40);
    this.geometries.push(collarGeo1, collarGeo2);

    const collar1 = new THREE.Mesh(collarGeo1, chromeRingMat);
    collar1.rotation.x = Math.PI / 2;
    collar1.position.y = 1.54;
    this.group.add(collar1);

    const collar2 = new THREE.Mesh(collarGeo2, chromeRingMat);
    collar2.rotation.x = Math.PI / 2;
    collar2.position.y = -0.35;
    this.group.add(collar2);

    // 4. Recessed Cockpit Canopy Viewport on Front Face (+Z)
    const bezelGeo = new THREE.TorusGeometry(0.21, 0.032, 14, 32);
    const glassGeo = new THREE.SphereGeometry(0.195, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.52);
    const glowRingGeo = new THREE.RingGeometry(0.155, 0.175, 28);
    this.geometries.push(bezelGeo, glassGeo, glowRingGeo);

    const viewportGroup = new THREE.Group();
    viewportGroup.position.set(0, 0.65, 0.51);
    viewportGroup.rotation.x = -0.14;

    const bezelMesh = new THREE.Mesh(bezelGeo, chromeRingMat);
    const glassMesh = new THREE.Mesh(glassGeo, canopyGlassMat);
    glassMesh.rotation.x = Math.PI / 2;
    glassMesh.scale.set(1, 0.5, 1);

    const glowRingMesh = new THREE.Mesh(glowRingGeo, this.cockpitGlowMat);
    glowRingMesh.position.z = 0.01;

    viewportGroup.add(bezelMesh, glassMesh, glowRingMesh);
    this.group.add(viewportGroup);

    // 5. Four Swept Beveled Delta Stabilizer Fins (ExtrudeGeometry)
    const finShape = new THREE.Shape();
    finShape.moveTo(0, 0);
    finShape.lineTo(0.76, -0.78);
    finShape.lineTo(0.76, -1.16);
    finShape.lineTo(0.12, -1.02);
    finShape.lineTo(0, -0.98);
    finShape.closePath();

    const finGeo = new THREE.ExtrudeGeometry(finShape, {
      steps: 1,
      depth: 0.055,
      bevelEnabled: true,
      bevelThickness: 0.018,
      bevelSize: 0.016,
      bevelSegments: 2,
    });
    finGeo.translate(0, 0, -0.0275);
    this.geometries.push(finGeo);

    for (let i = 0; i < 4; i++) {
      const finHolder = new THREE.Group();
      finHolder.rotation.y = (i * Math.PI) / 2 + Math.PI / 4;
      const finMesh = new THREE.Mesh(finGeo, finMat);
      finMesh.position.set(0.5, -0.82, 0);
      finMesh.castShadow = true;
      finMesh.receiveShadow = true;
      finHolder.add(finMesh);
      this.group.add(finHolder);
    }

    // 6. Four Articulated Deployable Landing Legs (stow flush during flight, deploy in Scene 04)
    const legUpperGeo = new THREE.BoxGeometry(0.08, 0.92, 0.06);
    const legFootGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.045, 16);
    const strutGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.62, 10);
    this.geometries.push(legUpperGeo, legFootGeo, strutGeo);

    for (let i = 0; i < 4; i++) {
      const mountGroup = new THREE.Group();
      mountGroup.rotation.y = (i * Math.PI) / 2;

      const pivot = new THREE.Group();
      // Hinged at lower skirt y = -1.78, radius = 0.54
      pivot.position.set(0.54, -1.78, 0);

      const legBeam = new THREE.Mesh(legUpperGeo, legMat);
      legBeam.position.set(0.04, 0.44, 0);
      legBeam.castShadow = true;

      const footPad = new THREE.Mesh(legFootGeo, chromeRingMat);
      footPad.position.set(0.05, 0.92, 0);

      const piston = new THREE.Mesh(strutGeo, chromeRingMat);
      piston.position.set(-0.04, 0.36, 0);
      piston.rotation.z = 0.18;

      pivot.add(legBeam, footPad, piston);
      // Stowed angle = ~0.08 rad (pointing up against hull); deployed angle = ~2.32 rad (splayed down)
      pivot.rotation.z = -0.08;
      this.legPivots.push(pivot);

      mountGroup.add(pivot);
      this.group.add(mountGroup);
    }

    // 7. Parabolic De Laval Engine Bell Nozzle + Incandescent Throat Cavity (y = -1.90 .. -2.42)
    const bellProfile: THREE.Vector2[] = [
      new THREE.Vector2(0.18, -1.86),
      new THREE.Vector2(0.24, -1.98),
      new THREE.Vector2(0.35, -2.2),
      new THREE.Vector2(0.41, -2.42),
    ];
    const bellGeo = new THREE.LatheGeometry(bellProfile, 36);
    const throatGeo = new THREE.CircleGeometry(0.21, 24);
    const nozzleRimGeo = new THREE.TorusGeometry(0.41, 0.018, 10, 36);
    this.geometries.push(bellGeo, throatGeo, nozzleRimGeo);

    const bellMesh = new THREE.Mesh(bellGeo, nozzleMat);
    bellMesh.castShadow = true;

    const throatMesh = new THREE.Mesh(throatGeo, this.coreGlowMat);
    throatMesh.rotation.x = Math.PI / 2;
    throatMesh.position.y = -2.0;

    const nozzleRim = new THREE.Mesh(nozzleRimGeo, chromeRingMat);
    nozzleRim.rotation.x = Math.PI / 2;
    nozzleRim.position.y = -2.42;

    this.group.add(bellMesh, throatMesh, nozzleRim);
  }

  /**
   * Smoothly deploys or stows the 4 landing legs (0 = stowed flush against hull, 1 = landed splayed).
   */
  public setLandingGearDeploy(amount: number): void {
    const t = THREE.MathUtils.clamp(amount, 0, 1);
    const stowedRot = -0.08;
    const deployedRot = -2.36; // Swings cleanly outward & downward so pads touch baseFootLocalY
    const rot = THREE.MathUtils.lerp(stowedRot, deployedRot, t);
    for (let i = 0; i < this.legPivots.length; i++) {
      this.legPivots[i].rotation.z = rot;
    }
  }

  public setEngineGlow(intensity: number): void {
    this.coreGlowMat.opacity = THREE.MathUtils.clamp(intensity, 0.05, 1.0);
  }

  public setBodyOpacity(alpha: number): void {
    const a = THREE.MathUtils.clamp(alpha, 0, 1);
    const isFade = a < 0.995;
    for (let i = 0; i < this.materials.length; i++) {
      const m = this.materials[i];
      if (m === this.coreGlowMat) {
        m.opacity = Math.min(m.opacity, a);
        continue;
      }
      m.transparent = isFade || (m instanceof THREE.MeshStandardMaterial && m.opacity < 1);
      m.opacity = a;
    }
  }

  /**
   * Samples authentic 3D surface positions across fuselage, nose, fins, cockpit & nozzle
   * so Scene 05 particle break-apart spawns from the actual 3D aerospace hull.
   */
  public sampleSurfacePoints(count: number): RocketSurfaceSample[] {
    const samples: RocketSurfaceSample[] = [];
    const colors = {
      hull: new THREE.Color(0xe2e8f0),
      nose: new THREE.Color(0x94a3b8),
      cyan: new THREE.Color(0x38bdf8),
      amber: new THREE.Color(0xfbbf24),
    };

    for (let i = 0; i < count; i++) {
      const section = Math.random();
      const pos = new THREE.Vector3();
      let col = colors.hull;
      let size = 1.15;

      if (section < 0.56) {
        // Fuselage & nose fairing surface
        const y = -1.88 + Math.random() * 4.4;
        const angle = Math.random() * Math.PI * 2;
        let r = 0.56;
        if (y > 0.34) {
          const f = THREE.MathUtils.clamp((y - 0.34) / 2.18, 0, 1);
          r = 0.56 * Math.pow(1 - f, 0.72);
        }
        pos.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
        col = y > 1.54 ? (Math.random() < 0.35 ? colors.cyan : colors.nose) : colors.hull;
        size = y > 1.54 ? 1.35 : 1.1;
      } else if (section < 0.78) {
        // 4 Swept Fins
        const finIdx = Math.floor(Math.random() * 4);
        const theta = (finIdx * Math.PI) / 2 + Math.PI / 4;
        const u = Math.random();
        const localR = 0.52 + u * 0.74;
        const localY = -0.82 - u * 0.78 - Math.random() * (0.34 * (1 - u * 0.3));
        pos.set(Math.cos(theta) * localR, localY, Math.sin(theta) * localR);
        col = Math.random() < 0.6 ? colors.cyan : colors.nose;
        size = 1.25;
      } else if (section < 0.9) {
        // Cockpit viewport bezel & beacon
        const phi = Math.random() * Math.PI * 2;
        pos.set(Math.cos(phi) * 0.21, 0.65 + Math.sin(phi) * 0.21, 0.52);
        col = colors.cyan;
        size = 1.4;
      } else {
        // Engine nozzle bell & ember rim
        const theta = Math.random() * Math.PI * 2;
        const t = Math.random();
        const r = 0.22 + t * 0.19;
        const y = -1.9 - t * 0.52;
        pos.set(Math.cos(theta) * r, y, Math.sin(theta) * r);
        col = Math.random() < 0.55 ? colors.amber : colors.cyan;
        size = 1.35;
      }

      samples.push({ position: pos, color: col, size });
    }

    return samples;
  }

  public dispose(): void {
    for (let i = 0; i < this.geometries.length; i++) {
      this.geometries[i].dispose();
    }
    for (let i = 0; i < this.materials.length; i++) {
      this.materials[i].dispose();
    }
    for (let i = 0; i < this.textures.length; i++) {
      this.textures[i].dispose();
    }
  }
}
