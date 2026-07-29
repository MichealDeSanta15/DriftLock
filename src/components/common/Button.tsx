'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';
import { Check } from 'lucide-react';
import { useReducedMotion } from '@/lib/motion';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

type NativeButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'
>;

interface ButtonProps extends NativeButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  loading?: boolean;
  /** Briefly shows a checkmark in place of the icon — e.g. right after a successful save. */
  success?: boolean;
  /** Increment this to trigger a brief shake — e.g. after a failed submit. */
  errorPulse?: number;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  success = false,
  errorPulse,
  disabled = false,
  children,
  className = '',
  ...props
}: ButtonProps): React.ReactElement {
  const reducedMotion = useReducedMotion();
  const controls = useAnimationControls();

  useEffect(() => {
    if (!errorPulse || reducedMotion) return;
    controls.start({
      x: [0, -6, 6, -4, 4, 0],
      transition: { duration: 0.4, ease: 'easeInOut' },
    });
  }, [errorPulse, controls, reducedMotion]);

  const variantClasses = {
    primary: 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:shadow-lg hover:shadow-indigo-500/40',
    secondary: 'border border-slate-700 text-slate-200 hover:bg-slate-900/50 hover:border-slate-600',
    danger: 'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/40',
    ghost: 'text-slate-300 hover:text-white hover:bg-slate-800/50',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const isDisabled = disabled || loading;

  return (
    <motion.button
      disabled={isDisabled}
      animate={controls}
      whileHover={!isDisabled && !reducedMotion ? { scale: 1.05 } : undefined}
      whileTap={!isDisabled && !reducedMotion ? { scale: 0.97 } : undefined}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className={`inline-flex items-center gap-2 font-medium rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      <AnimatePresence mode="wait" initial={false}>
        {success ? (
          <motion.span
            key="success"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex"
          >
            <Check size={16} />
          </motion.span>
        ) : loading ? (
          <motion.span
            key="spinner"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
          />
        ) : icon ? (
          <motion.span
            key="icon"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className="inline-flex"
          >
            {icon}
          </motion.span>
        ) : null}
      </AnimatePresence>
      {children}
    </motion.button>
  );
}
