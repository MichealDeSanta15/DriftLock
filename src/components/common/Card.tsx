'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  hover?: boolean;
  className?: string;
  onClick?: () => void;
}

export function Card({
  children,
  hover = false,
  className = '',
  onClick,
}: CardProps): React.ReactElement {
  const baseClasses = 'bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden';
  const hoverClasses = hover
    ? 'transition-all duration-300 hover:border-slate-700 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 cursor-pointer'
    : '';

  return (
    <div className={`${baseClasses} ${hoverClasses} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}
