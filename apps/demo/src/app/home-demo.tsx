'use client';

import { useRef } from 'react';
import { useInView } from 'motion/react';
import { Example as IdeExample } from '../content/examples/ide/example';

// The real, fully-interactive Tilery IDE example. Mounting it sets up portals,
// pointer-drag controllers and resize handles, so we defer the work until the
// demo frame nears the viewport instead of doing it on first paint. Changing
// `resetKey` remounts the example, restoring its default layout.
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
      className={['home-demo__viewport', className].filter(Boolean).join(' ')}>
      {inView ? (
        <IdeExample key={resetKey} />
      ) : (
        <div className="home-demo__placeholder">
          Loading interactive preview…
        </div>
      )}
    </div>
  );
}
