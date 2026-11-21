import React from 'react';
import { motion } from 'motion/react';
import { ExternalLink } from 'lucide-react';

interface LiveProjectButtonProps {
  url?: string;
  onClick?: () => void;
  className?: string;
  label?: string;
  id?: string;
}

export const LiveProjectButton: React.FC<LiveProjectButtonProps> = ({
  url,
  onClick,
  className = '',
  label = 'Live Project',
  id = 'live-project-btn',
}) => {
  const sharedClassName = `group inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-[#0A141E]/95 text-cyan-300 font-medium uppercase tracking-widest text-sm sm:text-base px-6 py-2.5 sm:px-8 sm:py-3 transition-all duration-300 hover:bg-cyan-500/20 hover:border-cyan-300 hover:text-white hover:shadow-[0_0_25px_rgba(6,182,212,0.45)] cursor-pointer whitespace-nowrap ${className}`;

  if (url && !onClick) {
    return (
      <motion.a
        id={id}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        data-magnetic="true"
        data-cursor="external"
        data-cursor-label="LIVE"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={sharedClassName}
      >
        <span>{label}</span>
        <ExternalLink className="w-4 h-4 text-cyan-400 group-hover:text-white transition-colors" />
      </motion.a>
    );
  }

  return (
    <motion.button
      id={id}
      type="button"
      data-magnetic="true"
      data-cursor="button"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      onClick={onClick}
      className={sharedClassName}
    >
      <span>{label}</span>
      <ExternalLink className="w-4 h-4 text-cyan-400 group-hover:text-white transition-colors" />
    </motion.button>
  );
};
