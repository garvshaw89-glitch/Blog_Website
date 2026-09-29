export type IntroStageId = 'VOID' | 'TERRAIN' | 'METROPOLIS' | 'QUANTUM_ORB' | 'PORTAL';

export interface IntroStageInfo {
  id: IntroStageId;
  index: string;
  name: string;
  duration: number; // in seconds
  description: string;
}

export const INTRO_STAGES: IntroStageInfo[] = [
  {
    id: 'VOID',
    index: '01',
    name: 'DEEP VOID',
    duration: 2.2,
    description: 'Autonomous digital particles awaken in deep space',
  },
  {
    id: 'TERRAIN',
    index: '02',
    name: 'WAVE TERRAIN',
    duration: 3.0,
    description: 'Undulating sinusoidal particle ocean & energy conduit',
  },
  {
    id: 'METROPOLIS',
    index: '03',
    name: 'METROPOLIS',
    duration: 3.4,
    description: 'Architectural blueprint towers with warm-gold laser contours',
  },
  {
    id: 'QUANTUM_ORB',
    index: '04',
    name: 'QUANTUM CORE',
    duration: 3.2,
    description: 'Pulsating vortex sphere with crossed orbital rings',
  },
  {
    id: 'PORTAL',
    index: '05',
    name: 'DIMENSIONAL PORTAL',
    duration: 1.2,
    description: 'Warp expansion gateway into the digital archive',
  },
];

export interface IntroProps {
  onComplete: () => void;
}
