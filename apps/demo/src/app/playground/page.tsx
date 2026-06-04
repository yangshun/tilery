import type { Metadata } from 'next';
import { PlaygroundApp } from './playground-app';

export const metadata: Metadata = {
  title: 'Playground',
  description:
    'Build a Tilery workspace and try every panel and tab feature live — add panels and tabs, lock, float, pop out, resize, theme, and persist.',
};

export default function PlaygroundPage() {
  return (
    <div className="playground-page">
      <PlaygroundApp />
    </div>
  );
}
