'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutDashboard, Settings, LogOut, Menu, X, Key } from 'lucide-react';
import { useReducedMotion } from '@/lib/motion';
import { signOut } from '@/lib/auth';
import { useAuth } from '@/lib/AuthContext';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps): React.ReactElement | null {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const reducedMotion = useReducedMotion();
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-2 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

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
            <NavLink href="/settings" label="Settings" icon={Settings} />
            <NavLink href="/settings" label="API Keys" icon={Key} />
          </nav>

          {/* Sign Out */}
          <div className="p-4 border-t border-slate-800">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800/50 transition-colors duration-300"
            >
              <LogOut size={18} />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top navbar */}
        <header
          className={`bg-slate-900 border-b sticky top-0 z-40 transition-shadow duration-300 ${
            scrolled ? 'border-slate-800 shadow-lg shadow-black/20' : 'border-transparent shadow-none'
          }`}
        >
          <div className="px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden relative w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
            >
              <AnimatePresence mode="wait" initial={false}>
                {sidebarOpen ? (
                  <motion.span
                    key="close"
                    initial={reducedMotion ? undefined : { rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <X size={24} />
                  </motion.span>
                ) : (
                  <motion.span
                    key="menu"
                    initial={reducedMotion ? undefined : { rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <Menu size={24} />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <h2 className="text-lg font-semibold text-white">Welcome back</h2>

            <div className="flex items-center space-x-4">
              <Link
                href="/settings"
                className="p-2 text-slate-400 hover:text-white transition-colors hover:bg-slate-800 rounded-lg"
                aria-label="Settings"
              >
                <Settings size={20} />
              </Link>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div
          className="flex-1 overflow-auto"
          onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 8)}
        >
          <div className="px-6 lg:px-8 py-6">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
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
