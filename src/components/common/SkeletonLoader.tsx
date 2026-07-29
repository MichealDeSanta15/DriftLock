'use client';

import React from 'react';

interface SkeletonLoaderProps {
  type: 'table-row' | 'card' | 'text' | 'button' | 'title';
  count?: number;
}

export function SkeletonLoader({ type, count = 1 }: SkeletonLoaderProps): React.ReactElement {
  const skeletons = Array.from({ length: count });

  switch (type) {
    case 'table-row':
      return (
        <div className="space-y-4">
          {skeletons.map((_, i) => (
            <div
              key={i}
              className="h-16 bg-gradient-to-r from-gray-200 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded animate-pulse"
            />
          ))}
        </div>
      );

    case 'card':
      return (
        <div className="space-y-4">
          {skeletons.map((_, i) => (
            <div
              key={i}
              className="rounded-lg bg-gradient-to-r from-gray-200 to-gray-100 dark:from-gray-700 dark:to-gray-600 p-6 animate-pulse"
            >
              <div className="h-6 bg-gray-300 dark:bg-gray-500 rounded mb-4" />
              <div className="h-4 bg-gray-300 dark:bg-gray-500 rounded w-3/4" />
            </div>
          ))}
        </div>
      );

    case 'text':
      return (
        <div className="space-y-3">
          {skeletons.map((_, i) => (
            <div
              key={i}
              className="h-4 bg-gradient-to-r from-gray-200 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded animate-pulse w-full"
            />
          ))}
        </div>
      );

    case 'button':
      return (
        <div className="h-10 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-600 dark:to-gray-500 rounded-lg animate-pulse" />
      );

    case 'title':
      return (
        <div className="h-8 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-600 dark:to-gray-500 rounded animate-pulse w-1/3" />
      );

    default:
      return <div />;
  }
}
