export type SheetSectionId =
  | 'about'
  | 'capabilities'
  | 'digital-dna'
  | 'projects'
  | 'github-telemetry'
  | 'journey'
  | 'constellation'
  | 'writing'
  | 'ai-lab'
  | 'contact';

export interface SheetSectionMeta {
  id: SheetSectionId;
  label: string;
  windowTitle: string;
  subtitle: string;
  featured: boolean;
}

export const SHEET_SECTIONS: SheetSectionMeta[] = [
  {
    id: 'about',
    label: 'About',
    windowTitle: 'About — Garv Shaw',
    subtitle: 'Identity & Architectural Philosophy',
    featured: true,
  },
  {
    id: 'capabilities',
    label: 'Capabilities',
    windowTitle: 'Capabilities',
    subtitle: 'Core Engineering Disciplines',
    featured: false,
  },
  {
    id: 'digital-dna',
    label: 'Digital DNA',
    windowTitle: 'Digital DNA',
    subtitle: 'Systemic Network Graph',
    featured: false,
  },
  {
    id: 'projects',
    label: 'Projects',
    windowTitle: 'Projects',
    subtitle: 'Selected Production Systems',
    featured: true,
  },
  {
    id: 'github-telemetry',
    label: 'GitHub',
    windowTitle: 'GitHub Telemetry',
    subtitle: 'Open Source & Repositories',
    featured: false,
  },
  {
    id: 'journey',
    label: 'Journey',
    windowTitle: 'Engineering Journey',
    subtitle: 'Chronological Milestones',
    featured: false,
  },
  {
    id: 'constellation',
    label: 'Topology',
    windowTitle: 'Technology Constellation',
    subtitle: 'Architectural Stack Graph',
    featured: false,
  },
  {
    id: 'writing',
    label: 'Writing',
    windowTitle: 'Writing',
    subtitle: 'Essays & Architecture Notes',
    featured: true,
  },
  {
    id: 'ai-lab',
    label: 'AI Lab',
    windowTitle: 'AI Engineering Lab',
    subtitle: 'Assistant, RAG & Agent Trace',
    featured: false,
  },
  {
    id: 'contact',
    label: 'Contact',
    windowTitle: 'Contact',
    subtitle: 'Direct Inquiry & Dispatch',
    featured: true,
  },
];

export const FEATURED_SHEET_IDS: SheetSectionId[] = [
  'about',
  'projects',
  'writing',
  'contact',
];
