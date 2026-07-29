'use client';

import React, { ReactNode, useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Globe, Settings, LogOut, Menu, X, Key } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps): React.ReactElement {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-950">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">D</span>
              </div>
              <h1 className="text-xl font-bold text-white">DriftLock</h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            <NavLink href="/dashboard" label="Dashboard" icon={LayoutDashboard} />
            <NavLink href="/sites" label="Sites" icon={Globe} />
            <NavLink href="/settings" label="Settings" icon={Settings} />
            <NavLink href="/api" label="API Keys" icon={Key} />
          </nav>

          {/* Sign Out */}
          <div className="p-4 border-t border-slate-800">
            <button className="w-full flex items-center gap-2 px-4 py-2.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800/50 transition-colors duration-300">
              <LogOut size={18} />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top navbar */}
        <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
          <div className="px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <h2 className="text-lg font-semibold text-white">Welcome back</h2>

            <div className="flex items-center space-x-4">
              <button className="p-2 text-slate-400 hover:text-white transition-colors hover:bg-slate-800 rounded-lg">
                <Settings size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-auto">
          <div className="px-6 lg:px-8 py-6">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

interface NavLinkProps {
  href: string;
  label: string;
  icon: React.ComponentType<any>;
}

function NavLink({ href, label, icon: Icon }: NavLinkProps): React.ReactElement {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-300 rounded-lg hover:text-white hover:bg-slate-800/50 transition-colors duration-300"
    >
      <Icon size={18} />
      <span>{label}</span>
    </Link>
  );
}
