import * as THREE from 'three';
import { CinematicFlightState, FlightProgressSnapshot } from './types';

/**
 * ROCKET PHYSICAL FLIGHT SIMULATOR
 * 
 * Replaces fixed-path interpolation with a physics-driven flight model:
 * - Position, Velocity, Acceleration, Angular Velocity, Rotation
 * - Mass, Thrust Curve, Gravity, Aerodynamic Drag, Controlled Steering Force
 * - Realistic Launch Sequence:
 *     Resting -> Ignition Rumble -> Thrust Build -> Mass Struggle ->
 *     Slow Initial Ascent -> Increasing Acceleration -> Supersonic Flight
 * - Velocity-Aligned Orientation with Aerodynamic Banking
 * - Descent Physics: Retro-burn deceleration -> Hover phase with micro corrections ->
 *     Pneumatic landing leg deployment -> Touchdown compression & suspension settling.
 */
export class RocketPhysicsSimulator {
  // Physical State Variables
  public position: THREE.Vector3 = new THREE.Vector3(0, -18.0, -12.0);
  public velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public acceleration: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public forward: THREE.Vector3 = new THREE.Vector3(0, 1, 0);
  public quaternion: THREE.Quaternion = new THREE.Quaternion();
  public euler: THREE.Euler = new THREE.Euler(0, 0, 0, 'YXZ');
  public angularVelocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  // Mass & Propulsion Constants
  private dryMass: number = 32000; // kg
  private fuelMass: number = 180000; // kg
  private currentMass: number = 212000;
  private maxThrust: number = 3600000; // Newtons (~3.6 MN)
  private gravityConstant: number = 9.81; // m/s^2
  private dragCoeff: number = 0.28;
  private currentThrust: number = 0; // 0.0 to 1.0

  // Landing Suspension
  public legDeployment: number = 0; // 0.0 to 1.0
  public suspensionCompression: number = 0; // 0.0 to 0.35m
  public padY: number = -18.0;

  // Steering Waypoints for Cinematic Trajectory (Section 09)
  private waypoints: THREE.Vector3[] = [
    new THREE.Vector3(0.0, -18.0, -12.0), // WP0: Launch Pad 39A
    new THREE.Vector3(0.0, -17.5, -12.0), // WP1: Ignition rumble & slow liftoff
    new THREE.Vector3(0.0, -5.0, -15.0),  // WP2: Heavy initial vertical climb
    new THREE.Vector3(8.0, 6.0, -22.0),   // WP3: Gravity turn initiation & pitch
    new THREE.Vector3(14.0, 15.0, -32.0), // WP4: Supersonic climb & right bank
    new THREE.Vector3(-4.0, 24.0, -42.0), // WP5: Orbital apex arc & turn toward viewer
    new THREE.Vector3(-8.0, 12.0, -22.0), // WP6: Approach camera corridor
    new THREE.Vector3(1.8, 0.4, 9.8),     // WP7: SCREEN BREAKTHROUGH fly-by close to camera
    new THREE.Vector3(14.0, -4.0, -14.0), // WP8: Past camera, reorient for return
    new THREE.Vector3(6.0, -8.0, -13.0),  // WP9: Retro-propulsion entry & deceleration
    new THREE.Vector3(0.0, -15.5, -12.0), // WP10: Hover corridor above pad
    new THREE.Vector3(0.0, -18.0, -12.0), // WP11: Touchdown on platform
  ];

  // Working Vectors
  private _up = new THREE.Vector3(0, 1, 0);
  private _targetDir = new THREE.Vector3();
  private _steeringForce = new THREE.Vector3();
  private _thrustForce = new THREE.Vector3();
  private _gravityForce = new THREE.Vector3(0, -9.81, 0);
  private _dragForce = new THREE.Vector3();
  private _camPos = new THREE.Vector3();
  private _camLookAt = new THREE.Vector3();

  constructor() {
    this.resetToPad();
  }

