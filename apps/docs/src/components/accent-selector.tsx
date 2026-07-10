'use client';

import { useEffect, useState } from 'react';
import { Menu } from '@base-ui/react/menu';
import { RiPaletteLine } from 'react-icons/ri';
import { cn } from '../lib/cn';
import { ICON_BUTTON_BASE } from './ui/icon-button';
import {
  ACCENTS,
  DEFAULT_ACCENT,
  STORAGE_KEY,
  isAccentId,
  type AccentId,
} from '../content/accents';

const SWATCH_COLORS: Record<string, string> = {
  lime: '#a3e635',
  teal: '#2dd4bf',
  sky: '#38bdf8',
  red: '#ff2d2d',
  orange: '#f97316',
  purple: '#a855f7',
  amber: '#fbbf24',
  white: '#f8fafc',
};

export function AccentSelector({ className }: { className?: string }) {
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
        className={cn(
          ICON_BUTTON_BASE,
          className,
          'relative data-[popup-open]:bg-site-overlay data-[popup-open]:text-site-fg',
        )}
        aria-label={`Accent color: ${current.label.toLowerCase()}`}
        title={`Accent color: ${current.label.toLowerCase()}`}>
        <RiPaletteLine className="inline-flex" aria-hidden="true" />
        <span
          className="absolute right-1.5 bottom-1.5 size-2.5 rounded-full border border-site-bg ring-1 ring-white/40 light:border-slate-900/30 light:ring-slate-900/30"
          style={{ background: SWATCH_COLORS[current.id] }}
          aria-hidden="true"
        />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={8}>
          <Menu.Popup>
            <Menu.RadioGroup
              className="z-40 grid grid-cols-[repeat(4,24px)] gap-2 p-2.5 border border-site-shell-border rounded-lg bg-site-bg shadow-[var(--site-shadow)]"
              value={accent}
              onValueChange={chooseAccent}>
              {ACCENTS.map((option) => (
                <Menu.RadioItem
                  key={option.id}
                  value={option.id}
                  className={cn(
                    'size-6 p-0 rounded-full cursor-pointer',
                    'border border-white/40 light:border-slate-900/30',
                    'ring-2 ring-transparent transition duration-150 ease-in-out',
                    'hover:-translate-y-px',
                    'data-[checked]:border-site-fg data-[checked]:shadow-[0_0_0_2px_var(--site-bg),0_0_0_4px_rgba(255,255,255,0.54)]',
                    'light:data-[checked]:border-gray-900 light:data-[checked]:shadow-none light:data-[checked]:ring-2 light:data-[checked]:ring-slate-900/40 light:data-[checked]:ring-offset-2 light:data-[checked]:ring-offset-white',
                  )}
                  style={{ background: SWATCH_COLORS[option.id] }}
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
