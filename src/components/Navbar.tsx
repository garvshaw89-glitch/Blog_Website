import React, { useState, useEffect } from 'react';
import { AnimatedTopDock } from '../threeui/AnimatedTopDock';
import '../threeui/threeui.css';
import { rocketCinematicManager, CinematicState } from './matter/rocketCinematicManager';

interface NavbarProps {
  onContactClick?: () => void;
  onOpenCommandPalette?: () => void;
  onReplayIntro?: () => void;
  id?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onContactClick,
  onReplayIntro,
  id = 'main-navbar',
}) => {
  const [cinematicStage, setCinematicStage] = useState<CinematicState['stage']>(
    rocketCinematicManager.state.stage
  );

  useEffect(() => {
    return rocketCinematicManager.subscribe((state) => {
      setCinematicStage(state.stage);
    });
  }, []);

  // During the particle reconstruction and profile hold, hide Navbar completely:
  const isProfileActive =
    cinematicStage === 'PROFILE_FORMING' ||
    cinematicStage === 'PROFILE_RECOGNIZABLE' ||
    cinematicStage === 'PROFILE_LOCKING' ||
    cinematicStage === 'PROFILE_COMPLETE' ||
    cinematicStage === 'PROFILE_HOLD' ||
    cinematicStage === 'TEXT_PREPARE' ||
    cinematicStage === 'NAME_REVEAL' ||
    cinematicStage === 'TAGLINE_REVEAL' ||
    cinematicStage === 'IDENTITY_COMPLETE';

  return (
    <header
      id={id}
      className={`fixed top-4 sm:top-6 left-0 right-0 z-40 pointer-events-none transition-all duration-700 flex justify-center px-4 sm:px-8 ${
        isProfileActive ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="pointer-events-auto w-full max-w-6xl flex justify-center">
        <AnimatedTopDock
          variant="modern"
          proximity={122}
          spring={0.19}
          damping={0.7}
          widthGrowth={17}
          heightGrowth={16}
          drop={3.5}
          standaloneBar={true}
          onContactClick={onContactClick}
          onReplayIntro={onReplayIntro}
          onResumeClick={() => {
            window.open("https://linkedin.com/in/garvshaw", "_blank", "noopener,noreferrer");
          }}
        />
      </div>
    </header>
  );
};
