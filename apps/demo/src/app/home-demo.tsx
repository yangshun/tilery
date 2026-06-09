'use client';

import { useRef } from 'react';
import { useInView } from 'motion/react';
import { Example as IdeExample } from '../content/examples/ide/example';
import { cn } from '../lib/cn';

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
    <div
      ref={ref}
      className={cn(
        'h-[min(620px,56vw)] min-h-[440px] max-lg:h-[420px] max-lg:min-h-[420px]',
        className,
      )}>
      {inView ? (
        <IdeExample key={resetKey} />
      ) : (
        <div className="grid h-full place-items-center font-mono text-site-muted">
          Loading interactive preview…
        </div>
      )}
    </div>
  );
}
