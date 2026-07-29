'use client';

import Link from 'next/link';
import { Zap, Globe, Lock, ArrowRight, CheckCircle } from 'lucide-react';

export default function Home(): React.ReactElement {
  return (
    <main className="min-h-screen bg-slate-950">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">D</span>
            </div>
            <h1 className="text-2xl font-bold text-white">DriftLock</h1>
          </div>
          <Link
            href="/dashboard"
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-105"
          >
            Dashboard
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600/20 rounded-full border border-indigo-500/30">
                <Zap size={16} className="text-indigo-400" />
                <span className="text-sm font-medium text-indigo-300">Production-ready selector repairs</span>
              </div>
              <h2 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
                Selectors that
                <br />
                <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  never break
                </span>
              </h2>
              <p className="text-lg text-slate-400 max-w-lg">
                When websites redesign, your selectors break. DriftLock automatically detects changes and repairs them in real-time, so you never miss a scrape.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-105 active:scale-95"
              >
                Get Started
                <ArrowRight size={18} />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center px-8 py-3.5 border border-slate-700 text-slate-300 font-medium rounded-lg hover:bg-slate-900/50 hover:border-slate-600 transition-all duration-300"
              >
                Learn More
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-slate-800">
              <div>
                <p className="text-2xl font-bold text-white">99.9%</p>
                <p className="text-xs text-slate-400 mt-1">Uptime</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">&lt;100ms</p>
                <p className="text-xs text-slate-400 mt-1">Repair Time</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">5M+</p>
                <p className="text-xs text-slate-400 mt-1">Selectors Monitored</p>
              </div>
            </div>
          </div>

          {/* Right Visual */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-3xl blur-3xl" />
            <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-8 backdrop-blur-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Globe size={20} className="text-indigo-400" />
                    <div className="text-sm">
                      <p className="font-medium text-white">Example Site</p>
                      <p className="text-xs text-slate-400">example.com</p>
                    </div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                </div>
                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <p className="text-xs text-slate-400 mb-2">Current Selector</p>
                  <p className="font-mono text-sm text-slate-300">div.article-item &gt; h2.title</p>
                </div>
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-start gap-3">
                  <CheckCircle size={20} className="text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-400">Healthy</p>
                    <p className="text-xs text-green-300">Last checked 5 minutes ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-6xl mx-auto px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h3 className="text-4xl font-bold text-white mb-4">Why DriftLock?</h3>
          <p className="text-lg text-slate-400">Powerful features to keep your scraper resilient</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: <Zap size={24} />,
              title: 'Real-time Detection',
              description: 'Automatically detects when website changes break your selectors',
            },
            {
              icon: <Lock size={24} />,
              title: 'Automatic Repair',
              description: 'AI-powered repair engine fixes selectors within milliseconds',
            },
            {
              icon: <Globe size={24} />,
              title: 'Multi-site Monitoring',
              description: 'Monitor unlimited sites and selectors on a single dashboard',
            },
          ].map((feature, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-8 hover:border-slate-700 transition-colors duration-300">
              <div className="w-12 h-12 bg-indigo-600/20 rounded-lg flex items-center justify-center text-indigo-400 mb-4">
                {feature.icon}
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">{feature.title}</h4>
              <p className="text-slate-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="max-w-6xl mx-auto px-6 lg:px-8 py-20 border-t border-slate-800">
        <div className="text-center">
          <h3 className="text-3xl font-bold text-white mb-4">Ready to get started?</h3>
          <p className="text-slate-400 mb-8">Start monitoring and repairing selectors in seconds</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-105"
          >
            Enter Dashboard
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8 text-center text-slate-400 text-sm">
          <p>&copy; 2024 DriftLock. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
