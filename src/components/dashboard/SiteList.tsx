'use client';

import React from 'react';
import { SelectorStatus } from './SelectorStatus';
import { type Site } from '@/lib/api';

export type { Site };

interface SiteListProps {
  sites: Site[];
  loading?: boolean;
  detectionInProgress?: string | null;
  onRowClick?: (site: Site) => void;
  onTriggerDetection?: (siteId: string) => void;
}

export function SiteList({
  sites,
  loading = false,
  detectionInProgress = null,
  onRowClick,
  onTriggerDetection,
}: SiteListProps): React.ReactElement {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">Site Name</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">URL</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">Status</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">Last Checked</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading && sites.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400">Loading sites...</p>
                </td>
              </tr>
            ) : sites.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400">No sites added yet</p>
                </td>
              </tr>
            ) : (
              sites.map((site) => (
                <tr
                  key={site.id}
                  onClick={() => onRowClick?.(site)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition"
                >
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{site.name}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400 truncate max-w-xs">{site.url}</td>
                  <td className="px-6 py-4">
                    <SelectorStatus
                      status={site.status}
                      selectorId={site.selectorId}
                      currentSelector={site.currentSelector}
                      lastRepaired={site.lastRepaired}
                      compact
                    />
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-xs">
                    {new Date(site.lastChecked).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTriggerDetection?.(site.id);
                      }}
                      disabled={detectionInProgress === site.id}
                      className="px-3 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {detectionInProgress === site.id ? (
                        <>
                          <span className="inline-block w-3 h-3 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin" />
                          Detecting...
                        </>
                      ) : (
                        'Detect'
                      )}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
