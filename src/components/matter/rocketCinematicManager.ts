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
  | 'PARTICLE_CLOUD'        // Disperses into large floating cloud (12.40s)
  | 'PROFILE_FORMING'       // Profile image begins forming (13.00s)
  | 'PROFILE_RECOGNIZABLE'  // Face, hair and glasses become recognizable (14.20s)
  | 'PROFILE_LOCKING'       // Fine image details stabilize (15.40s)
  | 'PROFILE_COMPLETE'      // Full GitHub profile image visible (16.20s)
  | 'PROFILE_HOLD'          // Deliberate 1.3s visual pause: PROFILE IMAGE ONLY — NO TEXT (16.20s - 17.50s)
  | 'TEXT_PREPARE'          // Typography layer prepared, profile remains stable (17.50s - 17.70s)
  | 'NAME_REVEAL'           // "GARV SHAW" begins appearing (17.70s - 18.10s)
  | 'TAGLINE_REVEAL'        // "TURNING AI INTO INNOVATION" appears (18.10s - 18.70s)
  | 'IDENTITY_COMPLETE'     // Full identity composition visible (18.70s - 19.50s)
  | 'RETURN_TO_WORLD';      // Particles slowly return to ambient flow (19.50s+)

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
