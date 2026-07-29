'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helpText?: string;
}

export function FormField({ label, error, helpText, id, className = '', ...props }: FormFieldProps): React.ReactElement {
  const fieldId = id || props.name;

  return (
    <div>
      <label htmlFor={fieldId} className="block text-sm font-bold text-white mb-1.5">
        {label}
      </label>
      <input
        id={fieldId}
        className={`input-field w-full ${error ? '!border-red-500 focus:!ring-red-500/20' : ''} ${className}`}
        aria-invalid={!!error}
        {...props}
      />
      {helpText && !error && <p className="text-xs text-slate-500 mt-1.5">{helpText}</p>}
      <AnimatePresence initial={false}>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.2 }}
            className="text-xs text-red-400 mt-1.5 overflow-hidden"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
