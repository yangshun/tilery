'use client';

import { useRef } from 'react';
import { Tilery } from '@tilery/react';
import type {
  TileryHandle,
  TileryInitialLayout,
  TileryPanelHandle,
  TileryTabHandle,
} from '@tilery/react';
import { ExampleSection, ExampleStack, TabContent } from '../example-ui';

type TabData = { title: string; body: string };

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

export function Example() {
  return (
    <ExampleStack rows="minmax(0, 1fr) minmax(0, 1fr)">
      <PanelMenuExample />
      <NewTabExample />
    </ExampleStack>
  );
}

// source-region panel-menu
export function PanelMenuExample() {
  return (
    <ExampleSection
      title="Panel menu"
      description="Use built-in split/fullscreen commands and add app-specific menu items.">
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
    </ExampleSection>
  );
}
// end-source-region panel-menu

// source-region new-tab
export function NewTabExample() {
  const newTabCounterRef = useRef(0);
  const tileryRef = useRef<TileryHandle | null>(null);

  return (
    <ExampleSection
      title="New-tab hook"
      description="Choose which panels expose the plus button and return the tab data from onNewTab.">
      <Tilery<TabData>
        ref={tileryRef as React.Ref<TileryHandle>}
        initialLayout={newTabLayout}
        showNewTabButton={(panel) => panel.id === 'drafts'}
        onNewTab={(panel: TileryPanelHandle) => {
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
    </ExampleSection>
  );
}
// end-source-region new-tab

function renderHeader(tab: TileryTabHandle<TabData>) {
  return <span>{tab.data.title}</span>;
}

function renderContent(tab: TileryTabHandle<TabData>) {
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
