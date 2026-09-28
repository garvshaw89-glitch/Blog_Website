import * as THREE from 'three';

/**
 * Procedural Earth Continent Geo-Hash Mask:
 * Evaluates whether a latitude / longitude on a sphere lands on major landmasses:
 * - North America, South America, Eurasia, Africa, Australia, Antarctica
 * Returns true if the coordinates represent terrestrial landmass.
 */
export function isLandCoordinate(latRad: number, lonRad: number): boolean {
  // Convert radians to degrees: lat [-90, 90], lon [-180, 180]
  const lat = (latRad * 180) / Math.PI;
  const lon = (lonRad * 180) / Math.PI;

  // Antarctica
  if (lat < -62) return true;

  // Australia
  if (lat >= -40 && lat <= -12 && lon >= 112 && lon <= 154) return true;

  // North America (US, Canada, Alaska, Mexico)
  if (lat >= 14 && lat <= 72 && lon >= -168 && lon <= -52) {
    if (lat < 30 && lon < -118) return false; // Pacific carve
    if (lat > 50 && lon > -50) return false; // Atlantic ocean
    return true;
  }

  // South America
  if (lat >= -56 && lat < 13 && lon >= -82 && lon <= -34) {
    if (lat < -20 && lon > -40) return false;
    return true;
  }

  // Africa
  if (lat >= -35 && lat <= 37 && lon >= -18 && lon <= 52) {
    if (lat > 20 && lon < -12) return false;
    return true;
  }

  // Europe
  if (lat >= 36 && lat <= 71 && lon >= -10 && lon <= 45) {
    return true;
  }

  // Asia (India, China, Russia, Middle East, SE Asia)
  if (lat >= 5 && lat <= 78 && lon >= 45 && lon <= 180) {
    // Carve Indian Ocean south of India
    if (lat < 7 && lon < 95) return false;
    return true;
  }

  return false;
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
 * Generates Earth-like Globe 3D target coordinates.
 * Concentrates higher particle density on actual continental landmasses while keeping
 * oceanic areas dotted with delicate atmospheric depth particles.
 */
export function generateGlobePosition(
  i: number,
  total: number,
  rotationY: number
): { pos: THREE.Vector3; isLand: boolean } {
  // Fibonacci sphere distribution
  const phi = Math.acos(1 - 2 * ((i + 0.5) / total));
  const goldenRatio = (1 + Math.sqrt(5)) / 2;
  const rawTheta = 2 * Math.PI * i * goldenRatio;

  // Latitude [-PI/2, PI/2], Longitude [-PI, PI]
  const latRad = Math.PI / 2 - phi;
  let lonRad = (rawTheta % (2 * Math.PI)) - Math.PI;

  const isLand = isLandCoordinate(latRad, lonRad);

  // Land particles slightly elevated; ocean particles lower depth
  const sphereRadius = isLand ? 5.2 : 5.0;

  // Apply subtle axial tilt (~23.4 degrees) and ongoing planetary rotation
  const tiltedLat = latRad + 0.12;
  const rotatedLon = lonRad + rotationY;

  const cosLat = Math.cos(tiltedLat);
  const sinLat = Math.sin(tiltedLat);
  const cosLon = Math.cos(rotatedLon);
  const sinLon = Math.sin(rotatedLon);

  const x = sphereRadius * cosLat * sinLon;
  const y = sphereRadius * sinLat;
  const z = sphereRadius * cosLat * cosLon - 2.0;

  return {
    pos: new THREE.Vector3(x, y, z),
    isLand,
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
