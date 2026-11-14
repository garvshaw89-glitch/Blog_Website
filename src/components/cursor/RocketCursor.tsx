import React from 'react';
import { CustomCursor, CustomCursorProps } from '../ui/CustomCursor';

export type AsteroidCursorProps = CustomCursorProps;
export type RocketCursorProps = CustomCursorProps;

/**
 * AsteroidCursor:
 * Sculpted miniature cratered asteroid cursor anchored directly onto the crashed
 * entry asteroid landing transition, replacing the default OS cursor on fine pointers.
 */
export const AsteroidCursor: React.FC<AsteroidCursorProps> = (props) => {
  return <CustomCursor {...props} />;
};

export const RocketCursor = AsteroidCursor;
