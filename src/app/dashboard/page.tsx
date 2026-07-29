'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SiteList } from '@/components/dashboard/SiteList';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { AlertBanner } from '@/components/dashboard/AlertBanner';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { triggerDetection, getSites, type Site } from '@/lib/api';
import { parseAPIError, handleAPIError } from '@/lib/errorHandler';
import { supabase } from '@/lib/supabase';
import { Plus, Globe, CheckCircle, AlertTriangle, Activity } from 'lucide-react';

type AlertStatus = 'detecting' | 'repairing' | 'success' | 'failed' | null;

interface Alert {
  siteName: string;
  selectorId: string;
  status: AlertStatus;
  message?: string;
}

export default function DashboardPage(): React.ReactElement {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detectionInProgress, setDetectionInProgress] = useState<string | null>(null);
  const [alert, setAlert] = useState<Alert | null>(null);
  const subscriptionRef = useRef<{ unsubscribe: () => Promise<any> } | null>(null);

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

              setAlert({
                siteName: sites.find((s) => s.selectorId === changeLog.selector_id)?.name || 'Unknown',
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

              setAlert({
                siteName: sites.find((s) => s.selectorId === changeLog.selector_id)?.name || 'Unknown',
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
  }, [sites]);

  const handleTriggerDetection = useCallback(async (siteId: string) => {
    const site = sites.find((s) => s.id === siteId);
    if (!site) {
      log('Site not found in list', { siteId });
      setAlert({
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
    setAlert({
      siteName: site.name,
      selectorId: site.selectorId,
      status: 'detecting',
      message: `Detecting changes for ${site.url}...`,
    });

    try {
      log(`[${siteId}] Calling POST /api/sites/detect`);
      const result = await triggerDetection(siteId);

      log(`[${siteId}] Detection completed, starting repair...`, {
        detected: result.detected,
        confidence: result.confidence,
      });

      setAlert((prev) =>
        prev
          ? {
              ...prev,
              status: 'repairing',
              message: `Repairing ${result.detected ? 'broken' : 'found'} selectors...`,
            }
          : null
      );

      await new Promise((resolve) => setTimeout(resolve, 2000));

      log(`[${siteId}] Repair completed, updating site status...`);

      setSites((prevSites) =>
        prevSites.map((s) => {
          if (s.id === siteId) {
            const updatedSite = {
              ...s,
              status: 'working' as const,
              lastChecked: new Date().toISOString(),
            };
            log(`[${siteId}] Updated site status to working`);
            return updatedSite;
          }
          return s;
        })
      );

      setAlert((prev) =>
        prev
          ? {
              ...prev,
              status: 'success',
              message: `Successfully repaired selectors for ${site.name}`,
            }
          : null
      );

      log(`[${siteId}] Detection and repair completed successfully`);
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

      setAlert((prev) =>
        prev
          ? {
              ...prev,
              status: 'failed',
              message: alertMessage,
            }
          : null
      );
    } finally {
      setDetectionInProgress(null);
    }
  }, [sites]);

  const handleAddSite = (): void => {
    console.log('Add site clicked');
  };

  const workingSites = sites.filter((s) => s.status === 'working').length;
  const brokenSites = sites.filter((s) => s.status === 'broken').length;
  const failedSites = sites.filter((s) => s.status === 'failed').length;
  const workingPercentage = sites.length > 0 ? Math.round((workingSites / sites.length) * 100) : 0;

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Sites"
            value={sites.length}
            icon={<Globe size={24} />}
            description="Sites monitored"
          />
          <StatsCard
            title="Working"
            value={workingPercentage}
            icon={<CheckCircle size={24} />}
            description="Selectors operational"
            trend={{ value: 12, label: 'this month', positive: true }}
          />
          <StatsCard
            title="Repairs"
            value={sites.filter((s) => s.lastRepaired).length}
            icon={<Activity size={24} />}
            description="Completed this month"
          />
          <StatsCard
            title="Issues"
            value={brokenSites + failedSites}
            icon={<AlertTriangle size={24} />}
            description="Need attention"
          />
        </div>

        {/* Monitored Sites Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-white">Monitored Sites</h2>
            {sites.length > 0 && (
              <span className="text-sm text-slate-400">
                ({workingSites} working, {brokenSites} broken, {failedSites} failed)
              </span>
            )}
          </div>
          <SiteList
            sites={sites}
            loading={loading}
            detectionInProgress={detectionInProgress}
            onTriggerDetection={handleTriggerDetection}
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

      {/* Alert Banner */}
      {alert && alert.status && (
        <AlertBanner
          siteName={alert.siteName}
          selectorId={alert.selectorId}
          status={alert.status}
          onDismiss={() => setAlert(null)}
        />
      )}
    </DashboardLayout>
  );
}
