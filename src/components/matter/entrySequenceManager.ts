/**
 * Coordinator for the Luxury Futuristic Entry Sequence:
 * Handles timeline progression, stage transitions, and dot-to-text transitions.
 * Coordinates seamlessly with LivingMatterBackground so the entry sequence
 * transitions without interruption into the main website particle ecosystem.
 */

export type EntryStage =
  | 'INITIAL_VOID'        // 0.0s - 0.8s: Empty/dormant field with 20-40 faint dots, central dot brightens
  | 'AWAKENING'           // 0.8s - 1.8s: Central ripple awakens matter outward
  | 'CONSTELLATION'       // 1.8s - 2.8s: Dynamic temporary connections
  | 'FORM_SPHERE'         // 2.8s - 3.4s: 3D rotating geometric sphere
  | 'FORM_RING'           // 3.4s - 3.9s: 3D circular ring
  | 'FORM_WAVE'           // 3.9s - 4.5s: Flowing transverse sine wave
  | 'DIGITAL_GLOBE'       // 4.5s - 5.5s: Earth-like continent globe
  | 'ARCHITECTURE'        // 5.5s - 6.2s: Wireframe structural blueprint
  | 'WATER_FIELD'         // 6.2s - 6.8s: Fluid particle ocean
  | 'BRAND_REVEAL'        // 6.8s - 7.6s: "GARV SHAW" -> "DIGITAL ARCHITECT" -> "AI × CLOUD × SOFTWARE"
  | 'INTELLIGENCE_MOTION' // 7.6s - 8.3s: "INTELLIGENCE IN MOTION"
  | 'PARTICLES_EXPAND'    // 8.3s - 9.0s: Particle field expands outward to reveal portfolio
  | 'COMPLETED';          // Handed off seamlessly to Living Digital Matter

export interface EntryState {
  stage: EntryStage;
  progress: number;       // 0 to 1 in current stage
  totalTime: number;      // Seconds elapsed
  isActive: boolean;
  prefersReduced: boolean;
}

type EntryListener = (state: EntryState) => void;

class EntrySequenceManager {
  private static instance: EntrySequenceManager;

  public state: EntryState = {
    stage: 'INITIAL_VOID',
    progress: 0,
    totalTime: 0,
    isActive: true,
    prefersReduced: false,
  };

  private listeners: Set<EntryListener> = new Set();

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

  public setStage(stage: EntryStage) {
    this.state.stage = stage;
    this.state.progress = 0;
    if (stage === 'COMPLETED') {
      this.state.isActive = false;
    }
    this.notify();
  }

  public update(partial: Partial<EntryState>) {
    Object.assign(this.state, partial);
    this.notify();
  }

  public completeImmediately() {
    this.state.stage = 'COMPLETED';
    this.state.isActive = false;
    this.notify();
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.state));
  }
}

export const entrySequenceManager = EntrySequenceManager.getInstance();
