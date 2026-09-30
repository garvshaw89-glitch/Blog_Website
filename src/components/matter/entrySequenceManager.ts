/**
 * DETERMINISTIC STATE MACHINE FOR THE CINEMATIC OPENING EXPERIENCE
 * 
 * Strict deterministic states conforming to Section 08:
 * - VOID
 * - AWAKEN
 * - PARTICLE_FIELD
 * - ARCHITECTURE_FORM
 * - ARCHITECTURE_HOLD
 * - MATTER_BREAK
 * - CAMERA_TRAVEL
 * - IDENTITY_REVEAL
 * - HERO_ACTIVE
 *
 * Each state provides enter(), update(), and exit() hooks.
 * One authoritative elapsed time drives all transitions without scattered setTimeout calls.
 */

export type EntryStage =
  | 'VOID'
  | 'AWAKEN'
  | 'PARTICLE_FIELD'
  | 'ARCHITECTURE_FORM'
  | 'ARCHITECTURE_HOLD'
  | 'MATTER_BREAK'
  | 'CAMERA_TRAVEL'
  | 'IDENTITY_REVEAL'
  | 'HERO_ACTIVE';

export interface StateConfig {
  stage: EntryStage;
  startTime: number;
  duration: number;
  label: string;
}

export const STATE_TIMELINE: readonly StateConfig[] = [
  { stage: 'VOID', startTime: 0.0, duration: 1.2, label: 'Pure Digital Void' },
  { stage: 'AWAKEN', startTime: 1.2, duration: 1.2, label: 'Distant Light Awakens' },
  { stage: 'PARTICLE_FIELD', startTime: 2.4, duration: 1.4, label: 'Fluid Matter Field' },
  { stage: 'ARCHITECTURE_FORM', startTime: 3.8, duration: 1.5, label: 'Architectural Form' },
  { stage: 'ARCHITECTURE_HOLD', startTime: 5.3, duration: 1.2, label: 'Monolith Approach' },
  { stage: 'MATTER_BREAK', startTime: 6.5, duration: 0.9, label: 'Matter Dissolution' },
  { stage: 'CAMERA_TRAVEL', startTime: 7.4, duration: 0.8, label: 'Warp Camera Travel' },
  { stage: 'IDENTITY_REVEAL', startTime: 8.2, duration: 1.4, label: 'Identity Manifestation' },
  { stage: 'HERO_ACTIVE', startTime: 9.6, duration: Infinity, label: 'Living Universe Active' },
] as const;

export interface EntryState {
  stage: EntryStage;
  stageProgress: number; // 0.0 to 1.0 within the current stage
  totalTime: number;      // Authoritative elapsed seconds
  isActive: boolean;      // True while opening sequence is running
  prefersReduced: boolean;
  cameraDistance: number; // Computed 3D camera Z target
  lightIntensity: number; // Dynamic illumination scalar
  structureCohesion: number; // 0.0 (free matter) -> 1.0 (crystallized architecture)
  dissolutionFactor: number; // 0.0 (solid) -> 1.0 (bursting particles)
}

type EntryListener = (state: EntryState) => void;

class EntrySequenceManager {
  private static instance: EntrySequenceManager;

  public state: EntryState = {
    stage: 'VOID',
    stageProgress: 0,
    totalTime: 0,
    isActive: true,
    prefersReduced: false,
    cameraDistance: 12.0,
    lightIntensity: 0.05,
    structureCohesion: 0,
    dissolutionFactor: 0,
  };

  private listeners: Set<EntryListener> = new Set();
  private previousStage: EntryStage = 'VOID';

  public static getInstance(): EntrySequenceManager {
    if (!EntrySequenceManager.instance) {
      EntrySequenceManager.instance = new EntrySequenceManager();
    }
    return EntrySequenceManager.instance;
  }

