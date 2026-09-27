import React from 'react';
import { useCursor } from '../../context/CursorContext';
import { CursorInteractionManager } from './CursorInteractionManager';
import { CursorCore } from './CursorCore';
import { CursorRing } from './CursorRing';
import { CursorGlow } from './CursorGlow';
import { CursorTrail } from './CursorTrail';
import { CursorRipple } from './CursorRipple';

export const CustomCursor: React.FC = () => {
  const {
    cursorType,
    cursorLabel,
    cursorTheme,
    isPointerDown,
    isIdle,
    isVisible,
    isTouchDevice,
  } = useCursor();

  // On touch/mobile devices or when pointer leaves window, render nothing
  if (isTouchDevice || !isVisible) {
    return null;
  }

  return (
    <CursorInteractionManager>
      {({
        mouseX,
        mouseY,
        smoothX,
        smoothY,
        glowX,
        glowY,
        velocityScaleX,
        velocityScaleY,
        velocityAngle,
        trailPoints,
        ripples,
        currentSpeed,
        onRippleComplete,
        prefersReducedMotion,
      }) => (
        <div
          aria-hidden="true"
          className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden select-none transition-opacity duration-300"
          style={{ opacity: isVisible ? 1 : 0 }}
        >
          {/* 1. Atmospheric Ambient Lighting Glow */}
          <CursorGlow
            x={glowX}
            y={glowY}
            cursorTheme={cursorTheme}
            isVisible={isVisible}
            prefersReducedMotion={prefersReducedMotion}
          />

          {/* 2. Micro Particle Trail (visible only on brisk motion) */}
          <CursorTrail
            points={trailPoints}
            speed={currentSpeed}
            cursorTheme={cursorTheme}
            prefersReducedMotion={prefersReducedMotion}
          />

          {/* 3. Click Expanding Ripple */}
          <CursorRipple
            ripples={ripples}
            cursorTheme={cursorTheme}
            prefersReducedMotion={prefersReducedMotion}
            onRippleComplete={onRippleComplete}
          />

          {/* 4. Outer Glass Follower Ring with Velocity Stretcher & Dynamic Labels */}
          <CursorRing
            x={smoothX}
            y={smoothY}
            cursorType={cursorType}
            cursorLabel={cursorLabel}
            cursorTheme={cursorTheme}
            isPointerDown={isPointerDown}
            isIdle={isIdle}
            velocityScaleX={velocityScaleX}
            velocityScaleY={velocityScaleY}
            velocityAngle={velocityAngle}
            prefersReducedMotion={prefersReducedMotion}
          />

          {/* 5. Zero-Lag High-Contrast Precision Core */}
          <CursorCore
            x={mouseX}
            y={mouseY}
            cursorType={cursorType}
            cursorTheme={cursorTheme}
            isPointerDown={isPointerDown}
            isIdle={isIdle}
            prefersReducedMotion={prefersReducedMotion}
          />
        </div>
      )}
    </CursorInteractionManager>
  );
};
