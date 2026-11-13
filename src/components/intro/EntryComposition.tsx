import React from 'react';
import { motion } from 'motion/react';
import { Volume2, VolumeX } from 'lucide-react';

interface EntryCompositionProps {
  isExiting: boolean;
  isAudioOn: boolean;
  onToggleAudio: () => void;
}

const EDITORIAL_EASE: [number, number, number, number] = [0.22, 1, 0.3, 1];

/**
 * ENTRY COMPOSITION (Act 1 Overlay)
 *
 * Pure minimal film-grain & top-right audio toggle only.
 * Zero extra letters, taglines, skip links, or buttons — keeping full focus
 * on the THINK. -> CREATE. -> DISCOVER. sand-particle typography.
 */
export const EntryComposition: React.FC<EntryCompositionProps> = ({
  isExiting,
  isAudioOn,
  onToggleAudio,
}) => {
  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-between pointer-events-none select-none overflow-hidden pt-[max(1.25rem,env(safe-area-inset-top))] pr-[max(1.25rem,env(safe-area-inset-right))] pb-6 pl-6 sm:p-10">
      {/* Subtle atmospheric film grain layer */}
      <div
        aria-hidden="true"
        className="intro-film-grain pointer-events-none fixed inset-0 opacity-[0.038] mix-blend-screen"
      />

      {/* Top-right minimal sound toggle matching portal audio button */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: isExiting ? 0 : 1, y: 0 }}
        transition={{ duration: 0.45, ease: EDITORIAL_EASE }}
        className="w-full flex items-center justify-end z-20"
      >
        <button
          type="button"
          onClick={onToggleAudio}
          data-cursor="button"
          data-cursor-label={isAudioOn ? 'MUTE' : 'SOUND'}
          aria-label={isAudioOn ? 'Mute ambient sound' : 'Enable ambient sound'}
          className="pointer-events-auto flex items-center justify-center w-10 h-10 rounded-full border border-white/12 hover:border-white/25 bg-[#0a0d14]/90 text-[#A1A1AA] hover:text-[#F4F4F5] transition-colors duration-200 cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
        >
          {isAudioOn ? (
            <Volume2 className="w-4 h-4 text-cyan-400" />
          ) : (
            <VolumeX className="w-4 h-4 text-neutral-500" />
          )}
        </button>
      </motion.div>
    </div>
  );
};
