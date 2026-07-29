'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { useReducedMotion } from '@/lib/motion';

export type SelectorHealthStatus = 'working' | 'broken' | 'failed';

interface SelectorStatusProps {
  status: SelectorHealthStatus;
  selectorId: string;
  currentSelector: string;
  lastRepaired?: string;
  compact?: boolean;
}

const statusConfig = {
  working: {
    badgeBg: 'bg-green-500/20',
    badgeText: 'text-green-400',
    icon: CheckCircle,
    label: 'Working',
    dotColor: 'bg-green-500',
    ringColor: 'bg-green-500',
    pulse: false,
  },
  broken: {
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-400',
    icon: AlertTriangle,
    label: 'Broken',
    dotColor: 'bg-amber-500',
    ringColor: 'bg-amber-500',
    pulse: true,
  },
  failed: {
    badgeBg: 'bg-red-500/20',
    badgeText: 'text-red-400',
    icon: XCircle,
    label: 'Failed',
    dotColor: 'bg-red-500',
    ringColor: 'bg-red-500',
    pulse: false,
  },
} as const;

interface PulseDotProps {
  color: string;
  ringColor: string;
  pulse: boolean;
}

function PulseDot({ color, ringColor, pulse }: PulseDotProps): React.ReactElement {
  const reducedMotion = useReducedMotion();

  return (
    <span className="relative inline-flex w-1.5 h-1.5">
      {pulse && !reducedMotion && (
        <motion.span
          className={`absolute inline-flex h-full w-full rounded-full ${ringColor}`}
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
        />
      )}
      <span className={`relative inline-flex rounded-full w-1.5 h-1.5 ${color}`} />
    </span>
  );
}

export function SelectorStatus({
  status,
  selectorId,
  currentSelector,
  lastRepaired,
  compact = false,
}: SelectorStatusProps): React.ReactElement {
  const reducedMotion = useReducedMotion();
  const config = statusConfig[status];
  const IconComponent = config.icon;

  if (compact) {
    return (
      <div className="inline-flex items-center">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={status}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2 }}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${config.badgeBg} ${config.badgeText}`}
          >
            <PulseDot color={config.dotColor} ringColor={config.ringColor} pulse={config.pulse} />
            {config.label}
          </motion.span>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="card gradient-bg p-6">
      <div className="flex items-start gap-4">
        <div className="relative flex-shrink-0">
          {config.pulse && !reducedMotion && (
            <motion.span
              className={`absolute inset-0 rounded-lg ${config.ringColor}`}
              initial={{ opacity: 0.4, scale: 1 }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
          <div className={`relative p-2 rounded-lg ${config.badgeBg}`}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={status}
                initial={{ opacity: 0, scale: 0.7, rotate: -15 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.25 }}
                className="block"
              >
                <IconComponent size={20} className={config.badgeText} />
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={status}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 6 }}
                transition={{ duration: 0.2 }}
                className={`font-semibold ${config.badgeText}`}
              >
                {config.label}
              </motion.p>
            </AnimatePresence>
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
