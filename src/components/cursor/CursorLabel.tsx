import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CursorType, CursorTheme } from '../../context/CursorContext';
import { ArrowUpRight } from 'lucide-react';

interface CursorLabelProps {
  cursorType: CursorType;
  cursorLabel?: string;
  cursorTheme: CursorTheme;
}

export const CursorLabel: React.FC<CursorLabelProps> = ({
  cursorType,
  cursorLabel,
  cursorTheme,
}) => {
  // Determine effective label text
  let labelText = cursorLabel || '';
  let showExternalArrow = false;

  if (!labelText) {
    if (cursorType === 'project') {
      labelText = 'VIEW';
    } else if (cursorType === 'image') {
      labelText = 'EXPLORE';
    } else if (cursorType === 'external') {
      labelText = 'OPEN';
      showExternalArrow = true;
    } else if (cursorType === 'drag') {
      labelText = 'DRAG';
    } else if (cursorType === 'link' && cursorLabel) {
      labelText = cursorLabel;
    }
  } else if (cursorType === 'external') {
    showExternalArrow = true;
  }

  const getTextColor = () => {
    switch (cursorTheme) {
      case 'light':
        return 'text-slate-100';
      case 'violet':
        return 'text-indigo-200';
      case 'cyan':
      default:
        return 'text-cyan-300';
    }
  };

  return (
    <AnimatePresence mode="wait">
      {labelText && (
        <motion.div
          key={labelText}
          initial={{ opacity: 0, scale: 0.85, filter: 'blur(2px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 0.85, filter: 'blur(2px)' }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className={`flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-widest whitespace-nowrap select-none pointer-events-none ${getTextColor()}`}
        >
          <span>{labelText}</span>
          {showExternalArrow && <ArrowUpRight className="w-2.5 h-2.5 opacity-80" />}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
