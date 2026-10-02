import * as THREE from 'three';
import { pseudoNoise3D } from './matterFormGeometry';

export interface RocketParticleResult {
  pos: THREE.Vector3;
  color: THREE.Color;
  isEngine: boolean;
  isExhaust: boolean;
  isShockDiamond: boolean;
  sizeMult: number;
  part: string;
}

// Reusable static result object to avoid creating tens of thousands of Vector3 and Color objects per frame
const _sharedRocketResult: RocketParticleResult = {
  pos: new THREE.Vector3(),
  color: new THREE.Color(),
  isEngine: false,
  isExhaust: false,
  isShockDiamond: false,
  sizeMult: 1.0,
  part: 'fuselage',
};

/**
 * Procedural Multi-Stage Real Heavy-Lift Aerospace Rocket:
 * Modeled with high-precision aerospace engineering architecture:
 * 1. Aerodynamic Ogive Payload Fairing / Nosecone with TPS heat shield tiling
 * 2. Orbital Stage with precision telemetry stripes (NASA Red & Aerospace Cobalt)
 * 3. Interstage Truss & 4 Deployable Hypersonic Titanium Grid Fins
 * 4. Main Core Booster stage with cryogenic fuel tank structure & stringer panels
 * 5. Dual Outrigger Heavy Boosters flanking the core at X = +/- 2.2 with tapered nose caps
 * 6. Swept Hypersonic Delta Base Fins & Landing Legs extending out to X = +/- 3.4
 * 7. Multi-Engine Bell Nozzle Cluster (Center + perimeter bells) in incandescent copper
 * 8. Supersonic Shock Diamond Plume: hot-white diamond nodes, fiery orange/amber flame cone,
 *    and electric cyan plasma sheath!
 * 9. Port (Red) and Starboard (Green) active navigation beacon strobes.
 *
 * Zero-allocation: writes directly to reusable static result object.
 */
