import * as THREE from 'three';

/**
 * Procedural Earth Continent Geo-Hash Mask:
 * Evaluates whether a latitude / longitude on a sphere lands on major landmasses:
 * - North America, South America, Eurasia, Africa, Australia, Antarctica, Greenland, Islands
 * Returns true if the coordinates represent terrestrial landmass.
 */
export function isLandCoordinate(latDeg: number, lonDeg: number): boolean {
  // 1. Polar Glacial Landmasses
  if (latDeg < -60) return true; // Antarctica
  if (latDeg >= 60 && latDeg <= 84 && lonDeg >= -74 && lonDeg <= -12) return true; // Greenland
  if (latDeg > 78 && lonDeg >= -20 && lonDeg <= 40) return true; // Svalbard / Arctic shelf

  // 2. Australia & New Zealand
  if (latDeg >= -42 && latDeg <= -11 && lonDeg >= 113 && lonDeg <= 154) return true;
  if (latDeg >= -47 && latDeg <= -34 && lonDeg >= 166 && lonDeg <= 178) return true;

  // 3. North America (US, Canada, Alaska, Mexico, Central America)
  if (latDeg >= 7 && latDeg <= 72 && lonDeg >= -168 && lonDeg <= -52) {
    // Carve oceans
    if (latDeg < 28 && lonDeg < -116) return false; // Pacific
    if (latDeg > 48 && lonDeg > -50) return false;  // Atlantic
    if (latDeg < 18 && lonDeg > -75) return false;  // Caribbean open sea
    return true;
  }
  // Caribbean major islands
  if (latDeg >= 18 && latDeg <= 23 && lonDeg >= -85 && lonDeg <= -68) return true;

  // 4. South America
  if (latDeg >= -56 && latDeg < 13 && lonDeg >= -82 && lonDeg <= -34) {
    if (latDeg < -20 && lonDeg > -40) return false;
    if (latDeg < -45 && lonDeg > -60) return false;
    return true;
  }

  // 5. Africa & Madagascar
  if (latDeg >= -35 && latDeg <= 37 && lonDeg >= -18 && lonDeg <= 52) {
    if (latDeg > 25 && lonDeg < -14) return false;
    if (latDeg < -25 && lonDeg < 14) return false;
    return true;
  }
  if (latDeg >= -26 && latDeg <= -12 && lonDeg >= 43 && lonDeg <= 51) return true; // Madagascar

  // 6. Europe
  if (latDeg >= 36 && latDeg <= 72 && lonDeg >= -10 && lonDeg <= 45) {
    if (latDeg < 44 && lonDeg < -9) return false;
    return true;
  }
  if (latDeg >= 50 && latDeg <= 60 && lonDeg >= -10 && lonDeg <= 2) return true; // British Isles

  // 7. Asia & Middle East
  if (latDeg >= 5 && latDeg <= 78 && lonDeg >= 45 && lonDeg <= 180) {
    // Carve Indian Ocean south of India
    if (latDeg < 7 && lonDeg >= 60 && lonDeg <= 95) return false;
    return true;
  }
  if (latDeg >= 12 && latDeg <= 34 && lonDeg >= 35 && lonDeg <= 60) return true; // Arabian Peninsula

  // 8. Southeast Asian Archipelago & Japan
  if (latDeg >= -10 && latDeg <= 20 && lonDeg >= 95 && lonDeg <= 145) return true; // Indonesia/Philippines
  if (latDeg >= 30 && latDeg <= 46 && lonDeg >= 129 && lonDeg <= 146) return true; // Japan

  return false;
}

export type GlobeFeatureType =
  | 'ice'
  | 'desert'
  | 'rainforest'
  | 'land'
  | 'mountain'
  | 'coast'
  | 'ocean'
  | 'cloud'
  | 'aurora'
  | 'city_light';

export interface GlobeParticleResult {
  pos: THREE.Vector3;
  isLand: boolean;
  color: THREE.Color;
  sizeMult: number;
  featureType: GlobeFeatureType;
}

