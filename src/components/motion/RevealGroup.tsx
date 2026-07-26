'use client';

import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { cn } from '@/utils/Helpers';

type RevealGroupProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Observes a container and reveals all `.rpp-reveal` children with CSS stagger.
 */
export const RevealGroup = ({ children, className }: RevealGroupProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) {
      return;
    }

    const items = Array.from(root.querySelectorAll<HTMLElement>('.rpp-reveal'));

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      items.forEach(item => item.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -6% 0px' },
    );

    items.forEach(item => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn('rpp-stagger', className)}>
      {children}
    </div>
  );
};
