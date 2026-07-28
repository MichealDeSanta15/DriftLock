'use client';

import React, { useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SiteList } from '@/components/dashboard/SiteList';
import { AlertBanner } from '@/components/dashboard/AlertBanner';
import { triggerDetection } from '@/lib/api';

interface Site {
  id: string;
  name: string;
  url: string;
  status: 'working' | 'broken' | 'failed';
  lastChecked: string;
  selectorId: string;
  currentSelector: string;
  lastRepaired?: string;
}

type AlertStatus = 'detecting' | 'repairing' | 'success' | 'failed' | null;

export default function DashboardPage(): React.ReactElement {
  const [sites, setSites] = useState<Site[]>([
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

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{
    siteName: string;
    selectorId: string;
    status: AlertStatus;
  } | null>(null);

  const handleTriggerDetection = useCallback(async (siteId: string) => {
    const site = sites.find((s) => s.id === siteId);
    if (!site) return;

    setAlert({
      siteName: site.name,
      selectorId: site.selectorId,
      status: 'detecting',
    });

    try {
      await triggerDetection(siteId);

      setAlert((prev) =>
        prev ? { ...prev, status: 'repairing' } : null
      );

      setTimeout(() => {
        setSites((prevSites) =>
          prevSites.map((s) =>
            s.id === siteId ? { ...s, status: 'working', lastChecked: new Date().toISOString() } : s
          )
        );

        setAlert((prev) =>
          prev ? { ...prev, status: 'success' } : null
        );
      }, 2000);
    } catch (error) {
      console.error('Detection failed:', error);
      setAlert((prev) =>
        prev ? { ...prev, status: 'failed' } : null
      );
    }
  }, [sites]);

  const handleAddSite = (): void => {
    // Placeholder for add site functionality
    console.log('Add site clicked');
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
            <p className="text-gray-600 mt-2">Monitor your web scraper selectors in real-time</p>
          </div>
          <button
            onClick={handleAddSite}
            className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
          >
            + Add Site
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Sites"
            value={sites.length.toString()}
            description="Monitored sites"
          />
          <StatCard
            title="Working"
            value={sites.filter((s) => s.status === 'working').length.toString()}
            description="Selectors operational"
          />
          <StatCard
            title="Issues"
            value={sites.filter((s) => s.status !== 'working').length.toString()}
            description="Need attention"
          />
        </div>

        {/* Sites Table */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monitored Sites</h3>
          <SiteList
            sites={sites}
            loading={loading}
            onTriggerDetection={handleTriggerDetection}
          />
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
          <h4 className="font-semibold text-blue-900 mb-2">Waiting for Person 1's API</h4>
          <p className="text-sm text-blue-800">
            This dashboard uses mock data. Once feat/detection-signals is merged, it will connect
            to Person 1's real API endpoints:
          </p>
          <ul className="text-sm text-blue-800 mt-2 list-disc list-inside">
            <li>GET /api/sites - Fetch all monitored sites</li>
            <li>POST /api/sites/detect - Trigger detection</li>
            <li>GET /api/selectors/[id]/current - Get current selector</li>
          </ul>
        </div>
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

interface StatCardProps {
  title: string;
  value: string;
  description: string;
}

function StatCard({ title, value, description }: StatCardProps): React.ReactElement {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
      <p className="text-sm text-gray-500 mt-2">{description}</p>
    </div>
  );
}
