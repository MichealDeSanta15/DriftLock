'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import {
  motion,
  useMotionValue,
  useSpring,
  useScroll,
  useMotionValueEvent,
  useInView,
} from 'framer-motion';
import { Zap, Globe, Lock, ArrowRight, CheckCircle } from 'lucide-react';
import { CountUp } from '@/components/common/CountUp';
import { EASE_OUT, useReducedMotion } from '@/lib/motion';

const FEATURES = [
  {
    icon: Zap,
    title: 'Real-time Detection',
    description: 'Automatically detects when website changes break your selectors',
  },
  {
    icon: Lock,
    title: 'Automatic Repair',
    description: 'AI-powered repair engine fixes selectors within milliseconds',
  },
  {
    icon: Globe,
    title: 'Multi-site Monitoring',
    description: 'Monitor unlimited sites and selectors on a single dashboard',
  },
];

function AnimatedHeadline(): React.ReactElement {
  const reducedMotion = useReducedMotion();
  const lines = [
    { words: ['Selectors', 'that'], gradient: false },
    { words: ['never', 'break'], gradient: true },
  ];
  let wordIndex = 0;

  return (
    <h2 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
      {lines.map((line, li) => (
        <span key={li} className={li > 0 ? 'block' : 'block'}>
          {line.words.map((word) => {
            const delay = wordIndex * 0.08;
            wordIndex += 1;
            return (
              <motion.span
                key={word}
                className={`inline-block mr-[0.25em] ${
                  line.gradient ? 'bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent' : ''
                }`}
                initial={reducedMotion ? undefined : { opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay, ease: EASE_OUT }}
              >
                {word}
              </motion.span>
            );
          })}
        </span>
      ))}
    </h2>
  );
}