/**
 * Procedural Earth Continent Geo-Hash Mask:
 * Evaluates whether a latitude / longitude on a sphere lands on major landmasses:
 * - North America, South America, Eurasia, Africa, Australia, Antarctica
 * Returns true if the coordinates represent terrestrial landmass.
 */
export function isLandCoordinateLegacy(latRad: number, lonRad: number): boolean {
  const lat = (latRad * 180) / Math.PI;
  const lon = (lonRad * 180) / Math.PI;
  return isLandCoordinate(lat, lon);
}

/**
 * 3D Simplex-Style Noise for organic rock/mineral vertices and fluid curl currents.
 */
export function pseudoNoise3D(x: number, y: number, z: number): number {
  const pX = Math.sin(x * 1.25 + y * 0.73) * Math.cos(z * 1.42);
  const pY = Math.sin(y * 1.18 + z * 0.82) * Math.cos(x * 1.35);
  const pZ = Math.sin(z * 1.31 + x * 0.65) * Math.cos(y * 1.15);
  return (pX + pY + pZ) / 3.0;
}

/**
 * Curl Noise approximation to drive divergence-free, watery particle velocity fields.
 */
export function getCurlNoise(x: number, y: number, z: number, eps = 0.15): THREE.Vector3 {
  const n1 = pseudoNoise3D(x, y + eps, z);
  const n2 = pseudoNoise3D(x, y - eps, z);
  const n3 = pseudoNoise3D(x, y, z + eps);
  const n4 = pseudoNoise3D(x, y, z - eps);
  const n5 = pseudoNoise3D(x + eps, y, z);
  const n6 = pseudoNoise3D(x - eps, y, z);

  const curlX = (n1 - n2) / (2 * eps) - (n3 - n4) / (2 * eps);
  const curlY = (n3 - n4) / (2 * eps) - (n5 - n6) / (2 * eps);
  const curlZ = (n5 - n6) / (2 * eps) - (n1 - n2) / (2 * eps);

  return new THREE.Vector3(curlX, curlY, curlZ);
}

/**
 * Generates organic Rock / Asteroid 3D target coordinates for particles.
 * Distributes particles onto an irregularly faceted, mineral-breathing mass.
 */
export function generateRockPosition(i: number, total: number, time: number): THREE.Vector3 {
  const phi = Math.acos(1 - 2 * ((i + 0.5) / total));
  const goldenRatio = (1 + Math.sqrt(5)) / 2;
  const theta = 2 * Math.PI * i * goldenRatio;

  // Faceted mineral radius with noise deformation
  const baseRadius = 4.2;
  const noiseDeform = pseudoNoise3D(
    Math.sin(phi) * Math.cos(theta) * 2.2,
    Math.sin(phi) * Math.sin(theta) * 2.2,
    Math.cos(phi) * 2.2 + time * 0.1
  );

  const r = baseRadius * (0.8 + 0.45 * noiseDeform);

  const x = r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.sin(phi) * Math.sin(theta);
  const z = r * Math.cos(phi) - 2.5; // Slight depth offset

  return new THREE.Vector3(x, y, z);
}

/**
 * Generates Earth-like Globe 3D target coordinates and vibrant planetary colors.
 * Creates a majestic, high-resolution Earth hologram:
 * - Scaled significantly larger (~9.5 - 9.8 base radius) for commanding presence
 * - Vivid authentic planetary coloration: deep sapphire oceans, turquoise coral coasts,
 *   lush emerald rainforests, golden desert sands, alpine snowcapped peaks, polar ice caps,
 *   swirling white atmospheric storm clouds, and polar auroras!
 * - Real 23.44° planetary axial tilt and continuous rotational dynamics.
 */
