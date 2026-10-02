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
    // Carve Pacific & Atlantic waters
    if (latDeg < 28 && lonDeg < -116) return false; // Pacific
    if (latDeg > 48 && lonDeg > -50) return false;  // Atlantic
    if (latDeg < 18 && lonDeg > -75) return false;  // Caribbean open sea
    // Carve Great Lakes (Lake Superior/Michigan/Huron/Erie/Ontario)
    if (latDeg >= 41 && latDeg <= 49 && lonDeg >= -92 && lonDeg <= -76) {
      if ((latDeg >= 46 && lonDeg >= -90 && lonDeg <= -84) || (latDeg >= 42 && latDeg <= 45 && lonDeg >= -87 && lonDeg <= -82)) {
        return false;
      }
    }
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
    // Carve Red Sea (separating Africa from Arabian Peninsula)
    if (latDeg >= 12 && latDeg <= 29 && lonDeg >= 32 && lonDeg <= 44 && lonDeg < (latDeg * 0.55 + 30)) {
      return false;
    }
    return true;
  }
  if (latDeg >= -26 && latDeg <= -12 && lonDeg >= 43 && lonDeg <= 51) return true; // Madagascar

  // 6. Europe & Mediterranean Basin
  if (latDeg >= 36 && latDeg <= 72 && lonDeg >= -10 && lonDeg <= 45) {
    // Carve Mediterranean Sea separating Europe and North Africa
    if (latDeg >= 34 && latDeg <= 44 && lonDeg >= -5 && lonDeg <= 36) {
      const isIberia = latDeg >= 36 && latDeg <= 44 && lonDeg >= -9 && lonDeg <= 3;
      const isItaly = latDeg >= 37 && latDeg <= 46 && lonDeg >= 8 && lonDeg <= 18;
      const isGreece = latDeg >= 36 && latDeg <= 41 && lonDeg >= 20 && lonDeg <= 26;
      if (!isIberia && !isItaly && !isGreece) {
        return false; // Mediterranean water
      }
    }
    if (latDeg < 44 && lonDeg < -9) return false;
    return true;
  }
  if (latDeg >= 50 && latDeg <= 60 && lonDeg >= -10 && lonDeg <= 2) return true; // British Isles

  // 7. Asia & Middle East
  if (latDeg >= 5 && latDeg <= 78 && lonDeg >= 45 && lonDeg <= 180) {
    // Carve Indian Ocean south of India
    if (latDeg < 7 && lonDeg >= 60 && lonDeg <= 95) return false;
    // Carve Caspian Sea
    if (latDeg >= 36 && latDeg <= 47 && lonDeg >= 48 && lonDeg <= 54) return false;
    // Carve Black Sea
    if (latDeg >= 41 && latDeg <= 46 && lonDeg >= 28 && lonDeg <= 41) return false;
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
  | 'city_light'
  | 'grid_line'
  | 'city_beacon'
  | 'flight_arc';

export interface GlobeParticleResult {
  pos: THREE.Vector3;
  isLand: boolean;
  color: THREE.Color;
  sizeMult: number;
  featureType: GlobeFeatureType;
}

/**
 * Global Innovation & AI Tech Hub Coordinates:
 * Major metropolitan nodes forming the high-tech planetary constellation.
 */
export const GLOBAL_TECH_HUBS = [
  { name: 'San Francisco', lat: 37.77, lon: -122.41, r: 0.22, g: 0.95, b: 1.00 },
  { name: 'New York', lat: 40.71, lon: -74.00, r: 0.35, g: 0.88, b: 1.00 },
  { name: 'London', lat: 51.50, lon: -0.12, r: 0.40, g: 0.92, b: 1.00 },
  { name: 'Zurich', lat: 47.37, lon: 8.54, r: 0.48, g: 0.95, b: 1.00 },
  { name: 'Dubai', lat: 25.20, lon: 55.27, r: 1.00, g: 0.82, b: 0.22 },
  { name: 'Bengaluru', lat: 12.97, lon: 77.59, r: 0.22, g: 1.00, b: 0.65 },
  { name: 'Singapore', lat: 1.35, lon: 103.82, r: 0.15, g: 0.95, b: 1.00 },
  { name: 'Tokyo', lat: 35.68, lon: 139.69, r: 1.00, g: 0.35, b: 0.65 },
  { name: 'Sydney', lat: -33.86, lon: 151.20, r: 0.25, g: 0.90, b: 1.00 },
  { name: 'São Paulo', lat: -23.55, lon: -46.63, r: 0.22, g: 1.00, b: 0.55 },
];

export const TRANSCONTINENTAL_ROUTES = [
  { from: 0, to: 7 }, // SF -> Tokyo
  { from: 0, to: 1 }, // SF -> New York
  { from: 1, to: 2 }, // New York -> London
  { from: 2, to: 3 }, // London -> Zurich
  { from: 2, to: 4 }, // London -> Dubai
  { from: 4, to: 5 }, // Dubai -> Bengaluru
  { from: 5, to: 6 }, // Bengaluru -> Singapore
  { from: 6, to: 7 }, // Singapore -> Tokyo
  { from: 7, to: 8 }, // Tokyo -> Sydney
  { from: 2, to: 9 }, // London -> São Paulo
];

/**
 * Precomputed Fibonacci Sphere & Planetary Biome Representation
 * Zero per-frame allocation for high-throughput 60–120 FPS rendering.
 */
export interface GlobePrecomputedData {
  cosLat: Float32Array;
  sinLat: Float32Array;
  lonRad: Float32Array;
  radiusOffset: Float32Array;
  baseColorR: Float32Array;
  baseColorG: Float32Array;
  baseColorB: Float32Array;
  sizeMult: Float32Array;
  featureType: Uint8Array;
  isLand: Uint8Array;
}

/**
 * Precomputes static Fibonacci spherical coordinates, dense continental topography,
 * oceanic basins, drifting cloud layer, and polar auroras.
 * Call once at startup or when particle budget updates.
 */
export function precomputeGlobeData(total: number): GlobePrecomputedData {
  const cosLat = new Float32Array(total);
  const sinLat = new Float32Array(total);
  const lonRad = new Float32Array(total);
  const radiusOffset = new Float32Array(total);
  const baseColorR = new Float32Array(total);
  const baseColorG = new Float32Array(total);
  const baseColorB = new Float32Array(total);
  const sizeMult = new Float32Array(total);
  const featureType = new Uint8Array(total);
  const isLandArr = new Uint8Array(total);

  const goldenRatio = (1 + Math.sqrt(5)) / 2;

  // Particle category distribution for the Full Particle Dot Globe:
  // - ~10% Coordinate Grid Lines (Equator, Tropics, Polar Circles, Meridians)
  // - ~3.5% Global Innovation Hub Beacons (San Francisco, NY, London, Zurich, Tokyo, Singapore, etc.)
  // - ~4.5% Transcontinental Great-Circle 3D Data Arcs
  // - ~3% Floating Cloud Fronts
  // - ~2% Polar Auroras
  // - Remaining ~77% are Distributed across the ENTIRE 360° Spherical Surface
  //   forming a continuous, mathematically uniform Fibonacci dot matrix covering all continents & oceans!
  const targetGridCount = Math.floor(total * 0.10);
  const targetCityCount = Math.floor(total * 0.035);
  const targetArcCount = Math.floor(total * 0.045);
  const targetCloudCount = Math.floor(total * 0.03);
  const targetAuroraCount = Math.floor(total * 0.02);

  const specialFeaturesTotal =
    targetGridCount + targetCityCount + targetArcCount + targetCloudCount + targetAuroraCount;
  const surfaceCount = total - specialFeaturesTotal;

  let gridCount = 0;
  let cityCount = 0;
  let arcCount = 0;
  let cloudCount = 0;
  let auroraCount = 0;

  for (let i = 0; i < total; i++) {
    let latDeg = 0;
    let lonDeg = 0;
    let phi = 0;
    let isLand = false;
    let feat = 0;

    if (i < surfaceCount) {
      // 1. FULL SPHERICAL 360° FIBONACCI DOT MATRIX
      // Evenly samples from North Pole (+90°) down to South Pole (-90°)
      // Guarantees zero empty holes or blank regions anywhere on the globe!
      phi = Math.acos(1 - 2 * ((i + 0.5) / surfaceCount));
      const rawTheta = 2 * Math.PI * i * goldenRatio;
      latDeg = 90 - (phi * 180) / Math.PI;
      lonDeg = ((rawTheta * 180) / Math.PI) % 360;
      if (lonDeg > 180) lonDeg -= 360;
      if (lonDeg < -180) lonDeg += 360;

      isLand = isLandCoordinate(latDeg, lonDeg);
    } else if (gridCount < targetGridCount) {
      // 2. COORDINATE GRID LINES (Equator, Tropics, Polar Circles, Meridians)
      const gridRing = gridCount % 12;
      if (gridRing === 0) {
        // Equator (0° lat) - high-tech prime cyan ring
        latDeg = 0;
        lonDeg = ((gridCount * 6.0) % 360) - 180;
      } else if (gridRing === 1) {
        // Tropic of Cancer (+23.44° lat)
        latDeg = 23.44;
        lonDeg = ((gridCount * 7.5) % 360) - 180;
      } else if (gridRing === 2) {
        // Tropic of Capricorn (-23.44° lat)
        latDeg = -23.44;
        lonDeg = ((gridCount * 7.5) % 360) - 180;
      } else if (gridRing === 3) {
        // Arctic Circle (+66.5° lat)
        latDeg = 66.5;
        lonDeg = ((gridCount * 12.0) % 360) - 180;
      } else if (gridRing === 4) {
        // Antarctic Circle (-66.5° lat)
        latDeg = -66.5;
        lonDeg = ((gridCount * 12.0) % 360) - 180;
      } else {
        // Meridians at 0°, 30°, 60°, 90°, 120°, 150°, 180°, etc.
        const mIndex = gridRing - 5;
        const mLongitudes = [0, 60, 120, 180, -120, -60, 30];
        lonDeg = mLongitudes[mIndex % mLongitudes.length];
        latDeg = -80 + ((gridCount * 4.2) % 160);
      }
      phi = ((90 - latDeg) * Math.PI) / 180;
      feat = 9; // grid_line
      gridCount++;
    } else if (cityCount < targetCityCount) {
      // 3. GLOBAL TECH HUB BEACONS
      const hub = GLOBAL_TECH_HUBS[cityCount % GLOBAL_TECH_HUBS.length];
      const jitterDist = ((cityCount * 13) % 7) * 0.12;
      const jitterAngle = cityCount * 2.39996;
      latDeg = hub.lat + Math.sin(jitterAngle) * jitterDist;
      lonDeg = hub.lon + Math.cos(jitterAngle) * jitterDist;
      phi = ((90 - latDeg) * Math.PI) / 180;
      feat = 10; // city_beacon
      isLand = true;
      cityCount++;
    } else if (arcCount < targetArcCount) {
      // 4. TRANSCONTINENTAL GREAT-CIRCLE 3D DATA ARCS
      const route = TRANSCONTINENTAL_ROUTES[arcCount % TRANSCONTINENTAL_ROUTES.length];
      const hubA = GLOBAL_TECH_HUBS[route.from];
      const hubB = GLOBAL_TECH_HUBS[route.to];

      const latA = (hubA.lat * Math.PI) / 180;
      const lonA = (hubA.lon * Math.PI) / 180;
      const ax = Math.cos(latA) * Math.cos(lonA);
      const ay = Math.sin(latA);
      const az = Math.cos(latA) * Math.sin(lonA);

      const latB = (hubB.lat * Math.PI) / 180;
      const lonB = (hubB.lon * Math.PI) / 180;
      const bx = Math.cos(latB) * Math.cos(lonB);
      const by = Math.sin(latB);
      const bz = Math.cos(latB) * Math.sin(lonB);

      const dot = Math.max(-0.999, Math.min(0.999, ax * bx + ay * by + az * bz));
      const omega = Math.acos(dot);
      const sinOmega = Math.sin(omega);

      const progress = 0.05 + 0.90 * (((arcCount * 7) % 32) / 31);
      const c1 = Math.sin((1 - progress) * omega) / sinOmega;
      const c2 = Math.sin(progress * omega) / sinOmega;

      const px = c1 * ax + c2 * bx;
      const py = c1 * ay + c2 * by;
      const pz = c1 * az + c2 * bz;
      const pLen = Math.hypot(px, py, pz) || 1;

      const nx = px / pLen;
      const ny = py / pLen;
      const nz = pz / pLen;

      latDeg = Math.asin(Math.max(-1, Math.min(1, ny))) * (180 / Math.PI);
      lonDeg = Math.atan2(nz, nx) * (180 / Math.PI);
      phi = ((90 - latDeg) * Math.PI) / 180;

      feat = 11; // flight_arc
      arcCount++;
    } else if (cloudCount < targetCloudCount) {
      // 5. ATMOSPHERIC CLOUD FRONTS
      phi = Math.acos(1 - 2 * ((cloudCount + 0.5) / Math.max(1, targetCloudCount)));
      const rawTheta = 2 * Math.PI * cloudCount * goldenRatio * 1.33;
      latDeg = 90 - (phi * 180) / Math.PI;
      lonDeg = ((rawTheta * 180) / Math.PI) % 360;
      if (lonDeg > 180) lonDeg -= 360;
      if (lonDeg < -180) lonDeg += 360;
      feat = 7; // cloud
      cloudCount++;
    } else {
      // 6. POLAR AURORAS
      const polarLat = (auroraCount % 2 === 0 ? 1 : -1) * (68 + (auroraCount % 5) * 3);
      latDeg = polarLat;
      phi = ((90 - latDeg) * Math.PI) / 180;
      lonDeg = ((auroraCount * 28.5) % 360) - 180;
      feat = 8; // aurora
      auroraCount++;
    }

    cosLat[i] = Math.sin(phi);
    sinLat[i] = Math.cos(phi);
    lonRad[i] = (lonDeg * Math.PI) / 180;
    isLandArr[i] = isLand ? 1 : 0;

    if (feat === 11) {
      // Flight Arcs
      featureType[i] = 11;
      const t = 0.05 + 0.90 * (((i * 7) % 32) / 31);
      radiusOffset[i] = Math.sin(t * Math.PI) * 0.045;
      sizeMult[i] = 1.20;
      baseColorR[i] = 0.25;
      baseColorG[i] = 0.95;
      baseColorB[i] = 1.35; // Luminous electric cyan arc
    } else if (feat === 10) {
      // City Beacons
      featureType[i] = 10;
      const hub = GLOBAL_TECH_HUBS[(cityCount - 1) % GLOBAL_TECH_HUBS.length];
      radiusOffset[i] = 0.012;
      sizeMult[i] = 1.50;
      baseColorR[i] = hub.r * 1.35;
      baseColorG[i] = hub.g * 1.35;
      baseColorB[i] = hub.b * 1.35;
    } else if (feat === 9) {
      // Coordinate Grid Lines
      featureType[i] = 9;
      radiusOffset[i] = 0.004;
      sizeMult[i] = 0.90;
      baseColorR[i] = 0.18;
      baseColorG[i] = 0.70;
      baseColorB[i] = 1.05; // Radiant azure coordinate dots
    } else if (feat === 8) {
      // Polar Aurora ribbons
      featureType[i] = 8;
      radiusOffset[i] = 0.05 + (i % 3) * 0.015;
      sizeMult[i] = 1.25;
      if (i % 2 === 0) {
        baseColorR[i] = 0.15;
        baseColorG[i] = 1.35;
        baseColorB[i] = 0.80; // Radiant emerald aurora
      } else {
        baseColorR[i] = 1.05;
        baseColorG[i] = 0.45;
        baseColorB[i] = 1.30; // Electric violet aurora
      }
    } else if (feat === 7) {
      // Atmospheric weather cloud fronts
      featureType[i] = 7;
      radiusOffset[i] = 0.035;
      sizeMult[i] = 1.10;
      const shade = 1.15 + ((i * 7) % 4) * 0.02;
      baseColorR[i] = shade;
      baseColorG[i] = shade;
      baseColorB[i] = 1.25; // Clean pearl white/silver
    } else if (isLand) {
      // Real Continental Terrains with Vivid Authentic Earth Topography Palette
      if (Math.abs(latDeg) > 60) {
        // Polar Ice Caps (Antarctica, Greenland, Arctic glaciers)
        featureType[i] = 6; // ice
        radiusOffset[i] = 0.008;
        sizeMult[i] = 1.12;
        baseColorR[i] = 1.20;
        baseColorG[i] = 1.22;
        baseColorB[i] = 1.35; // Brilliant glacier cyan-white
      } else if (
        (latDeg >= 26 && latDeg <= 36 && lonDeg >= 75 && lonDeg <= 96) || // Himalayas
        (latDeg >= -50 && latDeg <= 10 && lonDeg >= -76 && lonDeg <= -68) || // Andes
        (latDeg >= 34 && latDeg <= 55 && lonDeg >= -124 && lonDeg <= -105) || // Rockies
        (latDeg >= 44 && latDeg <= 48 && lonDeg >= 5 && lonDeg <= 16) // Alps
      ) {
        // Alpine Mountain Spines with Snowcaps
        featureType[i] = 3; // mountain
        radiusOffset[i] = 0.018;
        sizeMult[i] = 1.15;
        baseColorR[i] = 1.12;
        baseColorG[i] = 1.15;
        baseColorB[i] = 1.25; // Snowcapped granite
      } else if (
        (latDeg >= 14 && latDeg <= 35 && lonDeg >= -17 && lonDeg <= 60) || // Sahara & Arabia
        (latDeg >= -35 && latDeg <= -18 && lonDeg >= 115 && lonDeg <= 142) || // Australian Outback
        (latDeg >= 36 && latDeg <= 48 && lonDeg >= 78 && lonDeg <= 110) || // Gobi
        (latDeg >= -28 && latDeg <= -19 && lonDeg >= 18 && lonDeg <= 26) // Kalahari
      ) {
        // Arid Deserts (Golden dunes & terracotta)
        featureType[i] = 4; // desert
        radiusOffset[i] = 0.004;
        sizeMult[i] = 1.08;
        const duneNoise = ((i * 17) % 5) * 0.02;
        baseColorR[i] = 1.15;
        baseColorG[i] = 0.90 + duneNoise;
        baseColorB[i] = 0.35; // Golden amber
      } else if (
        (latDeg >= -15 && latDeg <= 10 && lonDeg >= -80 && lonDeg <= -45) || // Amazon Basin
        (latDeg >= -5 && latDeg <= 8 && lonDeg >= 10 && lonDeg <= 32) || // Congo Basin
        (latDeg >= -8 && latDeg <= 18 && lonDeg >= 98 && lonDeg <= 145) // SE Asia & Indonesia
      ) {
        // Tropical Rainforests (Lush deep emerald & radiant jade)
        featureType[i] = 5; // rainforest
        radiusOffset[i] = 0.007;
        sizeMult[i] = 1.10;
        const canopy = ((i * 11) % 5) * 0.02;
        baseColorR[i] = 0.15;
        baseColorG[i] = 1.18 + canopy;
        baseColorB[i] = 0.50; // Tropical emerald
      } else {
        // Temperate Plains & Forests (North America, Europe, East Asia)
        featureType[i] = 2; // land
        radiusOffset[i] = 0.003;
        sizeMult[i] = 1.05;
        const flora = ((i * 19) % 5) * 0.02;
        baseColorR[i] = 0.24;
        baseColorG[i] = 1.05 + flora;
        baseColorB[i] = 0.46; // Fertile flora green
      }
    } else {
      // Oceanic Waters: complete digital planetary dot lattice
      const isCoastalShelf = i % 4 === 0;
      if (isCoastalShelf) {
        // Coastal barrier reefs & turquoise shelves
        featureType[i] = 1; // coast
        radiusOffset[i] = -0.004;
        sizeMult[i] = 1.04;
        baseColorR[i] = 0.10;
        baseColorG[i] = 1.08;
        baseColorB[i] = 1.25; // Luminous turquoise shelf
      } else {
        // Deep open oceans (Pacific, Atlantic, Indian, Southern) - Glowing azure/sapphire dot matrix
        featureType[i] = 0; // ocean
        radiusOffset[i] = -0.008;
        sizeMult[i] = 0.95;
        const depthNoise = ((i * 23) % 4) * 0.02;
        baseColorR[i] = 0.08;
        baseColorG[i] = 0.48 + depthNoise;
        baseColorB[i] = 0.98; // Vibrant sapphire/azure dot
      }
    }
  }

  return {
    cosLat,
    sinLat,
    lonRad,
    radiusOffset,
    baseColorR,
    baseColorG,
    baseColorB,
    sizeMult,
    featureType,
    isLand: isLandArr,
  };
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
    sizeMult = 1.30;
    if (i % 2 === 0) {
      col.setRGB(0.20, 1.25, 0.78); // Hyper-radiant emerald aurora shine
    } else {
      col.setRGB(1.05, 0.45, 1.25); // Electric violet-magenta aurora shine
    }
  } else if (isAtmosphereCandidate) {
    // Swirling white clouds and storm systems floating just above surface
    featureType = 'cloud';
    sphereRadius = 5.50 + ((i * 11) % 5) * 0.02;
    sizeMult = 1.20;
    const cloudShade = 1.15 + ((i * 7) % 5) * 0.03;
    col.setRGB(cloudShade, cloudShade, 1.25);
  } else if (isLand) {
    // Landmass classifications based on latitude and regional geography
    if (Math.abs(latDeg) > 60) {
      // Polar Ice Caps (Antarctica, Greenland, Arctic)
      featureType = 'ice';
      sphereRadius = 5.34;
      sizeMult = 1.15;
      col.setRGB(1.20, 1.22, 1.28); // Crystalline glistening glacier white
    } else if (
      (latDeg >= 14 && latDeg <= 35 && lonDeg >= -17 && lonDeg <= 60) || // Sahara & Arabia
      (latDeg >= -35 && latDeg <= -18 && lonDeg >= 115 && lonDeg <= 142) || // Australian Outback
      (latDeg >= 36 && latDeg <= 48 && lonDeg >= 78 && lonDeg <= 110) // Gobi
    ) {
      // Arid Deserts (Golden sands, amber dunes, terracotta)
      featureType = 'desert';
      sphereRadius = 5.32;
      sizeMult = 1.10;
      const duneNoise = ((i * 17) % 5) * 0.03;
      col.setRGB(1.15, 0.90 + duneNoise, 0.28); // Radiant gleaming golden amber
    } else if (
      (latDeg >= -15 && latDeg <= 10 && lonDeg >= -80 && lonDeg <= -45) || // Amazon Basin
      (latDeg >= -5 && latDeg <= 8 && lonDeg >= 10 && lonDeg <= 32) || // Congo Basin
      (latDeg >= -8 && latDeg <= 18 && lonDeg >= 98 && lonDeg <= 145) // SE Asia & Indonesia
    ) {
      // Tropical Rainforests (Lush deep emerald & radiant jade)
      featureType = 'rainforest';
      sphereRadius = 5.33;
      sizeMult = 1.12;
      const canopy = ((i * 11) % 5) * 0.03;
      col.setRGB(0.08, 1.12 + canopy, 0.48); // Radiant glowing tropical emerald
    } else if (
      (latDeg >= 26 && latDeg <= 36 && lonDeg >= 75 && lonDeg <= 96) || // Himalayas
      (latDeg >= -50 && latDeg <= 10 && lonDeg >= -76 && lonDeg <= -68) || // Andes
      (latDeg >= 34 && latDeg <= 55 && lonDeg >= -124 && lonDeg <= -105) // Rockies
    ) {
      // Mountain Spines with Snowcaps
      featureType = 'mountain';
      sphereRadius = 5.42; // Elevated peak spine
      sizeMult = 1.20;
      col.setRGB(1.12, 1.15, 1.25); // Brilliant alpine snow-capped peak shine
    } else {
      // Temperate Plains & Forests (North America, Europe, East Asia)
      featureType = 'land';
      sphereRadius = 5.31;
      sizeMult = 1.05;
      const flora = ((i * 19) % 5) * 0.03;
      col.setRGB(0.18, 1.02 + flora, 0.42); // Fresh glistening vegetation green
    }
  } else {
    // Oceanic waters: coastal shelves vs deep open oceans
    const isCoastalShelf = (i % 3 === 0);

    if (isCoastalShelf) {
      // Coastal shallow waters, coral barrier reefs, Caribbean turquoise
      featureType = 'coast';
      sphereRadius = 5.28;
      sizeMult = 1.10;
      col.setRGB(0.06, 1.08, 1.15); // Electric glowing cyan-turquoise shine
    } else {
      // Deep open oceans (Pacific, Atlantic, Indian, Southern)
      featureType = 'ocean';
      sphereRadius = 5.25;
      sizeMult = 1.0;
      const oceanDepth = ((i * 23) % 4) * 0.03;
      col.setRGB(0.08, 0.55 + oceanDepth, 1.18); // Luminous sparkling sapphire blue
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
