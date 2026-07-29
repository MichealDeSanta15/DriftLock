'use client';

import React, { useState, useEffect } from 'react';

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
    }, 5000);

    return () => clearTimeout(timer);
  }, [status, onDismiss, autoClose]);

  if (!visible) return null;

  const statusConfig = {
    detecting: {
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-700',
      textColor: 'text-blue-900 dark:text-blue-200',
      icon: '🔍',
      title: 'Detecting changes...',
    },
    repairing: {
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      borderColor: 'border-amber-200 dark:border-amber-700',
      textColor: 'text-amber-900 dark:text-amber-200',
      icon: '⚙️',
      title: 'Repairing selectors...',
    },
    success: {
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-700',
      textColor: 'text-green-900 dark:text-green-200',
      icon: '✅',
      title: 'Repair successful!',
    },
    failed: {
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-700',
      textColor: 'text-red-900 dark:text-red-200',
      icon: '❌',
      title: 'Repair failed',
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={`fixed top-6 right-6 max-w-md rounded-lg border ${config.bgColor} ${config.borderColor} p-4 shadow-lg z-50 animate-slideIn`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <span className="text-xl flex-shrink-0">{config.icon}</span>
          <div className="flex-1">
            <p className={`font-semibold ${config.textColor}`}>{config.title}</p>
            <p className={`text-sm mt-2 ${config.textColor} opacity-90`}>
              {message || (
                <>
                  Site: <strong>{siteName}</strong>
                  {selectorId && (
                    <>
                      <br />
                      Selector: <code className="text-xs bg-black/10 dark:bg-black/30 px-1 rounded">
                        {selectorId}
                      </code>
                    </>
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
          className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400 flex-shrink-0 text-lg"
          aria-label="Dismiss alert"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