  public subscribe(listener: EntryListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Deterministic authoritative clock tick.
   * Calculates exact state, enters/exits handlers, and computes physical uniforms.
   */
  public tick(currentTime: number) {
    if (this.state.stage === 'HERO_ACTIVE' && !this.state.isActive) {
      return;
    }

    const t = Math.max(0, currentTime);
    this.state.totalTime = t;

    // Determine current state from timeline
    let activeConfig = STATE_TIMELINE[0];
    for (let i = STATE_TIMELINE.length - 1; i >= 0; i--) {
      if (t >= STATE_TIMELINE[i].startTime) {
        activeConfig = STATE_TIMELINE[i];
        break;
      }
    }

    const currentStage = activeConfig.stage;
    const elapsedInStage = t - activeConfig.startTime;
    const stageProgress = activeConfig.duration === Infinity
      ? 1.0
      : Math.min(1.0, Math.max(0, elapsedInStage / activeConfig.duration));

    // Lifecycle triggers: exit previous, enter new
    if (currentStage !== this.previousStage) {
      this.onStageExit(this.previousStage);
      this.previousStage = currentStage;
      this.onStageEnter(currentStage);
    }

    this.state.stage = currentStage;
    this.state.stageProgress = stageProgress;

    // Deterministic state-specific physical calculations:
    this.onStageUpdate(currentStage, stageProgress);

    if (currentStage === 'HERO_ACTIVE') {
      this.state.isActive = false;
    }

    this.notify();
  }

  private onStageEnter(stage: EntryStage) {
    // enter() hook for deterministic setup
    switch (stage) {
      case 'VOID':
        this.state.cameraDistance = 12.5;
        this.state.lightIntensity = 0.05;
        this.state.structureCohesion = 0;
        break;
      case 'AWAKEN':
        break;
      case 'ARCHITECTURE_FORM':
        break;
      case 'MATTER_BREAK':
        break;
      case 'CAMERA_TRAVEL':
        break;
      case 'IDENTITY_REVEAL':
        break;
      case 'HERO_ACTIVE':
        this.state.isActive = false;
        break;
    }
  }

  private onStageUpdate(stage: EntryStage, p: number) {
    // update() hook for physical smooth interpolations
    switch (stage) {
      case 'VOID':
        // Almost complete darkness, small number of faint particles
        this.state.cameraDistance = 12.5 - p * 0.5;
        this.state.lightIntensity = 0.05 + p * 0.1;
        this.state.structureCohesion = 0;
        this.state.dissolutionFactor = 0;
        break;

      case 'AWAKEN':
        // Particles begin moving, distant light awakens
        this.state.cameraDistance = 12.0 - p * 0.8;
        this.state.lightIntensity = 0.15 + p * 0.25;
        this.state.structureCohesion = p * 0.2;
        this.state.dissolutionFactor = 0;
        break;

      case 'PARTICLE_FIELD':
        // Fluid particles flow into depth
        this.state.cameraDistance = 11.2 - p * 1.0;
        this.state.lightIntensity = 0.4 + p * 0.3;
        this.state.structureCohesion = 0.2 + p * 0.4;
        this.state.dissolutionFactor = 0;
        break;

      case 'ARCHITECTURE_FORM':
        // Particles coalesce into abstract digital architectural structure
        this.state.cameraDistance = 10.2 - p * 1.5;
        this.state.lightIntensity = 0.7 + p * 0.5;
        this.state.structureCohesion = 0.6 + p * 0.4; // Solidifying
        this.state.dissolutionFactor = 0;
        break;

      case 'ARCHITECTURE_HOLD':
        // Camera slowly approaches the architectural structure
        this.state.cameraDistance = 8.7 - p * 1.5;
        this.state.lightIntensity = 1.2 + Math.sin(p * Math.PI) * 0.3;
        this.state.structureCohesion = 1.0;
        this.state.dissolutionFactor = 0;
        break;

      case 'MATTER_BREAK':
        // Structure breaks apart, particles flow toward visitor
        this.state.cameraDistance = 7.2 - p * 1.2;
        this.state.lightIntensity = 1.4 + p * 0.4;
        this.state.structureCohesion = 1.0 - p * 0.8;
        this.state.dissolutionFactor = p;
        break;

      case 'CAMERA_TRAVEL':
        // Camera moves rapidly through the dispersed matter
        this.state.cameraDistance = 6.0 - p * 3.5;
        this.state.lightIntensity = 1.8 + Math.sin(p * Math.PI) * 0.8;
        this.state.structureCohesion = 0;
        this.state.dissolutionFactor = 1.0;
        break;

      case 'IDENTITY_REVEAL':
        // Particles spread apart, revealing real HTML DOM typography
        this.state.cameraDistance = 2.5 + p * 3.5; // settles back to base 6.0
        this.state.lightIntensity = 1.5 - p * 0.3; // settles to 1.2
        this.state.structureCohesion = 0;
        this.state.dissolutionFactor = 0.5 - p * 0.5;
        break;

      case 'HERO_ACTIVE':
        this.state.cameraDistance = 6.0;
        this.state.lightIntensity = 1.2;
        this.state.structureCohesion = 0;
        this.state.dissolutionFactor = 0;
        break;
    }
  }

  private onStageExit(stage: EntryStage) {
    // exit() hook for teardown
    if (stage === 'IDENTITY_REVEAL') {
      this.state.isActive = false;
    }
  }

  public completeImmediately() {
    this.state.stage = 'HERO_ACTIVE';
    this.state.stageProgress = 1.0;
    this.state.isActive = false;
    this.state.cameraDistance = 6.0;
    this.state.lightIntensity = 1.2;
    this.notify();
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.state));
  }
}

export const entrySequenceManager = EntrySequenceManager.getInstance();
