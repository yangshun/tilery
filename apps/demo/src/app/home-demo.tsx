'use client';

import { useEffect, useState } from 'react';
import { Example as IdeExample } from '../content/examples/ide/example';

export function HomeDemo() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="home-demo__shell">
      <div className="home-demo__viewport">
        {mounted ? (
          <IdeExample />
        ) : (
          <div className="home-demo__placeholder">
            Loading interactive preview...
          </div>
        )}
      </div>
    </div>
  );
}
