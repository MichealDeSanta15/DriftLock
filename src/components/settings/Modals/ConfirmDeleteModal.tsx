'use client';

import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { parseAPIError, handleAPIError } from '@/lib/errorHandler';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';

const CLOSE_ANIMATION_MS = 200;

interface ConfirmDeleteModalProps {
  siteName: string;
  siteId: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDeleteModal({
  siteName,
  siteId,
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps): React.ReactElement {
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorPulse, setErrorPulse] = useState(0);

  const requestClose = (after: () => void) => {
    setOpen(false);
    setTimeout(after, CLOSE_ANIMATION_MS);
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/sites/${siteId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete site');
      }

      requestClose(onConfirm);
    } catch (err) {
      const apiError = parseAPIError(err);
      handleAPIError(err);
      setError(apiError.message);
      setErrorPulse((n) => n + 1);
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={() => requestClose(onCancel)} title="Delete Site">
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        <p className="text-slate-300">
          Are you sure you want to delete <strong className="text-white">{siteName}</strong>?
        </p>

        <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <AlertTriangle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-300">
            This action cannot be undone. All associated selectors and data will be deleted.
          </p>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="secondary" className="flex-1" onClick={() => requestClose(onCancel)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" className="flex-1" loading={loading} errorPulse={errorPulse} onClick={handleConfirm}>
            Delete Site
          </Button>
        </div>
      </div>
    </Modal>
  );
}
