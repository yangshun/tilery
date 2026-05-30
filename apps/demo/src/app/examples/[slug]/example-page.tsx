'use client';

import { ExamplePreview } from '../../../components/example-preview';
import {
  BasicExample,
  IdeExample,
  DashboardExample,
  ControlledExample,
  PersistenceExample,
  NestedExample,
} from '../../../content/examples';

const registry: Record<string, React.ComponentType> = {
  basic: BasicExample,
  ide: IdeExample,
  dashboard: DashboardExample,
  controlled: ControlledExample,
  persistence: PersistenceExample,
  nested: NestedExample,
};

export function ExamplePage({
  slug,
  title,
  source,
}: {
  slug: string;
  title: string;
  source: string;
}) {
  const Component = registry[slug];
  if (!Component) return <div>Example not found</div>;

  return (
    <ExamplePreview title={title} source={source}>
      <Component />
    </ExamplePreview>
  );
}
