'use client';

import React, { useEffect, useRef, useState } from 'react';
import { animate } from 'framer-motion';
import { useReducedMotion } from '@/lib/motion';

interface CountUpProps {
  value: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  start?: boolean;
}

export function CountUp({
  value,
  duration = 1.2,
  suffix = '',
  prefix = '',
  decimals = 0,
  start = true,
}: CountUpProps): React.ReactElement {
  const [display, setDisplay] = useState(0);
  const reducedMotion = useReducedMotion();
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!start) return;

    if (reducedMotion) {
      setDisplay(value);
      return;
    }

    if (hasAnimated.current && display === value) return;
    hasAnimated.current = true;

    const controls = animate(display, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplay(latest),
    });

    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, start, reducedMotion]);

  return (
    <>
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </>
  );
}
