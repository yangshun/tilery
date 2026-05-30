'use client';

import { useEffect, useState } from 'react';
import { CodeBlock } from './code-block';

export function ExamplePreview({
  children,
  source,
  title,
}: {
  children: React.ReactNode;
  source: string;
  title: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="example-preview">
      <h1>{title}</h1>
      <div className="example-preview__demo">
        {mounted ? children : null}
      </div>
      <div className="example-preview__source">
        <CodeBlock code={source} />
      </div>
    </div>
  );
}
