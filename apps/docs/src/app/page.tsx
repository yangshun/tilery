import type { Metadata } from 'next';
import { HomeContent } from './home/home-content';

export const metadata: Metadata = {
  title: {
    absolute: 'Tilery',
  },
  description:
    'Build flexible interfaces that split, resize, and rearrange with draggable tabs, persistent layouts, and a programmable core.',
};

export default function Home() {
  return <HomeContent />;
}
