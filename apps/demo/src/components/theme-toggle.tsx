'use client';

import { RiMoonLine, RiSunLine } from 'react-icons/ri';
import { cn } from '../lib/cn';
import { IconButton } from './ui/icon-button';
import styles from './theme-toggle.module.css';

export function ThemeToggle() {
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
      onClick={toggleTheme}>
      <RiSunLine
        className={cn(styles.themeIcon, styles['themeIcon--sun'])}
        aria-hidden="true"
      />
      <RiMoonLine
        className={cn(styles.themeIcon, styles['themeIcon--moon'])}
        aria-hidden="true"
      />
    </IconButton>
  );
}
