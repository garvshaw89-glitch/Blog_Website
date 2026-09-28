import * as THREE from 'three';
import { pseudoNoise3D } from './matterFormGeometry';

export interface RocketFormationPoint {
  position: THREE.Vector3;
  type: 'nose' | 'body' | 'fin' | 'engine' | 'booster';
}

/**
 * Procedural Sleek Futuristic Exploration Rocket Geometry:
 * - Pointed streamlined nose
 * - Compact cylindrical core body
 * - Two aerodynamic side fins
 * - High-velocity particle exhaust / nozzle ring
 * Center positioned at (0, yOffset, zOffset).
 */
export function generateRocketPosition(
  i: number,
  total: number,
  rocketY: number = 0,
  vibration: number = 0
): { pos: THREE.Vector3; isEngine: boolean } {
  // Normalize ratio across particles
  const u = i / total;

  let x = 0;
  let y = 0;
  let z = -2.0;
  let isEngine = false;

  const vibX = (Math.random() - 0.5) * vibration;
  const vibY = (Math.random() - 0.5) * vibration;

  if (u < 0.18) {
    // 1. Pointed Nose Cone (Top height: 5.5 to 3.2)
    const t = u / 0.18; // 0 (tip) to 1 (base of nose)
    const angle = i * 2.39996; // Golden angle
    const r = t * 1.15; // Cone expands
    y = 5.5 - t * 2.3;
    x = Math.cos(angle) * r;
    z = -2.0 + Math.sin(angle) * r * 0.8;
  } else if (u < 0.65) {
    // 2. Compact Sleek Fuselage / Body (Height: 3.2 to -2.8)
    const t = (u - 0.18) / (0.65 - 0.18);
    const angle = i * 2.39996;
    // Slight aerodynamic tapering at waist
    const r = 1.15 + Math.sin(t * Math.PI) * 0.15;
    y = 3.2 - t * 6.0;
    x = Math.cos(angle) * r;
    z = -2.0 + Math.sin(angle) * r * 0.8;
  } else if (u < 0.85) {
    // 3. Two Subtle Aerodynamic Side Fins (-1.5 to -3.8)
    const t = (u - 0.65) / (0.85 - 0.65);
    const side = (i % 2 === 0) ? 1 : -1;
    const finHeight = -1.5 - (t * 2.3);
    const finSpan = 1.1 + Math.sin(t * Math.PI * 0.5) * 2.2;
    x = side * finSpan;
    y = finHeight;
    z = -2.0 + (Math.random() - 0.5) * 0.3;
  } else {
    // 4. Engine Section & Nozzle Ring (-2.8 to -4.5)
    isEngine = true;
    const t = (u - 0.85) / 0.15;
    const angle = i * 2.39996;
    const r = 0.9 - t * 0.35;
    y = -2.8 - t * 1.6;
    x = Math.cos(angle) * r;
    z = -2.0 + Math.sin(angle) * r * 0.8;
  }

  // Add micro-noise and engine vibration
  const noise = pseudoNoise3D(x * 2.0, y * 2.0, u * 10.0) * 0.08;

  return {
    pos: new THREE.Vector3(x + vibX + noise, y + rocketY + vibY, z),
    isEngine,
  };
}

/**
 * Downward Engine Particle Stream for Ignition & Launch Exhaust
 */
export function generateExhaustParticle(
  rocketY: number,
  intensity: number
): { pos: THREE.Vector3; vel: THREE.Vector3 } {
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.random() * 0.85;
  const posX = Math.cos(angle) * radius;
  const posY = rocketY - 4.2 - Math.random() * 0.6;
  const posZ = -2.0 + (Math.random() - 0.5) * 0.6;

  const velX = (Math.random() - 0.5) * 0.45;
  const velY = -1.8 * intensity - Math.random() * 1.2 * intensity;
  const velZ = (Math.random() - 0.5) * 0.3;

  return {
    pos: new THREE.Vector3(posX, posY, posZ),
    vel: new THREE.Vector3(velX, velY, velZ),
  };
}
