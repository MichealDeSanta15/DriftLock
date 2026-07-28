'use client';

import React, { useState, useEffect } from 'react';

interface AlertBannerProps {
  siteName: string;
  selectorId: string;
  status: 'detecting' | 'repairing' | 'success' | 'failed';
  message?: string;
  onDismiss?: () => void;
}

export function AlertBanner({
  siteName,
  selectorId,
  status,
  message,
  onDismiss,
}: AlertBannerProps): React.ReactElement | null {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (status === 'success' || status === 'failed') {
      const timer = setTimeout(() => {
        setVisible(false);
        onDismiss?.();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [status, onDismiss]);

  if (!visible) return null;

  const statusConfig = {
    detecting: {
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      icon: '🔍',
      title: 'Detecting change...',
    },
    repairing: {
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      icon: '⚙️',
      title: 'Repairing selector...',
    },
    success: {
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      icon: '✅',
      title: 'Repair successful!',
    },
    failed: {
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      icon: '❌',
      title: 'Repair failed',
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={`fixed top-6 right-6 max-w-md rounded-lg border ${config.bgColor} ${config.borderColor} p-4 shadow-lg z-50`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="text-xl">{config.icon}</span>
          <div>
            <p className="font-medium text-gray-900">{config.title}</p>
            <p className="text-sm text-gray-700 mt-1">
              {message || `Selector for ${siteName} (ID: ${selectorId})`}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setVisible(false);
            onDismiss?.();
          }}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
