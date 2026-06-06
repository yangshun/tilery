'use client';

import { useEffect, useState } from 'react';
import { Menu } from '@base-ui-components/react/menu';
import { RiPaletteLine } from 'react-icons/ri';

const ACCENTS = [
  { id: 'red', label: 'Red' },
  { id: 'orange', label: 'Orange' },
  { id: 'amber', label: 'Amber' },
  { id: 'lime', label: 'Lime' },
  { id: 'teal', label: 'Teal' },
  { id: 'sky', label: 'Sky' },
  { id: 'purple', label: 'Purple' },
  { id: 'white', label: 'White' },
] as const;

type AccentId = (typeof ACCENTS)[number]['id'];

const STORAGE_KEY = 'tilery-accent';

function isAccentId(value: string | undefined | null): value is AccentId {
  return ACCENTS.some((accent) => accent.id === value);
}

export function AccentSelector() {
  const [accent, setAccent] = useState<AccentId>('lime');

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
        className="site-icon-button accent-picker__trigger"
        aria-label={`Accent color: ${current.label.toLowerCase()}`}
        title={`Accent color: ${current.label.toLowerCase()}`}>
        <RiPaletteLine
          className="accent-picker__trigger-icon"
          aria-hidden="true"
        />
        <span
          className={`accent-picker__trigger-dot accent-picker__swatch--${current.id}`}
          aria-hidden="true"
        />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={8}>
          <Menu.Popup>
            <Menu.RadioGroup className="accent-picker__menu" value={accent} onValueChange={chooseAccent}>
              {ACCENTS.map((option) => (
                <Menu.RadioItem
                  key={option.id}
                  value={option.id}
                  className={`accent-picker__swatch accent-picker__swatch--${option.id}`}
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
