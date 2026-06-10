import type { Metadata } from 'next';
import { HomeContent } from './home/home-content';

export const metadata: Metadata = {
  title: {
    absolute: 'Tilery',
  },
  description:
    'Build IDE-like tiled interfaces with draggable tabs, resizable panels, preserved React state, and programmable workspaces.',
};

export default function Home() {
  return <HomeContent />;
}
