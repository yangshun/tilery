'use client';

import { useRef } from 'react';
import { Tilery } from '@tileryjs/react';
import type {
  TileryController,
  TileryInitialLayout,
  TileryPanel,
  TileryTab,
} from '@tileryjs/react';
import { ExampleSection, ExampleStack, TabContent } from '../example-ui';

type TabData = { title: string; body: string };

// source-region panel-menu-layout
const actionsLayout: TileryInitialLayout<TabData> = {
  type: 'group',
  direction: 'horizontal',
  children: [
    {
      type: 'panel',
      id: 'explorer',
      size: 30,
      tabs: [
        {
          id: 'files',
          data: {
            title: 'Files',
            body: 'Project files, outlines, and search results live here.',
          },
        },
      ],
    },
    {
      type: 'group',
      direction: 'vertical',
      size: 70,
      children: [
        {
          type: 'panel',
          id: 'editor',
          size: 62,
          tabs: [
            {
              id: 'readme',
              data: {
                title: 'README.md',
                body: 'The editor menu includes one app-defined command.',
              },
            },
            {
              id: 'notes',
              data: {
                title: 'Notes',
                body: 'Built-in actions stay available beside custom commands.',
              },
            },
          ],
        },
        {
          type: 'panel',
          id: 'terminal',
          size: 38,
          tabs: [
            {
              id: 'shell',
              data: {
                title: 'Terminal',
                body: '$ pnpm test',
              },
            },
          ],
        },
      ],
    },
  ],
};
// end-source-region panel-menu-layout

// source-region new-tab-layout
const newTabLayout: TileryInitialLayout<TabData> = {
  type: 'group',
  direction: 'horizontal',
  children: [
    {
      type: 'panel',
      id: 'drafts',
      size: 55,
      tabs: [
        {
          id: 'draft-0',
          data: {
            title: 'Draft 0',
            body: 'The plus button asks the host app for a new tab object.',
          },
        },
      ],
    },
    {
      type: 'panel',
      id: 'reference',
      size: 45,
      tabs: [
        {
          id: 'api',
          data: {
            title: 'API Notes',
            body: 'The reference panel does not show the new-tab affordance.',
          },
        },
      ],
    },
  ],
};
// end-source-region new-tab-layout

export function Example() {
  return (
    <ExampleStack rows="minmax(0, 1fr) minmax(0, 1fr)">
      <PanelMenuExample />
      <NewTabExample />
    </ExampleStack>
  );
}

export function PanelMenuExample() {
  return (
    <ExampleSection
      title="Panel menu"
      description="Use built-in split/fullscreen commands and add app-specific menu items.">
      {/* source-region panel-menu-tilery */}
      <Tilery<TabData>
        initialLayout={actionsLayout}
        showActionsButton={true}
        renderActionsButtonIcon={EllipsisIcon}
        renderPanelActions={(panel, ctx) =>
          panel.id === 'editor' ? (
            <button
              type="button"
              className="tilery__panel-menu-item"
              onClick={() => {
                panel.setActiveTab('readme');
                ctx.closeMenu();
              }}>
              Focus README
            </button>
          ) : null
        }
        renderTabHeader={renderHeader}
        renderTabContent={renderContent}
      />
      {/* end-source-region panel-menu-tilery */}
    </ExampleSection>
  );
}

export function NewTabExample() {
  // source-region new-tab-controller
  const newTabCounterRef = useRef(0);
  const tileryRef = useRef<TileryController | null>(null);
  // end-source-region new-tab-controller

  return (
    <ExampleSection
      title="New-tab hook"
      description="Choose which panels expose the plus button and return the tab data from onNewTab.">
      {/* source-region new-tab-tilery */}
      <Tilery<TabData>
        ref={tileryRef as React.Ref<TileryController>}
        initialLayout={newTabLayout}
        showNewTabButton={(panel) => panel.id === 'drafts'}
        onNewTab={(panel: TileryPanel) => {
          newTabCounterRef.current += 1;
          return {
            id: `${panel.id}-${newTabCounterRef.current}`,
            data: {
              title: `Draft ${newTabCounterRef.current}`,
              body: 'This tab was supplied by the host application.',
            },
          };
        }}
        renderTabHeader={renderHeader}
        renderTabContent={renderContent}
      />
      {/* end-source-region new-tab-tilery */}
    </ExampleSection>
  );
}

function renderHeader(tab: TileryTab<TabData>) {
  return <span>{tab.data.title}</span>;
}

function renderContent(tab: TileryTab<TabData>) {
  return (
    <TabContent>
      <p style={{ margin: 0 }}>{tab.data.body}</p>
    </TabContent>
  );
}

function EllipsisIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false">
      <circle cx="4" cy="8" r="1.3" fill="currentColor" />
      <circle cx="8" cy="8" r="1.3" fill="currentColor" />
      <circle cx="12" cy="8" r="1.3" fill="currentColor" />
    </svg>
  );
}
