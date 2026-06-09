'use client';

import { useEffect, useState } from 'react';
import { Menu } from '@base-ui-components/react/menu';
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
          className="absolute right-[5px] bottom-[5px] size-[9px] rounded-full border border-site-bg shadow-[0_0_0_1px_rgba(255,255,255,0.4)] light:border-[rgba(15,23,42,0.32)] light:shadow-[0_0_0_1px_rgba(15,23,42,0.32)]"
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
                    'border border-[rgba(255,255,255,0.4)] light:border-[rgba(15,23,42,0.32)]',
                    'shadow-[0_0_0_2px_transparent] transition-[border-color,box-shadow,transform] duration-150 ease-in-out',
                    'hover:translate-y-[-1px]',
                    'data-[checked]:border-site-fg data-[checked]:shadow-[0_0_0_2px_var(--site-bg),0_0_0_4px_rgba(255,255,255,0.54)]',
                    'light:data-[checked]:border-[#111827] light:data-[checked]:shadow-[0_0_0_2px_#fff,0_0_0_4px_rgba(15,23,42,0.42)]',
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
