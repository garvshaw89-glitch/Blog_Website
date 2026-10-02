import * as THREE from 'three';

/**
 * SingularityInteractionState
 * Centralized, unified real-time interaction metrics used by both
 * the WebGL 3D living environment and the desktop Custom Cursor.
 */
export interface SingularityInteractionState {
  // Screen coordinates
  clientX: number;
  clientY: number;
  // Normalized device coordinates (-1 to 1)
  ndcX: number;
  ndcY: number;
  // Projected 3D world space coordinate at Z = 0
  worldPos: THREE.Vector3;
  // Velocity in px/s and normalized speed [0..1+]
  vx: number;
  vy: number;
  speed: number;
  smoothedSpeed: number;
  normalizedEnergy: number; // 0 (calm) to 1.0+ (hyperspeed)
  
  // Edge of screen proximity (0 = center, 1 = touching edge)
  edgePullX: number; // -1 (left edge) to +1 (right edge)
  edgePullY: number; // -1 (top edge) to +1 (bottom edge)
  edgeDistance: number; // 0 to 1

  // Scroll propulsion
  scrollY: number;
  scrollProgress: number; // 0 to 1
  scrollVelocity: number;
  smoothedScrollVelocity: number;

  // Hover target info
  isHoveringInteractive: boolean;
  hoverType: 'default' | 'button' | 'link' | 'project' | 'text';
  magneticTarget: HTMLElement | null;

  // Active click shockwave timestamp and coordinates
  lastClickTime: number;
  clickOrigin: { x: number; y: number; worldX: number; worldY: number };
  clickCount: number;

  // Active section palette
  sectionTheme: {
    primary: number;
    secondary: number;
    ambient: number;
    name: string;
  };

  // Accessibility
  prefersReduced: boolean;
  isDesktopFinePointer: boolean;
}

type Listener = (state: SingularityInteractionState) => void;

class InteractionEngine {
  private static instance: InteractionEngine;
  private listeners = new Set<Listener>();

  public state: SingularityInteractionState = {
    clientX: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
    clientY: typeof window !== 'undefined' ? window.innerHeight / 2 : 0,
    ndcX: 0,
    ndcY: 0,
    worldPos: new THREE.Vector3(0, 0, 0),
    vx: 0,
    vy: 0,
    speed: 0,
    smoothedSpeed: 0,
    normalizedEnergy: 0,
    edgePullX: 0,
    edgePullY: 0,
    edgeDistance: 0,
    scrollY: 0,
    scrollProgress: 0,
    scrollVelocity: 0,
    smoothedScrollVelocity: 0,
    isHoveringInteractive: false,
    hoverType: 'default',
    magneticTarget: null,
    lastClickTime: 0,
    clickOrigin: { x: 0, y: 0, worldX: 0, worldY: 0 },
    clickCount: 0,
    sectionTheme: {
      name: 'hero',
      primary: 0x06b6d4, // Cyan
      secondary: 0x3b82f6, // Blue
      ambient: 0x081528,
    },
    prefersReduced: false,
    isDesktopFinePointer: true,
  };

  private lastTime = 0;
  private prevClientX = 0;
  private prevClientY = 0;
  private initialized = false;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  public static getInstance(): InteractionEngine {
    if (!InteractionEngine.instance) {
      InteractionEngine.instance = new InteractionEngine();
    }
    return InteractionEngine.instance;
  }

  private init() {
    if (this.initialized) return;
    this.initialized = true;

    const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.state.prefersReduced = reducedQuery.matches;
    reducedQuery.addEventListener('change', (e) => {
      this.state.prefersReduced = e.matches;
    });

    const pointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    this.state.isDesktopFinePointer = pointerQuery.matches;
    pointerQuery.addEventListener('change', (e) => {
      this.state.isDesktopFinePointer = e.matches;
    });

    this.prevClientX = window.innerWidth / 2;
    this.prevClientY = window.innerHeight / 2;
    this.state.clientX = this.prevClientX;
    this.state.clientY = this.prevClientY;
    this.lastTime = performance.now();

    window.addEventListener('pointermove', this.onPointerMove, { passive: true });
    window.addEventListener('pointerdown', this.onPointerDown, { passive: true });
    window.addEventListener('scroll', this.onScroll, { passive: true });
  }

