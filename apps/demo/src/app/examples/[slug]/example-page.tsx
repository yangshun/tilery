'use client';

import { useEffect, useState } from 'react';
import {
  BasicExample,
  IdeExample,
  DashboardExample,
  PanelActionsExample,
  ConstraintsExample,
  TabLockingExample,
  ControlledExample,
  PersistenceExample,
  CallbacksExample,
  NestedExample,
} from '../../../content/examples';

const registry: Record<string, React.ComponentType> = {
  basic: BasicExample,
  ide: IdeExample,
  dashboard: DashboardExample,
  collapse: PanelActionsExample,
  constraints: ConstraintsExample,
  'tab-locking': TabLockingExample,
  controlled: ControlledExample,
  persistence: PersistenceExample,
  callbacks: CallbacksExample,
  nested: NestedExample,
};

export function ExamplePage({
  slug,
  title,
  description,
  notes,
  sourceHtml,
}: {
  slug: string;
  title: string;
  description: string;
  notes: string[];
  sourceHtml: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const Component = registry[slug];
  if (!Component) return <div>Example not found</div>;

  return (
    <div className="example-preview">
      <h1>{title}</h1>
      <p className="example-preview__description">{description}</p>
      <div className="example-preview__notes">
        <h2>What This Shows</h2>
        <ul>
          {notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>
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
