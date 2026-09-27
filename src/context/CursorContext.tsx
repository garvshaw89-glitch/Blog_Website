import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { interactionEngine } from './SingularityInteractionEngine';

export type CursorType =
  | 'default'
  | 'link'
  | 'button'
  | 'project'
  | 'image'
  | 'drag'
  | 'text'
  | 'hidden'
  | 'pointer'
  | 'external'
  | 'disabled';

export type CursorTheme = 'default' | 'cyan' | 'light' | 'violet';

export interface GravitationalCoordinates {
  /** Screen client X coordinate in px */
  x: number;
  /** Screen client Y coordinate in px */
  y: number;
  /** Normalized Device Coordinate X [-1 to +1] */
  ndcX: number;
  /** Normalized Device Coordinate Y [-1 to +1] */
  ndcY: number;
  /** Gravitational interaction radius in pixels (default: 200) */
  radius: number;
  /** Current normalized physical velocity */
  velocity: { x: number; y: number; speed: number };
  /** Normalized gravitational field energy [0 calm .. 1.0+ high kinetic] */
  energy: number;
  /** Dynamic edge pulling gravity vector */
  edgePull: { x: number; y: number; distance: number };
  /** Projected 3D coordinates on world plane at Z = 0 */
  worldPos: { x: number; y: number; z: number };
}

export interface CursorState {
  cursorType: CursorType;
  cursorLabel: string;
  cursorTheme: CursorTheme;
  isPointerDown: boolean;
  isIdle: boolean;
  isVisible: boolean;
  isTouchDevice: boolean;
  gravitationalCoords: GravitationalCoordinates;
}

export interface CursorContextValue extends CursorState {
  setCursorType: (type: CursorType) => void;
  setCursorLabel: (label: string) => void;
  setCursorTheme: (theme: CursorTheme) => void;
  setIsPointerDown: (isDown: boolean) => void;
  setIsIdle: (isIdle: boolean) => void;
  setIsVisible: (isVisible: boolean) => void;
  setIsTouchDevice: (isTouch: boolean) => void;
  resetCursor: () => void;
  setGravityRadius: (radius: number) => void;
}

const defaultGravitationalCoords: GravitationalCoordinates = {
  x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
  y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0,
  ndcX: 0,
  ndcY: 0,
  radius: 200, // 200px radius as requested
  velocity: { x: 0, y: 0, speed: 0 },
  energy: 0,
  edgePull: { x: 0, y: 0, distance: 0 },
  worldPos: { x: 0, y: 0, z: 0 },
};

const defaultCursorState: CursorState = {
  cursorType: 'default',
  cursorLabel: '',
  cursorTheme: 'default',
  isPointerDown: false,
  isIdle: false,
  isVisible: false,
  isTouchDevice: false,
  gravitationalCoords: defaultGravitationalCoords,
};

const CursorContext = createContext<CursorContextValue | null>(null);

export const CursorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<CursorState>(defaultCursorState);
  const gravityRadiusRef = useRef<number>(200);

  const setCursorType = useCallback((cursorType: CursorType) => {
    setState((prev) => (prev.cursorType === cursorType ? prev : { ...prev, cursorType }));
  }, []);

  const setCursorLabel = useCallback((cursorLabel: string) => {
    setState((prev) => (prev.cursorLabel === cursorLabel ? prev : { ...prev, cursorLabel }));
  }, []);

  const setCursorTheme = useCallback((cursorTheme: CursorTheme) => {
    setState((prev) => (prev.cursorTheme === cursorTheme ? prev : { ...prev, cursorTheme }));
  }, []);

  const setIsPointerDown = useCallback((isPointerDown: boolean) => {
    setState((prev) => (prev.isPointerDown === isPointerDown ? prev : { ...prev, isPointerDown }));
  }, []);

  const setIsIdle = useCallback((isIdle: boolean) => {
    setState((prev) => (prev.isIdle === isIdle ? prev : { ...prev, isIdle }));
  }, []);

  const setIsVisible = useCallback((isVisible: boolean) => {
    setState((prev) => (prev.isVisible === isVisible ? prev : { ...prev, isVisible }));
  }, []);

  const setIsTouchDevice = useCallback((isTouchDevice: boolean) => {
    setState((prev) => (prev.isTouchDevice === isTouchDevice ? prev : { ...prev, isTouchDevice }));
  }, []);

  const setGravityRadius = useCallback((radius: number) => {
    gravityRadiusRef.current = radius;
    setState((prev) => ({
      ...prev,
      gravitationalCoords: {
        ...prev.gravitationalCoords,
        radius,
      },
    }));
  }, []);

  const resetCursor = useCallback(() => {
    setState((prev) => ({
      ...prev,
      cursorType: 'default',
      cursorLabel: '',
      cursorTheme: 'default',
    }));
  }, []);

  // Sync with SingularityInteractionEngine to maintain active gravitational coordinate system
  useEffect(() => {
    let lastTime = 0;
    const unsub = interactionEngine.subscribe((engineState) => {
      const now = performance.now();
      // Throttle React state updates to ~30-40fps for UI consumers while engine runs at 60-120fps
      if (now - lastTime < 24) return;
      lastTime = now;

      setState((prev) => ({
        ...prev,
        isPointerDown: engineState.clickCount > 0 && now - engineState.lastClickTime < 300,
        isVisible: true,
        gravitationalCoords: {
          x: engineState.clientX,
          y: engineState.clientY,
          ndcX: engineState.ndcX,
          ndcY: engineState.ndcY,
          radius: gravityRadiusRef.current,
          velocity: {
            x: engineState.vx,
            y: engineState.vy,
            speed: engineState.speed,
          },
          energy: engineState.normalizedEnergy,
          edgePull: {
            x: engineState.edgePullX,
            y: engineState.edgePullY,
            distance: engineState.edgeDistance,
          },
          worldPos: {
            x: engineState.worldPos.x,
            y: engineState.worldPos.y,
            z: engineState.worldPos.z,
          },
        },
      }));
    });

    return () => unsub();
  }, []);

  const value = useMemo<CursorContextValue>(
    () => ({
      ...state,
      setCursorType,
      setCursorLabel,
      setCursorTheme,
      setIsPointerDown,
      setIsIdle,
      setIsVisible,
      setIsTouchDevice,
      resetCursor,
      setGravityRadius,
    }),
    [
      state,
      setCursorType,
      setCursorLabel,
      setCursorTheme,
      setIsPointerDown,
      setIsIdle,
      setIsVisible,
      setIsTouchDevice,
      resetCursor,
      setGravityRadius,
    ]
  );

  return <CursorContext.Provider value={value}>{children}</CursorContext.Provider>;
};

export function useCursor(): CursorContextValue {
  const context = useContext(CursorContext);
  if (!context) {
    return {
      ...defaultCursorState,
      setCursorType: () => {},
      setCursorLabel: () => {},
      setCursorTheme: () => {},
      setIsPointerDown: () => {},
      setIsIdle: () => {},
      setIsVisible: () => {},
      setIsTouchDevice: () => {},
      resetCursor: () => {},
      setGravityRadius: () => {},
    };
  }
  return context;
}
