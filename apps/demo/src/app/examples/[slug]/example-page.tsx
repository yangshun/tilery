'use client';

import { useEffect, useState } from 'react';
import {
  BasicExample,
  IdeExample,
  DashboardExample,
  CollapseExample,
  ControlledExample,
  PersistenceExample,
  NestedExample,
} from '../../../content/examples';

const registry: Record<string, React.ComponentType> = {
  basic: BasicExample,
  ide: IdeExample,
  dashboard: DashboardExample,
  collapse: CollapseExample,
  controlled: ControlledExample,
  persistence: PersistenceExample,
  nested: NestedExample,
};

export function ExamplePage({
  slug,
  title,
  sourceHtml,
}: {
  slug: string;
  title: string;
  sourceHtml: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const Component = registry[slug];
  if (!Component) return <div>Example not found</div>;

  return (
    <div className="example-preview">
      <h1>{title}</h1>
      <div className="example-preview__demo">
        {mounted ? <Component /> : null}
      </div>
      <div
        className="example-preview__source"
        dangerouslySetInnerHTML={{ __html: sourceHtml }}
      />
    </div>
  );
}
