'use client';

import { useEffect, useState, type ReactNode } from 'react';

/**
 * Defers rendering a live demo until after hydration. Tilery measures the DOM
 * on mount, so rendering it during SSR risks markup mismatches; this gate keeps
 * the server output empty and renders the demo only on the client.
 */
export function DemoMount({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return <>{mounted ? children : null}</>;
}
