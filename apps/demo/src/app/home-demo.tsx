'use client';

import { useRef } from 'react';
import { useInView } from 'motion/react';
import { Example as IdeExample } from '../content/examples/ide/example';
import { cn } from '../lib/cn';
import styles from './home/home-demo.module.css';

export function LiveIdeDemo({
  className,
  resetKey = 0,
}: {
  className?: string;
  resetKey?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '300px' });

  return (
    <div ref={ref} className={cn(styles.demoViewport, className)}>
      {inView ? (
        <IdeExample key={resetKey} />
      ) : (
        <div className={styles.demoPlaceholder}>
          Loading interactive preview…
        </div>
      )}
    </div>
  );
}
