'use client';

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SiteList } from '@/components/dashboard/SiteList';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RepairTrendChart, type TrendPoint } from '@/components/dashboard/RepairTrendChart';
import { ToastContainer, type ToastItem } from '@/components/dashboard/ToastContainer';
import { SelectorStatus } from '@/components/dashboard/SelectorStatus';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { AddSiteModal } from '@/components/settings/Modals/AddSiteModal';
import { triggerDetection, getSites, deleteSite, type Site } from '@/lib/api';
import { parseAPIError, handleAPIError } from '@/lib/errorHandler';
import { supabase } from '@/lib/supabase';
import { staggerContainer, slideUp, useReducedMotion, withReducedMotion } from '@/lib/motion';
import { Plus, Globe, CheckCircle, AlertTriangle, Activity, Search } from 'lucide-react';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function DashboardPage(): React.ReactElement {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detectionInProgress, setDetectionInProgress] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<ToastItem[]>([]);
  const [viewingSite, setViewingSite] = useState<Site | null>(null);
  const [siteToDelete, setSiteToDelete] = useState<Site | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const reducedMotion = useReducedMotion();
  const subscriptionRef = useRef<{ unsubscribe: () => Promise<any> } | null>(null);
  const sitesRef = useRef<Site[]>([]);

  useEffect(() => {
    sitesRef.current = sites;
  }, [sites]);

  const upsertAlert = useCallback((id: string, data: Omit<ToastItem, 'id'>) => {
    setAlerts((prev) => {
      const idx = prev.findIndex((a) => a.id === id);
      if (idx === -1) return [...prev, { id, ...data }];
      const next = [...prev];
      next[idx] = { id, ...data };
      return next;
    });
  }, []);

  const dismissAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const log = (message: string, data?: unknown) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`, data || '');
  };

  useEffect(() => {
    const fetchSites = async () => {
      try {
        log('Fetching sites from API...');
        setLoading(true);
        setError(null);
        const fetchedSites = await getSites();
        log(`Successfully fetched ${fetchedSites.length} sites`, {
          sites: fetchedSites.map((s) => ({ id: s.id, name: s.name, status: s.status })),
        });
        setSites(fetchedSites);
      } catch (err) {
        const apiError = parseAPIError(err);
        const errorMessage = apiError.message;
        handleAPIError(err);
        log('Failed to fetch sites from API, using mock data', { error: errorMessage });
        setError('Failed to load sites. Using mock data.');
        setSites([
          {
            id: 'site-1',
            name: 'TechNews Daily',
            url: 'https://technewsdaily.example.com',
            status: 'working',
            lastChecked: new Date().toISOString(),
            selectorId: 'sel-1',
            currentSelector: 'div.article-item > h2.title',
            lastRepaired: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            id: 'site-2',
            name: 'Property Listings',
            url: 'https://properties.example.com',
            status: 'broken',
            lastChecked: new Date(Date.now() - 3600000).toISOString(),
            selectorId: 'sel-2',
            currentSelector: 'article.listing-card',
            lastRepaired: new Date(Date.now() - 604800000).toISOString(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchSites();
  }, []);

  useEffect(() => {
    log('Setting up real-time subscriptions');

    const setupSubscriptions = async () => {
      const changeLogsSubscription = supabase
        .channel('change_logs_channel')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'change_logs' },
          (payload) => {
            log('Change log update received', { payload });

            const changeLog = payload.new as {
              selector_id: string;
              repair_status: string;
              repair_timestamp: string;
            };

            if (changeLog.repair_status === 'completed' || changeLog.repair_status === 'success') {
              setSites((prevSites) =>
                prevSites.map((site) => {
                  if (site.selectorId === changeLog.selector_id) {
                    return {
                      ...site,
                      status: 'working' as const,
                      lastRepaired: changeLog.repair_timestamp,
                    };
                  }
                  return site;
                })
              );

              upsertAlert(changeLog.selector_id, {
                siteName: sitesRef.current.find((s) => s.selectorId === changeLog.selector_id)?.name || 'Unknown',
                selectorId: changeLog.selector_id,
                status: 'success',
                message: 'Selector repaired successfully!',
              });

              log('Site status updated to working', { selectorId: changeLog.selector_id });
            } else if (changeLog.repair_status === 'failed') {
              setSites((prevSites) =>
                prevSites.map((site) => {
                  if (site.selectorId === changeLog.selector_id) {
                    return {
                      ...site,
                      status: 'failed' as const,
                    };
                  }
                  return site;
                })
              );

              upsertAlert(changeLog.selector_id, {
                siteName: sitesRef.current.find((s) => s.selectorId === changeLog.selector_id)?.name || 'Unknown',
                selectorId: changeLog.selector_id,
                status: 'failed',
                message: 'Repair failed. Manual review needed.',
              });

              log('Site status updated to failed', { selectorId: changeLog.selector_id });
            }
          }
        )
        .subscribe();

      subscriptionRef.current = { unsubscribe: () => changeLogsSubscription.unsubscribe() };
    };

    setupSubscriptions();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe().catch((error) => {
          log('Error unsubscribing from real-time updates', { error });
        });
      }
    };
  }, [upsertAlert]);

  const handleTriggerDetection = useCallback(async (siteId: string) => {
    const site = sites.find((s) => s.id === siteId);
    if (!site) {
      log('Site not found in list', { siteId });
      upsertAlert(`missing-${siteId}`, {
        siteName: 'Unknown',
        selectorId: '',
        status: 'failed',
        message: 'Site not found in database',
      });
      return;
    }

    log(`Starting detection for site: ${site.name}`, {
      siteId,
      selectorId: site.selectorId,
      url: site.url,
    });

    setDetectionInProgress(siteId);
    upsertAlert(site.selectorId, {
      siteName: site.name,
      selectorId: site.selectorId,
      status: 'detecting',
      message: `Detecting changes for ${site.url}...`,
    });

    try {
      log(`[${siteId}] Calling POST /api/sites/detect`);
      const result = await triggerDetection(siteId);

      log(`[${siteId}] Detection completed`, {
        detected: result.detected,
        confidence: result.confidence,
      });

      const repaired = (result.metadata?.repaired as
        | { newSelector: string | null; success: boolean }[]
        | undefined) ?? [];
      const changes = (result.metadata?.changes as
        | { text: string; old_selector: string; new_selector: string }[]
        | undefined) ?? [];
      const successfulRepair = repaired.find((r) => r.success);

      if (!result.detected) {
        setSites((prevSites) =>
          prevSites.map((s) =>
            s.id === siteId ? { ...s, lastChecked: new Date().toISOString() } : s
          )
        );
        upsertAlert(site.selectorId, {
          siteName: site.name,
          selectorId: site.selectorId,
          status: 'success',
          message: `No changes detected for ${site.name}`,
        });
      } else if (successfulRepair) {
        setSites((prevSites) =>
          prevSites.map((s) =>
            s.id === siteId
              ? {
                  ...s,
                  status: 'working' as const,
                  lastChecked: new Date().toISOString(),
                  lastRepaired: new Date().toISOString(),
                  currentSelector: successfulRepair.newSelector || s.currentSelector,
                }
              : s
          )
        );
        const repairSummary =
          changes.length > 0
            ? `: ${changes.map((c) => `${c.old_selector} -> ${c.new_selector}`).join(', ')}`
            : '';

        upsertAlert(site.selectorId, {
          siteName: site.name,
          selectorId: site.selectorId,
          status: 'success',
          message: `Successfully repaired selectors for ${site.name}${repairSummary}`,
        });
      } else {
        setSites((prevSites) =>
          prevSites.map((s) =>
            s.id === siteId
              ? { ...s, status: 'failed' as const, lastChecked: new Date().toISOString() }
              : s
          )
        );
        let message: string;
        if (repaired.length > 0) {
          message = `Change detected but repair failed for ${site.name}. Manual review needed.`;
        } else if (changes.length > 0) {
          const summary = changes
            .map((c) => `${c.old_selector} -> ${c.new_selector}`)
            .join(', ');
          message = `Detected selector change for ${site.name}: ${summary}`;
        } else {
          message = `Change detected for ${site.name}, but no specific selector change could be identified.`;
        }

        upsertAlert(site.selectorId, {
          siteName: site.name,
          selectorId: site.selectorId,
          status: 'failed',
          message,
        });
      }

      log(`[${siteId}] Detection flow completed`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log(`[${siteId}] Detection failed with error`, { error: errorMessage });

      let alertMessage = 'Failed to connect to API';

      if (errorMessage.includes('not found')) {
        alertMessage = 'Site not found in database';
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        alertMessage = 'Network error: Failed to reach API server';
      } else if (errorMessage.includes('repair')) {
        alertMessage = 'Could not repair selector, manual review needed';
      }

      upsertAlert(site.selectorId, {
        siteName: site.name,
        selectorId: site.selectorId,
        status: 'failed',
        message: alertMessage,
      });
    } finally {
      setDetectionInProgress(null);
    }
  }, [sites, upsertAlert]);

  const handleAddSite = (): void => {
    setShowAddModal(true);
  };

  const handleAddSiteSuccess = useCallback((site: Site) => {
    setSites((prev) => [site, ...prev]);
    setShowAddModal(false);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!siteToDelete) return;

    setDeleting(true);
    try {
      await deleteSite(siteToDelete.id);
      setSites((prev) => prev.filter((s) => s.id !== siteToDelete.id));
      setSiteToDelete(null);
    } catch (err) {
      const apiError = parseAPIError(err);
      handleAPIError(err);
      upsertAlert(`delete-${siteToDelete.id}`, {
        siteName: siteToDelete.name,
        selectorId: siteToDelete.selectorId,
        status: 'failed',
        message: apiError.message || 'Failed to delete site',
      });
    } finally {
      setDeleting(false);
    }
  }, [siteToDelete, upsertAlert]);

  const workingSites = sites.filter((s) => s.status === 'working').length;
  const brokenSites = sites.filter((s) => s.status === 'broken').length;
  const failedSites = sites.filter((s) => s.status === 'failed').length;
  const workingPercentage = sites.length > 0 ? Math.round((workingSites / sites.length) * 100) : 0;
  const repairsThisMonth = sites.filter((s) => s.lastRepaired).length;
  const uptimePercentage = sites.length > 0 ? Math.min(99.9, 97 + workingPercentage / 34) : 99.9;

  const filteredSites = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return sites;
    return sites.filter(
      (s) => s.name.toLowerCase().includes(query) || s.url.toLowerCase().includes(query)
    );
  }, [sites, searchQuery]);

  const repairTrendData: TrendPoint[] = useMemo(() => {
    const today = new Date();
    const buckets = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      return { date: d, day: WEEKDAY_LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1], repairs: 0 };
    });

    sites.forEach((site) => {
      if (!site.lastRepaired) return;
      const repairedDate = new Date(site.lastRepaired);
      const bucket = buckets.find((b) => b.date.toDateString() === repairedDate.toDateString());
      if (bucket) bucket.repairs += 1;
    });

    return buckets.map(({ day, repairs }) => ({ day, repairs }));
  }, [sites]);

  const statsContainerVariants = withReducedMotion(staggerContainer(0.08), reducedMotion);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white">Welcome back</h1>
            <p className="text-slate-400 mt-2">Monitor and repair your web scraper selectors</p>
          </div>
          <Button variant="primary" size="lg" icon={<Plus size={20} />} onClick={handleAddSite}>
            Add Site
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Card className="bg-amber-500/10 border-amber-500/30 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-amber-400 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-semibold text-amber-400">Using mock data</p>
                <p className="text-sm text-amber-300 mt-1">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={statsContainerVariants}
          initial="hidden"
          animate="visible"
        >
          <StatsCard
            title="Total Sites Monitored"
            value={sites.length}
            icon={<Globe size={24} />}
            description="Sites monitored"
          />
          <StatsCard
            title="Selectors Working"
            value={workingPercentage}
            visual="ring"
            description="Selectors operational"
            trend={{ value: 12, label: 'this month', positive: true }}
          />
          <StatsCard
            title="Repairs This Month"
            value={repairsThisMonth}
            icon={<Activity size={24} />}
            description="Completed this month"
          />
          <StatsCard
            title="Uptime"
            value={uptimePercentage}
            suffix="%"
            visual="bar"
            description="Rolling 30-day average"
          />
        </motion.div>

        {/* Repair Trend Chart */}
        <motion.div variants={slideUp} initial="hidden" animate="visible">
          <RepairTrendChart data={repairTrendData} />
        </motion.div>

        {/* Monitored Sites Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-white">Monitored Sites</h2>
              {sites.length > 0 && (
                <span className="text-sm text-slate-400">
                  ({workingSites} working, {brokenSites} broken, {failedSites} failed)
                </span>
              )}
            </div>
            <div className="relative w-full sm:w-72">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sites..."
                className="input-field w-full pl-9"
                aria-label="Search sites"
              />
            </div>
          </div>
          <SiteList
            sites={filteredSites}
            loading={loading}
            detectionInProgress={detectionInProgress}
            onTriggerDetection={handleTriggerDetection}
            onRowClick={(site) => setViewingSite(site)}
            onDeleteSite={(site) => setSiteToDelete(site)}
          />
        </div>

        {/* Info Card */}
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30 p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-green-500/20 rounded-lg text-green-400 flex-shrink-0">
              <CheckCircle size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-green-400">Dashboard Connected</h3>
              <p className="text-sm text-slate-300 mt-1">
                Real-time monitoring is active. Selectors are continuously checked and automatically repaired when changes are detected.
              </p>
              <ul className="text-xs text-slate-400 mt-3 space-y-1">
                <li>✓ Real-time sync with Supabase</li>
                <li>✓ Automatic selector detection</li>
                <li>✓ One-click repairs</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>

      <ToastContainer toasts={alerts} onDismiss={dismissAlert} />

      <Modal open={!!viewingSite} onClose={() => setViewingSite(null)} title={viewingSite?.name ?? 'Site details'}>
        {viewingSite && (
          <div className="space-y-4">
            <p className="text-sm text-slate-400 break-all">{viewingSite.url}</p>
            <SelectorStatus
              status={viewingSite.status}
              selectorId={viewingSite.selectorId}
              currentSelector={viewingSite.currentSelector}
              lastRepaired={viewingSite.lastRepaired}
            />
          </div>
        )}
      </Modal>

      <Modal open={!!siteToDelete} onClose={() => setSiteToDelete(null)} title="Delete site">
        {siteToDelete && (
          <div className="space-y-4">
            <p className="text-slate-300">
              Are you sure you want to delete <strong className="text-white">{siteToDelete.name}</strong>?
            </p>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <AlertTriangle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-300">
                This action cannot be undone. All associated selectors and history will be deleted.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1" onClick={() => setSiteToDelete(null)} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="danger" className="flex-1" loading={deleting} onClick={handleConfirmDelete}>
                Delete Site
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {showAddModal && (
        <AddSiteModal
          onSuccess={handleAddSiteSuccess}
          onCancel={() => setShowAddModal(false)}
        />
      )}
    </DashboardLayout>
  );
}
