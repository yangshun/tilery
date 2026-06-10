'use client';

import { RiMoonLine, RiSunLine } from 'react-icons/ri';
import { IconButton } from './ui/icon-button';

export function ThemeToggle({ className }: { className?: string }) {
  function toggleTheme() {
    const root = document.documentElement;
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.dataset.theme = next;
    try {
      localStorage.setItem('tilery-theme', next);
    } catch {
      // Ignore storage failures (private mode, disabled storage).
    }
  }

  return (
    <IconButton
      aria-label="Toggle color theme"
      title="Toggle color theme"
      className={className}
      onClick={toggleTheme}>
      <RiSunLine className="inline-flex light:hidden" aria-hidden="true" />
      <RiMoonLine className="hidden light:inline-flex" aria-hidden="true" />
    </IconButton>
  );
}
