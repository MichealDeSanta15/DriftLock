'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/lib/motion';

interface ProgressBarProps {
  percentage: number;
  color?: string;
  trackClassName?: string;
  heightClassName?: string;
}

export function ProgressBar({
  percentage,
  color = 'linear-gradient(to right, #6366f1, #a855f7)',
  trackClassName = 'bg-slate-800',
  heightClassName = 'h-2',
}: ProgressBarProps): React.ReactElement {
  const reducedMotion = useReducedMotion();
  const clamped = Math.max(0, Math.min(100, percentage));

  return (
    <div className={`w-full ${heightClassName} rounded-full overflow-hidden ${trackClassName}`}>
      <motion.div
        className={`${heightClassName} rounded-full`}
        style={{ background: color }}
        initial={{ width: '0%' }}
        animate={{ width: `${clamped}%` }}
        transition={reducedMotion ? { duration: 0.01 } : { duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}