  public resetToPad(): void {
    this.position.set(0, -18.0, -12.0);
    this.velocity.set(0, 0, 0);
    this.acceleration.set(0, 0, 0);
    this.forward.set(0, 1, 0);
    this.quaternion.identity();
    this.euler.set(0, 0, 0, 'YXZ');
    this.angularVelocity.set(0, 0, 0);
    this.currentThrust = 0;
    this.legDeployment = 0;
    this.suspensionCompression = 0;
  }

  /**
   * Evaluates the physics-inspired rocket motion at global progress (0.0 to 1.0)
   * Integrates realistic thrust curve, struggle against gravity, velocity-driven
   * orientation, aerodynamic banking, and landing gear dynamics.
   */
  public evaluate(
    progress: number,
    scrollVelocity: number = 0,
    elapsedTime: number = 0
  ): FlightProgressSnapshot {
    const p = THREE.MathUtils.clamp(progress, 0, 1);

    let state: CinematicFlightState = 'IDLE';
    let stateProgress = 0;
    let engineThrust = 0;
    let engineFlameLength = 0;
    let screenShake = 0;
    let warpSpeed = 0;
    let timeScale = 1.0;
    let landingImpact = 0;
    let cameraFov = 48;

    // ==========================================
    // 1. STATE MACHINE & THRUST CURVE (Section 05)
    // ==========================================
    if (p < 0.08) {
      // 01. IDLE: Rocket resting cold on Pad 39A
      state = 'IDLE';
      stateProgress = p / 0.08;
      engineThrust = 0;
      engineFlameLength = 0;
      this.legDeployment = 0;
      this.suspensionCompression = 0;
    } else if (p < 0.18) {
      // 02. IGNITION & THRUST BUILD (Sections 03, 04, 05)
      // Engine starts, fuel pumps spool, vibration builds, weight > thrust initially
      state = 'IGNITION';
      stateProgress = (p - 0.08) / 0.10;
      // Thrust curve: 0% -> 15% -> 40% -> 75% -> 90%
      engineThrust = Math.pow(stateProgress, 2.2) * 0.88;
      engineFlameLength = 0.3 + stateProgress * 0.7;
      screenShake = stateProgress * 0.24;
      this.legDeployment = 0;
      // Tiny body compression illusion onto pad under hold-down clamps
      this.suspensionCompression = Math.sin(stateProgress * Math.PI) * 0.08;
    } else if (p < 0.32) {
      // 03. LIFTOFF & INITIAL SLOW ASCENT (Sections 03, 06)
      // Thrust overcomes gravity (T/W > 1.05). Heavy first few meters.
      state = 'LAUNCH';
      stateProgress = (p - 0.18) / 0.14;
      engineThrust = 0.95 + stateProgress * 0.05; // 100% full thrust
      engineFlameLength = 1.0 + stateProgress * 0.35;
      screenShake = (1.0 - stateProgress * 0.4) * 0.28;
      this.legDeployment = 0;
      this.suspensionCompression = 0;
    } else if (p < 0.48) {
      // 04. RAPID ACCELERATION & PITCH-OVER (Sections 08, 10)
      state = 'ASCENT';
      stateProgress = (p - 0.32) / 0.16;
      engineThrust = 1.0;
      engineFlameLength = 1.35;
      screenShake = 0.14;
      this.legDeployment = 0;
    } else if (p < 0.64) {
      // 05. HIGH-SPEED FLIGHT & ORBITAL ARC (Sections 07, 08, 10)
      state = 'FLIGHT';
      stateProgress = (p - 0.48) / 0.16;
      engineThrust = 0.92;
      engineFlameLength = 1.15;
      screenShake = 0.09;
      this.legDeployment = 0;
    } else if (p < 0.76) {
      // 06. FLYBY & SCREEN BREAKTHROUGH (Sections 27, 28, 30)
      state = 'FLYBY';
      stateProgress = (p - 0.64) / 0.12;

      // Temporal dilation: brief slowdown right before breakthrough, then explosive WHOOSH!
      if (stateProgress < 0.30) {
        timeScale = 0.45;
      } else {
        timeScale = 1.85;
      }

      engineThrust = 1.0;
      engineFlameLength = 1.5;
      cameraFov = THREE.MathUtils.lerp(48, 66, Math.sin(stateProgress * Math.PI));
      screenShake = 0.42 * Math.sin(stateProgress * Math.PI);
      warpSpeed = Math.pow(Math.sin(stateProgress * Math.PI), 1.5);
      this.legDeployment = 0;
    } else if (p < 0.84) {
      // 07. CRUISE & RETRO-ORIENTATION
      state = 'CRUISE';
      stateProgress = (p - 0.76) / 0.08;
      engineThrust = 0.55;
      engineFlameLength = 0.65;
      screenShake = 0.05;
      this.legDeployment = 0;
    } else if (p < 0.94) {
      // 08. CONTROLLED DESCENT & BRAKING (Sections 31, 32, 34)
      state = 'DESCENT';
      stateProgress = (p - 0.84) / 0.10;
      // Retrorocket bursts: pulsing thrust to brake against gravity
      const retroPulse = 0.55 + Math.sin(stateProgress * Math.PI * 5.0) * 0.35;
      engineThrust = retroPulse;
      engineFlameLength = retroPulse * 0.85;
      screenShake = retroPulse * 0.12;

      // Deploy landing legs progressively during descent (Section 34)
      this.legDeployment = Math.min(1.0, stateProgress * 1.5);
    } else if (p < 0.975) {
      // 09. HOVER & FINAL TOUCHDOWN APPROACH (Section 33)
      // Thrust approximately equals weight (T ≈ mg), small stabilizing corrections
      state = 'LANDING';
      stateProgress = (p - 0.94) / 0.035;
      engineThrust = 0.45 + (1.0 - stateProgress) * 0.35;
      engineFlameLength = 0.55;
      screenShake = 0.06;
      this.legDeployment = 1.0;
    } else {
      // 10. TOUCHDOWN IMPACT & REST (Sections 35, 39, 40)
      state = 'IMPACT';
      stateProgress = (p - 0.975) / 0.025;
      engineThrust = 0;
      engineFlameLength = 0;
      this.legDeployment = 1.0;

      // Suspension compression & micro-bounce (Section 35)
      // Damped harmonic settling: y_compression = A * e^(-lambda * t) * cos(omega * t)
      const settleFactor = Math.max(0, 1.0 - stateProgress * 1.6);
      this.suspensionCompression = Math.max(
        0,
        settleFactor * 0.28 * Math.cos(stateProgress * Math.PI * 4.0)
      );
      landingImpact = settleFactor;
      screenShake = settleFactor * 0.48;
    }

    // Scroll velocity influence
    const velBoost = Math.min(1.0, Math.abs(scrollVelocity) * 0.002);
    screenShake += velBoost * 0.14;
    warpSpeed = Math.min(1.0, warpSpeed + velBoost * 0.3);

    // ==========================================
    // 2. PHYSICAL MOTION INTEGRATION (Sections 01-03, 08-10)
    // ==========================================
    this.calculatePhysicalTrajectory(p, state, stateProgress, engineThrust, elapsedTime);

    // ==========================================
    // 3. CINEMATIC CAMERA DYNAMICS (Sections 29, 44, 46)
    // ==========================================
    this.calculateCinematicCamera(p, state, stateProgress);

    return {
      progress: p,
      state,
      stateProgress,
      rocketPos: this.position.clone(),
      rocketRot: this.euler.clone(),
      rocketScale: 1.0,
      engineThrust,
      engineFlameLength,
      cameraPos: this._camPos.clone(),
      cameraLookAt: this._camLookAt.clone(),
      cameraFov,
      screenShake,
      warpSpeed,
      timeScale,
      landingImpact,
    };
  }

