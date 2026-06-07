'use client';

import { RiArrowDownSLine } from 'react-icons/ri';
import { cn } from '../../lib/cn';

export type SelectOption = { value: string; label: string };

export type SelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
};

export function Select({
  value,
  onChange,
  options,
  disabled,
  ariaLabel,
  className,
}: SelectProps) {
  return (
    <div className={cn('playground-select-wrap', className)}>
      <select
        className="playground-select"
        aria-label={ariaLabel}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <RiArrowDownSLine
        className="playground-select__icon"
        aria-hidden="true"
      />
    </div>
  );
}
