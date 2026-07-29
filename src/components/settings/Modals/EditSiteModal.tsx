'use client';

import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { type Site } from '@/lib/api';
import { parseAPIError, handleAPIError } from '@/lib/errorHandler';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { FormField } from '@/components/common/FormField';

const CLOSE_ANIMATION_MS = 200;

interface EditSiteModalProps {
  site: Site;
  onSuccess: (site: Site) => void;
  onCancel: () => void;
}

export function EditSiteModal({ site, onSuccess, onCancel }: EditSiteModalProps): React.ReactElement {
  const [open, setOpen] = useState(true);
  const [name, setName] = useState(site.name);
  const [url, setUrl] = useState(site.url);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ name?: string; url?: string }>({});
  const [errorPulse, setErrorPulse] = useState(0);

  const requestClose = (after: () => void) => {
    setOpen(false);
    setTimeout(after, CLOSE_ANIMATION_MS);
  };

  const validateForm = (): boolean => {
    const newErrors: { name?: string; url?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Site name is required';
    }

    if (!url.trim()) {
      newErrors.url = 'Site URL is required';
    } else if (!url.startsWith('http')) {
      newErrors.url = 'URL must start with http:// or https://';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      setErrorPulse((n) => n + 1);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/sites/${site.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, url }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update site');
      }

      const updatedSite = await response.json();
      setLoading(false);
      setSuccess(true);
      setTimeout(() => requestClose(() => onSuccess(updatedSite)), 500);
    } catch (err) {
      const apiError = parseAPIError(err);
      handleAPIError(err);
      setError(apiError.message);
      setErrorPulse((n) => n + 1);
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={() => requestClose(onCancel)} title="Edit Site">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-3 rounded-lg bg-red-500/10 border border-red-500/30 p-3">
            <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        <FormField
          label="Site Name"
          name="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />

        <FormField
          label="Site URL"
          name="url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          error={errors.url}
        />

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={() => requestClose(onCancel)}
            disabled={loading || success}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1" loading={loading} success={success} errorPulse={errorPulse}>
            {success ? 'Updated!' : 'Update Site'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
