'use client';

import React from 'react';
import { motion, type Variants } from 'framer-motion';
import { CountUp } from '@/components/common/CountUp';
import { ProgressRing } from '@/components/common/ProgressRing';
import { ProgressBar } from '@/components/common/ProgressBar';
import { EASE_OUT, hoverLift, useReducedMotion } from '@/lib/motion';

type StatVisual = 'none' | 'ring' | 'bar';

interface StatsCardProps {
  title: string;
  value: number;
  suffix?: string;
  description?: string;
  icon?: React.ReactNode;
  visual?: StatVisual;
  trend?: {
    value: number;
    label: string;
    positive: boolean;
  };
  className?: string;
}

export const statsCardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_OUT } },
};

export function StatsCard({
  title,
  value,
  suffix = '',
  description,
  icon,
  visual = 'none',
  trend,
  className = '',
}: StatsCardProps): React.ReactElement {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      variants={statsCardVariants}
      whileHover={reducedMotion ? undefined : hoverLift}
      className={`bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 hover:shadow-xl hover:shadow-indigo-500/10 transition-colors duration-300 ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-4xl font-bold text-white">
              <CountUp value={value} suffix={suffix} />
            </p>
            {trend && (
              <span className={`text-sm font-medium ${trend.positive ? 'text-green-400' : 'text-red-400'}`}>
                {trend.positive ? '↑' : '↓'} {trend.value}% {trend.label}
              </span>
            )}
          </div>
          {description && <p className="text-xs text-slate-500 mt-2">{description}</p>}
          {visual === 'bar' && (
            <div className="mt-4">
              <ProgressBar percentage={value} />
            </div>
          )}
        </div>

        {visual === 'ring' ? (
          <div className="relative flex-shrink-0 flex items-center justify-center">
            <ProgressRing percentage={value} />
            <span className="absolute text-xs font-semibold text-white">{Math.round(value)}%</span>
          </div>
        ) : icon ? (
          <div className="flex-shrink-0 p-3 bg-slate-800/50 rounded-lg text-indigo-400">{icon}</div>
        ) : null}
      </div>
    </motion.div>
  );
}