  private onPointerMove = (e: PointerEvent) => {
    const now = performance.now();
    const dt = Math.max((now - this.lastTime) / 1000, 0.001);
    this.lastTime = now;

    this.state.clientX = e.clientX;
    this.state.clientY = e.clientY;

    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;

    this.state.ndcX = (e.clientX / w) * 2 - 1;
    this.state.ndcY = -(e.clientY / h) * 2 + 1;

    // Edge pull
    this.state.edgePullX = this.state.ndcX;
    this.state.edgePullY = this.state.ndcY;
    this.state.edgeDistance = Math.min(
      Math.hypot(this.state.ndcX, this.state.ndcY),
      1.0
    );

    const dx = e.clientX - this.prevClientX;
    const dy = e.clientY - this.prevClientY;
    this.prevClientX = e.clientX;
    this.prevClientY = e.clientY;

    this.state.vx = dx / dt;
    this.state.vy = dy / dt;
    this.state.speed = Math.hypot(this.state.vx, this.state.vy);

    // Contextual hover target inspection
    const target = e.target as HTMLElement | null;
    if (target) {
      const isButton = !!target.closest('button, [role="button"], [data-cursor="button"]');
      const isProject = !!target.closest('[data-cursor="project"], [data-cursor="view"], [data-cursor="image"]');
      const isLink = !isButton && !isProject && !!target.closest('a, [data-cursor="link"], [data-cursor="open"]');
      const isText = !isButton && !isProject && !isLink && !!target.closest('input, textarea, [contenteditable="true"]');

      if (isProject) {
        this.state.hoverType = 'project';
        this.state.isHoveringInteractive = true;
      } else if (isButton) {
        this.state.hoverType = 'button';
        this.state.isHoveringInteractive = true;
      } else if (isLink) {
        this.state.hoverType = 'link';
        this.state.isHoveringInteractive = true;
      } else if (isText) {
        this.state.hoverType = 'text';
        this.state.isHoveringInteractive = false;
      } else {
        this.state.hoverType = 'default';
        this.state.isHoveringInteractive = false;
      }

      this.state.magneticTarget = (target.closest('[data-magnetic]') as HTMLElement) || null;
    }

    this.notify();
  };

  private onPointerDown = (e: PointerEvent) => {
    this.state.lastClickTime = performance.now();
    this.state.clickCount += 1;
    this.state.clientX = e.clientX;
    this.state.clientY = e.clientY;
    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    this.state.ndcX = (e.clientX / w) * 2 - 1;
    this.state.ndcY = -(e.clientY / h) * 2 + 1;
    this.state.clickOrigin = {
      x: e.clientX,
      y: e.clientY,
      worldX: this.state.worldPos.x,
      worldY: this.state.worldPos.y,
    };
    this.notify();
  };

  private onScroll = () => {
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const maxScroll = Math.max(
      document.documentElement.scrollHeight - window.innerHeight,
      1
    );
    const delta = scrollY - this.state.scrollY;
    this.state.scrollY = scrollY;
    this.state.scrollVelocity = delta;
    this.state.scrollProgress = Math.min(Math.max(scrollY / maxScroll, 0), 1);

    this.updateSectionAtmosphere(scrollY);
    this.notify();
  };

  private updateSectionAtmosphere(scrollY: number) {
    const viewportMid = scrollY + window.innerHeight * 0.45;
    const sections = [
      { id: 'hero-section', name: 'hero', primary: 0x06b6d4, secondary: 0x3b82f6, ambient: 0x081528 },
      { id: 'about', name: 'about', primary: 0x6366f1, secondary: 0x06b6d4, ambient: 0x0c1126 },
      { id: 'capabilities', name: 'capabilities', primary: 0x0ea5e9, secondary: 0x2563eb, ambient: 0x081730 },
      { id: 'digital-dna', name: 'digital-dna', primary: 0xa855f7, secondary: 0x06b6d4, ambient: 0x140d28 },
      { id: 'projects', name: 'projects', primary: 0x06b6d4, secondary: 0x38bdf8, ambient: 0x061424 },
      { id: 'github-telemetry', name: 'engineering', primary: 0x38bdf8, secondary: 0x6366f1, ambient: 0x0a1630 },
      { id: 'journey', name: 'journey', primary: 0x10b981, secondary: 0x06b6d4, ambient: 0x061824 },
      { id: 'constellation', name: 'constellation', primary: 0xa855f7, secondary: 0x06b6d4, ambient: 0x140d28 },
      { id: 'writing', name: 'writing', primary: 0x38bdf8, secondary: 0x6366f1, ambient: 0x0a1630 },
      { id: 'contact', name: 'contact', primary: 0x14b8a6, secondary: 0x06b6d4, ambient: 0x061824 },
    ];

    for (const sec of sections) {
      const el = document.getElementById(sec.id);
      if (el) {
        const top = el.offsetTop;
        const bottom = top + el.offsetHeight;
        if (viewportMid >= top && viewportMid <= bottom) {
          this.state.sectionTheme = {
            name: sec.name,
            primary: sec.primary,
            secondary: sec.secondary,
            ambient: sec.ambient,
          };
          break;
        }
      }
    }
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  /**
   * Called per-frame in unified tick to decay velocities naturally
   */
  public step() {
    this.state.smoothedSpeed += (this.state.speed - this.state.smoothedSpeed) * 0.08;
    this.state.speed *= 0.91; // decay

    this.state.smoothedScrollVelocity +=
      (this.state.scrollVelocity - this.state.smoothedScrollVelocity) * 0.08;
    this.state.scrollVelocity *= 0.88; // decay

    // Normalized energy factor: [0 calm .. 1.0+ high speed]
    this.state.normalizedEnergy = Math.min(this.state.smoothedSpeed / 1200, 1.6);
  }
}

export const interactionEngine = InteractionEngine.getInstance();
