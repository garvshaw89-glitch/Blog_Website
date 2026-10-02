export type EntryStage =
  | 'DARK_VOID'
  | 'INITIAL_SPARK'
  | 'SURFACE_EMERGENCE'
  | 'WORLD_ALIGNMENT'
  | 'HERO_ACTIVE';

export interface EntrySequenceState {
  stage: EntryStage;
  progress: number;
}

class EntrySequenceManager {
  public state: EntrySequenceState = {
    stage: 'HERO_ACTIVE',
    progress: 1.0,
  };

  private listeners: Set<(state: EntrySequenceState) => void> = new Set();

  public subscribe(listener: (state: EntrySequenceState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  public tick(t: number): void {
    let stage: EntryStage = 'HERO_ACTIVE';
    if (t < 0.8) stage = 'DARK_VOID';
    else if (t < 1.6) stage = 'INITIAL_SPARK';
    else if (t < 2.4) stage = 'SURFACE_EMERGENCE';
    else if (t < 3.2) stage = 'WORLD_ALIGNMENT';
    else stage = 'HERO_ACTIVE';

    this.state = {
      stage,
      progress: Math.min(1.0, t / 3.2),
    };

    this.listeners.forEach((l) => l(this.state));
  }

  public completeImmediately(): void {
    this.state = {
      stage: 'HERO_ACTIVE',
      progress: 1.0,
    };
    this.listeners.forEach((l) => l(this.state));
  }
}

export const entrySequenceManager = new EntrySequenceManager();
