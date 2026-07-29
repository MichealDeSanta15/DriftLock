import { useReducedMotion as useReducedMotionFM, type Variants, type Transition } from 'framer-motion';

export const EASE_OUT: Transition['ease'] = [0.16, 1, 0.3, 1];

export const SPRING_SNAPPY: Transition = { type: 'spring', stiffness: 400, damping: 30 };

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, ease: EASE_OUT } },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE_OUT } },
};

export const slideDown: Variants = {
  hidden: { opacity: 0, y: -16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: EASE_OUT } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: EASE_OUT } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15, ease: 'easeIn' } },
};

export const collapseOut: Variants = {
  visible: { opacity: 1, height: 'auto', scale: 1 },
  exit: {
    opacity: 0,
    height: 0,
    scale: 0.96,
    marginBottom: 0,
    transition: { duration: 0.25, ease: EASE_OUT },
  },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 60, scale: 0.95 },
  visible: { opacity: 1, x: 0, scale: 1, transition: SPRING_SNAPPY },
  exit: { opacity: 0, x: 60, transition: { duration: 0.2, ease: 'easeIn' } },
};

export function staggerContainer(staggerChildren = 0.08, delayChildren = 0): Variants {
  return {
    hidden: {},
    visible: {
      transition: { staggerChildren, delayChildren },
    },
  };
}

/** Re-export so components don't need to import framer-motion directly for this. */
export function useReducedMotion(): boolean {
  return !!useReducedMotionFM();
}

/** Strips transforms/duration from a variants object when the user prefers reduced motion. */
export function withReducedMotion(variants: Variants, reduced: boolean): Variants {
  if (!reduced) return variants;

  const stripped: Variants = {};
  for (const key of Object.keys(variants)) {
    const value = variants[key];
    if (value && typeof value === 'object') {
      stripped[key] = { ...(value as Record<string, unknown>), transition: { duration: 0.01 } };
    } else {
      stripped[key] = value;
    }
  }
  return stripped;
}

export const hoverLift = { y: -4, transition: { duration: 0.2, ease: EASE_OUT } };
export const hoverScale = { scale: 1.05, transition: { duration: 0.18, ease: EASE_OUT } };
export const pressScale = { scale: 0.97 };
