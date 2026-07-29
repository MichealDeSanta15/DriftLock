'use client';

import React, { useState, useEffect } from 'react';
import { parseAPIError, handleAPIError } from '@/lib/errorHandler';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { GenerateKeyModal } from './Modals/GenerateKeyModal';

interface APIKey {
  id: string;
  name: string;
  createdAt: string;
  lastUsed?: string;
  revoked: boolean;
}

interface UsageStats {
  totalCalls: number;
  lastKeyUsed?: string;
}

export function APIKeysSection(): React.ReactElement {
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [stats, setStats] = useState<UsageStats>({ totalCalls: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  useEffect(() => {
    fetchKeys();
    fetchStats();
  }, []);

  const fetchKeys = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/keys');
      if (!response.ok) throw new Error('Failed to fetch API keys');
      const data = await response.json();
      setKeys(data.keys || []);
    } catch (err) {
      const apiError = parseAPIError(err);
      handleAPIError(err);
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/keys/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    try {
      const response = await fetch(`/api/keys/${keyId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to revoke key');
      setKeys(keys.filter((k) => k.id !== keyId));
      setSuccessMessage('API key revoked successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke key');
    }
  };

  const handleGenerateKeySuccess = () => {
    setShowGenerateModal(false);
    fetchKeys();
    setSuccessMessage('API key generated successfully!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg bg-white dark:bg-gray-800 p-6 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">API Calls This Month</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalCalls}</p>
        </div>
        <div className="rounded-lg bg-white dark:bg-gray-800 p-6 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Last Key Used</p>
          <p className="text-lg font-medium text-gray-900 dark:text-white mt-2">
            {stats.lastKeyUsed ? new Date(stats.lastKeyUsed).toLocaleString() : 'Never'}
          </p>
        </div>
      </div>

      {/* Header with Generate Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">API Keys</h3>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
        >
          + Generate Key
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 p-4">
          <p className="text-sm text-green-800 dark:text-green-300">✅ {successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-4 flex items-center justify-between">
          <p className="text-sm text-red-800 dark:text-red-300">❌ {error}</p>
          <button
            onClick={fetchKeys}
            className="ml-4 px-3 py-1 text-xs font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40 rounded hover:bg-red-200 dark:hover:bg-red-900/60 transition"
            aria-label="Retry loading API keys"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="space-y-4">
          <SkeletonLoader type="table-row" count={3} />
        </div>
      ) : keys.length === 0 ? (
        <div className="text-center py-12 rounded-lg bg-gray-50 dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No API keys generated yet</p>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
          >
            Generate your first key
          </button>
        </div>
      ) : (
        /* Keys Table */
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">
                    Key Name
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">
                    Last Used
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {keys.map((key) => (
                  <tr key={key.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{key.name}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-xs">
                      {new Date(key.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-xs">
                      {key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          key.revoked
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                            : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                        }`}
                      >
                        {key.revoked ? 'Revoked' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      {!key.revoked && (
                        <>
                          <button
                            onClick={() => handleRevokeKey(key.id)}
                            className="px-3 py-1 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded hover:bg-red-100 dark:hover:bg-red-900/50 transition"
                          >
                            Revoke
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {showGenerateModal && (
        <GenerateKeyModal
          onSuccess={handleGenerateKeySuccess}
          onCancel={() => setShowGenerateModal(false)}
        />
      )}
    </div>
  );
}
