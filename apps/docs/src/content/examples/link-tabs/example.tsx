'use client';

import { Tilery } from '@tilery/react';
import type { TileryInitialLayout, TileryTab } from '@tilery/react';
import { ExampleSection, ExampleStack, TabContent } from '../example-ui';

type TabData = {
  title: string;
  href: string;
  body: string;
};

// source-region link-tabs-layout
const layout: TileryInitialLayout<TabData> = {
  type: 'panel',
  id: 'routes',
  activeTabId: 'overview',
  tabs: [
    {
      id: 'overview',
      closable: false,
      data: {
        title: 'Overview',
        href: '/workspace/overview',
        body: 'This tab renders as an anchor while still using Tilery activation and drag behavior.',
      },
    },
    {
      id: 'settings',
      data: {
        title: 'Settings',
        href: '/workspace/settings',
        body: 'The close button remains a sibling of the anchor trigger, so the markup stays valid.',
      },
    },
    {
      id: 'reports',
      data: {
        title: 'Reports',
        href: '/workspace/reports',
        body: 'Router-link components can use the same slot by spreading Tilery props onto the link.',
      },
    },
  ],
};
// end-source-region link-tabs-layout

export function Example() {
  return (
    <ExampleStack>
      <LinkTabsExample />
    </ExampleStack>
  );
}

export function LinkTabsExample() {
  return (
    <ExampleSection
      title="Link tabs"
      description="Render tab triggers as anchors while keeping link metadata in tab data.">
      {/* source-region link-tabs-tilery */}
      <Tilery<TabData>
        initialLayout={layout}
        renderTabHeader={(tab: TileryTab<TabData>) => (
          <span>{tab.data.title}</span>
        )}
        renderTabTrigger={({ tab, props, children }) => (
          <a
            href={tab.data.href}
            {...props}
            onClick={(event) => event.preventDefault()}>
            {children}
          </a>
        )}
        renderTabContent={(tab: TileryTab<TabData>) => (
          <TabContent meta={tab.data.href}>
            <p style={{ margin: '0 0 12px' }}>{tab.data.body}</p>
            <p style={{ margin: 0 }}>
              The href belongs to the tab data. Tilery only supplies trigger
              props for selection, accessibility, and drag behavior.
            </p>
          </TabContent>
        )}
      />
      {/* end-source-region link-tabs-tilery */}
    </ExampleSection>
  );
}
