/**
 * Central State Coordinator for the Cinematic Digital Universe:
 * Orchestrates:
 * 1. Ambient Particle Universe (stars, streams, constellations, depth layers)
 * 2. 3D GitHub Profile Particle Portrait Reveal -> Hold & Breathe -> Dissolve
 * 3. Multi-Stage Realistic Aerospace Rocket Launch & Supersonic Ascent
 */

export type CinematicStage =
  | 'IDLE'                  // Ambient digital universe
  | 'AMBIENT_UNIVERSE'      // Ambient digital universe
  | 'PROFILE_REVEAL'        // Ambient particles converge into authentic portrait (2-4s)
  | 'PROFILE_FORMING'       // Alias for profile reveal start
  | 'PROFILE_RECOGNIZABLE'  // Facial details forming
  | 'PROFILE_LOCKING'       // Final alignment
  | 'PROFILE_COMPLETE'      // Fully formed
  | 'PROFILE_HOLD'          // Stabilized breathing portrait (full recognition & depth)
  | 'PROFILE_DISSOLVE'      // Particles loosen and drift into ambient field
  | 'TEXT_PREPARE'
  | 'NAME_REVEAL'
  | 'TAGLINE_REVEAL'
  | 'IDENTITY_COMPLETE'
  | 'GATHER'                // Rocket gathering
  | 'ROCKET_FORM'           // Rocket geometry forming on right side
  | 'ROCKET_FORMED'         // Rocket stabilized
  | 'IGNITION'              // Rocket engine ignition & vibration
  | 'LAUNCH'                // Rocket liftoff
  | 'FLIGHT'                // Rocket supersonic ascent
  | 'DESCENT'
  | 'LANDING_IMPACT'
  | 'PARTICLE_CLOUD'
  | 'RETURN_TO_WORLD';      // Dissolving back to ambient universe

export interface CinematicState {
  stage: CinematicStage;
  stageProgress: number; // 0.0 to 1.0 within current stage
  rocketY: number;
  rocketVelocity: number;
  impactProgress: number;
  reconstructionPhase: number; // 0 to 4
  profileAlpha: number;
  isTriggeredByUser: boolean;
  ambientState: 'UNIVERSE' | 'FREE_FLOW' | 'ROCK' | 'GLOBE' | 'WAVE';
  ambientRequest: 'NONE' | 'PORTRAIT' | 'ROCKET' | 'UNIVERSE' | 'GLOBE' | 'FLOW';
  rocketAltitudeMeters: number;
  rocketVelocityKmh: number;
}

type Listener = (state: CinematicState) => void;

class RocketCinematicManager {
  private static instance: RocketCinematicManager;

  public state: CinematicState = {
    stage: 'PROFILE_REVEAL',
    stageProgress: 0,
    rocketY: 0,
    rocketVelocity: 0,
    impactProgress: 0,
    reconstructionPhase: 0,
    profileAlpha: 0,
    isTriggeredByUser: false,
    ambientState: 'UNIVERSE',
    ambientRequest: 'NONE',
    rocketAltitudeMeters: 0,
    rocketVelocityKmh: 0,
  };

  private listeners: Set<Listener> = new Set();

  public static getInstance(): RocketCinematicManager {
    if (!RocketCinematicManager.instance) {
      RocketCinematicManager.instance = new RocketCinematicManager();
    }
    return RocketCinematicManager.instance;
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Directly triggers the multi-stage aerospace rocket launch sequence
   */
  public triggerSequence() {
    this.state.isTriggeredByUser = true;
    this.state.ambientRequest = 'ROCKET';
    this.setStage('GATHER');
  }

  /**
   * Directly triggers the 3D GitHub Profile Particle Portrait Reveal
   */
  public triggerProfile() {
    this.state.isTriggeredByUser = true;
    this.state.ambientRequest = 'PORTRAIT';
    this.setStage('PROFILE_FORMING');
  }

  /**
   * Directly returns to the serene Ambient Digital Universe
   */
  public triggerAmbient() {
    this.state.isTriggeredByUser = true;
    this.state.ambientRequest = 'UNIVERSE';
    this.state.ambientState = 'UNIVERSE';
    this.setStage('IDLE');
  }

  public triggerFlow() {
    this.triggerAmbient();
  }

  public triggerEarth() {
    this.triggerProfile();
  }

  public consumeAmbientRequest(): 'NONE' | 'PORTRAIT' | 'ROCKET' | 'UNIVERSE' | 'GLOBE' | 'FLOW' {
    const req = this.state.ambientRequest;
    this.state.ambientRequest = 'NONE';
    return req;
  }

  public setStage(stage: CinematicStage) {
    this.state.stage = stage;
    this.state.stageProgress = 0;
    this.notify();
  }

  public update(partial: Partial<CinematicState>) {
    Object.assign(this.state, partial);
    this.notify();
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.state));
  }
}

export const rocketCinematicManager = RocketCinematicManager.getInstance();
