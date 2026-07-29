'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/lib/motion';

interface AuroraBackgroundProps {
  /** Marketing pages want a bigger, more prominent effect than app screens. */
  intensity?: 'subtle' | 'prominent';
}

export function AuroraBackground({ intensity = 'subtle' }: AuroraBackgroundProps): React.ReactElement {
  const reducedMotion = useReducedMotion();
  const opacity = intensity === 'prominent' ? 0.35 : 0.15;

  const blobs = [
    { className: 'bg-indigo-600 -top-40 -left-40 w-[32rem] h-[32rem]', duration: 22, x: [0, 60, 0], y: [0, 40, 0] },
    { className: 'bg-purple-600 top-1/3 -right-40 w-[28rem] h-[28rem]', duration: 26, x: [0, -50, 0], y: [0, 60, 0] },
    { className: 'bg-indigo-500 bottom-0 left-1/4 w-[26rem] h-[26rem]', duration: 30, x: [0, 40, 0], y: [0, -50, 0] },
  ];

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10" aria-hidden="true">
      {blobs.map((blob, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full blur-3xl ${blob.className}`}
          style={{ opacity }}
          animate={reducedMotion ? undefined : { x: blob.x, y: blob.y }}
          transition={reducedMotion ? undefined : { duration: blob.duration, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}