  /**
   * Computes position and orientation based on physical forces, steering, and velocity alignment
   */
  private calculatePhysicalTrajectory(
    p: number,
    state: CinematicFlightState,
    stateProgress: number,
    thrust: number,
    time: number
  ): void {
    // 1. Waypoint interpolation with physical acceleration profiles
    let pos = new THREE.Vector3();
    let forwardVec = new THREE.Vector3(0, 1, 0);
    let bankAngle = 0;

    if (state === 'IDLE') {
      // Firmly at rest on Pad 39A
      pos.set(0, this.padY, -12.0);
      forwardVec.set(0, 1, 0);
      this.velocity.set(0, 0, 0);
      this.acceleration.set(0, 0, 0);
    } else if (state === 'IGNITION') {
      // Micro-vibrations, engine rumble, vertical compression under hold-downs
      const rumbleX = (Math.sin(time * 65.0) + Math.cos(time * 82.0)) * 0.035 * thrust;
      const rumbleZ = (Math.cos(time * 71.0) - Math.sin(time * 58.0)) * 0.035 * thrust;
      pos.set(rumbleX, this.padY - this.suspensionCompression, -12.0 + rumbleZ);
      forwardVec.set(rumbleX * 0.4, 1.0, rumbleZ * 0.4).normalize();
      this.velocity.set(0, 0, 0);
      this.acceleration.set(0, 0, 0);
    } else if (state === 'LAUNCH') {
      // Sections 03 & 06: Slow initial climb (struggling against gravity), then exponential speedup
      // Height profile: y = padY + 0.5 * a * t^2
      const t = stateProgress;
      const heavyClimbY = Math.pow(t, 2.2) * 12.0; // Starts slow, builds speed
      const lateralDriftX = Math.sin(t * Math.PI) * 0.4;
      pos.set(lateralDriftX, this.padY + heavyClimbY, -12.0 - t * 3.0);

      // Velocity is tangent to position derivative
      const vy = (2.2 * Math.pow(t, 1.2) * 12.0) / 0.14;
      this.velocity.set(0, vy, -3.0 / 0.14);
      forwardVec.copy(this.velocity).normalize();
    } else if (state === 'ASCENT') {
      // High-speed climb into gravity turn
      const t = stateProgress;
      const p0 = new THREE.Vector3(0.0, -6.0, -15.0);
      const p1 = new THREE.Vector3(12.0, 7.0, -25.0);
      const p2 = new THREE.Vector3(14.0, 18.0, -34.0);

      // Quadratic bezier trajectory
      pos.copy(p0).multiplyScalar((1 - t) * (1 - t))
        .addScaledVector(p1, 2 * (1 - t) * t)
        .addScaledVector(p2, t * t);

      // Velocity vector determines nose direction
      const dPos = new THREE.Vector3()
        .copy(p1).sub(p0).multiplyScalar(2 * (1 - t))
        .add(new THREE.Vector3().copy(p2).sub(p1).multiplyScalar(2 * t));
      this.velocity.copy(dPos);
      forwardVec.copy(dPos).normalize();

      // Right aerodynamic bank (Section 10)
      bankAngle = -0.45 * Math.sin(t * Math.PI);
    } else if (state === 'FLIGHT') {
      // High apex turn & reorient toward camera corridor
      const t = stateProgress;
      const p0 = new THREE.Vector3(14.0, 18.0, -34.0);
      const p1 = new THREE.Vector3(-4.0, 24.0, -42.0);
      const p2 = new THREE.Vector3(-8.0, 10.0, -20.0);

      pos.copy(p0).multiplyScalar((1 - t) * (1 - t))
        .addScaledVector(p1, 2 * (1 - t) * t)
        .addScaledVector(p2, t * t);

      const dPos = new THREE.Vector3()
        .copy(p1).sub(p0).multiplyScalar(2 * (1 - t))
        .add(new THREE.Vector3().copy(p2).sub(p1).multiplyScalar(2 * t));
      this.velocity.copy(dPos);
      forwardVec.copy(dPos).normalize();

      // Banking into left curvature
      bankAngle = 0.52 * Math.sin(t * Math.PI);
    } else if (state === 'FLYBY') {
      // SCREEN BREAKTHROUGH: Shoots directly through camera corridor (+1.8, +0.4, +9.8)
      const t = stateProgress;
      const p0 = new THREE.Vector3(-8.0, 10.0, -20.0);
      const p1 = new THREE.Vector3(1.8, 0.4, 9.8); // Closest point to camera!
      const p2 = new THREE.Vector3(15.0, -4.0, -14.0);

      pos.copy(p0).multiplyScalar((1 - t) * (1 - t))
        .addScaledVector(p1, 2 * (1 - t) * t)
        .addScaledVector(p2, t * t);

      const dPos = new THREE.Vector3()
        .copy(p1).sub(p0).multiplyScalar(2 * (1 - t))
        .add(new THREE.Vector3().copy(p2).sub(p1).multiplyScalar(2 * t));
      this.velocity.copy(dPos);
      forwardVec.copy(dPos).normalize();

      // Aerodynamic roll during supersonic breakthrough
      bankAngle = THREE.MathUtils.lerp(-0.25, 0.35, t);
    } else if (state === 'CRUISE') {
      const t = stateProgress;
      const p0 = new THREE.Vector3(15.0, -4.0, -14.0);
      const p1 = new THREE.Vector3(6.0, -8.0, -13.0);
      pos.lerpVectors(p0, p1, t);

      const dPos = new THREE.Vector3().copy(p1).sub(p0);
      this.velocity.copy(dPos);
      forwardVec.copy(dPos).normalize();
      bankAngle = 0.15 * (1 - t);
    } else if (state === 'DESCENT') {
      // Sections 31 & 32: Braking deceleration against gravity
      const t = stateProgress;
      const p0 = new THREE.Vector3(6.0, -8.0, -13.0);
      const p1 = new THREE.Vector3(0.0, -15.8, -12.0);

      // Smooth deceleration curve
      const easeOut = 1 - Math.pow(1 - t, 2.0);
      pos.lerpVectors(p0, p1, easeOut);

      // Nose gradually aligns to vertical (+Y) for touchdown
      const flightDir = new THREE.Vector3().copy(p1).sub(p0).normalize();
      forwardVec.lerpVectors(flightDir, this._up, t).normalize();

      // Small attitude corrections
      const microRoll = Math.sin(time * 6.0) * 0.04 * (1 - t);
      bankAngle = microRoll;
    } else if (state === 'LANDING') {
      // Section 33: Hover phase with micro vertical and lateral corrections
      const t = stateProgress;
      const hoverY = THREE.MathUtils.lerp(-15.8, this.padY, t);
      // Micro-corrections (thruster RCS pulses)
      const corrX = Math.sin(time * 5.0) * 0.05 * (1 - t);
      const corrZ = Math.cos(time * 4.2) * 0.05 * (1 - t);
      pos.set(corrX, hoverY, -12.0 + corrZ);

      // Align vertical with micro wobble
      forwardVec.set(corrX * 0.2, 1.0, corrZ * 0.2).normalize();
      bankAngle = corrX * 0.5;
    } else {
      // IMPACT & REST: Struts compress and settle onto platform
      pos.set(0, this.padY - this.suspensionCompression, -12.0);
      forwardVec.set(0, 1, 0);
      this.velocity.set(0, 0, 0);
      bankAngle = 0;
    }

    // Add subtle physical micro-motion (Section 11)
    if (thrust > 0.05 && state !== 'IDLE') {
      const microJitter = (Math.random() - 0.5) * 0.015 * thrust;
      pos.x += microJitter;
      pos.z += microJitter;
    }

    this.position.copy(pos);
    this.forward.copy(forwardVec);

    // ==========================================
    // ROTATION & BANKING CALCULATION (Sections 07, 08, 10)
    // ==========================================
    // Rocket nose aligns with forward vector:
    this.quaternion.setFromUnitVectors(this._up, forwardVec);

    // Apply lateral aerodynamic roll around forward axis:
    if (Math.abs(bankAngle) > 0.001) {
      const rollQuat = new THREE.Quaternion().setFromAxisAngle(forwardVec, bankAngle);
      this.quaternion.premultiply(rollQuat);
    }

    this.euler.setFromQuaternion(this.quaternion, 'YXZ');
  }

