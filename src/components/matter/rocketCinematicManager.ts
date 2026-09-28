/**
 * Central State Coordinator for the Cinematic Rocket -> Landing -> GitHub Profile Reveal.
 * Allows components across the application to trigger or observe the sequence safely.
 */

export type CinematicStage =
  | 'IDLE'                  // Ambient living matter flow
  | 'GATHER'                // Particles converge toward rocket coordinates
  | 'ROCKET_FORMED'         // Rocket silhouette stabilizes & vibrates
  | 'IGNITION'              // Engine activates with particle stream
  | 'LAUNCH'                // Rapid acceleration upward into depth
  | 'FLIGHT'                // Traverses deep space particle ecosystem
  | 'DESCENT'               // Controlled deceleration toward ground
  | 'LANDING_IMPACT'        // Impact shockwave, particles break apart
  | 'DISINTEGRATION'        // Rocket particles disperse into orbital cloud
  | 'PROFILE_RECONSTRUCT'   // Progressive reconstruction of GitHub profile
  | 'PROFILE_STABILIZED'    // Micro-breathing avatar with identity card
  | 'DISSOLUTION';          // Seamless dispersion back to ambient matter

export interface CinematicState {
  stage: CinematicStage;
  stageProgress: number; // 0.0 to 1.0 within current stage
  rocketY: number;
  rocketVelocity: number;
  impactProgress: number;
  reconstructionPhase: number; // 0 to 4
  profileAlpha: number;
  isTriggeredByUser: boolean;
}

type Listener = (state: CinematicState) => void;

class RocketCinematicManager {
  private static instance: RocketCinematicManager;

  public state: CinematicState = {
    stage: 'IDLE',
    stageProgress: 0,
    rocketY: 0,
    rocketVelocity: 0,
    impactProgress: 0,
    reconstructionPhase: 0,
    profileAlpha: 0,
    isTriggeredByUser: false,
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

  public triggerSequence() {
    if (this.state.stage !== 'IDLE') return;
    this.state.isTriggeredByUser = true;
    this.setStage('GATHER');
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
