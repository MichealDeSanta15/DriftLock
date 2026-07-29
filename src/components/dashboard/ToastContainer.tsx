'use client';

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { AlertBanner, type AlertBannerStatus } from './AlertBanner';

export interface ToastItem {
  id: string;
  siteName: string;
  selectorId: string;
  status: AlertBannerStatus;
  message?: string;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps): React.ReactElement {
  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 items-end pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <AlertBanner
            key={toast.id}
            siteName={toast.siteName}
            selectorId={toast.selectorId}
            status={toast.status}
            message={toast.message}
            onDismiss={() => onDismiss(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
