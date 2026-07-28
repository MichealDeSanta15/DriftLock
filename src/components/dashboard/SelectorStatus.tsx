'use client';

import React from 'react';

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
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      badgeColor: 'bg-green-600',
      icon: '✅',
      label: 'Working',
    },
    broken: {
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      badgeColor: 'bg-yellow-600',
      icon: '⚠️',
      label: 'Broken',
    },
    failed: {
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      badgeColor: 'bg-red-600',
      icon: '❌',
      label: 'Repair Failed',
    },
  };

  const config = statusConfig[status];

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
          {config.icon} {config.label}
        </span>
      </div>
    );
  }

  return (
    <div className={`rounded-lg p-4 ${config.bgColor}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm font-medium ${config.textColor}`}>
            {config.icon} {config.label}
          </p>
          <p className="text-xs text-gray-600 mt-1">ID: {selectorId}</p>
          <p className="text-xs text-gray-600 mt-1 font-mono break-all">{currentSelector}</p>
          {lastRepaired && (
            <p className="text-xs text-gray-600 mt-2">
              Last repaired: {new Date(lastRepaired).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
