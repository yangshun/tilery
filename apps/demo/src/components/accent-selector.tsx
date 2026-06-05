'use client';

import { useEffect, useId, useRef, useState } from 'react';
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
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const current = document.documentElement.dataset.accent;
    if (isAccentId(current)) setAccent(current);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    function closeOnOutsidePointer(event: PointerEvent) {
      if (!pickerRef.current?.contains(event.target as Node)) setIsOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false);
    }

    document.addEventListener('pointerdown', closeOnOutsidePointer);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

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
    <div
      ref={pickerRef}
      className="accent-picker"
      role="group"
      aria-label="Accent color">
      <button
        type="button"
        className="site-icon-button accent-picker__trigger"
        aria-label={`Accent color: ${current.label}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        title={`Accent color: ${current.label}`}
        onClick={() => setIsOpen((open) => !open)}>
        <RiPaletteLine
          className="accent-picker__trigger-icon"
          aria-hidden="true"
        />
        <span
          className={`accent-picker__trigger-dot accent-picker__swatch--${current.id}`}
          aria-hidden="true"
        />
      </button>
      {isOpen ? (
        <div id={menuId} className="accent-picker__menu" role="menu">
          {ACCENTS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`accent-picker__swatch accent-picker__swatch--${option.id}`}
              aria-label={`Use ${option.label} accent color`}
              aria-checked={accent === option.id}
              role="menuitemradio"
              title={option.label}
              onClick={() => chooseAccent(option.id)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
