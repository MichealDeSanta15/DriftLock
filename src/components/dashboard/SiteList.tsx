'use client';

import React from 'react';
import { SelectorStatus } from './SelectorStatus';
import { type Site } from '@/lib/api';
import { Zap, Eye } from 'lucide-react';

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
  if (loading && sites.length === 0) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card p-6 animate-pulse">
            <div className="h-4 bg-slate-800 rounded w-3/4 mb-4" />
            <div className="h-3 bg-slate-800 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (sites.length === 0) {
    return (
      <div className="card p-12 text-center">
        <div className="inline-block p-3 bg-slate-800 rounded-lg mb-4">
          <Eye size={24} className="text-slate-400" />
        </div>
        <p className="text-lg font-semibold text-white mb-2">No sites yet</p>
        <p className="text-slate-400">Add your first site to get started monitoring selectors</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table view for larger screens */}
      <div className="hidden md:block card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/50 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-slate-200">Site Name</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-200">Status</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-200">Last Checked</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-200">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {sites.map((site) => (
                <tr key={site.id} className="hover:bg-slate-800/30 transition-colors duration-300">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-white">{site.name}</p>
                      <p className="text-xs text-slate-400 mt-1 truncate">{site.url}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <SelectorStatus
                      status={site.status}
                      selectorId={site.selectorId}
                      currentSelector={site.currentSelector}
                      lastRepaired={site.lastRepaired}
                      compact
                    />
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    {new Date(site.lastChecked).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTriggerDetection?.(site.id);
                      }}
                      disabled={detectionInProgress === site.id}
                      className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {detectionInProgress === site.id ? (
                        <>
                          <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Detecting
                        </>
                      ) : (
                        <>
                          <Zap size={14} />
                          Detect
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Card view for mobile */}
      <div className="lg:hidden space-y-4">
        {sites.map((site) => (
          <div
            key={site.id}
            onClick={() => onRowClick?.(site)}
            className="card-hover p-6 cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">{site.name}</h3>
                <p className="text-xs text-slate-400 mt-1 truncate">{site.url}</p>
              </div>
            </div>

            <div className="mb-4">
              <SelectorStatus
                status={site.status}
                selectorId={site.selectorId}
                currentSelector={site.currentSelector}
                lastRepaired={site.lastRepaired}
                compact
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <p className="text-xs text-slate-400">
                Checked: {new Date(site.lastChecked).toLocaleDateString()}
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTriggerDetection?.(site.id);
                }}
                disabled={detectionInProgress === site.id}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {detectionInProgress === site.id ? (
                  <>
                    <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Detecting
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    Detect
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
