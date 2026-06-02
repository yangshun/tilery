'use client';

import { useEffect, useState } from 'react';
import {
  BasicExample,
  IdeExample,
  DashboardExample,
  AbyssSpacedThemeExample,
  AbyssThemeExample,
  DraculaThemeExample,
  LightThemeExample,
  PillTabsThemeExample,
  ReplitThemeExample,
  ThemesExample,
  VisualStudioThemeExample,
  PanelActionsExample,
  PanelMenuExample,
  NewTabExample,
  ConstraintsExample,
  PanelConstraintsExample,
  ContainerResizeExample,
  PanelLockingExample,
  TabLockingExample,
  InitialTabLocksExample,
  RuntimeTabBehaviorExample,
  ControlledExample,
  PanelApiExample,
  TabApiExample,
  FloatingExample,
  InitialFloatingExample,
  NativePopoutExample,
  PopoutStylingExample,
  RuntimeFloatingExample,
  TabFloatingExample,
  PersistenceExample,
  LocalStorageExample,
  SnapshotControlsExample,
  CallbacksExample,
  StructuralCallbacksExample,
  ResizeCallbacksExample,
  NestedExample,
} from '../../../content/examples';

const registry: Record<string, Record<string, React.ComponentType>> = {
  basic: { default: BasicExample },
  ide: { default: IdeExample },
  dashboard: { default: DashboardExample },
  themes: {
    default: ThemesExample,
    abyss: AbyssThemeExample,
    'visual-studio': VisualStudioThemeExample,
    dracula: DraculaThemeExample,
    light: LightThemeExample,
    replit: ReplitThemeExample,
    'abyss-spaced': AbyssSpacedThemeExample,
    'pill-tabs': PillTabsThemeExample,
  },
  collapse: {
    default: PanelActionsExample,
    'panel-menu': PanelMenuExample,
    'new-tab': NewTabExample,
  },
  constraints: {
    default: ConstraintsExample,
    'panel-constraints': PanelConstraintsExample,
    'container-resize': ContainerResizeExample,
  },
  'panel-locking': { default: PanelLockingExample },
  'tab-locking': {
    default: TabLockingExample,
    'initial-locks': InitialTabLocksExample,
    'runtime-behavior': RuntimeTabBehaviorExample,
  },
  controlled: {
    default: ControlledExample,
    'panel-handles': PanelApiExample,
    'tab-handles': TabApiExample,
  },
  floating: {
    default: FloatingExample,
    'initial-floating': InitialFloatingExample,
    'runtime-floating': RuntimeFloatingExample,
    'tab-floating': TabFloatingExample,
    'native-popout': NativePopoutExample,
    'popout-styling': PopoutStylingExample,
  },
  persistence: {
    default: PersistenceExample,
    'local-storage': LocalStorageExample,
    'snapshot-controls': SnapshotControlsExample,
  },
  callbacks: {
    default: CallbacksExample,
    structural: StructuralCallbacksExample,
    resize: ResizeCallbacksExample,
  },
  nested: { default: NestedExample },
};

export function ExamplePage({
  slug,
  title,
  description,
  notes,
  demos,
}: {
  slug: string;
  title: string;
  description: string;
  notes: string[];
  demos: Array<{ id: string; sourceHtml: string }>;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const components = registry[slug];
  if (!components) return <div>Example not found</div>;

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
      <div className="example-preview__demos">
        {demos.map((demo) => {
          const Component = components[demo.id] ?? components.default;
          if (!Component) return null;
          const isDefaultDemo = demos.length === 1 && demo.id === 'default';

          return (
            <section key={demo.id} className="example-preview__case">
              <div
                className={
                  isDefaultDemo
                    ? 'example-preview__demo-surface example-preview__demo-surface--boxed'
                    : 'example-preview__demo-surface'
                }>
                {mounted ? <Component /> : null}
              </div>
              <div
                className="example-preview__source"
                dangerouslySetInnerHTML={{ __html: demo.sourceHtml }}
              />
            </section>
          );
        })}
      </div>
    </div>
  );
}
