import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

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

export interface CursorState {
  cursorType: CursorType;
  cursorLabel: string;
  cursorTheme: CursorTheme;
  isPointerDown: boolean;
  isIdle: boolean;
  isVisible: boolean;
  isTouchDevice: boolean;
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
}

const defaultCursorState: CursorState = {
  cursorType: 'default',
  cursorLabel: '',
  cursorTheme: 'default',
  isPointerDown: false,
  isIdle: false,
  isVisible: false,
  isTouchDevice: false,
};

const CursorContext = createContext<CursorContextValue | null>(null);

export const CursorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<CursorState>(defaultCursorState);

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

  const resetCursor = useCallback(() => {
    setState((prev) => ({
      ...prev,
      cursorType: 'default',
      cursorLabel: '',
      cursorTheme: 'default',
    }));
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
    ]
  );

  return <CursorContext.Provider value={value}>{children}</CursorContext.Provider>;
};

export function useCursor(): CursorContextValue {
  const context = useContext(CursorContext);
  if (!context) {
    // Return a graceful fallback if used outside CursorProvider
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
    };
  }
  return context;
}
