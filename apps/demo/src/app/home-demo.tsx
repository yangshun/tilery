'use client';

import { useRef } from 'react';
import { useInView } from 'motion/react';
import { Example as IdeExample } from '../content/examples/ide/example';

// The real, fully-interactive Tilery IDE example. Mounting it sets up portals,
// pointer-drag controllers and resize handles, so we defer the work until the
// demo frame nears the viewport instead of doing it on first paint (where it
// would compete with the hero boot animation). Until then we show the existing
// mono placeholder.
export function LiveIdeDemo({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '300px' });

  return (
    <div
      ref={ref}
      className={['home-demo__viewport', className].filter(Boolean).join(' ')}>
      {inView ? (
        <IdeExample />
      ) : (
        <div className="home-demo__placeholder">Loading interactive preview…</div>
      )}
    </div>
  );
}
