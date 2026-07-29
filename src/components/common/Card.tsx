'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion, hoverLift } from '@/lib/motion';

interface CardProps {
  children: React.ReactNode;
  hover?: boolean;
  className?: string;
  onClick?: () => void;
}

export function Card({
  children,
  hover = false,
  className = '',
  onClick,
}: CardProps): React.ReactElement {
  const reducedMotion = useReducedMotion();
  const baseClasses = 'bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden';
  const hoverClasses = hover
    ? 'transition-colors duration-300 hover:border-slate-700 hover:shadow-xl hover:shadow-indigo-500/10 cursor-pointer'
    : '';

  return (
    <motion.div
      className={`${baseClasses} ${hoverClasses} ${className}`}
      onClick={onClick}
      whileHover={hover && !reducedMotion ? hoverLift : undefined}
    >
      {children}
    </motion.div>
  );
}
