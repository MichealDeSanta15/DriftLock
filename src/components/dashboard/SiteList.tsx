'use client';

import React from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { SelectorStatus } from './SelectorStatus';
import { type Site } from '@/lib/api';
import { Zap, Eye, Trash2 } from 'lucide-react';
import { EASE_OUT, staggerContainer, useReducedMotion, withReducedMotion } from '@/lib/motion';

export type { Site };

interface SiteListProps {
  sites: Site[];
  loading?: boolean;
  detectionInProgress?: string | null;
  onRowClick?: (site: Site) => void;
  onTriggerDetection?: (siteId: string) => void;
  onDeleteSite?: (site: Site) => void;
}

const rowVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, ease: EASE_OUT } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE_OUT } },
  exit: {
    opacity: 0,
    height: 0,
    scale: 0.95,
    marginBottom: 0,
    paddingTop: 0,
    paddingBottom: 0,
    transition: { duration: 0.25, ease: EASE_OUT },
  },
};

export function SiteList({
  sites,
  loading = false,
  detectionInProgress = null,
  onRowClick,
  onTriggerDetection,
  onDeleteSite,
}: SiteListProps): React.ReactElement {
  const reducedMotion = useReducedMotion();

  if (loading && sites.length === 0) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card p-6">
            <div className="h-4 skeleton-shimmer rounded w-3/4 mb-4" />
            <div className="h-3 skeleton-shimmer rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (sites.length === 0) {
    return (
      <div className="card p-12 text-center">
        <motion.div
          className="inline-block p-3 bg-slate-800 rounded-lg mb-4"
          animate={reducedMotion ? undefined : { y: [0, -8, 0] }}
          transition={reducedMotion ? undefined : { duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Eye size={24} className="text-slate-400" />
        </motion.div>
        <p className="text-lg font-semibold text-white mb-2">No sites yet</p>
        <p className="text-slate-400">Add your first site to get started monitoring selectors</p>
      </div>
    );
  }

  const containerVariants = withReducedMotion(staggerContainer(0.06), reducedMotion);
  const itemRowVariants = withReducedMotion(rowVariants, reducedMotion);
  const itemCardVariants = withReducedMotion(cardVariants, reducedMotion);

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
            <motion.tbody
              className="divide-y divide-slate-800"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <AnimatePresence initial={false} mode="popLayout">
                {sites.map((site) => (
                  <motion.tr
                    key={site.id}
                    layout
                    variants={itemRowVariants}
                    exit="exit"
                    className="hover:bg-slate-800/30 transition-colors duration-300"
                  >
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
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onRowClick?.(site)}
                          aria-label={`View ${site.name}`}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors duration-300"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => onTriggerDetection?.(site.id)}
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
                        <button
                          onClick={() => onDeleteSite?.(site)}
                          aria-label={`Delete ${site.name}`}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors duration-300"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </motion.tbody>
          </table>
        </div>
      </div>

      {/* Card view for mobile */}
      <motion.div
        className="md:hidden space-y-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence initial={false} mode="popLayout">
          {sites.map((site) => (
            <motion.div
              key={site.id}
              layout
              variants={itemCardVariants}
              exit="exit"
              whileHover={reducedMotion ? undefined : { y: -4 }}
              onClick={() => onRowClick?.(site)}
              className="card p-6 cursor-pointer transition-colors duration-300 hover:border-slate-700 hover:shadow-xl hover:shadow-indigo-500/10"
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
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRowClick?.(site);
                    }}
                    aria-label={`View ${site.name}`}
                    className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors duration-300"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTriggerDetection?.(site.id);
                    }}
                    disabled={detectionInProgress === site.id}
                    className="inline-flex items-center gap-2 px-4 py-3 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSite?.(site);
                    }}
                    aria-label={`Delete ${site.name}`}
                    className="p-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors duration-300"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
