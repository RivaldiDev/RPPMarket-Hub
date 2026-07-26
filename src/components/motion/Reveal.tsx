'use client';

import type { CSSProperties, ReactNode, Ref } from 'react';
import { useEffect, useRef } from 'react';
import { cn } from '@/utils/Helpers';

type RevealProps = {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'article';
  delayMs?: number;
};

/**
 * Scroll reveal using IntersectionObserver.
 * CSS handles the motion; JS only toggles visibility once.
 */
export const Reveal = ({
  children,
  className,
  as = 'div',
  delayMs = 0,
}: RevealProps) => {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      node.classList.add('is-visible');
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          node.classList.add('is-visible');
          observer.unobserve(node);
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const style: CSSProperties | undefined = delayMs
    ? ({ ['--reveal-delay' as string]: `${delayMs}ms` } as CSSProperties)
    : undefined;
  const classes = cn('rpp-reveal', className);
  const setRef = (node: HTMLElement | null) => {
    ref.current = node;
  };

  if (as === 'section') {
    return (
      <section ref={setRef as Ref<HTMLElement>} className={classes} style={style}>
        {children}
      </section>
    );
  }

  if (as === 'li') {
    return (
      <li ref={setRef as Ref<HTMLLIElement>} className={classes} style={style}>
        {children}
      </li>
    );
  }

  if (as === 'article') {
    return (
      <article ref={setRef as Ref<HTMLElement>} className={classes} style={style}>
        {children}
      </article>
    );
  }

  return (
    <div ref={setRef as Ref<HTMLDivElement>} className={classes} style={style}>
      {children}
    </div>
  );
};
