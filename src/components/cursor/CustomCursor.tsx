import React from 'react';
import { useCursor } from '../../context/CursorContext';
import { CursorInteractionManager } from './CursorInteractionManager';
import { CursorCore } from './CursorCore';
import { CursorRing } from './CursorRing';
import { CursorGlow } from './CursorGlow';
import { CursorTrail } from './CursorTrail';
import { CursorMicroParticles } from './CursorMicroParticles';
import { CursorRipple } from './CursorRipple';
import './cursor.css';

export interface CustomCursorProps {
  /** Configurable magnetic attraction strength (default: 0.22, recommended range: 0.15 - 0.30) */
  magneticStrength?: number;
}

export const CustomCursor: React.FC<CustomCursorProps> = ({ magneticStrength }) => {
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
    <CursorInteractionManager magneticStrength={magneticStrength}>
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
        microParticles,
        ripples,
        currentSpeed,
        scrollSpeed,
        entranceScale,
        entranceOpacity,
        onRippleComplete,
        prefersReducedMotion,
      }) => (
        <div
          aria-hidden="true"
          className="fixed inset-0 pointer-events-none z-[99999] overflow-hidden select-none transition-opacity duration-300"
          style={{
            opacity: isVisible ? entranceOpacity : 0,
            transform: `scale(${entranceScale})`,
            transformOrigin: 'center center',
          }}
        >
          {/* 1. Atmospheric Ambient Lighting Glow */}
          <CursorGlow
            x={glowX}
            y={glowY}
            cursorTheme={cursorTheme}
            isVisible={isVisible}
            prefersReducedMotion={prefersReducedMotion}
          />

          {/* 2. Micro Spark Particles (generated on high velocity flicks) */}
          <CursorMicroParticles
            particles={microParticles}
            cursorTheme={cursorTheme}
            prefersReducedMotion={prefersReducedMotion}
          />

          {/* 3. 5–10 Staggered Trailing Particles */}
          <CursorTrail
            points={trailPoints}
            speed={currentSpeed}
            scrollSpeed={scrollSpeed}
            cursorTheme={cursorTheme}
            prefersReducedMotion={prefersReducedMotion}
          />

          {/* 4. Click Expanding Ripple */}
          <CursorRipple
            ripples={ripples}
            cursorTheme={cursorTheme}
            prefersReducedMotion={prefersReducedMotion}
            onRippleComplete={onRippleComplete}
          />

          {/* 5. Outer Glass Follower Ring with Velocity Stretcher, Rotation & Dynamic Labels */}
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

          {/* 6. Zero-Lag High-Contrast Precision Center Dot */}
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