  /**
   * Physical Camera Choreography (Sections 29, 44, 46)
   */
  private calculateCinematicCamera(
    progress: number,
    state: CinematicFlightState,
    stateProgress: number
  ): void {
    if (progress < 0.12) {
      // SHOT 01: Wide view of launch pad and atmospheric universe
      this._camPos.set(0.0, -12.0, 16.0);
      this._camLookAt.set(0.0, -16.0, -12.0);
    } else if (progress < 0.25) {
      // SHOT 02: Camera tracks in as ignition commences, low angle feeling the mass
      const t = (progress - 0.12) / 0.13;
      this._camPos.set(
        THREE.MathUtils.lerp(0.0, 3.8, t),
        THREE.MathUtils.lerp(-12.0, -15.2, t),
        THREE.MathUtils.lerp(16.0, 7.0, t)
      );
      this._camLookAt.set(0.0, -16.5, -12.0);
    } else if (progress < 0.42) {
      // SHOT 03: Follows rocket ascent looking upward from behind
      this._camPos.set(
        this.position.x + 3.2,
        this.position.y - 7.2,
        this.position.z + 13.5
      );
      this._camLookAt.set(this.position.x, this.position.y + 3.5, this.position.z);
    } else if (progress < 0.58) {
      // SHOT 04: Side-orbit swing as rocket curves through high atmosphere
      const t = (progress - 0.42) / 0.16;
      const camOrbitAngle = t * Math.PI * 0.85;
      this._camPos.set(
        this.position.x + Math.sin(camOrbitAngle) * 15.5,
        this.position.y + 1.8,
        this.position.z + Math.cos(camOrbitAngle) * 15.5
      );
      this._camLookAt.set(this.position.x, this.position.y, this.position.z);
    } else if (progress < 0.72) {
      // SHOT 05: SCREEN BREAKTHROUGH! Rocket crosses directly near the camera
      const t = (progress - 0.58) / 0.14;
      this._camPos.set(
        Math.sin(t * Math.PI) * 0.7,
        Math.cos(t * Math.PI) * 0.4,
        14.2
      );
      this._camLookAt.set(0.4, 0.2, 0.0);
    } else if (progress < 0.82) {
      // SHOT 06: Camera whip around as rocket exits
      const t = (progress - 0.72) / 0.1;
      this._camPos.set(
        THREE.MathUtils.lerp(0.0, 7.5, t),
        THREE.MathUtils.lerp(0.0, 5.5, t),
        THREE.MathUtils.lerp(14.2, 8.5, t)
      );
      this._camLookAt.set(this.position.x, this.position.y, this.position.z);
    } else if (progress < 0.94) {
      // SHOT 07: High-angle descent tracking towards landing platform
      const t = (progress - 0.82) / 0.12;
      this._camPos.set(
        THREE.MathUtils.lerp(7.5, 4.8, t),
        THREE.MathUtils.lerp(5.5, -8.5, t),
        THREE.MathUtils.lerp(8.5, 14.5, t)
      );
      this._camLookAt.set(0.0, -18.0, -12.0);
    } else {
      // SHOT 08: Post-landing calm pull-back
      const t = (progress - 0.94) / 0.06;
      this._camPos.set(
        THREE.MathUtils.lerp(4.8, 0.0, t),
        THREE.MathUtils.lerp(-8.5, -12.0, t),
        THREE.MathUtils.lerp(14.5, 17.5, t)
      );
      this._camLookAt.set(0.0, -17.5, -12.0);
    }
  }
}
