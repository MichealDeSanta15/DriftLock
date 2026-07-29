'use client';

import React, { useState, useEffect } from 'react';

interface BillingInfo {
  sitesMonitored: number;
  apiCallsThisMonth: number;
  currentPlan: 'free' | 'pro' | 'enterprise';
  nextBillingDate?: string;
}

const PRICING_TIERS = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'Perfect for getting started',
    features: [
      'Up to 5 sites',
      '10,000 API calls/month',
      'Email support',
      'Basic monitoring',
    ],
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'For growing teams',
    features: [
      'Up to 50 sites',
      '100,000 API calls/month',
      'Priority support',
      'Advanced monitoring',
      'Custom integrations',
      'API access',
    ],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large organizations',
    features: [
      'Unlimited sites',
      'Unlimited API calls',
      '24/7 support',
      'Dedicated account manager',
      'SLA guarantee',
      'Custom integrations',
      'Advanced analytics',
    ],
  },
];

export function BillingSection(): React.ReactElement {
  const [billingInfo, setBillingInfo] = useState<BillingInfo>({
    sitesMonitored: 0,
    apiCallsThisMonth: 0,
    currentPlan: 'free',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBillingInfo();
  }, []);

  const fetchBillingInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/billing/info');
      if (!response.ok) throw new Error('Failed to fetch billing info');
      const data = await response.json();
      setBillingInfo(data);
    } catch (err) {
      console.error('Failed to fetch billing info:', err);
      setBillingInfo({
        sitesMonitored: 0,
        apiCallsThisMonth: 0,
        currentPlan: 'free',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Loading billing information...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Current Plan Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Current Plan</h3>
        <div className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Plan</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1 capitalize">
                {billingInfo.currentPlan}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Sites Monitored</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {billingInfo.sitesMonitored} / {billingInfo.currentPlan === 'free' ? '5' : billingInfo.currentPlan === 'pro' ? '50' : '∞'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">API Calls This Month</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {billingInfo.apiCallsThisMonth.toLocaleString()} /{' '}
                {billingInfo.currentPlan === 'free' ? '10K' : billingInfo.currentPlan === 'pro' ? '100K' : '∞'}
              </p>
            </div>
          </div>

          {billingInfo.nextBillingDate && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Next billing date: <strong>{new Date(billingInfo.nextBillingDate).toLocaleDateString()}</strong>
              </p>
            </div>
          )}

          <button
            disabled
            className="mt-6 px-6 py-2 bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300 font-medium rounded-lg cursor-not-allowed"
          >
            🔒 Upgrade Plan (Coming Soon)
          </button>
        </div>
      </div>

      {/* Pricing Tiers */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Available Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-lg border p-6 ${
                billingInfo.currentPlan.toLowerCase() === tier.name.toLowerCase()
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              {billingInfo.currentPlan.toLowerCase() === tier.name.toLowerCase() && (
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-indigo-600 text-white">
                    Current Plan
                  </span>
                </div>
              )}

              <h4 className={`text-xl font-bold ${billingInfo.currentPlan.toLowerCase() === tier.name.toLowerCase() ? 'text-indigo-900 dark:text-indigo-200' : 'text-gray-900 dark:text-white'}`}>
                {tier.name}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{tier.description}</p>

              <div className="mt-4">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {tier.price}
                  <span className="text-base text-gray-600 dark:text-gray-400">{tier.period}</span>
                </p>
              </div>

              <ul className="mt-6 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                    <span className="text-indigo-600 dark:text-indigo-400 mt-1">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                disabled
                className="mt-6 w-full py-2 bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300 font-medium rounded-lg cursor-not-allowed"
              >
                Upgrade (Coming Soon)
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Billing History (Placeholder) */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Billing History</h3>
        <div className="rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">No billing history yet. Upgrade to a paid plan to see billing details.</p>
        </div>
      </div>
    </div>
  );
}
