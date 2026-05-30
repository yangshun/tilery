'use client';

import { useParams } from 'next/navigation';
import { ExamplePreview } from '../../../components/example-preview';
import {
  examples,
  BasicExample,
  basicSource,
  IdeExample,
  ideSource,
  DashboardExample,
  dashboardSource,
  ControlledExample,
  controlledSource,
  PersistenceExample,
  persistenceSource,
  NestedExample,
  nestedSource,
} from '../../../content/examples';

const registry: Record<
  string,
  { Component: React.ComponentType; source: string }
> = {
  basic: { Component: BasicExample, source: basicSource },
  ide: { Component: IdeExample, source: ideSource },
  dashboard: { Component: DashboardExample, source: dashboardSource },
  controlled: { Component: ControlledExample, source: controlledSource },
  persistence: { Component: PersistenceExample, source: persistenceSource },
  nested: { Component: NestedExample, source: nestedSource },
};

export default function ExamplePage() {
  const { slug } = useParams<{ slug: string }>();
  const meta = examples.find((e) => e.slug === slug);
  const entry = registry[slug];

  if (!meta || !entry) {
    return <div>Example not found</div>;
  }

  const { Component, source } = entry;

  return (
    <ExamplePreview title={meta.title} source={source}>
      <Component />
    </ExamplePreview>
  );
}
