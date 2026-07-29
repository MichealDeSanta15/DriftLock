'use client';

import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
    positive: boolean;
  };
  className?: string;
}

export function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
  className = '',
}: StatsCardProps): React.ReactElement {
  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors duration-300 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-4xl font-bold text-white">{value}</p>
            {trend && (
              <span className={`text-sm font-medium ${trend.positive ? 'text-green-400' : 'text-red-400'}`}>
                {trend.positive ? '↑' : '↓'} {trend.value}% {trend.label}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-slate-500 mt-2">{description}</p>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 p-3 bg-slate-800/50 rounded-lg text-indigo-400">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
