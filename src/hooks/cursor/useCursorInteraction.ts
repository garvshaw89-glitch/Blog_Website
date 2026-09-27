import React, { useCallback } from 'react';
import { useCursor, CursorType, CursorTheme } from './useCursor';

interface CursorInteractionOptions {
  type?: CursorType;
  label?: string;
  theme?: CursorTheme;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: (e: React.MouseEvent) => void;
}

/**
 * Hook to attach custom cursor hover interactions to components or elements.
 * Example:
 *   const cursorProps = useCursorInteraction({ type: 'project', label: 'EXPLORE' });
 *   return <div {...cursorProps}>...</div>
 */
export function useCursorInteraction(options: CursorInteractionOptions = {}) {
  const { type = 'pointer', label = '', theme, onMouseEnter, onMouseLeave } = options;
  const { setCursorType, setCursorLabel, setCursorTheme, resetCursor } = useCursor();

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent) => {
      setCursorType(type);
      if (label) setCursorLabel(label);
      if (theme) setCursorTheme(theme);
      if (onMouseEnter) onMouseEnter(e);
    },
    [type, label, theme, setCursorType, setCursorLabel, setCursorTheme, onMouseEnter]
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent) => {
      resetCursor();
      if (onMouseLeave) onMouseLeave(e);
    },
    [resetCursor, onMouseLeave]
  );

  return {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    'data-cursor': type,
    ...(label ? { 'data-cursor-label': label } : {}),
  };
}