export function generateRocketPosition(
  i: number,
  total: number,
  rocketY: number = 0,
  vibration: number = 0
): RocketParticleResult {
  const u = i / total;

  let x = 0;
  let y = 0;
  let z = -2.0;
  let isEngine = false;
  let isExhaust = false;
  let isShockDiamond = false;
  let sizeMult = 1.0;
  let part = 'fuselage';

  const col = _sharedRocketResult.color;
  const vibX = (Math.random() - 0.5) * vibration;
  const vibY = (Math.random() - 0.5) * vibration;

  if (u < 0.12) {
    // ==========================================
    // 1. AERODYNAMIC NOSECONE & PAYLOAD FAIRING (Height: +7.8 to +5.4)
    // ==========================================
    part = 'nosecone';
    const t = u / 0.12; // 0 (pointed tip) to 1 (base of fairing)
    const angle = i * 2.39996; // Golden angle for even circumferential shell
    // Von Kármán / Ogive nosecone profile
    const r = (t < 0.1) ? t * 4.0 * 0.35 : Math.sin(t * Math.PI * 0.5) * 1.35;
    y = 7.8 - t * 2.4;
    x = Math.cos(angle) * r;
    z = -2.0 + Math.sin(angle) * r;

    // Ceramic heat shield tiles on windward belly vs pristine aerospace white dorsal
    const isWindward = Math.sin(angle) < -0.2;
    if (t < 0.04) {
      // Pitot telemetry probe at apex
      col.setRGB(0.95, 0.95, 1.0);
      sizeMult = 1.4;
    } else if (isWindward) {
      // Matte dark carbon-phenolic heat shield tiles
      col.setRGB(0.12, 0.14, 0.18);
    } else {
      // Brilliant pearlescent aerospace white
      col.setRGB(0.96, 0.98, 1.0);
    }
  } else if (u < 0.28) {
    // ==========================================
    // 2. ORBITAL SECOND STAGE & LIVERY (Height: +5.4 to +2.8)
    // ==========================================
    part = 'orbital_stage';
    const t = (u - 0.12) / 0.16;
    const angle = i * 2.39996;
    const r = 1.35;
    y = 5.4 - t * 2.6;
    x = Math.cos(angle) * r;
    z = -2.0 + Math.sin(angle) * r;

    // Aerospace mission livery: precision red telemetry stripes & cobalt blue bands
    const isRedStripe = (t > 0.35 && t < 0.45) && (Math.abs(Math.cos(angle)) > 0.6);
    const isBlueStripe = (t > 0.70 && t < 0.78);

    if (isRedStripe) {
      col.setRGB(0.94, 0.22, 0.22); // Racing telemetry red (#EF4444)
    } else if (isBlueStripe) {
      col.setRGB(0.23, 0.51, 0.96); // Aerospace cobalt blue (#3B82F6)
    } else if (Math.sin(angle) < -0.3) {
      col.setRGB(0.12, 0.14, 0.18); // Heat shield continuation
    } else {
      col.setRGB(0.95, 0.97, 1.0); // Aerospace white
    }
  } else if (u < 0.36) {
    // ==========================================
    // 3. INTERSTAGE TRUSS & 4 TITANIUM GRID FINS (Height: +2.8 to +1.6)
    // ==========================================
    const t = (u - 0.28) / 0.08;
    const finSlot = i % 4; // 4 orthogonal grid fins (+X, -X, +Z, -Z)
    const isFinParticle = (i % 2 === 0);

    if (isFinParticle) {
      part = 'grid_fin';
      // Titanium hypersonic grid fin extending outward like SpaceX / Starship
      const finSpan = 1.4 + ((i * 17) % 5) * 0.28;
      const finHeight = 2.4 - ((i * 7) % 4) * 0.25;
      const gridAngle = (finSlot * Math.PI) / 2;

      x = Math.cos(gridAngle) * finSpan;
      y = finHeight;
      z = -2.0 + Math.sin(gridAngle) * finSpan;

      // Dark scorched titanium composite
      col.setRGB(0.28, 0.33, 0.40);
      sizeMult = 1.15;
    } else {
      part = 'interstage_ring';
      const angle = i * 2.39996;
      const r = 1.32;
      y = 2.8 - t * 1.2;
      x = Math.cos(angle) * r;
      z = -2.0 + Math.sin(angle) * r;
      // Carbon-composite black interstage lattice
      col.setRGB(0.15, 0.17, 0.22);
    }
  } else if (u < 0.58) {
    // ==========================================
    // 4. MAIN CORE BOOSTER STAGE (Height: +1.6 to -2.6)
    // ==========================================
    part = 'core_stage';
    const t = (u - 0.36) / 0.22;
    const angle = i * 2.39996;
    const r = 1.35;
    y = 1.6 - t * 4.2;
    x = Math.cos(angle) * r;
    z = -2.0 + Math.sin(angle) * r;

    // Structural panel lines & vertical raceway cable conduits
    const isRaceway = Math.abs(Math.sin(angle) - 0.98) < 0.08;
    const isRingRib = (Math.floor(t * 12) % 3 === 0 && Math.abs(t * 12 - Math.floor(t * 12)) < 0.15);

    if (isRaceway) {
      col.setRGB(0.18, 0.22, 0.28); // Dark conduit raceway
    } else if (isRingRib) {
      col.setRGB(0.85, 0.88, 0.92); // Metal ring weld
    } else if (Math.sin(angle) < -0.35) {
      col.setRGB(0.12, 0.14, 0.18); // Dark belly
    } else {
      col.setRGB(0.94, 0.96, 0.99); // Aerospace white
    }
  } else if (u < 0.72) {
    // ==========================================
    // 5. DUAL SIDE OUTRIGGER BOOSTERS (X = -2.2 and +2.2, Height: +2.2 to -3.2)
    // ==========================================
    part = 'side_booster';
    const t = (u - 0.58) / 0.14;
    const side = (i % 2 === 0) ? -1 : 1; // Left or Right booster
    const boosterCenterX = side * 2.25;
    const boosterCenterZ = -2.0;
    const angle = i * 2.39996;
    const boosterRadius = 0.82;

    if (t < 0.2) {
      // Tapered aerodynamic nosecone of side booster
      const nt = t / 0.2;
      const r = nt * boosterRadius;
      y = 2.4 - nt * 1.2;
      x = boosterCenterX + Math.cos(angle) * r;
      z = boosterCenterZ + Math.sin(angle) * r;
      col.setRGB(0.96, 0.98, 1.0);
    } else {
      // Cylindrical side booster body
      const bt = (t - 0.2) / 0.8;
      y = 1.2 - bt * 4.4;
      x = boosterCenterX + Math.cos(angle) * boosterRadius;
      z = boosterCenterZ + Math.sin(angle) * boosterRadius;

      // Telemetry decal on outer booster flanks
      const isOuterDecal = (bt > 0.4 && bt < 0.6) && (side * Math.cos(angle) > 0.4);
      if (isOuterDecal) {
        col.setRGB(0.94, 0.22, 0.22); // Red mission flag
      } else {
        col.setRGB(0.92, 0.95, 0.98); // Aerospace white
      }
    }
  } else if (u < 0.82) {
    // ==========================================
    // 6. SWEPT DELTA FINS, LANDING LEGS & NAVIGATION BEACONS (Height: -1.2 to -4.2)
    // ==========================================
    part = 'fins_and_legs';
    const t = (u - 0.72) / 0.10;
    const finIndex = i % 4; // 4 fins
    const side = (finIndex % 2 === 0) ? 1 : -1;
    const isNavBeacon = (t > 0.85);

    // Delta wing sweep outward
    const finHeight = -1.2 - t * 3.0;
    const finSpan = 1.35 + Math.sin(t * Math.PI * 0.5) * 2.05; // Sweeps out to 3.4
    const finAngle = (finIndex * Math.PI) / 2;

    x = Math.cos(finAngle) * finSpan;
    y = finHeight;
    z = -2.0 + Math.sin(finAngle) * finSpan;

    if (isNavBeacon && finIndex === 0) {
      // Starboard (Green) navigation strobe beacon
      col.setRGB(0.12, 0.95, 0.45);
      sizeMult = 1.6;
    } else if (isNavBeacon && finIndex === 1) {
      // Port (Red) navigation strobe beacon
      col.setRGB(0.96, 0.15, 0.15);
      sizeMult = 1.6;
    } else {
      // Titanium alloy control fin
      col.setRGB(0.24, 0.28, 0.35);
    }
  } else if (u < 0.88) {
    // ==========================================
    // 7. MULTI-ENGINE BELL NOZZLE CLUSTER (Height: -2.6 to -4.0)
    // ==========================================
    isEngine = true;
    part = 'engine_nozzle';
    const t = (u - 0.82) / 0.06;
    const bellIndex = i % 5; // Center engine + 4 outer engines
    let bellCenterX = 0;
    let bellCenterZ = -2.0;

    if (bellIndex === 1) bellCenterX = -0.7;
    if (bellIndex === 2) bellCenterX = 0.7;
    if (bellIndex === 3) bellCenterZ = -2.7;
    if (bellIndex === 4) bellCenterZ = -1.3;

    const angle = i * 2.39996;
    // Bell nozzle expands downward (conical bell)
    const nozzleRadius = 0.35 + t * 0.32;
    y = -2.6 - t * 1.4;
    x = bellCenterX + Math.cos(angle) * nozzleRadius;
    z = bellCenterZ + Math.sin(angle) * nozzleRadius;

    // Incandescent heat-treated copper/tungsten engine bell
    col.setRGB(0.92, 0.48, 0.12); // Burning orange metallic
    sizeMult = 1.25;
  } else {
    // ==========================================
    // 8. SUPERSONIC SHOCK DIAMOND EXHAUST PLUME (Height: -4.0 to -11.0)
    // ==========================================
    isEngine = true;
    isExhaust = true;
    part = 'exhaust_shock_plume';
    const t = (u - 0.88) / 0.12; // 0 (nozzle exit) to 1 (far trail)
    y = -4.0 - t * 7.0;

    // Shock diamond oscillations (high density plasma nodes along centerline)
    const shockPhase = Math.sin(t * Math.PI * 8.0);
    const isShockCore = Math.abs(shockPhase) > 0.85 && (i % 3 === 0);

    if (isShockCore) {
      // Hot-white supersonic shock diamond node
      isShockDiamond = true;
      const r = Math.random() * 0.45;
      const angle = Math.random() * Math.PI * 2;
      x = Math.cos(angle) * r;
      z = -2.0 + Math.sin(angle) * r;
      col.setRGB(1.0, 1.0, 1.0); // Blinding shock white
      sizeMult = 1.7;
    } else {
      // Expanding supersonic flame cone and ion plasma sheath
      const plumeExpansion = 0.5 + t * 2.8;
      const angle = i * 2.39996;
      const radius = (Math.random() * 0.6 + 0.4) * plumeExpansion;
      x = Math.cos(angle) * radius;
      z = -2.0 + Math.sin(angle) * radius;

      const isOuterSheath = radius > plumeExpansion * 0.75;
      if (isOuterSheath) {
        // Electric cyan/blue LOX-methane outer ionization sheath
        col.setRGB(0.05, 0.90, 1.0); // Electric plasma cyan (#00E5FF)
        sizeMult = 1.3;
      } else {
        // Incandescent fiery orange-amber core
        const fieryYellow = (1.0 - t * 0.5);
        col.setRGB(1.0, 0.55 * fieryYellow, 0.08); // Blazing solar orange (#FF8C00)
        sizeMult = 1.45;
      }
    }
  }

  // Micro vibration & structural noise
  const noise = pseudoNoise3D(x * 1.5, y * 1.5, u * 12.0) * 0.04;

  _sharedRocketResult.pos.set(x + vibX + noise, y + rocketY + vibY, z);
  _sharedRocketResult.isEngine = isEngine;
  _sharedRocketResult.isExhaust = isExhaust;
  _sharedRocketResult.isShockDiamond = isShockDiamond;
  _sharedRocketResult.sizeMult = sizeMult;
  _sharedRocketResult.part = part;

  return _sharedRocketResult;
}

