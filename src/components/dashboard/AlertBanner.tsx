'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Loader, X } from 'lucide-react';

interface AlertBannerProps {
  siteName: string;
  selectorId: string;
  status: 'detecting' | 'repairing' | 'success' | 'failed';
  message?: string;
  onDismiss?: () => void;
  autoClose?: boolean;
}

export function AlertBanner({
  siteName,
  selectorId,
  status,
  message,
  onDismiss,
  autoClose = true,
}: AlertBannerProps): React.ReactElement | null {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!autoClose || (status !== 'success' && status !== 'failed')) {
      return;
    }

    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, 4000);

    return () => clearTimeout(timer);
  }, [status, onDismiss, autoClose]);

  if (!visible) return null;

  const statusConfig = {
    detecting: {
      bgColor: 'bg-slate-900/80 border-slate-800',
      textColor: 'text-slate-200',
      accentColor: 'text-blue-400',
      icon: Loader,
      title: 'Detecting changes...',
      showSpinner: true,
    },
    repairing: {
      bgColor: 'bg-slate-900/80 border-slate-800',
      textColor: 'text-slate-200',
      accentColor: 'text-amber-400',
      icon: AlertTriangle,
      title: 'Repairing selectors...',
      showSpinner: true,
    },
    success: {
      bgColor: 'bg-slate-900/80 border-slate-800',
      textColor: 'text-slate-200',
      accentColor: 'text-green-400',
      icon: CheckCircle,
      title: 'Repair successful!',
      showSpinner: false,
    },
    failed: {
      bgColor: 'bg-slate-900/80 border-slate-800',
      textColor: 'text-slate-200',
      accentColor: 'text-red-400',
      icon: AlertCircle,
      title: 'Repair failed',
      showSpinner: false,
    },
  };

  const config = statusConfig[status];
  const IconComponent = config.icon;

  return (
    <div
      className={`fixed top-6 right-6 max-w-md rounded-xl border backdrop-blur-sm ${config.bgColor} p-4 shadow-xl z-50 animate-slideIn`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className={`flex-shrink-0 mt-0.5 ${config.accentColor}`}>
            {config.showSpinner ? (
              <Loader size={20} className="animate-spin" />
            ) : (
              <IconComponent size={20} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-semibold ${config.accentColor}`}>{config.title}</p>
            <p className={`text-sm mt-1 ${config.textColor} opacity-80`}>
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
          onClick={() => {
            setVisible(false);
            onDismiss?.();
          }}
          className="flex-shrink-0 text-slate-500 hover:text-slate-300 transition-colors"
          aria-label="Dismiss alert"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