function TiltCard(): React.ReactElement {
  const reducedMotion = useReducedMotion();
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springRotateX = useSpring(rotateX, { stiffness: 150, damping: 20 });
  const springRotateY = useSpring(rotateY, { stiffness: 150, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(px * 10);
    rotateX.set(-py * 10);
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <motion.div
      className="relative"
      style={{ rotateX: springRotateX, rotateY: springRotateY, transformPerspective: 1000 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
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
    </motion.div>
  );
}

function HeroAurora(): React.ReactElement {
  const reducedMotion = useReducedMotion();
  const blobs = [
    { className: 'bg-indigo-600 -top-20 -left-20 w-[36rem] h-[36rem]', duration: 18, x: [0, 50, 0], y: [0, 30, 0] },
    { className: 'bg-purple-600 top-0 -right-32 w-[32rem] h-[32rem]', duration: 22, x: [0, -40, 0], y: [0, 50, 0] },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10" aria-hidden="true">
      {blobs.map((blob, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full blur-3xl opacity-30 ${blob.className}`}
          animate={reducedMotion ? undefined : { x: blob.x, y: blob.y }}
          transition={reducedMotion ? undefined : { duration: blob.duration, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

function ScrollNavbar(): React.ReactElement {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(latest > 24);
  });

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-40 transition-colors duration-300 ${
        scrolled ? 'bg-slate-950/80 backdrop-blur-sm border-b border-slate-800' : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">D</span>
          </div>
          <h1 className="text-2xl font-bold text-white">DriftLock</h1>
        </div>

        <div className="hidden sm:flex items-center gap-8">
          <a href="#features" className="relative group text-sm font-medium text-slate-300 hover:text-white transition-colors">
            Features
            <span className="absolute left-0 -bottom-1 h-px w-0 bg-indigo-400 transition-all duration-300 group-hover:w-full" />
          </a>
        </div>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
          <Link
            href="/dashboard"
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-indigo-500/40 transition-shadow duration-300"
          >
            Dashboard
          </Link>
        </motion.div>
      </div>
    </nav>
  );
}

export default function Home(): React.ReactElement {
  const reducedMotion = useReducedMotion();
  const statsRef = useRef<HTMLDivElement>(null);
  const statsInView = useInView(statsRef, { once: true, margin: '-80px' });

  return (
    <main className="min-h-screen bg-slate-950 overflow-hidden">
      <ScrollNavbar />

      {/* Hero Section */}
      <section className="relative max-w-6xl mx-auto px-6 lg:px-8 pt-32 pb-20 lg:pt-40 lg:pb-32">
        <HeroAurora />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <div className="space-y-4">
              <motion.div
                initial={reducedMotion ? undefined : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600/20 rounded-full border border-indigo-500/30"
              >
                <motion.span
                  animate={reducedMotion ? undefined : { scale: [1, 1.15, 1] }}
                  transition={reducedMotion ? undefined : { duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Zap size={16} className="text-indigo-400" />
                </motion.span>
                <span className="text-sm font-medium text-indigo-300">Production-ready selector repairs</span>
              </motion.div>

              <AnimatedHeadline />

              <motion.p
                initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3, ease: EASE_OUT }}
                className="text-lg text-slate-400 max-w-lg"
              >
                When websites redesign, your selectors break. DriftLock automatically detects changes and repairs
                them in real-time, so you never miss a scrape.
              </motion.p>
            </div>

            {/* CTA Buttons */}
            <motion.div
              initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.42, ease: EASE_OUT }}
              className="flex flex-col sm:flex-row gap-4 pt-4"
            >
              <motion.div
                whileHover={reducedMotion ? undefined : { scale: 1.05 }}
                whileTap={reducedMotion ? undefined : { scale: 0.95 }}
                animate={reducedMotion ? undefined : { boxShadow: ['0 0 0px rgba(99,102,241,0)', '0 0 24px rgba(99,102,241,0.35)', '0 0 0px rgba(99,102,241,0)'] }}
                transition={reducedMotion ? undefined : { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                className="rounded-lg"
              >
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-medium rounded-lg"
                >
                  Get Started
                  <ArrowRight size={18} />
                </Link>
              </motion.div>
              <motion.a
                href="#features"
                whileHover={reducedMotion ? undefined : { scale: 1.03 }}
                whileTap={reducedMotion ? undefined : { scale: 0.97 }}
                className="inline-flex items-center justify-center px-8 py-3.5 border border-slate-700 text-slate-300 font-medium rounded-lg hover:bg-slate-900/50 hover:border-slate-600 transition-colors duration-300"
              >
                Learn More
              </motion.a>
            </motion.div>

            {/* Stats */}
            <div ref={statsRef} className="grid grid-cols-3 gap-4 pt-8 border-t border-slate-800">
              <div>
                <p className="text-2xl font-bold text-white">
                  <CountUp value={99.9} suffix="%" decimals={1} start={statsInView} />
                </p>
                <p className="text-xs text-slate-400 mt-1">Uptime</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  &lt;<CountUp value={100} suffix="ms" start={statsInView} />
                </p>
                <p className="text-xs text-slate-400 mt-1">Repair Time</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  <CountUp value={5} suffix="M+" start={statsInView} />
                </p>
                <p className="text-xs text-slate-400 mt-1">Selectors Monitored</p>
              </div>
            </div>
          </div>

          {/* Right Visual */}
          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: EASE_OUT }}
          >
            <TiltCard />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-6xl mx-auto px-6 lg:px-8 py-20">
        <motion.div
          initial={reducedMotion ? undefined : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
          className="text-center mb-16"
        >
          <h3 className="text-4xl font-bold text-white mb-4">Why DriftLock?</h3>
          <p className="text-lg text-slate-400">Powerful features to keep your scraper resilient</p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
        >
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_OUT } },
                }}
                whileHover={reducedMotion ? undefined : { y: -6 }}
                className="group bg-slate-900 border border-slate-800 rounded-xl p-8 hover:border-slate-700 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-indigo-600/20 rounded-lg flex items-center justify-center text-indigo-400 mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                  <Icon size={24} />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">{feature.title}</h4>
                <p className="text-slate-400">{feature.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* Footer CTA */}
      <section className="relative max-w-6xl mx-auto px-6 lg:px-8 py-24 border-t border-slate-800 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-indigo-600/10 bg-[length:200%_100%] animate-shimmer" />
        <motion.div
          initial={reducedMotion ? undefined : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
          className="text-center"
        >
          <h3 className="text-3xl font-bold text-white mb-4">Ready to get started?</h3>
          <p className="text-slate-400 mb-8">Start monitoring and repairing selectors in seconds</p>
          <motion.div
            className="inline-block"
            whileHover={reducedMotion ? undefined : { scale: 1.08 }}
            whileTap={reducedMotion ? undefined : { scale: 0.95 }}
          >
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-medium rounded-lg hover:shadow-xl hover:shadow-indigo-500/50 transition-shadow duration-300"
            >
              Enter Dashboard
              <ArrowRight size={18} />
            </Link>
          </motion.div>
        </motion.div>
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
