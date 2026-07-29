'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SiteManagement } from '@/components/settings/SiteManagement';
import { APIKeysSection } from '@/components/settings/APIKeysSection';
import { BillingSection } from '@/components/settings/BillingSection';

type SettingsTab = 'sites' | 'api-keys' | 'billing';

export default function SettingsPage(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<SettingsTab>('sites');

  const tabs: { id: SettingsTab; label: string; icon: string }[] = [
    { id: 'sites', label: 'Site Management', icon: '🌐' },
    { id: 'api-keys', label: 'API Keys', icon: '🔑' },
    { id: 'billing', label: 'Billing', icon: '💳' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your sites, API keys, and billing</p>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-2 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap lg:w-full px-4 py-3 text-left font-medium rounded-lg transition ${
                    activeTab === tab.id
                      ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                      : 'text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <span>{tab.icon} {tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'sites' && <SiteManagement />}
            {activeTab === 'api-keys' && <APIKeysSection />}
            {activeTab === 'billing' && <BillingSection />}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
