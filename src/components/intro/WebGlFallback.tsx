import React from 'react';
import { IntroOverlay } from './IntroOverlay';

interface WebGlFallbackProps {
  scrollProgressRef: React.RefObject<number>;
  zoomProgressRef: React.RefObject<number>;
  isAudioOn: boolean;
  onToggleAudio: () => void;
  isTransitioning: boolean;
}

export const WebGlFallback: React.FC<WebGlFallbackProps> = ({
  scrollProgressRef,
  zoomProgressRef,
  isAudioOn,
  onToggleAudio,
  isTransitioning,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-transparent overflow-hidden select-none">
      <IntroOverlay
        scrollProgressRef={scrollProgressRef}
        zoomProgressRef={zoomProgressRef}
        isAudioOn={isAudioOn}
        onToggleAudio={onToggleAudio}
        isTransitioning={isTransitioning}
      />
    </div>
  );
};
