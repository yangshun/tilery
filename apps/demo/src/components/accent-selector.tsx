'use client';

import { useEffect, useState } from 'react';
import { Menu } from '@base-ui-components/react/menu';
import { RiPaletteLine } from 'react-icons/ri';
import { cn } from '../lib/cn';
import {
  ACCENTS,
  DEFAULT_ACCENT,
  STORAGE_KEY,
  isAccentId,
  type AccentId,
} from '../content/accents';
import styles from './accent-selector.module.css';

export function AccentSelector() {
  const [accent, setAccent] = useState<AccentId>(DEFAULT_ACCENT);

  useEffect(() => {
    const current = document.documentElement.dataset.accent;
    if (isAccentId(current)) setAccent(current);
  }, []);

  function chooseAccent(next: AccentId) {
    document.documentElement.dataset.accent = next;
    setAccent(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore storage failures (private mode, disabled storage).
    }
  }

  const current = ACCENTS.find((option) => option.id === accent) ?? ACCENTS[0];

  return (
    <Menu.Root modal={false}>
      <Menu.Trigger
        className={styles.trigger}
        aria-label={`Accent color: ${current.label.toLowerCase()}`}
        title={`Accent color: ${current.label.toLowerCase()}`}>
        <RiPaletteLine className={styles.triggerIcon} aria-hidden="true" />
        <span
          className={cn(styles.triggerDot, styles[`swatch--${current.id}`])}
          aria-hidden="true"
        />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={8}>
          <Menu.Popup>
            <Menu.RadioGroup
              className={styles.menu}
              value={accent}
              onValueChange={chooseAccent}>
              {ACCENTS.map((option) => (
                <Menu.RadioItem
                  key={option.id}
                  value={option.id}
                  className={cn(styles.swatch, styles[`swatch--${option.id}`])}
                  aria-label={`Use ${option.label.toLowerCase()} accent color`}
                  title={option.label}
                />
              ))}
            </Menu.RadioGroup>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
