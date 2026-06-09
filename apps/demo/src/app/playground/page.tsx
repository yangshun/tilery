import type { Metadata } from 'next';
import { PlaygroundApp } from './playground-app';

export const metadata: Metadata = {
  title: 'Playground',
  description:
    'Build a Tilery workspace and try every panel and tab feature live — add panels and tabs, lock, float, pop out, resize, theme, and persist.',
};

export default function PlaygroundPage() {
  return (
    <div className="playground-page m-0 max-w-none p-2.5 h-dvh min-h-0 flex gap-2.5 bg-site-bg max-lg:flex-col">
      <PlaygroundApp />
    </div>
  );
}
