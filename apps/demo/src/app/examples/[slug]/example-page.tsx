'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PageNavigation } from '../../../components/page-navigation';
import type { SiteNavigationItem } from '../../../content/navigation';
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
  OverflowExample,
  TabOverflowExample,
  ControlledExample,
  PanelApiExample,
  TabApiExample,
  WorkflowApiExample,
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
  overflow: { default: OverflowExample, 'tab-overflow': TabOverflowExample },
  controlled: {
    default: ControlledExample,
    'panel-objects': PanelApiExample,
    'tab-objects': TabApiExample,
    'tab-workflows': WorkflowApiExample,
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
  guide,
  demos,
  navigation,
}: {
  slug: string;
  title: string;
  description: string;
  guide: {
    paragraphs: string[];
    readNext: Array<{
      href: string;
      label: string;
      description: string;
    }>;
  };
  demos: Array<{ id: string; sourceHtml: string }>;
  navigation: {
    previous: SiteNavigationItem | null;
    next: SiteNavigationItem | null;
  };
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const components = registry[slug];
  if (!components) return <div>Example not found</div>;

  return (
    <div className="example-preview">
      <h1>{title}</h1>
      <p className="example-preview__description">{description}</p>
      <div className="example-preview__guide">
        <div className="example-preview__copy">
          {guide.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <nav
          aria-label="Related documentation"
          className="example-preview__read-next">
          <span>Read next:</span>
          <ul className="example-preview__links">
            {guide.readNext.map((link, index) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
                {index < guide.readNext.length - 1 ? (
                  <span aria-hidden="true">,</span>
                ) : null}
              </li>
            ))}
          </ul>
        </nav>
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
      <PageNavigation previous={navigation.previous} next={navigation.next} />
    </div>
  );
}
