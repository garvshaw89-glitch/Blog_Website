import React from 'react';
import { CustomCursor, CustomCursorProps } from '../ui/CustomCursor';

export type RocketCursorProps = CustomCursorProps;

/**
 * RocketCursor:
 * Desktop interactive miniature particle rocket cursor with velocity banking,
 * hover boost, click bursts, native text-input restoration, and mobile touch feedback.
 */
export const RocketCursor: React.FC<RocketCursorProps> = (props) => {
  return <CustomCursor {...props} />;
};
