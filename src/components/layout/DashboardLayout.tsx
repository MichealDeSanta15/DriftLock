'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps): React.ReactElement {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900">DriftLock</h1>
        </div>

        <nav className="space-y-1 px-3">
          <NavLink href="/dashboard" label="Dashboard" />
          <NavLink href="/sites" label="Sites" />
          <NavLink href="/selectors" label="Selectors" />
          <NavLink href="/detections" label="Detections" />
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <button className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Top navbar */}
        <header className="bg-white border-b border-gray-200">
          <div className="px-8 py-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Welcome</h2>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="px-8 py-6">{children}</div>
      </main>
    </div>
  );
}

interface NavLinkProps {
  href: string;
  label: string;
}

function NavLink({ href, label }: NavLinkProps): React.ReactElement {
  return (
    <Link
      href={href}
      className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100"
    >
      {label}
    </Link>
  );
}