export function generateGlobePosition(
  i: number,
  total: number,
  rotationY: number
): GlobeParticleResult {
  // Fibonacci sphere distribution for uniform coverage
  const phi = Math.acos(1 - 2 * ((i + 0.5) / total));
  const goldenRatio = (1 + Math.sqrt(5)) / 2;
  const rawTheta = 2 * Math.PI * i * goldenRatio;

  // Latitude [-90, +90], Longitude [-180, +180] in degrees
  const latDeg = 90 - (phi * 180) / Math.PI;
  let lonDeg = ((rawTheta * 180) / Math.PI) % 360;
  if (lonDeg > 180) lonDeg -= 360;
  if (lonDeg < -180) lonDeg += 360;

  const latRad = (latDeg * Math.PI) / 180;
  const lonRad = (lonDeg * Math.PI) / 180;

  // Check land vs water
  const isLand = isLandCoordinate(latDeg, lonDeg);

  // Allocate ~12% of particles to atmospheric weather clouds and auroras
  const isAtmosphereCandidate = i % 8 === 0;
  const isAuroraCandidate = Math.abs(latDeg) > 66 && (i % 6 === 0);

  let featureType: GlobeFeatureType = 'ocean';
  // Tightly calibrated base radius (5.30) so all 20,000 particles pack closely together!
  let sphereRadius = 5.30;
  const col = new THREE.Color();
  let sizeMult = 1.0;

  if (isAuroraCandidate) {
    // Polar Aurora ribbons floating above magnetic poles
    featureType = 'aurora';
    sphereRadius = 5.68 + (i % 4) * 0.04;
    sizeMult = 1.25;
    if (i % 2 === 0) {
      col.setRGB(0.12, 1.0, 0.65); // Shimmering emerald aurora
    } else {
      col.setRGB(0.84, 0.35, 1.0); // Electric violet-magenta aurora
    }
  } else if (isAtmosphereCandidate) {
    // Swirling white clouds and storm systems floating just above surface
    featureType = 'cloud';
    sphereRadius = 5.50 + ((i * 11) % 5) * 0.02;
    sizeMult = 1.15;
    const cloudShade = 0.96 + ((i * 7) % 5) * 0.01;
    col.setRGB(cloudShade, cloudShade, 1.0);
  } else if (isLand) {
    // Landmass classifications based on latitude and regional geography
    if (Math.abs(latDeg) > 60) {
      // Polar Ice Caps (Antarctica, Greenland, Arctic)
      featureType = 'ice';
      sphereRadius = 5.34;
      sizeMult = 1.1;
      col.setRGB(1.0, 1.0, 1.0); // Crystalline pure glacier white
    } else if (
      (latDeg >= 14 && latDeg <= 35 && lonDeg >= -17 && lonDeg <= 60) || // Sahara & Arabia
      (latDeg >= -35 && latDeg <= -18 && lonDeg >= 115 && lonDeg <= 142) || // Australian Outback
      (latDeg >= 36 && latDeg <= 48 && lonDeg >= 78 && lonDeg <= 110) // Gobi
    ) {
      // Arid Deserts (Golden sands, amber dunes, terracotta)
      featureType = 'desert';
      sphereRadius = 5.32;
      sizeMult = 1.05;
      const duneNoise = ((i * 17) % 5) * 0.02;
      col.setRGB(1.0, 0.80 + duneNoise, 0.20); // Radiant glowing golden amber
    } else if (
      (latDeg >= -15 && latDeg <= 10 && lonDeg >= -80 && lonDeg <= -45) || // Amazon Basin
      (latDeg >= -5 && latDeg <= 8 && lonDeg >= 10 && lonDeg <= 32) || // Congo Basin
      (latDeg >= -8 && latDeg <= 18 && lonDeg >= 98 && lonDeg <= 145) // SE Asia & Indonesia
    ) {
      // Tropical Rainforests (Lush deep emerald & radiant jade)
      featureType = 'rainforest';
      sphereRadius = 5.33;
      sizeMult = 1.08;
      const canopy = ((i * 11) % 5) * 0.025;
      col.setRGB(0.04, 0.96 + canopy, 0.40); // Radiant tropical emerald
    } else if (
      (latDeg >= 26 && latDeg <= 36 && lonDeg >= 75 && lonDeg <= 96) || // Himalayas
      (latDeg >= -50 && latDeg <= 10 && lonDeg >= -76 && lonDeg <= -68) || // Andes
      (latDeg >= 34 && latDeg <= 55 && lonDeg >= -124 && lonDeg <= -105) // Rockies
    ) {
      // Mountain Spines with Snowcaps
      featureType = 'mountain';
      sphereRadius = 5.42; // Elevated peak spine
      sizeMult = 1.15;
      col.setRGB(0.96, 0.98, 1.0); // Snow-capped granite slate
    } else {
      // Temperate Plains & Forests (North America, Europe, East Asia)
      featureType = 'land';
      sphereRadius = 5.31;
      sizeMult = 1.0;
      const flora = ((i * 19) % 5) * 0.025;
      col.setRGB(0.14, 0.90 + flora, 0.35); // Fresh verdant vegetation green
    }
  } else {
    // Oceanic waters: coastal shelves vs deep open oceans
    const isCoastalShelf = (i % 3 === 0);

    if (isCoastalShelf) {
      // Coastal shallow waters, coral barrier reefs, Caribbean turquoise
      featureType = 'coast';
      sphereRadius = 5.28;
      sizeMult = 1.05;
      col.setRGB(0.03, 0.92, 0.96); // Electric glowing cyan-turquoise
    } else {
      // Deep open oceans (Pacific, Atlantic, Indian, Southern)
      featureType = 'ocean';
      sphereRadius = 5.25;
      sizeMult = 0.95;
      const oceanDepth = ((i * 23) % 4) * 0.02;
      col.setRGB(0.04, 0.44 + oceanDepth, 0.98); // Deep luminous sapphire blue
    }
  }

  // True 3D Earth Axial Tilt: 23.44° (~0.4091 rad) rotation
  const tilt = 0.4091;
  const cosTilt = Math.cos(tilt);
  const sinTilt = Math.sin(tilt);

  const cosLat = Math.cos(latRad);
  const sinLat = Math.sin(latRad);
  const cosLon = Math.cos(lonRad + rotationY);
  const sinLon = Math.sin(lonRad + rotationY);

  // Unrotated spherical coordinates
  const x0 = sphereRadius * cosLat * sinLon;
  const y0 = sphereRadius * sinLat;
  const z0 = sphereRadius * cosLat * cosLon;

  // True 3D axial tilt rotation around Z axis
  const x = x0 * cosTilt - y0 * sinTilt;
  const y = x0 * sinTilt + y0 * cosTilt;
  const z = z0;

  return {
    pos: new THREE.Vector3(x, y, z),
    isLand,
    color: col,
    sizeMult,
    featureType,
  };
}

