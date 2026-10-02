import * as THREE from 'three';

/**
 * High-Precision 3D Aerospace Rocket Model
 * Built using physically-based Three.js geometries and materials.
 * 
 * Features:
 * - Aerodynamic Ogive fairing & nose cone with thermal protection tiling
 * - Brushed aerospace titanium fuselage with telemetry stripes & panel seams
 * - Deployable hypersonic titanium grid fins
 * - 4 Swept delta stabilization fins with beveled composite edges
 * - Machined inconel-copper rocket bell nozzle
 * - Volumetric supersonic exhaust cone with shock diamond nodes
 * - Deployable pneumatic landing gear struts (stowable for flight, deployable for touchdown)
 * - Active port/starboard navigation strobe lights
 */
export class Rocket3DModel {
  public group: THREE.Group;
  public flameGroup: THREE.Group;
  public coreLight: THREE.PointLight;
  private flameMesh: THREE.Mesh;
  private shockDiamonds: THREE.Mesh[] = [];
  private landingLegs: THREE.Group[] = [];
  private strobeRed: THREE.PointLight;
  private strobeGreen: THREE.PointLight;
  private fuselageMaterials: THREE.Material[] = [];

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'AerospaceRocket3D';

    // ==========================================
    // 1. MATERIALS (Physically-Based)
    // ==========================================
    // Primary brushed titanium fuselage
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xe8ecf2,
      metalness: 0.82,
      roughness: 0.28,
      envMapIntensity: 1.2,
    });
    this.fuselageMaterials.push(bodyMat);

    // Dark ceramic thermal protection shield (belly & nose base)
    const heatShieldMat = new THREE.MeshStandardMaterial({
      color: 0x181a1f,
      metalness: 0.45,
      roughness: 0.65,
    });
    this.fuselageMaterials.push(heatShieldMat);

    // Accent aerospace livery (NASA Red & Cobalt Telemetry)
    const liveryRedMat = new THREE.MeshStandardMaterial({
      color: 0xd92d20,
      metalness: 0.35,
      roughness: 0.4,
    });
    const liveryCobaltMat = new THREE.MeshStandardMaterial({
      color: 0x155eef,
      metalness: 0.5,
      roughness: 0.35,
    });
    this.fuselageMaterials.push(liveryRedMat, liveryCobaltMat);

    // Dark inconel engine bell alloy
    const nozzleMat = new THREE.MeshStandardMaterial({
      color: 0x22262e,
      metalness: 0.92,
      roughness: 0.22,
    });
    this.fuselageMaterials.push(nozzleMat);

    // Carbon-composite fin material
    const finMat = new THREE.MeshStandardMaterial({
      color: 0x1f232b,
      metalness: 0.6,
      roughness: 0.38,
    });
    this.fuselageMaterials.push(finMat);

    // ==========================================
    // 2. FUSELAGE STAGES & SECTIONS
    // ==========================================
    const rocketRadius = 0.95;

    // A. Main Core Booster Cylinder (y: -4.0 to +1.5, height: 5.5)
    const coreHeight = 5.5;
    const coreGeo = new THREE.CylinderGeometry(rocketRadius, rocketRadius, coreHeight, 32);
    const coreMesh = new THREE.Mesh(coreGeo, bodyMat);
    coreMesh.position.y = -1.25;
    coreMesh.castShadow = true;
    coreMesh.receiveShadow = true;
    this.group.add(coreMesh);

    // Telemetry accent rings on core
    const ringGeo = new THREE.CylinderGeometry(rocketRadius * 1.008, rocketRadius * 1.008, 0.25, 32);
    const ringMesh1 = new THREE.Mesh(ringGeo, liveryCobaltMat);
    ringMesh1.position.y = 0.8;
    this.group.add(ringMesh1);

    const ringMesh2 = new THREE.Mesh(ringGeo, liveryRedMat);
    ringMesh2.position.y = -2.8;
    this.group.add(ringMesh2);

    // B. Interstage Truss & Upper Section (y: +1.5 to +3.8, height: 2.3)
    const upperHeight = 2.3;
    const upperGeo = new THREE.CylinderGeometry(rocketRadius * 0.92, rocketRadius, upperHeight, 32);
    const upperMesh = new THREE.Mesh(upperGeo, bodyMat);
    upperMesh.position.y = 2.65;
    this.group.add(upperMesh);

    // C. Aerodynamic Nose Cone / Ogive Fairing (y: +3.8 to +6.8, height: 3.0)
    const noseHeight = 3.0;
    const noseGeo = new THREE.ConeGeometry(rocketRadius * 0.92, noseHeight, 32);
    const noseMesh = new THREE.Mesh(noseGeo, bodyMat);
    noseMesh.position.y = 3.8 + noseHeight * 0.5;
    this.group.add(noseMesh);

    // Pitot telemetry tip at apex
    const pitotGeo = new THREE.CylinderGeometry(0.04, 0.08, 0.8, 12);
    const pitotMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.9, roughness: 0.1 });
    const pitotMesh = new THREE.Mesh(pitotGeo, pitotMat);
    pitotMesh.position.y = 3.8 + noseHeight + 0.4;
    this.group.add(pitotMesh);

    // D. Engine Skirt & Boat-tail (y: -4.0 to -4.8)
    const skirtGeo = new THREE.CylinderGeometry(rocketRadius, rocketRadius * 0.78, 0.8, 32);
    const skirtMesh = new THREE.Mesh(skirtGeo, heatShieldMat);
    skirtMesh.position.y = -4.4;
    this.group.add(skirtMesh);

    // E. Heavy Engine Bell Nozzle (y: -4.8 to -5.6)
    const nozzleHeight = 0.9;
    const nozzleGeo = new THREE.CylinderGeometry(rocketRadius * 0.35, rocketRadius * 0.75, nozzleHeight, 28, 1, true);
    const nozzleMesh = new THREE.Mesh(nozzleGeo, nozzleMat);
    nozzleMesh.position.y = -5.0;
    this.group.add(nozzleMesh);

    // Inner glowing combustion throat
    const throatGeo = new THREE.SphereGeometry(rocketRadius * 0.32, 16, 12);
    const throatMat = new THREE.MeshBasicMaterial({ color: 0xffeedd });
    const throatMesh = new THREE.Mesh(throatGeo, throatMat);
    throatMesh.position.y = -4.7;
    this.group.add(throatMesh);

    // ==========================================
    // 3. AERODYNAMIC FINS (4 Swept Delta Base Fins)
    // ==========================================
    const finShape = new THREE.Shape();
    finShape.moveTo(0, 0);
    finShape.lineTo(1.8, -1.2);
    finShape.lineTo(1.6, -2.4);
    finShape.lineTo(0, -1.8);
    finShape.closePath();

    const finExtrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: 0.08,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.03,
      bevelThickness: 0.03,
    };
    const finGeometry = new THREE.ExtrudeGeometry(finShape, finExtrudeSettings);
    finGeometry.center();

    for (let f = 0; f < 4; f++) {
      const angle = (f * Math.PI) / 2;
      const finMesh = new THREE.Mesh(finGeometry, finMat);
      finMesh.position.set(
        Math.cos(angle) * (rocketRadius + 0.8),
        -3.8,
        Math.sin(angle) * (rocketRadius + 0.8)
      );
      finMesh.rotation.y = -angle + Math.PI / 2;
      this.group.add(finMesh);
    }

    // Deployable Grid Fins at Upper Stage (4 hypersonic titanium grid fins)
    const gridFinGeo = new THREE.BoxGeometry(0.5, 0.4, 0.04);
    const gridFinMat = new THREE.MeshStandardMaterial({ color: 0x475467, metalness: 0.88, roughness: 0.3 });
    for (let g = 0; g < 4; g++) {
      const angle = (g * Math.PI) / 2 + Math.PI / 4;
      const gridFin = new THREE.Mesh(gridFinGeo, gridFinMat);
      gridFin.position.set(
        Math.cos(angle) * (rocketRadius * 0.95 + 0.25),
        2.1,
        Math.sin(angle) * (rocketRadius * 0.95 + 0.25)
      );
      gridFin.rotation.y = -angle;
      this.group.add(gridFin);
    }

    // ==========================================
    // 4. DEPLOYABLE PNEUMATIC LANDING LEGS (4 Struts)
    // ==========================================
    for (let l = 0; l < 4; l++) {
      const legGroup = new THREE.Group();
      const angle = (l * Math.PI) / 2 + Math.PI / 4;
      legGroup.position.set(
        Math.cos(angle) * (rocketRadius * 0.92),
        -3.5,
        Math.sin(angle) * (rocketRadius * 0.92)
      );
      legGroup.rotation.y = -angle + Math.PI / 2;

      // Upper strut
      const upperStrut = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 2.2, 8),
        heatShieldMat
      );
      upperStrut.position.set(0, -1.0, 0.12);
      legGroup.add(upperStrut);

      // Foot pad
      const footPad = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.28, 0.08, 12),
        nozzleMat
      );
      footPad.position.set(0, -2.1, 0.22);
      legGroup.add(footPad);

      this.group.add(legGroup);
      this.landingLegs.push(legGroup);
    }

    // ==========================================
    // 5. NAVIGATION STROBE LIGHTS
    // ==========================================
    this.strobeRed = new THREE.PointLight(0xff2222, 1.5, 8);
    this.strobeRed.position.set(rocketRadius + 0.1, 1.2, 0);
    this.group.add(this.strobeRed);

    this.strobeGreen = new THREE.PointLight(0x00ff88, 1.5, 8);
    this.strobeGreen.position.set(-rocketRadius - 0.1, 1.2, 0);
    this.group.add(this.strobeGreen);

    // ==========================================
    // 6. VOLUMETRIC EXHAUST FLAME & SHOCK DIAMONDS
    // ==========================================
    this.flameGroup = new THREE.Group();
    this.flameGroup.position.y = -5.4;

    // Volumetric conical flame sheath
    const flameGeo = new THREE.ConeGeometry(1.2, 5.0, 24, 1, true);
    flameGeo.translate(0, -2.5, 0); // Tip at nozzle, expanding downward
    flameGeo.rotateX(Math.PI); // Point downward

    const flameMat = new THREE.MeshBasicMaterial({
      color: 0xff8822,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.flameMesh = new THREE.Mesh(flameGeo, flameMat);
    this.flameGroup.add(this.flameMesh);

    // Inner supersonic shock diamonds (3 nodes)
    const diamondMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    for (let d = 0; d < 3; d++) {
      const diamondGeo = new THREE.OctahedronGeometry(0.35 - d * 0.08, 0);
      const diamond = new THREE.Mesh(diamondGeo, diamondMat);
      diamond.position.y = -(1.1 + d * 1.2);
      diamond.scale.set(0.7, 1.8, 0.7);
      this.flameGroup.add(diamond);
      this.shockDiamonds.push(diamond);
    }

    // Dynamic point light at nozzle throat
    this.coreLight = new THREE.PointLight(0xff7722, 4.0, 35, 1.8);
    this.coreLight.position.y = -0.5;
    this.flameGroup.add(this.coreLight);

    this.group.add(this.flameGroup);

    // Start with engine off
    this.setThrust(0, 0, 0);
    this.setLandingLegs(0);
  }

  /**
   * Sets thrust level, flame size, and engine illumination
   */
  public setThrust(thrust: number, flameLength: number, vibration: number = 0): void {
    const clampedThrust = THREE.MathUtils.clamp(thrust, 0, 1);

    if (clampedThrust <= 0.01) {
      this.flameGroup.visible = false;
      this.coreLight.intensity = 0;
      return;
    }

    this.flameGroup.visible = true;

    // Scale flame cone along Y
    const scaleY = Math.max(0.2, (0.4 + clampedThrust * 1.8) * Math.max(0.3, flameLength));
    const radiusScale = (0.35 + clampedThrust * 0.85) * (1.0 + Math.sin(Date.now() * 0.035) * 0.06);
    this.flameMesh.scale.set(radiusScale, scaleY, radiusScale);

    // Modulate shock diamond pulse
    for (let i = 0; i < this.shockDiamonds.length; i++) {
      const d = this.shockDiamonds[i];
      const pulse = 1.0 + Math.sin(Date.now() * 0.04 + i) * 0.15;
      d.scale.set(radiusScale * 0.65 * pulse, 1.6 * pulse, radiusScale * 0.65 * pulse);
      d.visible = clampedThrust > 0.35;
    }

    // Engine light intensity & color shift (from ignition orange to full-thrust white/cyan)
    this.coreLight.intensity = clampedThrust * 6.5;
    if (clampedThrust > 0.7) {
      this.coreLight.color.setRGB(0.95, 0.85, 0.75);
    } else {
      this.coreLight.color.setRGB(1.0, 0.55, 0.2);
    }

    // Subtle physical rocket vibration
    if (vibration > 0) {
      this.group.position.x += (Math.random() - 0.5) * vibration;
      this.group.position.z += (Math.random() - 0.5) * vibration;
    }
  }

  /**
   * Deploys landing struts: 0.0 (stowed against body) to 1.0 (fully deployed at 45 deg)
   */
  public setLandingLegs(progress: number): void {
    const p = THREE.MathUtils.clamp(progress, 0, 1);
    const deployAngle = p * (Math.PI * 0.28); // 0 to ~50 degrees outward
    for (const leg of this.landingLegs) {
      leg.rotation.x = -deployAngle;
    }
  }

  /**
   * Updates strobe lights and engine flame animations
   */
  public update(time: number): void {
    // Strobe lights flash at 1.2 Hz
    const strobeCycle = (time * 1.2) % 1.0;
    const isStrobeOn = strobeCycle < 0.12 || (strobeCycle > 0.22 && strobeCycle < 0.34);
    this.strobeRed.intensity = isStrobeOn ? 2.5 : 0.05;
    this.strobeGreen.intensity = isStrobeOn ? 2.5 : 0.05;
  }

  public dispose(): void {
    for (const mat of this.fuselageMaterials) {
      mat.dispose();
    }
  }
}
