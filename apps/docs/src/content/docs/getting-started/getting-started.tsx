import { Tilery } from '@tileryjs/react';
import '@tileryjs/react/style.css';
import type { TileryInitialLayout } from '@tileryjs/react';

type MyTab = { title: string };

const layout: TileryInitialLayout<MyTab> = {
  type: 'group',
  direction: 'horizontal',
  children: [
    {
      type: 'panel',
      id: 'left',
      size: 50,
      tabs: [{ id: 'a', data: { title: 'Panel A' } }],
    },
    {
      type: 'panel',
      id: 'right',
      size: 50,
      tabs: [{ id: 'b', data: { title: 'Panel B' } }],
    },
  ],
};

export function App() {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <Tilery
        initialLayout={layout}
        renderTabHeader={(tab) => <span>{tab.data.title}</span>}
        renderTabContent={(tab) => <div>{tab.data.title} content</div>}
      />
    </div>
  );
}