/**
 * Generates Transverse Oceanic Fluid Wave target coordinates.
 */
export function generateWavePosition(
  i: number,
  total: number,
  time: number
): THREE.Vector3 {
  const rowCount = 35;
  const colCount = Math.floor(total / rowCount);

  const col = i % colCount;
  const row = Math.floor(i / colCount);

  const u = (col / colCount - 0.5) * 36;
  const v = (row / rowCount - 0.5) * 24;

  const waveHeight =
    Math.sin(u * 0.35 + time * 1.8) * 1.6 +
    Math.cos(v * 0.45 + time * 1.2) * 1.2 +
    pseudoNoise3D(u * 0.1, v * 0.1, time * 0.5) * 0.8;

  return new THREE.Vector3(u, waveHeight - 1.0, v * 0.6 - 4.0);
}

/**
 * Section-Aware Form: Architectural Matrix for Projects Section
 */
export function generateArchitecturePosition(
  i: number,
  total: number
): THREE.Vector3 {
  const side = Math.cbrt(total) || 12;
  const ix = i % Math.round(side);
  const iy = Math.floor((i / Math.round(side)) % Math.round(side));
  const iz = Math.floor(i / (Math.round(side) * Math.round(side)));

  const step = 2.4;
  const x = (ix - side / 2) * step;
  const y = (iy - side / 2) * (step * 0.85);
  const z = (iz - side / 2) * (step * 0.7) - 6.0;

  return new THREE.Vector3(x, y, z);
}

/**
 * Procedural Geometric Sphere for entry sequence (Form 01)
 */
