'use client';

import React, { useState } from 'react';
import { type Site } from '@/lib/api';
import { parseAPIError, handleAPIError } from '@/lib/errorHandler';

interface EditSiteModalProps {
  site: Site;
  onSuccess: (site: Site) => void;
  onCancel: () => void;
}

export function EditSiteModal({ site, onSuccess, onCancel }: EditSiteModalProps): React.ReactElement {
  const [name, setName] = useState(site.name);
  const [url, setUrl] = useState(site.url);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ name?: string; url?: string }>({});

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
      onSuccess(updatedSite);
    } catch (err) {
      const apiError = parseAPIError(err);
      handleAPIError(err);
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Site</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-3">
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Site Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white transition ${
                errors.name
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.name && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Site URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white transition ${
                errors.url ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.url && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.url}</p>}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Update Site
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
