import { Tilery } from '@tileryjs/react';
import type { TileryInitialLayout, TileryTab } from '@tileryjs/react';

type TabData = {
  title: string;
  href?: string;
};

const layout: TileryInitialLayout<TabData> = {
  type: 'group',
  direction: 'horizontal',
  children: [
    {
      type: 'panel',
      id: 'left',
      size: 50,
      tabs: [{ id: 'a', data: { title: 'Panel A' } }],
    },
  ],
};

function Editor({ tab }: { tab: TileryTab<TabData> }) {
  return <div>{tab.data.title}</div>;
}

export function Basic() {
  return (
    // source-region basic
    <Tilery
      initialLayout={layout}
      renderTabHeader={(tab) => <span>{tab.data.title}</span>}
      renderTabContent={(tab) => <Editor tab={tab} />}
    />
    // end-source-region basic
  );
}

export function TabTrigger() {
  return (
    // source-region tab-trigger
    <Tilery<TabData>
      initialLayout={layout}
      renderTabHeader={(tab) => <span>{tab.data.title}</span>}
      renderTabTrigger={({ tab, props, children }) =>
        tab.data.href ? (
          <a href={tab.data.href} {...props}>
            {children}
          </a>
        ) : (
          <div {...props}>{children}</div>
        )
      }
      renderTabContent={(tab) => <Editor tab={tab} />}
    />
    // end-source-region tab-trigger
  );
}
