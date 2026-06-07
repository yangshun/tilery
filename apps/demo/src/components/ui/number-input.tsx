'use client';

import { useState, type ChangeEvent } from 'react';
import { Input } from './input';

export type NumberInputProps = {
  value: number | '';
  onChange: (value: number | null) => void;
  placeholder?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  ariaLabel?: string;
};

export function NumberInput({
  value,
  onChange,
  placeholder,
  disabled,
  min = 0,
  max,
  ariaLabel,
}: NumberInputProps) {
  // Render a string so the input can hold an empty value (the public value is
  // number | ''; the parent receives number | null when cleared).
  const [draft, setDraft] = useState<string>(value === '' ? '' : String(value));

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.value;
    setDraft(next);
    if (next === '') {
      onChange(null);
      return;
    }
    const parsed = Number(next);
    if (!Number.isNaN(parsed)) {
      onChange(parsed);
    }
  }

  return (
    <Input
      type="number"
      aria-label={ariaLabel}
      value={draft}
      placeholder={placeholder}
      disabled={disabled}
      min={min}
      max={max}
      onChange={handleChange}
    />
  );
}
