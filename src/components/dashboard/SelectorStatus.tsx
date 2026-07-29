'use client';

import React from 'react';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

export type SelectorHealthStatus = 'working' | 'broken' | 'failed';

interface SelectorStatusProps {
  status: SelectorHealthStatus;
  selectorId: string;
  currentSelector: string;
  lastRepaired?: string;
  compact?: boolean;
}

export function SelectorStatus({
  status,
  selectorId,
  currentSelector,
  lastRepaired,
  compact = false,
}: SelectorStatusProps): React.ReactElement {
  const statusConfig = {
    working: {
      badgeBg: 'bg-green-500/20',
      badgeText: 'text-green-400',
      icon: CheckCircle,
      label: 'Working',
      dotColor: 'bg-green-500',
      animateDot: false,
    },
    broken: {
      badgeBg: 'bg-amber-500/20',
      badgeText: 'text-amber-400',
      icon: AlertTriangle,
      label: 'Broken',
      dotColor: 'bg-amber-500',
      animateDot: true,
    },
    failed: {
      badgeBg: 'bg-red-500/20',
      badgeText: 'text-red-400',
      icon: XCircle,
      label: 'Failed',
      dotColor: 'bg-red-500',
      animateDot: false,
    },
  };

  const config = statusConfig[status];
  const IconComponent = config.icon;

  if (compact) {
    return (
      <div className="inline-flex items-center">
        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${config.badgeBg} ${config.badgeText}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${config.dotColor} ${config.animateDot ? 'animate-pulse' : ''}`} />
          {config.label}
        </span>
      </div>
    );
  }

  return (
    <div className="card gradient-bg p-6">
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 p-2 rounded-lg ${config.badgeBg}`}>
          <IconComponent size={20} className={config.badgeText} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`font-semibold ${config.badgeText}`}>
              {config.label}
            </p>
            {config.animateDot && (
              <div className={`w-1.5 h-1.5 rounded-full ${config.dotColor} animate-pulse`} />
            )}
          </div>

          <div className="mt-3 space-y-2 text-xs text-slate-400">
            <p className="font-mono break-all bg-slate-800/50 p-2 rounded">
              {currentSelector}
            </p>
            <p>ID: <span className="text-slate-300">{selectorId.substring(0, 16)}...</span></p>
            {lastRepaired && (
              <p>Last repaired: <span className="text-slate-300">{new Date(lastRepaired).toLocaleDateString()}</span></p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
