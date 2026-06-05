'use client';

import { RiMoonLine, RiSunLine } from 'react-icons/ri';

// Which icon shows is driven purely by the `data-theme` attribute in CSS, so
// this renders identically on the server and client (no hydration mismatch and
// no icon flash). The click handler flips the attribute and persists the choice.
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
    <button
      type="button"
      className="site-icon-button sidebar__icon-button sidebar__theme-toggle"
      aria-label="Toggle color theme"
      title="Toggle color theme"
      onClick={toggleTheme}>
      <RiSunLine
        className="sidebar__theme-icon sidebar__theme-icon--sun"
        aria-hidden="true"
      />
      <RiMoonLine
        className="sidebar__theme-icon sidebar__theme-icon--moon"
        aria-hidden="true"
      />
    </button>
  );
}
