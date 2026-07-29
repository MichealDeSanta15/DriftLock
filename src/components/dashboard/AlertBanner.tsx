'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, AlertTriangle, Loader, X } from 'lucide-react';
import { useReducedMotion, slideInRight } from '@/lib/motion';

export type AlertBannerStatus = 'detecting' | 'repairing' | 'success' | 'failed';

interface AlertBannerProps {
  siteName: string;
  selectorId: string;
  status: AlertBannerStatus;
  message?: string;
  onDismiss?: () => void;
  autoClose?: boolean;
  autoCloseDuration?: number;
}

const DEFAULT_AUTO_CLOSE_MS = 4000;

export function AlertBanner({
  siteName,
  selectorId,
  status,
  message,
  onDismiss,
  autoClose = true,
  autoCloseDuration = DEFAULT_AUTO_CLOSE_MS,
}: AlertBannerProps): React.ReactElement {
  const reducedMotion = useReducedMotion();
  const shouldAutoClose = autoClose && (status === 'success' || status === 'failed');

  useEffect(() => {
    if (!shouldAutoClose) return;

    const timer = setTimeout(() => onDismiss?.(), autoCloseDuration);
    return () => clearTimeout(timer);
  }, [shouldAutoClose, autoCloseDuration, onDismiss]);

  const statusConfig = {
    detecting: {
      accentColor: 'text-blue-400',
      progressColor: 'bg-blue-500',
      icon: Loader,
      title: 'Detecting changes...',
      showSpinner: true,
    },
    repairing: {
      accentColor: 'text-amber-400',
      progressColor: 'bg-amber-500',
      icon: AlertTriangle,
      title: 'Repairing selectors...',
      showSpinner: true,
    },
    success: {
      accentColor: 'text-green-400',
      progressColor: 'bg-green-500',
      icon: CheckCircle,
      title: 'Repair successful!',
      showSpinner: false,
    },
    failed: {
      accentColor: 'text-red-400',
      progressColor: 'bg-red-500',
      icon: AlertCircle,
      title: 'Repair failed',
      showSpinner: false,
    },
  };

  const config = statusConfig[status];
  const IconComponent = config.icon;

  return (
    <motion.div
      layout
      variants={slideInRight}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="relative w-full max-w-md rounded-xl border bg-slate-900/80 border-slate-800 backdrop-blur-sm shadow-xl overflow-hidden pointer-events-auto"
    >
      <div className="p-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className={`flex-shrink-0 mt-0.5 ${config.accentColor}`}>
            {config.showSpinner ? (
              <Loader size={20} className="animate-spin" />
            ) : (
              <motion.span
                initial={reducedMotion ? undefined : { scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                <IconComponent size={20} />
              </motion.span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-semibold ${config.accentColor}`}>{config.title}</p>
            <p className="text-sm mt-1 text-slate-200 opacity-80">
              {message || (
                <>
                  <span className="block">
                    Site: <span className="font-medium text-white">{siteName}</span>
                  </span>
                  {selectorId && (
                    <span className="block text-xs mt-1 font-mono text-slate-400">
                      ID: {selectorId.substring(0, 20)}
                    </span>
                  )}
                </>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={() => onDismiss?.()}
          className="flex-shrink-0 text-slate-500 hover:text-slate-300 transition-colors"
          aria-label="Dismiss alert"
        >
          <X size={18} />
        </button>
      </div>

      {shouldAutoClose && (
        <motion.div
          key={`progress-${status}`}
          className={`absolute bottom-0 left-0 h-1 ${config.progressColor}`}
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={
            reducedMotion ? { duration: 0.01 } : { duration: autoCloseDuration / 1000, ease: 'linear' }
          }
        />
      )}
    </motion.div>
  );
}
