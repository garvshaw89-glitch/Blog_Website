import * as THREE from 'three';

export type CinematicFlightState =
  | 'IDLE'
  | 'INTRO'
  | 'IGNITION'
  | 'LAUNCH'
  | 'ASCENT'
  | 'FLIGHT'
  | 'FLYBY'
  | 'CRUISE'
  | 'DESCENT'
  | 'LANDING'
  | 'IMPACT'
  | 'REST';

export interface FlightProgressSnapshot {
  progress: number; // 0.0 to 1.0
  state: CinematicFlightState;
  stateProgress: number; // 0.0 to 1.0 within current state
  rocketPos: THREE.Vector3;
  rocketRot: THREE.Euler;
  rocketScale: number;
  engineThrust: number; // 0.0 to 1.0
  engineFlameLength: number;
  cameraPos: THREE.Vector3;
  cameraLookAt: THREE.Vector3;
  cameraFov: number;
  screenShake: number;
  warpSpeed: number; // 0.0 to 1.0
  timeScale: number; // For cinematic time slowdown
  landingImpact: number; // 0.0 to 1.0
}

export interface ProjectedRocketTelemetry {
  screenX: number;
  screenY: number;
  noseX: number;
  noseY: number;
  engineX: number;
  engineY: number;
  visible: boolean;
  opacity: number;
  altitudeMeters: number;
  altitudeFormatted: string;
  velocityMach: number;
  velocityFormatted: string;
  velocityMs: number;
  thrustPercent: number;
  accelerationG: number;
  dynamicPressureKPa: number;
  state: CinematicFlightState;
  stateProgress: number;
  phaseLabel: string;
  headingDeg: number;
  pitchDeg: number;
  missionTimeSec: number;
}
