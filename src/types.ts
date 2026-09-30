export interface SkillItem {
  id: string;
  number: string;
  title: string;
  description: string;
  tags?: string[];
  capabilities?: string[];
  relatedProjects?: string[];
}

export type ServiceItem = SkillItem;

export interface EngineeringDomain {
  id: string;
  title: string;
  badge: string;
  tagline: string;
  description: string;
  technologies: string[];
  capabilities: string[];
  relatedProjects: string[];
  icon: string;
}

export interface SpecializedDomain {
  id: string;
  title: string;
  badge: string;
  description: string;
  skills: string[];
  icon: string;
}

export interface ArchitectureLayer {
  layer: string;
  component: string;
  tech: string;
  role: string;
}

export interface ProjectCaseStudy {
  overview: string;
  problem: string;
  solution: string;
  role: string;
  architectureSummary: string;
  aiComponent?: string;
  backend: string;
  database: string;
  cloudInfra: string;
  keyFeatures: string[];
  engineeringChallenges: string[];
  designDecisions: string[];
  result: string;
}

export interface ProjectItem {
  id: string;
  number: string;
  title: string;
  category: string;
  description: string;
  type: string;
  status?: 'Live' | 'Building' | 'Concept' | 'Active';
  col1TopImage: string;
  col1BottomImage: string;
  col2Image: string;
  githubUrl?: string;
  liveUrl?: string;
  tags: string[];
  caseStudy?: ProjectCaseStudy;
}

export interface SocialLink {
  name: string;
  url: string;
  label?: string;
  iconName?: string;
}

export interface ConstellationNode {
  id: string;
  label: string;
  category: 'AI' | 'Backend' | 'Cloud' | 'Data' | 'Frontend' | 'Core' | 'Graphics' | 'DevOps';
  level: number;
  x: number;
  y: number;
  description: string;
  whereUsed: string;
  relatedProjects: string[];
}

export interface ConstellationLink {
  source: string;
  target: string;
}

export interface EngineeringLogEntry {
  id: string;
  date: string;
  category: string;
  title: string;
  summary: string;
  technologies: string[];
  relatedProject: string;
  details?: string[];
}

export interface AiExperiment {
  id: string;
  title: string;
  badge: string;
  status: 'Ready' | 'Active' | 'Demo' | 'Interactive';
  whatItDoes: string;
  howItWorks: string;
  technology: string[];
}