export function generateSpherePosition(
  i: number,
  total: number,
  radius = 4.8
): THREE.Vector3 {
  const phi = Math.acos(1 - 2 * ((i + 0.5) / total));
  const goldenRatio = (1 + Math.sqrt(5)) / 2;
  const theta = 2 * Math.PI * i * goldenRatio;

  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi) * Math.sin(theta);
  const z = radius * Math.cos(phi) - 2.0;

  return new THREE.Vector3(x, y, z);
}

/**
 * Procedural 3D Circular Ring for entry sequence (Form 02)
 */
export function generateRingPosition(
  i: number,
  total: number,
  time = 0
): THREE.Vector3 {
  const angle = (i / total) * Math.PI * 2;
  const radius = 5.2 + Math.sin(i * 3.7) * 0.35;
  const tilt = 0.55;

  const rx = Math.cos(angle) * radius;
  const ry = Math.sin(angle) * radius * Math.cos(tilt);
  const rz = Math.sin(angle) * radius * Math.sin(tilt) - 2.0;

  return new THREE.Vector3(rx, ry, rz);
}

/**
 * Procedural Multi-Orbit system (Form 04)
 */
export function generateOrbitPosition(
  i: number,
  total: number,
  time = 0
): THREE.Vector3 {
  // 3 distinct orbital tracks
  const track = i % 3;
  const baseRadius = track === 0 ? 3.0 : track === 1 ? 5.0 : 7.2;
  const speed = track === 0 ? 2.5 : track === 1 ? 1.5 : 0.8;
  const angle = (i / total) * Math.PI * 6 + time * speed;
  const tilt = (track * Math.PI) / 3;

  const x = Math.cos(angle) * baseRadius;
  const y = Math.sin(angle) * baseRadius * Math.cos(tilt);
  const z = Math.sin(angle) * baseRadius * Math.sin(tilt) - 2.5;

  return new THREE.Vector3(x, y, z);
}

/**
 * Procedural Blueprint / Digital Architecture Wireframe Grid (Form 07)
 */
export function generateBlueprintPosition(
  i: number,
  total: number
): THREE.Vector3 {
  // Triangular pyramid / architectural truss lattice
  const t = i / total;
  if (t < 0.25) {
    // Ground foundation square
    const side = (t / 0.25) * 4;
    const leg = Math.floor(side);
    const frac = (side % 1) * 8 - 4;
    let x = 0;
    let y = -3.5;
    let z = -2.0;
    if (leg === 0) { x = frac; z = -6.0; }
    else if (leg === 1) { x = 4; z = frac - 2.0; }
    else if (leg === 2) { x = -frac; z = 2.0; }
    else { x = -4; z = -frac - 2.0; }
    return new THREE.Vector3(x, y, z);
  } else if (t < 0.6) {
    // 4 ascending struts towards apex
    const strutIndex = (i % 4);
    const h = ((t - 0.25) / 0.35); // 0 to 1
    const apexX = 0;
    const apexY = 4.2;
    const apexZ = -2.0;
    const baseCorners = [
      [-4, -3.5, -6],
      [4, -3.5, -6],
      [4, -3.5, 2],
      [-4, -3.5, 2],
    ];
    const corner = baseCorners[strutIndex];
    const x = corner[0] * (1 - h) + apexX * h;
    const y = corner[1] * (1 - h) + apexY * h;
    const z = corner[2] * (1 - h) + apexZ * h;
    return new THREE.Vector3(x, y, z);
  } else {
    // Internal floor grids & cross braces
    const level = ((i % 5) - 2) * 1.5;
    const span = Math.max(0.5, 3.5 - Math.abs(level) * 0.7);
    const u = ((i * 1.618) % 1) * 2 - 1;
    const v = ((i * 2.718) % 1) * 2 - 1;
    return new THREE.Vector3(u * span, level, v * span - 2.0);
  }
}

/**
 * Section-Aware Form: Concentric Convergence for Contact Section
 */
export function generateConvergencePosition(
  i: number,
  total: number,
  time: number
): THREE.Vector3 {
  const angle = (i / total) * Math.PI * 18 + time * 0.3;
  const radius = (i / total) * 14 + 1.2;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * (radius * 0.7);
  const z = -Math.sin(time + radius * 0.2) * 2.0 - 4.0;

  return new THREE.Vector3(x, y, z);
}
