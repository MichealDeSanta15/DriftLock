'use client';

import React from 'react';

type BadgeColor = 'green' | 'amber' | 'red' | 'blue' | 'indigo' | 'slate';

interface BadgeProps {
  label: string;
  color?: BadgeColor;
  icon?: React.ReactNode;
  animate?: boolean;
  className?: string;
}

export function Badge({
  label,
  color = 'slate',
  icon,
  animate = false,
  className = '',
}: BadgeProps): React.ReactElement {
  const colorClasses = {
    green: 'bg-green-500/20 text-green-400',
    amber: 'bg-amber-500/20 text-amber-400',
    red: 'bg-red-500/20 text-red-400',
    blue: 'bg-blue-500/20 text-blue-400',
    indigo: 'bg-indigo-500/20 text-indigo-400',
    slate: 'bg-slate-800 text-slate-300',
  };

  const bgColor = {
    green: 'bg-green-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    indigo: 'bg-indigo-500',
    slate: 'bg-slate-600',
  };

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${colorClasses[color]} ${className}`}>
      {icon ? (
        <>
          {animate ? (
            <div className={`w-1.5 h-1.5 rounded-full ${bgColor[color]} animate-pulse`} />
          ) : (
            <div className={`w-1.5 h-1.5 rounded-full ${bgColor[color]}`} />
          )}
          <span>{label}</span>
        </>
      ) : (
        label
      )}
    </span>
  );
}
