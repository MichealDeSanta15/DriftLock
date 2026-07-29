'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SiteManagement } from '@/components/settings/SiteManagement';
import { APIKeysSection } from '@/components/settings/APIKeysSection';
import { BillingSection } from '@/components/settings/BillingSection';
import { Globe, Key, CreditCard } from 'lucide-react';
import { EASE_OUT, useReducedMotion, withReducedMotion } from '@/lib/motion';

type SettingsTab = 'sites' | 'api-keys' | 'billing';

const panelVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: EASE_OUT } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

export default function SettingsPage(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<SettingsTab>('sites');
  const reducedMotion = useReducedMotion();

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
                  className={`relative flex items-center gap-3 whitespace-nowrap lg:w-full px-4 py-3 rounded-lg font-medium transition-colors duration-300 ${
                    activeTab === tab.id ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="settings-tab-indicator"
                      className="absolute inset-0 bg-indigo-600/20 border border-indigo-500/30 rounded-lg"
                      transition={reducedMotion ? { duration: 0.01 } : { type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10">{tab.icon}</span>
                  <span className="relative z-10">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                variants={withReducedMotion(panelVariants, reducedMotion)}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-6"
              >
                {activeTab === 'sites' && <SiteManagement />}
                {activeTab === 'api-keys' && <APIKeysSection />}
                {activeTab === 'billing' && <BillingSection />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