/**
 * Downward Engine Particle Stream for Ignition & Launch Exhaust
 * Generates energetic supersonic shock diamonds, plasma sparks, and turbulent smoke.
 */
export function generateExhaustParticle(
  rocketY: number,
  intensity: number
): { pos: THREE.Vector3; vel: THREE.Vector3; color: THREE.Color } {
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.random() * (0.6 + intensity * 0.8);
  const posX = Math.cos(angle) * radius;
  const posY = rocketY - 4.0 - Math.random() * (1.2 + intensity * 2.5);
  const posZ = -2.0 + (Math.random() - 0.5) * 0.8;

  // Supersonic downward velocity with turbulent lateral dispersion
  const velX = (Math.random() - 0.5) * 0.6 * intensity;
  const velY = -2.4 * intensity - Math.random() * 2.2 * intensity;
  const velZ = (Math.random() - 0.5) * 0.4 * intensity;

  const col = new THREE.Color();
  const pick = Math.random();
  if (pick < 0.25) {
    col.setRGB(1.0, 1.0, 1.0); // Shock white
  } else if (pick < 0.70) {
    col.setRGB(1.0, 0.52, 0.05); // Solar orange
  } else {
    col.setRGB(0.08, 0.88, 1.0); // Plasma cyan
  }

  return {
    pos: new THREE.Vector3(posX, posY, posZ),
    vel: new THREE.Vector3(velX, velY, velZ),
    color: col,
  };
}
