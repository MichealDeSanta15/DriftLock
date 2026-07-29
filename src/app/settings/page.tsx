'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SiteManagement } from '@/components/settings/SiteManagement';
import { APIKeysSection } from '@/components/settings/APIKeysSection';
import { BillingSection } from '@/components/settings/BillingSection';
import { Globe, Key, CreditCard } from 'lucide-react';

type SettingsTab = 'sites' | 'api-keys' | 'billing';

export default function SettingsPage(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<SettingsTab>('sites');

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'sites', label: 'Site Management', icon: <Globe size={20} /> },
    { id: 'api-keys', label: 'API Keys', icon: <Key size={20} /> },
    { id: 'billing', label: 'Billing', icon: <CreditCard size={20} /> },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-white">Settings</h1>
          <p className="text-slate-400 mt-2">Manage your sites, API keys, and billing preferences</p>
        </div>

        {/* Tabs Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-2 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 whitespace-nowrap lg:w-full px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {activeTab === 'sites' && <SiteManagement />}
              {activeTab === 'api-keys' && <APIKeysSection />}
              {activeTab === 'billing' && <BillingSection />}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
