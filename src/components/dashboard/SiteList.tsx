'use client';

import React, { useState, useEffect } from 'react';
import { SelectorStatus, type SelectorHealthStatus } from './SelectorStatus';

interface Site {
  id: string;
  name: string;
  url: string;
  status: SelectorHealthStatus;
  lastChecked: string;
  selectorId: string;
  currentSelector: string;
  lastRepaired?: string;
}

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
    <div className="rounded-lg border border-gray-200 overflow-hidden bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">Site Name</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">URL</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">Status</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">Last Checked</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading && sites.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center">
                  <p className="text-gray-500">Loading sites...</p>
                </td>
              </tr>
            ) : sites.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center">
                  <p className="text-gray-500">No sites added yet</p>
                </td>
              </tr>
            ) : (
              sites.map((site) => (
                <tr
                  key={site.id}
                  onClick={() => onRowClick?.(site)}
                  className="hover:bg-gray-50 cursor-pointer transition"
                >
                  <td className="px-6 py-4 font-medium text-gray-900">{site.name}</td>
                  <td className="px-6 py-4 text-gray-600 truncate max-w-xs">{site.url}</td>
                  <td className="px-6 py-4">
                    <SelectorStatus status={site.status} selectorId="" currentSelector="" compact />
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-xs">
                    {new Date(site.lastChecked).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTriggerDetection?.(site.id);
                      }}
                      disabled={detectionInProgress === site.id}
                      className="px-3 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded hover:bg-indigo-100 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {detectionInProgress === site.id ? (
                        <>
                          <span className="inline-block w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
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
